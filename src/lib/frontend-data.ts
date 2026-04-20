// Adapter: my scraped articles → the front-end's Article shape.
// Runs server-side. Results are memoized inside getAllArticles.

import "server-only";
import * as cheerio from "cheerio";
import { getAllArticles as getRawArticles } from "./content";
import type { FrontendArticle, Block } from "./frontend-types";

function escapeFn(s: string): string {
  // Escape quotes for the <fn note="..."> attribute
  return s.replace(/"/g, '\\"').replace(/\s+/g, " ").trim();
}

/** Convert inline HTML to the plain-ish text the prototype's renderer expects:
 *  keeps <fn id="N" note="..." /> tokens, converts <em>/<i> to *...*, strips everything else. */
function htmlToInline(html: string): string {
  if (!html) return "";
  const $ = cheerio.load(`<div>${html}</div>`, { xml: false });
  const root = $("div").first();

  // Convert <em>/<i> to *text* markers
  root.find("em, i").each((_, el) => {
    const $el = $(el);
    $el.replaceWith(`*${$el.text()}*`);
  });

  // Drop <strong>/<b> (keep their text)
  root.find("strong, b").each((_, el) => {
    $(el).replaceWith($(el).text());
  });

  // Drop <br> as space
  root.find("br").each((_, el) => {
    $(el).replaceWith(" ");
  });

  // Unwrap all other inline tags, keeping children as-is
  root.find("a, span").each((_, el) => {
    const $el = $(el);
    // Preserve text but drop attributes
    $el.replaceWith($el.contents());
  });

  // Return the HTML so that any remaining <sup> markers survive; we'll convert those below
  return root.html() || "";
}

/** Walk article body HTML and produce: (1) fullBody blocks and (2) a converted inline form
 *  with <fn id="N" note="..." /> tokens inserted where the footnote refs used to be. */
function buildBlocksAndInline(
  bodyHtml: string,
  footnotes: { num: string; text: string; html: string }[],
): Block[] {
  if (!bodyHtml) return [];

  const footnoteByNum = new Map(footnotes.map((f) => [f.num, f.text]));

  const $ = cheerio.load(`<div id="__root">${bodyHtml}</div>`, { xml: false });

  // Replace every <sup class="footnote-ref" data-ref="N"> with a placeholder text token that
  // our post-processor will turn into <fn id="N" note="..." />.
  $("#__root sup.footnote-ref, #__root sup[data-ref]").each((_, el) => {
    const num = $(el).attr("data-ref") || $(el).text().trim();
    const note = footnoteByNum.get(num) || "";
    $(el).replaceWith(`|||FN:${num}:${escapeFn(note)}|||`);
  });

  const blocks: Block[] = [];
  const root = $("#__root").first();

  root.children().each((_, child) => {
    const $c = $(child);
    const tag = (("tagName" in (child as object) ? (child as { tagName?: string }).tagName : undefined) || (child as { name?: string }).name || "").toLowerCase();

    if (tag === "p") {
      const html = $c.html() || "";
      const inline = htmlToInline(html);
      const finalText = inline
        .replace(/\|\|\|FN:([^:]+):([\s\S]*?)\|\|\|/g, (_m, num, note) => `<fn id="${num}" note="${note}" />`)
        .trim();
      if (finalText) blocks.push({ type: "p", text: finalText });
      return;
    }

    if (tag === "h1" || tag === "h2" || tag === "h3" || tag === "h4") {
      const text = $c.text().trim();
      if (text) blocks.push({ type: "h2", text });
      return;
    }

    if (tag === "blockquote") {
      // Use the first paragraph's text as the pullquote content.
      const text = $c.text().replace(/\s+/g, " ").trim();
      if (text) blocks.push({ type: "pullquote", text });
      return;
    }

    if (tag === "figure") {
      const $img = $c.find("img").first();
      const $cap = $c.find("figcaption, .wp-caption-text").first();
      const src = $img.attr("src") || "";
      const alt = $img.attr("alt") || "";
      const caption = $cap.text().trim();
      blocks.push({
        type: "image",
        src: src || undefined,
        label: alt || caption.slice(0, 60) || "Image",
        caption: caption || undefined,
      });
      return;
    }

    if (tag === "img") {
      const src = $c.attr("src") || "";
      const alt = $c.attr("alt") || "";
      blocks.push({ type: "image", src, label: alt || "Image" });
      return;
    }

    // Skip lists / scripts / other — drop gracefully
    if (tag === "ul" || tag === "ol") {
      // Render as paragraphs of list items
      $c.find("> li").each((_, li) => {
        const t = $(li).text().replace(/\s+/g, " ").trim();
        if (t) blocks.push({ type: "p", text: `• ${t}` });
      });
      return;
    }

    // Fall-through: if it has readable text, wrap as a paragraph
    const text = $c.text().replace(/\s+/g, " ").trim();
    if (text.length > 20) blocks.push({ type: "p", text });
  });

  return blocks;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function toFrontendArticle(a: Awaited<ReturnType<typeof getRawArticles>>[number]): FrontendArticle {
  const tags = (a.tags || []).map((t) => t.name);
  const featured = a.featuredImage || { original: "", local: null };
  const hasImage = !!featured.local;
  const fullBody = buildBlocksAndInline(a.body || "", a.footnotes || []);
  const excerpt = a.metaDescription || fullBody.find((b) => b.type === "p")?.text.replace(/<[^>]+>/g, "") || "";

  return {
    id: a.slug,
    slug: a.slug,
    title: a.title || "",
    subtitle: a.subtitle || "",
    tags,
    author: a.author || "Manish Maheshwari",
    readTime: a.readTime || "",
    body: excerpt.replace(/<fn\s+id="[^"]+"\s+note="[^"]*"\s*\/>/g, "").replace(/\*([^*]+)\*/g, "$1"),
    image: hasImage ? { src: featured.local || undefined, label: a.title } : null,
    heroStyle: hasImage ? "image" : "none",
    frontispiece: hasImage
      ? { src: featured.local || undefined, label: a.illustrator || "", caption: a.illustrator ? `Illustrations by ${a.illustrator}` : undefined }
      : undefined,
    datePublished: formatDate(a.date),
    illustrationCredit: a.illustrator ? `Illustrations by ${a.illustrator}` : undefined,
    fullBody,
  };
}

let _cache: FrontendArticle[] | null = null;
let _cacheAt = 0;
const CACHE_MS = 30_000;

export async function getFrontendArticles(): Promise<FrontendArticle[]> {
  if (_cache && Date.now() - _cacheAt < CACHE_MS) return _cache;
  const raw = await getRawArticles();
  const articles = raw
    .filter((a) => !!a.slug) // defensive: skip any row without a slug
    .map(toFrontendArticle);
  _cache = articles;
  _cacheAt = Date.now();
  return articles;
}

export async function getFrontendArticleBySlug(slug: string): Promise<FrontendArticle | null> {
  const all = await getFrontendArticles();
  return all.find((a) => a.slug === slug) ?? null;
}

export function invalidateFrontendCache() {
  _cache = null;
}
