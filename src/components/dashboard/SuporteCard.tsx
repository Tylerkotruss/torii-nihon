"use client";

import { useDashboardData } from "@/contexts/DashboardDataContext";
import { getSupabaseClient } from "@/lib/supabaseClient";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export function SuporteCard() {
  const { userId, isLoading: ctxBoot } = useDashboardData();
  const [abertas, setAbertas] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ctxBoot) return;
    if (!userId) return;
    let active = true;
    (async () => {
      setError(null);
      const supabase = getSupabaseClient();
      const { count, error } = await supabase
        .from("duvidas")
        .select("*", { count: "exact", head: true })
        .eq("status", "aberta");
      if (!active) return;
      if (error) {
        setError(error.message);
        setAbertas(null);
        return;
      }
      setAbertas(count ?? 0);
    })();
    return () => {
      active = false;
    };
  }, [ctxBoot, userId]);

  const subtitle = useMemo(() => {
    if (error) return "Não foi possível carregar seu suporte.";
    if (abertas === null) return "Acompanhe suas dúvidas e respostas.";
    if (abertas === 0) return "Sem dúvidas abertas no momento.";
    if (abertas === 1) return "Você possui 1 dúvida aberta.";
    return `Você possui ${abertas} dúvidas abertas.`;
  }, [abertas, error]);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/55 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_22px_70px_rgba(0,0,0,0.45)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(700px_260px_at_0%_0%,rgba(16,185,129,0.12),transparent)]" />
      <p className="relative text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
        Suporte
      </p>
      <p className="relative mt-2 text-sm text-slate-300">{subtitle}</p>
      {error ? (
        <p className="relative mt-2 text-xs text-amber-200/90">{error}</p>
      ) : null}
      <div className="relative mt-4">
        <Link
          href="/dashboard/duvidas"
          className="inline-flex h-10 items-center justify-center rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/15"
        >
          Ver dúvidas
        </Link>
      </div>
    </section>
  );
}

