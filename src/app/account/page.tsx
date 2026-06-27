"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, User, Mail, Calendar, MessageSquare, Lock, CheckCircle,
  Eye, EyeOff, Shield, Plug, Fingerprint, Trash2, Download,
  AlertTriangle, Edit2, Check, X, Wifi, WifiOff, KeyRound,
  Smartphone, Copy, QrCode,
} from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  reason: string;
  createdAt: string;
  totpEnabled: number;
}

interface Connections {
  coinspot: { connected: boolean; label: string; description: string };
  basiq:    { connected: boolean; label: string; description: string };
  sharesight:{ connected: boolean; label: string; description: string };
  email:    { connected: boolean; label: string; description: string };
}

function passwordStrength(p: string): { score: number; label: string; color: string } {
  if (!p) return { score: 0, label: "", color: "" };
  let score = 0;
  if (p.length >= 8) score++;
  if (p.length >= 12) score++;
  if (/[A-Z]/.test(p)) score++;
  if (/[0-9]/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  if (score <= 1) return { score, label: "Weak",       color: "bg-red-500" };
  if (score <= 2) return { score, label: "Fair",       color: "bg-orange-500" };
  if (score <= 3) return { score, label: "Good",       color: "bg-yellow-500" };
  if (score <= 4) return { score, label: "Strong",     color: "bg-emerald-500" };
  return              { score, label: "Very Strong", color: "bg-emerald-400" };
}

// ── Tab definitions ────────────────────────────────────────────────────────────
const TABS = [
  { id: "profile",     label: "Profile",     icon: User },
  { id: "security",    label: "Security",    icon: Shield },
  { id: "connections", label: "Connections", icon: Plug },
  { id: "privacy",     label: "Privacy",     icon: Fingerprint },
] as const;
type TabId = typeof TABS[number]["id"];

// ── Profile tab ────────────────────────────────────────────────────────────────
function ProfileTab({ user, onNameUpdated }: { user: UserProfile; onNameUpdated: (name: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(user.name);
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState("");

  async function saveName() {
    setNameError("");
    setSaving(true);
    try {
      const res = await fetch("/api/auth/update-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameInput }),
      });
      const data = await res.json();
      if (res.ok) {
        onNameUpdated(data.name);
        setEditing(false);
      } else {
        setNameError(data.error || "Failed to update name");
      }
    } catch {
      setNameError("Network error");
    } finally {
      setSaving(false);
    }
  }

  const memberDays = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / 86_400_000);

  return (
    <div className="space-y-5">
      {/* Avatar + name */}
      <div className="rounded-2xl border border-[#1e2d4a] bg-[#0f1a2e] p-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-3xl font-bold text-emerald-400 shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  autoFocus
                  className="bg-[#0a1222] border border-emerald-500/60 rounded-lg px-3 py-1.5 text-white text-lg font-semibold focus:outline-none w-full max-w-xs"
                />
                <button onClick={saveName} disabled={saving}
                  className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50">
                  <Check className="w-4 h-4" />
                </button>
                <button onClick={() => { setEditing(false); setNameInput(user.name); setNameError(""); }}
                  className="p-1.5 rounded-lg hover:bg-[#1e2d4a] text-slate-400 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-xl font-semibold text-white truncate">{user.name}</p>
                <button onClick={() => setEditing(true)}
                  className="p-1 rounded-md hover:bg-[#1e2d4a] text-slate-500 hover:text-slate-300 transition-colors shrink-0">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {nameError && <p className="text-red-400 text-xs mt-1">{nameError}</p>}
            <p className="text-slate-500 text-sm mt-0.5">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <InfoCard icon={Mail} label="Email address" value={user.email} />
        <InfoCard icon={Calendar} label="Member since"
          value={new Date(user.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })} />
        <InfoCard icon={MessageSquare} label="Purpose" value={user.reason} />
        <InfoCard icon={KeyRound} label="Account ID" value={`${user.id.slice(0, 8)}…`} mono />
      </div>

      {/* Stats bar */}
      <div className="rounded-2xl border border-[#1e2d4a] bg-[#0f1a2e] p-5">
        <p className="text-xs text-slate-500 uppercase tracking-wide mb-4">Account stats</p>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-emerald-400">{memberDays}</p>
            <p className="text-xs text-slate-500 mt-1">Days active</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-400">4</p>
            <p className="text-xs text-slate-500 mt-1">Services available</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-400">AUD</p>
            <p className="text-xs text-slate-500 mt-1">Currency</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, label, value, mono = false }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-[#0a1222] border border-[#1e2d4a]">
      <Icon className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-slate-500 mb-0.5">{label}</p>
        <p className={`text-sm text-white truncate ${mono ? "font-mono" : ""}`}>{value}</p>
      </div>
    </div>
  );
}

// ── 2FA setup modal ────────────────────────────────────────────────────────────
function TwoFASetupModal({ onClose, onEnabled }: { onClose: () => void; onEnabled: () => void }) {
  const [step, setStep] = useState<"qr" | "codes">("qr");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loadingQr, setLoadingQr] = useState(true);

  useEffect(() => {
    fetch("/api/auth/2fa/setup", { method: "POST" })
      .then((r) => r.json())
      .then((d) => { setQrDataUrl(d.qrDataUrl); setSecret(d.secret); setLoadingQr(false); })
      .catch(() => { setError("Failed to start 2FA setup"); setLoadingQr(false); });
  }, []);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/2fa/verify-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (res.ok) {
        setBackupCodes(data.backupCodes);
        setStep("codes");
      } else {
        setError(data.error || "Invalid code");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  function copySecret() {
    navigator.clipboard.writeText(secret).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-[#0a1222] border border-[#1e2d4a] rounded-2xl p-6 space-y-5">
        {step === "qr" ? (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <QrCode className="w-4 h-4 text-emerald-400" /> Set up authenticator
              </h3>
              <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-400 text-xs">
              Scan this QR code with <strong className="text-white">Google Authenticator</strong>,{" "}
              <strong className="text-white">Authy</strong>, or any TOTP app.
            </p>

            <div className="flex justify-center">
              {loadingQr ? (
                <div className="w-40 h-40 rounded-xl bg-[#0f1a2e] border border-[#1e2d4a] flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                </div>
              ) : (
                <img src={qrDataUrl} alt="2FA QR code" className="w-48 h-48 rounded-xl" />
              )}
            </div>

            <div className="space-y-1">
              <p className="text-xs text-slate-500">Can{"'"}t scan? Enter this key manually:</p>
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#0f1a2e] border border-[#1e2d4a]">
                <code className="text-emerald-400 text-xs font-mono flex-1 break-all">{secret}</code>
                <button onClick={copySecret} className="text-slate-500 hover:text-white transition-colors shrink-0">
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <form onSubmit={handleVerify} className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 block mb-1.5">
                  Enter the 6-digit code to confirm it{"'"}s working
                </label>
                <input
                  value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000" maxLength={6} inputMode="numeric"
                  className="w-full bg-[#0f1a2e] border border-[#1e2d4a] rounded-xl px-4 py-2.5 text-white text-center text-xl font-mono tracking-widest placeholder-slate-600 focus:outline-none focus:border-emerald-500/60 transition-colors"
                />
              </div>
              {error && <p className="text-red-400 text-xs text-center">{error}</p>}
              <button type="submit" disabled={loading || code.length !== 6}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors disabled:opacity-50">
                {loading ? "Verifying..." : "Activate 2FA"}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" /> 2FA enabled!
              </h3>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1">
              <p className="text-amber-400 text-xs font-semibold">Save these backup codes now</p>
              <p className="text-slate-400 text-xs">
                Each code can only be used once. Store them somewhere safe — you{"'"}ll need one if you lose your phone.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((c) => (
                <div key={c} className="bg-[#0f1a2e] border border-[#1e2d4a] rounded-lg px-3 py-2 text-center">
                  <code className="text-emerald-400 text-sm font-mono">{c}</code>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                const text = backupCodes.join("\n");
                const blob = new Blob([text], { type: "text/plain" });
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = "finance-backup-codes.txt";
                a.click();
              }}
              className="w-full py-2 rounded-xl bg-[#1e2d4a] hover:bg-[#263656] text-white text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" /> Download backup codes
            </button>

            <button onClick={() => { onEnabled(); onClose(); }}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors">
              Done
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── 2FA disable modal ──────────────────────────────────────────────────────────
function TwoFADisableModal({ onClose, onDisabled }: { onClose: () => void; onDisabled: () => void }) {
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleDisable(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, code }),
      });
      const data = await res.json();
      if (res.ok) { onDisabled(); onClose(); }
      else setError(data.error || "Failed to disable 2FA");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-[#0a1222] border border-[#1e2d4a] rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold">Disable 2FA</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <p className="text-red-300 text-xs">
            Disabling 2FA reduces your account security. You{"'"}ll need both your password and current authenticator code to confirm.
          </p>
        </div>

        <form onSubmit={handleDisable} className="space-y-3">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Current password" required
            className="w-full bg-[#0f1a2e] border border-[#1e2d4a] rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-red-500/60 transition-colors" />
          <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="Authenticator code" maxLength={6} inputMode="numeric"
            className="w-full bg-[#0f1a2e] border border-[#1e2d4a] rounded-xl px-4 py-2.5 text-sm text-white text-center font-mono tracking-widest placeholder-slate-600 focus:outline-none focus:border-red-500/60 transition-colors" />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={loading || !password || code.length !== 6}
              className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors disabled:opacity-50">
              {loading ? "Disabling..." : "Disable 2FA"}
            </button>
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-[#1e2d4a] hover:bg-[#263656] text-slate-300 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Security tab ───────────────────────────────────────────────────────────────
interface LoginEvent { id: string; ip: string; createdAt: string }

function SecurityTab({ user, onTotpChange }: { user: UserProfile; onTotpChange: (enabled: boolean) => void }) {
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [showSetup2FA, setShowSetup2FA] = useState(false);
  const [showDisable2FA, setShowDisable2FA] = useState(false);
  const [loginHistory, setLoginHistory] = useState<LoginEvent[] | null>(null);

  useEffect(() => {
    fetch("/api/auth/login-history").then(r => r.json()).then(setLoginHistory).catch(() => {});
  }, []);

  const newStrength = passwordStrength(pwForm.next);
  const passwordsMatch = pwForm.confirm ? pwForm.next === pwForm.confirm : null;

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    if (pwForm.next !== pwForm.confirm) { setPwError("Passwords do not match"); return; }
    if (newStrength.score < 2) { setPwError("Please choose a stronger password"); return; }
    setPwLoading(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current: pwForm.current, newPassword: pwForm.next }),
      });
      const data = await res.json();
      if (res.ok) {
        setPwSuccess(true);
        setPwForm({ current: "", next: "", confirm: "" });
        setTimeout(() => setPwSuccess(false), 3000);
      } else {
        setPwError(data.error || "Failed to update password");
      }
    } catch {
      setPwError("Network error — please try again");
    } finally {
      setPwLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Change password */}
      <div className="rounded-2xl border border-[#1e2d4a] bg-[#0f1a2e] p-6 space-y-4">
        <div>
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-400" /> Change Password
          </h3>
          <p className="text-slate-500 text-xs mt-1">We recommend a unique password not used on other sites</p>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-3">
          <div className="relative">
            <input type={showPw ? "text" : "password"} value={pwForm.current}
              onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))}
              placeholder="Current password" required autoComplete="current-password"
              className="w-full bg-[#0a1222] border border-[#1e2d4a] rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/60 transition-colors pr-10" />
            <button type="button" onClick={() => setShowPw((s) => !s)} tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="space-y-1.5">
            <input type={showPw ? "text" : "password"} value={pwForm.next}
              onChange={(e) => setPwForm((f) => ({ ...f, next: e.target.value }))}
              placeholder="New password" required autoComplete="new-password"
              className="w-full bg-[#0a1222] border border-[#1e2d4a] rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/60 transition-colors" />
            {pwForm.next && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[1,2,3,4,5].map((i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= newStrength.score ? newStrength.color : "bg-[#1e2d4a]"}`} />
                  ))}
                </div>
                <p className={`text-xs ${newStrength.score <= 1 ? "text-red-400" : newStrength.score <= 2 ? "text-orange-400" : newStrength.score <= 3 ? "text-yellow-400" : "text-emerald-400"}`}>
                  {newStrength.label}
                </p>
              </div>
            )}
          </div>

          <input type={showPw ? "text" : "password"} value={pwForm.confirm}
            onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
            placeholder="Confirm new password" required autoComplete="new-password"
            className={`w-full bg-[#0a1222] border rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none transition-colors ${
              passwordsMatch === false ? "border-red-500/60" : passwordsMatch === true ? "border-emerald-500/60" : "border-[#1e2d4a]"
            }`} />

          {pwError && <p className="text-red-400 text-xs">{pwError}</p>}
          {pwSuccess && (
            <p className="text-emerald-400 text-xs flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" /> Password updated successfully
            </p>
          )}
          <button type="submit" disabled={pwLoading || !pwForm.current || !pwForm.next || !pwForm.confirm}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors disabled:opacity-50">
            {pwLoading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>

      {/* 2FA */}
      <div className="rounded-2xl border border-[#1e2d4a] bg-[#0f1a2e] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-slate-400" /> Two-Factor Authentication
            </h3>
            <p className="text-slate-500 text-xs mt-1">
              Require an authenticator code every time you sign in
            </p>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
            user.totpEnabled
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-[#1e2d4a] border-[#1e2d4a] text-slate-500"
          }`}>
            {user.totpEnabled ? "Enabled" : "Disabled"}
          </span>
        </div>

        {user.totpEnabled ? (
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-300">
                Your account is protected with two-factor authentication. Every sign-in requires your password <em>and</em> a code from your authenticator app.
              </p>
            </div>
            <button onClick={() => setShowDisable2FA(true)}
              className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-medium transition-colors">
              Disable 2FA
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-300">
                2FA is not enabled. We strongly recommend enabling it — your financial data is sensitive.
              </p>
            </div>
            <button onClick={() => setShowSetup2FA(true)}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors flex items-center gap-2">
              <Smartphone className="w-4 h-4" /> Enable 2FA
            </button>
          </div>
        )}
      </div>

      {/* Security checklist */}
      <div className="rounded-2xl border border-[#1e2d4a] bg-[#0f1a2e] p-6 space-y-4">
        <h3 className="text-white font-semibold text-sm">Security Overview</h3>
        <div className="space-y-3">
          {[
            { ok: true,              label: "Password hashing",        detail: "scrypt with random salt — never stored in plain text" },
            { ok: true,              label: "HTTP-only session",        detail: "Cookie is inaccessible to JavaScript — XSS safe" },
            { ok: true,              label: "Server-side API keys",     detail: "Financial credentials never sent to your browser" },
            { ok: true,              label: "Rate limiting",            detail: "Per-IP and per-account lockout on failed logins" },
            { ok: true,              label: "CSRF protection",          detail: "SameSite=Strict cookie policy" },
            { ok: true,              label: "HTTPS headers",            detail: "HSTS, X-Frame-Options, CSP enforced" },
            { ok: !!user.totpEnabled, label: "Two-factor authentication", detail: user.totpEnabled ? "TOTP active — sign-ins require your authenticator app" : "Not enabled — recommended for a finance app" },
          ].map(({ ok, label, detail }) => (
            <div key={label} className="flex items-start gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${ok ? "bg-emerald-500/20" : "bg-amber-500/20"}`}>
                {ok
                  ? <CheckCircle className="w-3 h-3 text-emerald-400" />
                  : <AlertTriangle className="w-3 h-3 text-amber-400" />}
              </div>
              <div>
                <p className="text-sm text-white">{label}</p>
                <p className="text-xs text-slate-500">{detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Login activity */}
      <div className="rounded-2xl border border-[#1e2d4a] bg-[#0f1a2e] p-6 space-y-3">
        <h3 className="text-white font-semibold text-sm flex items-center gap-2">
          <Shield className="w-4 h-4 text-slate-400" /> Recent Login Activity
        </h3>
        {!loginHistory ? (
          <div className="flex items-center gap-2 text-slate-500 text-sm py-2">
            <div className="w-3 h-3 border border-slate-600 border-t-emerald-500 rounded-full animate-spin" />
            Loading…
          </div>
        ) : loginHistory.length === 0 ? (
          <p className="text-xs text-slate-500">No login history yet.</p>
        ) : (
          <div className="space-y-2">
            {loginHistory.map((e, i) => (
              <div key={e.id} className="flex items-center justify-between text-xs py-2 border-b border-[#1e2d4a] last:border-0">
                <div className="flex items-center gap-2">
                  {i === 0 && <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[10px]">Current</span>}
                  <span className="text-slate-300 font-mono">{e.ip}</span>
                </div>
                <span className="text-slate-500">{new Date(e.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-slate-600">You receive an email alert for every sign-in. If you see activity you don&apos;t recognise, change your password immediately.</p>
      </div>

      {showSetup2FA && (
        <TwoFASetupModal
          onClose={() => setShowSetup2FA(false)}
          onEnabled={() => onTotpChange(true)}
        />
      )}
      {showDisable2FA && (
        <TwoFADisableModal
          onClose={() => setShowDisable2FA(false)}
          onDisabled={() => onTotpChange(false)}
        />
      )}
    </div>
  );
}

// ── Connections tab ────────────────────────────────────────────────────────────
function CoinSpotForm({ onSaved }: { onSaved: () => void }) {
  const [apiKey, setApiKey] = useState("");
  const [secret, setSecret] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    const res = await fetch("/api/connections/coinspot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey, secret }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error || "Failed to save"); return; }
    onSaved();
  }

  return (
    <form onSubmit={handleSave} className="mt-3 space-y-3 border-t border-[#1e2d4a] pt-3">
      <p className="text-xs text-slate-400">
        Get your API key from{" "}
        <a href="https://www.coinspot.com.au/api" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">
          coinspot.com.au/api
        </a>{" "}— use a <strong>read-only</strong> key.
      </p>
      <input value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="API Key" required
        className="w-full bg-[#0a1222] border border-[#1e2d4a] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500" />
      <input value={secret} onChange={e => setSecret(e.target.value)} placeholder="Secret" required type="password"
        className="w-full bg-[#0a1222] border border-[#1e2d4a] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500" />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button type="submit" disabled={saving}
        className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors">
        {saving ? "Saving…" : "Save & Connect"}
      </button>
    </form>
  );
}

function SharesightForm({ onSaved }: { onSaved: () => void }) {
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    const res = await fetch("/api/connections/sharesight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, clientSecret, refreshToken }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error || "Failed to save"); return; }
    onSaved();
  }

  return (
    <form onSubmit={handleSave} className="mt-3 space-y-3 border-t border-[#1e2d4a] pt-3">
      <p className="text-xs text-slate-400">
        Register an OAuth app at{" "}
        <a href="https://portfolio.sharesight.com/api_partners/new" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">
          Sharesight API Partners
        </a>{" "}to get your client ID, secret, and refresh token.
      </p>
      <input value={clientId} onChange={e => setClientId(e.target.value)} placeholder="Client ID" required
        className="w-full bg-[#0a1222] border border-[#1e2d4a] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500" />
      <input value={clientSecret} onChange={e => setClientSecret(e.target.value)} placeholder="Client Secret" required type="password"
        className="w-full bg-[#0a1222] border border-[#1e2d4a] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500" />
      <input value={refreshToken} onChange={e => setRefreshToken(e.target.value)} placeholder="Refresh Token" required type="password"
        className="w-full bg-[#0a1222] border border-[#1e2d4a] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500" />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button type="submit" disabled={saving}
        className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors">
        {saving ? "Saving…" : "Save & Connect"}
      </button>
    </form>
  );
}

function ConnectionsTab() {
  const [conns, setConns] = useState<Connections | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  function reload() {
    fetch("/api/connections").then(r => r.json()).then(setConns).catch(() => {});
  }

  useEffect(() => { reload(); }, []);

  async function handleDisconnect(service: string) {
    setDisconnecting(service);
    await fetch(`/api/connections/${service}`, { method: "DELETE" });
    setDisconnecting(null);
    reload();
  }

  async function handleConnectBanks() {
    const res = await fetch("/api/basiq/connect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    const data = await res.json();
    if (data.authLink) window.location.href = data.authLink;
  }

  const ICONS: Record<string, string> = { coinspot: "₿", basiq: "🏦", sharesight: "📈", email: "✉️" };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#1e2d4a] bg-[#0f1a2e] p-5">
        <h3 className="text-white font-semibold mb-1">Your Connected Services</h3>
        <p className="text-slate-500 text-xs mb-4">Your credentials are encrypted and stored privately — other users cannot see them.</p>

        {!conns ? (
          <div className="flex items-center gap-2 text-slate-500 text-sm py-4">
            <div className="w-4 h-4 border border-slate-600 border-t-emerald-500 rounded-full animate-spin" />
            Checking connections…
          </div>
        ) : (
          <div className="space-y-3">
            {/* CoinSpot */}
            <div className="rounded-xl bg-[#0a1222] border border-[#1e2d4a] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0f1a2e] border border-[#1e2d4a] flex items-center justify-center text-lg">{ICONS.coinspot}</div>
                  <div>
                    <p className="text-sm text-white font-medium">CoinSpot</p>
                    <p className="text-xs text-slate-500">Crypto portfolio</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {conns.coinspot.connected ? (
                    <>
                      <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                        <Wifi className="w-3 h-3" /> Connected
                      </span>
                      <button onClick={() => handleDisconnect("coinspot")} disabled={disconnecting === "coinspot"}
                        className="text-xs text-slate-400 hover:text-red-400 transition-colors px-2 py-1">
                        {disconnecting === "coinspot" ? "…" : "Disconnect"}
                      </button>
                    </>
                  ) : (
                    <button onClick={() => setOpen(open === "coinspot" ? null : "coinspot")}
                      className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-[#1e2d4a] hover:bg-[#263656] border border-[#1e2d4a] px-2.5 py-1 rounded-full transition-colors">
                      <WifiOff className="w-3 h-3" /> Connect
                    </button>
                  )}
                </div>
              </div>
              {open === "coinspot" && !conns.coinspot.connected && (
                <CoinSpotForm onSaved={() => { setOpen(null); reload(); }} />
              )}
            </div>

            {/* Sharesight */}
            <div className="rounded-xl bg-[#0a1222] border border-[#1e2d4a] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0f1a2e] border border-[#1e2d4a] flex items-center justify-center text-lg">{ICONS.sharesight}</div>
                  <div>
                    <p className="text-sm text-white font-medium">Sharesight</p>
                    <p className="text-xs text-slate-500">Share portfolio</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {conns.sharesight.connected ? (
                    <>
                      <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                        <Wifi className="w-3 h-3" /> Connected
                      </span>
                      <button onClick={() => handleDisconnect("sharesight")} disabled={disconnecting === "sharesight"}
                        className="text-xs text-slate-400 hover:text-red-400 transition-colors px-2 py-1">
                        {disconnecting === "sharesight" ? "…" : "Disconnect"}
                      </button>
                    </>
                  ) : (
                    <button onClick={() => setOpen(open === "sharesight" ? null : "sharesight")}
                      className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-[#1e2d4a] hover:bg-[#263656] border border-[#1e2d4a] px-2.5 py-1 rounded-full transition-colors">
                      <WifiOff className="w-3 h-3" /> Connect
                    </button>
                  )}
                </div>
              </div>
              {open === "sharesight" && !conns.sharesight.connected && (
                <SharesightForm onSaved={() => { setOpen(null); reload(); }} />
              )}
            </div>

            {/* Basiq */}
            <div className="rounded-xl bg-[#0a1222] border border-[#1e2d4a] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0f1a2e] border border-[#1e2d4a] flex items-center justify-center text-lg">{ICONS.basiq}</div>
                  <div>
                    <p className="text-sm text-white font-medium">Bank Accounts</p>
                    <p className="text-xs text-slate-500">Australian banks via Open Banking</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {conns.basiq.connected ? (
                    <>
                      <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                        <Wifi className="w-3 h-3" /> Connected
                      </span>
                      <button onClick={handleConnectBanks}
                        className="text-xs text-slate-400 hover:text-white transition-colors px-2 py-1">
                        Reconnect
                      </button>
                      <button onClick={() => handleDisconnect("basiq")} disabled={disconnecting === "basiq"}
                        className="text-xs text-slate-400 hover:text-red-400 transition-colors px-2 py-1">
                        {disconnecting === "basiq" ? "…" : "Disconnect"}
                      </button>
                    </>
                  ) : (
                    <button onClick={handleConnectBanks}
                      className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-[#1e2d4a] hover:bg-[#263656] border border-[#1e2d4a] px-2.5 py-1 rounded-full transition-colors">
                      <WifiOff className="w-3 h-3" /> Connect Banks
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Email — read-only, app-level config */}
            <div className="rounded-xl bg-[#0a1222] border border-[#1e2d4a] p-4 opacity-70">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0f1a2e] border border-[#1e2d4a] flex items-center justify-center text-lg">{ICONS.email}</div>
                  <div>
                    <p className="text-sm text-white font-medium">Email</p>
                    <p className="text-xs text-slate-500">Verification emails — configured by the app owner</p>
                  </div>
                </div>
                {conns.email.connected ? (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                    <Wifi className="w-3 h-3" /> Active
                  </span>
                ) : (
                  <span className="text-xs text-slate-500">Not configured</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-[#1e2d4a] bg-[#0f1a2e] p-5">
        <p className="text-xs text-slate-400 font-medium mb-2">Security note</p>
        <p className="text-xs text-slate-500">
          Your API keys are encrypted with AES-256-GCM before being stored. Nobody else — including the app owner — can read your credentials.
          Use <strong className="text-slate-300">read-only</strong> API keys wherever the service offers them.
        </p>
      </div>
    </div>
  );
}

// ── Privacy tab ────────────────────────────────────────────────────────────────
function PrivacyTab({ user }: { user: UserProfile }) {
  const router = useRouter();
  const [deleteStep, setDeleteStep] = useState<"idle" | "confirm" | "deleting">("idle");
  const [deleteInput, setDeleteInput] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");

  function exportData() {
    const exportable = {
      id: user.id,
      name: user.name,
      email: user.email,
      reason: user.reason,
      createdAt: user.createdAt,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportable, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finance-account-${user.id.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDelete() {
    if (deleteInput !== user.email) {
      setDeleteError("Email does not match");
      return;
    }
    if (!deletePassword) {
      setDeleteError("Password is required");
      return;
    }
    setDeleteStep("deleting");
    try {
      const res = await fetch("/api/auth/delete-account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });
      if (res.ok) {
        router.replace("/register");
      } else {
        const d = await res.json();
        setDeleteError(d.error || "Delete failed");
        setDeleteStep("confirm");
      }
    } catch {
      setDeleteError("Network error");
      setDeleteStep("confirm");
    }
  }

  return (
    <div className="space-y-5">
      {/* Data info */}
      <div className="rounded-2xl border border-[#1e2d4a] bg-[#0f1a2e] p-6 space-y-4">
        <h3 className="text-white font-semibold">Your Data</h3>
        <div className="space-y-3 text-xs text-slate-400">
          {[
            "Your account data is stored locally in a SQLite database on this server — nothing is sent to third parties.",
            "Financial API keys are stored only in your .env.local file and are never logged or transmitted.",
            "Session tokens are signed with HMAC-SHA256 and expire after 7 days.",
            "No analytics, no tracking, no advertising — this app runs entirely on your own machine.",
          ].map((t) => (
            <div key={t} className="flex items-start gap-2.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <p>{t}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Export */}
      <div className="rounded-2xl border border-[#1e2d4a] bg-[#0f1a2e] p-6 space-y-3">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Download className="w-4 h-4 text-slate-400" /> Export Account Data
        </h3>
        <p className="text-slate-500 text-xs">Download a copy of your account information as JSON.</p>
        <button onClick={exportData}
          className="px-4 py-2 rounded-lg bg-[#1e2d4a] hover:bg-[#263656] text-white text-sm font-medium transition-colors flex items-center gap-2">
          <Download className="w-4 h-4" /> Download my data
        </button>
      </div>

      {/* Delete account */}
      <div className="rounded-2xl border border-red-500/20 bg-[#0f1a2e] p-6 space-y-4">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-red-400" /> Delete Account
        </h3>

        {deleteStep === "idle" && (
          <>
            <p className="text-slate-500 text-xs">
              Permanently deletes your account and all stored data. This cannot be undone.
            </p>
            <button onClick={() => setDeleteStep("confirm")}
              className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-medium transition-colors flex items-center gap-2">
              <Trash2 className="w-4 h-4" /> Delete my account
            </button>
          </>
        )}

        {(deleteStep === "confirm" || deleteStep === "deleting") && (
          <div className="space-y-3">
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-300">
                This will permanently delete your account. Type your email address to confirm.
              </p>
            </div>
            <input
              value={deleteInput}
              onChange={(e) => { setDeleteInput(e.target.value); setDeleteError(""); }}
              placeholder={user.email}
              className="w-full bg-[#0a1222] border border-red-500/30 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-red-500/60 transition-colors"
            />
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => { setDeletePassword(e.target.value); setDeleteError(""); }}
              placeholder="Your password"
              className="w-full bg-[#0a1222] border border-red-500/30 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-red-500/60 transition-colors"
            />
            {deleteError && <p className="text-red-400 text-xs">{deleteError}</p>}
            <div className="flex gap-2">
              <button onClick={handleDelete} disabled={deleteStep === "deleting"}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                {deleteStep === "deleting" ? "Deleting…" : "Confirm delete"}
              </button>
              <button onClick={() => { setDeleteStep("idle"); setDeleteInput(""); setDeleteError(""); }}
                disabled={deleteStep === "deleting"}
                className="px-4 py-2 rounded-lg bg-[#1e2d4a] hover:bg-[#263656] text-slate-300 text-sm transition-colors disabled:opacity-50">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("profile");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => { if (d.id) setUser(d); else router.replace("/login"); })
      .catch(() => router.replace("/login"));
  }, [router]);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#070d1a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070d1a]">
      {/* Header */}
      <div className="border-b border-[#1e2d4a] bg-[#0a1222]/80 sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/" className="p-2 rounded-lg hover:bg-[#1e2d4a] text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-sm font-bold text-emerald-400 shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <h1 className="font-semibold text-white truncate">{user.name}</h1>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Tab bar */}
        <div className="flex gap-1 p-1 rounded-xl bg-[#0a1222] border border-[#1e2d4a] mb-6">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === id
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-[#1e2d4a]"
              }`}>
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "profile"     && <ProfileTab user={user} onNameUpdated={(n) => setUser((u) => u ? { ...u, name: n } : u)} />}
        {activeTab === "security"    && <SecurityTab user={user} onTotpChange={(enabled) => setUser((u) => u ? { ...u, totpEnabled: enabled ? 1 : 0 } : u)} />}
        {activeTab === "connections" && <ConnectionsTab />}
        {activeTab === "privacy"     && <PrivacyTab user={user} />}
      </div>
    </div>
  );
}
