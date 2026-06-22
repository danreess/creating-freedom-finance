"use client";

import { useEffect, useState, useCallback } from "react";
import { Home, AlertCircle, TrendingDown, Plus, RefreshCw } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface LoanAccount {
  id: string;
  name: string;
  balance: string;
  currency: string;
  interestRate?: string;
  institution?: { shortName?: string; name?: string };
  class?: { type: string };
  loanDetails?: { repaymentFrequency?: string; repaymentAmount?: string };
}

interface MortgageCardProps {
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
            Basiq will open a secure page where you can connect your mortgage lender — CBA, Westpac, NAB, ANZ, Macquarie, St George, and 130+ more.
          </p>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Your Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
              className="w-full bg-[#0a1222] border border-[#1e2d4a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/60" />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Mobile Number</label>
            <input type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="+61412345678"
              className="w-full bg-[#0a1222] border border-[#1e2d4a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/60" />
          </div>
        </div>
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-3 text-xs text-slate-400 space-y-1">
          <p>🔒 <strong className="text-white">Read-only</strong> — Basiq can never move money</p>
          <p>✅ <strong className="text-white">CDR regulated</strong> — ACCC-accredited open banking</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-[#1e2d4a] text-slate-400 hover:text-white text-sm transition-colors">Cancel</button>
          <button onClick={handleConnect} disabled={loading}
            className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors disabled:opacity-50">
            {loading ? "Opening..." : "Choose My Bank →"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MortgageCard({ onTotalChange }: MortgageCardProps) {
  const [loans, setLoans] = useState<LoanAccount[]>([]);
  const [status, setStatus] = useState<"loading" | "ok" | "unconfigured" | "error" | "none">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [showModal, setShowModal] = useState(false);

  const loadData = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/basiq/loans");
      const data = await res.json();
      if (data.error?.includes("not configured")) { setStatus("unconfigured"); return; }
      if (data.error) { setStatus("error"); setErrorMsg(data.error); return; }
      const accounts: LoanAccount[] = data.data || [];
      if (accounts.length === 0) { setStatus("none"); return; }
      setLoans(accounts);
      onTotalChange(accounts.reduce((s, a) => s + Math.abs(parseFloat(a.balance || "0")), 0));
      setStatus("ok");
    } catch {
      setStatus("error");
      setErrorMsg("Failed to load loan data");
    }
  }, [onTotalChange]);

  useEffect(() => { loadData(); }, [loadData]);

  const total = loans.reduce((s, a) => s + Math.abs(parseFloat(a.balance || "0")), 0);

  // Group by institution
  const byInstitution = loans.reduce<Record<string, LoanAccount[]>>((map, loan) => {
    const key = loan.institution?.shortName || loan.institution?.name || "Lender";
    if (!map[key]) map[key] = [];
    map[key].push(loan);
    return map;
  }, {});

  return (
    <>
      {showModal && (
        <ConnectModal
          onClose={() => setShowModal(false)}
          onConnected={() => setTimeout(loadData, 3000)}
        />
      )}

      <div className="rounded-2xl border border-red-900/40 bg-[#0f1a2e] p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
              <Home className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <p className="font-semibold text-white">Mortgage / Loans</p>
              <p className="text-xs text-slate-500">
                {loans.length > 0
                  ? `${Object.keys(byInstitution).length} lender${Object.keys(byInstitution).length > 1 ? "s" : ""} · ${loans.length} loan${loans.length > 1 ? "s" : ""}`
                  : "via Basiq Open Banking"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {status === "ok" && (
              <button onClick={loadData} className="p-1.5 rounded-lg hover:bg-[#1e2d4a] text-slate-500 hover:text-slate-300 transition-colors" title="Refresh">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
            {(status === "ok" || status === "none") && (
              <button onClick={() => setShowModal(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs transition-colors">
                <Plus className="w-3 h-3" /> Add bank
              </button>
            )}
            {status === "ok" && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 text-xs ml-1">
                <TrendingDown className="w-3 h-3" />
                Liability
              </div>
            )}
          </div>
        </div>

        {status === "loading" && (
          <div className="space-y-2">
            {[...Array(2)].map((_, i) => <div key={i} className="h-14 bg-[#1e2d4a] rounded-lg animate-pulse" />)}
          </div>
        )}

        {status === "unconfigured" && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <AlertCircle className="w-8 h-8 text-slate-600" />
            <p className="text-slate-400 text-sm">No banks connected</p>
            <p className="text-slate-500 text-xs max-w-xs">Connect your mortgage lender via Basiq to track your loan balance here</p>
            <div className="flex gap-2">
              <a href="/settings" className="text-emerald-400 text-xs hover:underline">Configure Basiq →</a>
              <span className="text-slate-600 text-xs">·</span>
              <button onClick={() => setShowModal(true)} className="text-blue-400 text-xs hover:underline">Connect a bank</button>
            </div>
          </div>
        )}

        {status === "none" && (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <p className="text-slate-400 text-sm">No loans found on connected accounts</p>
            <p className="text-slate-500 text-xs">If your mortgage is with a different lender, connect it above</p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <AlertCircle className="w-7 h-7 text-red-500/60" />
            <p className="text-red-400 text-sm">{errorMsg}</p>
          </div>
        )}

        {status === "ok" && (
          <>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Total Owed</p>
              <p className="text-2xl font-bold text-red-400">-{formatCurrency(total)}</p>
            </div>
            <div className="space-y-3 overflow-y-auto max-h-64">
              {Object.entries(byInstitution).map(([lenderName, lenderLoans]) => (
                <div key={lenderName}>
                  <p className="text-xs text-slate-500 font-medium px-1 mb-1.5">{lenderName}</p>
                  <div className="space-y-1.5">
                    {lenderLoans.map((loan) => {
                      const balance = Math.abs(parseFloat(loan.balance || "0"));
                      return (
                        <div key={loan.id} className="px-3 py-2.5 rounded-lg bg-[#0a1222] border border-red-900/30">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium text-white">{loan.name}</p>
                              <p className="text-xs text-slate-500 capitalize">
                                {loan.class?.type?.replace(/_/g, " ") || "Loan"}
                                {loan.interestRate ? ` · ${loan.interestRate}% p.a.` : ""}
                              </p>
                            </div>
                            <p className="text-sm font-semibold text-red-400">-{formatCurrency(balance)}</p>
                          </div>
                          {loan.loanDetails?.repaymentAmount && (
                            <p className="text-xs text-slate-600 mt-1">
                              Repayment: {formatCurrency(parseFloat(loan.loanDetails.repaymentAmount))}
                              {loan.loanDetails.repaymentFrequency ? ` / ${loan.loanDetails.repaymentFrequency}` : ""}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
