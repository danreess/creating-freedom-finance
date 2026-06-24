import { db } from "./db";
import { encrypt, decrypt } from "./encryption";

export type Service = "coinspot" | "sharesight" | "basiq";

export interface CoinSpotCreds   { apiKey: string; secret: string }
export interface SharesightCreds { clientId: string; clientSecret: string; refreshToken: string }
export interface BasiqCreds      { userId: string }

type CredsMap = {
  coinspot:   CoinSpotCreds;
  sharesight: SharesightCreds;
  basiq:      BasiqCreds;
};

export async function getConnection<S extends Service>(
  userId: string,
  service: S
): Promise<CredsMap[S] | null> {
  const rows = await db()`
    SELECT credentials FROM user_connections
    WHERE user_id = ${userId} AND service = ${service}
  `;
  if (!rows[0]) return null;
  try {
    return JSON.parse(decrypt(rows[0].credentials as string)) as CredsMap[S];
  } catch {
    return null;
  }
}

export async function saveConnection<S extends Service>(
  userId: string,
  service: S,
  creds: CredsMap[S]
): Promise<void> {
  const encrypted = encrypt(JSON.stringify(creds));
  const now = new Date().toISOString();
  await db()`
    INSERT INTO user_connections (user_id, service, credentials, created_at, updated_at)
    VALUES (${userId}, ${service}, ${encrypted}, ${now}, ${now})
    ON CONFLICT (user_id, service) DO UPDATE SET
      credentials = ${encrypted},
      updated_at  = ${now}
  `;
}

export async function deleteConnection(userId: string, service: Service): Promise<void> {
  await db()`
    DELETE FROM user_connections WHERE user_id = ${userId} AND service = ${service}
  `;
}

export async function getConnectionStatus(userId: string): Promise<Record<Service, boolean>> {
  const rows = await db()`
    SELECT service FROM user_connections WHERE user_id = ${userId}
  `;
  const connected = new Set(rows.map(r => r.service as string));
  return {
    coinspot:   connected.has("coinspot"),
    sharesight: connected.has("sharesight"),
    basiq:      connected.has("basiq"),
  };
}
