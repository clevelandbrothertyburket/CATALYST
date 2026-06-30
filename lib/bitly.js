// Bitly API v4 client.
// Optional integration: when BITLY_TOKEN is set, Link Hub also creates a Bitly
// short link for each URL and Catalyst pulls Bitly's tracking (clicks, geo,
// referrers) so the team doesn't have to switch between Bitly and Catalyst.
//
// Auth: Bearer token (Bitly "Generic Access Token", Settings → API).
//   BITLY_TOKEN       – the access token.
//   BITLY_GROUP_GUID  – optional; defaults to the token's default group.

const BITLY_API = 'https://api-ssl.bitly.com/v4';

const token = () => process.env.BITLY_TOKEN;

export function bitlyConfigured() {
  return Boolean(token());
}

async function bitly(path, { method = 'GET', body } = {}) {
  const key = token();
  if (!key) throw new Error('Bitly not configured (set BITLY_TOKEN).');
  const res = await fetch(BITLY_API + path, {
    method,
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data && (data.message || data.description)) || ('Bitly error ' + res.status);
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data;
}

// Resolve the default group guid if none is configured.
async function groupGuid() {
  if (process.env.BITLY_GROUP_GUID) return process.env.BITLY_GROUP_GUID;
  const me = await bitly('/user');
  return me.default_group_guid;
}

// Create (or get) a Bitly short link for a long URL.
export async function shorten(longUrl, title) {
  const group_guid = await groupGuid();
  const data = await bitly('/shorten', { method: 'POST', body: { long_url: longUrl, group_guid, title } });
  // data.id is the bitlink id without scheme, e.g. "bit.ly/3abcXYZ"; data.link is the full URL.
  return { id: data.id, link: data.link };
}

// A bitlink id for the metric endpoints is the host+path with no scheme.
const idOf = (bitlink) => String(bitlink || '').replace(/^https?:\/\//, '');

export async function summary(bitlink) {
  const id = idOf(bitlink);
  const d = await bitly('/bitlinks/' + id + '/clicks/summary?unit=day&units=-1');
  return d.total_clicks || 0;
}

export async function clicksByDay(bitlink, days = 30) {
  const id = idOf(bitlink);
  const d = await bitly('/bitlinks/' + id + '/clicks?unit=day&units=' + days);
  return (d.link_clicks || []).map((p) => ({ date: p.date, clicks: p.clicks }));
}

export async function countries(bitlink) {
  const id = idOf(bitlink);
  const d = await bitly('/bitlinks/' + id + '/countries?unit=day&units=-1');
  return (d.metrics || []).map((m) => ({ label: m.value, n: m.clicks }));
}

export async function referrers(bitlink) {
  const id = idOf(bitlink);
  const d = await bitly('/bitlinks/' + id + '/referrers?unit=day&units=-1');
  return (d.metrics || []).map((m) => ({ label: m.value === 'direct' ? 'Direct' : m.value, n: m.clicks }));
}

// One call that returns everything Catalyst surfaces for a Bitly-backed link.
// Best-effort: a failure in one metric won't sink the whole response.
export async function bitlyAnalytics(bitlink) {
  const id = idOf(bitlink);
  const safe = (p) => p.then((v) => v).catch(() => null);
  const [total, series, byCountry, byReferrer] = await Promise.all([
    safe(summary(id)),
    safe(clicksByDay(id, 30)),
    safe(countries(id)),
    safe(referrers(id)),
  ]);
  return {
    bitlink: id,
    bitlyUrl: 'https://' + id,
    total: total || 0,
    series: series || [],
    byCountry: byCountry || [],
    byReferrer: byReferrer || [],
  };
}

// ---- Account viewer: pull the whole Bitly account into Catalyst ----

// Resolve the group guid (exported for the account route).
export async function defaultGroupGuid() {
  return groupGuid();
}

// List the account's Bitlinks with click totals, so the team can browse
// everything in Bitly from inside Catalyst.
export async function listAccountLinks({ size = 50 } = {}) {
  const guid = await groupGuid();
  const d = await bitly('/groups/' + guid + '/bitlinks?size=' + size);
  const base = (d.links || []).map((l) => ({
    id: l.id,
    link: l.link,
    title: l.title || '',
    long_url: l.long_url,
    created_at: l.created_at,
    tags: l.tags || [],
  }));
  // Fetch click summaries in parallel (best-effort; a failure just leaves clicks null).
  const links = await Promise.all(base.map(async (l) => {
    try { l.clicks = await summary(l.id); } catch { l.clicks = null; }
    return l;
  }));
  const totalClicks = links.reduce((s, l) => s + (l.clicks || 0), 0);
  return { group_guid: guid, count: links.length, totalClicks, links };
}
