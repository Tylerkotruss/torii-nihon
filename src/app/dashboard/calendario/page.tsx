"use client";

import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { useDashboardData } from "@/contexts/DashboardDataContext";
import {
  calendarioTipoLabel,
  calendarioTipoPillClass,
  type CalendarioEventoRow,
} from "@/lib/calendario";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function clampDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function fmtDateTime(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function fmtMonthTitle(d: Date) {
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function shortDesc(desc: string | null) {
  const s = (desc ?? "").trim();
  if (!s) return "";
  return s.length > 160 ? `${s.slice(0, 160)}…` : s;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function CalendarioPage() {
  const router = useRouter();
  const { userId, isLoading: ctxBoot } = useDashboardData();
  const [items, setItems] = useState<CalendarioEventoRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  const load = useCallback(async () => {
    if (!userId) return;
    setError(null);
    const supabase = getSupabaseClient();
    const from = new Date(month.getFullYear(), month.getMonth(), 1).toISOString();
    const to = new Date(month.getFullYear(), month.getMonth() + 1, 1).toISOString();

    const { data, error } = await supabase
      .from("calendario_eventos")
      .select(
        "id, titulo, descricao, tipo, status, destaque, data_inicio, data_fim, cor, criado_por, criado_em, atualizado_em",
      )
      .gte("data_inicio", from)
      .lt("data_inicio", to)
      .order("destaque", { ascending: false })
      .order("data_inicio", { ascending: true })
      .limit(500);

    if (error) {
      setError(error.message);
      return;
    }
    setItems((data ?? []) as CalendarioEventoRow[]);
  }, [userId, month]);

  useEffect(() => {
    if (ctxBoot) return;
    if (!userId) {
      router.replace("/login?next=/dashboard/calendario");
      return;
    }
    let active = true;
    (async () => {
      setIsLoading(true);
      await load();
      if (active) setIsLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [ctxBoot, userId, load, router]);

  const now = useMemo(() => new Date(), []);
  const today = useMemo(() => clampDay(new Date()), []);

  const monthStart = useMemo(() => startOfMonth(month), [month]);
  const monthEnd = useMemo(() => endOfMonth(month), [month]);

  const firstGridDay = useMemo(() => {
    // Semana começando no Domingo.
    const d = new Date(monthStart);
    d.setDate(d.getDate() - d.getDay());
    return clampDay(d);
  }, [monthStart]);

  const days = useMemo(() => {
    const out: Date[] = [];
    const d = new Date(firstGridDay);
    for (let i = 0; i < 42; i++) {
      out.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    return out;
  }, [firstGridDay]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarioEventoRow[]>();
    for (const e of items) {
      const d = clampDay(new Date(e.data_inicio));
      const key = d.toISOString().slice(0, 10);
      const cur = map.get(key) ?? [];
      cur.push(e);
      map.set(key, cur);
    }
    for (const [k, list] of map.entries()) {
      list.sort((a, b) => {
        if (a.destaque !== b.destaque) return a.destaque ? -1 : 1;
        return new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime();
      });
      map.set(k, list);
    }
    return map;
  }, [items]);

  const futuros = useMemo(() => {
    // Próximos eventos (não limita ao mês atual)
    // Para simplicidade (e sem overengineering), buscamos “do mês” na query; aqui mostramos futuros do mês.
    return items
      .filter((e) => new Date(e.data_inicio).getTime() >= now.getTime())
      .sort((a, b) => {
        if (a.destaque !== b.destaque) return a.destaque ? -1 : 1;
        return new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime();
      })
      .slice(0, 10);
  }, [items, now]);

  const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="min-h-screen bg-[radial-gradient(900px_480px_at_12%_0%,rgba(139,92,246,0.14),transparent_50%),radial-gradient(700px_420px_at_88%_10%,rgba(59,130,246,0.1),transparent_50%),linear-gradient(to_bottom,#070a12,#03050c)] text-slate-100">
      <DashboardHeader
        variant="dark"
        title="Calendário"
        subtitle="Eventos e datas importantes publicados pela equipe."
      />
      <main className="px-4 pb-12 pt-5 sm:px-6 lg:px-8">
        {error ? (
          <div className="mx-auto mb-4 w-full max-w-7xl rounded-xl border border-red-500/25 bg-red-950/40 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <div className="mx-auto w-full max-w-7xl space-y-6">
          <section className="rounded-3xl border border-white/10 bg-slate-950/55 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_80px_rgba(0,0,0,0.35)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Mês
                </p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-50 capitalize">
                  {fmtMonthTitle(month)}
                </h1>
                <p className="mt-1 text-xs text-slate-400">
                  {fmtDateTime(monthStart.toISOString())} · até{" "}
                  {fmtDateTime(monthEnd.toISOString())}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setMonth((m) => startOfMonth(new Date(m.getFullYear(), m.getMonth() - 1, 1)))
                  }
                  className="inline-flex h-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06]"
                >
                  Mês anterior
                </button>
                <button
                  type="button"
                  onClick={() => setMonth(startOfMonth(new Date()))}
                  className="inline-flex h-10 items-center justify-center rounded-2xl border border-blue-400/25 bg-blue-500/10 px-4 text-sm font-semibold text-blue-100 transition hover:bg-blue-500/15"
                >
                  Hoje
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setMonth((m) => startOfMonth(new Date(m.getFullYear(), m.getMonth() + 1, 1)))
                  }
                  className="inline-flex h-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06]"
                >
                  Próximo mês
                </button>
              </div>
            </div>
          </section>

          {isLoading ? (
            <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-6 text-sm text-slate-400 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
              Carregando…
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-6 text-sm text-slate-400 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
              <div className="text-slate-200 font-semibold">
                Nenhum evento no calendário.
              </div>
              <div className="mt-1">
                Quando a equipe publicar eventos, eles aparecerão aqui.
              </div>
            </div>
          ) : null}

          {/* Calendário mensal simples */}
          <section className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/55 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_80px_rgba(0,0,0,0.35)]">
            <div className="grid grid-cols-7 border-b border-white/10 bg-black/20">
              {weekdays.map((w) => (
                <div
                  key={w}
                  className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
                >
                  {w}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {days.map((d) => {
                const inMonth = d.getMonth() === month.getMonth();
                const key = d.toISOString().slice(0, 10);
                const evs = eventsByDay.get(key) ?? [];
                const isToday = isSameDay(d, today);
                return (
                  <div
                    key={key}
                    className={[
                      "min-h-[92px] border-t border-white/10 p-3",
                      inMonth ? "bg-slate-950/20" : "bg-black/20",
                      "relative",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className={
                          isToday
                            ? "inline-flex h-7 w-7 items-center justify-center rounded-full border border-blue-400/25 bg-blue-500/10 text-xs font-extrabold text-blue-100"
                            : inMonth
                              ? "text-xs font-semibold text-slate-200"
                              : "text-xs font-semibold text-slate-500"
                        }
                      >
                        {d.getDate()}
                      </div>
                      {evs.length ? (
                        <span className="text-[11px] font-semibold text-slate-500">
                          {evs.length}
                        </span>
                      ) : null}
                    </div>
                    {evs.slice(0, 2).map((e) => (
                      <div
                        key={e.id}
                        className="mt-2 truncate text-xs text-slate-300"
                        title={e.titulo}
                      >
                        <span className="text-slate-500">
                          {new Date(e.data_inicio).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>{" "}
                        <span className="font-medium text-slate-200">
                          {e.titulo}
                        </span>
                      </div>
                    ))}
                    {evs.length > 2 ? (
                      <div className="mt-2 text-[11px] font-medium text-slate-500">
                        +{evs.length - 2} mais
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Próximos eventos (cards) */}
          <section className="space-y-3">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Próximos eventos
                </p>
                <h2 className="mt-1 text-lg font-semibold text-slate-50">
                  O que vem por aí
                </h2>
              </div>
            </div>

            {futuros.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-6 text-sm text-slate-400 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
                Nenhum evento futuro neste mês.
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {futuros.map((e) => (
                  <article
                    key={e.id}
                    className={
                      e.destaque
                        ? "relative overflow-hidden rounded-3xl border border-violet-400/30 bg-slate-950/55 p-6 shadow-[0_0_0_1px_rgba(139,92,246,0.18),0_24px_80px_rgba(0,0,0,0.55)]"
                        : "relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/55 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_80px_rgba(0,0,0,0.45)]"
                    }
                  >
                    <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/35 to-transparent" />
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ring-1 ${calendarioTipoPillClass(
                          String(e.tipo),
                        )}`}
                      >
                        {calendarioTipoLabel(String(e.tipo))}
                      </span>
                      {e.destaque ? (
                        <span className="rounded-full border border-violet-400/30 bg-violet-500/15 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-violet-100">
                          Destaque
                        </span>
                      ) : null}
                      <span className="ml-auto text-xs text-slate-500">
                        {fmtDateTime(e.data_inicio)}
                      </span>
                    </div>
                    <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-50">
                      {e.titulo}
                    </h3>
                    {e.descricao?.trim() ? (
                      <p className="mt-2 text-sm leading-relaxed text-slate-300">
                        {shortDesc(e.descricao)}
                      </p>
                    ) : null}
                    {e.data_fim ? (
                      <p className="mt-4 text-xs text-slate-500">
                        Termina em {fmtDateTime(e.data_fim)}.
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

