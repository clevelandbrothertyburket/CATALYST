import { requireUser } from '@/lib/auth';
import { approveRequest, rejectRequest } from '@/lib/domain';

export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
  const auth = await requireUser('approver');
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });

  const { decision, note } = await req.json().catch(() => ({}));
  let result;
  if (decision === 'approve') {
    result = await approveRequest({ requestId: params.id, approver: auth.user, decisionNote: note });
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
