import { sql, newId } from './db.js';

// ---------- Lifecycle state machine ----------
// pending -> active | rejected
// active -> deprecated | retired | archived
// deprecated -> active | retired | archived
// retired -> archived | active (reactivate)
// archived -> (terminal, but admin can restore to active)
export const LIFECYCLE = {
  pending:    ['active', 'rejected'],
  active:     ['deprecated', 'retired', 'archived'],
  deprecated: ['active', 'retired', 'archived'],
  retired:    ['archived', 'active'],
  rejected:   ['pending'],
  archived:   ['active'],
};
export function canTransition(from, to) {
  return (LIFECYCLE[from] || []).includes(to);
}
// Codes usable for building links:
export const USABLE_STATUSES = ['active', 'deprecated'];

// ---------- Code assembly + validation ----------
export function assembleCode({ dept, bu, init, camp }) {
  return [dept, bu, init, camp].join('-');
}

export async function validateProposedCode({ dept, bu, init, camp, campName }) {
  const errors = [];
  if (!dept) errors.push('Department is required.');
  if (!bu) errors.push('Business unit is required.');
  if (!init) errors.push('Initiative is required.');
  if (!camp) errors.push('Campaign code is required.');
  if (camp && !/^[a-z]{2,4}$/.test(camp)) errors.push('Campaign code must be 2–4 lowercase letters.');
  if (!campName || !campName.trim()) errors.push('Campaign name is required.');

  if (errors.length) return { ok: false, errors };

  const code = assembleCode({ dept, bu, init, camp });

  // referential checks
  const dep = await sql`SELECT 1 FROM departments WHERE code=${dept}`;
  if (!dep.length) errors.push(`Unknown department "${dept}".`);
  const buRow = await sql`SELECT 1 FROM business_units WHERE code=${bu}`;
  if (!buRow.length) errors.push(`Unknown business unit "${bu}".`);
  const initRow = await sql`SELECT 1 FROM initiatives WHERE bu_code=${bu} AND code=${init}`;
  if (!initRow.length) errors.push(`Initiative "${init}" is not valid for that business unit.`);

  // duplicate check (any non-archived/rejected existing code)
  const dupe = await sql`SELECT status FROM codes WHERE code=${code}`;
  if (dupe.length) {
    errors.push(`Code ${code} already exists (status: ${dupe[0].status}).`);
  }

  return { ok: errors.length === 0, errors, code };
}

// ---------- Audit ----------
export async function audit({ actor, action, entity, entityId = null, before = null, after = null }) {
  await sql`
    INSERT INTO audit_log (actor, action, entity, entity_id, before, after)
    VALUES (${actor}, ${action}, ${entity}, ${entityId},
            ${before ? JSON.stringify(before) : null}, ${after ? JSON.stringify(after) : null})
  `;
}

// ---------- Operations ----------

// Create an approval request to add a new code.
export async function requestCode({ proposed, note, requester }) {
  const v = await validateProposedCode(proposed);
  if (!v.ok) return { error: v.errors.join(' '), status: 400 };
  const id = newId('req');
  await sql`
    INSERT INTO approval_requests (id, kind, proposed, status, note, requested_by)
    VALUES (${id}, 'create_code', ${JSON.stringify({ ...proposed, code: v.code })}, 'pending', ${note || null}, ${requester.name})
  `;
  await audit({ actor: requester.name, action: 'request.created', entity: 'request', entityId: id, after: { ...proposed, code: v.code } });
  return { id, code: v.code };
}

// Approve a create_code request -> insert the code as active.
export async function approveRequest({ requestId, approver, decisionNote }) {
  const rows = await sql`SELECT * FROM approval_requests WHERE id=${requestId}`;
  if (!rows.length) return { error: 'Request not found', status: 404 };
  const req = rows[0];
  if (req.status !== 'pending') return { error: `Request already ${req.status}`, status: 409 };

  if (req.kind === 'create_code') {
    const p = req.proposed;
    // re-validate at decision time (taxonomy may have changed)
    const v = await validateProposedCode(p);
    if (!v.ok) return { error: 'No longer valid: ' + v.errors.join(' '), status: 409 };
    const dep = await sql`SELECT name FROM departments WHERE code=${p.dept}`;
    const buRow = await sql`SELECT name FROM business_units WHERE code=${p.bu}`;
    const initRow = await sql`SELECT name FROM initiatives WHERE bu_code=${p.bu} AND code=${p.init}`;
    const id = newId('c');
    await sql`
      INSERT INTO codes (id, code, dept, bu, init, camp, camp_name, department, business_unit, initiative, status, created_by)
      VALUES (${id}, ${p.code}, ${p.dept}, ${p.bu}, ${p.init}, ${p.camp}, ${p.campName},
              ${dep[0].name}, ${buRow[0].name}, ${initRow[0].name}, 'active', ${req.requested_by})
    `;
    // ensure campaign vocab learns the new value
    await sql`
      INSERT INTO campaign_vocab (init_code, code, name) VALUES (${p.init}, ${p.camp}, ${p.campName})
      ON CONFLICT (init_code, code) DO NOTHING
    `;
    await sql`
      UPDATE approval_requests SET status='approved', decided_by=${approver.name}, decided_at=now(),
        decision_note=${decisionNote || null}, code_id=${id} WHERE id=${requestId}
    `;
    await audit({ actor: approver.name, action: 'request.approved', entity: 'request', entityId: requestId, after: { code: p.code } });
    await audit({ actor: approver.name, action: 'code.created', entity: 'code', entityId: id, after: { code: p.code, status: 'active' } });
    return { ok: true, codeId: id, code: p.code, campName: p.campName, businessUnit: buRow[0].name, requestedBy: req.requested_by };
  }
  return { error: 'Unsupported request kind', status: 400 };
}

export async function rejectRequest({ requestId, approver, decisionNote, changesOnly }) {
  const rows = await sql`SELECT * FROM approval_requests WHERE id=${requestId}`;
  if (!rows.length) return { error: 'Request not found', status: 404 };
  if (rows[0].status !== 'pending') return { error: `Request already ${rows[0].status}`, status: 409 };
  const newStatus = changesOnly ? 'changes_requested' : 'rejected';
  await sql`
    UPDATE approval_requests SET status=${newStatus}, decided_by=${approver.name}, decided_at=now(),
      decision_note=${decisionNote || null} WHERE id=${requestId}
  `;
  await audit({ actor: approver.name, action: changesOnly ? 'request.changes_requested' : 'request.rejected',
    entity: 'request', entityId: requestId, after: { note: decisionNote } });
  return { ok: true };
}

// Change a code's lifecycle status directly (admin/approver).
export async function changeCodeStatus({ codeId, to, actor }) {
  const rows = await sql`SELECT * FROM codes WHERE id=${codeId}`;
  if (!rows.length) return { error: 'Code not found', status: 404 };
  const from = rows[0].status;
  if (!canTransition(from, to)) return { error: `Cannot move ${from} → ${to}`, status: 400 };
  await sql`UPDATE codes SET status=${to}, updated_at=now() WHERE id=${codeId}`;
  await audit({ actor: actor.name, action: 'code.status_changed', entity: 'code', entityId: codeId,
    before: { status: from }, after: { status: to } });
  return { ok: true, from, to };
}
