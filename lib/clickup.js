// ClickUp integration — creates a task when a campaign code request is approved.
// Auth: the personal token (pk_...) goes RAW in the Authorization header — no
// "Bearer" prefix — per ClickUp's API. The pk_ prefix is lowercase/case-sensitive.
//
// Env:
//   CLICKUP_TOKEN       – personal API token (pk_...). (CLICKUP_API_KEY also accepted.)
//   CLICKUP_LIST_ID     – numeric List id that tasks are created in.
//   CLICKUP_ASSIGNEE_ID – override the default assignee (Ty Burket). Optional.
//   CLICKUP_SPRINT_TAG  – override the sprint tag (default "current sprint"). Optional.
//   APP_URL             – Catalyst base URL, used in the task description link.

const CLICKUP_API = 'https://api.clickup.com/api/v2';

// Cleveland Brothers — Marketing team user IDs (from the ClickUp handoff).
const USERS = {
  tyBurket: 87419010,      // Marketing Intern (default assignee for code requests)
  chrisLauffer: 81440323,  // Digital Marketing Manager
  calebLay: 81504348,      // Construction product manager
  craigCarlin: 81566743,   // P&E product manager
  kelleySloyer: 75372630,  // Marketing Director
};

const token = () => process.env.CLICKUP_TOKEN || process.env.CLICKUP_API_KEY;

export function clickupConfigured() {
  return Boolean(token() && process.env.CLICKUP_LIST_ID);
}

async function clickup(path, { method = 'GET', body } = {}) {
  const key = token();
  if (!key) throw new Error('ClickUp not configured (set CLICKUP_TOKEN).');
  const res = await fetch(CLICKUP_API + path, {
    method,
    headers: { Authorization: key, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data && (data.err || data.error || data.ECODE)) || ('ClickUp error ' + res.status);
    const err = new Error(msg);
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

// ---- diagnostics (used by /api/clickup/test) ----
export async function getAuthedUser() {
  const d = await clickup('/user');
  return d.user ? { id: d.user.id, username: d.user.username, email: d.user.email } : d;
}
export async function getList(listId) {
  const id = listId || process.env.CLICKUP_LIST_ID;
  const d = await clickup('/list/' + id);
  return { id: d.id, name: d.name, space: d.space && d.space.name, folder: d.folder && d.folder.name };
}

// Read custom fields available on a list (e.g. an 'Initiative' dropdown).
export async function getListFields(listId) {
  const id = listId || process.env.CLICKUP_LIST_ID;
  const d = await clickup('/list/' + id + '/field');
  return (d.fields || []).map((f) => ({
    id: f.id, name: f.name, type: f.type,
    options: ((f.type_config && f.type_config.options) || []).map((o) => ({ id: o.id, name: o.name !== undefined ? o.name : o.label })),
  }));
}

// Read recent tasks in a list (verification): confirms tasks actually land.
export async function getRecentTasks(listId, limit = 10) {
  const id = listId || process.env.CLICKUP_LIST_ID;
  // Only tasks created in the last 3 hours, newest first — proves fresh creates land.
  const since = Date.now() - 3 * 60 * 60 * 1000;
  const d = await clickup('/list/' + id + '/task?order_by=created&reverse=true&subtasks=false&date_created_gt=' + since);
  return (d.tasks || []).slice(0, limit).map((t) => ({
    name: t.name,
    assignees: (t.assignees || []).map((a) => a.username),
    tags: (t.tags || []).map((tg) => tg.name),
    due_date: t.due_date ? new Date(Number(t.due_date)).toISOString().slice(0, 10) : null,
    url: t.url,
  }));
}

// Walk Workspace -> Space -> Folder -> List so we can see every list id available.
// Used by the diagnostic to find/verify the right CLICKUP_LIST_ID.
export async function discoverLists() {
  const out = [];
  const teams = (await clickup('/team')).teams || [];
  for (const team of teams) {
    const spaces = (await clickup('/team/' + team.id + '/space').catch(() => ({}))).spaces || [];
    for (const space of spaces) {
      const fl = (await clickup('/space/' + space.id + '/list').catch(() => ({}))).lists || [];
      for (const l of fl) out.push({ id: l.id, name: l.name, path: team.name + ' / ' + space.name });
      const folders = (await clickup('/space/' + space.id + '/folder').catch(() => ({}))).folders || [];
      for (const folder of folders) {
        for (const l of (folder.lists || [])) out.push({ id: l.id, name: l.name, path: team.name + ' / ' + space.name + ' / ' + folder.name });
      }
    }
  }
  return out;
}

function pmFor(businessUnit) {
  const s = (businessUnit || '').toLowerCase();
  if (s.includes('construction')) return 'Caleb Lay';
  if (s.includes('engine') || s.includes('p&e') || s.includes('power')) return 'Craig Carlin';
  return 'TBD';
}

// Create the approval task in ClickUp.
//   Title:    "<code> – Request For Approval"   (e.g. "m-e-re-pow – Request For Approval")
//   Assignee: Ty Burket (87419010), overridable via CLICKUP_ASSIGNEE_ID
//   Tags:     adhoc, current sprint
//   Due date: one week out
export async function createCodeRequestTask({ code, campName, businessUnit, initiative, requestedBy, appUrl }) {
  const listId = process.env.CLICKUP_LIST_ID;
  if (!clickupConfigured()) throw new Error('ClickUp not configured (set CLICKUP_TOKEN and CLICKUP_LIST_ID).');

  // 'Ad Hoc' is an initiative (represented by the Ad Hoc Tasks list), NOT a tag —
  // so we only apply the sprint tag here.
  const sprintTag = (process.env.CLICKUP_SPRINT_TAG || 'current sprint').toLowerCase();
  const tags = [sprintTag];
  const assignees = [Number(process.env.CLICKUP_ASSIGNEE_ID) || USERS.tyBurket];
  const dueDate = Date.now() + 7 * 24 * 60 * 60 * 1000; // one week out (ms epoch)

  const description = [
    'Campaign code request approved in Catalyst — needs review/setup.',
    '',
    'Requested code: ' + code,
    'Campaign: ' + campName,
    'Division / business unit: ' + businessUnit,
    'Requested by: ' + requestedBy,
    'Product Manager: ' + pmFor(businessUnit),
    '',
    'Open in Catalyst: ' + (appUrl || ''),
  ].join('\n');

  // Create the task WITHOUT tags first — a tag that doesn't yet exist at the
  // space level would otherwise make ClickUp reject the whole request. The core
  // requirement is that the task always lands, assigned to the right person.
  const data = await clickup('/list/' + listId + '/task', {
    method: 'POST',
    body: {
      name: code + ' – Request For Approval',
      description,
      assignees,
      due_date: dueDate,
      due_date_time: false,
    },
  });

  // Attach tags best-effort (creates the association; ignore individual failures).
  for (const t of tags) {
    await clickup('/task/' + data.id + '/tag/' + encodeURIComponent(t), { method: 'POST' }).catch(() => {});
  }

  // Set the Initiative + Business Unit dropdown custom fields by matching the
  // request's values to the list's options (best-effort; skip if no clean match).
  const fieldResult = {};
  try {
    const fields = await getListFields(listId);
    const norm = (x) => String(x || '').toLowerCase().replace(/division/g, '').replace(/[^a-z0-9& ]/g, ' ').replace(/\s+/g, ' ').trim();
    const setField = async (fieldName, value) => {
      if (!value) return;
      const f = fields.find((x) => x.name.toLowerCase() === fieldName.toLowerCase() && x.type === 'drop_down');
      if (!f) return;
      const nv = norm(value);
      const opt = f.options.find((o) => norm(o.name) === nv)
        || f.options.find((o) => nv && (norm(o.name).includes(nv) || nv.includes(norm(o.name))));
      if (opt) {
        await clickup('/task/' + data.id + '/field/' + f.id, { method: 'POST', body: { value: opt.id } });
        fieldResult[fieldName] = opt.name;
      } else {
        fieldResult[fieldName] = null; // no clean match — left blank
      }
    };
    await setField('Business Unit', businessUnit);
    await setField('Initiative', initiative);
  } catch (e) { fieldResult.error = String(e && e.message || e); }

  return { id: data.id, url: data.url, fields: fieldResult };
}
