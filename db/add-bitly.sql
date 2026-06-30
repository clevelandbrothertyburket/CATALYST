-- Bitly integration: store the Bitly id/link alongside each Catalyst short link.
ALTER TABLE cb_short_links ADD COLUMN IF NOT EXISTS bitly_id   TEXT;
ALTER TABLE cb_short_links ADD COLUMN IF NOT EXISTS bitly_link TEXT;
