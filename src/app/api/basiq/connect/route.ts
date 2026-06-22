import { NextRequest, NextResponse } from "next/server";
import { getBasiqToken, createBasiqUser, createBasiqAuthLink } from "@/lib/basiq";

export async function POST(request: NextRequest) {
  const apiKey = process.env.BASIQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Basiq API key not configured" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { email, mobile, institutionId, callbackUrl } = body;

    const token = await getBasiqToken(apiKey);

    let userId = process.env.BASIQ_USER_ID;
    if (!userId) {
      userId = await createBasiqUser(token, email, mobile);
    }

    const authLink = await createBasiqAuthLink(
      token,
      userId,
      mobile,
      email,
      callbackUrl || `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/basiq/callback`,
      institutionId || undefined  // undefined = Basiq shows its own picker for all 136+ banks
    );

    return NextResponse.json({ authLink, userId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
