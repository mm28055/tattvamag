-- Site settings (About page + future bits).
CREATE TABLE IF NOT EXISTS site_settings (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed the About page with the default copy. User can edit via /admin/about.
INSERT INTO site_settings (key, value)
VALUES (
  'about',
  '{
    "intro": "Tattva is the intellectual notebook of Manish Maheshwari. It covers Indian textual traditions, philosophy, history, colonial discourse, and the question of how inherited sources of meaning survive under modernity.",
    "bio": "Manish is the founder of the Tattva Heritage Foundation and the Centre for Shaiva Studies, Pondicherry. He publishes under the Karṇāṭa imprint and is based in Mysore.",
    "closing": "This site is updated periodically."
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;
