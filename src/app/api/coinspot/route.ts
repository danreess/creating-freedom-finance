import { NextRequest, NextResponse } from "next/server";
import { requireAuth, authError } from "@/lib/auth";
import { fetchCoinSpotBalances } from "@/lib/coinspot";

export async function GET(req: NextRequest) {
  try { await requireAuth(req); } catch (err) { return authError(err); }

  const apiKey = process.env.COINSPOT_KEY;
  const secret = process.env.COINSPOT_SECRET;

  if (!apiKey || !secret) {
    return NextResponse.json(
      { error: "CoinSpot API credentials not configured" },
      { status: 503 }
    );
  }

  try {
    const data = await fetchCoinSpotBalances(apiKey, secret);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
