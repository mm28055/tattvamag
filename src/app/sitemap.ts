// XML sitemap for search engines. Next.js auto-exposes this at /sitemap.xml.
// Revalidates every hour — article cadence is slow, no need to hit the DB per crawl.
import type { MetadataRoute } from "next";
import { getAllArticles } from "@/lib/content";
import { getAllNotebookEntriesAsync } from "@/lib/notebook-data";

export const revalidate = 3600;

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.tattva.in").replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, notebook] = await Promise.all([
    getAllArticles(),
    getAllNotebookEntriesAsync(),
  ]);

  const now = new Date();

  // Static top-level pages.
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${SITE_URL}/archive`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/notebook`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];

  // Each article gets its own URL.
  const articleRoutes: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${SITE_URL}/${a.slug}`,
    lastModified: a.date ? new Date(a.date) : now,
    changeFrequency: "yearly",
    priority: 0.7,
  }));

  // Notebook entries are anchors on /notebook, not separate URLs — but we list
  // them with #fragments so sitemap readers that support fragments can jump
  // straight to the entry. Most search engines ignore the fragment and
  // consolidate into /notebook, which is fine.
  const notebookRoutes: MetadataRoute.Sitemap = notebook.map((e) => ({
    url: `${SITE_URL}/notebook#${e.id}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticRoutes, ...articleRoutes, ...notebookRoutes];
}
