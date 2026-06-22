import { NextRequest, NextResponse } from "next/server";
import { requireAuth, authError } from "@/lib/auth";
import { enableTotp, getUserById } from "@/lib/users";
import { verifyTotpCode, generateBackupCodes, hashBackupCodes } from "@/lib/totp";
import { signSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireAuth(req);
  } catch (err) {
    return authError(err);
  }

  if (user.totpEnabled) {
    return NextResponse.json({ error: "2FA is already enabled" }, { status: 409 });
  }
  if (!user.totpSecret) {
    return NextResponse.json({ error: "No 2FA setup in progress — call /api/auth/2fa/setup first" }, { status: 400 });
  }

  let code: string;
  try {
    ({ code } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!verifyTotpCode(user.totpSecret, code)) {
    return NextResponse.json({ error: "Invalid code — check your authenticator app and try again" }, { status: 401 });
  }

  const plainCodes   = generateBackupCodes();
  const hashedCodes  = await hashBackupCodes(plainCodes);
  enableTotp(user.id, hashedCodes);

  // Re-issue session with new version (enableTotp bumps it)
  const updated = getUserById(user.id)!;
  const token = await signSession(updated.id, updated.sessionVersion);

  const res = NextResponse.json({ ok: true, backupCodes: plainCodes });
  res.cookies.set("__session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return res;
}
