import { sql } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { bitlyConfigured, bitlyAnalytics } from '@/lib/bitly';

export const dynamic = 'force-dynamic';

// GET /api/hub/bitly?id=<cb_short_links.id>
// Returns Bitly's tracking for a link, so users see it inside Catalyst.
export async function GET(req) {
  const auth = await requireUser('user');
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });
  if (!bitlyConfigured()) return Response.json({ configured: false });

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return Response.json({ error: 'id required' }, { status: 400 });

  const rows = await sql`SELECT bitly_id, bitly_link FROM cb_short_links WHERE id = ${id} LIMIT 1`;
  if (!rows.length) return Response.json({ error: 'Link not found' }, { status: 404 });
  const { bitly_id } = rows[0];
  if (!bitly_id) return Response.json({ configured: true, linked: false });

  try {
    const data = await bitlyAnalytics(bitly_id);
    return Response.json({ configured: true, linked: true, ...data });
  } catch (e) {
    return Response.json({ configured: true, linked: true, error: String(e && e.message || e) }, { status: 200 });
  }
}
