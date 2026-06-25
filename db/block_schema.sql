DO $catalyst$
BEGIN
-- ============================================================
--  CATALYST — complete go-live database setup (single paste)
--  Run this once in Neon's SQL Editor (Vercel > Storage > your DB > Query).
--  Creates all tables, loads taxonomy + campaign codes, and creates the
--  admin login below. Safe to re-run (idempotent).
--
--    Sign in:  tburket@clevelandbrothers.com
--    Password: Trackers08!!
--  (The password is stored only as the bcrypt hash below, never in plaintext.)
-- ============================================================

-- ============ SCHEMA ============
-- Cleveland Brothers Campaign Code Portal — schema
-- Postgres (Neon). Run via db/setup.mjs.

-- ---------- users ----------
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'user',  -- 'admin' | 'approver' | 'user' | 'viewer'
  password_hash TEXT,                          -- null until real auth/SSO; prototype uses magic select
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- taxonomy (controlled vocabulary) ----------
CREATE TABLE IF NOT EXISTS departments (
  code TEXT PRIMARY KEY,           -- e.g. 'm'
  name TEXT NOT NULL               -- e.g. 'Marketing'
);

CREATE TABLE IF NOT EXISTS business_units (
  code TEXT PRIMARY KEY,           -- e.g. 'g'
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS initiatives (
  bu_code TEXT NOT NULL REFERENCES business_units(code),
  code    TEXT NOT NULL,           -- e.g. 'ne'
  name    TEXT NOT NULL,
  PRIMARY KEY (bu_code, code)
);

CREATE TABLE IF NOT EXISTS campaign_vocab (
  init_code TEXT NOT NULL,         -- initiative code this campaign belongs to
  code      TEXT NOT NULL,         -- e.g. 'bno'
  name      TEXT NOT NULL,
  PRIMARY KEY (init_code, code)
);

-- ---------- campaign codes (the registry, with lifecycle) ----------
-- status lifecycle: pending -> active -> deprecated -> retired  (+ rejected, archived)
CREATE TABLE IF NOT EXISTS codes (
  id            TEXT PRIMARY KEY,
  code          TEXT UNIQUE NOT NULL,           -- 'm-g-ne-bno'
  dept          TEXT NOT NULL,
  bu            TEXT NOT NULL,
  init          TEXT NOT NULL,
  camp          TEXT NOT NULL,
  camp_name     TEXT NOT NULL,
  department    TEXT NOT NULL,
  business_unit TEXT NOT NULL,
  initiative    TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'active',  -- pending|active|deprecated|retired|rejected|archived
  created_by    TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_codes_status ON codes(status);
CREATE INDEX IF NOT EXISTS idx_codes_bu ON codes(bu);

-- ---------- approval requests ----------
-- A request to create a new code (or change a code's lifecycle). Admins/approvers act on it.
CREATE TABLE IF NOT EXISTS approval_requests (
  id            TEXT PRIMARY KEY,
  kind          TEXT NOT NULL,                  -- 'create_code' | 'change_status'
  code_id       TEXT,                           -- set for change_status; null for create until approved
  proposed      JSONB NOT NULL,                 -- the proposed code payload or {status: ...}
  status        TEXT NOT NULL DEFAULT 'pending',-- pending | approved | rejected | changes_requested
  note          TEXT,                           -- requester's note
  decision_note TEXT,                           -- approver's reason
  requested_by  TEXT NOT NULL,
  requested_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_by    TEXT,
  decided_at    TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_appr_status ON approval_requests(status);

-- ---------- utm links (history) ----------
CREATE TABLE IF NOT EXISTS links (
  id          TEXT PRIMARY KEY,
  code        TEXT NOT NULL,
  campaign    TEXT NOT NULL,                    -- utm_campaign value (clevelandbrothers-...)
  content     TEXT NOT NULL,                    -- utm_content
  medium      TEXT NOT NULL,                    -- utm_medium
  title       TEXT NOT NULL,                    -- utm_term
  base_url    TEXT NOT NULL,
  url         TEXT NOT NULL,
  created_by  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_links_code ON links(code);

-- ---------- audit log ----------
CREATE TABLE IF NOT EXISTS audit_log (
  id         BIGSERIAL PRIMARY KEY,
  actor      TEXT NOT NULL,
  action     TEXT NOT NULL,                     -- e.g. 'code.created','code.status_changed','request.approved'
  entity     TEXT NOT NULL,                     -- 'code' | 'request' | 'link' | 'taxonomy'
  entity_id  TEXT,
  before     JSONB,
  after      JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_log(created_at DESC);

-- ---------- short links + QR (Bitly) ----------
CREATE TABLE IF NOT EXISTS short_links (
  id           TEXT PRIMARY KEY,
  link_id      TEXT,                              -- optional FK to links.id (the UTM it shortens)
  long_url     TEXT NOT NULL,                     -- the full tagged URL sent to Bitly
  short_url    TEXT NOT NULL,                     -- bit.ly/... returned
  bitly_id     TEXT,                              -- Bitly's own id (e.g. bit.ly/abc123)
  title        TEXT,
  created_by   TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_short_link_id ON short_links(link_id);



END
$catalyst$;
