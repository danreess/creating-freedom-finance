import Database from "better-sqlite3";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { mkdirSync, existsSync, readFileSync } from "fs";
import { join } from "path";

const scryptAsync = promisify(scrypt);

// DATA_DIR env var lets Railway/Fly mount a persistent volume at a custom path
const DATA_DIR = process.env.DATA_DIR || join(process.cwd(), "data");
const DB_FILE = join(DATA_DIR, "users.db");
const LEGACY_JSON = join(DATA_DIR, "users.json");

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

export const db = new Database(DB_FILE);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id             TEXT PRIMARY KEY,
    email          TEXT UNIQUE NOT NULL,
    name           TEXT NOT NULL,
    passwordHash   TEXT NOT NULL,
    reason         TEXT NOT NULL DEFAULT '',
    createdAt      TEXT NOT NULL,
    sessionVersion INTEGER NOT NULL DEFAULT 1,
    totpSecret     TEXT DEFAULT NULL,
    totpEnabled    INTEGER NOT NULL DEFAULT 0,
    backupCodes    TEXT DEFAULT NULL
  );

  CREATE TABLE IF NOT EXISTS login_attempts (
    email      TEXT PRIMARY KEY,
    count      INTEGER NOT NULL DEFAULT 0,
    lockedUntil INTEGER NOT NULL DEFAULT 0
  );
`);

// Add columns to existing databases that predate this schema
for (const ddl of [
  "ALTER TABLE users ADD COLUMN sessionVersion INTEGER NOT NULL DEFAULT 1",
  "ALTER TABLE users ADD COLUMN totpSecret TEXT DEFAULT NULL",
  "ALTER TABLE users ADD COLUMN totpEnabled INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE users ADD COLUMN backupCodes TEXT DEFAULT NULL",
]) {
  try { db.exec(ddl); } catch { /* column already exists */ }
}

// One-time migration from legacy JSON file
if (existsSync(LEGACY_JSON)) {
  try {
    const raw = JSON.parse(readFileSync(LEGACY_JSON, "utf-8"));
    const legacyUsers: User[] = raw.users ?? (Array.isArray(raw) ? raw : []);
    const insert = db.prepare(
      `INSERT OR IGNORE INTO users (id, email, name, passwordHash, reason, createdAt, sessionVersion)
       VALUES (@id, @email, @name, @passwordHash, @reason, @createdAt, 1)`
    );
    const migrate = db.transaction((users: User[]) => {
      for (const u of users) insert.run(u);
    });
    migrate(legacyUsers);
  } catch { /* ignore migration errors */ }
}

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  reason: string;
  createdAt: string;
  sessionVersion: number;
  totpSecret: string | null;
  totpEnabled: number; // 0 or 1 (SQLite has no boolean)
  backupCodes: string | null; // JSON array of hashed codes
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

export function getUsers(): User[] {
  return db.prepare("SELECT * FROM users ORDER BY createdAt ASC").all() as User[];
}

export function getUserByEmail(email: string): User | undefined {
  return db
    .prepare("SELECT * FROM users WHERE lower(email) = lower(?)")
    .get(email) as User | undefined;
}

export function getUserById(id: string): User | undefined {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as User | undefined;
}

export async function createUser(data: {
  email: string;
  name: string;
  password: string;
  reason: string;
}): Promise<User> {
  const existing = getUserByEmail(data.email);
  if (existing) throw new Error("Email already registered");

  const user: User = {
    id: randomBytes(12).toString("hex"),
    email: data.email.toLowerCase().trim(),
    name: data.name.trim(),
    passwordHash: await hashPassword(data.password),
    reason: data.reason,
    createdAt: new Date().toISOString(),
    sessionVersion: 1,
    totpSecret: null,
    totpEnabled: 0,
    backupCodes: null,
  };

  db.prepare(
    `INSERT INTO users (id, email, name, passwordHash, reason, createdAt, sessionVersion)
     VALUES (@id, @email, @name, @passwordHash, @reason, @createdAt, @sessionVersion)`
  ).run(user);

  return user;
}

export function insertUserHashed(data: {
  email: string;
  name: string;
  passwordHash: string;
  reason: string;
}): User {
  const id = randomBytes(12).toString("hex");
  const user: User = {
    id,
    email: data.email.toLowerCase().trim(),
    name: data.name.trim(),
    passwordHash: data.passwordHash,
    reason: data.reason,
    createdAt: new Date().toISOString(),
    sessionVersion: 1,
    totpSecret: null,
    totpEnabled: 0,
    backupCodes: null,
  };
  db.prepare(
    `INSERT INTO users (id, email, name, passwordHash, reason, createdAt, sessionVersion)
     VALUES (@id, @email, @name, @passwordHash, @reason, @createdAt, @sessionVersion)`
  ).run(user);
  return user;
}

export async function updatePassword(userId: string, newPassword: string): Promise<void> {
  const hash = await hashPassword(newPassword);
  // Bump sessionVersion so all existing sessions are immediately invalidated
  const result = db
    .prepare("UPDATE users SET passwordHash = ?, sessionVersion = sessionVersion + 1 WHERE id = ?")
    .run(hash, userId);
  if (result.changes === 0) throw new Error("User not found");
}

export function bumpSessionVersion(userId: string): void {
  db.prepare("UPDATE users SET sessionVersion = sessionVersion + 1 WHERE id = ?").run(userId);
}

export function getSessionVersion(userId: string): number {
  const row = db
    .prepare("SELECT sessionVersion FROM users WHERE id = ?")
    .get(userId) as { sessionVersion: number } | undefined;
  return row?.sessionVersion ?? 0;
}

// ── Per-account login lockout ──────────────────────────────────────────────────
const ACCOUNT_MAX_ATTEMPTS = 10;
const ACCOUNT_LOCKOUT_MS   = 30 * 60 * 1000; // 30 minutes

export function isAccountLocked(email: string): boolean {
  const row = db
    .prepare("SELECT count, lockedUntil FROM login_attempts WHERE email = lower(?)")
    .get(email) as { count: number; lockedUntil: number } | undefined;
  if (!row) return false;
  if (row.lockedUntil > Date.now()) return true;
  if (row.lockedUntil > 0) {
    // Lockout expired — reset
    db.prepare("DELETE FROM login_attempts WHERE email = lower(?)").run(email);
    return false;
  }
  return false;
}

export function recordFailedLogin(email: string): void {
  const now = Date.now();
  db.prepare(`
    INSERT INTO login_attempts (email, count, lockedUntil)
    VALUES (lower(?), 1, 0)
    ON CONFLICT(email) DO UPDATE SET count = count + 1
  `).run(email);
  const row = db
    .prepare("SELECT count FROM login_attempts WHERE email = lower(?)")
    .get(email) as { count: number } | undefined;
  if (row && row.count >= ACCOUNT_MAX_ATTEMPTS) {
    db.prepare("UPDATE login_attempts SET lockedUntil = ? WHERE email = lower(?)")
      .run(now + ACCOUNT_LOCKOUT_MS, email);
  }
}

export function clearFailedLogins(email: string): void {
  db.prepare("DELETE FROM login_attempts WHERE email = lower(?)").run(email);
}

export function userCount(): number {
  const row = db.prepare("SELECT COUNT(*) as n FROM users").get() as { n: number };
  return row.n;
}

export function updateName(userId: string, name: string): void {
  db.prepare("UPDATE users SET name = ? WHERE id = ?").run(name, userId);
}

// ── TOTP / 2FA helpers ─────────────────────────────────────────────────────────

export function saveTotpSecret(userId: string, secret: string): void {
  db.prepare("UPDATE users SET totpSecret = ?, totpEnabled = 0 WHERE id = ?").run(secret, userId);
}

export function enableTotp(userId: string, hashedBackupCodes: string[]): void {
  db.prepare(
    "UPDATE users SET totpEnabled = 1, backupCodes = ?, sessionVersion = sessionVersion + 1 WHERE id = ?"
  ).run(JSON.stringify(hashedBackupCodes), userId);
}

export function disableTotp(userId: string): void {
  db.prepare(
    "UPDATE users SET totpEnabled = 0, totpSecret = NULL, backupCodes = NULL, sessionVersion = sessionVersion + 1 WHERE id = ?"
  ).run(userId);
}

export function updateBackupCodes(userId: string, hashedCodes: string[]): void {
  db.prepare("UPDATE users SET backupCodes = ? WHERE id = ?")
    .run(JSON.stringify(hashedCodes), userId);
}
