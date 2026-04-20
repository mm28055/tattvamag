// Apply SQL migrations to the Neon database.
// Usage:  node scripts/run-migration.mjs
// Requires DATABASE_URL in .env.local or shell env.
import { neon } from "@neondatabase/serverless";
import { promises as fs } from "node:fs";
import path from "node:path";
import { config } from "dotenv";

// Load .env.local if present
config({ path: ".env.local" });
config();

if (!process.env.DATABASE_URL) {
  console.error("ERROR: DATABASE_URL is not set. Add it to .env.local first.");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

const dir = path.join(process.cwd(), "migrations");
const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".sql")).sort();

console.log(`Found ${files.length} migration file(s).\n`);

for (const f of files) {
  console.log(`  → ${f}`);
  const text = await fs.readFile(path.join(dir, f), "utf-8");
  // neon() requires tagged template for parameterized queries, but accepts raw strings via sql.unsafe
  // or by calling as a function. We'll split on semicolons and run each statement.
  // Strip full-line comments so statements beginning with a header like
  // "-- Tattvamag initial schema." don't get filtered out.
  const stripComments = (s) =>
    s
      .split("\n")
      .filter((line) => !/^\s*--/.test(line))
      .join("\n")
      .trim();
  const statements = text
    .split(/;\s*$/m)
    .map(stripComments)
    .filter(Boolean);
  for (const stmt of statements) {
    // Raw (non-parameterised) DDL must use sql.query in current @neondatabase/serverless.
    await sql.query(stmt);
  }
  console.log(`     applied ${statements.length} statement(s)`);
}

console.log("\n✅ Migrations complete.");
