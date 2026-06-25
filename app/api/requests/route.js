import { sql } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { requestCode } from '@/lib/domain';

export const dynamic = 'force-dynamic';

// List approval requests. Approvers/admins see all; users see their own.
export async function GET(req) {
  const auth = await requireUser('user');
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  const isApprover = ['approver', 'admin'].includes(auth.user.role);
  let rows;
  if (isApprover) {
    rows = status
      ? await sql`SELECT * FROM approval_requests WHERE status=${status} ORDER BY requested_at DESC`
      : await sql`SELECT * FROM approval_requests ORDER BY requested_at DESC`;
  } else {
    rows = await sql`SELECT * FROM approval_requests WHERE requested_by=${auth.user.name} ORDER BY requested_at DESC`;
  }
  return Response.json({ requests: rows });
}

// Any signed-in user can propose a new code.
export async function POST(req) {
  const auth = await requireUser('user');
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => ({}));
  const { dept, bu, init, camp, campName, note } = body;
  const result = await requestCode({
    proposed: { dept, bu, init, camp: (camp || '').trim().toLowerCase(), campName: (campName || '').trim() },
    note,
    requester: auth.user,
  });
  if (result.error) return Response.json({ error: result.error }, { status: result.status });
  return Response.json(result);
}
