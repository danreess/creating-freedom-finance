import { NextRequest, NextResponse } from "next/server";
import { requireAuth, authError } from "@/lib/auth";
import { getConnection } from "@/lib/connections";

const TOKEN_URL = "https://api.sharesight.com/oauth2/token";
const BASE = "https://api.sharesight.com/api/v2";

async function getAccessToken(clientId: string, clientSecret: string, refreshToken: string): Promise<string> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (!res.ok) throw new Error(`Sharesight token error: ${await res.text()}`);
  const data = await res.json();
  return data.access_token as string;
}

export async function GET(req: NextRequest) {
  let user;
  try { user = await requireAuth(req); } catch (err) { return authError(err); }

  const creds = await getConnection(user.id, "sharesight");
  if (!creds) {
    return NextResponse.json({ error: "Sharesight not connected — add your credentials in Account → Connections" }, { status: 503 });
  }

  try {
    const token = await getAccessToken(creds.clientId, creds.clientSecret, creds.refreshToken);

    const portRes = await fetch(`${BASE}/portfolios.json`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    if (!portRes.ok) throw new Error(`Sharesight portfolios error: ${await portRes.text()}`);
    const portData = await portRes.json();
    const portfolios: Array<{ id: number; name: string }> = portData.portfolios || [];
    if (portfolios.length === 0) return NextResponse.json({ holdings: [], portfolioName: "" });

    const portfolio = portfolios[0];
    const holdRes = await fetch(`${BASE}/portfolios/${portfolio.id}/holdings.json`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    if (!holdRes.ok) throw new Error(`Sharesight holdings error: ${await holdRes.text()}`);
    const holdData = await holdRes.json();

    return NextResponse.json({
      portfolioName: portfolio.name,
      portfolios: portfolios.map((p) => ({ id: p.id, name: p.name })),
      holdings: holdData.holdings || [],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
