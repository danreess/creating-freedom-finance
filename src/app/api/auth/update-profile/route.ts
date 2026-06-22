import { NextRequest, NextResponse } from "next/server";
import { requireAuth, authError } from "@/lib/auth";
import { updateName } from "@/lib/users";

export async function PATCH(req: NextRequest) {
  let user;
  try {
    user = await requireAuth(req);
  } catch (err) {
    return authError(err);
  }

  let name: string;
  try {
    ({ name } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const trimmed = (name ?? "").trim();
  if (!trimmed || trimmed.length < 2) {
    return NextResponse.json({ error: "Name must be at least 2 characters" }, { status: 400 });
  }
  if (trimmed.length > 80) {
    return NextResponse.json({ error: "Name is too long" }, { status: 400 });
  }

  updateName(user.id, trimmed);
  return NextResponse.json({ ok: true, name: trimmed });
}
