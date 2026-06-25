import { sql } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { audit } from '@/lib/domain';

export const dynamic = 'force-dynamic';

// Read the full taxonomy (for builders and the taxonomy view).
export async function GET() {
  const auth = await requireUser('viewer');
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });

  const [departments, businessUnits, initiatives, campaigns] = await Promise.all([
    sql`SELECT code, name FROM departments ORDER BY name`,
    sql`SELECT code, name FROM business_units ORDER BY name`,
    sql`SELECT bu_code, code, name FROM initiatives ORDER BY name`,
    sql`SELECT init_code, code, name FROM campaign_vocab ORDER BY name`,
  ]);

  // shape into the nested form the UI expects
  const dept = Object.fromEntries(departments.map((d) => [d.code, d.name]));
  const bu = Object.fromEntries(businessUnits.map((b) => [b.code, b.name]));
  const initGroups = {};
  for (const i of initiatives) {
    (initGroups[i.bu_code] ||= {})[i.code] = i.name;
  }
  const campGroups = {};
  for (const c of campaigns) {
    (campGroups[c.init_code] ||= {})[c.code] = c.name;
  }
  return Response.json({ departments: dept, businessUnits: bu, initiatives: initGroups, campaigns: campGroups });
}

// Admin: add a taxonomy value. body: { type:'bu'|'initiative'|'campaign', ... }
export async function POST(req) {
  const auth = await requireUser('admin');
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });
  const b = await req.json().catch(() => ({}));

  try {
    if (b.type === 'bu') {
      const code = (b.code || '').trim().toLowerCase();
      if (!/^[a-z]$/.test(code)) return Response.json({ error: 'Business unit code must be 1 letter' }, { status: 400 });
      await sql`INSERT INTO business_units (code, name) VALUES (${code}, ${b.name}) ON CONFLICT (code) DO NOTHING`;
      await audit({ actor: auth.user.name, action: 'taxonomy.bu_added', entity: 'taxonomy', entityId: code, after: { code, name: b.name } });
    } else if (b.type === 'initiative') {
      const code = (b.code || '').trim().toLowerCase();
      if (!/^[a-z]{2}$/.test(code)) return Response.json({ error: 'Initiative code must be 2 letters' }, { status: 400 });
      await sql`INSERT INTO initiatives (bu_code, code, name) VALUES (${b.buCode}, ${code}, ${b.name}) ON CONFLICT (bu_code, code) DO NOTHING`;
      await audit({ actor: auth.user.name, action: 'taxonomy.initiative_added', entity: 'taxonomy', entityId: `${b.buCode}-${code}`, after: { buCode: b.buCode, code, name: b.name } });
    } else if (b.type === 'campaign') {
      const code = (b.code || '').trim().toLowerCase();
      if (!/^[a-z]{2,4}$/.test(code)) return Response.json({ error: 'Campaign code must be 2–4 letters' }, { status: 400 });
      await sql`INSERT INTO campaign_vocab (init_code, code, name) VALUES (${b.initCode}, ${code}, ${b.name}) ON CONFLICT (init_code, code) DO NOTHING`;
      await audit({ actor: auth.user.name, action: 'taxonomy.campaign_added', entity: 'taxonomy', entityId: `${b.initCode}-${code}`, after: { initCode: b.initCode, code, name: b.name } });
    } else {
      return Response.json({ error: 'Unknown taxonomy type' }, { status: 400 });
    }
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e.message || e) }, { status: 500 });
  }
}
