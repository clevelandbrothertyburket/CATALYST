import { requireUser } from '@/lib/auth';
import { bitlyConfigured, linkDetail } from '@/lib/bitly';

export const dynamic = 'force-dynamic';

// GET /api/bitly/link?bitlink=bit.ly/xxx — detail analytics for one Bitlink.
export async function GET(req) {
  const auth = await requireUser('user');
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });
  if (!bitlyConfigured()) return Response.json({ configured: false });
  const bitlink = new URL(req.url).searchParams.get('bitlink');
  if (!bitlink) return Response.json({ error: 'bitlink required' }, { status: 400 });
  try {
    const data = await linkDetail(bitlink);
    return Response.json({ configured: true, ...data });
  } catch (e) {
    return Response.json({ configured: true, error: String(e && e.message || e) }, { status: 200 });
  }
}
