import { NextRequest, NextResponse } from "next/server";
import { requireAuth, authError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  let user;
  try {
    user = await requireAuth(req);
  } catch (err) {
    return authError(err);
  }
  const { passwordHash: _, ...safe } = user;
  return NextResponse.json(safe);
}
