import { NextRequest, NextResponse } from "next/server";
import { requireAuth, authError } from "@/lib/auth";
import { getConnection } from "@/lib/connections";
import { getBasiqToken, getBasiqAccounts } from "@/lib/basiq";

export async function GET(req: NextRequest) {
  let user;
  try { user = await requireAuth(req); } catch (err) { return authError(err); }

  const apiKey = process.env.BASIQ_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Basiq not configured on this server" }, { status: 503 });

  const creds = await getConnection(user.id, "basiq");
  if (!creds) return NextResponse.json({ error: "Bank not connected — go to Account → Connections to link your bank" }, { status: 503 });

  try {
    const token = await getBasiqToken(apiKey);
    const data = await getBasiqAccounts(token, creds.userId);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
