import { sql, newId } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { audit } from '@/lib/domain';

export const dynamic = 'force-dynamic';

const ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789'; // no ambiguous chars (no l/o/0/1)
const randSlug = (n = 6) => Array.from({ length: n }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('');
const cleanSlug = (s) => String(s || '').toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').slice(0, 40);
const baseUrl = (req) => process.env.APP_URL || new URL(req.url).origin;

// List all short links with their click totals.
export async function GET(req) {
  const auth = await requireUser('user');
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });
  const rows = await sql`
    SELECT l.id, l.slug, l.long_url, l.title, l.created_by, l.created_at,
           count(c.id)::int AS clicks
    FROM cb_short_links l
    LEFT JOIN cb_clicks c ON c.link_id = l.id
    GROUP BY l.id
    ORDER BY l.created_at DESC
  `;
  const base = baseUrl(req);
  return Response.json({ base, links: rows.map((r) => ({ ...r, shortUrl: `${base}/s/${r.slug}` })) });
}

// Create a short link (optional custom back-half).
export async function POST(req) {
  const auth = await requireUser('user');
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });

  const b = await req.json().catch(() => ({}));
  let longUrl = String(b.longUrl || '').trim();
  if (!longUrl) return Response.json({ error: 'A destination URL is required' }, { status: 400 });
  if (!/^https?:\/\//i.test(longUrl)) longUrl = 'https://' + longUrl;
  try { new URL(longUrl); } catch { return Response.json({ error: 'Enter a valid URL' }, { status: 400 }); }
  const title = (b.title || '').trim() || null;

  let slug = b.slug ? cleanSlug(b.slug) : '';
  if (slug) {
    if (slug.length < 2) return Response.json({ error: 'Custom back-half is too short' }, { status: 400 });
    const taken = await sql`SELECT 1 FROM cb_short_links WHERE slug = ${slug}`;
    if (taken.length) return Response.json({ error: 'That custom back-half is already taken' }, { status: 409 });
  } else {
    for (let i = 0; i < 8 && !slug; i++) {
      const cand = randSlug(6);
      const taken = await sql`SELECT 1 FROM cb_short_links WHERE slug = ${cand}`;
      if (!taken.length) slug = cand;
    }
    if (!slug) return Response.json({ error: 'Could not generate a unique link, try again' }, { status: 500 });
  }

  const id = newId('cb');
  await sql`INSERT INTO cb_short_links (id, slug, long_url, title, created_by) VALUES (${id}, ${slug}, ${longUrl}, ${title}, ${auth.user.name})`;
  await audit({ actor: auth.user.name, action: 'shortlink.created', entity: 'short_link', entityId: id, after: { slug, longUrl } });
  return Response.json({ id, slug, long_url: longUrl, title, created_by: auth.user.name, clicks: 0, shortUrl: `${baseUrl(req)}/s/${slug}` });
}

// Delete a short link and its click history (approver/admin).
export async function DELETE(req) {
  const auth = await requireUser('approver');
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return Response.json({ error: 'id required' }, { status: 400 });
  await sql`DELETE FROM cb_clicks WHERE link_id = ${id}`;
  await sql`DELETE FROM cb_short_links WHERE id = ${id}`;
  await audit({ actor: auth.user.name, action: 'shortlink.deleted', entity: 'short_link', entityId: id });
  return Response.json({ ok: true });
}
