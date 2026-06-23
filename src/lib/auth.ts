import { NextRequest, NextResponse } from "next/server";
import { verifySession, getSessionData } from "./session";
import { getUserById, getSessionVersion } from "./users";
import type { User } from "./users";

export class AuthError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

/**
 * Full server-side auth check:
 * 1. Valid HMAC signature
 * 2. Token not expired (7 days)
 * 3. Session version in token matches current version in DB
 *    (version is bumped on logout and password change, immediately invalidating old tokens)
 */
export async function requireAuth(req: NextRequest): Promise<User> {
  const token = req.cookies.get("__session")?.value;
  if (!token) throw new AuthError("Unauthorized", 401);

  if (!(await verifySession(token))) throw new AuthError("Unauthorized", 401);

  const data = getSessionData(token);
  if (!data) throw new AuthError("Invalid session", 401);

  const user = await getUserById(data.userId);
  if (!user) throw new AuthError("User not found", 404);

  const currentVersion = await getSessionVersion(data.userId);
  if (data.sessionVersion !== currentVersion) {
    throw new AuthError("Session invalidated — please sign in again", 401);
  }

  return user;
}

export function authError(err: unknown): NextResponse {
  if (err instanceof AuthError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
