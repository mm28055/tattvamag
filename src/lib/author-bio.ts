// Author bio shown in the red box at the end of every article. Stored in
// the existing site_settings table under key 'author_bio'. Plain text —
// rendered as-is in a styled block.
import "server-only";
import { sql, hasDb } from "./db";

export const DEFAULT_AUTHOR_BIO =
  "Manish Maheshwari is the curator and editor of Tattva. He can be contacted at contact@tattvamag.org. He runs Tattva Heritage Foundation (www.tattvaheritage.org) and Centre for Shaiva Studies (www.shaivastudies.in).";

export async function getAuthorBio(): Promise<string> {
  if (!hasDb) return DEFAULT_AUTHOR_BIO;
  try {
    const rows = (await sql`SELECT value FROM site_settings WHERE key = 'author_bio' LIMIT 1`) as { value: { text: string } | string }[];
    if (rows.length === 0) return DEFAULT_AUTHOR_BIO;
    const v = rows[0].value;
    // Accept either { text: "..." } (JSONB object) or a raw JSONB string.
    if (typeof v === "string") return v || DEFAULT_AUTHOR_BIO;
    if (v && typeof v === "object" && typeof v.text === "string") return v.text || DEFAULT_AUTHOR_BIO;
    return DEFAULT_AUTHOR_BIO;
  } catch {
    return DEFAULT_AUTHOR_BIO;
  }
}

export async function saveAuthorBio(text: string): Promise<void> {
  if (!hasDb) throw new Error("DATABASE_URL not configured");
  await sql`
    INSERT INTO site_settings (key, value, updated_at)
    VALUES ('author_bio', ${JSON.stringify({ text })}::jsonb, NOW())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
  `;
}
