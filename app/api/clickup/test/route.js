import { requireUser } from '@/lib/auth';
import { clickupConfigured, getAuthedUser, getList } from '@/lib/clickup';

export const dynamic = 'force-dynamic';

// GET /api/clickup/test — admin-only ClickUp connectivity check.
// Confirms the token works (GET /user) and the list id is valid (GET /list/{id}),
// without ever returning the secret token.
export async function GET() {
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

  return Response.json(out);
}
