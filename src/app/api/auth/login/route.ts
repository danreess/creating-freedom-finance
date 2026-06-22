import { NextRequest, NextResponse } from "next/server";
import {
  getUserByEmail, verifyPassword, isAccountLocked,
  recordFailedLogin, clearFailedLogins,
} from "@/lib/users";
import { signSession, signTempToken } from "@/lib/session";

// IP-based rate limiter: 10 attempts per IP per 15 minutes
const ipAttempts = new Map<string, { count: number; resetAt: number }>();
const IP_MAX     = 10;
const IP_WINDOW  = 15 * 60 * 1000;

function isIpLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    ipAttempts.set(ip, { count: 1, resetAt: now + IP_WINDOW });
    return false;
  }
  entry.count++;
  return entry.count > IP_MAX;
}

// Dummy hash used for timing-safe "user not found" path
const DUMMY_HASH =
  "ffffffffffffffffffffffffffffffff:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  if (isIpLimited(ip)) {
    return NextResponse.json(
      { error: "Too many attempts from this location — wait 15 minutes" },
      { status: 429 }
    );
  }

  if (!process.env.SESSION_SECRET) {
    return NextResponse.json({ error: "SESSION_SECRET is not configured" }, { status: 503 });
  }

  let email: string, password: string;
  try {
    ({ email, password } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  // Check per-account lockout BEFORE doing any DB work
  if (isAccountLocked(email)) {
    return NextResponse.json(
      { error: "Account temporarily locked — too many failed attempts. Try again in 30 minutes." },
      { status: 429 }
    );
  }

  const user = getUserByEmail(email);

  // Always run verifyPassword even if user not found — prevents timing-based enumeration
  const hashToCheck = user?.passwordHash ?? DUMMY_HASH;
  const valid = await verifyPassword(password, hashToCheck);

  if (!user || !valid) {
    if (user) recordFailedLogin(email); // Only count against real accounts
    return NextResponse.json({ error: "Incorrect email or password" }, { status: 401 });
  }

  clearFailedLogins(email);
  ipAttempts.delete(ip);

  // If 2FA is enabled, issue a short-lived temp token instead of a full session
  if (user.totpEnabled) {
    const tempToken = await signTempToken(user.id);
    return NextResponse.json({ requires2FA: true, tempToken });
  }

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
