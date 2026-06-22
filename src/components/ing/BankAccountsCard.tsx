"use client";

import { useEffect, useState, useCallback } from "react";
import { Building2, AlertCircle, Plus, ArrowUpRight, ArrowDownLeft, RefreshCw } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Account {
  id: string;
  name: string;
  accountNo?: string;
  balance: string;
  currency: string;
  institution?: { shortName?: string; name?: string; logo?: { links?: { square?: string } } };
  class?: { type: string };
}

interface Transaction {
  id: string;
  description: string;
  amount: string;
  direction: string;
  postDate: string;
  account?: string;
}

interface BankAccountsCardProps {
  onTotalChange: (total: number) => void;
}

function ConnectModal({ onClose, onConnected }: { onClose: () => void; onConnected: () => void }) {
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleConnect() {
    if (!email || !mobile) { setError("Email and mobile are required"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/basiq/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, mobile }),
        // No institutionId → Basiq shows its own picker with all 136+ banks
      });
      const data = await res.json();
      if (data.authLink) {
        window.open(data.authLink, "_blank");
        onConnected();
        onClose();
      } else {
        setError(data.error || "Failed to create connection link");
      }
    } catch {
      setError("Network error — check Basiq is configured in Settings");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-[#1e2d4a] bg-[#0f1a2e] p-6 space-y-5 shadow-2xl">
        <div>
          <h3 className="text-white font-semibold text-lg">Connect a Bank</h3>
          <p className="text-slate-400 text-sm mt-1">
            Basiq will open a secure page where you can choose your bank from 136+ Australian institutions — CBA, Westpac, NAB, ANZ, Macquarie, ING, and more.
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Your Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-[#0a1222] border border-[#1e2d4a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/60"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Mobile Number</label>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="+61412345678"
              className="w-full bg-[#0a1222] border border-[#1e2d4a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/60"
            />
          </div>
        </div>

        {error && <p className="text-red-400 text-xs">{error}</p>}

        <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-3 text-xs text-slate-400 space-y-1">
          <p>🔒 <strong className="text-white">Read-only access</strong> — Basiq can never move money</p>
          <p>✅ <strong className="text-white">Government regulated</strong> — ACCC-accredited under CDR</p>
          <p>🔁 <strong className="text-white">Revocable</strong> — disconnect any time from your bank app</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-[#1e2d4a] text-slate-400 hover:text-white text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConnect}
            disabled={loading}
            className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? "Opening..." : "Choose My Bank →"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BankAccountsCard({ onTotalChange }: BankAccountsCardProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tab, setTab] = useState<"accounts" | "transactions">("accounts");
  const [status, setStatus] = useState<"loading" | "ok" | "unconfigured" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [showModal, setShowModal] = useState(false);

  const loadData = useCallback(async () => {
    setStatus("loading");
    try {
      const [accRes, txRes] = await Promise.all([
        fetch("/api/basiq/accounts"),
        fetch("/api/basiq/transactions?limit=20"),
      ]);
      const accData = await accRes.json();
      const txData = await txRes.json();

      if (accData.error?.includes("not configured")) { setStatus("unconfigured"); return; }
      if (accData.error) { setStatus("error"); setErrorMsg(accData.error); return; }

      const accs: Account[] = (accData.data || []).filter(
        (a: Account) => !["loan", "mortgage", "line_of_credit"].includes(a.class?.type || "")
      );
      setAccounts(accs);
      onTotalChange(accs.reduce((s, a) => s + parseFloat(a.balance || "0"), 0));
      setTransactions(txData.data || []);
      setStatus("ok");
    } catch {
      setStatus("error");
      setErrorMsg("Failed to load bank data");
    }
  }, [onTotalChange]);

  useEffect(() => { loadData(); }, [loadData]);

  // Group accounts by institution
  const byInstitution = accounts.reduce<Record<string, Account[]>>((map, acc) => {
    const key = acc.institution?.shortName || acc.institution?.name || "Other";
    if (!map[key]) map[key] = [];
    map[key].push(acc);
    return map;
  }, {});

  const totalBalance = accounts.reduce((s, a) => s + parseFloat(a.balance || "0"), 0);

  return (
    <>
      {showModal && (
        <ConnectModal
          onClose={() => setShowModal(false)}
          onConnected={() => setTimeout(loadData, 3000)}
        />
      )}

      <div className="rounded-2xl border border-[#1e2d4a] bg-[#0f1a2e] p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="font-semibold text-white">Bank Accounts</p>
              <p className="text-xs text-slate-500">
                {accounts.length > 0
                  ? `${Object.keys(byInstitution).length} bank${Object.keys(byInstitution).length > 1 ? "s" : ""} · ${accounts.length} account${accounts.length > 1 ? "s" : ""}`
                  : "via Basiq Open Banking"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {status === "ok" && (
              <button
                onClick={loadData}
                className="p-1.5 rounded-lg hover:bg-[#1e2d4a] text-slate-500 hover:text-slate-300 transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
            {status === "ok" && (
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs transition-colors"
                title="Connect another bank"
              >
                <Plus className="w-3 h-3" /> Add bank
              </button>
            )}
          </div>
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
            <p className="text-slate-400 text-sm">No banks connected</p>
            <p className="text-slate-500 text-xs max-w-xs">
              Connect CBA, Westpac, NAB, ANZ, ING, Macquarie, and 130+ more via Basiq Open Banking
            </p>
            <div className="flex gap-2">
              <a href="/settings" className="text-emerald-400 text-xs hover:underline">
                Configure Basiq →
              </a>
              <span className="text-slate-600 text-xs">·</span>
              <button
                onClick={() => setShowModal(true)}
                className="text-blue-400 text-xs hover:underline"
              >
                Connect a bank
              </button>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <AlertCircle className="w-8 h-8 text-red-500/60" />
            <p className="text-red-400 text-sm">Error loading bank data</p>
            <p className="text-slate-500 text-xs">{errorMsg}</p>
            <button onClick={() => setShowModal(true)} className="text-blue-400 text-xs hover:underline mt-1">
              Connect a bank →
            </button>
          </div>
        )}

        {status === "ok" && (
          <>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Total Balance</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(totalBalance)}</p>
              </div>
            </div>

            <div className="flex gap-1 border-b border-[#1e2d4a]">
              {(["accounts", "transactions"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`text-xs px-3 py-1.5 rounded-t-lg capitalize transition-colors ${
                    tab === t ? "text-white bg-[#1e2d4a]" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {tab === "accounts" && (
              <div className="space-y-3 overflow-y-auto max-h-72">
                {Object.entries(byInstitution).map(([bankName, accs]) => (
                  <div key={bankName}>
                    <p className="text-xs text-slate-500 font-medium px-1 mb-1.5">{bankName}</p>
                    <div className="space-y-1.5">
                      {accs.map((a) => (
                        <div
                          key={a.id}
                          className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#0a1222] border border-[#1e2d4a]"
                        >
                          <div>
                            <p className="text-sm font-medium text-white">{a.name}</p>
                            {a.accountNo && (
                              <p className="text-xs text-slate-500">···· {a.accountNo.slice(-4)}</p>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-white">
                            {formatCurrency(parseFloat(a.balance), a.currency)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === "transactions" && (
              <div className="space-y-1 overflow-y-auto max-h-72">
                {transactions.slice(0, 15).map((tx) => {
                  const amount = parseFloat(tx.amount);
                  const isDebit = tx.direction === "debit" || amount < 0;
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#152240] transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isDebit ? "bg-red-500/20" : "bg-emerald-500/20"}`}>
                          {isDebit
                            ? <ArrowUpRight className="w-3 h-3 text-red-400" />
                            : <ArrowDownLeft className="w-3 h-3 text-emerald-400" />}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-white truncate max-w-40">{tx.description}</p>
                          <p className="text-xs text-slate-500">{tx.postDate}</p>
                        </div>
                      </div>
                      <p className={`text-xs font-semibold ${isDebit ? "text-red-400" : "text-emerald-400"}`}>
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
    </>
  );
}
