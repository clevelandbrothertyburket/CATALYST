import { requireUser } from '@/lib/auth';
import { deleteCode } from '@/lib/domain';

export const dynamic = 'force-dynamic';

// DELETE /api/codes/{id} — permanently remove a code (approver/admin).
export async function DELETE(req, { params }) {
  const auth = await requireUser('approver');
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });

  const result = await deleteCode({ codeId: params.id, actor: auth.user });
  if (result.error) return Response.json({ error: result.error }, { status: result.status });
  return Response.json(result);
}
