import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getAuthorBios, saveAuthorBios } from "@/lib/author-bio";
import { hasDb } from "@/lib/db";
import { revalidatePublicContent } from "@/lib/revalidate";

export const runtime = "nodejs";

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const bios = await getAuthorBios();
  return NextResponse.json({ bios, hasDb });
}

export async function PUT(req: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasDb) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 503 });
  }
  const body = await req.json().catch(() => ({}));
  const bios = body.bios as Record<string, string>;
  if (!bios || typeof bios !== "object") {
    return NextResponse.json({ error: "bios object is required" }, { status: 400 });
  }
  const cleaned: Record<string, string> = {};
  for (const [name, text] of Object.entries(bios)) {
    if (name.trim() && typeof text === "string" && text.trim()) {
      cleaned[name.trim()] = text.trim();
    }
  }
  await saveAuthorBios(cleaned);
  revalidatePublicContent();
  return NextResponse.json({ ok: true });
}
