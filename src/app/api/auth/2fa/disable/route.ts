import { NextRequest, NextResponse } from "next/server";
import { requireAuth, authError } from "@/lib/auth";
import { verifyPassword, disableTotp, getUserById } from "@/lib/users";
import { verifyTotpCode } from "@/lib/totp";
import { signSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireAuth(req);
  } catch (err) {
    return authError(err);
  }

  if (!user.totpEnabled) {
    return NextResponse.json({ error: "2FA is not enabled" }, { status: 400 });
  }

  let password: string, code: string;
  try {
    ({ password, code } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!password || !code) {
    return NextResponse.json({ error: "Password and authenticator code are required" }, { status: 400 });
  }

  if (!(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  if (!user.totpSecret || !verifyTotpCode(user.totpSecret, code)) {
    return NextResponse.json({ error: "Invalid authenticator code" }, { status: 401 });
  }

  disableTotp(user.id);

  // Re-issue session with new version (disableTotp bumps it)
  const updated = getUserById(user.id)!;
  const token = await signSession(updated.id, updated.sessionVersion);

  const res = NextResponse.json({ ok: true });
  res.cookies.set("__session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return res;
}
