-- Standalone image uploads (media library). Each row points at an object in the
-- Cloudflare R2 bucket; the public URL composes R2_PUBLIC_URL + r2_key.
CREATE TABLE IF NOT EXISTS media (
  id              SERIAL PRIMARY KEY,
  r2_key          TEXT UNIQUE NOT NULL,
  filename        TEXT NOT NULL,
  content_type    TEXT NOT NULL,
  size_bytes      INTEGER NOT NULL,
  width           INTEGER,
  height          INTEGER,
  alt_text        TEXT,
  uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS media_uploaded_at_idx ON media(uploaded_at DESC);
