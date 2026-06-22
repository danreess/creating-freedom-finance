"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BarChart3, Settings, RefreshCw, Target, CreditCard, BookOpen, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavbarProps {
  onRefresh?: () => void;
  lastUpdated?: Date | null;
}

const NAV_LINKS = [
  { href: "/", label: "Dashboard", icon: BarChart3 },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/expenses", label: "Expenses", icon: CreditCard },
  { href: "/learn", label: "Learn", icon: BookOpen },
];

export default function Navbar({ onRefresh, lastUpdated }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => { if (d.name) setUserName(d.name); })
      .catch(() => {});
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <>
      <nav className="border-b border-[#1e2d4a] bg-[#0a1222]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <span className="font-semibold text-white tracking-tight hidden sm:block">
                Finance
              </span>
            </div>
            <div className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors",
                    pathname === href
                      ? "bg-[#1e2d4a] text-white"
                      : "text-slate-400 hover:text-white hover:bg-[#1e2d4a]/50"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-slate-500 hidden lg:block">
                Updated {lastUpdated.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-2 rounded-lg hover:bg-[#1e2d4a] transition-colors text-slate-400 hover:text-white"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            <Link
              href="/settings"
              className={cn(
                "p-2 rounded-lg hover:bg-[#1e2d4a] transition-colors",
                pathname === "/settings" ? "text-emerald-400 bg-[#1e2d4a]" : "text-slate-400 hover:text-white"
              )}
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </Link>
            {userName && (
              <Link
                href="/account"
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors",
                  pathname === "/account"
                    ? "bg-emerald-500 text-white"
                    : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                )}
                title={`Account (${userName})`}
              >
                {userName.charAt(0).toUpperCase()}
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-red-500/10 transition-colors text-slate-400 hover:text-red-400"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile bottom tab bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-[#1e2d4a] bg-[#0a1222]/95 backdrop-blur-sm">
        <div className="flex">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors",
                pathname === href ? "text-emerald-400" : "text-slate-500"
              )}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          ))}
          <Link
            href="/settings"
            className={cn(
              "flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors",
              pathname === "/settings" ? "text-emerald-400" : "text-slate-500"
            )}
          >
            <Settings className="w-5 h-5" />
            Settings
          </Link>
        </div>
      </div>
    </>
  );
}
