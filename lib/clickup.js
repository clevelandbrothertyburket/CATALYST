// ClickUp integration — creates a task when a campaign code request is approved.
// Configure in the server env:
//   CLICKUP_API_KEY     – personal API token (pk_...)
//   CLICKUP_LIST_ID     – the List tasks are created in (from the list URL)
//   CLICKUP_ASSIGNEE_ID – Chris Lauffer's numeric ClickUp user id (assignees are
//                         by id, not name). Optional; task is still created without.
//   CLICKUP_SPRINT_TAG  – tag for the current sprint (optional)
//   APP_URL             – Catalyst base URL, used in the task description link

const CLICKUP_API = 'https://api.clickup.com/api/v2';

export function clickupConfigured() {
  return Boolean(process.env.CLICKUP_API_KEY && process.env.CLICKUP_LIST_ID);
}

// Product manager by division.
function productManager(businessUnit) {
  const bu = (businessUnit || '').toLowerCase();
  if (bu.includes('construction')) return 'Caleb';
  if (bu.includes('engine') || bu.includes('p&e') || bu.includes('power')) return 'Craig';
  return 'TBD';
}

export async function createCodeRequestTask({ code, campName, businessUnit, requestedBy, appUrl }) {
  const key = process.env.CLICKUP_API_KEY;
  const listId = process.env.CLICKUP_LIST_ID;
  if (!key || !listId) throw new Error('ClickUp not configured (set CLICKUP_API_KEY and CLICKUP_LIST_ID).');

  const tags = ['Adhoc'];
  if (process.env.CLICKUP_SPRINT_TAG) tags.push(process.env.CLICKUP_SPRINT_TAG);

  const description = [
    'Campaign code request approved in Catalyst.',
    '',
    `Code: ${code}`,
    `Campaign: ${campName}`,
    `Division: ${businessUnit}`,
    `Requested by: ${requestedBy}`,
    '',
    `Product Manager: ${productManager(businessUnit)}`,
    'Digital Manager: Chris Lauffer',
    'Marketing Lead: Chris Lauffer',
    'Marketing Director: Kelley',
    '',
    `Open in Catalyst: ${appUrl || ''}`,
  ].join('\n');

  const assignees = [];
  if (process.env.CLICKUP_ASSIGNEE_ID) assignees.push(Number(process.env.CLICKUP_ASSIGNEE_ID));

  const res = await fetch(`${CLICKUP_API}/list/${listId}/task`, {
    method: 'POST',
    headers: { Authorization: key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `Campaign Code Request — ${campName}`,
      description,
      tags,
      ...(assignees.length ? { assignees } : {}),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.err || data?.error || `ClickUp task failed (${res.status})`);
  return { id: data.id, url: data.url };
}
