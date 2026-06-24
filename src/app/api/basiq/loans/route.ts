import { NextRequest, NextResponse } from "next/server";
import { requireAuth, authError } from "@/lib/auth";
import { getBasiqToken } from "@/lib/basiq";

export async function GET(req: NextRequest) {
  try { await requireAuth(req); } catch (err) { return authError(err); }

  const apiKey = process.env.BASIQ_API_KEY;
  const userId = process.env.BASIQ_USER_ID;

  if (!apiKey || !userId) {
    return NextResponse.json({ error: "Basiq credentials not configured" }, { status: 503 });
  }

  try {
    const token = await getBasiqToken(apiKey);
    const res = await fetch(
      `https://au-api.basiq.io/users/${userId}/accounts?filter=account.class.type%3Dline_of_credit,mortgage,loan`,
      { headers: { Authorization: `Bearer ${token}`, "basiq-version": "3.0" } }
    );
    if (!res.ok) throw new Error(`Basiq loans error: ${await res.text()}`);
    return NextResponse.json(await res.json());
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
