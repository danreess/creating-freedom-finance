import { randomInt, timingSafeEqual } from "crypto";
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

// In-memory store — codes are short-lived so no persistence needed
const store = new Map<string, Pending>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of store) {
    if (now > val.expiresAt) store.delete(key);
  }
}, 5 * 60 * 1000);

export function generateCode(): string {
  // Cryptographically random 6-digit code
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
  store.set(data.email.toLowerCase(), {
    code,
    name: data.name,
    email: data.email.toLowerCase(),
    passwordHash,
    reason: data.reason,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    attempts: 0,
  });
  return code;
}

export function getPending(email: string): Pending | undefined {
  const entry = store.get(email.toLowerCase());
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    store.delete(email.toLowerCase());
    return undefined;
  }
  return entry;
}

// Returns true if code matches, false if wrong, null if expired/not found
export function checkCode(email: string, code: string): boolean | null {
  const entry = getPending(email);
  if (!entry) return null;
  entry.attempts++;
  // Lock out after 5 wrong attempts
  if (entry.attempts > 5) {
    store.delete(email.toLowerCase());
    return null;
  }
  // Timing-safe comparison prevents brute-force via response timing
  const a = Buffer.from(entry.code, "utf-8");
  const b = Buffer.from(code.trim().padEnd(entry.code.length, " "), "utf-8");
  return a.length === b.length && timingSafeEqual(a, b);
}

export function consumePending(email: string): Pending | undefined {
  const entry = getPending(email);
  if (entry) store.delete(email.toLowerCase());
  return entry;
}
