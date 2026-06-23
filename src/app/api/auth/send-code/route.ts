import { NextRequest, NextResponse } from "next/server";
import { storePending } from "@/lib/verification";
import { sendVerificationEmail } from "@/lib/email";
import { getUserByEmail } from "@/lib/users";

// Rate limit by email: max 3 sends per hour
const emailLog = new Map<string, { count: number; resetAt: number }>();
function isEmailLimited(email: string): boolean {
  const now = Date.now();
  const entry = emailLog.get(email);
  if (!entry || now > entry.resetAt) {
    emailLog.set(email, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return false;
  }
  entry.count++;
  return entry.count > 3;
}

// Rate limit by IP: max 5 code requests per hour
const ipLog = new Map<string, { count: number; resetAt: number }>();
function isIpLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipLog.get(ip);
  if (!entry || now > entry.resetAt) {
    ipLog.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return false;
  }
  entry.count++;
  return entry.count > 5;
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  if (isIpLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests — try again later" },
      { status: 429 }
    );
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
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  // Don't reveal whether this email is already registered — just silently succeed.
  if (await getUserByEmail(email)) {
    return NextResponse.json({ ok: true });
  }

  if (isEmailLimited(email.toLowerCase())) {
    return NextResponse.json({ error: "Too many code requests — try again in an hour" }, { status: 429 });
  }

  const code = await storePending({ name, email, password, reason });
  const emailConfigured = !!(process.env.EMAIL_SMTP_HOST && process.env.EMAIL_SMTP_USER && process.env.EMAIL_SMTP_PASS);

  if (emailConfigured) {
    try {
      await sendVerificationEmail(email, name, code);
      return NextResponse.json({ ok: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send email";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  // In production, email MUST be configured — never expose codes publicly
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Email is not configured on this server. Contact the administrator." },
      { status: 503 }
    );
  }

  // Development only — show code on screen
  console.log(`\n📬  Verification code for ${email}: ${code}\n`);
  return NextResponse.json({ ok: true, devCode: code });
}
