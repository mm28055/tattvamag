// One-time import: read src/data/*.json and insert into articles table.
// Idempotent via slug (uses ON CONFLICT DO NOTHING).
// Usage: node scripts/import-articles.mjs
import { neon } from "@neondatabase/serverless";
import { promises as fs } from "node:fs";
import path from "node:path";
import { config } from "dotenv";

config({ path: ".env.local" });
config();

if (!process.env.DATABASE_URL) {
  console.error("ERROR: DATABASE_URL not set in .env.local");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

const DATA_DIR = path.join(process.cwd(), "src", "data");
// Skip helper files starting with `_` (e.g. _notebook-seed.json).
const files = (await fs.readdir(DATA_DIR)).filter((f) => f.endsWith(".json") && !f.startsWith("_"));

let inserted = 0;
let skipped = 0;

for (const f of files) {
  const raw = JSON.parse(await fs.readFile(path.join(DATA_DIR, f), "utf-8"));
  const result = await sql`
    INSERT INTO articles (
      slug, type, title, subtitle, meta_description, date, author,
      read_time, illustrator, category_slug, category_name,
      featured_image, body, footnotes, tags, source_url
    ) VALUES (
      ${raw.slug},
      ${raw.type || "essay"},
      ${raw.title},
      ${raw.subtitle || ""},
      ${raw.metaDescription || ""},
      ${raw.date},
      ${raw.author || "Manish Maheshwari"},
      ${raw.readTime || ""},
      ${raw.illustrator || ""},
      ${raw.category?.slug || ""},
      ${raw.category?.name || ""},
      ${raw.featuredImage?.local || null},
      ${raw.body || ""},
      ${JSON.stringify(raw.footnotes || [])}::jsonb,
      ${JSON.stringify(raw.tags || [])}::jsonb,
      ${raw.sourceUrl || null}
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING id
  `;
  if (result.length > 0) {
    inserted++;
    console.log(`  + ${raw.slug}`);
  } else {
    skipped++;
    console.log(`  · ${raw.slug} (already exists)`);
  }
}

console.log(`\n✅ Inserted ${inserted}, skipped ${skipped}.`);
