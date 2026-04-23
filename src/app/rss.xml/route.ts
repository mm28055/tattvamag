// RSS 2.0 feed combining articles + notebook entries, newest first.
// Auto-discovered by RSS readers via the <link rel="alternate"> tag in layout.tsx.
import { getAllArticles } from "@/lib/content";
import { getAllNotebookEntriesAsync } from "@/lib/notebook-data";

export const runtime = "nodejs";
export const revalidate = 600; // Rebuild every 10 min; cheap relative to article cadence.

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://tattva.in").replace(/\/$/, "");
const SITE_TITLE = "Tattva — Celebrating Dharma";
const SITE_DESCRIPTION =
  "Essays and notes on Indian textual traditions, philosophy, history, and colonial discourse — by Manish Maheshwari.";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function rfc822(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  // Feed spec wants RFC-822; toUTCString() happens to produce that format in Node.
  return isNaN(date.getTime()) ? new Date().toUTCString() : date.toUTCString();
}

function excerpt(html: string, max = 400): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

export async function GET() {
  const [articles, notebook] = await Promise.all([
    getAllArticles(),
    getAllNotebookEntriesAsync(),
  ]);

  // Merge into a single dated stream. Notebook entries use datePublished (a human
  // string like "14 June 2024"), which new Date() parses; fallback to today for
  // anything unparseable so the feed never breaks.
  type Item = { title: string; link: string; pubDate: Date; description: string; tags: string[]; guid: string; author: string };
  const items: Item[] = [];

  for (const a of articles) {
    items.push({
      title: a.title,
      link: `${SITE_URL}/${a.slug}`,
      pubDate: new Date(a.date),
      description: a.metaDescription || excerpt(a.body),
      tags: (a.tags || []).map((t) => t.name),
      guid: `${SITE_URL}/${a.slug}`,
      author: a.author,
    });
  }
  for (const e of notebook) {
    const raw = e.datePublished || "";
    const parsed = raw ? new Date(raw) : new Date();
    items.push({
      title: e.title,
      link: `${SITE_URL}/notebook#${e.id}`,
      pubDate: isNaN(parsed.getTime()) ? new Date() : parsed,
      description: excerpt(
        typeof e.body === "string" ? e.body : (e.bodyHtml || ""),
        400,
      ),
      tags: e.tags || [],
      guid: `${SITE_URL}/notebook#${e.id}`,
      author: e.author,
    });
  }

  items.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  const xmlItems = items.map((i) => `
    <item>
      <title>${esc(i.title)}</title>
      <link>${esc(i.link)}</link>
      <guid isPermaLink="true">${esc(i.guid)}</guid>
      <pubDate>${rfc822(i.pubDate)}</pubDate>
      <dc:creator>${esc(i.author)}</dc:creator>
      <description>${esc(i.description)}</description>
      ${i.tags.map((t) => `<category>${esc(t)}</category>`).join("")}
    </item>`).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(SITE_TITLE)}</title>
    <link>${SITE_URL}</link>
    <description>${esc(SITE_DESCRIPTION)}</description>
    <language>en</language>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <lastBuildDate>${rfc822(items[0]?.pubDate || new Date())}</lastBuildDate>
${xmlItems}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=600, stale-while-revalidate=86400",
    },
  });
}
