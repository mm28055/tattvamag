import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getAuthorBio, saveAuthorBio } from "@/lib/author-bio";
import { hasDb } from "@/lib/db";
import { revalidatePublicContent } from "@/lib/revalidate";

export const runtime = "nodejs";

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const bio = await getAuthorBio();
  return NextResponse.json({ bio, hasDb });
}

export async function PUT(req: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasDb) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 503 });
  }
  const body = await req.json().catch(() => ({}));
  const bio = String(body.bio || "").trim();
  if (!bio) return NextResponse.json({ error: "Bio is required" }, { status: 400 });
  await saveAuthorBio(bio);
  // Bio shows on every article page; easiest to just refresh the whole site.
  revalidatePublicContent();
  return NextResponse.json({ ok: true });
}
