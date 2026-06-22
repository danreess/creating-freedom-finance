// Web Crypto API — works in Edge Runtime (middleware) AND Node.js 18+
const enc = new TextEncoder();

const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

async function getKey(secret: string): Promise<CryptoKey> {
  return globalThis.crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string): ArrayBuffer {
  const pairs = hex.match(/.{2}/g) ?? [];
  const bytes = pairs.map((h) => parseInt(h, 16));
  return new Uint8Array(bytes).buffer as ArrayBuffer;
}

// Token format: uid:<userId>:v:<sessionVersion>:iat:<issuedAt>.<hmac>
export async function signSession(userId: string, sessionVersion: number): Promise<string> {
  const SECRET = process.env.SESSION_SECRET;
  if (!SECRET) throw new Error("SESSION_SECRET is not set");
  const payload = `uid:${userId}:v:${sessionVersion}:iat:${Date.now()}`;
  const key = await getKey(SECRET);
  const sig = await globalThis.crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return `${payload}.${toHex(sig)}`;
}

export async function verifySession(token: string): Promise<boolean> {
  const SECRET = process.env.SESSION_SECRET;
  if (!SECRET) return false;
  const lastDot = token.lastIndexOf(".");
  if (lastDot === -1) return false;
  const payload = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);
  if (sig.length !== 64) return false;
  try {
    const key = await getKey(SECRET);
    const valid = await globalThis.crypto.subtle.verify(
      "HMAC", key, fromHex(sig), enc.encode(payload)
    );
    if (!valid) return false;

    // Enforce expiry based on embedded timestamp
    const data = parsePayload(payload);
    if (!data) return false;
    if (Date.now() - data.iat > SESSION_MAX_AGE_MS) return false;

    return true;
  } catch {
    return false;
  }
}

interface SessionData {
  userId: string;
  sessionVersion: number;
  iat: number;
}

function parsePayload(payload: string): SessionData | null {
  // uid:<userId>:v:<version>:iat:<timestamp>
  const m = payload.match(/^uid:([^:]+):v:(\d+):iat:(\d+)$/);
  if (!m) return null;
  return { userId: m[1], sessionVersion: parseInt(m[2], 10), iat: parseInt(m[3], 10) };
}

export function getSessionData(token: string): SessionData | null {
  const lastDot = token.lastIndexOf(".");
  if (lastDot === -1) return null;
  return parsePayload(token.slice(0, lastDot));
}

// Legacy helper — kept for middleware compat
export function getUserIdFromToken(token: string): string | null {
  return getSessionData(token)?.userId ?? null;
}

// ── Temp token — short-lived, used only to bridge password-ok → 2FA verify ────
// Format: tmp:<userId>:iat:<timestamp>.<hmac>
const TEMP_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

export async function signTempToken(userId: string): Promise<string> {
  const SECRET = process.env.SESSION_SECRET;
  if (!SECRET) throw new Error("SESSION_SECRET is not set");
  const payload = `tmp:${userId}:iat:${Date.now()}`;
  const key = await getKey(SECRET);
  const sig = await globalThis.crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return `${payload}.${toHex(sig)}`;
}

export async function verifyTempToken(token: string): Promise<string | null> {
  const SECRET = process.env.SESSION_SECRET;
  if (!SECRET) return null;
  const lastDot = token.lastIndexOf(".");
  if (lastDot === -1) return null;
  const payload = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);
  if (sig.length !== 64) return null;
  try {
    const key = await getKey(SECRET);
    const valid = await globalThis.crypto.subtle.verify("HMAC", key, fromHex(sig), enc.encode(payload));
    if (!valid) return null;
    const m = payload.match(/^tmp:([^:]+):iat:(\d+)$/);
    if (!m) return null;
    if (Date.now() - parseInt(m[2], 10) > TEMP_MAX_AGE_MS) return null;
    return m[1]; // userId
  } catch {
    return null;
  }
}
