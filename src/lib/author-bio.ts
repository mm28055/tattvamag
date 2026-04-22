import "server-only";
import { sql, hasDb } from "./db";

const DEFAULT_BIOS: Record<string, string> = {
  "Manish Maheshwari":
    "Manish Maheshwari is the curator and editor of Tattva. He can be contacted at contact@tattva.in. He runs Tattva Heritage Foundation (www.tattvaheritage.org) and Centre for Shaiva Studies (www.shaivastudies.in).",
};

export async function getAuthorBios(): Promise<Record<string, string>> {
  if (!hasDb) return DEFAULT_BIOS;
  try {
    const rows = (await sql`SELECT value FROM site_settings WHERE key = 'author_bios' LIMIT 1`) as { value: unknown }[];
    if (rows.length > 0 && rows[0].value && typeof rows[0].value === "object") {
      return rows[0].value as Record<string, string>;
    }
    // Fall back to legacy single-bio entry and seed it into the new format.
    const legacy = (await sql`SELECT value FROM site_settings WHERE key = 'author_bio' LIMIT 1`) as { value: { text: string } | string }[];
    if (legacy.length > 0) {
      const v = legacy[0].value;
      const text = typeof v === "string" ? v : v?.text || "";
      if (text) return { "Manish Maheshwari": text };
    }
    return DEFAULT_BIOS;
  } catch {
    return DEFAULT_BIOS;
  }
}

export async function saveAuthorBios(bios: Record<string, string>): Promise<void> {
  if (!hasDb) throw new Error("DATABASE_URL not configured");
  await sql`
    INSERT INTO site_settings (key, value, updated_at)
    VALUES ('author_bios', ${JSON.stringify(bios)}::jsonb, NOW())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
  `;
}
