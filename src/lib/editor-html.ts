// Helpers for round-tripping article HTML between the stored form (what the
// reader pipeline parses) and the rich editor (TipTap), which carries extra
// per-footnote data on the <sup class="footnote-ref"> nodes so editors can
// view and edit notes inline without a separate endnotes panel.
import "server-only";
import * as cheerio from "cheerio";

export type EditorFootnote = { num: string; text: string; html: string };

// Enrich stored body HTML with data-note attributes on each footnote ref so
// the editor can show/edit the note text. Called by the GET endpoint.
export function annotateFootnotesForEditor(bodyHtml: string, footnotes: EditorFootnote[]): string {
  if (!bodyHtml) return "";
  const noteByNum = new Map(footnotes.map((f) => [String(f.num), f.text || stripHtml(f.html || "")]));
  const $ = cheerio.load(`<div id="__root">${bodyHtml}</div>`, { xml: false });
  $("#__root sup.footnote-ref, #__root sup[data-ref]").each((_, el) => {
    const $el = $(el);
    const num = $el.attr("data-ref") || $el.text().trim();
    const note = noteByNum.get(num) || "";
    if (num) $el.attr("data-ref", num);
    if (note) $el.attr("data-note", note);
    // Force the inner text to be just the number — matches what the reader
    // expects and lets the editor render consistently.
    $el.text(num);
    $el.attr("class", "footnote-ref");
  });
  return $("#__root").html() || "";
}

// Extract footnote notes from editor HTML, strip data-note from the output,
// and renumber refs sequentially in order of appearance so the reader always
// sees 1, 2, 3… regardless of what the editor assigned internally. Called by
// the POST/PUT endpoints when htmlBody arrives.
//
// Each <sup> always gets its own fresh sequential number. We deliberately do
// NOT de-duplicate by the editor's existing data-ref value — the editor
// renders numbers via a CSS counter (position-based), so the stored data-ref
// can drift (e.g. copy-paste duplicates it) while the author sees clean
// sequential numbering in the editor. Trusting data-ref caused two distinct
// footnotes to be collapsed into one on save.
export function extractFootnotesFromEditorHtml(
  editorHtml: string,
): { html: string; footnotes: EditorFootnote[] } {
  if (!editorHtml) return { html: "", footnotes: [] };
  const $ = cheerio.load(`<div id="__root">${editorHtml}</div>`, { xml: false });
  const footnotes: EditorFootnote[] = [];
  let counter = 1;

  $("#__root sup.footnote-ref, #__root sup[data-ref]").each((_, el) => {
    const $el = $(el);
    const note = $el.attr("data-note") || "";
    const num = String(counter++);
    footnotes.push({ num, text: note, html: note });
    $el.attr("data-ref", num);
    $el.removeAttr("data-note");
    $el.text(num);
    $el.attr("class", "footnote-ref");
  });

  return { html: $("#__root").html() || "", footnotes };
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

// Many scraped / .docx-ingested articles have the subtitle duplicated as the
// leading <p>. The reader already drops it (see frontend-data.ts), so do the
// same when sending the body to the editor — otherwise the admin sees a stray
// lede paragraph that doesn't show up on the live page.
export function stripLeadingSubtitleParagraph(bodyHtml: string, subtitle: string): string {
  if (!bodyHtml || !subtitle) return bodyHtml;
  const subtitleText = subtitle.replace(/\s+/g, " ").trim();
  if (!subtitleText) return bodyHtml;
  const match = bodyHtml.match(/^\s*<p\b[^>]*>([\s\S]*?)<\/p>/i);
  if (!match) return bodyHtml;
  const firstText = stripHtml(match[1]);
  if (
    firstText === subtitleText ||
    firstText.startsWith(subtitleText) ||
    subtitleText.startsWith(firstText)
  ) {
    return bodyHtml.slice(match[0].length).replace(/^\s+/, "");
  }
  return bodyHtml;
}
