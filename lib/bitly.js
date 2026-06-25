// Server-side Bitly client. The token is read from BITLY_TOKEN (Vercel env var)
// and never exposed to the browser. All Bitly calls go through API routes.

const BITLY_API = 'https://api-ssl.bitly.com/v4';

export function bitlyConfigured() {
  return Boolean(process.env.BITLY_TOKEN);
}

async function bitly(path, { method = 'GET', body } = {}) {
  const token = process.env.BITLY_TOKEN;
  if (!token) throw new Error('Bitly is not connected. Set BITLY_TOKEN in the server environment.');
  const res = await fetch(BITLY_API + path, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.description || data.message || `Bitly request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

// Shorten a long URL. Optional title and group are supported.
export async function shorten(longUrl, { title } = {}) {
  const data = await bitly('/shorten', {
    method: 'POST',
    body: { long_url: longUrl, ...(title ? { title } : {}) },
  });
  // data.link is the short URL; data.id is like "bit.ly/abc123"
  return { shortUrl: data.link, bitlyId: data.id };
}

// Sanity check / connection test against the current user.
export async function whoami() {
  const data = await bitly('/user');
  return { name: data.name, login: data.login, email: data.emails?.[0]?.email };
}
