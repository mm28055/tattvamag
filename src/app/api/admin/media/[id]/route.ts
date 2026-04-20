// Per-image admin API: DELETE removes the DB row and the R2 object.
import { NextResponse } from "next/server";
import { sql, hasDb } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";
import { deleteMedia } from "@/lib/r2";

export const runtime = "nodejs";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasDb) {
    return NextResponse.json({ error: "DATABASE_URL not configured." }, { status: 503 });
  }
  const { id } = await params;
  const idNum = parseInt(id, 10);
  if (!idNum) return NextResponse.json({ error: "Bad id" }, { status: 400 });

  const rows = (await sql`
    DELETE FROM media WHERE id = ${idNum} RETURNING r2_key
  `) as { r2_key: string }[];
  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Best-effort R2 delete — if the object is already gone, we don't care.
  try {
    await deleteMedia(rows[0].r2_key);
  } catch (e) {
    console.warn(`[media] R2 delete failed for ${rows[0].r2_key}:`, e);
  }

  return NextResponse.json({ ok: true });
}
