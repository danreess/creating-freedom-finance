import { db } from "./db";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  reason: string;
  createdAt: string;
  sessionVersion: number;
  totpSecret: string | null;
  totpEnabled: number; // 0 or 1
  backupCodes: string | null; // JSON array of hashed codes
}

function rowToUser(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    email: row.email as string,
    name: row.name as string,
    passwordHash: row.password_hash as string,
    reason: row.reason as string,
    createdAt: row.created_at as string,
    sessionVersion: Number(row.session_version),
    totpSecret: (row.totp_secret as string | null) ?? null,
    totpEnabled: Number(row.totp_enabled),
    backupCodes: (row.backup_codes as string | null) ?? null,
  };
}

const MAX_PASSWORD_LENGTH = 1024;

export async function hashPassword(password: string): Promise<string> {
  if (password.length > MAX_PASSWORD_LENGTH) throw new Error("Password too long");
  const salt = randomBytes(16).toString("hex");
  const hash = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (password.length > MAX_PASSWORD_LENGTH) return false;
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const hashBuf = Buffer.from(hash, "hex");
  const inputHash = (await scryptAsync(password, salt, 64)) as Buffer;
  return timingSafeEqual(hashBuf, inputHash);
}

export async function getUsers(): Promise<User[]> {
  const rows = await db()`SELECT * FROM users ORDER BY created_at ASC`;
  return rows.map(r => rowToUser(r as Record<string, unknown>));
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const rows = await db()`SELECT * FROM users WHERE lower(email) = lower(${email})`;
  return rows[0] ? rowToUser(rows[0] as Record<string, unknown>) : undefined;
}

export async function getUserById(id: string): Promise<User | undefined> {
  const rows = await db()`SELECT * FROM users WHERE id = ${id}`;
  return rows[0] ? rowToUser(rows[0] as Record<string, unknown>) : undefined;
}

export async function createUser(data: {
  email: string;
  name: string;
  password: string;
  reason: string;
}): Promise<User> {
  const existing = await getUserByEmail(data.email);
  if (existing) throw new Error("Email already registered");

  const id = randomBytes(12).toString("hex");
  const email = data.email.toLowerCase().trim();
  const name = data.name.trim();
  const passwordHash = await hashPassword(data.password);
  const createdAt = new Date().toISOString();

  await db()`
    INSERT INTO users (id, email, name, password_hash, reason, created_at, session_version)
    VALUES (${id}, ${email}, ${name}, ${passwordHash}, ${data.reason}, ${createdAt}, 1)
  `;

  return {
    id, email, name, passwordHash, reason: data.reason, createdAt,
    sessionVersion: 1, totpSecret: null, totpEnabled: 0, backupCodes: null,
  };
}

export async function insertUserHashed(data: {
  email: string;
  name: string;
  passwordHash: string;
  reason: string;
}): Promise<User> {
  const id = randomBytes(12).toString("hex");
  const email = data.email.toLowerCase().trim();
  const name = data.name.trim();
  const createdAt = new Date().toISOString();

  await db()`
    INSERT INTO users (id, email, name, password_hash, reason, created_at, session_version)
    VALUES (${id}, ${email}, ${name}, ${data.passwordHash}, ${data.reason}, ${createdAt}, 1)
  `;

  return {
    id, email, name, passwordHash: data.passwordHash, reason: data.reason, createdAt,
    sessionVersion: 1, totpSecret: null, totpEnabled: 0, backupCodes: null,
  };
}

export async function updatePassword(userId: string, newPassword: string): Promise<void> {
  const hash = await hashPassword(newPassword);
  const rows = await db()`
    UPDATE users
    SET password_hash = ${hash}, session_version = session_version + 1
    WHERE id = ${userId}
    RETURNING id
  `;
  if (rows.length === 0) throw new Error("User not found");
}

export async function bumpSessionVersion(userId: string): Promise<void> {
  await db()`UPDATE users SET session_version = session_version + 1 WHERE id = ${userId}`;
}

export async function getSessionVersion(userId: string): Promise<number> {
  const rows = await db()`SELECT session_version FROM users WHERE id = ${userId}`;
  return rows[0] ? Number(rows[0].session_version) : 0;
}

// ── Per-account login lockout ──────────────────────────────────────────────────
const ACCOUNT_MAX_ATTEMPTS = 10;
const ACCOUNT_LOCKOUT_MS   = 30 * 60 * 1000;

export async function isAccountLocked(email: string): Promise<boolean> {
  const rows = await db()`
    SELECT count, locked_until FROM login_attempts WHERE email = lower(${email})
  `;
  if (rows.length === 0) return false;
  const lockedUntil = Number(rows[0].locked_until);
  if (lockedUntil > Date.now()) return true;
  if (lockedUntil > 0) {
    await db()`DELETE FROM login_attempts WHERE email = lower(${email})`;
  }
  return false;
}

export async function recordFailedLogin(email: string): Promise<void> {
  await db()`
    INSERT INTO login_attempts (email, count, locked_until)
    VALUES (lower(${email}), 1, 0)
    ON CONFLICT (email) DO UPDATE SET count = login_attempts.count + 1
  `;
  const rows = await db()`SELECT count FROM login_attempts WHERE email = lower(${email})`;
  const count = rows[0] ? Number(rows[0].count) : 0;
  if (count >= ACCOUNT_MAX_ATTEMPTS) {
    const lockUntil = Date.now() + ACCOUNT_LOCKOUT_MS;
    await db()`UPDATE login_attempts SET locked_until = ${lockUntil} WHERE email = lower(${email})`;
  }
}

export async function clearFailedLogins(email: string): Promise<void> {
  await db()`DELETE FROM login_attempts WHERE email = lower(${email})`;
}

export async function userCount(): Promise<number> {
  const rows = await db()`SELECT COUNT(*) as n FROM users`;
  return rows[0] ? Number(rows[0].n) : 0;
}

export async function updateName(userId: string, name: string): Promise<void> {
  await db()`UPDATE users SET name = ${name} WHERE id = ${userId}`;
}

export async function deleteUser(userId: string, email: string): Promise<void> {
  await db()`DELETE FROM users WHERE id = ${userId}`;
  await db()`DELETE FROM login_attempts WHERE email = lower(${email})`;
}

// ── TOTP / 2FA helpers ─────────────────────────────────────────────────────────

export async function saveTotpSecret(userId: string, secret: string): Promise<void> {
  await db()`UPDATE users SET totp_secret = ${secret}, totp_enabled = 0 WHERE id = ${userId}`;
}

export async function enableTotp(userId: string, hashedBackupCodes: string[]): Promise<void> {
  const codes = JSON.stringify(hashedBackupCodes);
  await db()`
    UPDATE users
    SET totp_enabled = 1, backup_codes = ${codes}, session_version = session_version + 1
    WHERE id = ${userId}
  `;
}

export async function disableTotp(userId: string): Promise<void> {
  await db()`
    UPDATE users
    SET totp_enabled = 0, totp_secret = NULL, backup_codes = NULL, session_version = session_version + 1
    WHERE id = ${userId}
  `;
}

export async function updateBackupCodes(userId: string, hashedCodes: string[]): Promise<void> {
  const codes = JSON.stringify(hashedCodes);
  await db()`UPDATE users SET backup_codes = ${codes} WHERE id = ${userId}`;
}

// ── Login activity log ─────────────────────────────────────────────────────────

export interface LoginEvent {
  id: string;
  ip: string;
  createdAt: string;
}

export async function recordLoginEvent(userId: string, ip: string): Promise<void> {
  const { randomBytes } = await import("crypto");
  const id = randomBytes(8).toString("hex");
  const createdAt = new Date().toISOString();
  await db()`
    INSERT INTO login_events (id, user_id, ip, created_at)
    VALUES (${id}, ${userId}, ${ip}, ${createdAt})
  `;
  // Keep only the 20 most recent events per user
  await db()`
    DELETE FROM login_events
    WHERE user_id = ${userId}
    AND id NOT IN (
      SELECT id FROM login_events
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 20
    )
  `;
}

export async function getLoginEvents(userId: string): Promise<LoginEvent[]> {
  const rows = await db()`
    SELECT id, ip, created_at FROM login_events
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 10
  `;
  return rows.map(r => ({
    id: r.id as string,
    ip: r.ip as string,
    createdAt: r.created_at as string,
  }));
}
