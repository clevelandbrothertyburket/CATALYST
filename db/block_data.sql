DO $catalyst$
BEGIN
-- ============ ADMIN USER ============
-- ---------- Admin user (real bcrypt password hash) ----------
INSERT INTO users (id, email, name, role, password_hash) VALUES
  ('u_tburket', 'tburket@clevelandbrothers.com', 'Ty Burket', 'admin', '$2b$12$cmeB//M.nRacBXcrhXMfaOxTnYEl3otuqxh19KXvWwqu4Aqs4mUY6')
ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      name  = EXCLUDED.name,
      role  = 'admin',
      password_hash = EXCLUDED.password_hash;

-- ============ TAXONOMY + CODES ============
-- Catalyst seed data. Paste into Neon's SQL Editor and run AFTER schema.sql.
-- Safe to re-run: uses ON CONFLICT DO NOTHING / UPDATE.


-- departments
INSERT INTO departments (code, name) VALUES ('m', 'Marketing') ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name;
INSERT INTO departments (code, name) VALUES ('h', 'HR') ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name;

-- business units
INSERT INTO business_units (code, name) VALUES ('g', 'Construction Division') ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name;
INSERT INTO business_units (code, name) VALUES ('e', 'Industrial Engine Division') ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name;
INSERT INTO business_units (code, name) VALUES ('r', 'One Call Rental Division') ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name;
INSERT INTO business_units (code, name) VALUES ('t', 'Truck Engine Division') ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name;
INSERT INTO business_units (code, name) VALUES ('a', 'Corporate Division') ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name;

-- initiatives
INSERT INTO initiatives (bu_code, code, name) VALUES ('g', 'ne', 'New Equipment Sales') ON CONFLICT (bu_code, code) DO UPDATE SET name=EXCLUDED.name;
INSERT INTO initiatives (bu_code, code, name) VALUES ('g', 'ps', 'Product Support') ON CONFLICT (bu_code, code) DO UPDATE SET name=EXCLUDED.name;
INSERT INTO initiatives (bu_code, code, name) VALUES ('g', 'ue', 'Used Equipment') ON CONFLICT (bu_code, code) DO UPDATE SET name=EXCLUDED.name;
INSERT INTO initiatives (bu_code, code, name) VALUES ('g', 'st', 'SITECH') ON CONFLICT (bu_code, code) DO UPDATE SET name=EXCLUDED.name;
INSERT INTO initiatives (bu_code, code, name) VALUES ('e', 'rp', 'REPS') ON CONFLICT (bu_code, code) DO UPDATE SET name=EXCLUDED.name;
INSERT INTO initiatives (bu_code, code, name) VALUES ('e', 'lp', 'LEPS') ON CONFLICT (bu_code, code) DO UPDATE SET name=EXCLUDED.name;
INSERT INTO initiatives (bu_code, code, name) VALUES ('e', 'pu', 'Power Used') ON CONFLICT (bu_code, code) DO UPDATE SET name=EXCLUDED.name;
INSERT INTO initiatives (bu_code, code, name) VALUES ('e', 'er', 'Engine Rebuild Center') ON CONFLICT (bu_code, code) DO UPDATE SET name=EXCLUDED.name;
INSERT INTO initiatives (bu_code, code, name) VALUES ('e', 'ne', 'New Equipment Sales') ON CONFLICT (bu_code, code) DO UPDATE SET name=EXCLUDED.name;
INSERT INTO initiatives (bu_code, code, name) VALUES ('e', 're', 'Rental') ON CONFLICT (bu_code, code) DO UPDATE SET name=EXCLUDED.name;
INSERT INTO initiatives (bu_code, code, name) VALUES ('r', 're', 'Rental') ON CONFLICT (bu_code, code) DO UPDATE SET name=EXCLUDED.name;
INSERT INTO initiatives (bu_code, code, name) VALUES ('t', 'tb', 'Truck Bodies') ON CONFLICT (bu_code, code) DO UPDATE SET name=EXCLUDED.name;
INSERT INTO initiatives (bu_code, code, name) VALUES ('t', 'ts', 'Truck Service') ON CONFLICT (bu_code, code) DO UPDATE SET name=EXCLUDED.name;
INSERT INTO initiatives (bu_code, code, name) VALUES ('a', 'rc', 'Recruiting') ON CONFLICT (bu_code, code) DO UPDATE SET name=EXCLUDED.name;
INSERT INTO initiatives (bu_code, code, name) VALUES ('a', 'cb', 'Cleveland Brothers Brand') ON CONFLICT (bu_code, code) DO UPDATE SET name=EXCLUDED.name;
INSERT INTO initiatives (bu_code, code, name) VALUES ('a', 're', 'Rental') ON CONFLICT (bu_code, code) DO UPDATE SET name=EXCLUDED.name;

-- campaign vocabulary
INSERT INTO campaign_vocab (init_code, code, name) VALUES ('ne', 'bno', 'BCP National Offer') ON CONFLICT (init_code, code) DO UPDATE SET name=EXCLUDED.name;
INSERT INTO campaign_vocab (init_code, code, name) VALUES ('ne', 'gno', 'GCI National Offer') ON CONFLICT (init_code, code) DO UPDATE SET name=EXCLUDED.name;
INSERT INTO campaign_vocab (init_code, code, name) VALUES ('ne', 'ghe', 'GCI HEX Focus') ON CONFLICT (init_code, code) DO UPDATE SET name=EXCLUDED.name;
INSERT INTO campaign_vocab (init_code, code, name) VALUES ('ne', 'bld', 'BCP Lapsed/Dormant') ON CONFLICT (init_code, code) DO UPDATE SET name=EXCLUDED.name;
INSERT INTO campaign_vocab (init_code, code, name) VALUES ('ne', 'bch', 'BCP CTL & Hex Focus') ON CONFLICT (init_code, code) DO UPDATE SET name=EXCLUDED.name;
INSERT INTO campaign_vocab (init_code, code, name) VALUES ('ne', 'cqt', 'Conquest Cat Credits') ON CONFLICT (init_code, code) DO UPDATE SET name=EXCLUDED.name;
INSERT INTO campaign_vocab (init_code, code, name) VALUES ('ne', 'bpa', 'BCP Project ATOM') ON CONFLICT (init_code, code) DO UPDATE SET name=EXCLUDED.name;
INSERT INTO campaign_vocab (init_code, code, name) VALUES ('ne', 'att', 'Construction Attachments') ON CONFLICT (init_code, code) DO UPDATE SET name=EXCLUDED.name;
INSERT INTO campaign_vocab (init_code, code, name) VALUES ('ne', 'rep', 'Retail Electric Power') ON CONFLICT (init_code, code) DO UPDATE SET name=EXCLUDED.name;
INSERT INTO campaign_vocab (init_code, code, name) VALUES ('rp', 'rpr', 'REPS Power Resiliency') ON CONFLICT (init_code, code) DO UPDATE SET name=EXCLUDED.name;
INSERT INTO campaign_vocab (init_code, code, name) VALUES ('rp', 'rsg', 'REPS Small Gas Generators') ON CONFLICT (init_code, code) DO UPDATE SET name=EXCLUDED.name;
INSERT INTO campaign_vocab (init_code, code, name) VALUES ('re', 'rna', 'Rental New Account') ON CONFLICT (init_code, code) DO UPDATE SET name=EXCLUDED.name;
INSERT INTO campaign_vocab (init_code, code, name) VALUES ('re', 'rld', 'Rental Lapsed/Dormant') ON CONFLICT (init_code, code) DO UPDATE SET name=EXCLUDED.name;
INSERT INTO campaign_vocab (init_code, code, name) VALUES ('re', 'cbu', 'Cross Business Unit') ON CONFLICT (init_code, code) DO UPDATE SET name=EXCLUDED.name;
INSERT INTO campaign_vocab (init_code, code, name) VALUES ('re', 'rep', 'Retail Electric Power') ON CONFLICT (init_code, code) DO UPDATE SET name=EXCLUDED.name;
INSERT INTO campaign_vocab (init_code, code, name) VALUES ('re', 'pug', 'Power Used General') ON CONFLICT (init_code, code) DO UPDATE SET name=EXCLUDED.name;
INSERT INTO campaign_vocab (init_code, code, name) VALUES ('re', 'pow', 'Power Rental') ON CONFLICT (init_code, code) DO UPDATE SET name=EXCLUDED.name;
INSERT INTO campaign_vocab (init_code, code, name) VALUES ('ps', 'reb', 'Rebuilds') ON CONFLICT (init_code, code) DO UPDATE SET name=EXCLUDED.name;
INSERT INTO campaign_vocab (init_code, code, name) VALUES ('ps', 'ucp', 'Undercarriage Promotion') ON CONFLICT (init_code, code) DO UPDATE SET name=EXCLUDED.name;
INSERT INTO campaign_vocab (init_code, code, name) VALUES ('ps', 'prt', 'Parts Campaign') ON CONFLICT (init_code, code) DO UPDATE SET name=EXCLUDED.name;
INSERT INTO campaign_vocab (init_code, code, name) VALUES ('ps', 'eqo', 'Equipment Onboarding') ON CONFLICT (init_code, code) DO UPDATE SET name=EXCLUDED.name;
INSERT INTO campaign_vocab (init_code, code, name) VALUES ('ps', 'hym', 'CB HYMAC') ON CONFLICT (init_code, code) DO UPDATE SET name=EXCLUDED.name;
INSERT INTO campaign_vocab (init_code, code, name) VALUES ('ps', 'pse', 'Prioritized Service Events') ON CONFLICT (init_code, code) DO UPDATE SET name=EXCLUDED.name;
INSERT INTO campaign_vocab (init_code, code, name) VALUES ('ps', 'get', 'Ground Engaging Tools') ON CONFLICT (init_code, code) DO UPDATE SET name=EXCLUDED.name;
INSERT INTO campaign_vocab (init_code, code, name) VALUES ('ps', 'cva', 'Customer Value Agreement') ON CONFLICT (init_code, code) DO UPDATE SET name=EXCLUDED.name;
INSERT INTO campaign_vocab (init_code, code, name) VALUES ('ue', 'usd', 'Used General') ON CONFLICT (init_code, code) DO UPDATE SET name=EXCLUDED.name;
INSERT INTO campaign_vocab (init_code, code, name) VALUES ('lp', 'lep', 'Large Equipment General') ON CONFLICT (init_code, code) DO UPDATE SET name=EXCLUDED.name;
INSERT INTO campaign_vocab (init_code, code, name) VALUES ('lp', 'uet', 'Utilities Energy Transition') ON CONFLICT (init_code, code) DO UPDATE SET name=EXCLUDED.name;
INSERT INTO campaign_vocab (init_code, code, name) VALUES ('tb', 'trb', 'Truck Bodies General') ON CONFLICT (init_code, code) DO UPDATE SET name=EXCLUDED.name;
INSERT INTO campaign_vocab (init_code, code, name) VALUES ('ts', 'trs', 'Truck Service') ON CONFLICT (init_code, code) DO UPDATE SET name=EXCLUDED.name;
INSERT INTO campaign_vocab (init_code, code, name) VALUES ('pu', 'pug', 'Power Used General') ON CONFLICT (init_code, code) DO UPDATE SET name=EXCLUDED.name;
INSERT INTO campaign_vocab (init_code, code, name) VALUES ('rc', 'gen', 'General Recruiting') ON CONFLICT (init_code, code) DO UPDATE SET name=EXCLUDED.name;
INSERT INTO campaign_vocab (init_code, code, name) VALUES ('er', 'reb', 'Rebuilds') ON CONFLICT (init_code, code) DO UPDATE SET name=EXCLUDED.name;
INSERT INTO campaign_vocab (init_code, code, name) VALUES ('cb', 'brd', 'Branding') ON CONFLICT (init_code, code) DO UPDATE SET name=EXCLUDED.name;
INSERT INTO campaign_vocab (init_code, code, name) VALUES ('st', 'stg', 'SITECH General') ON CONFLICT (init_code, code) DO UPDATE SET name=EXCLUDED.name;

-- existing campaign codes (imported, active)
INSERT INTO codes (id, code, dept, bu, init, camp, camp_name, department, business_unit, initiative, status, created_by) VALUES ('c_m-g-ne-bno', 'm-g-ne-bno', 'm', 'g', 'ne', 'bno', 'BCP National Offer', 'Marketing', 'Construction Division', 'New Equipment Sales', 'active', 'CSV Import') ON CONFLICT (code) DO NOTHING;
INSERT INTO codes (id, code, dept, bu, init, camp, camp_name, department, business_unit, initiative, status, created_by) VALUES ('c_m-g-ne-gno', 'm-g-ne-gno', 'm', 'g', 'ne', 'gno', 'GCI National Offer', 'Marketing', 'Construction Division', 'New Equipment Sales', 'active', 'CSV Import') ON CONFLICT (code) DO NOTHING;
INSERT INTO codes (id, code, dept, bu, init, camp, camp_name, department, business_unit, initiative, status, created_by) VALUES ('c_m-g-ne-ghe', 'm-g-ne-ghe', 'm', 'g', 'ne', 'ghe', 'GCI HEX Focus', 'Marketing', 'Construction Division', 'New Equipment Sales', 'active', 'CSV Import') ON CONFLICT (code) DO NOTHING;
INSERT INTO codes (id, code, dept, bu, init, camp, camp_name, department, business_unit, initiative, status, created_by) VALUES ('c_m-g-ne-bld', 'm-g-ne-bld', 'm', 'g', 'ne', 'bld', 'BCP Lapsed/Dormant', 'Marketing', 'Construction Division', 'New Equipment Sales', 'active', 'CSV Import') ON CONFLICT (code) DO NOTHING;
INSERT INTO codes (id, code, dept, bu, init, camp, camp_name, department, business_unit, initiative, status, created_by) VALUES ('c_m-e-rp-rpr', 'm-e-rp-rpr', 'm', 'e', 'rp', 'rpr', 'REPS Power Resiliency', 'Marketing', 'Industrial Engine Division', 'REPS', 'active', 'CSV Import') ON CONFLICT (code) DO NOTHING;
INSERT INTO codes (id, code, dept, bu, init, camp, camp_name, department, business_unit, initiative, status, created_by) VALUES ('c_m-r-re-rna', 'm-r-re-rna', 'm', 'r', 're', 'rna', 'Rental New Account', 'Marketing', 'One Call Rental Division', 'Rental', 'active', 'CSV Import') ON CONFLICT (code) DO NOTHING;
INSERT INTO codes (id, code, dept, bu, init, camp, camp_name, department, business_unit, initiative, status, created_by) VALUES ('c_m-g-ne-bch', 'm-g-ne-bch', 'm', 'g', 'ne', 'bch', 'BCP CTL & Hex Focus', 'Marketing', 'Construction Division', 'New Equipment Sales', 'active', 'CSV Import') ON CONFLICT (code) DO NOTHING;
INSERT INTO codes (id, code, dept, bu, init, camp, camp_name, department, business_unit, initiative, status, created_by) VALUES ('c_m-g-ps-reb', 'm-g-ps-reb', 'm', 'g', 'ps', 'reb', 'Rebuilds', 'Marketing', 'Construction Division', 'Product Support', 'active', 'CSV Import') ON CONFLICT (code) DO NOTHING;
INSERT INTO codes (id, code, dept, bu, init, camp, camp_name, department, business_unit, initiative, status, created_by) VALUES ('c_m-g-ps-ucp', 'm-g-ps-ucp', 'm', 'g', 'ps', 'ucp', 'Undercarriage Promotion', 'Marketing', 'Construction Division', 'Product Support', 'active', 'CSV Import') ON CONFLICT (code) DO NOTHING;
INSERT INTO codes (id, code, dept, bu, init, camp, camp_name, department, business_unit, initiative, status, created_by) VALUES ('c_m-g-ps-prt', 'm-g-ps-prt', 'm', 'g', 'ps', 'prt', 'Parts Campaign', 'Marketing', 'Construction Division', 'Product Support', 'active', 'CSV Import') ON CONFLICT (code) DO NOTHING;
INSERT INTO codes (id, code, dept, bu, init, camp, camp_name, department, business_unit, initiative, status, created_by) VALUES ('c_m-g-ne-cqt', 'm-g-ne-cqt', 'm', 'g', 'ne', 'cqt', 'Conquest Cat Credits', 'Marketing', 'Construction Division', 'New Equipment Sales', 'active', 'CSV Import') ON CONFLICT (code) DO NOTHING;
INSERT INTO codes (id, code, dept, bu, init, camp, camp_name, department, business_unit, initiative, status, created_by) VALUES ('c_m-g-ps-eqo', 'm-g-ps-eqo', 'm', 'g', 'ps', 'eqo', 'Equipment Onboarding', 'Marketing', 'Construction Division', 'Product Support', 'active', 'CSV Import') ON CONFLICT (code) DO NOTHING;
INSERT INTO codes (id, code, dept, bu, init, camp, camp_name, department, business_unit, initiative, status, created_by) VALUES ('c_m-r-re-rld', 'm-r-re-rld', 'm', 'r', 're', 'rld', 'Rental Lapsed/Dormant', 'Marketing', 'One Call Rental Division', 'Rental', 'active', 'CSV Import') ON CONFLICT (code) DO NOTHING;
INSERT INTO codes (id, code, dept, bu, init, camp, camp_name, department, business_unit, initiative, status, created_by) VALUES ('c_m-g-ue-usd', 'm-g-ue-usd', 'm', 'g', 'ue', 'usd', 'Used General', 'Marketing', 'Construction Division', 'Used Equipment', 'active', 'CSV Import') ON CONFLICT (code) DO NOTHING;
INSERT INTO codes (id, code, dept, bu, init, camp, camp_name, department, business_unit, initiative, status, created_by) VALUES ('c_m-e-lp-lep', 'm-e-lp-lep', 'm', 'e', 'lp', 'lep', 'Large Equipment General', 'Marketing', 'Industrial Engine Division', 'LEPS', 'active', 'CSV Import') ON CONFLICT (code) DO NOTHING;
INSERT INTO codes (id, code, dept, bu, init, camp, camp_name, department, business_unit, initiative, status, created_by) VALUES ('c_m-t-tb-trb', 'm-t-tb-trb', 'm', 't', 'tb', 'trb', 'Truck Bodies General', 'Marketing', 'Truck Engine Division', 'Truck Bodies', 'active', 'CSV Import') ON CONFLICT (code) DO NOTHING;
INSERT INTO codes (id, code, dept, bu, init, camp, camp_name, department, business_unit, initiative, status, created_by) VALUES ('c_m-t-ts-trs', 'm-t-ts-trs', 'm', 't', 'ts', 'trs', 'Truck Service', 'Marketing', 'Truck Engine Division', 'Truck Service', 'active', 'CSV Import') ON CONFLICT (code) DO NOTHING;
INSERT INTO codes (id, code, dept, bu, init, camp, camp_name, department, business_unit, initiative, status, created_by) VALUES ('c_m-e-pu-pug', 'm-e-pu-pug', 'm', 'e', 'pu', 'pug', 'Power Used General', 'Marketing', 'Industrial Engine Division', 'Power Used', 'active', 'CSV Import') ON CONFLICT (code) DO NOTHING;
INSERT INTO codes (id, code, dept, bu, init, camp, camp_name, department, business_unit, initiative, status, created_by) VALUES ('c_m-g-ps-hym', 'm-g-ps-hym', 'm', 'g', 'ps', 'hym', 'CB HYMAC', 'Marketing', 'Construction Division', 'Product Support', 'active', 'CSV Import') ON CONFLICT (code) DO NOTHING;
INSERT INTO codes (id, code, dept, bu, init, camp, camp_name, department, business_unit, initiative, status, created_by) VALUES ('c_m-g-ps-pse', 'm-g-ps-pse', 'm', 'g', 'ps', 'pse', 'Prioritized Service Events', 'Marketing', 'Construction Division', 'Product Support', 'active', 'CSV Import') ON CONFLICT (code) DO NOTHING;
INSERT INTO codes (id, code, dept, bu, init, camp, camp_name, department, business_unit, initiative, status, created_by) VALUES ('c_h-a-rc-gen', 'h-a-rc-gen', 'h', 'a', 'rc', 'gen', 'General Recruiting', 'HR', 'Corporate Division', 'Recruiting', 'active', 'CSV Import') ON CONFLICT (code) DO NOTHING;
INSERT INTO codes (id, code, dept, bu, init, camp, camp_name, department, business_unit, initiative, status, created_by) VALUES ('c_m-e-lp-uet', 'm-e-lp-uet', 'm', 'e', 'lp', 'uet', 'Utilities Energy Transition', 'Marketing', 'Industrial Engine Division', 'LEPS', 'active', 'CSV Import') ON CONFLICT (code) DO NOTHING;
INSERT INTO codes (id, code, dept, bu, init, camp, camp_name, department, business_unit, initiative, status, created_by) VALUES ('c_m-g-ne-bpa', 'm-g-ne-bpa', 'm', 'g', 'ne', 'bpa', 'BCP Project ATOM', 'Marketing', 'Construction Division', 'New Equipment Sales', 'active', 'CSV Import') ON CONFLICT (code) DO NOTHING;
INSERT INTO codes (id, code, dept, bu, init, camp, camp_name, department, business_unit, initiative, status, created_by) VALUES ('c_m-e-er-reb', 'm-e-er-reb', 'm', 'e', 'er', 'reb', 'Rebuilds', 'Marketing', 'Industrial Engine Division', 'Engine Rebuild Center', 'active', 'CSV Import') ON CONFLICT (code) DO NOTHING;
INSERT INTO codes (id, code, dept, bu, init, camp, camp_name, department, business_unit, initiative, status, created_by) VALUES ('c_m-e-rp-rsg', 'm-e-rp-rsg', 'm', 'e', 'rp', 'rsg', 'REPS Small Gas Generators', 'Marketing', 'Industrial Engine Division', 'REPS', 'active', 'CSV Import') ON CONFLICT (code) DO NOTHING;
INSERT INTO codes (id, code, dept, bu, init, camp, camp_name, department, business_unit, initiative, status, created_by) VALUES ('c_m-a-cb-brd', 'm-a-cb-brd', 'm', 'a', 'cb', 'brd', 'Branding', 'Marketing', 'Corporate Division', 'Cleveland Brothers Brand', 'active', 'CSV Import') ON CONFLICT (code) DO NOTHING;
INSERT INTO codes (id, code, dept, bu, init, camp, camp_name, department, business_unit, initiative, status, created_by) VALUES ('c_m-g-ne-att', 'm-g-ne-att', 'm', 'g', 'ne', 'att', 'Construction Attachments', 'Marketing', 'Construction Division', 'New Equipment Sales', 'active', 'CSV Import') ON CONFLICT (code) DO NOTHING;
INSERT INTO codes (id, code, dept, bu, init, camp, camp_name, department, business_unit, initiative, status, created_by) VALUES ('c_m-g-st-stg', 'm-g-st-stg', 'm', 'g', 'st', 'stg', 'SITECH General', 'Marketing', 'Construction Division', 'SITECH', 'active', 'CSV Import') ON CONFLICT (code) DO NOTHING;
INSERT INTO codes (id, code, dept, bu, init, camp, camp_name, department, business_unit, initiative, status, created_by) VALUES ('c_m-a-re-cbu', 'm-a-re-cbu', 'm', 'a', 're', 'cbu', 'Cross Business Unit', 'Marketing', 'Corporate Division', 'Rental', 'active', 'CSV Import') ON CONFLICT (code) DO NOTHING;
INSERT INTO codes (id, code, dept, bu, init, camp, camp_name, department, business_unit, initiative, status, created_by) VALUES ('c_m-e-ne-rep', 'm-e-ne-rep', 'm', 'e', 'ne', 'rep', 'Retail Electric Power', 'Marketing', 'Industrial Engine Division', 'New Equipment Sales', 'active', 'CSV Import') ON CONFLICT (code) DO NOTHING;
INSERT INTO codes (id, code, dept, bu, init, camp, camp_name, department, business_unit, initiative, status, created_by) VALUES ('c_m-e-re-rep', 'm-e-re-rep', 'm', 'e', 're', 'rep', 'Retail Electric Power', 'Marketing', 'Industrial Engine Division', 'Rental', 'active', 'CSV Import') ON CONFLICT (code) DO NOTHING;
INSERT INTO codes (id, code, dept, bu, init, camp, camp_name, department, business_unit, initiative, status, created_by) VALUES ('c_m-e-re-pug', 'm-e-re-pug', 'm', 'e', 're', 'pug', 'Power Used General', 'Marketing', 'Industrial Engine Division', 'Rental', 'active', 'CSV Import') ON CONFLICT (code) DO NOTHING;
INSERT INTO codes (id, code, dept, bu, init, camp, camp_name, department, business_unit, initiative, status, created_by) VALUES ('c_m-e-re-pow', 'm-e-re-pow', 'm', 'e', 're', 'pow', 'Power Rental', 'Marketing', 'Industrial Engine Division', 'Rental', 'active', 'CSV Import') ON CONFLICT (code) DO NOTHING;
INSERT INTO codes (id, code, dept, bu, init, camp, camp_name, department, business_unit, initiative, status, created_by) VALUES ('c_m-g-ps-get', 'm-g-ps-get', 'm', 'g', 'ps', 'get', 'Ground Engaging Tools', 'Marketing', 'Construction Division', 'Product Support', 'active', 'CSV Import') ON CONFLICT (code) DO NOTHING;
INSERT INTO codes (id, code, dept, bu, init, camp, camp_name, department, business_unit, initiative, status, created_by) VALUES ('c_m-g-ps-cva', 'm-g-ps-cva', 'm', 'g', 'ps', 'cva', 'Customer Value Agreement', 'Marketing', 'Construction Division', 'Product Support', 'active', 'CSV Import') ON CONFLICT (code) DO NOTHING;


END
$catalyst$;
