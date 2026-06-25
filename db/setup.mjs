// Usage: DATABASE_URL=... node db/setup.mjs
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sql = neon(process.env.DATABASE_URL);

const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
// naive split on ';' at line ends is risky with functions, but our schema has none.
const statements = schema
  .split(/;\s*$/m)
  .map((s) => s.trim())
  .filter((s) => s && !s.startsWith('--'));

for (const stmt of statements) {
  await sql.query(stmt);
}
console.log(`Applied ${statements.length} schema statements.`);
