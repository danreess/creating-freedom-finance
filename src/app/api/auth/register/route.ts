import { NextRequest, NextResponse } from "next/server";
import { createUser } from "@/lib/users";
import { signSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  if (!process.env.SESSION_SECRET) {
    return NextResponse.json({ error: "SESSION_SECRET is not configured" }, { status: 503 });
  }

  let body: { name?: string; email?: string; password?: string; reason?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { name, email, password, reason } = body;
  if (!name?.trim() || !email?.trim() || !password || !reason) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  try {
    const user = await createUser({ name, email, password, reason });
    const token = await signSession(user.id, user.sessionVersion);
    const res = NextResponse.json({ ok: true, name: user.name });
    res.cookies.set("__session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return res;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Registration failed";
    return NextResponse.json({ error: msg }, { status: 409 });
  }
}
