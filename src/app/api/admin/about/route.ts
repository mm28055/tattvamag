import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getAbout, saveAbout } from "@/lib/about";
import { hasDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const about = await getAbout();
  return NextResponse.json({ about, hasDb });
}

export async function PUT(req: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasDb) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 503 });
  }
  const body = await req.json().catch(() => ({}));
  const intro = String(body.intro || "").trim();
  const bio = String(body.bio || "").trim();
  const closing = String(body.closing || "").trim();
  if (!intro) return NextResponse.json({ error: "Intro is required" }, { status: 400 });
  await saveAbout({ intro, bio, closing });
  return NextResponse.json({ ok: true });
}
