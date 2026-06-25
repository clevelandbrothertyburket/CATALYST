import { requireUser } from '@/lib/auth';
import { changeCodeStatus } from '@/lib/domain';

export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
  const auth = await requireUser('approver');
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });

  const { to } = await req.json().catch(() => ({}));
  if (!to) return Response.json({ error: 'Target status required' }, { status: 400 });

  const result = await changeCodeStatus({ codeId: params.id, to, actor: auth.user });
  if (result.error) return Response.json({ error: result.error }, { status: result.status });
  return Response.json(result);
}
