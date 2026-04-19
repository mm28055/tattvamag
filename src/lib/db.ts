// Neon Postgres connection helper.
// Uses the HTTP driver so it works in every Next.js runtime.
import "server-only";
import { neon, neonConfig } from "@neondatabase/serverless";

// Reuse fetch for every request — helps cold starts.
neonConfig.fetchConnectionCache = true;

if (!process.env.DATABASE_URL && process.env.NODE_ENV === "production") {
  console.warn("[db] DATABASE_URL is not set — falling back to local JSON files.");
}

export const hasDb = !!process.env.DATABASE_URL;

export const sql = hasDb
  ? neon(process.env.DATABASE_URL!)
  : (null as unknown as ReturnType<typeof neon>);

/** Build a snake_cased JSON object into a {field_name: value} row for INSERT. */
export function rowFromObject<T extends Record<string, unknown>>(obj: T): T {
  return obj;
}
