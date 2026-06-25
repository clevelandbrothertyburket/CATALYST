import { sql, newId } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { audit } from '@/lib/domain';
import { shorten } from '@/lib/bitly';

export const dynamic = 'force-dynamic';

// List all short links (history).
export async function GET(req) {
  const auth = await requireUser('viewer');
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').toLowerCase();
  const rows = await sql`SELECT * FROM short_links ORDER BY created_at DESC`;
  const filtered = q
    ? rows.filter((r) => `${r.short_url} ${r.long_url} ${r.title || ''}`.toLowerCase().includes(q))
    : rows;
  return Response.json({ shortLinks: filtered });
}

// Create a short link from a long URL (and optionally tie it to a UTM link).
export async function POST(req) {
  const auth = await requireUser('user');
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });

  const { longUrl, title, linkId } = await req.json().catch(() => ({}));
  if (!longUrl) return Response.json({ error: 'A URL is required.' }, { status: 400 });

  let result;
  try {
    result = await shorten(longUrl, { title });
  } catch (e) {
    return Response.json({ error: String(e.message || e) }, { status: 502 });
  }

  const id = newId('s');
  await sql`
    INSERT INTO short_links (id, link_id, long_url, short_url, bitly_id, title, created_by)
    VALUES (${id}, ${linkId || null}, ${longUrl}, ${result.shortUrl}, ${result.bitlyId}, ${title || null}, ${auth.user.name})
  `;
  await audit({ actor: auth.user.name, action: 'shortlink.created', entity: 'short_link', entityId: id, after: { short: result.shortUrl } });
  return Response.json({ id, shortUrl: result.shortUrl, bitlyId: result.bitlyId, longUrl, title: title || null });
}
