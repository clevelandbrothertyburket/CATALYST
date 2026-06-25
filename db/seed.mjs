// Usage: DATABASE_URL=... ADMIN_PASSWORD='...' node db/seed.mjs
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sql = neon(process.env.DATABASE_URL);
const seed = JSON.parse(readFileSync(join(__dirname, 'taxonomy-seed.json'), 'utf8'));

// ---- admin user ----
// Email/name can be overridden by env; password MUST come from ADMIN_PASSWORD
// (kept out of the repo). Re-running with a password updates the existing hash.
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'tburket@clevelandbrothers.com').toLowerCase();
const ADMIN_NAME = process.env.ADMIN_NAME || 'Ty Burket';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const adminHash = ADMIN_PASSWORD ? await bcrypt.hash(ADMIN_PASSWORD, 12) : null;

await sql`
  INSERT INTO users (id, email, name, role, password_hash) VALUES
  ('u_tburket', ${ADMIN_EMAIL}, ${ADMIN_NAME}, 'admin', ${adminHash})
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        name  = EXCLUDED.name,
        role  = 'admin',
        password_hash = COALESCE(EXCLUDED.password_hash, users.password_hash)
`;
console.log(adminHash
  ? `Admin user ready: ${ADMIN_EMAIL} (password set).`
  : `Admin user ready: ${ADMIN_EMAIL} (NO password — set ADMIN_PASSWORD to enable sign-in).`);

// ---- departments ----
for (const [code, name] of Object.entries(seed.departments)) {
  await sql`INSERT INTO departments (code, name) VALUES (${code}, ${name}) ON CONFLICT (code) DO UPDATE SET name=${name}`;
}
// ---- business units ----
for (const [code, name] of Object.entries(seed.businessUnits)) {
  await sql`INSERT INTO business_units (code, name) VALUES (${code}, ${name}) ON CONFLICT (code) DO UPDATE SET name=${name}`;
}
// ---- initiatives (keyed by BU) ----
for (const [buCode, group] of Object.entries(seed.initiatives)) {
  for (const [code, name] of Object.entries(group)) {
    await sql`INSERT INTO initiatives (bu_code, code, name) VALUES (${buCode}, ${code}, ${name})
              ON CONFLICT (bu_code, code) DO UPDATE SET name=${name}`;
  }
}
// ---- campaign vocab (keyed by initiative) ----
for (const [initCode, group] of Object.entries(seed.campaigns)) {
  for (const [code, name] of Object.entries(group)) {
    await sql`INSERT INTO campaign_vocab (init_code, code, name) VALUES (${initCode}, ${code}, ${name})
              ON CONFLICT (init_code, code) DO UPDATE SET name=${name}`;
  }
}
// ---- existing codes (imported, marked active) ----
for (const r of seed.records) {
  const id = 'c_' + r.code;
  await sql`
    INSERT INTO codes (id, code, dept, bu, init, camp, camp_name, department, business_unit, initiative, status, created_by)
    VALUES (${id}, ${r.code}, ${r.dept}, ${r.bu}, ${r.init}, ${r.camp}, ${r.campName},
            ${r.department}, ${r.businessUnit}, ${r.initiative}, 'active', 'CSV Import')
    ON CONFLICT (code) DO NOTHING
  `;
}

const [{ count }] = await sql`SELECT count(*)::int AS count FROM codes`;
console.log(`Seed complete. ${count} codes in registry.`);
