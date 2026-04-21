// Best-effort HTML → markdown conversion for admin edit forms. Used when an
// article's original markdown source wasn't stored (e.g. legacy .docx imports).
// Not round-trip perfect — the edit form tracks the loaded value and only
// re-submits the body when the editor actually changed it, which prevents a
// clean `.docx`-derived HTML from being clobbered by a lossy round-trip.
//
// The input HTML shapes this handles are what our own pipelines produce:
// - Mammoth (.docx → HTML) via src/app/api/admin/articles/route.ts
// - marked (markdown → HTML) via src/lib/markdown.ts
import "server-only";

type Footnote = { num: string; text: string; html: string };

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export function htmlToMarkdown(html: string, footnotes: Footnote[] = []): string {
  let md = html;

  // Footnote refs first — before stripping generic <sup>s.
  md = md.replace(
    /<sup[^>]*class="footnote-ref"[^>]*data-ref="([^"]+)"[^>]*>[\s\S]*?<\/sup>/gi,
    (_m, num) => `[^${num}]`,
  );

  // Headings
  md = md.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_m, inner) => `\n\n# ${inner.trim()}\n\n`);
  md = md.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_m, inner) => `\n\n## ${inner.trim()}\n\n`);
  md = md.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_m, inner) => `\n\n### ${inner.trim()}\n\n`);
  md = md.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, (_m, inner) => `\n\n#### ${inner.trim()}\n\n`);

  // Blockquote (consumes its own <p> children)
  md = md.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_m, inner) => {
    const lines = String(inner)
      .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "$1\n")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    return "\n\n" + lines.map((l) => `> ${l}`).join("\n") + "\n\n";
  });

  // Lists
  md = md.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_m, inner) => {
    const items = [...String(inner).matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map(
      (im) => `- ${im[1].trim()}`,
    );
    return "\n\n" + items.join("\n") + "\n\n";
  });
  md = md.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_m, inner) => {
    const items = [...String(inner).matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map(
      (im, i) => `${i + 1}. ${im[1].trim()}`,
    );
    return "\n\n" + items.join("\n") + "\n\n";
  });

  // Images (handle src/alt in either order)
  md = md.replace(
    /<img\b(?=[^>]*\bsrc="([^"]*)")(?=[^>]*\balt="([^"]*)")[^>]*\/?>/gi,
    (_m, src, alt) => `![${alt}](${src})`,
  );
  md = md.replace(/<img[^>]*src="([^"]*)"[^>]*\/?>/gi, (_m, src) => `![](${src})`);

  // Paragraphs — run after blockquote so nested <p> don't get picked up first.
  md = md.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_m, inner) => `\n\n${inner.trim()}\n\n`);

  // Line break inside text
  md = md.replace(/<br\s*\/?>/gi, "  \n");

  // Horizontal rule
  md = md.replace(/<hr\s*\/?>/gi, "\n\n---\n\n");

  // Inline emphasis
  md = md.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, "**$1**");
  md = md.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, "**$1**");
  md = md.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, "*$1*");
  md = md.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, "*$1*");

  // Links
  md = md.replace(
    /<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi,
    (_m, href, text) => `[${String(text).replace(/\s+/g, " ").trim()}](${href})`,
  );

  // Any remaining tags — drop the wrappers, keep the text.
  md = md.replace(/<\/?(?:span|div|section|article|header|footer|main|nav|figure|figcaption|sup|sub|code|pre)[^>]*>/gi, "");

  md = decodeEntities(md);

  // Collapse excess blank lines.
  md = md.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

  // Append footnote definitions so the ids are editable too.
  if (footnotes.length > 0) {
    const defs = footnotes.map((fn) => {
      const def = fn.text && fn.text.trim()
        ? fn.text.trim()
        : decodeEntities(String(fn.html || "").replace(/<[^>]+>/g, "")).trim();
      return `[^${fn.num}]: ${def}`;
    });
    md += "\n\n" + defs.join("\n");
  }

  return md;
}
