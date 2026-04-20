-- Notebook entries stored in Neon (replacing the hardcoded seed JSON).
-- Entries are short journal posts — just title, body text, tags, date.
-- No cover image, no category, no footnote machinery.
CREATE TABLE IF NOT EXISTS notebook_entries (
  id              TEXT PRIMARY KEY,             -- slug, e.g. "on-gadamers-prejudice"
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,                -- plain text; \n\n separates paragraphs
  tags            JSONB NOT NULL DEFAULT '[]'::jsonb,
  author          TEXT NOT NULL DEFAULT 'Manish Maheshwari',
  date_published  DATE NOT NULL DEFAULT CURRENT_DATE,
  display_order   INTEGER,                       -- nullable; pinned entries show first
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notebook_entries_order_idx
  ON notebook_entries(display_order NULLS LAST, date_published DESC);
