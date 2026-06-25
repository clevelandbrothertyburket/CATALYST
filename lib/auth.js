import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { sql } from './db';

const COOKIE = 'cb_session';
const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET || 'dev-only-insecure-secret-change-me');

// Role hierarchy: viewer < user < approver < admin
export const ROLE_RANK = { viewer: 0, user: 1, approver: 2, admin: 3 };
export const ROLES = ['viewer', 'user', 'approver', 'admin'];
export function can(user, minRole) {
  if (!user) return false;
  return (ROLE_RANK[user.role] ?? -1) >= (ROLE_RANK[minRole] ?? 99);
}

// ---- Password hashing (bcrypt) ----
export async function hashPassword(plain) {
  return bcrypt.hash(plain, 12);
}
export async function verifyPassword(plain, hash) {
  if (!hash) return false;
  try { return await bcrypt.compare(plain, hash); }
  catch { return false; }
}

export async function createSession(user) {
  const token = await new SignJWT({ id: user.id, name: user.name, role: user.role, email: user.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret());
  cookies().set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearSession() {
  cookies().set(COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
}

export async function getSession() {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  let payload;
  try {
    ({ payload } = await jwtVerify(token, secret()));
  } catch {
    return null;
  }
  // Confirm the account still exists — a deleted user is cleared immediately,
  // and live role changes take effect too. On a DB hiccup, fall back to the
  // token's claims rather than logging everyone out.
  try {
    const rows = await sql`SELECT name, role, email FROM users WHERE id = ${payload.id}`;
    if (!rows.length) return null;
    return { id: payload.id, name: rows[0].name, role: rows[0].role, email: rows[0].email };
  } catch {
    return { id: payload.id, name: payload.name, role: payload.role, email: payload.email };
  }
}

// Helper for API routes: returns user or throws a 401/403-shaped error object.
export async function requireUser(minRole = 'user') {
  const user = await getSession();
  if (!user) return { error: 'Not signed in', status: 401 };
  if (!can(user, minRole)) return { error: 'Insufficient permissions', status: 403 };
  return { user };
}
