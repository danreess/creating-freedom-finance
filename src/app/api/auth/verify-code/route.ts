import { NextRequest, NextResponse } from "next/server";
import { checkCode, consumePending } from "@/lib/verification";
import { getUserByEmail, insertUserHashed } from "@/lib/users";

export async function POST(req: NextRequest) {
  let email: string, code: string;
  try {
    ({ email, code } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!email || !code) {
    return NextResponse.json({ error: "Email and code are required" }, { status: 400 });
  }

  const result = checkCode(email, code);
  if (result === null) {
    return NextResponse.json(
      { error: "Code has expired or too many attempts — please request a new one" },
      { status: 410 }
    );
  }
  if (!result) {
    return NextResponse.json({ error: "Incorrect code — please try again" }, { status: 401 });
  }

  const pending = consumePending(email);
  if (!pending) {
    return NextResponse.json({ error: "Verification expired — please start again" }, { status: 410 });
  }

  if (getUserByEmail(email)) {
    return NextResponse.json({ error: "This email is already registered" }, { status: 409 });
  }

  insertUserHashed({
    email: pending.email,
    name: pending.name,
    passwordHash: pending.passwordHash,
    reason: pending.reason,
  });

  // Don't auto-login — redirect user to sign-in page
  return NextResponse.json({ ok: true, redirect: "/login?welcome=1" });
}
