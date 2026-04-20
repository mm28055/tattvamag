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

/** Decode HTML entities that cheerio's .html() re-encodes.
 *  Keeps our own <fn id=".." note="..." /> tokens intact. */
const NAMED_ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&quot;": '"',
  "&apos;": "'",
  "&lt;": "<",
  "&gt;": ">",
  "&hellip;": "…",
  "&mdash;": "—",
  "&ndash;": "–",
  "&ldquo;": "\u201c",
  "&rdquo;": "\u201d",
  "&lsquo;": "\u2018",
  "&rsquo;": "\u2019",
  "&laquo;": "«",
  "&raquo;": "»",
  "&copy;": "©",
  "&reg;": "®",
  "&trade;": "™",
  "&ensp;": " ",
  "&emsp;": " ",
  "&thinsp;": " ",
  "&middot;": "·",
};

function decodeEntities(s: string): string {
  if (!s) return s;
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&[a-zA-Z]+;/g, (m) => NAMED_ENTITIES[m] ?? m);
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

  const pushBlock = (b: Block) => {
    // Decode entities in any text-bearing block.
    if ("text" in b && b.text) b.text = decodeEntities(b.text);
    if (b.type === "image" && b.caption) b.caption = decodeEntities(b.caption);
    if (b.type === "image" && b.label) b.label = decodeEntities(b.label);
    blocks.push(b);
  };

  root.children().each((_, child) => {
    const $c = $(child);
    const tag = (("tagName" in (child as object) ? (child as { tagName?: string }).tagName : undefined) || (child as { name?: string }).name || "").toLowerCase();

    if (tag === "p") {
      const html = $c.html() || "";

      // WordPress often styles section headings as <p> with a big font-size span + <strong>
      // rather than real <h2>. Promote those to h2 blocks.
      const styledHeadingMatch = html.match(/^\s*<span[^>]*style="[^"]*font-size:\s*(\d+)/i);
      const hasStrong = /<strong[^>]*>/i.test(html);
      const plainText = $c.text().replace(/\s+/g, " ").trim();
      if (styledHeadingMatch && hasStrong && plainText.length > 0 && plainText.length < 140) {
        pushBlock({ type: "h2", text: plainText });
        return;
      }

      const inline = htmlToInline(html);
      const finalText = inline
        .replace(/\|\|\|FN:([^:]+):([\s\S]*?)\|\|\|/g, (_m, num, note) => `<fn id="${num}" note="${note}" />`)
        .trim();
      if (finalText) pushBlock({ type: "p", text: finalText });
      return;
    }

    if (tag === "h1" || tag === "h2" || tag === "h3" || tag === "h4") {
      const text = $c.text().trim();
      if (text) pushBlock({ type: "h2", text });
      return;
    }

    if (tag === "blockquote") {
      // Use the first paragraph's text as the pullquote content.
      const text = $c.text().replace(/\s+/g, " ").trim();
      if (text) pushBlock({ type: "pullquote", text });
      return;
    }

    if (tag === "figure") {
      const $img = $c.find("img").first();
      const $cap = $c.find("figcaption, .wp-caption-text").first();
      const src = $img.attr("src") || "";
      const alt = $img.attr("alt") || "";
      const caption = $cap.text().trim();
      pushBlock({
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
      pushBlock({ type: "image", src, label: alt || "Image" });
      return;
    }

    // Skip lists / scripts / other — drop gracefully
    if (tag === "ul" || tag === "ol") {
      // Render as paragraphs of list items
      $c.find("> li").each((_, li) => {
        const t = $(li).text().replace(/\s+/g, " ").trim();
        if (t) pushBlock({ type: "p", text: `• ${t}` });
      });
      return;
    }

    // Fall-through: if it has readable text, wrap as a paragraph
    const text = $c.text().replace(/\s+/g, " ").trim();
    if (text.length > 20) pushBlock({ type: "p", text });
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
  let fullBody = buildBlocksAndInline(a.body || "", a.footnotes || []);

  // Dedup: if the first body paragraph is (essentially) the subtitle, drop it —
  // the subtitle is already rendered in the header.
  if (a.subtitle && fullBody.length > 0 && fullBody[0].type === "p") {
    const firstText = (fullBody[0].text || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    const subtitleText = a.subtitle.replace(/\s+/g, " ").trim();
    if (firstText === subtitleText || firstText.startsWith(subtitleText) || subtitleText.startsWith(firstText)) {
      fullBody = fullBody.slice(1);
    }
  }

  // Also drop the final "Manish Maheshwari is the curator..." bio paragraph if present
  if (fullBody.length > 0) {
    const last = fullBody[fullBody.length - 1];
    if (last.type === "p" && /is the curator and editor of Tattva/i.test(last.text)) {
      fullBody = fullBody.slice(0, -1);
    }
  }
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
