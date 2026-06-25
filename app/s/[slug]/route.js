import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

const BOT_RE = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegram|discord|preview|monitor|curl|wget|python-requests|headless|lighthouse/i;

function parseUA(ua) {
  if (!ua) return { device: 'unknown', browser: 'unknown', os: 'unknown', bot: false };
  if (BOT_RE.test(ua)) return { device: 'bot', browser: 'bot', os: 'bot', bot: true };
  const device = /ipad|tablet/i.test(ua) ? 'tablet' : /mobi|iphone|android/i.test(ua) ? 'mobile' : 'desktop';
  const browser = /edg/i.test(ua) ? 'Edge' : /(chrome|crios)/i.test(ua) ? 'Chrome' : /(firefox|fxios)/i.test(ua) ? 'Firefox' : /safari/i.test(ua) ? 'Safari' : 'Other';
  const os = /iphone|ipad|ipod/i.test(ua) ? 'iOS' : /android/i.test(ua) ? 'Android' : /windows nt/i.test(ua) ? 'Windows' : /mac os x/i.test(ua) ? 'macOS' : /linux/i.test(ua) ? 'Linux' : 'Other';
  return { device, browser, os, bot: false };
}
function decodeHeader(v) { if (!v) return null; try { return decodeURIComponent(v.replace(/\+/g, ' ')); } catch { return v; } }

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
  const { device, browser, os, bot } = parseUA(ua);
  const source = new URL(req.url).searchParams.get('s') === 'qr' ? 'qr' : 'link';
  let referrer = req.headers.get('referer') || null;
  if (referrer) { try { referrer = new URL(referrer).hostname; } catch {} }
  const country = req.headers.get('x-vercel-ip-country') || null;
  const city = decodeHeader(req.headers.get('x-vercel-ip-city'));

  // Count humans only; never block the redirect on a logging hiccup.
  if (!bot) {
    try {
      await sql`INSERT INTO cb_clicks (link_id, source, referrer, device, browser, os, country, city)
                VALUES (${link.id}, ${source}, ${referrer}, ${device}, ${browser}, ${os}, ${country}, ${city})`;
    } catch { /* ignore */ }
  }
  return Response.redirect(link.long_url, 302);
}
