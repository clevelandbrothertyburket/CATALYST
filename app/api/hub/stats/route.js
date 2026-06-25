import { sql } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Per-link analytics: clicks over the last 14 days + device breakdown.
export async function GET(req) {
  const auth = await requireUser('user');
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return Response.json({ error: 'id required' }, { status: 400 });

  const since = new Date(Date.now() - 13 * 24 * 3600 * 1000).toISOString();
  const [byDay, byDevice, byBrowser, byOs, byCountry, byCity, byReferrer, bySource, total] = await Promise.all([
    sql`SELECT to_char(date_trunc('day', ts), 'YYYY-MM-DD') AS day, count(*)::int AS n
        FROM cb_clicks WHERE link_id = ${id} AND ts >= ${since} GROUP BY day ORDER BY day`,
    sql`SELECT coalesce(device,'unknown') AS label, count(*)::int AS n FROM cb_clicks WHERE link_id = ${id} GROUP BY 1 ORDER BY n DESC LIMIT 8`,
    sql`SELECT coalesce(browser,'unknown') AS label, count(*)::int AS n FROM cb_clicks WHERE link_id = ${id} GROUP BY 1 ORDER BY n DESC LIMIT 8`,
    sql`SELECT coalesce(os,'unknown') AS label, count(*)::int AS n FROM cb_clicks WHERE link_id = ${id} GROUP BY 1 ORDER BY n DESC LIMIT 8`,
    sql`SELECT coalesce(country,'—') AS label, count(*)::int AS n FROM cb_clicks WHERE link_id = ${id} GROUP BY 1 ORDER BY n DESC LIMIT 8`,
    sql`SELECT coalesce(city,'—') AS label, count(*)::int AS n FROM cb_clicks WHERE link_id = ${id} GROUP BY 1 ORDER BY n DESC LIMIT 8`,
    sql`SELECT coalesce(referrer,'Direct / QR') AS label, count(*)::int AS n FROM cb_clicks WHERE link_id = ${id} GROUP BY 1 ORDER BY n DESC LIMIT 8`,
    sql`SELECT coalesce(source,'link') AS label, count(*)::int AS n FROM cb_clicks WHERE link_id = ${id} GROUP BY 1 ORDER BY n DESC`,
    sql`SELECT count(*)::int AS n FROM cb_clicks WHERE link_id = ${id}`,
  ]);

  // Fill a continuous 14-day series.
  const map = Object.fromEntries(byDay.map((r) => [r.day, r.n]));
  const series = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 3600 * 1000).toISOString().slice(0, 10);
    series.push({ day: d, value: map[d] || 0 });
  }

  return Response.json({ total: total[0].n, series, byDevice, byBrowser, byOs, byCountry, byCity, byReferrer, bySource });
}
