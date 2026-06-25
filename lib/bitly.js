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

// Total clicks/scans for a bitlink (QR scans count as clicks on the bitlink).
export async function clicksSummary(bitlinkId) {
  const data = await bitly(`/bitlinks/${bitlinkId}/clicks/summary?unit=day&units=-1`);
  return data.total_clicks || 0;
}

// Sanity check / connection test against the current user.
export async function whoami() {
  const data = await bitly('/user');
  return { name: data.name, login: data.login, email: data.emails?.[0]?.email };
}

// Raw fetch that returns the response body as text (used for QR images, which
// come back as SVG rather than JSON).
async function bitlyText(path, { method = 'GET', body, accept = 'image/svg+xml' } = {}) {
  const token = process.env.BITLY_TOKEN;
  if (!token) throw new Error('Bitly is not connected. Set BITLY_TOKEN in the server environment.');
  const res = await fetch(BITLY_API + path, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: accept,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`Bitly QR request failed (${res.status})${t ? ': ' + t.slice(0, 160) : ''}`);
  }
  return res.text();
}

// Create a Bitly-managed QR code tied to an existing bitlink, then fetch its
// SVG image. This makes the short link AND its QR code live together in the
// Bitly account (visible in the Bitly dashboard). Returns { qrcodeId, qrSvg }.
// Note: the QR Codes API requires a Bitly plan that includes API QR creation;
// callers should treat failures as "fall back to an app-generated QR".
export async function createQrForBitlink(bitlinkId, title) {
  // The QR must be created within a Bitly group; use the account's default.
  const user = await bitly('/user');
  const group_guid = user.default_group_guid;
  if (!group_guid) throw new Error('No default Bitly group available for QR creation.');

  const created = await bitly('/qr-codes', {
    method: 'POST',
    body: {
      title: String(title || bitlinkId).slice(0, 200),
      group_guid,
      destination: { bitlink_id: bitlinkId },
    },
  });
  const qrcodeId = created.qrcode_id || created.id;
  if (!qrcodeId) throw new Error('Bitly did not return a QR code id.');

  const qrSvg = await bitlyText(`/qr-codes/${qrcodeId}/image`, { accept: 'image/svg+xml' });
  return { qrcodeId, qrSvg };
}
