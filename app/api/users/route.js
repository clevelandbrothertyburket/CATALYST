import { sql, newId } from '@/lib/db';
import { requireUser, hashPassword, ROLES } from '@/lib/auth';
import { audit } from '@/lib/domain';
import { sendInviteEmail, emailConfigured } from '@/lib/email';

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

  // Send the branded invite email (best-effort: the account is created either way).
  let emailed = false, emailError = null;
  try {
    if (emailConfigured()) {
      const loginUrl = process.env.APP_URL || new URL(req.url).origin;
      await sendInviteEmail({ to: email, name, role, tempPassword: password, loginUrl, invitedBy: auth.user.name });
      emailed = true;
    } else {
      emailError = 'Email not configured (ZAPIER_EMAIL_WEBHOOK_URL missing) — share the credentials manually.';
    }
  } catch (e) {
    emailError = String(e.message || e);
  }

  return Response.json({ user: { id, email, name, role, has_password: true }, emailed, emailError });
}

// Permanently delete a user (admin only). Hard delete — the row is removed and
// the account is cleared from the system immediately (their session stops
// validating on the next request via getSession's existence check).
export async function DELETE(req) {
  const auth = await requireUser('admin');
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return Response.json({ error: 'User id is required' }, { status: 400 });
  if (id === auth.user.id) return Response.json({ error: "You can't delete your own account." }, { status: 400 });

  const rows = await sql`SELECT id, email, name, role FROM users WHERE id = ${id}`;
  if (!rows.length) return Response.json({ error: 'User not found' }, { status: 404 });

  if (rows[0].role === 'admin') {
    const [{ count }] = await sql`SELECT count(*)::int AS count FROM users WHERE role = 'admin'`;
    if (count <= 1) return Response.json({ error: "Can't delete the last administrator." }, { status: 400 });
  }

  await sql`DELETE FROM users WHERE id = ${id}`;
  await audit({ actor: auth.user.name, action: 'user.deleted', entity: 'user', entityId: id, before: rows[0] });
  return Response.json({ ok: true });
}
