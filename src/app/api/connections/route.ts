import { NextRequest, NextResponse } from "next/server";
import { requireAuth, authError } from "@/lib/auth";
import { getConnectionStatus } from "@/lib/connections";

export async function GET(req: NextRequest) {
  let user;
  try { user = await requireAuth(req); } catch (err) { return authError(err); }

  const status = await getConnectionStatus(user.id);

  return NextResponse.json({
    coinspot: {
      connected:   status.coinspot,
      label:       "CoinSpot",
      description: "Crypto portfolio",
    },
    basiq: {
      connected:   status.basiq,
      label:       "Basiq Open Banking",
      description: "Bank accounts & mortgage",
    },
    sharesight: {
      connected:   status.sharesight,
      label:       "Sharesight",
      description: "Share portfolio",
    },
    email: {
      connected:   !!(process.env.EMAIL_SMTP_HOST && process.env.EMAIL_SMTP_USER),
      label:       "Email (Gmail)",
      description: "Verification emails",
    },
  });
}
