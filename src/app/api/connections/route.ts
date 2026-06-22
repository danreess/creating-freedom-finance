import { NextRequest, NextResponse } from "next/server";
import { requireAuth, authError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
  } catch (err) {
    return authError(err);
  }

  return NextResponse.json({
    coinspot: {
      connected: !!(process.env.COINSPOT_KEY && process.env.COINSPOT_SECRET),
      label: "CoinSpot",
      description: "Crypto portfolio",
    },
    basiq: {
      connected: !!process.env.BASIQ_API_KEY,
      label: "Basiq Open Banking",
      description: "Bank accounts & mortgage",
    },
    sharesight: {
      connected: !!(process.env.SHARESIGHT_CLIENT_ID && process.env.SHARESIGHT_REFRESH_TOKEN),
      label: "Sharesight",
      description: "Share portfolio",
    },
    email: {
      connected: !!(process.env.EMAIL_SMTP_HOST && process.env.EMAIL_SMTP_USER && process.env.EMAIL_SMTP_PASS),
      label: "Email (Gmail)",
      description: "Verification emails",
    },
  });
}
