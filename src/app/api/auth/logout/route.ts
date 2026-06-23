import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { bumpSessionVersion } from "@/lib/users";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    // Bump version — any token signed with the old version is now invalid
    await bumpSessionVersion(user.id);
  } catch {
    // Still clear the cookie even if the session was already invalid
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("__session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });
  return res;
}
