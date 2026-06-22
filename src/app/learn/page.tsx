"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, AlertTriangle, TrendingUp, Shield, Calculator } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, CartesianGrid,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import {
  ANNUAL_RETURNS, ETF_STATS, buildGrowthSeries, calcCompoundGrowth,
} from "@/lib/education-data";

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ color: string; name: string; value: number }>; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[#0f1a2e] border border-[#1e2d4a] rounded-lg px-3 py-2 text-xs shadow-xl space-y-1">
        <p className="text-slate-400">{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }}>{p.name}: {typeof p.value === "number" && p.value > 1000 ? formatCurrency(p.value) : `${p.value}%`}</p>
        ))}
      </div>
    );
  }
  return null;
};

function Disclaimer() {
  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-2">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
        <h3 className="text-amber-400 font-semibold text-sm">Not Financial Advice — Important Disclaimer</h3>
      </div>
      <p className="text-slate-400 text-xs leading-relaxed">
        This app and everything in the Learn section is <strong className="text-white">general information only</strong> — it is not financial advice, and we are not licensed financial advisers under the Corporations Act 2001 (Cth). Nothing here takes into account your personal financial situation, objectives, or needs.
      </p>
      <p className="text-slate-400 text-xs leading-relaxed">
        <strong className="text-white">Past performance is not indicative of future performance.</strong> All investments carry risk, including the potential loss of capital. Market data and statistics shown are approximate historical figures for educational purposes.
      </p>
      <p className="text-slate-400 text-xs leading-relaxed">
        Before making any investment decisions, you should consider seeking independent financial advice from a licensed adviser (holding an AFS Licence). You can find a licensed adviser at <strong className="text-white">moneysmart.gov.au</strong>.
      </p>
      <p className="text-slate-500 text-xs">By using this app, you accept that the developers are not liable for any financial decisions made based on this information.</p>
    </div>
  );
}

function CompoundCalculator() {
  const [initial, setInitial] = useState(10000);
  const [monthly, setMonthly] = useState(500);
  const [years, setYears] = useState(20);

  const etfResult = calcCompoundGrowth(initial, monthly, years, ETF_STATS.sp500AvgReturn);
  const savingsResult = calcCompoundGrowth(initial, monthly, years, 3.5);
  const managedResult = calcCompoundGrowth(initial, monthly, years, ETF_STATS.sp500AvgReturn - 1.8);
  const totalContributed = initial + monthly * 12 * years;

  const data = Array.from({ length: years + 1 }, (_, i) => ({
    year: `Year ${i}`,
    "ETF Index Fund": Math.round(calcCompoundGrowth(initial, monthly, i, ETF_STATS.sp500AvgReturn)),
    "Managed Fund": Math.round(calcCompoundGrowth(initial, monthly, i, ETF_STATS.sp500AvgReturn - 1.8)),
    "Savings Account": Math.round(calcCompoundGrowth(initial, monthly, i, 3.5)),
  }));

  return (
    <div className="rounded-2xl border border-[#1e2d4a] bg-[#0f1a2e] p-6 space-y-5">
      <div className="flex items-center gap-2">
        <Calculator className="w-4 h-4 text-emerald-400" />
        <h3 className="text-white font-semibold">Compound Growth Calculator</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Starting Amount", value: initial, set: setInitial, min: 0, max: 100000, step: 1000 },
          { label: "Monthly Contribution", value: monthly, set: setMonthly, min: 0, max: 5000, step: 100 },
          { label: "Years", value: years, set: setYears, min: 1, max: 40, step: 1 },
        ].map((s) => (
          <div key={s.label}>
            <label className="text-xs text-slate-400 block mb-1">{s.label}: <strong className="text-white">{s.label === "Years" ? s.value : formatCurrency(s.value)}</strong></label>
            <input
              type="range"
              min={s.min}
              max={s.max}
              step={s.step}
              value={s.value}
              onChange={(e) => s.set(parseInt(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "ETF Index Fund", value: etfResult, color: "text-emerald-400", sub: `~${ETF_STATS.sp500AvgReturn}% p.a., ~0.1% fees` },
          { label: "Managed Fund", value: managedResult, color: "text-blue-400", sub: `~${ETF_STATS.sp500AvgReturn - 1.8}% p.a., ~1.8% fees` },
          { label: "Savings Account", value: savingsResult, color: "text-slate-400", sub: "~3.5% p.a." },
        ].map((r) => (
          <div key={r.label} className="bg-[#0a1222] rounded-xl p-3">
            <p className="text-xs text-slate-500">{r.label}</p>
            <p className={`text-lg font-bold ${r.color} mt-0.5`}>{formatCurrency(r.value)}</p>
            <p className="text-xs text-slate-600 mt-0.5">{r.sub}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-500">
        You contributed {formatCurrency(totalContributed)} — the ETF grows it to {formatCurrency(etfResult)}.
        That is <strong className="text-emerald-400">{formatCurrency(etfResult - savingsResult)} more</strong> than a savings account over {years} years.
      </p>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" />
          <XAxis dataKey="year" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} interval={Math.floor(years / 5)} />
          <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
          <Tooltip content={<CustomTooltip />} />
          <Line type="monotone" dataKey="ETF Index Fund" stroke="#10b981" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="Managed Fund" stroke="#60a5fa" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="Savings Account" stroke="#64748b" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-xs text-slate-600 italic">Based on historical averages. Past performance does not guarantee future results.</p>
    </div>
  );
}

function AnnualReturnsChart() {
  return (
    <div className="rounded-2xl border border-[#1e2d4a] bg-[#0f1a2e] p-6 space-y-3">
      <h3 className="text-white font-semibold">S&P 500 & ASX 200 Annual Returns (2000–2024)</h3>
      <p className="text-slate-500 text-xs">Despite crashes in 2002, 2008, and 2022 — the long-term trend has always recovered and grown.</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={ANNUAL_RETURNS} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" />
          <XAxis dataKey="year" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} interval={3} />
          <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
          <Tooltip formatter={(v) => `${Number(v).toFixed(1)}%`} contentStyle={{ backgroundColor: "#0f1a2e", border: "1px solid #1e2d4a", borderRadius: "8px", fontSize: "12px" }} />
          <ReferenceLine y={0} stroke="#334155" />
          <Bar dataKey="sp500" name="S&P 500" fill="#10b981" radius={[2, 2, 0, 0]} />
          <Bar dataKey="asx200" name="ASX 200" fill="#60a5fa" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs text-slate-600 italic">Source: S&P Global, ASX. Approximate total returns including dividends reinvested.</p>
    </div>
  );
}

function GrowthChart() {
  const data = buildGrowthSeries(10000);
  return (
    <div className="rounded-2xl border border-[#1e2d4a] bg-[#0f1a2e] p-6 space-y-3">
      <h3 className="text-white font-semibold">$10,000 Invested in 2000 — Where Is It Now?</h3>
      <p className="text-slate-500 text-xs">Lump sum, dividends reinvested, no additional contributions.</p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" />
          <XAxis dataKey="year" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
          <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
          <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ backgroundColor: "#0f1a2e", border: "1px solid #1e2d4a", borderRadius: "8px", fontSize: "12px" }} />
          <Line type="monotone" dataKey="etf" name="S&P 500 ETF" stroke="#10b981" strokeWidth={2.5} dot={false} />
          <Line type="monotone" dataKey="managed" name="Managed Fund (−2% fees)" stroke="#60a5fa" strokeWidth={2} dot={false} strokeDasharray="4 2" />
          <Line type="monotone" dataKey="savings" name="Savings Account" stroke="#64748b" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-xs text-slate-600 italic">Illustrative only. Source: S&P Global. Past performance is not indicative of future returns.</p>
    </div>
  );
}

const TOPICS = [
  {
    id: "etfs",
    icon: <TrendingUp className="w-4 h-4 text-emerald-400" />,
    title: "Why ETFs?",
    content: (
      <div className="space-y-4 text-sm text-slate-400 leading-relaxed">
        <p>An <strong className="text-white">Exchange Traded Fund (ETF)</strong> is a basket of hundreds or thousands of stocks bundled into a single investment you can buy on the ASX like a regular share.</p>
        <p>Instead of picking individual stocks (and risking being wrong), an index ETF simply <em>tracks the whole market</em>. If the overall market goes up, you go up with it.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { stat: `${ETF_STATS.pctActiveUnderperform15yr}%`, label: "of active managed funds underperform their benchmark over 15 years", source: "SPIVA Australia 2024" },
            { stat: `~${ETF_STATS.avgETFFee}%`, label: "average annual fee for a broad-market ETF (e.g. VAS, IVV)", source: "ASX ETF Report 2024" },
            { stat: `~${ETF_STATS.avgManagedFundFee}%`, label: "average annual fee for an active managed fund in Australia", source: "Morningstar 2024" },
          ].map((s) => (
            <div key={s.stat} className="bg-[#0a1222] rounded-xl p-3">
              <p className="text-2xl font-bold text-emerald-400">{s.stat}</p>
              <p className="text-xs text-slate-400 mt-1">{s.label}</p>
              <p className="text-xs text-slate-600 mt-1 italic">{s.source}</p>
            </div>
          ))}
        </div>
        <p>The fee difference matters enormously over time. A 1.7% difference in annual fees on $100,000 over 30 years costs you over <strong className="text-white">$200,000</strong> in lost compound growth.</p>
        <p><strong className="text-white">Popular Australian ETFs:</strong> VAS (ASX top 300), VGS (global ex-Australia), IVV (S&P 500), NDQ (Nasdaq 100). Always read the Product Disclosure Statement before investing.</p>
        <AnnualReturnsChart />
        <GrowthChart />
      </div>
    ),
  },
  {
    id: "emergency",
    icon: <Shield className="w-4 h-4 text-amber-400" />,
    title: "Emergency Fund",
    content: (
      <div className="space-y-4 text-sm text-slate-400 leading-relaxed">
        <p>An emergency fund is 3–6 months of living expenses held in a <strong className="text-white">high-interest savings account</strong> — liquid, safe, and separate from your investments.</p>
        <p>Without one, an unexpected expense (car repair, job loss, medical bill) forces you to sell investments at potentially the worst time, or go into debt.</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Single, renting, stable job", rec: "3 months expenses" },
            { label: "Mortgage, dependants", rec: "4–6 months expenses" },
            { label: "Self-employed / contractor", rec: "6+ months expenses" },
            { label: "Two income household", rec: "3 months of one income" },
          ].map((r) => (
            <div key={r.label} className="bg-[#0a1222] rounded-xl p-3">
              <p className="text-xs text-white font-medium">{r.label}</p>
              <p className="text-xs text-amber-400 mt-1">{r.rec}</p>
            </div>
          ))}
        </div>
        <p>Build your emergency fund <strong className="text-white">before</strong> aggressively investing. Once it is funded, invest the surplus. Use the Goals page to track your progress.</p>
      </div>
    ),
  },
];

export default function LearnPage() {
  const [openTopic, setOpenTopic] = useState<string | null>("etfs");

  return (
    <div className="min-h-screen bg-[#070d1a]">
      <div className="border-b border-[#1e2d4a] bg-[#0a1222]/80 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/" className="p-2 rounded-lg hover:bg-[#1e2d4a] text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="font-semibold text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-purple-400" /> Learn
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <Disclaimer />
        <CompoundCalculator />

        {TOPICS.map((topic) => (
          <div key={topic.id} className="rounded-2xl border border-[#1e2d4a] bg-[#0f1a2e] overflow-hidden">
            <button
              onClick={() => setOpenTopic(openTopic === topic.id ? null : topic.id)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#152240] transition-colors"
            >
              <div className="flex items-center gap-2">
                {topic.icon}
                <span className="text-white font-semibold">{topic.title}</span>
              </div>
              <span className="text-slate-500 text-lg">{openTopic === topic.id ? "−" : "+"}</span>
            </button>
            {openTopic === topic.id && (
              <div className="px-6 pb-6">{topic.content}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
