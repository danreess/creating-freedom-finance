import { NextRequest, NextResponse } from "next/server";
import { verifyTempToken, signSession } from "@/lib/session";
import { getUserById, updateBackupCodes } from "@/lib/users";
import { verifyTotpCode, consumeBackupCode } from "@/lib/totp";

export async function POST(req: NextRequest) {
  let tempToken: string, code: string;
  try {
    ({ tempToken, code } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!tempToken || !code) {
    return NextResponse.json({ error: "Token and code are required" }, { status: 400 });
  }

  const userId = await verifyTempToken(tempToken);
  if (!userId) {
    return NextResponse.json(
      { error: "Challenge expired — please sign in again" },
      { status: 401 }
    );
  }

  const user = await getUserById(userId);
  if (!user || !user.totpEnabled || !user.totpSecret) {
    return NextResponse.json({ error: "2FA not configured" }, { status: 400 });
  }

  const normalizedCode = code.replace(/\s/g, "");

  // Try TOTP first
  if (verifyTotpCode(user.totpSecret, normalizedCode)) {
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
  }

  // Try backup codes
  const hashed = user.backupCodes ? (JSON.parse(user.backupCodes) as string[]) : [];
  const { valid, remaining } = await consumeBackupCode(normalizedCode, hashed);
  if (valid) {
    await updateBackupCodes(user.id, remaining);
    const token = await signSession(user.id, user.sessionVersion);
    const res = NextResponse.json({
      ok: true,
      name: user.name,
      backupCodeUsed: true,
      backupCodesLeft: remaining.length,
    });
    res.cookies.set("__session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return res;
  }

  return NextResponse.json({ error: "Invalid code — try again" }, { status: 401 });
}
