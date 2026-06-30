// ClickUp integration — creates a task when a campaign code request is approved.
// Auth: the personal token (pk_...) goes RAW in the Authorization header — no
// "Bearer" prefix — per ClickUp's API.
//
// Env:
//   CLICKUP_TOKEN       – personal API token (pk_...). (CLICKUP_API_KEY also accepted.)
//   CLICKUP_LIST_ID     – the List tasks are created in.
//   CLICKUP_ASSIGNEE_ID – override the default assignee (Chris Lauffer). Optional.
//   CLICKUP_SPRINT_TAG  – override the sprint tag (default "current sprint"). Optional.
//   APP_URL             – Catalyst base URL, used in the task description link.

const CLICKUP_API = 'https://api.clickup.com/api/v2';

// Cleveland Brothers — Marketing team user IDs (from the ClickUp handoff).
const USERS = {
  chrisLauffer: 81440323,  // Digital Marketing Manager (default assignee)
  calebLay: 81504348,      // Construction product manager
  craigCarlin: 81566743,   // P&E product manager
  kelleySloyer: 75372630,  // Marketing Director
};

const token = () => process.env.CLICKUP_TOKEN || process.env.CLICKUP_API_KEY;

export function clickupConfigured() {
  return Boolean(token() && process.env.CLICKUP_LIST_ID);
}

function pmFor(businessUnit) {
  const s = (businessUnit || '').toLowerCase();
  if (s.includes('construction')) return { name: 'Caleb Lay', id: USERS.calebLay };
  if (s.includes('engine') || s.includes('p&e') || s.includes('power')) return { name: 'Craig Carlin', id: USERS.craigCarlin };
  return { name: 'TBD', id: null };
}

export async function createCodeRequestTask({ code, campName, businessUnit, requestedBy, appUrl }) {
  const key = token();
  const listId = process.env.CLICKUP_LIST_ID;
  if (!key || !listId) throw new Error('ClickUp not configured (set CLICKUP_TOKEN and CLICKUP_LIST_ID).');

  // Tags are stored lowercase in ClickUp.
  const sprintTag = (process.env.CLICKUP_SPRINT_TAG || 'current sprint').toLowerCase();
  const tags = ['adhoc', sprintTag];
  if (businessUnit) tags.push(businessUnit.toLowerCase());

  const pm = pmFor(businessUnit);
  const assignees = [Number(process.env.CLICKUP_ASSIGNEE_ID) || USERS.chrisLauffer];

  const description = [
    'Campaign code request approved in Catalyst.',
    '',
    'Code: ' + code,
    'Campaign: ' + campName,
    'Division: ' + businessUnit,
    'Requested by: ' + requestedBy,
    '',
    'Product Manager: ' + pm.name,
    'Digital Manager: Chris Lauffer',
    'Marketing Lead: Chris Lauffer',
    'Marketing Director: Kelley Sloyer',
    '',
    'Open in Catalyst: ' + (appUrl || ''),
  ].join('\n');

  const res = await fetch(CLICKUP_API + '/list/' + listId + '/task', {
    method: 'POST',
    headers: { Authorization: key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Campaign Code Request — ' + campName,
      description,
      tags,
      assignees,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data && (data.err || data.error)) || ('ClickUp task failed (' + res.status + ')'));
  return { id: data.id, url: data.url };
}
