import { NextRequest, NextResponse } from "next/server";
import { requireAuth, authError } from "@/lib/auth";
import { getLoginEvents } from "@/lib/users";

export async function GET(req: NextRequest) {
  let user;
  try { user = await requireAuth(req); } catch (err) { return authError(err); }
  const events = await getLoginEvents(user.id);
  return NextResponse.json(events);
}
