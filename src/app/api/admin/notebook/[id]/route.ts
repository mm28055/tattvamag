// Per-notebook-entry admin API: GET (fetch), PUT (update), DELETE (remove).
import { NextResponse } from "next/server";
import { sql, hasDb } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";
import { invalidateNotebookCache } from "@/lib/notebook-data";

export const runtime = "nodejs";

async function requireAuth() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasDb) {
    return NextResponse.json({ error: "DATABASE_URL not configured." }, { status: 503 });
  }
  return null;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const fail = await requireAuth();
  if (fail) return fail;
  const { id } = await params;

  const rows = (await sql`SELECT * FROM notebook_entries WHERE id = ${id} LIMIT 1`) as Array<{
    id: string;
    title: string;
    body: string;
    tags: string[];
    author: string;
    date_published: string;
    display_order: number | null;
  }>;
  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const r = rows[0];
  return NextResponse.json({
    entry: {
      id: r.id,
      title: r.title,
      body: r.body,
      tags: (r.tags || []).join(", "),
      author: r.author,
      datePublished: typeof r.date_published === "string"
        ? r.date_published.slice(0, 10)
        : new Date(r.date_published).toISOString().slice(0, 10),
      displayOrder: r.display_order,
    },
  });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const fail = await requireAuth();
  if (fail) return fail;
  const { id } = await params;

  const existing = (await sql`SELECT id FROM notebook_entries WHERE id = ${id} LIMIT 1`) as { id: string }[];
  if (existing.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const title = String(body.title || "").trim();
  const bodyText = String(body.body || "").trim();
  const tags = Array.isArray(body.tags)
    ? (body.tags as unknown[]).map((t) => String(t).trim()).filter(Boolean)
    : [];
  const datePublishedRaw = String(body.datePublished || "").trim();
  const displayOrderRaw = body.displayOrder;

  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
  if (!bodyText) return NextResponse.json({ error: "Body is required" }, { status: 400 });

  const isISO = /^\d{4}-\d{2}-\d{2}$/.test(datePublishedRaw);
  const displayOrder =
    displayOrderRaw === null || displayOrderRaw === "" || displayOrderRaw === undefined
      ? null
      : Math.max(1, Math.min(99, parseInt(String(displayOrderRaw), 10) || 0)) || null;

  await sql`
    UPDATE notebook_entries SET
      title          = ${title},
      body           = ${bodyText},
      tags           = ${JSON.stringify(tags)}::jsonb,
      date_published = CASE WHEN ${isISO} THEN ${datePublishedRaw}::date ELSE date_published END,
      display_order  = ${displayOrder},
      updated_at     = NOW()
    WHERE id = ${id}
  `;

  invalidateNotebookCache();
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const fail = await requireAuth();
  if (fail) return fail;
  const { id } = await params;

  const result = (await sql`DELETE FROM notebook_entries WHERE id = ${id} RETURNING id`) as { id: string }[];
  if (result.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  invalidateNotebookCache();
  return NextResponse.json({ ok: true });
}
