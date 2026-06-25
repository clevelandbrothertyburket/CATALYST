import { sql } from '@/lib/db';
import { createSession, verifyPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Real sign-in: email + password, verified against the bcrypt hash in the DB.
// (When SSO is added later, this route is replaced by the OAuth callback;
//  createSession() stays the same.)
export async function POST(req) {
  const { email, password } = await req.json().catch(() => ({}));
  if (!email || !password) {
    return Response.json({ error: 'Email and password are required' }, { status: 400 });
  }
  const normalized = String(email).trim().toLowerCase();
  const rows = await sql`
    SELECT id, email, name, role, password_hash
    FROM users WHERE lower(email) = ${normalized}
  `;
  // Generic error message — don't reveal whether the email exists.
  const fail = () => Response.json({ error: 'Invalid email or password' }, { status: 401 });
  if (!rows.length) return fail();

  const user = rows[0];
  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) return fail();

  const safe = { id: user.id, email: user.email, name: user.name, role: user.role };
  await createSession(safe);
  return Response.json({ user: safe });
}
