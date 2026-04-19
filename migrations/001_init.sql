-- Tattvamag initial schema.
-- Articles + comments. Run via: node scripts/run-migration.mjs

CREATE TABLE IF NOT EXISTS articles (
  id                SERIAL PRIMARY KEY,
  slug              TEXT UNIQUE NOT NULL,
  type              TEXT NOT NULL DEFAULT 'essay',  -- essay | note
  title             TEXT NOT NULL,
  subtitle          TEXT,
  meta_description  TEXT,
  date              DATE NOT NULL,
  author            TEXT NOT NULL DEFAULT 'Manish Maheshwari',
  read_time         TEXT,
  illustrator       TEXT,
  category_slug     TEXT NOT NULL,
  category_name     TEXT NOT NULL,
  featured_image    TEXT,              -- public URL path
  body              TEXT NOT NULL,
  footnotes         JSONB NOT NULL DEFAULT '[]'::jsonb,
  tags              JSONB NOT NULL DEFAULT '[]'::jsonb,
  source_url        TEXT,
  published_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS articles_date_idx ON articles(date DESC);
CREATE INDEX IF NOT EXISTS articles_category_idx ON articles(category_slug);
CREATE INDEX IF NOT EXISTS articles_type_idx ON articles(type);

CREATE TABLE IF NOT EXISTS comments (
  id            SERIAL PRIMARY KEY,
  article_slug  TEXT NOT NULL,
  name          TEXT NOT NULL,
  email         TEXT,
  body          TEXT NOT NULL,
  is_approved   BOOLEAN NOT NULL DEFAULT FALSE,
  parent_id     INTEGER REFERENCES comments(id) ON DELETE CASCADE,
  ip_hash       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS comments_slug_idx ON comments(article_slug, is_approved, created_at DESC);
CREATE INDEX IF NOT EXISTS comments_pending_idx ON comments(is_approved, created_at DESC);
