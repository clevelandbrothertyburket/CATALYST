import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Weekly digest. Triggered by Vercel Cron (see vercel.json) or callable manually
// to test. Computes the week's activity and POSTs it to ZAPIER_REPORT_WEBHOOK_URL
// (a second Zap that emails your team). Also returns the digest in the response.
export async function GET(req) {
  // Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is set.
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const [linksWeek, linksTotal, codesTotal, pending, topCodes] = await Promise.all([
    sql`SELECT count(*)::int AS n FROM links WHERE created_at >= ${since}`,
    sql`SELECT count(*)::int AS n FROM links`,
    sql`SELECT count(*)::int AS n FROM codes`,
    sql`SELECT count(*)::int AS n FROM approval_requests WHERE status = 'pending'`,
    sql`SELECT code, count(*)::int AS n FROM links WHERE created_at >= ${since} GROUP BY code ORDER BY n DESC LIMIT 5`,
  ]);

  const digest = {
    type: 'weekly_report',
    period: 'last 7 days',
    generatedAt: new Date().toISOString(),
    linksThisWeek: linksWeek[0].n,
    totalLinks: linksTotal[0].n,
    totalCodes: codesTotal[0].n,
    pendingApprovals: pending[0].n,
    topCodes: topCodes.map((r) => ({ code: r.code, links: r.n })),
  };

  const url = process.env.ZAPIER_REPORT_WEBHOOK_URL;
  let delivered = false, error = null;
  if (url) {
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(digest) });
      delivered = res.ok;
      if (!res.ok) error = `Report webhook responded ${res.status}`;
    } catch (e) { error = String(e.message || e); }
  } else {
    error = 'ZAPIER_REPORT_WEBHOOK_URL not set — digest computed but not delivered.';
  }

  return Response.json({ ok: true, delivered, error, digest });
}
