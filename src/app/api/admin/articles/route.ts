// Admin article upload. Accepts multipart form data:
//   - file:       .docx
//   - coverImage: JPEG/PNG (optional)
//   - title, subtitle, category, tags (comma-sep), type, slug (optional)
// Converts .docx → HTML via Mammoth, preserves footnotes via custom style map,
// saves cover image to public/images/featured/, inserts row into articles table,
// returns the new slug.
import { NextResponse } from "next/server";
import { sql, hasDb } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";
import { invalidateContentCache } from "@/lib/content";
import { saveCoverImage } from "@/lib/r2";
import { markdownToArticleHtml } from "@/lib/markdown";
import { extractFootnotesFromEditorHtml } from "@/lib/editor-html";
import { revalidatePublicContent } from "@/lib/revalidate";
import mammoth from "mammoth";

export const runtime = "nodejs";

const CATEGORIES: Record<string, string> = {
  history: "History",
  "yoga-meditation": "Yoga & Meditation",
  "art-culture": "Art & Culture",
  "religion-philosophy": "Religion & Philosophy",
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

function estimateReadTime(html: string): string {
  const words = html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 220));
  return `${minutes} min read`;
}

export async function POST(req: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasDb) {
    return NextResponse.json({ error: "DATABASE_URL not configured." }, { status: 503 });
  }

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const markdownBody = String(form.get("markdownBody") || "").trim();
  const htmlBody = String(form.get("htmlBody") || "").trim();
  const coverImage = form.get("coverImage") as File | null;
  const title = String(form.get("title") || "").trim();
  const subtitle = String(form.get("subtitle") || "").trim();
  const categorySlug = String(form.get("category") || "").trim();
  const tagsRaw = String(form.get("tags") || "").trim();
  const type = (String(form.get("type") || "essay").trim() === "note") ? "note" : "essay";
  const illustrator = String(form.get("illustrator") || "").trim();
  const customSlug = String(form.get("slug") || "").trim();

  // Require one of: .docx upload, typed markdown body, or rich-editor HTML.
  if (!file && !markdownBody && !htmlBody) {
    return NextResponse.json({ error: "Upload a .docx, type a body in markdown, or write one in the editor." }, { status: 400 });
  }
  if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });
  if (!categorySlug || !CATEGORIES[categorySlug]) {
    return NextResponse.json({ error: "category is required" }, { status: 400 });
  }

  let html: string;
  const footnotes: { num: string; text: string; html: string }[] = [];

  if (file) {
    // ── Convert .docx to HTML via Mammoth (existing path)
    const buf = Buffer.from(await file.arrayBuffer());
    const result = await mammoth.convertToHtml(
      { buffer: buf },
      {
        styleMap: [
          "p[style-name='Title'] => h1",
          "p[style-name='Heading 1'] => h2",
          "p[style-name='Heading 2'] => h3",
          "p[style-name='Heading 3'] => h4",
          "p[style-name='Block Text'] => blockquote > p",
          "p[style-name='Quote'] => blockquote > p",
        ],
      },
    );
    html = result.value;

    // Extract footnotes section (Mammoth appends an <ol> at the end)
    const olMatch = html.match(/<ol>\s*(<li[\s\S]*?)\s*<\/ol>\s*$/);
    if (olMatch) {
      const liRegex = /<li id="footnote-(\d+)">([\s\S]*?)<\/li>/g;
      let m: RegExpExecArray | null;
      while ((m = liRegex.exec(olMatch[1])) !== null) {
        const num = m[1];
        const inner = m[2]
          .replace(/<a[^>]*href="#footnote-ref-\d+"[^>]*>[\s\S]*?<\/a>/g, "")
          .replace(/<p>/g, "")
          .replace(/<\/p>/g, " ")
          .trim();
        const text = inner.replace(/<[^>]+>/g, "").trim();
        footnotes.push({ num, text, html: inner });
      }
      html = html.replace(olMatch[0], "");
    }

    html = html.replace(
      /<sup><a[^>]*id="footnote-ref-(\d+)"[^>]*>\[\d+\]<\/a><\/sup>/g,
      (_m, num) => `<sup class="footnote-ref" data-ref="${num}">${num}</sup>`,
    );
  } else if (markdownBody) {
    // ── Convert typed markdown to HTML. Handles pandoc-style footnotes
    // ([^n] references + [^n]: definitions) the same way the .docx path does.
    const parsed = await markdownToArticleHtml(markdownBody);
    html = parsed.html;
    footnotes.push(...parsed.footnotes);
  } else {
    // ── Rich-editor HTML path. Extract footnote notes from data-note attrs,
    // renumber sequentially, and strip data-note from the stored body.
    const extracted = extractFootnotesFromEditorHtml(htmlBody);
    html = extracted.html;
    footnotes.push(...extracted.footnotes);
  }

  // ── Slug
  const slug = slugify(customSlug || title);
  if (!slug) return NextResponse.json({ error: "Could not derive a slug" }, { status: 400 });

  // Collision check
  const existing = (await sql`SELECT id FROM articles WHERE slug = ${slug} LIMIT 1`) as { id: number }[];
  if (existing.length > 0) {
    return NextResponse.json({ error: `Slug "${slug}" already exists. Use a different title or set a custom slug.` }, { status: 409 });
  }

  // ── Save cover image if provided. Uses Cloudflare R2 when configured,
  // otherwise writes to public/images/featured/ for local development.
  let featuredImagePath: string | null = null;
  if (coverImage && coverImage.size > 0) {
    featuredImagePath = await saveCoverImage({
      buffer: Buffer.from(await coverImage.arrayBuffer()),
      slug,
      originalName: coverImage.name,
      contentType: coverImage.type,
    });
  }

  // ── Tags
  const tagList = tagsRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .map((name) => ({ slug: slugify(name), name }));

  const metaDescription = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 300);

  // ── Insert into DB. Store markdown source when the body was typed as
  // markdown so the edit form can round-trip it. .docx uploads leave
  // body_markdown NULL (GET will synthesize from HTML for the edit UI).
  const bodyMarkdownSource: string | null = file ? null : markdownBody;
  await sql`
    INSERT INTO articles (
      slug, type, title, subtitle, meta_description, date, author,
      read_time, illustrator, category_slug, category_name,
      featured_image, body, body_markdown, footnotes, tags
    ) VALUES (
      ${slug},
      ${type},
      ${title},
      ${subtitle},
      ${metaDescription},
      CURRENT_DATE,
      ${"Manish Maheshwari"},
      ${estimateReadTime(html)},
      ${illustrator},
      ${categorySlug},
      ${CATEGORIES[categorySlug]},
      ${featuredImagePath},
      ${html},
      ${bodyMarkdownSource},
      ${JSON.stringify(footnotes)}::jsonb,
      ${JSON.stringify(tagList)}::jsonb
    )
  `;

  invalidateContentCache();
  revalidatePublicContent({ articleSlug: slug });
  return NextResponse.json({ ok: true, slug, footnoteCount: footnotes.length });
}
