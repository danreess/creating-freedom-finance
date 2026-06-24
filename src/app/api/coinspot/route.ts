import { NextRequest, NextResponse } from "next/server";
import { requireAuth, authError } from "@/lib/auth";
import { getConnection } from "@/lib/connections";
import { fetchCoinSpotBalances } from "@/lib/coinspot";

export async function GET(req: NextRequest) {
  let user;
  try { user = await requireAuth(req); } catch (err) { return authError(err); }

  const creds = await getConnection(user.id, "coinspot");
  if (!creds) {
    return NextResponse.json({ error: "CoinSpot not connected — add your API key in Account → Connections" }, { status: 503 });
  }

  try {
    const data = await fetchCoinSpotBalances(creds.apiKey, creds.secret);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
