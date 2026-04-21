// Media library API: POST to upload an image, GET to list.
// Storage is Cloudflare R2; the DB row holds the key + metadata.
import { NextResponse } from "next/server";
import { sql, hasDb } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";
import { uploadMedia, publicUrlForKey, hasR2 } from "@/lib/r2";

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

export async function POST(req: Request) {
  const fail = await requireAuth();
  if (fail) return fail;
  if (!hasR2) {
    return NextResponse.json({ error: "R2 is not configured — set R2_* env vars." }, { status: 503 });
  }

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const altText = String(form.get("altText") || "").trim();
  const caption = String(form.get("caption") || "").trim();

  if (!file || file.size === 0) {
    return NextResponse.json({ error: "Pick an image to upload." }, { status: 400 });
  }
  if (!/^image\//.test(file.type)) {
    return NextResponse.json({ error: "File must be an image (JPEG, PNG, WebP, GIF, SVG)." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { key, url } = await uploadMedia({
    buffer,
    originalName: file.name,
    contentType: file.type,
  });

  const rows = (await sql`
    INSERT INTO media (r2_key, filename, content_type, size_bytes, alt_text, caption)
    VALUES (${key}, ${file.name}, ${file.type}, ${file.size}, ${altText}, ${caption})
    RETURNING id
  `) as { id: number }[];

  return NextResponse.json({ ok: true, id: rows[0].id, key, url });
}

export async function GET() {
  const fail = await requireAuth();
  if (fail) return fail;

  const rows = (await sql`
    SELECT id, r2_key, filename, content_type, size_bytes, alt_text, caption, uploaded_at
    FROM media
    ORDER BY uploaded_at DESC
  `) as Array<{
    id: number;
    r2_key: string;
    filename: string;
    content_type: string;
    size_bytes: number;
    alt_text: string | null;
    caption: string | null;
    uploaded_at: string;
  }>;

  return NextResponse.json({
    media: rows.map((r) => ({
      id: r.id,
      key: r.r2_key,
      url: publicUrlForKey(r.r2_key),
      filename: r.filename,
      contentType: r.content_type,
      sizeBytes: r.size_bytes,
      altText: r.alt_text || "",
      caption: r.caption || "",
      uploadedAt: r.uploaded_at,
    })),
  });
}
