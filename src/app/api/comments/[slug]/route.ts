// Public comments endpoint for a single article.
// GET → list approved comments newest-first.
// POST → submit a new comment (pending moderation).
import { NextResponse } from "next/server";
import { sql, hasDb } from "@/lib/db";
import { createHash } from "node:crypto";

export const runtime = "nodejs";

type CommentRow = {
  id: number;
  article_slug: string;
  name: string;
  email: string | null;
  body: string;
  parent_id: number | null;
  created_at: string;
};

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  if (!hasDb) return NextResponse.json({ comments: [] });
  const { slug } = await ctx.params;
  const rows = (await sql`
    SELECT id, article_slug, name, email, body, parent_id, created_at
    FROM comments
    WHERE article_slug = ${slug} AND is_approved = TRUE
    ORDER BY created_at ASC
  `) as CommentRow[];
  return NextResponse.json({
    comments: rows.map((r) => ({
      id: r.id,
      articleSlug: r.article_slug,
      name: r.name,
      body: r.body,
      parentId: r.parent_id,
      createdAt: r.created_at,
    })),
  });
}

export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  if (!hasDb) return NextResponse.json({ error: "Comments disabled — database not configured." }, { status: 503 });

  const { slug } = await ctx.params;
  const data = await req.json().catch(() => ({}));
  const name = String(data.name || "").trim().slice(0, 80);
  const email = String(data.email || "").trim().slice(0, 200) || null;
  const body = String(data.body || "").trim();
  const honeypot = String(data.website || ""); // honeypot field — bots fill this
  const parentId = data.parentId ? Number(data.parentId) : null;

  if (honeypot) {
    // Silently accept to not tip off bots, but don't store
    return NextResponse.json({ ok: true });
  }
  if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });
  if (!body || body.length < 2) return NextResponse.json({ error: "Comment is too short." }, { status: 400 });
  if (body.length > 4000) return NextResponse.json({ error: "Comment is too long." }, { status: 400 });

  // Basic URL-only spam heuristic: reject if >3 URLs
  const urlCount = (body.match(/https?:\/\//g) || []).length;
  if (urlCount > 3) return NextResponse.json({ error: "Too many links." }, { status: 400 });

  // Hash the IP so we can rate-limit without storing PII
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "";
  const ipHash = ip ? createHash("sha256").update(ip).digest("hex").slice(0, 24) : null;

  // Rate-limit: no more than 5 pending from same IP in last hour
  if (ipHash) {
    const recent = (await sql`
      SELECT COUNT(*)::int AS n FROM comments
      WHERE ip_hash = ${ipHash} AND created_at > NOW() - INTERVAL '1 hour'
    `) as { n: number }[];
    if ((recent[0]?.n || 0) >= 5) {
      return NextResponse.json({ error: "Too many submissions — try again later." }, { status: 429 });
    }
  }

  await sql`
    INSERT INTO comments (article_slug, name, email, body, parent_id, ip_hash, is_approved)
    VALUES (${slug}, ${name}, ${email}, ${body}, ${parentId}, ${ipHash}, FALSE)
  `;
  return NextResponse.json({ ok: true, pending: true });
}
