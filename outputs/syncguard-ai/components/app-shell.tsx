"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, RadioTower } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="border-b border-white/10 bg-[#07110f]/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="SyncGuard AI home">
            <span className="grid size-10 place-items-center rounded-xl border border-emerald-300/20 bg-emerald-300/10 text-emerald-300">
              <RadioTower className="size-5" />
            </span>
            <span>
              <span className="block font-semibold tracking-tight text-white">SyncGuard AI</span>
              <span className="block text-xs text-slate-400">5G precision timing lab</span>
            </span>
          </Link>

          <nav aria-label="Lab pages" className="flex rounded-xl border border-white/10 bg-white/[0.035] p-1">
            {[
              { href: "/", label: "Holdover lab" },
              { href: "/compare", label: "Model compare" },
            ].map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-emerald-300 text-[#07110f]"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-2 text-sm text-slate-400 sm:flex">
            <Activity className="size-4 text-emerald-300" />
            Offline simulation
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
