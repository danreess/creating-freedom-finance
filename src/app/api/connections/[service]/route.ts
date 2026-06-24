import { NextRequest, NextResponse } from "next/server";
import { requireAuth, authError } from "@/lib/auth";
import { getConnection, saveConnection, deleteConnection, type Service } from "@/lib/connections";

const VALID: Service[] = ["coinspot", "sharesight", "basiq"];

export async function GET(req: NextRequest, { params }: { params: Promise<{ service: string }> }) {
  let user;
  try { user = await requireAuth(req); } catch (err) { return authError(err); }

  const { service } = await params;
  if (!VALID.includes(service as Service)) {
    return NextResponse.json({ error: "Unknown service" }, { status: 400 });
  }

  const creds = await getConnection(user.id, service as Service);
  if (!creds) return NextResponse.json({ connected: false });

  // Return masked credentials so the UI can show "already connected" without exposing keys
  if (service === "coinspot") {
    const c = creds as { apiKey: string; secret: string };
    return NextResponse.json({ connected: true, maskedKey: maskStr(c.apiKey) });
  }
  if (service === "sharesight") {
    const c = creds as { clientId: string; refreshToken: string };
    return NextResponse.json({ connected: true, maskedClientId: maskStr(c.clientId) });
  }
  if (service === "basiq") {
    const c = creds as { userId: string };
    return NextResponse.json({ connected: true, maskedUserId: maskStr(c.userId) });
  }

  return NextResponse.json({ connected: true });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ service: string }> }) {
  let user;
  try { user = await requireAuth(req); } catch (err) { return authError(err); }

  const { service } = await params;
  if (!VALID.includes(service as Service)) {
    return NextResponse.json({ error: "Unknown service" }, { status: 400 });
  }

  let body: Record<string, string>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (service === "coinspot") {
    const { apiKey, secret } = body;
    if (!apiKey?.trim() || !secret?.trim()) {
      return NextResponse.json({ error: "API key and secret are required" }, { status: 400 });
    }
    await saveConnection(user.id, "coinspot", { apiKey: apiKey.trim(), secret: secret.trim() });
  } else if (service === "sharesight") {
    const { clientId, clientSecret, refreshToken } = body;
    if (!clientId?.trim() || !clientSecret?.trim() || !refreshToken?.trim()) {
      return NextResponse.json({ error: "Client ID, client secret, and refresh token are required" }, { status: 400 });
    }
    await saveConnection(user.id, "sharesight", {
      clientId: clientId.trim(),
      clientSecret: clientSecret.trim(),
      refreshToken: refreshToken.trim(),
    });
  } else if (service === "basiq") {
    const { userId } = body;
    if (!userId?.trim()) {
      return NextResponse.json({ error: "Basiq user ID is required" }, { status: 400 });
    }
    await saveConnection(user.id, "basiq", { userId: userId.trim() });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ service: string }> }) {
  let user;
  try { user = await requireAuth(req); } catch (err) { return authError(err); }

  const { service } = await params;
  if (!VALID.includes(service as Service)) {
    return NextResponse.json({ error: "Unknown service" }, { status: 400 });
  }

  await deleteConnection(user.id, service as Service);
  return NextResponse.json({ ok: true });
}

function maskStr(s: string): string {
  if (s.length <= 4) return "****";
  return s.slice(0, 4) + "••••••••";
}
