import { NextRequest, NextResponse } from "next/server";
import { requireAuth, authError } from "@/lib/auth";
import { getBasiqToken } from "@/lib/basiq";

export async function GET(req: NextRequest) {
  try { await requireAuth(req); } catch (err) { return authError(err); }

  const apiKey = process.env.BASIQ_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Basiq not configured on this server" }, { status: 503 });

  try {
    const token = await getBasiqToken(apiKey);
    return NextResponse.json({ token });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
