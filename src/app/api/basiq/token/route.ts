import { NextResponse } from "next/server";
import { getBasiqToken } from "@/lib/basiq";

export async function GET() {
  const apiKey = process.env.BASIQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Basiq API key not configured" },
      { status: 503 }
    );
  }

  try {
    const token = await getBasiqToken(apiKey);
    return NextResponse.json({ token });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
