import { NextResponse } from "next/server";
import { getBasiqToken, getBasiqAccounts } from "@/lib/basiq";

export async function GET() {
  const apiKey = process.env.BASIQ_API_KEY;
  const userId = process.env.BASIQ_USER_ID;

  if (!apiKey || !userId) {
    return NextResponse.json(
      { error: "Basiq credentials not configured" },
      { status: 503 }
    );
  }

  try {
    const token = await getBasiqToken(apiKey);
    const data = await getBasiqAccounts(token, userId);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
