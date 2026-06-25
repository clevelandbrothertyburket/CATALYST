import { sql } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { clicksSummary } from '@/lib/bitly';

export const dynamic = 'force-dynamic';

// Click/scan totals per short link, pulled live from Bitly. On-demand (the UI
// calls this from a "Refresh stats" button) to stay within Bitly rate limits.
export async function GET() {
  const auth = await requireUser('viewer');
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });

  const rows = await sql`SELECT id, bitly_id FROM short_links WHERE bitly_id IS NOT NULL ORDER BY created_at DESC`;
  const stats = {};
  let total = 0;
  await Promise.all(rows.map(async (r) => {
    try {
      const c = await clicksSummary(r.bitly_id);
      stats[r.id] = c;
      total += c;
    } catch {
      stats[r.id] = null; // Bitly error / plan limit — show as unavailable
    }
  }));

  return Response.json({ stats, total });
}
