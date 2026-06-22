"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, Eye, EyeOff, Mail, Lock, Smartphone, KeyRound, ArrowLeft } from "lucide-react";

// ── Step 1: email + password ───────────────────────────────────────────────────
function PasswordStep({
  onSuccess,
  on2FA,
  welcome,
  from,
}: {
  onSuccess: () => void;
  on2FA: (tempToken: string) => void;
  welcome: boolean;
  from: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [noUsers, setNoUsers] = useState(false);

  useEffect(() => {
    fetch("/api/auth/user-count")
      .then((r) => r.json())
      .then((d) => { if (d.count === 0) setNoUsers(true); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (noUsers) router.replace("/register");
  }, [noUsers, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.requires2FA) {
          on2FA(data.tempToken);
        } else {
          router.replace(from);
        }
      } else {
        setError(data.error || "Login failed");
        setPassword("");
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {welcome && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-center space-y-1">
          <p className="text-emerald-400 font-semibold text-sm">Account created!</p>
          <p className="text-slate-400 text-xs">Your email was verified. Sign in below to get started.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address" required autoFocus autoComplete="email"
            className="w-full bg-[#0f1a2e] border border-[#1e2d4a] rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/60 transition-colors"
          />
        </div>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Password" required autoComplete="current-password"
            className="w-full bg-[#0f1a2e] border border-[#1e2d4a] rounded-xl pl-10 pr-10 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/60 transition-colors"
          />
          <button type="button" onClick={() => setShow((s) => !s)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300" tabIndex={-1}>
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <button type="submit" disabled={loading || !email || !password}
          className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500">
        No account yet?{" "}
        <Link href="/register" className="text-emerald-400 hover:underline">Create one</Link>
      </p>

      <div className="rounded-xl bg-[#0f1a2e] border border-[#1e2d4a] p-4 space-y-2 text-xs text-slate-500">
        <p>🔒 Session stored in HTTP-only cookie — not readable by JavaScript</p>
        <p>🛡️ All bank API calls happen server-side — credentials never leave the server</p>
        <p>👁️ Read-only access — no ability to move money</p>
      </div>
    </>
  );
}

// ── Step 2: TOTP / backup code ─────────────────────────────────────────────────
function TwoFAStep({
  tempToken,
  from,
  onBack,
}: {
  tempToken: string;
  from: string;
  onBack: () => void;
}) {
  const router = useRouter();
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [useBackup, setUseBackup] = useState(false);
  const [backupCode, setBackupCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  function handleDigit(idx: number, val: string) {
    if (val.length === 6 && /^\d{6}$/.test(val)) {
      setDigits(val.split(""));
      inputRefs.current[5]?.focus();
      return;
    }
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[idx] = digit;
    setDigits(next);
    if (digit && idx < 5) inputRefs.current[idx + 1]?.focus();
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  }

  const totpCode = digits.join("");

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    const code = useBackup ? backupCode : totpCode;
    if (!code) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/2fa/verify-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tempToken, code }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.backupCodeUsed && data.backupCodesLeft <= 2) {
          // Warn about low backup codes but still proceed
        }
        router.replace(from);
      } else {
        setError(data.error || "Verification failed");
        if (res.status === 401 && data.error?.includes("expired")) {
          setTimeout(onBack, 2000);
        }
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleVerify} className="space-y-6">
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#0f1a2e] border border-[#1e2d4a]">
        <Smartphone className="w-5 h-5 text-emerald-400 shrink-0" />
        <div>
          <p className="text-white text-sm font-medium">Two-factor authentication</p>
          <p className="text-slate-400 text-xs">
            {useBackup ? "Enter a backup code" : "Enter the 6-digit code from your authenticator app"}
          </p>
        </div>
      </div>

      {useBackup ? (
        <div>
          <label className="text-xs text-slate-500 mb-2 block">Backup code</label>
          <div className="relative">
            <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={backupCode} onChange={(e) => setBackupCode(e.target.value)}
              placeholder="XXXX-XXXX" autoFocus
              className="w-full bg-[#0f1a2e] border border-[#1e2d4a] rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/60 transition-colors font-mono tracking-widest uppercase"
            />
          </div>
        </div>
      ) : (
        <div>
          <p className="text-xs text-slate-500 text-center mb-3">6-digit authenticator code</p>
          <div className="flex gap-2 justify-center">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text" inputMode="numeric" maxLength={6}
                value={d}
                onChange={(e) => handleDigit(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onFocus={(e) => e.target.select()}
                autoFocus={i === 0}
                className={`w-11 h-14 text-center text-xl font-bold rounded-xl border bg-[#0a1222] text-white focus:outline-none transition-colors ${
                  d ? "border-emerald-500/60 text-emerald-400" : "border-[#1e2d4a] focus:border-emerald-500/40"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-red-400 text-sm text-center">{error}</p>}

      <button
        type="submit"
        disabled={loading || (useBackup ? !backupCode.trim() : totpCode.length !== 6)}
        className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Verifying..." : "Verify"}
      </button>

      <div className="flex items-center justify-between text-sm">
        <button type="button" onClick={onBack}
          className="flex items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors text-xs">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        <button type="button" onClick={() => { setUseBackup((b) => !b); setError(""); }}
          className="text-emerald-400 hover:underline text-xs">
          {useBackup ? "Use authenticator app" : "Use backup code"}
        </button>
      </div>
    </form>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
function LoginForm() {
  const params = useSearchParams();
  const from = params.get("from") || "/";
  const welcome = params.get("welcome") === "1";

  const [step, setStep] = useState<"password" | "2fa">("password");
  const [tempToken, setTempToken] = useState("");

  return (
    <div className="min-h-screen bg-[#070d1a] flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-7 h-7 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Creating Freedom Finance</h1>
          <p className="text-slate-500 text-sm">
            {step === "password" ? "Sign in to your account" : "Verify your identity"}
          </p>
        </div>

        {step === "password" ? (
          <PasswordStep
            welcome={welcome}
            from={from}
            onSuccess={() => {}}
            on2FA={(t) => { setTempToken(t); setStep("2fa"); }}
          />
        ) : (
          <TwoFAStep
            tempToken={tempToken}
            from={from}
            onBack={() => { setStep("password"); setTempToken(""); }}
          />
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
