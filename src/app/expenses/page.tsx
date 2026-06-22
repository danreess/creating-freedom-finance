"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, CreditCard, AlertTriangle } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { categoriseTransaction, CATEGORIES, OTHER_CATEGORY, type Category } from "@/lib/categorize";

interface RawTransaction {
  id: string;
  description: string;
  amount: string;
  direction: string;
  postDate: string;
  subClass?: { title: string };
}

interface CategorisedTx extends RawTransaction {
  category: Category;
  amountNum: number;
}

const BUDGETS_KEY = "expense_budgets";
function loadBudgets(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(BUDGETS_KEY) || "{}"); } catch { return {}; }
}
function saveBudgets(b: Record<string, number>) {
  localStorage.setItem(BUDGETS_KEY, JSON.stringify(b));
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[#0f1a2e] border border-[#1e2d4a] rounded-lg px-3 py-2 text-sm shadow-xl">
        <p className="text-slate-400 text-xs">{label}</p>
        <p className="text-white font-semibold">{formatCurrency(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

export default function ExpensesPage() {
  const [transactions, setTransactions] = useState<CategorisedTx[]>([]);
  const [status, setStatus] = useState<"loading" | "ok" | "unconfigured" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [budgets, setBudgets] = useState<Record<string, number>>({});
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [budgetInput, setBudgetInput] = useState("");
  const [view, setView] = useState<"monthly" | "weekly">("monthly");

  useEffect(() => {
    setBudgets(loadBudgets());
    async function load() {
      try {
        const res = await fetch("/api/basiq/transactions?limit=200");
        const data = await res.json();
        if (data.error?.includes("not configured")) { setStatus("unconfigured"); return; }
        if (data.error) { setStatus("error"); setErrorMsg(data.error); return; }
        const raw: RawTransaction[] = data.data || [];
        const categorised = raw
          .filter((t) => t.direction === "debit")
          .map((t) => ({
            ...t,
            amountNum: Math.abs(parseFloat(t.amount)),
            category: categoriseTransaction(t.description, t.subClass?.title),
          }));
        setTransactions(categorised);
        setStatus("ok");
      } catch {
        setStatus("error");
        setErrorMsg("Failed to load transactions");
      }
    }
    load();
  }, []);

  const categoryTotals = useMemo(() => {
    const map: Record<string, { category: Category; total: number; count: number }> = {};
    for (const tx of transactions) {
      const key = tx.category.name;
      if (!map[key]) map[key] = { category: tx.category, total: 0, count: 0 };
      map[key].total += tx.amountNum;
      map[key].count++;
    }
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [transactions]);

  // Weekly spending for the last 8 weeks
  const weeklyData = useMemo(() => {
    const weeks: Record<string, number> = {};
    for (const tx of transactions) {
      const d = new Date(tx.postDate);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
      weeks[key] = (weeks[key] || 0) + tx.amountNum;
    }
    return Object.entries(weeks)
      .slice(-8)
      .map(([week, total]) => ({ week, total: Math.round(total) }));
  }, [transactions]);

  // Monthly spending for last 6 months
  const monthlyData = useMemo(() => {
    const months: Record<string, number> = {};
    for (const tx of transactions) {
      const key = new Date(tx.postDate).toLocaleDateString("en-AU", { month: "short", year: "numeric" });
      months[key] = (months[key] || 0) + tx.amountNum;
    }
    return Object.entries(months)
      .slice(-6)
      .map(([month, total]) => ({ month, total: Math.round(total) }));
  }, [transactions]);

  const totalSpend = transactions.reduce((s, t) => s + t.amountNum, 0);

  function setBudget(cat: string, amount: number) {
    const updated = { ...budgets, [cat]: amount };
    setBudgets(updated);
    saveBudgets(updated);
    setEditingBudget(null);
  }

  const allCategories = [...CATEGORIES, OTHER_CATEGORY];

  return (
    <div className="min-h-screen bg-[#070d1a]">
      <div className="border-b border-[#1e2d4a] bg-[#0a1222]/80 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/" className="p-2 rounded-lg hover:bg-[#1e2d4a] text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="font-semibold text-white flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-blue-400" /> Expenses
          </h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {status === "loading" && (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-[#0f1a2e] rounded-2xl animate-pulse" />)}
          </div>
        )}

        {status === "unconfigured" && (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <CreditCard className="w-10 h-10 text-slate-600" />
            <h2 className="text-white font-semibold">No bank connected</h2>
            <p className="text-slate-500 text-sm">Connect a bank account via Basiq to automatically categorise your spending.</p>
            <Link href="/settings" className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium">Configure Basiq →</Link>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <p className="text-red-400">{errorMsg}</p>
          </div>
        )}

        {status === "ok" && (
          <>
            {/* Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-2xl border border-[#1e2d4a] bg-[#0f1a2e] p-4 sm:col-span-2">
                <p className="text-xs text-slate-500">Total Spend (period)</p>
                <p className="text-2xl font-bold text-white mt-1">{formatCurrency(totalSpend)}</p>
              </div>
              <div className="rounded-2xl border border-[#1e2d4a] bg-[#0f1a2e] p-4">
                <p className="text-xs text-slate-500">Transactions</p>
                <p className="text-2xl font-bold text-white mt-1">{transactions.length}</p>
              </div>
              <div className="rounded-2xl border border-[#1e2d4a] bg-[#0f1a2e] p-4">
                <p className="text-xs text-slate-500">Categories</p>
                <p className="text-2xl font-bold text-white mt-1">{categoryTotals.length}</p>
              </div>
            </div>

            {/* Overspend alerts */}
            {categoryTotals
              .filter((c) => budgets[c.category.name] && c.total > budgets[c.category.name])
              .map((c) => (
                <div key={c.category.name} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <p className="text-sm text-red-300">
                    <strong>{c.category.name}</strong> is over budget —{" "}
                    spent {formatCurrency(c.total)} of {formatCurrency(budgets[c.category.name])} limit
                  </p>
                </div>
              ))}

            {/* Charts */}
            <div className="rounded-2xl border border-[#1e2d4a] bg-[#0f1a2e] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold">Spending Trend</h3>
                <div className="flex gap-1">
                  {(["monthly", "weekly"] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setView(v)}
                      className={`px-3 py-1 rounded-lg text-xs capitalize transition-colors ${
                        view === v ? "bg-[#1e2d4a] text-white" : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={(view === "monthly" ? monthlyData : weeklyData) as Array<{ week?: string; month?: string; total: number }>}>
                  <XAxis dataKey={view === "monthly" ? "month" : "week"} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Category breakdown pie */}
              <div className="rounded-2xl border border-[#1e2d4a] bg-[#0f1a2e] p-6">
                <h3 className="text-white font-semibold mb-4">By Category</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={categoryTotals.slice(0, 8)} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="total" nameKey={(d: { category: Category }) => d.category.name}>
                      {categoryTotals.slice(0, 8).map((entry, i) => (
                        <Cell key={i} fill={entry.category.color} strokeWidth={0} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                    <Legend formatter={(value) => <span className="text-slate-400 text-xs">{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Budgets */}
              <div className="rounded-2xl border border-[#1e2d4a] bg-[#0f1a2e] p-6 space-y-3">
                <h3 className="text-white font-semibold">Budgets</h3>
                <div className="space-y-2 overflow-y-auto max-h-64">
                  {categoryTotals.map(({ category, total }) => {
                    const budget = budgets[category.name];
                    const pct = budget ? Math.min(100, (total / budget) * 100) : null;
                    const over = budget && total > budget;
                    return (
                      <div key={category.name} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-300">{category.emoji} {category.name}</span>
                          <div className="flex items-center gap-2">
                            <span className={over ? "text-red-400" : "text-slate-400"}>
                              {formatCurrency(total)}{budget ? ` / ${formatCurrency(budget)}` : ""}
                            </span>
                            {editingBudget === category.name ? (
                              <input
                                autoFocus
                                type="number"
                                value={budgetInput}
                                onChange={(e) => setBudgetInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") setBudget(category.name, parseFloat(budgetInput));
                                  if (e.key === "Escape") setEditingBudget(null);
                                }}
                                onBlur={() => budgetInput && setBudget(category.name, parseFloat(budgetInput))}
                                className="w-20 bg-[#0a1222] border border-emerald-500/40 rounded px-1.5 py-0.5 text-xs text-white"
                                placeholder="budget"
                              />
                            ) : (
                              <button
                                onClick={() => { setEditingBudget(category.name); setBudgetInput(budget?.toString() || ""); }}
                                className="text-slate-600 hover:text-emerald-400 text-xs"
                              >
                                {budget ? "edit" : "set budget"}
                              </button>
                            )}
                          </div>
                        </div>
                        {pct !== null && (
                          <div className="h-1.5 bg-[#1e2d4a] rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${over ? "bg-red-500" : "bg-blue-500"}`} style={{ width: `${pct}%` }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Recent transactions */}
            <div className="rounded-2xl border border-[#1e2d4a] bg-[#0f1a2e] p-6 space-y-3">
              <h3 className="text-white font-semibold">Recent Transactions</h3>
              <div className="space-y-1 overflow-y-auto max-h-80">
                {transactions.slice(0, 50).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#152240] transition-colors">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{tx.category.emoji}</span>
                      <div>
                        <p className="text-xs font-medium text-white truncate max-w-48">{tx.description}</p>
                        <p className="text-xs text-slate-500">{tx.postDate} · {tx.category.name}</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-red-400">-{formatCurrency(tx.amountNum)}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
