import { NextRequest, NextResponse } from "next/server";
import { requireAuth, authError } from "@/lib/auth";
import { saveTotpSecret } from "@/lib/users";
import { generateTotpSecret, getTotpUri } from "@/lib/totp";
import QRCode from "qrcode";

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireAuth(req);
  } catch (err) {
    return authError(err);
  }

  if (user.totpEnabled) {
    return NextResponse.json({ error: "2FA is already enabled" }, { status: 409 });
  }

  const secret = generateTotpSecret();
  await saveTotpSecret(user.id, secret);

  const uri = getTotpUri(user.email, secret);
  const qrDataUrl = await QRCode.toDataURL(uri, {
    errorCorrectionLevel: "M",
    margin: 1,
    color: { dark: "#000000", light: "#ffffff" },
    width: 256,
  });

  return NextResponse.json({ secret, qrDataUrl });
}
