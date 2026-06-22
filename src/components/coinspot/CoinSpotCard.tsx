"use client";

import { useEffect, useState } from "react";
import { Bitcoin, AlertCircle, ExternalLink } from "lucide-react";
import { formatCurrency, formatCrypto } from "@/lib/utils";

interface CoinBalance {
  coin: string;
  audbalance: number;
  balance: number;
  rate: number;
  name?: string;
}

interface CoinSpotCardProps {
  onTotalChange: (total: number) => void;
}

export default function CoinSpotCard({ onTotalChange }: CoinSpotCardProps) {
  const [balances, setBalances] = useState<CoinBalance[]>([]);
  const [status, setStatus] = useState<"loading" | "ok" | "unconfigured" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/coinspot");
        const data = await res.json();

        if (data.error?.includes("not configured")) {
          setStatus("unconfigured");
          return;
        }

        if (data.status !== "ok" || !data.balances) {
          setStatus("error");
          setErrorMsg(data.message || data.error || "Unknown error");
          return;
        }

        const parsed: CoinBalance[] = data.balances.flatMap(
          (entry: Record<string, CoinBalance>) =>
            Object.values(entry).filter((b) => b.audbalance > 0)
        );

        parsed.sort((a, b) => b.audbalance - a.audbalance);
        setBalances(parsed);
        onTotalChange(parsed.reduce((s, b) => s + b.audbalance, 0));
        setStatus("ok");
      } catch {
        setStatus("error");
        setErrorMsg("Failed to connect to CoinSpot");
      }
    }
    load();
  }, [onTotalChange]);

  const total = balances.reduce((s, b) => s + b.audbalance, 0);

  return (
    <div className="rounded-2xl border border-[#1e2d4a] bg-[#0f1a2e] p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
            <Bitcoin className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <p className="font-semibold text-white">CoinSpot</p>
            <p className="text-xs text-slate-500">Crypto Portfolio</p>
          </div>
        </div>
        <a
          href="https://www.coinspot.com.au/my/portfolio"
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-lg hover:bg-[#1e2d4a] text-slate-500 hover:text-slate-300 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {status === "loading" && (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 bg-[#1e2d4a] rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {status === "unconfigured" && (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <AlertCircle className="w-8 h-8 text-slate-600" />
          <p className="text-slate-400 text-sm">CoinSpot not configured</p>
          <a href="/settings" className="text-emerald-400 text-xs hover:underline">
            Add API keys →
          </a>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-500/60" />
          <p className="text-red-400 text-sm">Error loading CoinSpot</p>
          <p className="text-slate-500 text-xs">{errorMsg}</p>
        </div>
      )}

      {status === "ok" && (
        <>
          <div>
            <p className="text-xs text-slate-500 mb-0.5">Total Value</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(total)}</p>
          </div>

          <div className="space-y-1 flex-1 overflow-y-auto max-h-72">
            {balances.map((b) => (
              <div
                key={b.coin}
                className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#152240] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-orange-500/20 flex items-center justify-center text-xs font-bold text-orange-300">
                    {b.coin.slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{b.coin}</p>
                    <p className="text-xs text-slate-500">
                      {formatCrypto(b.balance)} @ {formatCurrency(b.rate)}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-white">
                  {formatCurrency(b.audbalance)}
                </p>
              </div>
            ))}

            {balances.length === 0 && (
              <p className="text-center text-slate-500 text-sm py-4">
                No balances found
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
