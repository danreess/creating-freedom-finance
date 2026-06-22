"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Copy } from "lucide-react";
import { Suspense } from "react";

function CallbackContent() {
  const params = useSearchParams();
  const userId = params.get("userId") || params.get("user_id");
  const jobId = params.get("jobId") || params.get("job_id");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (userId) {
      localStorage.setItem("basiq_user_id", userId);
    }
  }, [userId]);

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="min-h-screen bg-[#070d1a] flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-2xl border border-[#1e2d4a] bg-[#0f1a2e] p-8 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8 text-emerald-400" />
        </div>

        <div>
          <h1 className="text-white text-xl font-bold">ING Connected!</h1>
          <p className="text-slate-400 text-sm mt-2">
            Your ING account has been authorised via Basiq.
          </p>
        </div>

        {userId && (
          <div className="bg-[#0a1222] rounded-xl p-4 text-left space-y-2">
            <p className="text-slate-400 text-xs">
              Add this to your{" "}
              <code className="text-emerald-400">.env.local</code>:
            </p>
            <div className="flex items-center justify-between gap-2">
              <code className="text-emerald-400 text-sm font-mono break-all">
                BASIQ_USER_ID={userId}
              </code>
              <button
                onClick={() => copy(`BASIQ_USER_ID=${userId}`)}
                className="shrink-0 p-1.5 rounded hover:bg-[#1e2d4a] text-slate-400 hover:text-white"
              >
                {copied ? (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            {jobId && (
              <p className="text-slate-600 text-xs">Job ID: {jobId}</p>
            )}
          </div>
        )}

        {!userId && (
          <p className="text-slate-500 text-sm">
            No user ID received. Check the Basiq dashboard for your User ID.
          </p>
        )}

        <div className="space-y-2 text-sm text-slate-400">
          <p>After adding BASIQ_USER_ID to .env.local:</p>
          <ol className="text-left list-decimal list-inside space-y-1 text-xs">
            <li>Stop the dev server</li>
            <li>
              Run <code className="text-emerald-400">npm run dev</code> again
            </li>
            <li>Return to the dashboard</li>
          </ol>
        </div>

        <Link
          href="/"
          className="inline-block px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-medium text-sm transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}

export default function BasiqCallbackPage() {
  return (
    <Suspense>
      <CallbackContent />
    </Suspense>
  );
}
