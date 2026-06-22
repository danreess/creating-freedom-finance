import * as OTPAuth from "otpauth";
import { randomBytes } from "crypto";
import { hashPassword, verifyPassword } from "./users";

const ISSUER = "Creating Freedom Finance";

export function generateTotpSecret(): string {
  const totp = new OTPAuth.TOTP({ issuer: ISSUER, algorithm: "SHA1", digits: 6, period: 30 });
  return totp.secret.base32;
}

export function getTotpUri(email: string, secret: string): string {
  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    label: email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
  return totp.toString();
}

export function verifyTotpCode(secret: string, code: string): boolean {
  try {
    const totp = new OTPAuth.TOTP({
      issuer: ISSUER,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret),
    });
    // window: 1 allows one 30s period of clock drift in either direction
    return totp.validate({ token: code.replace(/\s/g, ""), window: 1 }) !== null;
  } catch {
    return false;
  }
}

// ── Backup codes ───────────────────────────────────────────────────────────────

export function generateBackupCodes(): string[] {
  return Array.from({ length: 8 }, () => {
    const hex = randomBytes(4).toString("hex").toUpperCase();
    return `${hex.slice(0, 4)}-${hex.slice(4)}`;
  });
}

export async function hashBackupCodes(codes: string[]): Promise<string[]> {
  return Promise.all(codes.map((c) => hashPassword(c.replace("-", ""))));
}

export async function consumeBackupCode(
  raw: string,
  hashed: string[]
): Promise<{ valid: boolean; remaining: string[] }> {
  const normalized = raw.replace(/[-\s]/g, "").toUpperCase();
  for (let i = 0; i < hashed.length; i++) {
    if (await verifyPassword(normalized, hashed[i])) {
      return { valid: true, remaining: hashed.filter((_, j) => j !== i) };
    }
  }
  return { valid: false, remaining: hashed };
}
