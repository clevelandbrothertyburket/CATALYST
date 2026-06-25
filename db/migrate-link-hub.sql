CREATE TABLE IF NOT EXISTS cb_short_links (
  id          TEXT PRIMARY KEY,
  slug        TEXT UNIQUE NOT NULL,
  long_url    TEXT NOT NULL,
  title       TEXT,
  created_by  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cb_short_slug ON cb_short_links(slug);
CREATE TABLE IF NOT EXISTS cb_clicks (
  id        BIGSERIAL PRIMARY KEY,
  link_id   TEXT NOT NULL,
  ts        TIMESTAMPTZ NOT NULL DEFAULT now(),
  source    TEXT,
  referrer  TEXT,
  device    TEXT,
  browser   TEXT,
  country   TEXT
);
CREATE INDEX IF NOT EXISTS idx_cb_clicks_link ON cb_clicks(link_id, ts DESC);
