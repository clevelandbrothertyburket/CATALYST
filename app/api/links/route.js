import { sql, newId } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { audit, USABLE_STATUSES } from '@/lib/domain';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const auth = await requireUser('viewer');
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').toLowerCase();
  const rows = await sql`SELECT * FROM links ORDER BY created_at DESC`;
  const filtered = q
    ? rows.filter((l) => `${l.code} ${l.title} ${l.url} ${l.medium}`.toLowerCase().includes(q))
    : rows;
  return Response.json({ links: filtered });
}

export async function POST(req) {
  const auth = await requireUser('user');
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });

  const b = await req.json().catch(() => ({}));
  const { codeId, content, medium, title, baseUrl } = b;
  if (!codeId || !content || !medium || !title || !baseUrl)
    return Response.json({ error: 'Missing required fields' }, { status: 400 });

  const codeRows = await sql`SELECT * FROM codes WHERE id=${codeId}`;
  if (!codeRows.length) return Response.json({ error: 'Code not found' }, { status: 404 });
  const c = codeRows[0];
  if (!USABLE_STATUSES.includes(c.status))
    return Response.json({ error: `Code is ${c.status}; only active/deprecated codes can build links.` }, { status: 409 });

  const campaign = 'clevelandbrothers-' + c.code;
  const enc = encodeURIComponent;
  const qs = [
    `utm_content=${enc(content)}`,
    `utm_medium=${enc(medium)}`,
    `utm_campaign=${enc(campaign)}`,
    `utm_term=${enc(title)}`,
  ].join('&');
  const url = baseUrl + (baseUrl.includes('?') ? '&' : '?') + qs;

  // Duplicate detection: the exact same tracked link should not be created twice.
  const dupe = await sql`SELECT id, title, created_by, created_at FROM links WHERE url = ${url} LIMIT 1`;
  if (dupe.length) {
    return Response.json({
      error: `This exact tracked link already exists — built by ${dupe[0].created_by}. Find it in History.`,
      duplicate: true,
      existing: dupe[0],
    }, { status: 409 });
  }

  const id = newId('l');
  await sql`
    INSERT INTO links (id, code, campaign, content, medium, title, base_url, url, created_by)
    VALUES (${id}, ${c.code}, ${campaign}, ${content}, ${medium}, ${title}, ${baseUrl}, ${url}, ${auth.user.name})
  `;
  await audit({ actor: auth.user.name, action: 'link.created', entity: 'link', entityId: id, after: { code: c.code, url } });
  return Response.json({ id, url, code: c.code, campaign });
}
