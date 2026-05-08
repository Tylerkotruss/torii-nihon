"use client";

import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { useDashboardData } from "@/contexts/DashboardDataContext";
import { avisoTipoLabel, avisoTipoPillClass, type AvisoRow } from "@/lib/avisos";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

function fmtDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export default function AvisosPage() {
  const router = useRouter();
  const { userId, isLoading: ctxBoot } = useDashboardData();
  const [items, setItems] = useState<AvisoRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setError(null);
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("avisos")
      .select(
        "id, titulo, mensagem, tipo, status, fixado, publico, publicado_em, expira_em, criado_em, atualizado_em, criado_por",
      )
      .order("fixado", { ascending: false })
      .order("publicado_em", { ascending: false })
      .limit(100);
    if (error) {
      setError(error.message);
      return;
    }
    setItems((data ?? []) as AvisoRow[]);
  }, [userId]);

  useEffect(() => {
    if (ctxBoot) return;
    if (!userId) {
      router.replace("/login?next=/dashboard/avisos");
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

  const visible = useMemo(() => {
    // RLS já restringe; aqui só garantimos ordem/shape.
    return items;
  }, [items]);

  return (
    <div className="min-h-screen bg-[radial-gradient(900px_480px_at_12%_0%,rgba(139,92,246,0.14),transparent_50%),radial-gradient(700px_420px_at_88%_10%,rgba(59,130,246,0.1),transparent_50%),linear-gradient(to_bottom,#070a12,#03050c)] text-slate-100">
      <DashboardHeader
        variant="dark"
        title="Avisos"
        subtitle="Recados da equipe, atualizações e comunicados."
      />
      <main className="px-4 pb-12 pt-5 sm:px-6 lg:px-8">
        {error ? (
          <div className="mx-auto mb-4 w-full max-w-7xl rounded-xl border border-red-500/25 bg-red-950/40 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <div className="mx-auto w-full max-w-7xl space-y-4">
          {isLoading ? (
            <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-6 text-sm text-slate-400 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
              Carregando…
            </div>
          ) : visible.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-6 text-sm text-slate-400 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
              Nenhum aviso publicado no momento.
            </div>
          ) : (
            <div className="grid gap-4">
              {visible.map((a) => (
                <article
                  key={a.id}
                  className={
                    a.fixado
                      ? "relative overflow-hidden rounded-3xl border border-violet-400/30 bg-slate-950/55 p-6 shadow-[0_0_0_1px_rgba(139,92,246,0.18),0_24px_80px_rgba(0,0,0,0.55)]"
                      : "relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/55 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_80px_rgba(0,0,0,0.45)]"
                  }
                >
                  <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/35 to-transparent" />
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ring-1 ${avisoTipoPillClass(
                        String(a.tipo),
                      )}`}
                    >
                      {avisoTipoLabel(String(a.tipo))}
                    </span>
                    {a.fixado ? (
                      <span className="rounded-full border border-violet-400/30 bg-violet-500/15 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-violet-100">
                        Fixado
                      </span>
                    ) : null}
                    <span className="ml-auto text-xs text-slate-500">
                      {fmtDate(a.publicado_em)}
                    </span>
                  </div>
                  <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-50">
                    {a.titulo}
                  </h2>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                    {a.mensagem}
                  </p>
                  {a.expira_em ? (
                    <p className="mt-4 text-xs text-slate-500">
                      Expira em {fmtDate(a.expira_em)}.
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

