// About page content — loaded from site_settings in Neon.
// Falls back to default copy when DB is not configured yet.
import "server-only";
import { sql, hasDb } from "./db";

export type AboutContent = {
  intro: string;
  bio: string;
  closing: string;
};

export const DEFAULT_ABOUT: AboutContent = {
  intro:
    "Tattva is the intellectual notebook of Manish Maheshwari. It covers Hindu textual traditions, philosophy, history, colonial discourse, and the question of how inherited sources of meaning survive under modernity.",
  bio:
    "Manish is the founder of the Tattva Heritage Foundation and the Centre for Shaiva Studies, Pondicherry.",
  closing: "This site is updated periodically.",
};

export async function getAbout(): Promise<AboutContent> {
  if (!hasDb) return DEFAULT_ABOUT;
  try {
    const rows = (await sql`SELECT value FROM site_settings WHERE key = 'about' LIMIT 1`) as { value: AboutContent }[];
    if (rows.length === 0) return DEFAULT_ABOUT;
    return { ...DEFAULT_ABOUT, ...rows[0].value };
  } catch {
    return DEFAULT_ABOUT;
  }
}

export async function saveAbout(content: AboutContent) {
  if (!hasDb) throw new Error("DATABASE_URL not configured");
  await sql`
    INSERT INTO site_settings (key, value, updated_at)
    VALUES ('about', ${JSON.stringify(content)}::jsonb, NOW())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
  `;
}
