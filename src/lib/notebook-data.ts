// Notebook entries. Reads from Neon when DATABASE_URL is set; falls back to the
// hardcoded seed JSON when running without a database (e.g. first-time local dev).
import "server-only";
import seed from "@/data/_notebook-seed.json";
import { sql, hasDb } from "./db";
import type { FrontendNotebookEntry } from "./frontend-types";

type DbRow = {
  id: string;
  title: string;
  body: string;
  tags: string[];
  author: string;
  date_published: string;
  display_order: number | null;
};

function formatLongDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return iso;
  }
}

function rowToEntry(r: DbRow): FrontendNotebookEntry {
  return {
    id: r.id,
    title: r.title,
    tags: r.tags || [],
    author: r.author,
    datePublished: formatLongDate(typeof r.date_published === "string"
      ? r.date_published
      : new Date(r.date_published).toISOString().slice(0, 10)),
    body: r.body, // Rendered as a plain string — \n\n splits paragraphs on the frontend.
  };
}

// In-memory cache so the homepage + /notebook page don't each hit Neon.
let _cache: FrontendNotebookEntry[] | null = null;
let _cacheAt = 0;
const CACHE_MS = 30_000;

async function readFromDb(): Promise<FrontendNotebookEntry[]> {
  const rows = (await sql`
    SELECT * FROM notebook_entries
    ORDER BY display_order ASC NULLS LAST, date_published DESC
  `) as DbRow[];
  return rows.map(rowToEntry);
}

function readFromSeed(): FrontendNotebookEntry[] {
  return seed as FrontendNotebookEntry[];
}

/** Sync wrapper kept for backward compatibility with existing callers; first call
 *  may return the seed before the async refresh finishes. Most callers should use
 *  the async variant below when possible. */
export function getAllNotebookEntries(): FrontendNotebookEntry[] {
  if (_cache) return _cache;
  // Kick off an async refresh but return the seed synchronously for the first request.
  // Subsequent requests (within CACHE_MS) hit the cache.
  if (hasDb) {
    void refreshCache();
  }
  return readFromSeed();
}

async function refreshCache() {
  if (_cache && Date.now() - _cacheAt < CACHE_MS) return;
  try {
    _cache = await readFromDb();
    _cacheAt = Date.now();
  } catch {
    // Leave the seed-backed result in place on DB errors.
  }
}

/** Prefer this in server components — returns fresh DB data when available. */
export async function getAllNotebookEntriesAsync(): Promise<FrontendNotebookEntry[]> {
  if (!hasDb) return readFromSeed();
  if (_cache && Date.now() - _cacheAt < CACHE_MS) return _cache;
  try {
    _cache = await readFromDb();
    _cacheAt = Date.now();
    return _cache;
  } catch {
    return readFromSeed();
  }
}

export function getNotebookEntryById(id: string): FrontendNotebookEntry | null {
  return getAllNotebookEntries().find((e) => e.id === id) ?? null;
}

export function invalidateNotebookCache() {
  _cache = null;
}
