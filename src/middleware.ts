import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/session";

const PUBLIC = [
  "/login",
  "/register",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/register",
  "/api/auth/send-code",
  "/api/auth/verify-code",
  "/api/auth/user-count",
  "/api/auth/2fa/verify-login",
];

const STATIC = ["/_next/", "/favicon.ico", "/manifest.json", "/icons/"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (STATIC.some((p) => pathname.startsWith(p))) return NextResponse.next();
  if (PUBLIC.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const token = req.cookies.get("__session")?.value;
  if (!token || !(await verifySession(token))) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
};
