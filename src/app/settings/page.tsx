"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Copy, ExternalLink } from "lucide-react";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
    >
      {copied ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function EnvLine({ name, description }: { name: string; description: string }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-[#1e2d4a] last:border-0">
      <div>
        <code className="text-emerald-400 text-sm font-mono">{name}</code>
        <p className="text-slate-500 text-xs mt-0.5">{description}</p>
      </div>
      <CopyButton text={`${name}=`} />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-[#070d1a]">
      <div className="border-b border-[#1e2d4a] bg-[#0a1222]/80 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-lg hover:bg-[#1e2d4a] text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="font-semibold text-white">Settings</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* env file */}
        <div className="rounded-2xl border border-[#1e2d4a] bg-[#0f1a2e] p-6 space-y-4">
          <div>
            <h2 className="text-white font-semibold">Configuration</h2>
            <p className="text-slate-400 text-sm mt-1">
              Create a{" "}
              <code className="text-emerald-400 bg-[#0a1222] px-1.5 py-0.5 rounded">
                .env.local
              </code>{" "}
              file in your project root with these variables:
            </p>
          </div>

          <div className="bg-[#0a1222] rounded-xl p-4 font-mono text-sm space-y-1 text-slate-300">
            <p className="text-slate-500 select-none"># Authentication (required)</p>
            <p>APP_PASSWORD=your_strong_password</p>
            <p>SESSION_SECRET=run_node_-e_crypto_randomBytes_32_hex</p>
            <p className="mt-2 text-slate-500 select-none"># CoinSpot</p>
            <p>COINSPOT_KEY=your_api_key</p>
            <p>COINSPOT_SECRET=your_api_secret</p>
            <p className="mt-2 text-slate-500 select-none"># Basiq (Bank Accounts)</p>
            <p>BASIQ_API_KEY=your_basiq_key</p>
            <p>BASIQ_USER_ID=your_basiq_user_id</p>
            <p className="mt-2 text-slate-500 select-none"># Email (verification codes)</p>
            <p>EMAIL_SMTP_HOST=smtp.gmail.com</p>
            <p>EMAIL_SMTP_PORT=587</p>
            <p>EMAIL_SMTP_USER=you@gmail.com</p>
            <p>EMAIL_SMTP_PASS=your_app_password</p>
            <p>EMAIL_FROM=you@gmail.com</p>
            <p className="mt-2 text-slate-500 select-none"># Sharesight (optional)</p>
            <p>SHARESIGHT_CLIENT_ID=your_client_id</p>
            <p>SHARESIGHT_CLIENT_SECRET=your_client_secret</p>
            <p>SHARESIGHT_REFRESH_TOKEN=your_refresh_token</p>
            <p className="mt-2 text-slate-500 select-none"># App</p>
            <p>NEXT_PUBLIC_BASE_URL=http://localhost:3000</p>
          </div>

          <div className="space-y-0">
            <EnvLine name="APP_PASSWORD" description="Password to unlock the dashboard" />
            <EnvLine name="SESSION_SECRET" description="Random 32-byte hex string — generate with: node -e &quot;console.log(require('crypto').randomBytes(32).toString('hex'))&quot;" />
            <EnvLine name="COINSPOT_KEY" description="Your CoinSpot read-only API key" />
            <EnvLine name="COINSPOT_SECRET" description="Your CoinSpot API secret" />
            <EnvLine name="BASIQ_API_KEY" description="Your Basiq server API key" />
            <EnvLine name="BASIQ_USER_ID" description="Basiq user ID (created on first bank connect)" />
            <EnvLine name="SHARESIGHT_CLIENT_ID" description="Sharesight OAuth app client ID" />
            <EnvLine name="SHARESIGHT_CLIENT_SECRET" description="Sharesight OAuth app client secret" />
            <EnvLine name="SHARESIGHT_REFRESH_TOKEN" description="Long-lived refresh token from Sharesight OAuth flow" />
            <EnvLine name="EMAIL_SMTP_HOST" description="SMTP server hostname (e.g. smtp.gmail.com)" />
            <EnvLine name="EMAIL_SMTP_PORT" description="SMTP port — 587 for TLS, 465 for SSL" />
            <EnvLine name="EMAIL_SMTP_USER" description="Your email address (SMTP login)" />
            <EnvLine name="EMAIL_SMTP_PASS" description="App password (not your account password)" />
            <EnvLine name="EMAIL_FROM" description="From address shown in emails (usually same as SMTP_USER)" />
          </div>
        </div>

        {/* Security */}
        <div className="rounded-2xl border border-emerald-900/40 bg-[#0f1a2e] p-6 space-y-3">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Security Setup (required)
          </h2>
          <ol className="space-y-2 text-sm text-slate-400 list-decimal list-inside">
            <li>
              Generate a <strong className="text-white">SESSION_SECRET</strong> — run this in your terminal:
              <code className="block mt-1 bg-[#0a1222] text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-mono">
                node -e &quot;console.log(require(&apos;crypto&apos;).randomBytes(32).toString(&apos;hex&apos;))&quot;
              </code>
            </li>
            <li>Set <strong className="text-white">APP_PASSWORD</strong> to a strong password — this is what you type to unlock the dashboard</li>
            <li>Add both to your <code className="text-emerald-400 bg-[#0a1222] px-1.5 py-0.5 rounded">.env.local</code> file</li>
            <li>Restart the dev server — you&apos;ll see the lock screen on next visit</li>
          </ol>
          <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-3 text-xs text-slate-400 space-y-1.5">
            <p>🔒 Your session is stored in an <strong className="text-white">HTTP-only cookie</strong> — JavaScript on the page cannot read it</p>
            <p>🛡️ All API calls to CoinSpot, Basiq and Sharesight happen <strong className="text-white">server-side only</strong> — your keys never go to the browser</p>
            <p>⏱️ The login rate-limiter allows <strong className="text-white">5 attempts per 15 minutes</strong> per IP before locking out</p>
            <p>🔑 SESSION_SECRET signs your cookie — changing it immediately invalidates all sessions</p>
          </div>
        </div>

        {/* CoinSpot */}
        <div className="rounded-2xl border border-[#1e2d4a] bg-[#0f1a2e] p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-400" />
              CoinSpot Setup
            </h2>
            <a
              href="https://www.coinspot.com.au/my/api"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white"
            >
              Open CoinSpot <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <ol className="space-y-2 text-sm text-slate-400 list-decimal list-inside">
            <li>
              Log in to CoinSpot and go to{" "}
              <strong className="text-white">My Account → API</strong>
            </li>
            <li>
              Click <strong className="text-white">Add New Key</strong>, select{" "}
              <strong className="text-white">Read Only</strong>
            </li>
            <li>Copy the Key and Secret into your .env.local file</li>
            <li>Restart the dev server</li>
          </ol>
        </div>

        {/* Basiq / Banks */}
        <div className="rounded-2xl border border-[#1e2d4a] bg-[#0f1a2e] p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              Bank Accounts Setup (via Basiq)
            </h2>
            <a
              href="https://dashboard.basiq.io"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white"
            >
              Basiq Dashboard <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <ol className="space-y-2 text-sm text-slate-400 list-decimal list-inside">
            <li>
              Sign up for a free account at{" "}
              <a href="https://basiq.io" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                basiq.io
              </a>
            </li>
            <li>
              In the Basiq dashboard, create an application and copy the{" "}
              <strong className="text-white">API Key</strong>
            </li>
            <li>
              Add it to .env.local as{" "}
              <code className="text-emerald-400 bg-[#0a1222] px-1.5 py-0.5 rounded">
                BASIQ_API_KEY
              </code>
            </li>
            <li>
              In the Basiq dashboard, add{" "}
              <code className="text-emerald-400 bg-[#0a1222] px-1.5 py-0.5 rounded">
                http://localhost:3000/basiq/callback
              </code>{" "}
              as a redirect URL
            </li>
            <li>
              Restart the dev server, then click{" "}
              <strong className="text-white">Connect Bank</strong> on the dashboard — Basiq will show a picker with 136+ Australian banks
            </li>
            <li>
              After authorisation, copy the User ID shown in the callback page into{" "}
              <code className="text-emerald-400 bg-[#0a1222] px-1.5 py-0.5 rounded">
                BASIQ_USER_ID
              </code>
            </li>
          </ol>
        </div>

        {/* Email */}
        <div className="rounded-2xl border border-[#1e2d4a] bg-[#0f1a2e] p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              Email Setup (verification codes)
            </h2>
          </div>
          <p className="text-slate-500 text-xs">Required for registration. Sends a 6-digit code to confirm email ownership.</p>
          <ol className="space-y-2 text-sm text-slate-400 list-decimal list-inside">
            <li>
              <strong className="text-white">Gmail</strong> — go to{" "}
              <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline">
                myaccount.google.com/apppasswords
              </a>{" "}
              and create an App Password (requires 2FA enabled). Use that as <code className="text-emerald-400 bg-[#0a1222] px-1 rounded">EMAIL_SMTP_PASS</code>
            </li>
            <li>
              <strong className="text-white">Outlook / Hotmail</strong> — use host{" "}
              <code className="text-emerald-400 bg-[#0a1222] px-1 rounded">smtp-mail.outlook.com</code> port{" "}
              <code className="text-emerald-400 bg-[#0a1222] px-1 rounded">587</code> with your normal password
            </li>
            <li>
              <strong className="text-white">iCloud Mail</strong> — use{" "}
              <code className="text-emerald-400 bg-[#0a1222] px-1 rounded">smtp.mail.me.com</code> port{" "}
              <code className="text-emerald-400 bg-[#0a1222] px-1 rounded">587</code> with an App-Specific Password from appleid.apple.com
            </li>
            <li>Set all five <code className="text-emerald-400 bg-[#0a1222] px-1 rounded">EMAIL_*</code> variables in .env.local and restart the server</li>
          </ol>
        </div>

        {/* Sharesight */}
        <div className="rounded-2xl border border-[#1e2d4a] bg-[#0f1a2e] p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              Sharesight Setup (live portfolio)
            </h2>
            <a href="https://portfolio.sharesight.com/users/developer" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white">
              Sharesight Dev <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <p className="text-slate-500 text-xs">Optional — without this the Share Portfolio card falls back to CSV import.</p>
          <ol className="space-y-2 text-sm text-slate-400 list-decimal list-inside">
            <li>Log in to Sharesight and go to <strong className="text-white">Settings → API Access → Register Developer App</strong></li>
            <li>Set redirect URI to <code className="text-emerald-400 bg-[#0a1222] px-1.5 py-0.5 rounded">http://localhost:3000/sharesight/callback</code></li>
            <li>Copy the <strong className="text-white">Client ID</strong> and <strong className="text-white">Client Secret</strong> into .env.local</li>
            <li>Run the OAuth flow once to get a refresh token — visit: <code className="text-emerald-400 bg-[#0a1222] px-1.5 py-0.5 rounded">https://api.sharesight.com/oauth2/authorize?response_type=code&client_id=YOUR_ID&redirect_uri=http://localhost:3000/sharesight/callback</code></li>
            <li>Exchange the returned <code className="text-slate-300">code</code> for tokens via POST to <code className="text-emerald-400 bg-[#0a1222] px-1.5 py-0.5 rounded">https://api.sharesight.com/oauth2/token</code> with <code className="text-slate-300">grant_type=authorization_code</code></li>
            <li>Save the <strong className="text-white">refresh_token</strong> from the response as <code className="text-emerald-400 bg-[#0a1222] px-1.5 py-0.5 rounded">SHARESIGHT_REFRESH_TOKEN</code></li>
          </ol>
        </div>

        {/* Pearler */}
        <div className="rounded-2xl border border-[#1e2d4a] bg-[#0f1a2e] p-6 space-y-3">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            Pearler CSV (manual fallback)
          </h2>
          <ol className="space-y-2 text-sm text-slate-400 list-decimal list-inside">
            <li>Open the Pearler app or web portal</li>
            <li>
              Go to <strong className="text-white">Portfolio → Export → CSV</strong>
            </li>
            <li>
              On the dashboard, drag & drop the CSV onto the{" "}
              <strong className="text-white">Pearler card</strong>
            </li>
            <li>Your holdings will appear immediately — no server upload needed</li>
          </ol>
          <p className="text-slate-500 text-xs">
            The CSV is parsed locally in your browser. Nothing is sent to a server.
          </p>
        </div>

      </div>
    </div>
  );
}
