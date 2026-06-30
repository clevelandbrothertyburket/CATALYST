import { requireUser } from '@/lib/auth';
import { clickupConfigured, getAuthedUser, getList, discoverLists, getRecentTasks, createCodeRequestTask } from '@/lib/clickup';

export const dynamic = 'force-dynamic';

// GET /api/clickup/test — admin-only ClickUp connectivity check.
// Confirms the token works (GET /user) and the list id is valid (GET /list/{id}),
// without ever returning the secret token.
export async function GET(req) {
  const auth = await requireUser('admin');
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });

  const out = {
    tokenPresent: Boolean(process.env.CLICKUP_TOKEN || process.env.CLICKUP_API_KEY),
    listIdPresent: Boolean(process.env.CLICKUP_LIST_ID),
    configured: clickupConfigured(),
  };

  try { out.user = await getAuthedUser(); }
  catch (e) { out.userError = String(e && e.message || e); out.userStatus = e && e.status; }

  try { out.list = await getList(); }
  catch (e) { out.listError = String(e && e.message || e); out.listStatus = e && e.status; }

  if (!out.listError) {
    try { out.recentTasks = await getRecentTasks(); }
    catch (e) { out.recentTasksError = String(e && e.message || e); }
  }

  // If the configured list id is missing/invalid, enumerate all lists so we can pick the right one.
  if (out.listError || new URL(req.url).searchParams.get('lists') === '1') {
    try { out.availableLists = await discoverLists(); }
    catch (e) { out.discoverError = String(e && e.message || e); }
  }

  return Response.json(out);
}
