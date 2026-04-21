-- Store the markdown source for articles authored or edited via the typed
-- composer. The admin edit form loads this back into the textarea so the
-- editor can tweak prose in place instead of rewriting from scratch.
--
-- Nullable — rows imported from .docx will be NULL here, and the edit form
-- falls back to a best-effort HTML → markdown conversion for those.
ALTER TABLE articles ADD COLUMN IF NOT EXISTS body_markdown TEXT;
