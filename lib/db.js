import { neon } from '@neondatabase/serverless';

// Lazy proxy: defer connecting until a query actually runs, so `next build`
// can collect routes without DATABASE_URL present. On Vercel the env var is set.
let _sql = null;
function getSql() {
  if (_sql) return _sql;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set.');
  _sql = neon(url);
  return _sql;
}

// Tagged-template passthrough: sql`...` and sql.query(...) both work.
export function sql(strings, ...values) {
  return getSql()(strings, ...values);
}
sql.query = (text, params) => getSql().query(text, params);

export function newId(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
