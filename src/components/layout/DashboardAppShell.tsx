"use client";

import { DashboardDataProvider } from "@/contexts/DashboardDataContext";
import { DashboardIdlePrefetch } from "@/components/layout/DashboardIdlePrefetch";
import { Sidebar } from "@/components/layout/Sidebar";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

export function DashboardAppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);

  // Fecha o drawer ao navegar para outra rota (mobile).
  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  // Bloqueia o scroll do body enquanto o drawer está aberto.
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!navOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [navOpen]);

  // Fecha com Esc.
  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navOpen]);

  return (
    <DashboardDataProvider>
      <DashboardIdlePrefetch />
      <div className="min-h-screen overflow-x-hidden bg-zinc-50">
        <Sidebar isOpen={navOpen} onClose={() => setNavOpen(false)} />

        {/* Top bar exclusiva do mobile (<lg). Some no desktop. */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-zinc-800 bg-zinc-950/90 px-4 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            aria-label="Abrir menu"
            aria-expanded={navOpen}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/60 text-zinc-100 transition-colors hover:bg-zinc-800/60"
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 6h16" />
              <path d="M4 12h16" />
              <path d="M4 18h16" />
            </svg>
          </button>
          <div className="text-sm font-semibold tracking-tight text-zinc-100">
            Portal do Aluno
          </div>
        </header>

        <div className="lg:pl-72">
          <div className="min-h-screen min-w-0">{children}</div>
        </div>
      </div>
    </DashboardDataProvider>
  );
}
