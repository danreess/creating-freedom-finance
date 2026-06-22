import { NextRequest, NextResponse } from "next/server";
import { requireAuth, authError } from "@/lib/auth";
import { verifyPassword, updatePassword } from "@/lib/users";
import { signSession } from "@/lib/session";
import { getUserById } from "@/lib/users";

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireAuth(req);
  } catch (err) {
    return authError(err);
  }

  let current: string, newPassword: string;
  try {
    ({ current, newPassword } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!current || !newPassword) {
    return NextResponse.json({ error: "Both current and new password are required" }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
  }
  if (!(await verifyPassword(current, user.passwordHash))) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
  }

  // updatePassword bumps sessionVersion internally
  await updatePassword(user.id, newPassword);

  // Issue a fresh token for the current session so the user stays logged in
  const updated = getUserById(user.id)!;
  const newToken = await signSession(updated.id, updated.sessionVersion);

  const res = NextResponse.json({ ok: true });
  res.cookies.set("__session", newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return res;
}
