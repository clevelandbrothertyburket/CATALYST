import { sql } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const auth = await requireUser('approver');
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });
  const { searchParams } = new URL(req.url);
  const entity = searchParams.get('entity');
  const entityId = searchParams.get('entityId');

  let rows;
  if (entity && entityId) {
    rows = await sql`SELECT * FROM audit_log WHERE entity=${entity} AND entity_id=${entityId} ORDER BY created_at DESC LIMIT 500`;
  } else if (entity) {
    rows = await sql`SELECT * FROM audit_log WHERE entity=${entity} ORDER BY created_at DESC LIMIT 500`;
  } else {
    rows = await sql`SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 500`;
  }
  return Response.json({ events: rows });
}
