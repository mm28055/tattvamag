import { NextResponse } from "next/server";
import { verifyPassword, createSession, setSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({ password: "" }));
  const ok = await verifyPassword(password || "");
  if (!ok) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }
  const token = await createSession();
  await setSessionCookie(token);
  return NextResponse.json({ ok: true });
}
