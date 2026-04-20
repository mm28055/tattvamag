-- Manual homepage ordering.
-- Nullable integer — when set, overrides the date-DESC fallback.
-- Lower numbers come first. Typical usage: 1–7 to fill the homepage slots.
ALTER TABLE articles ADD COLUMN IF NOT EXISTS display_order INTEGER;
CREATE INDEX IF NOT EXISTS articles_display_order_idx ON articles(display_order NULLS LAST, date DESC);
