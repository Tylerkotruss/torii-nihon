"use client";

import { useToriiIdentity } from "@/hooks/useToriiIdentity";
import Link from "next/link";
import { useMemo } from "react";

export type ToriiCardMode = "compact" | "full" | "public";

function initialsFromName(nome: string | null): string {
  const safe = String(nome ?? "").trim();
  if (!safe) return "AT";
  const parts = Array.isArray(safe.split(/\s+/))
    ? safe.split(/\s+/).filter(Boolean)
    : [];
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
  }
  return safe.slice(0, 2).toUpperCase();
}

export function ToriiCard({ mode = "compact" }: { mode?: ToriiCardMode }) {
  const identity = useToriiIdentity();

  const nomeDisplay = identity.nome?.trim() ? identity.nome : "Aluno Torii";
  const emailDisplay = identity.email?.trim()
    ? identity.email
    : "E-mail não informado";

  const enviados = Number.isFinite(identity.docs.enviados)
    ? Math.max(0, identity.docs.enviados)
    : 0;
  const total = Number.isFinite(identity.docs.total) ? Math.max(1, identity.docs.total) : 1;

  const pct = useMemo(() => {
    const p = Math.round((Math.min(enviados, total) / total) * 100);
    return Number.isFinite(p) ? Math.max(0, Math.min(100, p)) : 0;
  }, [enviados, total]);

  const isCompact = mode === "compact";
  const isFull = mode === "full";

  return (
    <section
      className={[
        "relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/55",
        "shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_22px_70px_rgba(0,0,0,0.45)]",
        isCompact ? "p-3" : "p-6",
      ].join(" ")}
      aria-label="Carteira Torii"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(700px_240px_at_0%_0%,rgba(139,92,246,0.22),transparent_55%),radial-gradient(650px_220px_at_100%_0%,rgba(34,211,238,0.12),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/35 to-transparent" />

      <header className="relative">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
          TORII NIHON · Carteira
        </div>
        <div className="mt-1 text-xs text-slate-500">Identidade do aluno</div>
        <div className="mt-2 text-[11px] font-medium text-slate-500">
          Identidade validada pela Torii Nihon
        </div>
      </header>

      <div className={["relative flex items-start gap-3", isCompact ? "mt-3" : "mt-4"].join(" ")}>
        <div
          className={[
            "grid shrink-0 place-items-center rounded-2xl border",
            "border-violet-400/25 bg-gradient-to-br from-violet-600/25 via-slate-950/10 to-cyan-500/15",
            "text-xs font-extrabold tracking-wide text-slate-50 shadow-[0_0_28px_rgba(139,92,246,0.16)]",
            isCompact ? "h-10 w-10" : "h-11 w-11",
          ].join(" ")}
          aria-hidden
        >
          {initialsFromName(nomeDisplay)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-slate-100">
            {nomeDisplay}
          </div>
          {!isCompact ? (
            <div className="mt-0.5 truncate text-xs text-slate-400">
              {emailDisplay}
            </div>
          ) : null}

          <div className={["flex flex-wrap items-center gap-2", isCompact ? "mt-2" : "mt-3"].join(" ")}>
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-slate-200">
              {String(identity.vinculo?.valor ?? "Aluno")}
            </span>
            {isCompact ? (
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-slate-200">
                {String(identity.acesso?.valor ?? "Básico")}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full border border-emerald-400/15 bg-emerald-500/5 px-2.5 py-1 text-[11px] font-semibold text-emerald-200">
                {String(identity.statusConta?.valor ?? "Ativo")}
              </span>
            )}
          </div>
        </div>
      </div>

      <div
        className={[
          "relative rounded-2xl border border-cyan-400/15 bg-cyan-500/5",
          isCompact ? "mt-3 px-3 py-2.5" : "mt-4 px-4 py-3",
        ].join(" ")}
      >
        <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-200/80">
          ID TORII
        </div>
        <div className={["mt-1 font-mono font-semibold tracking-[0.22em] text-cyan-200", isCompact ? "text-[13px]" : "text-sm"].join(" ")}>
          {String(identity.toriiId ?? "TN-······")}
        </div>
      </div>

      <div
        className={[
          "relative rounded-2xl border border-white/10 bg-white/[0.03]",
          isCompact ? "mt-3 px-3 py-3" : "mt-4 px-4 py-4",
        ].join(" ")}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Dados da identidade
          </div>
        </div>

        <div className={["grid grid-cols-2", isCompact ? "mt-2 gap-2" : "mt-3 gap-3"].join(" ")}>
          <div className={["min-w-0 rounded-xl border border-white/[0.08] bg-black/20", isCompact ? "px-2.5 py-2" : "px-3 py-2.5"].join(" ")}>
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              {identity.vinculo?.label ?? "Vínculo"}
            </div>
            <div className="mt-1 truncate text-xs font-semibold text-slate-200">
              {String(identity.vinculo?.valor ?? "Aluno")}
            </div>
          </div>

          <div className={["min-w-0 rounded-xl border border-white/[0.08] bg-black/20", isCompact ? "px-2.5 py-2" : "px-3 py-2.5"].join(" ")}>
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              {identity.acesso?.label ?? "Acesso"}
            </div>
            <div className="mt-1 truncate text-xs font-semibold text-slate-200">
              {String(identity.acesso?.valor ?? "Básico")}
            </div>
          </div>

          {isFull ? (
            <div className="min-w-0 rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2.5">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                {identity.statusConta?.label ?? "Status"}
              </div>
              <div className="mt-1 truncate text-xs font-semibold text-slate-200">
                {String(identity.statusConta?.valor ?? "Ativo")}
              </div>
            </div>
          ) : null}

          {isFull ? (
            <div className="min-w-0 rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2.5">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                {identity.membroDesde?.label ?? "Membro desde"}
              </div>
              <div className="mt-1 truncate text-xs font-semibold text-slate-200">
                {identity.membroDesde?.valor ?? "Não informado"}
              </div>
            </div>
          ) : null}
        </div>

        {isFull && identity.area?.valor ? (
          <div className="mt-3 rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2.5">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              {identity.area?.label ?? "Área"}
            </div>
            <div className="mt-1 truncate text-xs font-semibold text-slate-200">
              {identity.area.valor}
            </div>
          </div>
        ) : null}
      </div>

      <div
        className={[
          "relative rounded-2xl border border-white/10 bg-white/[0.03]",
          isCompact ? "mt-3 px-3 py-3" : "mt-4 px-4 py-4",
        ].join(" ")}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Documentação
          </div>
          <div className="text-xs font-semibold text-slate-200">
            {Math.min(enviados, total)}/{total}
          </div>
        </div>

        <div className={["h-2 overflow-hidden rounded-full bg-white/[0.07]", isCompact ? "mt-2" : "mt-3"].join(" ")}>
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-400"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className={["text-xs text-slate-400", isCompact ? "mt-2" : "mt-3"].join(" ")}>
          Situação: {String(identity.docs.status ?? "Em andamento")}
        </div>
      </div>

      <div className={["relative", isCompact ? "mt-3" : "mt-4"].join(" ")}>
        <Link
          href="/dashboard/carteira"
          className="inline-flex text-xs font-semibold text-slate-300 transition hover:text-slate-100"
        >
          Abrir carteira →
        </Link>
      </div>

      {mode === "full" ? (
        <div className="relative mt-5 text-xs leading-relaxed text-slate-500">
          Esta é a primeira versão da sua identidade digital. Recursos como QR code,
          perfil público, reputação e histórico serão adicionados no futuro.
        </div>
      ) : null}
    </section>
  );
}

