"use client";

import { DashboardDataProvider } from "@/contexts/DashboardDataContext";
import { DashboardIdlePrefetch } from "@/components/layout/DashboardIdlePrefetch";
import { Sidebar } from "@/components/layout/Sidebar";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

/**
 * Shell do dashboard com dois caminhos de DOM totalmente separados:
 *
 * 1. Sidebar desktop (lg+): `<aside>` fixo à esquerda, controlado por
 *    `hidden lg:block`. No mobile ele é `display:none` — não participa
 *    do layout, não causa stacking, não depende de utilitário
 *    `translate:`.
 *
 * 2. Drawer mobile (<lg): só é renderizado no DOM quando `navOpen` é
 *    `true`. Quando fechado, simplesmente não existe. Quando aberto,
 *    é um overlay fixo (`position:fixed`) acima do conteúdo, com
 *    `lg:hidden` — sumindo no desktop.
 *
 * O conteúdo principal usa `lg:pl-72`, então no mobile recebe padding
 * 0 e ocupa 100% da largura.
 */
export function DashboardAppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!navOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [navOpen]);

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

      <div className="min-h-screen w-full max-w-full min-w-0 overflow-x-hidden bg-zinc-50">
        {/* ===== DESKTOP SIDEBAR =====
            display:none no mobile (hidden), display:block em lg+.
            Não usa translate — é puramente display. */}
        <aside
          aria-label="Menu de navegação (desktop)"
          className="fixed inset-y-0 left-0 z-30 hidden h-screen w-72 border-r border-zinc-800 bg-zinc-950 text-zinc-100 lg:block"
        >
          <Sidebar />
        </aside>

        {/* ===== TOP BAR MOBILE =====
            sticky no topo, lg:hidden no desktop. */}
        <header className="sticky top-0 z-30 flex h-14 w-full max-w-full items-center gap-3 border-b border-zinc-800 bg-zinc-950/95 px-4 backdrop-blur lg:hidden">
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

        {/* ===== DRAWER MOBILE =====
            Só existe no DOM quando aberto. Sumido em lg+ por garantia. */}
        {navOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* backdrop clicável */}
            <button
              type="button"
              aria-label="Fechar menu"
              onClick={() => setNavOpen(false)}
              className="absolute inset-0 h-full w-full bg-black/60 backdrop-blur-sm"
            />
            {/* drawer */}
            <aside
              aria-label="Menu de navegação"
              className="absolute inset-y-0 left-0 h-full w-72 max-w-[85vw] border-r border-zinc-800 bg-zinc-950 text-zinc-100 shadow-[0_30px_80px_rgba(0,0,0,0.6)]"
            >
              <Sidebar
                showCloseButton
                onClose={() => setNavOpen(false)}
                onNavigate={() => setNavOpen(false)}
              />
            </aside>
          </div>
        ) : null}

        {/* ===== CONTEÚDO ===== */}
        <div className="w-full max-w-full min-w-0 lg:pl-72">
          <div className="min-h-screen w-full max-w-full min-w-0">
            {children}
          </div>
        </div>
      </div>
    </DashboardDataProvider>
  );
}
