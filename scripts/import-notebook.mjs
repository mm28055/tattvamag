// One-time import of the hardcoded notebook seed into Neon.
// Idempotent via ON CONFLICT DO NOTHING.
// Usage: node scripts/import-notebook.mjs
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

const seedPath = path.join(process.cwd(), "src", "data", "_notebook-seed.json");
const entries = JSON.parse(await fs.readFile(seedPath, "utf-8"));

// Convert free-form "14 June 2024" → ISO date. Crude but the seed is only 8 entries.
function parseDate(human) {
  const d = new Date(human);
  if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

// Body can be a string or an array of blocks. The admin textarea edits plain text,
// so we flatten block bodies to \n\n-joined paragraphs on import — images are dropped
// on this one-way import because the seed imagery was a design mock (no real src).
function flattenBody(body) {
  if (typeof body === "string") return body;
  if (!Array.isArray(body)) return "";
  return body
    .map((b) => {
      if (b.type === "p") return b.text;
      if (b.type === "h2") return `## ${b.text}`;
      if (b.type === "pullquote" || b.type === "quote") return `> ${b.text}`;
      if (b.type === "image") return `[image placeholder: ${b.label || ""}]`;
      return "";
    })
    .filter(Boolean)
    .join("\n\n");
}

let inserted = 0, skipped = 0;
for (const e of entries) {
  const result = await sql`
    INSERT INTO notebook_entries (id, title, body, tags, author, date_published)
    VALUES (
      ${e.id},
      ${e.title},
      ${flattenBody(e.body)},
      ${JSON.stringify(e.tags || [])}::jsonb,
      ${e.author || "Manish Maheshwari"},
      ${parseDate(e.datePublished)}
    )
    ON CONFLICT (id) DO NOTHING
    RETURNING id
  `;
  if (result.length) { inserted++; console.log(`  + ${e.id}`); }
  else { skipped++; console.log(`  · ${e.id} (already exists)`); }
}

console.log(`\n✅ Inserted ${inserted}, skipped ${skipped}.`);
