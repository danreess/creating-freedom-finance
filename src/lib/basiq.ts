const BASIQ_BASE = "https://au-api.basiq.io";
const BASIQ_VERSION = "3.0";

function basiqHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "basiq-version": BASIQ_VERSION,
    "Content-Type": "application/json",
  };
}

export async function getBasiqToken(apiKey: string): Promise<string> {
  const encoded = Buffer.from(`${apiKey}:`).toString("base64");
  const res = await fetch(`${BASIQ_BASE}/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${encoded}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "basiq-version": BASIQ_VERSION,
    },
    body: "scope=SERVER_ACCESS",
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Basiq token error: ${err}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

export async function createBasiqUser(
  token: string,
  email: string,
  mobile: string
): Promise<string> {
  const res = await fetch(`${BASIQ_BASE}/users`, {
    method: "POST",
    headers: basiqHeaders(token),
    body: JSON.stringify({ email, mobile }),
  });

  if (!res.ok) throw new Error(`Basiq create user error: ${await res.text()}`);
  const data = await res.json();
  return data.id as string;
}

export async function createBasiqAuthLink(
  token: string,
  userId: string,
  mobile: string,
  email: string,
  callbackUrl: string,
  institutionId?: string  // omit to show Basiq's own bank picker (all 136+ institutions)
): Promise<string> {
  const body: Record<string, unknown> = { mobile, email, callbackUrl };
  if (institutionId) body.institution = { id: institutionId };

  const res = await fetch(`${BASIQ_BASE}/users/${userId}/auth_link`, {
    method: "POST",
    headers: basiqHeaders(token),
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Basiq auth link error: ${await res.text()}`);
  const data = await res.json();
  return data.links?.public as string;
}

export async function getBasiqAccounts(token: string, userId: string) {
  const res = await fetch(`${BASIQ_BASE}/users/${userId}/accounts`, {
    headers: basiqHeaders(token),
  });
  if (!res.ok) throw new Error(`Basiq accounts error: ${await res.text()}`);
  return res.json();
}

export async function getBasiqTransactions(
  token: string,
  userId: string,
  limit = 50
) {
  const res = await fetch(
    `${BASIQ_BASE}/users/${userId}/transactions?limit=${limit}`,
    { headers: basiqHeaders(token) }
  );
  if (!res.ok)
    throw new Error(`Basiq transactions error: ${await res.text()}`);
  return res.json();
}
