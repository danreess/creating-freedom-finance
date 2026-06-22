import crypto from "crypto";

function sign(data: object, secret: string): string {
  return crypto
    .createHmac("sha512", secret)
    .update(JSON.stringify(data))
    .digest("hex");
}

export interface CoinSpotBalance {
  coin: string;
  audbalance: number;
  balance: number;
  rate: number;
  btcbalance: number;
  name?: string;
  type?: string;
}

export interface CoinSpotResponse {
  status: string;
  balances?: Record<string, CoinSpotBalance>[];
  message?: string;
}

export async function fetchCoinSpotBalances(
  apiKey: string,
  secret: string
): Promise<CoinSpotResponse> {
  const nonce = Date.now();
  const postData = { nonce };

  const response = await fetch(
    "https://www.coinspot.com.au/api/v2/ro/my/balances",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        key: apiKey,
        sign: sign(postData, secret),
      },
      body: JSON.stringify(postData),
    }
  );

  if (!response.ok) {
    throw new Error(`CoinSpot API error: ${response.status}`);
  }

  return response.json();
}
