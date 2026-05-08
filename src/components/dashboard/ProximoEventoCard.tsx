"use client";

import { useDashboardData } from "@/contexts/DashboardDataContext";
import {
  calendarioTipoLabel,
  calendarioTipoPillClass,
  type CalendarioEventoRow,
} from "@/lib/calendario";
import { getSupabaseClient } from "@/lib/supabaseClient";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

function fmtDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function ProximoEventoCard() {
  const { userId, isLoading: ctxBoot } = useDashboardData();
  const [row, setRow] = useState<CalendarioEventoRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ctxBoot) return;
    if (!userId) return;
    let active = true;
    (async () => {
      setError(null);
      const supabase = getSupabaseClient();
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from("calendario_eventos")
        .select(
          "id, titulo, descricao, tipo, status, destaque, data_inicio, data_fim, cor, criado_por, criado_em, atualizado_em",
        )
        .gte("data_inicio", nowIso)
        .order("destaque", { ascending: false })
        .order("data_inicio", { ascending: true })
        .limit(1);

      if (!active) return;
      if (error) {
        setError(error.message);
        setRow(null);
        return;
      }
      setRow(((data ?? [])[0] ?? null) as CalendarioEventoRow | null);
    })();
    return () => {
      active = false;
    };
  }, [ctxBoot, userId]);

  const preview = useMemo(() => {
    const msg = row?.descricao ?? "";
    const trimmed = msg.trim();
    if (!trimmed) return "";
    return trimmed.length > 140 ? `${trimmed.slice(0, 140)}…` : trimmed;
  }, [row]);

  if (!row && !error) {
    return null;
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/55 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_22px_70px_rgba(0,0,0,0.45)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(700px_260px_at_0%_0%,rgba(59,130,246,0.14),transparent)]" />
      <p className="relative text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
        Próximo evento
      </p>
      {error ? (
        <p className="relative mt-2 text-sm text-amber-200/90">
          Não foi possível carregar o calendário: {error}
        </p>
      ) : row ? (
        <>
          <div className="relative mt-3 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ring-1 ${calendarioTipoPillClass(
                String(row.tipo),
              )}`}
            >
              {calendarioTipoLabel(String(row.tipo))}
            </span>
            {row.destaque ? (
              <span className="rounded-full border border-violet-400/30 bg-violet-500/15 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-violet-100">
                Destaque
              </span>
            ) : null}
          </div>
          <p className="relative mt-3 text-base font-semibold tracking-tight text-slate-50">
            {row.titulo}
          </p>
          <p className="relative mt-1 text-xs text-slate-400">
            {fmtDate(row.data_inicio)}
            {row.data_fim ? ` · até ${fmtDate(row.data_fim)}` : null}
          </p>
          {preview ? (
            <p className="relative mt-2 text-sm leading-relaxed text-slate-300">
              {preview}
            </p>
          ) : null}
        </>
      ) : (
        <p className="relative mt-2 text-sm text-slate-400">
          Nenhum evento publicado no momento.
        </p>
      )}

      <div className="relative mt-4">
        <Link
          href="/dashboard/calendario"
          className="inline-flex h-10 items-center justify-center rounded-2xl border border-blue-400/25 bg-blue-500/10 px-4 text-sm font-semibold text-blue-100 transition hover:bg-blue-500/15"
        >
          Ver calendário
        </Link>
      </div>
    </section>
  );
}

