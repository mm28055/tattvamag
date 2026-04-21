// Bulk-update the tags JSONB column for the 22 essays so the live site
// reflects the new taxonomy. Matches each row by a distinctive substring
// in its title (slugs vary slightly from what you'd guess), then rewrites
// tags as [{slug, name}] — same shape the admin UI produces.
//
// Usage:  node scripts/retag-articles.mjs [--dry-run]
// Requires DATABASE_URL in .env.local or shell env.
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local" });
config();

if (!process.env.DATABASE_URL) {
  console.error("ERROR: DATABASE_URL is not set. Add it to .env.local first.");
  process.exit(1);
}

const DRY_RUN = process.argv.includes("--dry-run");
const sql = neon(process.env.DATABASE_URL);

function slugify(s) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

// Ordered list of title patterns → desired tag names. The first matching
// pattern wins, so keep more-specific patterns above more-general ones.
const TAG_MAP = [
  { match: /search of navadvipa/i,                 tags: ["Hindu Philosophy", "Navadvipa", "Nyaya Philosophy"] },
  { match: /drunken peacocks/i,                     tags: ["Mattamayura", "Shaivism", "Rajaguru"] },
  { match: /matsyendranatha in stone/i,             tags: ["Matsyendranatha", "Natha Sampradaya", "Sculpture"] },
  { match: /medieval religious cent(er|re) of natha/i, tags: ["Natha Sampradaya", "Mahanubhav", "Maharashtra"] },
  { match: /yoga in stone/i,                        tags: ["Natha Sampradaya", "Yoga Asana", "Sculpture"] },
  { match: /amanaska yoga/i,                        tags: ["Amanaska Yoga", "Rajayoga", "Shaivism"] },
  { match: /manur-?nagnath/i,                       tags: ["Lakulisha", "Pashupata", "Maharashtra"] },
  { match: /rise and decline of shaivism/i,         tags: ["Shaivism", "Gupta Empire", "Agamas"] },
  { match: /yoga bija/i,                            tags: ["Yogabija", "Natha Sampradaya", "Vedanta"] },
  { match: /vedantic heritage of hatha/i,           tags: ["Hatha Yoga", "Vedanta", "Gorakshanatha"] },
  { match: /rupa gosvami/i,                         tags: ["Rupa Goswami", "Bhakti Rasa", "Rasa"] },
  { match: /upanishad teaching in a pali/i,         tags: ["Upanishad", "Atman", "Yajnavalkya"] },
  { match: /dattatreya yoga shastra/i,              tags: ["Dattatreya", "Hatha Yoga", "Yoga Texts"] },
  { match: /amritasiddhi/i,                         tags: ["Amritasiddhi", "Hatha Yoga", "Natha Sampradaya"] },
  { match: /kashi vishvanath/i,                     tags: ["Banaras", "Kashi Vishvanath", "Temples"] },
  { match: /sublime poetry of jnaneshwar/i,         tags: ["Jnaneshvar", "Shakti", "Amritanubhav"] },
  { match: /mantra and sound in tantric/i,          tags: ["Mantra", "Tantra", "Kashmir Shaivism"] },
  { match: /kalividambana/i,                        tags: ["Kalividambana", "Nilakantha Dikshita", "Sanskrit Poetry"] },
  { match: /jaiminiya upanishad/i,                  tags: ["Jaiminiya Brahmana Upanishad", "Samaveda", "Upanishad"] },
  { match: /iconography of brahma/i,                tags: ["Iconography", "Vishnudharmottara", "Shiva"] },
  { match: /economic life of vedic/i,               tags: ["Vedic Society", "Occupations", "Hindu Dharma"] },
  { match: /12th century sanskrit renaissance/i,    tags: ["Bengal", "Sena Kings", "Gita Govinda"] },
];

const rows = await sql`SELECT slug, title, tags FROM articles ORDER BY date DESC`;
console.log(`Found ${rows.length} article(s).\n`);

let matched = 0;
let skipped = 0;
const unmatched = [];

for (const row of rows) {
  const entry = TAG_MAP.find((m) => m.match.test(row.title));
  if (!entry) {
    unmatched.push(row.title);
    skipped++;
    continue;
  }
  const newTags = entry.tags.map((name) => ({ slug: slugify(name), name }));
  const newTagsJson = JSON.stringify(newTags);

  console.log(`  ${row.title}`);
  console.log(`    → ${entry.tags.join(", ")}`);

  if (!DRY_RUN) {
    await sql`UPDATE articles SET tags = ${newTagsJson}::jsonb, updated_at = NOW() WHERE slug = ${row.slug}`;
  }
  matched++;
}

console.log(`\n${DRY_RUN ? "[dry-run] " : ""}Updated ${matched} article(s). Skipped ${skipped}.`);
if (unmatched.length) {
  console.log(`\nNo tag mapping for:\n  - ${unmatched.join("\n  - ")}`);
}

if (!DRY_RUN && matched > 0) {
  console.log(`\n⚠  In-memory content cache (30s TTL) may still serve old tags for ~30s.`);
  console.log(`   A fresh deploy or a request after the TTL expires will pick up the new tags.`);
}
