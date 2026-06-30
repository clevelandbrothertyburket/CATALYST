import { requireUser } from '@/lib/auth';
import { bitlyConfigured, listAccountLinks } from '@/lib/bitly';

export const dynamic = 'force-dynamic';

// GET /api/bitly/account — every Bitlink in the account, with click totals,
// so the team can browse all of Bitly from inside Catalyst.
export async function GET(req) {
  const auth = await requireUser('user');
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });
  if (!bitlyConfigured()) return Response.json({ configured: false });

  const size = Math.min(Number(new URL(req.url).searchParams.get('size')) || 50, 100);
  try {
    const data = await listAccountLinks({ size });
    return Response.json({ configured: true, ...data });
  } catch (e) {
    return Response.json({ configured: true, error: String(e && e.message || e) }, { status: 200 });
  }
}
