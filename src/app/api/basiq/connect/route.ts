import { NextRequest, NextResponse } from "next/server";
import { requireAuth, authError } from "@/lib/auth";
import { getConnection, saveConnection } from "@/lib/connections";
import { getBasiqToken, createBasiqUser, createBasiqAuthLink } from "@/lib/basiq";

export async function POST(request: NextRequest) {
  let user;
  try { user = await requireAuth(request); } catch (err) { return authError(err); }

  const apiKey = process.env.BASIQ_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Basiq API key not configured" }, { status: 503 });

  try {
    const body = await request.json();
    const { mobile, institutionId, callbackUrl } = body;

    const token = await getBasiqToken(apiKey);

    // Re-use existing Basiq userId for this user, or create a new one
    const existing = await getConnection(user.id, "basiq");
    let basiqUserId = existing?.userId;
    if (!basiqUserId) {
      basiqUserId = await createBasiqUser(token, user.email, mobile);
      await saveConnection(user.id, "basiq", { userId: basiqUserId });
    }

    const authLink = await createBasiqAuthLink(
      token,
      basiqUserId,
      mobile,
      user.email,
      callbackUrl || `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/basiq/callback`,
      institutionId || undefined
    );

    return NextResponse.json({ authLink, userId: basiqUserId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
