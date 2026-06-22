"use client";

import { TrendingUp, Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface NetWorthCardProps {
  coinspotTotal: number;
  ingTotal: number;
  pearlerTotal: number;
  mortgageTotal: number;
  isLoading?: boolean;
}

export default function NetWorthCard({
  coinspotTotal,
  ingTotal,
  pearlerTotal,
  mortgageTotal,
  isLoading,
}: NetWorthCardProps) {
  const assets = coinspotTotal + ingTotal + pearlerTotal;
  const liabilities = mortgageTotal;
  const netWorth = assets - liabilities;

  const breakdown = [
    { label: "Crypto", value: coinspotTotal, color: "bg-orange-400" },
    { label: "Banking", value: ingTotal, color: "bg-blue-400" },
    { label: "Shares", value: pearlerTotal, color: "bg-purple-400" },
  ];

  return (
    <div className="rounded-2xl border border-[#1e2d4a] bg-[#0f1a2e] p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-400 uppercase tracking-wider">Net Worth</span>
          </div>
          {isLoading ? (
            <div className="h-10 w-48 bg-[#1e2d4a] rounded-lg animate-pulse" />
          ) : (
            <p className="text-4xl font-bold text-white tracking-tight">
              {formatCurrency(netWorth)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-sm">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Live</span>
        </div>
      </div>

      {liabilities > 0 && (
        <div className="flex items-center justify-between text-xs mb-3 px-1">
          <span className="text-slate-500">Assets <span className="text-white font-medium">{formatCurrency(assets)}</span></span>
          <span className="text-slate-600">−</span>
          <span className="text-slate-500">Liabilities <span className="text-red-400 font-medium">{formatCurrency(liabilities)}</span></span>
          <span className="text-slate-600">=</span>
          <span className="text-slate-500">Net Worth <span className="text-emerald-400 font-medium">{formatCurrency(netWorth)}</span></span>
        </div>
      )}

      <div className="flex gap-1 h-2 rounded-full overflow-hidden mb-4">
        {breakdown.map((item) => {
          const pct = assets > 0 ? (item.value / assets) * 100 : 0;
          return (
            <div key={item.label} className={`${item.color} transition-all duration-700`} style={{ width: `${pct}%` }} />
          );
        })}
        {assets === 0 && <div className="bg-[#1e2d4a] w-full" />}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {breakdown.map((item) => (
          <div key={item.label} className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${item.color}`} />
              <span className="text-xs text-slate-400">{item.label}</span>
            </div>
            {isLoading ? (
              <div className="h-4 w-20 bg-[#1e2d4a] rounded animate-pulse" />
            ) : (
              <span className="text-sm font-semibold text-white">{formatCurrency(item.value)}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
