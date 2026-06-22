import { NextResponse } from "next/server";

const TOKEN_URL = "https://api.sharesight.com/oauth2/token";
const BASE = "https://api.sharesight.com/api/v2";

async function getAccessToken(): Promise<string> {
  const clientId = process.env.SHARESIGHT_CLIENT_ID;
  const clientSecret = process.env.SHARESIGHT_CLIENT_SECRET;
  const refreshToken = process.env.SHARESIGHT_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) throw new Error("not configured");

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

export async function GET() {
  try {
    const token = await getAccessToken();

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
    if (message === "not configured") {
      return NextResponse.json({ error: "Sharesight not configured" }, { status: 503 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
