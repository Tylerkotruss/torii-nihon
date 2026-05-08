"use client";

import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { useDashboardData } from "@/contexts/DashboardDataContext";
import {
  duvidaPrioridadeLabel,
  duvidaPrioridadePillClass,
  duvidaStatusLabel,
  duvidaStatusPillClass,
  type DuvidaMensagemRow,
  type DuvidaRow,
} from "@/lib/duvidas";
import { getSupabaseClient } from "@/lib/supabaseClient";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

function fmtDateTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function inputBaseClass() {
  return "w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-200 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] outline-none transition-colors placeholder:text-slate-400 focus:border-violet-400/55 focus:ring-2 focus:ring-violet-400/35";
}

export default function DuvidaConversaPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const duvidaId = String(params?.id ?? "");
  const { userId, isLoading: ctxBoot } = useDashboardData();

  const [duvida, setDuvida] = useState<DuvidaRow | null>(null);
  const [msgs, setMsgs] = useState<DuvidaMensagemRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    if (!userId || !duvidaId) return;
    setError(null);
    const supabase = getSupabaseClient();
    const [dQ, mQ] = await Promise.all([
      supabase
        .from("duvidas")
        .select(
          "id, aluno_id, assunto, categoria, status, prioridade, criado_em, atualizado_em",
        )
        .eq("id", duvidaId)
        .maybeSingle(),
      supabase
        .from("duvida_mensagens")
        .select("id, duvida_id, autor_id, mensagem, autor_tipo, criado_em")
        .eq("duvida_id", duvidaId)
        .order("criado_em", { ascending: true })
        .limit(2000),
    ]);

    if (dQ.error || mQ.error) {
      setError((dQ.error ?? mQ.error)!.message);
      return;
    }

    setDuvida((dQ.data ?? null) as DuvidaRow | null);
    setMsgs((mQ.data ?? []) as DuvidaMensagemRow[]);
  }, [userId, duvidaId]);

  useEffect(() => {
    if (ctxBoot) return;
    if (!userId) {
      router.replace(
        `/login?next=/dashboard/duvidas/${encodeURIComponent(duvidaId)}`,
      );
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
  }, [ctxBoot, userId, duvidaId, load, router]);

  const canSend = useMemo(() => {
    if (!duvida) return false;
    return String(duvida.status) !== "fechada";
  }, [duvida]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !duvidaId) return;
    const msg = text.trim();
    if (msg.length < 1) return;
    setPending(true);
    setError(null);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from("duvida_mensagens").insert({
        duvida_id: duvidaId,
        autor_id: userId,
        autor_tipo: "aluno",
        mensagem: msg,
      });
      if (error) {
        setError(error.message);
        return;
      }
      setText("");
      await load();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(900px_480px_at_12%_0%,rgba(139,92,246,0.14),transparent_50%),radial-gradient(700px_420px_at_88%_10%,rgba(59,130,246,0.1),transparent_50%),linear-gradient(to_bottom,#070a12,#03050c)] text-slate-100">
      <DashboardHeader
        variant="dark"
        title="Conversa"
        subtitle="Acompanhe as respostas da equipe por aqui."
      />
      <main className="px-4 pb-12 pt-5 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-5xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/dashboard/duvidas"
              className="inline-flex h-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-sm font-semibold text-slate-200 hover:bg-white/[0.06]"
            >
              Voltar
            </Link>
            {duvida ? (
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ring-1 ${duvidaStatusPillClass(
                    String(duvida.status),
                  )}`}
                >
                  {duvidaStatusLabel(String(duvida.status))}
                </span>
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ring-1 ${duvidaPrioridadePillClass(
                    String(duvida.prioridade),
                  )}`}
                >
                  {duvidaPrioridadeLabel(String(duvida.prioridade))}
                </span>
              </div>
            ) : null}
          </div>

          {error ? (
            <div className="rounded-xl border border-red-500/25 bg-red-950/40 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          ) : null}

          {isLoading ? (
            <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-6 text-sm text-slate-400 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
              Carregando…
            </div>
          ) : !duvida ? (
            <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-6 text-sm text-slate-400 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
              Dúvida não encontrada (ou você não tem acesso).
            </div>
          ) : (
            <>
              <section className="rounded-3xl border border-white/10 bg-slate-950/55 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_80px_rgba(0,0,0,0.35)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Assunto
                </p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-50">
                  {duvida.assunto}
                </h1>
                <div className="mt-2 text-xs text-slate-500">
                  Criada em {fmtDateTime(duvida.criado_em)} · Atualizada em{" "}
                  {fmtDateTime(duvida.atualizado_em)}
                </div>
              </section>

              <section className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/55 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_80px_rgba(0,0,0,0.35)]">
                <div className="min-w-0 space-y-3">
                  {msgs.length === 0 ? (
                    <p className="text-sm text-slate-400">Sem mensagens ainda.</p>
                  ) : (
                    msgs.map((m) => {
                      const fromAluno = String(m.autor_tipo) === "aluno";
                      return (
                        <div
                          key={m.id}
                          className={
                            fromAluno
                              ? "flex w-full min-w-0 justify-end"
                              : "flex w-full min-w-0 justify-start"
                          }
                        >
                          <div
                            className={
                              fromAluno
                                ? "min-w-0 max-w-[85%] overflow-hidden rounded-3xl border border-violet-400/25 bg-violet-500/10 px-4 py-3 text-sm text-slate-100 shadow-[0_0_24px_rgba(139,92,246,0.10)] sm:max-w-[80%]"
                                : "min-w-0 max-w-[85%] overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200 sm:max-w-[80%]"
                            }
                          >
                            <div className="whitespace-pre-wrap break-words leading-relaxed [overflow-wrap:anywhere]">
                              {m.mensagem}
                            </div>
                            <div className="mt-2 text-[11px] text-slate-500">
                              {fromAluno ? "Você" : "Equipe"} ·{" "}
                              {fmtDateTime(m.criado_em)}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <form onSubmit={send} className="mt-6 space-y-3">
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={4}
                    disabled={!canSend || pending}
                    placeholder={
                      canSend
                        ? "Escreva sua mensagem…"
                        : "Esta dúvida está fechada e não aceita novas mensagens."
                    }
                    className={inputBaseClass()}
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!canSend || pending || text.trim().length === 0}
                      className="inline-flex h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-blue-600 px-5 text-sm font-semibold text-white shadow-[0_0_34px_rgba(139,92,246,0.26)] transition hover:from-violet-500 hover:via-fuchsia-500 hover:to-blue-500 disabled:opacity-60"
                    >
                      {pending ? "Enviando…" : "Enviar"}
                    </button>
                  </div>
                </form>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

