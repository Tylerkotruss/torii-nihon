"use client";

import { DOCUMENTOS_META_TOTAL } from "@/lib/documents";
import { useDashboardDataOptional } from "@/contexts/DashboardDataContext";
import { ToriiCard } from "@/components/torii/ToriiCard";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo } from "react";
import styles from "./Sidebar.module.css";

function IconLayoutDashboard({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 4h7v7H4z" />
      <path d="M13 4h7v4h-7z" />
      <path d="M13 10h7v10h-7z" />
      <path d="M4 13h7v7H4z" />
    </svg>
  );
}

function IconFileText({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8" />
      <path d="M8 17h8" />
    </svg>
  );
}

function IconBell({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M10 5a2 2 0 0 1 4 0" />
      <path d="M6 10a6 6 0 1 1 12 0c0 7 3 7 3 7H3s3 0 3-7" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}

function IconCalendar({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M8 2v3" />
      <path d="M16 2v3" />
      <path d="M3 8h18" />
      <path d="M5 5h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
    </svg>
  );
}

function IconHelpCircle({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 22a10 10 0 1 0-10-10 10 10 0 0 0 10 10z" />
      <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2-3 4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

const NAV_ITEMS: {
  label: string;
  href: string;
  icon: (props: { className?: string }) => React.ReactNode;
}[] = [
  { label: "Assistente", href: "/dashboard", icon: IconLayoutDashboard },
  { label: "Documentos", href: "/dashboard/docs", icon: IconFileText },
  { label: "Avisos", href: "/dashboard/avisos", icon: IconBell },
  { label: "Calendário", href: "/dashboard/calendario", icon: IconCalendar },
  { label: "Dúvidas", href: "/dashboard/duvidas", icon: IconHelpCircle },
];

function iniciaisNome(nome: string | null | undefined): string {
  if (!nome?.trim()) {
    return "?";
  }
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length >= 2) {
    return (partes[0]![0]! + partes[partes.length - 1]![0]!).toUpperCase();
  }
  return nome.slice(0, 2).toUpperCase();
}

function navItemIsActive(pathname: string | null, href: string): boolean {
  if (!pathname) {
    return false;
  }
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

const SidebarUserCard = memo(function SidebarUserCard({
  loading,
  nome,
  statusGeral,
  sublinhaDoc,
}: {
  loading: boolean;
  nome: string | null;
  statusGeral: string;
  sublinhaDoc: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
      <div className="text-xs font-medium text-zinc-300">Aluno / Conta</div>

      <div className="mt-3 flex items-start gap-3">
        <div className="h-10 w-10 shrink-0 rounded-full border border-zinc-800 bg-zinc-950 flex items-center justify-center text-xs font-semibold text-zinc-100">
          {loading ? "…" : iniciaisNome(nome)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="truncate text-sm font-semibold text-zinc-100">
              {loading ? "A carregar…" : nome || "—"}
            </div>
            <span className="shrink-0 rounded-full border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-[11px] font-medium text-zinc-200">
              Aluno
            </span>
          </div>

          <div className="mt-1 text-xs text-zinc-300">{statusGeral}</div>
          <div className="mt-2 text-xs text-zinc-300">{sublinhaDoc}</div>
        </div>
      </div>
    </div>
  );
});

const SidebarNav = memo(function SidebarNav({
  pathname,
}: {
  pathname: string | null;
}) {
  return (
    <nav className="pt-3">
      <ul className="space-y-1">
        {NAV_ITEMS.map((item) => {
          const base =
            "w-full flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors";

          const iconClassName = "h-4.5 w-4.5 shrink-0";
          const isActive = navItemIsActive(pathname, item.href);
          const Icon = item.icon;

          return (
            <li key={item.label}>
              <Link
                href={item.href}
                prefetch={true}
                aria-current={isActive ? "page" : undefined}
                className={[
                  base,
                  "cursor-pointer border",
                  isActive
                    ? "bg-violet-500/15 text-zinc-100 border-violet-400/30"
                    : "text-zinc-200 border-transparent hover:bg-zinc-900/60 hover:text-zinc-50 hover:border-zinc-800",
                ].join(" ")}
              >
                <span className="grid place-items-center">
                  <Icon
                    className={[
                      iconClassName,
                      isActive ? "text-violet-300" : "text-zinc-400",
                    ].join(" ")}
                  />
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
});

export function Sidebar() {
  const pathname = usePathname();
  const data = useDashboardDataOptional();
  const loading = data?.isLoading ?? true;
  const nome = data?.aluno?.nome_completo ?? null;
  const docResumo = data?.resumo;

  const sublinhaDoc = docResumo
    ? `${docResumo.uniqueTipos} de ${DOCUMENTOS_META_TOTAL} documentos enviados`
    : "—";
  const statusGeral = docResumo?.statusGeral ?? "—";

  return (
    <aside
      className={[
        "fixed inset-y-0 left-0 w-72 h-screen border-r border-zinc-800 bg-zinc-950 text-zinc-100",
        "overflow-y-auto overflow-x-hidden scroll-smooth",
        styles.sidebarScroll,
      ].join(" ")}
    >
      <div className="h-14 px-5 flex items-center border-b border-zinc-800">
        <div className="text-sm font-semibold tracking-tight text-zinc-100">
          Portal do Aluno
        </div>
      </div>

      <section className="px-4 pt-3">
        {loading ? (
          <SidebarUserCard
            loading={loading}
            nome={nome}
            statusGeral={loading ? "…" : statusGeral}
            sublinhaDoc={loading ? "…" : sublinhaDoc}
          />
        ) : (
          <ToriiCard mode="compact" />
        )}
      </section>

      <div className="px-4 pb-4">
        <SidebarNav pathname={pathname} />
      </div>
    </aside>
  );
}
