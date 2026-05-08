"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { memo, useEffect } from "react";

const LINKS: { href: string; label: string }[] = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/alunos", label: "Alunos" },
  { href: "/admin/documentos", label: "Documentos" },
];

const ADMIN_PREFETCH_HREFS = LINKS.map((l) => l.href);

const NAV_LINK_BASE =
  "inline-block rounded-xl px-3 py-1.5 text-sm font-semibold transition-all";
const NAV_LINK_ACTIVE =
  "bg-gradient-to-r from-violet-500/20 to-blue-500/15 text-slate-50 ring-1 ring-violet-400/25 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_0_22px_rgba(139,92,246,0.16)]";
const NAV_LINK_INACTIVE =
  "text-slate-300 hover:bg-slate-900/70 hover:text-slate-50 ring-1 ring-transparent hover:ring-white/10";

function navActive(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === "/admin";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function AdminNavInner() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const run = () => {
      for (const href of ADMIN_PREFETCH_HREFS) {
        void router.prefetch(href);
      }
    };

    const ric = (
      globalThis as typeof globalThis & {
        requestIdleCallback?: (
          cb: () => void,
          opts?: { timeout: number },
        ) => number;
        cancelIdleCallback?: (id: number) => void;
      }
    ).requestIdleCallback;
    const cancelRic = (
      globalThis as typeof globalThis & { cancelIdleCallback?: (id: number) => void }
    ).cancelIdleCallback;

    if (typeof ric === "function") {
      const id = ric(run, { timeout: 1500 });
      return () => {
        if (typeof cancelRic === "function") {
          cancelRic(id);
        }
      };
    }

    const t = window.setTimeout(run, 0);
    return () => window.clearTimeout(t);
  }, [router]);

  return (
    <header className="border-b border-white/10 bg-slate-950/55 text-slate-100 backdrop-blur">
      <div className="flex w-full flex-col gap-3 px-6 py-3 sm:flex-row sm:items-center sm:justify-between xl:px-8">
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-tight text-slate-50">
              Torii Nihon
            </span>
            <span className="h-1 w-1 rounded-full bg-violet-300/80 shadow-[0_0_12px_rgba(139,92,246,0.55)]" />
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-200/90">
              Admin Panel
            </span>
          </div>
          <div className="mt-0.5 text-xs text-slate-400/90">
            Controle de Documentos
          </div>
        </div>
        <nav>
          <ul className="flex flex-wrap gap-1">
            {LINKS.map((l) => {
              const on = navActive(pathname, l.href);
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    prefetch={true}
                    className={`${NAV_LINK_BASE} ${on ? NAV_LINK_ACTIVE : NAV_LINK_INACTIVE}`}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-slate-300 hover:text-slate-50"
          >
            Ir para área do aluno
          </Link>
        </div>
      </div>
    </header>
  );
}

export const AdminNav = memo(AdminNavInner);
