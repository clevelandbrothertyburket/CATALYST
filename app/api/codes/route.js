import { sql } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { USABLE_STATUSES } from '@/lib/domain';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const auth = await requireUser('viewer');
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');     // optional exact status
  const usable = searchParams.get('usable');      // '1' -> only link-usable codes
  const q = (searchParams.get('q') || '').toLowerCase();

  let rows;
  if (usable === '1') {
    rows = await sql`SELECT * FROM codes WHERE status = ANY(${USABLE_STATUSES}) ORDER BY created_at DESC`;
  } else if (status) {
    rows = await sql`SELECT * FROM codes WHERE status=${status} ORDER BY created_at DESC`;
  } else {
    rows = await sql`SELECT * FROM codes ORDER BY created_at DESC`;
  }

  const filtered = q
    ? rows.filter((c) =>
        `${c.code} ${c.camp_name} ${c.business_unit} ${c.initiative} ${c.department}`.toLowerCase().includes(q))
    : rows;

  return Response.json({ codes: filtered });
}
