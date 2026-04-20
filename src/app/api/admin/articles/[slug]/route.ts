// Per-article admin API: GET (fetch), PUT (update), DELETE (remove).
// Mirrors the fields accepted by the create route at src/app/api/admin/articles/route.ts.
import { NextResponse } from "next/server";
import { sql, hasDb } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";
import { invalidateContentCache } from "@/lib/content";
import { saveCoverImage } from "@/lib/r2";
import mammoth from "mammoth";

export const runtime = "nodejs";

const CATEGORIES: Record<string, string> = {
  history: "History",
  "yoga-meditation": "Yoga & Meditation",
  "art-culture": "Art & Culture",
  "religion-philosophy": "Religion & Philosophy",
};

function estimateReadTime(html: string): string {
  const words = html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 220));
  return `${minutes} min read`;
}

async function docxToHtmlAndFootnotes(buf: Buffer): Promise<{
  html: string;
  footnotes: { num: string; text: string; html: string }[];
}> {
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
  let html = result.value;
  const footnotes: { num: string; text: string; html: string }[] = [];
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
  return { html, footnotes };
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

async function requireAuth() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasDb) {
    return NextResponse.json({ error: "DATABASE_URL not configured." }, { status: 503 });
  }
  return null;
}

// ── GET: fetch a single article for the edit form.
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const fail = await requireAuth();
  if (fail) return fail;
  const { slug } = await params;

  const rows = (await sql`SELECT * FROM articles WHERE slug = ${slug} LIMIT 1`) as Array<{
    id: number;
    slug: string;
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
    footnotes: Array<{ num: string; text: string; html: string }>;
    tags: Array<{ slug: string; name: string }>;
    display_order: number | null;
  }>;
  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const r = rows[0];
  return NextResponse.json({
    article: {
      id: r.id,
      slug: r.slug,
      type: r.type,
      title: r.title,
      subtitle: r.subtitle || "",
      metaDescription: r.meta_description || "",
      date: typeof r.date === "string" ? r.date : new Date(r.date).toISOString().slice(0, 10),
      author: r.author,
      readTime: r.read_time || "",
      illustrator: r.illustrator || "",
      categorySlug: r.category_slug,
      categoryName: r.category_name,
      featuredImage: r.featured_image,
      tags: (r.tags || []).map((t) => t.name).join(", "),
      footnoteCount: (r.footnotes || []).length,
      displayOrder: r.display_order,
    },
  });
}

// ── PUT: update fields. Body=multipart form data, same shape as POST, but:
//   - `file` (.docx) is optional → if present, replaces body/footnotes/readTime/metaDescription
//   - `coverImage` is optional  → if present, replaces featured_image
//   - slug is immutable         → changing it would break links
export async function PUT(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const fail = await requireAuth();
  if (fail) return fail;
  const { slug } = await params;

  const existing = (await sql`SELECT slug FROM articles WHERE slug = ${slug} LIMIT 1`) as { slug: string }[];
  if (existing.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const coverImage = form.get("coverImage") as File | null;
  const title = String(form.get("title") || "").trim();
  const subtitle = String(form.get("subtitle") || "").trim();
  const categorySlug = String(form.get("category") || "").trim();
  const tagsRaw = String(form.get("tags") || "").trim();
  const type = String(form.get("type") || "essay").trim() === "note" ? "note" : "essay";
  const illustrator = String(form.get("illustrator") || "").trim();
  const displayOrderRaw = String(form.get("displayOrder") || "").trim();
  // "" or missing → unset (NULL). Otherwise coerce to integer, clamp to sane range.
  const displayOrder: number | null =
    displayOrderRaw === "" ? null : Math.max(1, Math.min(99, parseInt(displayOrderRaw, 10) || 0)) || null;

  if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });
  if (!categorySlug || !CATEGORIES[categorySlug]) {
    return NextResponse.json({ error: "category is required" }, { status: 400 });
  }

  const tagList = tagsRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .map((name) => ({ slug: slugify(name), name }));

  // Optional: new .docx
  let bodyUpdate: { body: string; footnotes: string; meta: string; readTime: string } | null = null;
  if (file && file.size > 0) {
    const buf = Buffer.from(await file.arrayBuffer());
    const { html, footnotes } = await docxToHtmlAndFootnotes(buf);
    const meta = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 300);
    bodyUpdate = {
      body: html,
      footnotes: JSON.stringify(footnotes),
      meta,
      readTime: estimateReadTime(html),
    };
  }

  // Optional: new cover image
  let featuredImagePath: string | null | undefined = undefined; // undefined = leave unchanged
  if (coverImage && coverImage.size > 0) {
    featuredImagePath = await saveCoverImage({
      buffer: Buffer.from(await coverImage.arrayBuffer()),
      slug,
      originalName: coverImage.name,
      contentType: coverImage.type,
    });
  }

  // Build the UPDATE. Neon's tagged-template driver makes conditional sets a little verbose,
  // so we COALESCE against NULL sentinels to keep it one statement.
  const newBody = bodyUpdate?.body ?? null;
  const newFootnotes = bodyUpdate?.footnotes ?? null;
  const newMeta = bodyUpdate?.meta ?? null;
  const newReadTime = bodyUpdate?.readTime ?? null;
  const newFeatured = featuredImagePath ?? null; // null means "don't change" when bodyUpdate absent
  const changeFeatured = featuredImagePath !== undefined;

  await sql`
    UPDATE articles SET
      type              = ${type},
      title             = ${title},
      subtitle          = ${subtitle},
      category_slug     = ${categorySlug},
      category_name     = ${CATEGORIES[categorySlug]},
      illustrator       = ${illustrator},
      tags              = ${JSON.stringify(tagList)}::jsonb,
      body              = COALESCE(${newBody}, body),
      footnotes         = COALESCE(${newFootnotes}::jsonb, footnotes),
      meta_description  = COALESCE(${newMeta}, meta_description),
      read_time         = COALESCE(${newReadTime}, read_time),
      featured_image    = CASE WHEN ${changeFeatured} THEN ${newFeatured} ELSE featured_image END,
      display_order     = ${displayOrder},
      updated_at        = NOW()
    WHERE slug = ${slug}
  `;

  invalidateContentCache();
  return NextResponse.json({ ok: true, slug });
}

// ── DELETE: remove the row. Leaves the R2 cover-image object in place (cheap + reversible).
export async function DELETE(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const fail = await requireAuth();
  if (fail) return fail;
  const { slug } = await params;

  const result = (await sql`DELETE FROM articles WHERE slug = ${slug} RETURNING id`) as { id: number }[];
  if (result.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  // Also delete any comments on the article (ON DELETE CASCADE is on parent_id, not article_slug,
  // so we clean up manually).
  await sql`DELETE FROM comments WHERE article_slug = ${slug}`;
  invalidateContentCache();
  return NextResponse.json({ ok: true });
}
