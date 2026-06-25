import { sql, newId } from '@/lib/db';
import { requireUser, hashPassword, ROLES } from '@/lib/auth';
import { audit } from '@/lib/domain';

export const dynamic = 'force-dynamic';

// List users (admin only). Never returns password hashes.
export async function GET() {
  const auth = await requireUser('admin');
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });

  const users = await sql`
    SELECT id, email, name, role,
           (password_hash IS NOT NULL) AS has_password,
           created_at
    FROM users ORDER BY created_at ASC
  `;
  return Response.json({ users });
}

// Invite / create a user (admin only). body: { name, email, role, password }
export async function POST(req) {
  const auth = await requireUser('admin');
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });

  const b = await req.json().catch(() => ({}));
  const name = (b.name || '').trim();
  const email = (b.email || '').trim().toLowerCase();
  const role = (b.role || 'user').trim();
  const password = b.password || '';

  if (!name) return Response.json({ error: 'Name is required' }, { status: 400 });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return Response.json({ error: 'A valid email is required' }, { status: 400 });
  }
  if (!ROLES.includes(role)) return Response.json({ error: 'Invalid role' }, { status: 400 });
  if (password.length < 8) {
    return Response.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }

  const existing = await sql`SELECT 1 FROM users WHERE lower(email) = ${email}`;
  if (existing.length) return Response.json({ error: 'A user with that email already exists' }, { status: 409 });

  const id = newId('u');
  const password_hash = await hashPassword(password);
  await sql`
    INSERT INTO users (id, email, name, role, password_hash)
    VALUES (${id}, ${email}, ${name}, ${role}, ${password_hash})
  `;
  await audit({ actor: auth.user.name, action: 'user.created', entity: 'user', entityId: id, after: { email, name, role } });

  return Response.json({ user: { id, email, name, role, has_password: true } });
}
