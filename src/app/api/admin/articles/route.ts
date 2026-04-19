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
import mammoth from "mammoth";
import { promises as fs } from "node:fs";
import path from "node:path";

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
  const coverImage = form.get("coverImage") as File | null;
  const title = String(form.get("title") || "").trim();
  const subtitle = String(form.get("subtitle") || "").trim();
  const categorySlug = String(form.get("category") || "").trim();
  const tagsRaw = String(form.get("tags") || "").trim();
  const type = (String(form.get("type") || "essay").trim() === "note") ? "note" : "essay";
  const illustrator = String(form.get("illustrator") || "").trim();
  const customSlug = String(form.get("slug") || "").trim();

  if (!file) return NextResponse.json({ error: "file is required" }, { status: 400 });
  if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });
  if (!categorySlug || !CATEGORIES[categorySlug]) {
    return NextResponse.json({ error: "category is required" }, { status: 400 });
  }

  // ── Convert .docx to HTML
  const buf = Buffer.from(await file.arrayBuffer());
  const result = await mammoth.convertToHtml(
    { buffer: buf },
    {
      // Map common Word styles to semantic HTML
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

  // Mammoth emits footnotes as:
  //   inline: <sup><a href="#footnote-N">[N]</a></sup>
  //   list:   <ol><li id="footnote-N"> ... </li></ol>
  // We want inline: <sup class="footnote-ref" data-ref="N">N</sup> and a footnotes array.
  let html = result.value;
  const footnotes: { num: string; text: string; html: string }[] = [];

  // Extract the footnotes section (Mammoth appends an <ol> at the end of the value)
  const olMatch = html.match(/<ol>\s*(<li[\s\S]*?)\s*<\/ol>\s*$/);
  if (olMatch) {
    const liRegex = /<li id="footnote-(\d+)">([\s\S]*?)<\/li>/g;
    let m: RegExpExecArray | null;
    while ((m = liRegex.exec(olMatch[1])) !== null) {
      const num = m[1];
      const inner = m[2]
        .replace(/<a[^>]*href="#footnote-ref-\d+"[^>]*>[\s\S]*?<\/a>/g, "") // strip back-link
        .replace(/<p>/g, "")
        .replace(/<\/p>/g, " ")
        .trim();
      const text = inner.replace(/<[^>]+>/g, "").trim();
      footnotes.push({ num, text, html: inner });
    }
    html = html.replace(olMatch[0], "");
  }

  // Rewrite inline markers
  html = html.replace(
    /<sup><a[^>]*id="footnote-ref-(\d+)"[^>]*>\[\d+\]<\/a><\/sup>/g,
    (_m, num) => `<sup class="footnote-ref" data-ref="${num}">${num}</sup>`,
  );

  // ── Slug
  const slug = slugify(customSlug || title);
  if (!slug) return NextResponse.json({ error: "Could not derive a slug" }, { status: 400 });

  // Collision check
  const existing = (await sql`SELECT id FROM articles WHERE slug = ${slug} LIMIT 1`) as { id: number }[];
  if (existing.length > 0) {
    return NextResponse.json({ error: `Slug "${slug}" already exists. Use a different title or set a custom slug.` }, { status: 409 });
  }

  // ── Save cover image if provided
  let featuredImagePath: string | null = null;
  if (coverImage && coverImage.size > 0) {
    const ext = (coverImage.name.split(".").pop() || "jpg").toLowerCase();
    const safeExt = /^(jpg|jpeg|png|webp)$/i.test(ext) ? ext : "jpg";
    const filename = `${slug}.${safeExt}`;
    const dir = path.join(process.cwd(), "public", "images", "featured");
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, filename), Buffer.from(await coverImage.arrayBuffer()));
    featuredImagePath = `/images/featured/${filename}`;
  }

  // ── Tags
  const tagList = tagsRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .map((name) => ({ slug: slugify(name), name }));

  const metaDescription = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 300);

  // ── Insert into DB
  await sql`
    INSERT INTO articles (
      slug, type, title, subtitle, meta_description, date, author,
      read_time, illustrator, category_slug, category_name,
      featured_image, body, footnotes, tags
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
      ${JSON.stringify(footnotes)}::jsonb,
      ${JSON.stringify(tagList)}::jsonb
    )
  `;

  invalidateContentCache();
  return NextResponse.json({ ok: true, slug, footnoteCount: footnotes.length });
}
