// Content loader. Reads from Neon when DATABASE_URL is set, else falls back to src/data/*.json.
import "server-only";
import fs from "node:fs";
import path from "node:path";
import { sql, hasDb } from "./db";

export type Tag = { slug: string; name: string };
export type Category = { name: string; slug: string };
export type FeaturedImage = { original?: string; local: string | null };
export type Footnote = { num: string; text: string; html: string };

export type Article = {
  slug: string;
  id?: number;
  type: "essay" | "note";
  title: string;
  subtitle: string;
  metaDescription: string;
  date: string;
  author: string;
  readTime: string;
  illustrator: string;
  category: Category;
  tags: Tag[];
  featuredImage: FeaturedImage;
  body: string;
  footnotes: Footnote[];
  sourceUrl?: string;
  /** Manual homepage slot 1-N. When null, falls back to date-DESC ordering. */
  displayOrder?: number | null;
};

const DATA_DIR = path.join(process.cwd(), "src", "data");

// ---- JSON fallback ----
function readFromJson(): Article[] {
  const files = fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_")); // underscore-prefix = support data, skip
  const articles = files.map((f) => {
    const raw = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), "utf-8")) as Article;
    raw.tags = (raw.tags || []).map((t) => ({ ...t, name: toTitleCase(t.name) }));
    raw.type = raw.type || "essay";
    return raw;
  });
  articles.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  return articles;
}

// ---- DB reader ----
type DbRow = {
  slug: string;
  id: number;
  type: string;
  title: string;
  subtitle: string | null;
  meta_description: string | null;
  date: string;
  author: string;
  read_time: string | null;
  illustrator: string | null;
  category_slug: string;
  category_name: string;
  featured_image: string | null;
  body: string;
  footnotes: Footnote[];
  tags: Tag[];
  source_url: string | null;
  display_order: number | null;
};

function rowToArticle(r: DbRow): Article {
  return {
    id: r.id,
    slug: r.slug,
    type: (r.type === "note" ? "note" : "essay"),
    title: r.title,
    subtitle: r.subtitle || "",
    metaDescription: r.meta_description || "",
    date: typeof r.date === "string" ? r.date : new Date(r.date).toISOString().slice(0, 10),
    author: r.author,
    readTime: r.read_time || "",
    illustrator: r.illustrator || "",
    category: { name: r.category_name, slug: r.category_slug },
    tags: (r.tags || []).map((t) => ({ ...t, name: toTitleCase(t.name) })),
    featuredImage: { local: r.featured_image },
    body: r.body,
    footnotes: r.footnotes || [],
    sourceUrl: r.source_url || undefined,
    displayOrder: r.display_order,
  };
}

async function readFromDb(): Promise<Article[]> {
  // Admin-set display_order wins when present; otherwise fall back to newest-first.
  const rows = (await sql`
    SELECT * FROM articles
    ORDER BY display_order ASC NULLS LAST, date DESC, published_at DESC
  `) as DbRow[];
  return rows.map(rowToArticle);
}

// ---- Public API ----
let _cache: Article[] | null = null;
let _cacheAt = 0;
const CACHE_MS = 30_000; // 30s in-memory cache

export async function getAllArticles(): Promise<Article[]> {
  if (_cache && Date.now() - _cacheAt < CACHE_MS) return _cache;
  const articles = hasDb ? await readFromDb() : readFromJson();
  _cache = articles;
  _cacheAt = Date.now();
  return articles;
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const all = await getAllArticles();
  return all.find((a) => a.slug === slug) ?? null;
}

export async function getArticlesByCategory(categorySlug: string): Promise<Article[]> {
  const all = await getAllArticles();
  return all.filter((a) => a.category.slug === categorySlug);
}

export async function getArticlesByTag(tagSlug: string): Promise<Article[]> {
  const all = await getAllArticles();
  return all.filter((a) => a.tags.some((t) => t.slug === tagSlug));
}

export async function getAllTags(): Promise<Tag[]> {
  const all = await getAllArticles();
  const map = new Map<string, Tag>();
  for (const a of all) for (const t of a.tags) map.set(t.slug, t);
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export async function getAllCategories(): Promise<{ category: Category; count: number }[]> {
  const all = await getAllArticles();
  const map = new Map<string, { category: Category; count: number }>();
  for (const a of all) {
    const key = a.category.slug;
    const cur = map.get(key);
    if (cur) cur.count += 1;
    else map.set(key, { category: a.category, count: 1 });
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

export function invalidateContentCache() {
  _cache = null;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function toTitleCase(s: string): string {
  return s
    .split(/\s+/)
    .map((w, i) => {
      if (i > 0 && /^(of|and|the|in|on|to|for|a|an|&)$/i.test(w)) return w.toLowerCase();
      if (/[A-Z]/.test(w.slice(1))) return w;
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ");
}
