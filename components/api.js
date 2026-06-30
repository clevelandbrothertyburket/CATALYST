'use client';

async function jsonFetch(url, opts = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  session: () => jsonFetch('/api/auth/session'),
  signin: (email, password) => jsonFetch('/api/auth/signin', { method: 'POST', body: JSON.stringify({ email, password }) }),
  signout: () => jsonFetch('/api/auth/signout', { method: 'POST' }),

  users: () => jsonFetch('/api/users'),
  createUser: (body) => jsonFetch('/api/users', { method: 'POST', body: JSON.stringify(body) }),
  deleteUser: (id) => jsonFetch('/api/users?id=' + encodeURIComponent(id), { method: 'DELETE' }),

  codes: (params = '') => jsonFetch('/api/codes' + params),
  changeStatus: (id, to) => jsonFetch(`/api/codes/${id}/status`, { method: 'POST', body: JSON.stringify({ to }) }),

  requests: (params = '') => jsonFetch('/api/requests' + params),
  createRequest: (body) => jsonFetch('/api/requests', { method: 'POST', body: JSON.stringify(body) }),
  decide: (id, decision, note) => jsonFetch(`/api/requests/${id}/decide`, { method: 'POST', body: JSON.stringify({ decision, note }) }),

  links: (params = '') => jsonFetch('/api/links' + params),
  createLink: (body) => jsonFetch('/api/links', { method: 'POST', body: JSON.stringify(body) }),
  deleteLink: (id) => jsonFetch('/api/links?id=' + encodeURIComponent(id), { method: 'DELETE' }),

  taxonomy: () => jsonFetch('/api/taxonomy'),
  addTaxonomy: (body) => jsonFetch('/api/taxonomy', { method: 'POST', body: JSON.stringify(body) }),

  audit: (params = '') => jsonFetch('/api/audit' + params),

  hub: () => jsonFetch('/api/hub'),
  createHubLink: (body) => jsonFetch('/api/hub', { method: 'POST', body: JSON.stringify(body) }),
  deleteHubLink: (id) => jsonFetch('/api/hub?id=' + encodeURIComponent(id), { method: 'DELETE' }),
  hubStats: (id) => jsonFetch('/api/hub/stats?id=' + encodeURIComponent(id)),
  bitlyStats: (id) => jsonFetch('/api/hub/bitly?id=' + encodeURIComponent(id)),
  bitlyAccount: () => jsonFetch('/api/bitly/account'),
  clickupTest: () => jsonFetch('/api/clickup/test'),
};
