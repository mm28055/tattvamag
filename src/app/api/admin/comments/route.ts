// Admin endpoints for comment moderation.
// GET  /api/admin/comments?filter=pending|approved → list
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

  return NextResponse.json({ comments: rows });
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
