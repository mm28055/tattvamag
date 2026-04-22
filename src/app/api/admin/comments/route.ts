// Admin endpoints for comment moderation.
// GET  /api/admin/comments?filter=pending|approved → list
// POST /api/admin/comments { article_slug, name, email?, body, created_at? } → insert as approved (for migration)
// PATCH /api/admin/comments { id, action: "approve" } → approve
// DELETE /api/admin/comments { id } → delete
import { NextResponse } from "next/server";
import { sql, hasDb } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";

export const runtime = "nodejs";

async function requireAuth() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET(req: Request) {
  const auth = await requireAuth();
  if (auth) return auth;
  if (!hasDb) return NextResponse.json({ comments: [] });

  const url = new URL(req.url);
  const filter = url.searchParams.get("filter") || "pending";
  const approved = filter === "approved";

  const rows = (await sql`
    SELECT id, article_slug, name, email, body, parent_id, is_approved, created_at
    FROM comments
    WHERE is_approved = ${approved}
    ORDER BY created_at DESC
    LIMIT 200
  `) as {
    id: number;
    article_slug: string;
    name: string;
    email: string | null;
    body: string;
    parent_id: number | null;
    is_approved: boolean;
    created_at: string;
  }[];

  const articles = (await sql`
    SELECT slug, title, date
    FROM articles
    ORDER BY date DESC, title ASC
  `) as { slug: string; title: string; date: string }[];

  return NextResponse.json({ comments: rows, articles });
}

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (auth) return auth;
  if (!hasDb) return NextResponse.json({ error: "No DB" }, { status: 503 });

  const data = await req.json().catch(() => ({}));
  const articleSlug = String(data.article_slug || "").trim();
  const name = String(data.name || "").trim().slice(0, 80);
  const email = String(data.email || "").trim().slice(0, 200) || null;
  const body = String(data.body || "").trim();
  const createdAtRaw = String(data.created_at || "").trim();
  const parentId = data.parent_id ? Number(data.parent_id) : null;

  if (!articleSlug) return NextResponse.json({ error: "article_slug is required." }, { status: 400 });
  if (!name) return NextResponse.json({ error: "name is required." }, { status: 400 });
  if (!body) return NextResponse.json({ error: "body is required." }, { status: 400 });

  let createdAt: Date | null = null;
  if (createdAtRaw) {
    const d = new Date(createdAtRaw);
    if (isNaN(d.getTime())) return NextResponse.json({ error: "Invalid created_at." }, { status: 400 });
    createdAt = d;
  }

  const rows = createdAt
    ? ((await sql`
        INSERT INTO comments (article_slug, name, email, body, parent_id, is_approved, created_at)
        VALUES (${articleSlug}, ${name}, ${email}, ${body}, ${parentId}, TRUE, ${createdAt.toISOString()})
        RETURNING id
      `) as { id: number }[])
    : ((await sql`
        INSERT INTO comments (article_slug, name, email, body, parent_id, is_approved)
        VALUES (${articleSlug}, ${name}, ${email}, ${body}, ${parentId}, TRUE)
        RETURNING id
      `) as { id: number }[]);

  return NextResponse.json({ ok: true, id: rows[0]?.id });
}

export async function PATCH(req: Request) {
  const auth = await requireAuth();
  if (auth) return auth;
  if (!hasDb) return NextResponse.json({ error: "No DB" }, { status: 503 });

  const { id, action } = await req.json().catch(() => ({}));
  if (!id || action !== "approve") {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  await sql`UPDATE comments SET is_approved = TRUE WHERE id = ${Number(id)}`;
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const auth = await requireAuth();
  if (auth) return auth;
  if (!hasDb) return NextResponse.json({ error: "No DB" }, { status: 503 });

  const { id } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  await sql`DELETE FROM comments WHERE id = ${Number(id)}`;
  return NextResponse.json({ ok: true });
}
