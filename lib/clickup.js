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
export async function createCodeRequestTask({ code, campName, businessUnit, requestedBy, appUrl }) {
  const listId = process.env.CLICKUP_LIST_ID;
  if (!clickupConfigured()) throw new Error('ClickUp not configured (set CLICKUP_TOKEN and CLICKUP_LIST_ID).');

  const sprintTag = (process.env.CLICKUP_SPRINT_TAG || 'current sprint').toLowerCase();
  const tags = ['adhoc', sprintTag];
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

  const data = await clickup('/list/' + listId + '/task', {
    method: 'POST',
    body: {
      name: code + ' – Request For Approval',
      description,
      tags,
      assignees,
      due_date: dueDate,
      due_date_time: false,
    },
  });
  return { id: data.id, url: data.url };
}
