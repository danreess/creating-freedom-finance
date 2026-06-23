import { randomInt, timingSafeEqual } from "crypto";
import { db } from "./db";
import { hashPassword } from "./users";

interface Pending {
  code: string;
  name: string;
  email: string;
  passwordHash: string;
  reason: string;
  expiresAt: number;
  attempts: number;
}

export function generateCode(): string {
  return randomInt(100000, 999999).toString();
}

export async function storePending(data: {
  name: string;
  email: string;
  password: string;
  reason: string;
}): Promise<string> {
  const code = generateCode();
  const passwordHash = await hashPassword(data.password);
  const expiresAt = Date.now() + 10 * 60 * 1000;
  const email = data.email.toLowerCase();

  await db()`
    INSERT INTO pending_verifications (email, code, name, password_hash, reason, expires_at, attempts)
    VALUES (${email}, ${code}, ${data.name}, ${passwordHash}, ${data.reason}, ${expiresAt}, 0)
    ON CONFLICT (email) DO UPDATE SET
      code = ${code},
      name = ${data.name},
      password_hash = ${passwordHash},
      reason = ${data.reason},
      expires_at = ${expiresAt},
      attempts = 0
  `;

  // Clean up any other expired rows while we're here
  await db()`DELETE FROM pending_verifications WHERE expires_at < ${Date.now()}`;

  return code;
}

async function getPending(email: string): Promise<Pending | undefined> {
  const rows = await db()`
    SELECT * FROM pending_verifications WHERE email = lower(${email})
  `;
  if (rows.length === 0) return undefined;
  const row = rows[0] as Record<string, unknown>;
  const expiresAt = Number(row.expires_at);
  if (Date.now() > expiresAt) {
    await db()`DELETE FROM pending_verifications WHERE email = lower(${email})`;
    return undefined;
  }
  return {
    code: row.code as string,
    name: row.name as string,
    email: row.email as string,
    passwordHash: row.password_hash as string,
    reason: row.reason as string,
    expiresAt,
    attempts: Number(row.attempts),
  };
}

// Returns true if code matches, false if wrong, null if expired/not found
export async function checkCode(email: string, code: string): Promise<boolean | null> {
  const entry = await getPending(email);
  if (!entry) return null;

  const newAttempts = entry.attempts + 1;
  if (newAttempts > 5) {
    await db()`DELETE FROM pending_verifications WHERE email = lower(${email})`;
    return null;
  }
  await db()`UPDATE pending_verifications SET attempts = ${newAttempts} WHERE email = lower(${email})`;

  // Timing-safe comparison prevents brute-force via response timing
  const a = Buffer.from(entry.code, "utf-8");
  const b = Buffer.from(code.trim().padEnd(entry.code.length, " "), "utf-8");
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function consumePending(email: string): Promise<Pending | undefined> {
  const entry = await getPending(email);
  if (entry) {
    await db()`DELETE FROM pending_verifications WHERE email = lower(${email})`;
  }
  return entry;
}
