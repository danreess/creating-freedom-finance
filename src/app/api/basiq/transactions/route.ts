import { NextRequest, NextResponse } from "next/server";
import { requireAuth, authError } from "@/lib/auth";
import { getBasiqToken, getBasiqTransactions } from "@/lib/basiq";

export async function GET(req: NextRequest) {
  try { await requireAuth(req); } catch (err) { return authError(err); }

  const apiKey = process.env.BASIQ_API_KEY;
  const userId = process.env.BASIQ_USER_ID;

  if (!apiKey || !userId) {
    return NextResponse.json({ error: "Basiq credentials not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "50");

  try {
    const token = await getBasiqToken(apiKey);
    const data = await getBasiqTransactions(token, userId, limit);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
