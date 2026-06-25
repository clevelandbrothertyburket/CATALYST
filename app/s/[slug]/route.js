import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

const BOT_RE = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegram|discord|preview|monitor|curl|wget|python-requests|headless|lighthouse/i;

function parseUA(ua) {
  if (!ua) return { device: 'unknown', browser: 'unknown', bot: false };
  if (BOT_RE.test(ua)) return { device: 'bot', browser: 'bot', bot: true };
  const device = /ipad|tablet/i.test(ua) ? 'tablet' : /mobi|iphone|android/i.test(ua) ? 'mobile' : 'desktop';
  const browser = /edg/i.test(ua) ? 'Edge' : /(chrome|crios)/i.test(ua) ? 'Chrome' : /(firefox|fxios)/i.test(ua) ? 'Firefox' : /safari/i.test(ua) ? 'Safari' : 'Other';
  return { device, browser, bot: false };
}

// Public redirect: /s/<slug>  →  look up, log the click, 302 to the destination.
export async function GET(req, { params }) {
  const slug = params.slug;
  let rows;
  try {
    rows = await sql`SELECT id, long_url FROM cb_short_links WHERE slug = ${slug}`;
  } catch {
    return Response.redirect(new URL('/', req.url), 302);
  }
  if (!rows.length) return Response.redirect(new URL('/', req.url), 302);

  const link = rows[0];
  const ua = req.headers.get('user-agent') || '';
  const { device, browser, bot } = parseUA(ua);
  const source = new URL(req.url).searchParams.get('s') === 'qr' ? 'qr' : null;
  const referrer = req.headers.get('referer') || null;
  const country = req.headers.get('x-vercel-ip-country') || null;

  // Count humans only; never block the redirect on a logging hiccup.
  if (!bot) {
    try {
      await sql`INSERT INTO cb_clicks (link_id, source, referrer, device, browser, country)
                VALUES (${link.id}, ${source}, ${referrer}, ${device}, ${browser}, ${country})`;
    } catch { /* ignore */ }
  }
  return Response.redirect(link.long_url, 302);
}
