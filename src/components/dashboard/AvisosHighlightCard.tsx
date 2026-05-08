"use client";

import { useDashboardData } from "@/contexts/DashboardDataContext";
import { avisoTipoLabel, avisoTipoPillClass, type AvisoRow } from "@/lib/avisos";
import { getSupabaseClient } from "@/lib/supabaseClient";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

function fmtDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function AvisosHighlightCard() {
  const { userId, isLoading: ctxBoot } = useDashboardData();
  const [row, setRow] = useState<AvisoRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ctxBoot) return;
    if (!userId) return;
    let active = true;
    (async () => {
      setError(null);
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("avisos")
        .select(
          "id, titulo, mensagem, tipo, status, fixado, publico, publicado_em, expira_em, criado_em, atualizado_em, criado_por",
        )
        .order("fixado", { ascending: false })
        .order("publicado_em", { ascending: false })
        .limit(1);
      if (!active) return;
      if (error) {
        setError(error.message);
        setRow(null);
        return;
      }
      setRow(((data ?? [])[0] ?? null) as AvisoRow | null);
    })();
    return () => {
      active = false;
    };
  }, [ctxBoot, userId]);

  const preview = useMemo(() => {
    const msg = row?.mensagem ?? "";
    const trimmed = msg.trim();
    if (!trimmed) return "";
    return trimmed.length > 150 ? `${trimmed.slice(0, 150)}…` : trimmed;
  }, [row]);

  if (!row && !error) {
    return null;
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/55 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_22px_70px_rgba(0,0,0,0.45)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(700px_260px_at_0%_0%,rgba(139,92,246,0.20),transparent)]" />
      <p className="relative text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
        Aviso mais relevante
      </p>
      {error ? (
        <p className="relative mt-2 text-sm text-amber-200/90">
          Não foi possível carregar avisos: {error}
        </p>
      ) : row ? (
        <>
          <div className="relative mt-3 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ring-1 ${avisoTipoPillClass(
                String(row.tipo),
              )}`}
            >
              {avisoTipoLabel(String(row.tipo))}
            </span>
            {row.fixado ? (
              <span className="rounded-full border border-violet-400/30 bg-violet-500/15 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-violet-100">
                Fixado
              </span>
            ) : null}
            <span className="ml-auto text-xs text-slate-500">
              {fmtDate(row.publicado_em)}
            </span>
          </div>
          <p className="relative mt-3 text-base font-semibold tracking-tight text-slate-50">
            {row.titulo}
          </p>
          {preview ? (
            <p className="relative mt-2 text-sm leading-relaxed text-slate-300">
              {preview}
            </p>
          ) : null}
        </>
      ) : null}

      <div className="relative mt-4">
        <Link
          href="/dashboard/avisos"
          className="inline-flex h-10 items-center justify-center rounded-2xl border border-violet-400/25 bg-violet-500/10 px-4 text-sm font-semibold text-violet-100 transition hover:bg-violet-500/15"
        >
          Ver avisos
        </Link>
      </div>
    </section>
  );
}

