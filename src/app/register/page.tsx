"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, Eye, EyeOff, User, Mail, Lock, MessageSquare, ArrowLeft, MailCheck } from "lucide-react";

const REASONS = [
  "Track personal finances",
  "Monitor investments & crypto",
  "Manage mortgage & loans",
  "Family budgeting",
  "Business expense tracking",
  "Other",
];

function passwordStrength(p: string): { score: number; label: string; color: string } {
  if (!p) return { score: 0, label: "", color: "" };
  let score = 0;
  if (p.length >= 8) score++;
  if (p.length >= 12) score++;
  if (/[A-Z]/.test(p)) score++;
  if (/[0-9]/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  if (score <= 1) return { score, label: "Weak", color: "bg-red-500" };
  if (score <= 2) return { score, label: "Fair", color: "bg-orange-500" };
  if (score <= 3) return { score, label: "Good", color: "bg-yellow-500" };
  if (score <= 4) return { score, label: "Strong", color: "bg-emerald-500" };
  return { score, label: "Very Strong", color: "bg-emerald-400" };
}

// ── Step 1: Registration form ──────────────────────────────────────────────────
function DetailsStep({
  onSent,
}: {
  onSent: (email: string, devCode: string | null) => void;
}) {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "", reason: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const strength = passwordStrength(form.password);
  const passwordsMatch = form.confirm ? form.password === form.confirm : null;

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) { setError("Passwords do not match"); return; }
    if (strength.score < 2) { setError("Please choose a stronger password"); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password, reason: form.reason }),
      });
      const data = await res.json();
      if (res.ok) {
        onSent(form.email, data.devCode ?? null);
      } else {
        setError(data.error || "Failed to send code");
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Name */}
      <div className="relative">
        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input type="text" value={form.name} onChange={set("name")} placeholder="Full name"
          required autoComplete="name"
          className="w-full bg-[#0f1a2e] border border-[#1e2d4a] rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/60 transition-colors" />
      </div>

      {/* Email */}
      <div className="relative">
        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input type="email" value={form.email} onChange={set("email")} placeholder="Email address"
          required autoComplete="email"
          className="w-full bg-[#0f1a2e] border border-[#1e2d4a] rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/60 transition-colors" />
      </div>

      {/* Password + strength */}
      <div className="space-y-1.5">
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type={showPass ? "text" : "password"} value={form.password} onChange={set("password")}
            placeholder="Password (min 8 chars)" required autoComplete="new-password"
            className="w-full bg-[#0f1a2e] border border-[#1e2d4a] rounded-xl pl-10 pr-10 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/60 transition-colors" />
          <button type="button" onClick={() => setShowPass((s) => !s)} tabIndex={-1}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
            {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {form.password && (
          <div className="space-y-1">
            <div className="flex gap-1">
              {[1,2,3,4,5].map((i) => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strength.score ? strength.color : "bg-[#1e2d4a]"}`} />
              ))}
            </div>
            <p className={`text-xs ${strength.score <= 1 ? "text-red-400" : strength.score <= 2 ? "text-orange-400" : strength.score <= 3 ? "text-yellow-400" : "text-emerald-400"}`}>
              {strength.label}
            </p>
          </div>
        )}
      </div>

      {/* Confirm */}
      <div className="relative">
        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input type={showPass ? "text" : "password"} value={form.confirm} onChange={set("confirm")}
          placeholder="Confirm password" required autoComplete="new-password"
          className={`w-full bg-[#0f1a2e] border rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-600 focus:outline-none transition-colors ${
            passwordsMatch === false ? "border-red-500/60" : passwordsMatch === true ? "border-emerald-500/60" : "border-[#1e2d4a]"
          }`} />
      </div>
      {passwordsMatch === false && <p className="text-red-400 text-xs -mt-1">Passwords do not match</p>}

      {/* Reason */}
      <div className="relative">
        <MessageSquare className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        <select value={form.reason} onChange={set("reason")} required
          className="w-full bg-[#0f1a2e] border border-[#1e2d4a] rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-emerald-500/60 transition-colors appearance-none">
          <option value="" disabled>Why are you joining?</option>
          {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {error && <p className="text-red-400 text-sm text-center">{error}</p>}

      <button type="submit" disabled={loading || !form.name || !form.email || !form.password || !form.confirm || !form.reason}
        className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
        {loading ? "Sending code..." : "Send Verification Code →"}
      </button>
    </form>
  );
}

// ── Step 2: Code entry ─────────────────────────────────────────────────────────
function CodeStep({ email, devCode, onBack }: { email: string; devCode: string | null; onBack: () => void }) {
  const router = useRouter();
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCountdown, setResendCountdown] = useState(60);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const t = setTimeout(() => setResendCountdown((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCountdown]);

  function handleDigit(idx: number, val: string) {
    // Handle paste of full code
    if (val.length === 6 && /^\d{6}$/.test(val)) {
      const next = val.split("");
      setDigits(next);
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

  const code = digits.join("");

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (res.ok) {
        router.replace(data.redirect ?? "/login?welcome=1");
      } else {
        setError(data.error || "Verification failed");
        if (res.status === 410) {
          // Code expired — go back to step 1
          setTimeout(onBack, 2000);
        }
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setError("");
    try {
      // Re-trigger send-code with the same email (server has pending data)
      // For resend we just call send-code again — server will update the pending entry
      await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // We can't resend without the form data — go back to step 1 instead
        body: JSON.stringify({ resend: true }),
      });
    } catch {
      // ignore
    }
    // Since we can't resend without the original form data, just go back to step 1
    onBack();
    setResending(false);
  }

  return (
    <form onSubmit={handleVerify} className="space-y-6">
      {/* Email indicator / dev mode banner */}
      {devCode ? (
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 space-y-2">
          <p className="text-amber-400 text-xs font-semibold uppercase tracking-wide">Email not configured — code shown here</p>
          <p className="text-3xl font-bold tracking-[0.3em] text-white font-mono text-center py-1">{devCode}</p>
          <p className="text-slate-500 text-xs text-center">Copy this code into the boxes below. Add email settings later in Settings.</p>
        </div>
      ) : (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <MailCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <p className="text-white text-sm font-medium">Code sent!</p>
            <p className="text-slate-400 text-xs">Check your inbox at <strong>{email}</strong></p>
          </div>
        </div>
      )}

      {/* 6-digit input */}
      <div>
        <p className="text-xs text-slate-500 text-center mb-3">Enter the 6-digit code from your email</p>
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

      {error && <p className="text-red-400 text-sm text-center">{error}</p>}

      <button type="submit" disabled={loading || code.length !== 6}
        className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
        {loading ? "Verifying..." : "Verify & Create Account"}
      </button>

      <div className="flex items-center justify-between text-sm">
        <button type="button" onClick={onBack}
          className="flex items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        {resendCountdown > 0 ? (
          <p className="text-slate-600 text-xs">Resend in {resendCountdown}s</p>
        ) : (
          <button type="button" onClick={handleResend} disabled={resending}
            className="text-emerald-400 hover:underline text-xs disabled:opacity-50">
            {resending ? "Going back..." : "Resend code"}
          </button>
        )}
      </div>
    </form>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const [step, setStep] = useState<"details" | "code">("details");
  const [email, setEmail] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);

  function handleSent(sentEmail: string, code: string | null) {
    setEmail(sentEmail);
    setDevCode(code);
    setStep("code");
  }

  return (
    <div className="min-h-screen bg-[#070d1a] flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-7 h-7 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            {step === "details" ? "Create Account" : "Check Your Email"}
          </h1>
          <p className="text-slate-500 text-sm">
            {step === "details"
              ? "Your data stays on your server — we store nothing"
              : "A 6-digit code is on its way"}
          </p>
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 pt-1">
            <div className="flex items-center gap-1.5">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === "details" ? "bg-emerald-500 text-white" : "bg-emerald-500/20 text-emerald-400"}`}>1</div>
              <span className="text-xs text-slate-500">Details</span>
            </div>
            <div className="w-8 h-px bg-[#1e2d4a]" />
            <div className="flex items-center gap-1.5">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === "code" ? "bg-emerald-500 text-white" : "bg-[#1e2d4a] text-slate-600"}`}>2</div>
              <span className="text-xs text-slate-500">Verify</span>
            </div>
          </div>
        </div>

        {step === "details" ? (
          <DetailsStep onSent={handleSent} />
        ) : (
          <CodeStep email={email} devCode={devCode} onBack={() => setStep("details")} />
        )}

        {step === "details" && (
          <p className="text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="text-emerald-400 hover:underline">Sign in</Link>
          </p>
        )}
      </div>
    </div>
  );
}
