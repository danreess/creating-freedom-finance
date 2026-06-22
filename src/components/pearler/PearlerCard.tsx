"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Papa from "papaparse";
import { TrendingUp, Upload, AlertCircle, X, RefreshCw, Zap } from "lucide-react";
import { formatCurrency, formatCrypto } from "@/lib/utils";

interface Holding {
  name: string;
  ticker: string;
  units: number;
  value: number;
  price: number;
  gain?: number;
  gainPercent?: number;
}

interface PearlerCardProps {
  onTotalChange: (total: number) => void;
}

// ── CSV helpers ────────────────────────────────────────────────
const COMMON_HEADERS = {
  name: ["security name", "name", "description", "stock"],
  ticker: ["ticker", "code", "symbol", "asx code"],
  units: ["units", "quantity", "qty", "shares"],
  value: ["value", "market value", "total value", "aud value"],
  price: ["price", "current price", "last price", "market price"],
  cost: ["cost", "average cost", "avg cost", "cost base"],
};

function detectColumn(headers: string[], candidates: string[]): number {
  const lower = headers.map((h) => h.toLowerCase().trim());
  for (const c of candidates) {
    const i = lower.indexOf(c);
    if (i >= 0) return i;
  }
  return -1;
}

function parseNumber(val: string): number {
  if (!val) return 0;
  return parseFloat(val.replace(/[$,\s]/g, "")) || 0;
}

// ── Sharesight holding shape (API v2) ─────────────────────────
interface SharesightHolding {
  symbol?: string;
  code?: string;
  name?: string;
  security_name?: string;
  quantity?: number;
  units?: number;
  current_price?: number;
  market_price?: number;
  value?: number;
  market_value?: number;
  gain_value?: number;
  gain_loss?: number;
  gain_percent?: number;
  percentage_gain?: number;
}

function mapSharesightHolding(h: SharesightHolding): Holding {
  const units = h.quantity ?? h.units ?? 0;
  const price = h.current_price ?? h.market_price ?? 0;
  const value = h.value ?? h.market_value ?? units * price;
  const gain = h.gain_value ?? h.gain_loss;
  const gainPercent = h.gain_percent ?? h.percentage_gain;
  return {
    ticker: h.symbol ?? h.code ?? "",
    name: h.name ?? h.security_name ?? "Unknown",
    units,
    price,
    value,
    gain,
    gainPercent,
  };
}

export default function PearlerCard({ onTotalChange }: PearlerCardProps) {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [mode, setMode] = useState<"sharesight" | "csv">("sharesight");
  const [sharesightStatus, setSharesightStatus] = useState<"loading" | "ok" | "unconfigured" | "error">("loading");
  const [sharesightPortfolioName, setSharesightPortfolioName] = useState("");
  const [csvStatus, setCsvStatus] = useState<"empty" | "ok" | "error">("empty");
  const [errorMsg, setErrorMsg] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Load Sharesight ────────────────────────────────────────
  const loadSharesight = useCallback(async () => {
    setSharesightStatus("loading");
    try {
      const res = await fetch("/api/sharesight/holdings");
      const data = await res.json();
      if (data.error?.includes("not configured")) { setSharesightStatus("unconfigured"); return; }
      if (data.error) { setSharesightStatus("error"); setErrorMsg(data.error); return; }
      const parsed: Holding[] = (data.holdings as SharesightHolding[])
        .map(mapSharesightHolding)
        .filter((h) => h.value > 0)
        .sort((a, b) => b.value - a.value);
      setHoldings(parsed);
      onTotalChange(parsed.reduce((s, h) => s + h.value, 0));
      setSharesightPortfolioName(data.portfolioName || "");
      setSharesightStatus("ok");
    } catch {
      setSharesightStatus("error");
      setErrorMsg("Failed to load Sharesight data");
    }
  }, [onTotalChange]);

  useEffect(() => { loadSharesight(); }, [loadSharesight]);

  // Switch to CSV mode if Sharesight not configured
  useEffect(() => {
    if (sharesightStatus === "unconfigured") setMode("csv");
  }, [sharesightStatus]);

  // ── CSV processing ─────────────────────────────────────────
  const processCSV = useCallback(
    (file: File) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const headers = results.meta.fields || [];
          const nameIdx = detectColumn(headers, COMMON_HEADERS.name);
          const tickerIdx = detectColumn(headers, COMMON_HEADERS.ticker);
          const unitsIdx = detectColumn(headers, COMMON_HEADERS.units);
          const valueIdx = detectColumn(headers, COMMON_HEADERS.value);
          const priceIdx = detectColumn(headers, COMMON_HEADERS.price);
          const costIdx = detectColumn(headers, COMMON_HEADERS.cost);

          if (valueIdx === -1 && priceIdx === -1) {
            setCsvStatus("error");
            setErrorMsg(`Could not find value/price column. Found: ${headers.join(", ")}`);
            return;
          }

          const parsed: Holding[] = (results.data as Record<string, string>[])
            .map((row) => {
              const units = unitsIdx >= 0 ? parseNumber(row[headers[unitsIdx]]) : 0;
              const price = priceIdx >= 0 ? parseNumber(row[headers[priceIdx]]) : 0;
              const value = valueIdx >= 0 ? parseNumber(row[headers[valueIdx]]) : units * price;
              const cost = costIdx >= 0 ? parseNumber(row[headers[costIdx]]) * units : 0;
              const gain = cost > 0 ? value - cost : undefined;
              const gainPercent = cost > 0 ? ((value - cost) / cost) * 100 : undefined;
              return {
                name: nameIdx >= 0 ? row[headers[nameIdx]] || "Unknown" : "Unknown",
                ticker: tickerIdx >= 0 ? row[headers[tickerIdx]] || "" : "",
                units, value, price, gain, gainPercent,
              };
            })
            .filter((h) => h.value > 0)
            .sort((a, b) => b.value - a.value);

          setHoldings(parsed);
          onTotalChange(parsed.reduce((s, h) => s + h.value, 0));
          setCsvStatus("ok");
        },
        error: (err: Error) => { setCsvStatus("error"); setErrorMsg(err.message); },
      });
    },
    [onTotalChange]
  );

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processCSV(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file?.name.endsWith(".csv")) processCSV(file);
  }

  const total = holdings.reduce((s, h) => s + h.value, 0);
  const isLive = mode === "sharesight" && sharesightStatus === "ok";

  return (
    <div className="rounded-2xl border border-[#1e2d4a] bg-[#0f1a2e] p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <p className="font-semibold text-white">Share Portfolio</p>
            <p className="text-xs text-slate-500">
              {isLive
                ? sharesightPortfolioName
                  ? `${sharesightPortfolioName} · via Sharesight`
                  : "via Sharesight"
                : mode === "csv" && csvStatus === "ok"
                ? "CSV import"
                : "Pearler · Sharesight · CSV"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {isLive && (
            <>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs">
                <Zap className="w-2.5 h-2.5" /> Live
              </div>
              <button onClick={loadSharesight} className="p-1.5 rounded-lg hover:bg-[#1e2d4a] text-slate-500 hover:text-slate-300 transition-colors" title="Refresh">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          {mode === "csv" && csvStatus === "ok" && (
            <button
              onClick={() => { setCsvStatus("empty"); setHoldings([]); onTotalChange(0); }}
              className="p-1.5 rounded-lg hover:bg-[#1e2d4a] text-slate-500 hover:text-slate-300 transition-colors"
              title="Clear CSV"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Mode tabs — only show if Sharesight is configured */}
      {sharesightStatus !== "unconfigured" && (
        <div className="flex gap-1 border-b border-[#1e2d4a]">
          {(["sharesight", "csv"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`text-xs px-3 py-1.5 rounded-t-lg transition-colors capitalize ${
                mode === m ? "text-white bg-[#1e2d4a]" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {m === "sharesight" ? "Sharesight" : "CSV Import"}
            </button>
          ))}
        </div>
      )}

      {/* ── Sharesight mode ── */}
      {mode === "sharesight" && (
        <>
          {sharesightStatus === "loading" && (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-[#1e2d4a] rounded-lg animate-pulse" />)}
            </div>
          )}

          {sharesightStatus === "error" && (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <AlertCircle className="w-8 h-8 text-red-500/60" />
              <p className="text-red-400 text-sm">Sharesight error</p>
              <p className="text-slate-500 text-xs max-w-xs">{errorMsg}</p>
              <button onClick={loadSharesight} className="text-purple-400 text-xs hover:underline">Retry →</button>
            </div>
          )}

          {sharesightStatus === "ok" && (
            <>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Portfolio Value</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(total)}</p>
              </div>
              <HoldingsList holdings={holdings} />
            </>
          )}
        </>
      )}

      {/* ── CSV mode ── */}
      {mode === "csv" && (
        <>
          {csvStatus === "empty" && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors flex flex-col items-center gap-3 ${
                dragOver ? "border-purple-500/60 bg-purple-500/10" : "border-[#1e2d4a] hover:border-purple-500/40 hover:bg-purple-500/5"
              }`}
            >
              <Upload className="w-8 h-8 text-slate-600" />
              <div>
                <p className="text-slate-300 text-sm font-medium">Drop Pearler CSV here</p>
                <p className="text-slate-500 text-xs mt-1">or click to browse · works with any broker CSV</p>
              </div>
              <p className="text-slate-600 text-xs max-w-xs">Export from Pearler → Portfolio → Export CSV</p>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
            </div>
          )}

          {csvStatus === "error" && (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <AlertCircle className="w-8 h-8 text-red-500/60" />
              <p className="text-red-400 text-sm">Could not parse CSV</p>
              <p className="text-slate-500 text-xs max-w-xs">{errorMsg}</p>
              <button onClick={() => setCsvStatus("empty")} className="text-purple-400 text-xs hover:underline">Try again →</button>
            </div>
          )}

          {csvStatus === "ok" && (
            <>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Portfolio Value</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(total)}</p>
              </div>
              <HoldingsList holdings={holdings} />
            </>
          )}
        </>
      )}

      {/* Sharesight setup prompt when unconfigured */}
      {mode === "csv" && sharesightStatus === "unconfigured" && csvStatus === "empty" && (
        <div className="rounded-xl bg-purple-500/5 border border-purple-500/20 p-3 text-xs text-slate-500 space-y-1">
          <p className="text-purple-300 font-medium">Want live data instead?</p>
          <p>Connect Sharesight to get real-time portfolio values without uploading a CSV each time.</p>
          <a href="/settings" className="text-purple-400 hover:underline block mt-1">Set up Sharesight →</a>
        </div>
      )}
    </div>
  );
}

function HoldingsList({ holdings }: { holdings: Holding[] }) {
  return (
    <div className="space-y-1 overflow-y-auto max-h-72">
      {holdings.map((h, i) => (
        <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#152240] transition-colors">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center text-xs font-bold text-purple-300">
              {(h.ticker || h.name).slice(0, 3)}
            </div>
            <div>
              <p className="text-sm font-medium text-white">{h.ticker || h.name}</p>
              <p className="text-xs text-slate-500">{formatCrypto(h.units, 4)} units @ {formatCurrency(h.price)}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-white">{formatCurrency(h.value)}</p>
            {h.gainPercent !== undefined && (
              <p className={`text-xs ${h.gainPercent >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {h.gainPercent >= 0 ? "+" : ""}{h.gainPercent.toFixed(2)}%
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
