import { NextResponse } from "next/server";
import { userCount } from "@/lib/users";

// Public endpoint — only returns a count, no user data
export async function GET() {
  return NextResponse.json({ count: await userCount() });
}
