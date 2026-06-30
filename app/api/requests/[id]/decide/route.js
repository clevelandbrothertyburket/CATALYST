import { requireUser } from '@/lib/auth';
import { approveRequest, rejectRequest } from '@/lib/domain';
import { clickupConfigured, createCodeRequestTask } from '@/lib/clickup';

export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
  const auth = await requireUser('approver');
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });

  const { decision, note } = await req.json().catch(() => ({}));
  let result;
  if (decision === 'approve') {
    result = await approveRequest({ requestId: params.id, approver: auth.user, decisionNote: note });
    // On approval, create a ClickUp task (best-effort — never block the approval).
    if (!result.error && clickupConfigured()) {
      try {
        const appUrl = process.env.APP_URL || new URL(req.url).origin;
        const t = await createCodeRequestTask({ code: result.code, campName: result.campName, businessUnit: result.businessUnit, initiative: result.initiative, requestedBy: result.requestedBy, appUrl });
        result.clickup = { ok: true, url: t.url };
      } catch (e) { result.clickup = { ok: false, error: String(e.message || e) }; }
    }
  } else if (decision === 'reject') {
    result = await rejectRequest({ requestId: params.id, approver: auth.user, decisionNote: note, changesOnly: false });
  } else if (decision === 'changes') {
    result = await rejectRequest({ requestId: params.id, approver: auth.user, decisionNote: note, changesOnly: true });
  } else {
    return Response.json({ error: 'decision must be approve | reject | changes' }, { status: 400 });
  }
  if (result.error) return Response.json({ error: result.error }, { status: result.status });
  return Response.json(result);
}
