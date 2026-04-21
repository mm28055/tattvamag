// Collection-level notebook API.
// POST → create a new entry. GET not needed — the admin list page reads via
// getAllNotebookEntriesAsync() directly on the server.
import { NextResponse } from "next/server";
import { sql, hasDb } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";
import { invalidateNotebookCache } from "@/lib/notebook-data";
import { revalidatePublicContent } from "@/lib/revalidate";

export const runtime = "nodejs";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

export async function POST(req: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasDb) {
    return NextResponse.json({ error: "DATABASE_URL not configured." }, { status: 503 });
  }

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const title = String(body.title || "").trim();
  const bodyText = String(body.body || "").trim();
  const tags = Array.isArray(body.tags)
    ? (body.tags as unknown[]).map((t) => String(t).trim()).filter(Boolean)
    : [];
  const customId = String(body.id || "").trim();
  const datePublishedRaw = String(body.datePublished || "").trim();

  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
  if (!bodyText) return NextResponse.json({ error: "Body is required" }, { status: 400 });

  const id = slugify(customId || title);
  if (!id) return NextResponse.json({ error: "Could not derive an id from the title" }, { status: 400 });

  const existing = (await sql`SELECT id FROM notebook_entries WHERE id = ${id} LIMIT 1`) as { id: string }[];
  if (existing.length > 0) {
    return NextResponse.json({ error: `An entry with id "${id}" already exists.` }, { status: 409 });
  }

  // Permit YYYY-MM-DD or empty (defaults to today).
  const isISO = /^\d{4}-\d{2}-\d{2}$/.test(datePublishedRaw);
  const dateClause = isISO ? datePublishedRaw : null;

  await sql`
    INSERT INTO notebook_entries (id, title, body, tags, date_published)
    VALUES (
      ${id},
      ${title},
      ${bodyText},
      ${JSON.stringify(tags)}::jsonb,
      COALESCE(${dateClause}::date, CURRENT_DATE)
    )
  `;

  invalidateNotebookCache();
  revalidatePublicContent({ notebook: true });
  return NextResponse.json({ ok: true, id });
}
