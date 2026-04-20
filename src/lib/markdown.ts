// Markdown → HTML for typed article bodies. Extracts footnotes in the same
// shape the .docx path produces, so the article renderer doesn't care where
// the body came from.
import "server-only";
import { marked } from "marked";

export type Footnote = { num: string; text: string; html: string };

/**
 * Footnote syntax supported (standard "pandoc" style):
 *   A reference: ...the thing[^1] in the text...
 *   A definition (anywhere, usually at the end of the doc):
 *     [^1]: The footnote text, can contain *markdown*.
 *
 * Labels can be any word (`[^thompson]`), but we renumber sequentially in
 * order of first-reference so the reader sees 1, 2, 3… regardless of what
 * the author used as an internal label.
 */
export async function markdownToArticleHtml(
  md: string,
): Promise<{ html: string; footnotes: Footnote[]; metaDescription: string; readTime: string }> {
  // 1. Pull all "[^LABEL]: definition" lines out of the body.
  const defs = new Map<string, string>(); // label → raw markdown definition
  const defRegex = /^[ \t]*\[\^([^\]]+)\]:[ \t]*(.+?)[ \t]*$/gm;
  let dm: RegExpExecArray | null;
  while ((dm = defRegex.exec(md)) !== null) {
    defs.set(dm[1], dm[2]);
  }
  const bodyMd = md.replace(defRegex, "").replace(/\n{3,}/g, "\n\n").trim();

  // 2. Walk the body for references in order of first appearance; assign 1..N.
  const refRegex = /\[\^([^\]]+)\]/g;
  const labelToNum = new Map<string, string>();
  const footnotes: Footnote[] = [];
  let counter = 1;
  let rm: RegExpExecArray | null;
  while ((rm = refRegex.exec(bodyMd)) !== null) {
    const label = rm[1];
    if (labelToNum.has(label)) continue;
    const num = String(counter++);
    labelToNum.set(label, num);
    const defMd = defs.get(label) || "";
    const defHtmlRaw = defMd ? await marked.parseInline(defMd) : "";
    const text = defMd.replace(/[*_`]/g, "").trim();
    footnotes.push({ num, text, html: defHtmlRaw });
  }

  // 3. Replace references in the body with the same <sup> the .docx path emits.
  const bodyWithRefs = bodyMd.replace(refRegex, (_m, label) => {
    const num = labelToNum.get(label) || label;
    return `<sup class="footnote-ref" data-ref="${num}">${num}</sup>`;
  });

  // 4. Run marked on the cleaned-up body. Raw HTML (the <sup> we just inserted)
  //    passes through untouched.
  const html = await marked.parse(bodyWithRefs, { breaks: false, gfm: true });

  // 5. Metadata derived from the rendered HTML — matches the .docx pipeline.
  const plain = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const metaDescription = plain.slice(0, 300);
  const words = plain.split(/\s+/).filter(Boolean).length;
  const readTime = `${Math.max(1, Math.round(words / 220))} min read`;

  return { html, footnotes, metaDescription, readTime };
}
