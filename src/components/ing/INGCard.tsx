"use client";

import { useEffect, useState, useCallback } from "react";
import { Building2, AlertCircle, ExternalLink, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Account {
  id: string;
  name: string;
  accountNo?: string;
  balance: string;
  currency: string;
  class?: { type: string };
}

interface Transaction {
  id: string;
  description: string;
  amount: string;
  balance?: string;
  direction: string;
  postDate: string;
  subClass?: { title: string };
}

interface INGCardProps {
  onTotalChange: (total: number) => void;
}

export default function INGCard({ onTotalChange }: INGCardProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tab, setTab] = useState<"accounts" | "transactions">("accounts");
  const [status, setStatus] = useState<"loading" | "ok" | "unconfigured" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [connectLoading, setConnectLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [accRes, txRes] = await Promise.all([
        fetch("/api/basiq/accounts"),
        fetch("/api/basiq/transactions?limit=20"),
      ]);

      const accData = await accRes.json();
      const txData = await txRes.json();

      if (accData.error?.includes("not configured")) {
        setStatus("unconfigured");
        return;
      }

      if (accData.error) {
        setStatus("error");
        setErrorMsg(accData.error);
        return;
      }

      const accs: Account[] = accData.data || [];
      setAccounts(accs);

      const total = accs.reduce((s, a) => s + parseFloat(a.balance || "0"), 0);
      onTotalChange(total);

      setTransactions(txData.data || []);
      setStatus("ok");
    } catch {
      setStatus("error");
      setErrorMsg("Failed to connect to ING via Basiq");
    }
  }, [onTotalChange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleConnect() {
    setConnectLoading(true);
    try {
      const res = await fetch("/api/basiq/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: prompt("Enter your email for bank connection:") || "",
          mobile: prompt("Enter your mobile (e.g. +61412345678):") || "",
          institutionId: "AU00000",
        }),
      });
      const data = await res.json();
      if (data.authLink) {
        window.open(data.authLink, "_blank");
      } else {
        alert(data.error || "Failed to create auth link");
      }
    } catch {
      alert("Failed to initiate ING connection");
    } finally {
      setConnectLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[#1e2d4a] bg-[#0f1a2e] p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <p className="font-semibold text-white">ING Bank</p>
            <p className="text-xs text-slate-500">via Basiq Open Banking</p>
          </div>
        </div>
        <a
          href="https://www.ing.com.au"
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-lg hover:bg-[#1e2d4a] text-slate-500 hover:text-slate-300 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {status === "loading" && (
        <div className="space-y-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-16 bg-[#1e2d4a] rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {status === "unconfigured" && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <AlertCircle className="w-8 h-8 text-slate-600" />
          <p className="text-slate-400 text-sm">ING not connected</p>
          <p className="text-slate-500 text-xs max-w-xs">
            Requires Basiq API key in settings and ING authorisation
          </p>
          <div className="flex gap-2">
            <a href="/settings" className="text-emerald-400 text-xs hover:underline">
              Configure Basiq →
            </a>
            <span className="text-slate-600 text-xs">·</span>
            <button
              onClick={handleConnect}
              disabled={connectLoading}
              className="text-blue-400 text-xs hover:underline disabled:opacity-50"
            >
              {connectLoading ? "Opening..." : "Connect ING"}
            </button>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-500/60" />
          <p className="text-red-400 text-sm">Error loading ING</p>
          <p className="text-slate-500 text-xs">{errorMsg}</p>
          <button
            onClick={handleConnect}
            className="text-blue-400 text-xs hover:underline mt-1"
          >
            Reconnect ING →
          </button>
        </div>
      )}

      {status === "ok" && (
        <>
          <div>
            <p className="text-xs text-slate-500 mb-0.5">Total Balance</p>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(
                accounts.reduce((s, a) => s + parseFloat(a.balance || "0"), 0)
              )}
            </p>
          </div>

          <div className="flex gap-1 border-b border-[#1e2d4a] pb-0">
            {(["accounts", "transactions"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`text-xs px-3 py-1.5 rounded-t-lg capitalize transition-colors ${
                  tab === t
                    ? "text-white bg-[#1e2d4a]"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === "accounts" && (
            <div className="space-y-2 overflow-y-auto max-h-64">
              {accounts.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#0a1222] border border-[#1e2d4a]"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{a.name}</p>
                    {a.accountNo && (
                      <p className="text-xs text-slate-500">
                        ···· {a.accountNo.slice(-4)}
                      </p>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-white">
                    {formatCurrency(parseFloat(a.balance), a.currency)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {tab === "transactions" && (
            <div className="space-y-1 overflow-y-auto max-h-64">
              {transactions.slice(0, 15).map((tx) => {
                const amount = parseFloat(tx.amount);
                const isDebit = tx.direction === "debit" || amount < 0;
                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#152240] transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          isDebit
                            ? "bg-red-500/20"
                            : "bg-emerald-500/20"
                        }`}
                      >
                        {isDebit ? (
                          <ArrowUpRight className="w-3 h-3 text-red-400" />
                        ) : (
                          <ArrowDownLeft className="w-3 h-3 text-emerald-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-white truncate max-w-40">
                          {tx.description}
                        </p>
                        <p className="text-xs text-slate-500">{tx.postDate}</p>
                      </div>
                    </div>
                    <p
                      className={`text-xs font-semibold ${
                        isDebit ? "text-red-400" : "text-emerald-400"
                      }`}
                    >
                      {isDebit ? "-" : "+"}{formatCurrency(Math.abs(amount))}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
