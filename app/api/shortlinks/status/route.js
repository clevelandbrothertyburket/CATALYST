import { requireUser } from '@/lib/auth';
import { bitlyConfigured, whoami } from '@/lib/bitly';

export const dynamic = 'force-dynamic';

// Reports whether Bitly is connected. Admins get a live whoami check.
export async function GET() {
  const auth = await requireUser('user');
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });

  if (!bitlyConfigured()) return Response.json({ connected: false });

  // For admins, verify the token actually works against Bitly.
  if (auth.user.role === 'admin') {
    try {
      const account = await whoami();
      return Response.json({ connected: true, account });
    } catch (e) {
      return Response.json({ connected: false, error: String(e.message || e) });
    }
  }
  return Response.json({ connected: true });
}
