"use client";

import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { useDashboardData } from "@/contexts/DashboardDataContext";
import {
  duvidaPrioridadeLabel,
  duvidaPrioridadePillClass,
  duvidaStatusLabel,
  duvidaStatusPillClass,
  type DuvidaRow,
  type FaqRow,
} from "@/lib/duvidas";
import { getSupabaseClient } from "@/lib/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type Tab = "faq" | "minhas";

type FaqItem = { id: string; pergunta: string; resposta: string };

/**
 * Lista padrão exibida quando ainda não há FAQs no banco.
 * Mantém a página útil sem precisar de gerenciamento no Admin.
 */
const DEFAULT_FAQ: FaqItem[] = [
  {
    id: "default-envio-documentos",
    pergunta: "Como envio meus documentos?",
    resposta:
      "Acesse a área de Documentos no menu lateral, escolha o tipo de documento e envie um arquivo em PDF, DOC ou DOCX legível. Cada tipo aceita uma versão de cada vez — para atualizar, basta enviar uma nova versão.",
  },
  {
    id: "default-tempo-analise",
    pergunta: "Quanto tempo demora a análise dos documentos?",
    resposta:
      "Após o envio, o documento entra em validação pela equipe. O prazo varia conforme o volume da fila, mas o status fica visível em Documentos. Você não precisa enviar de novo enquanto estiver em análise.",
  },
  {
    id: "default-documento-recusado",
    pergunta: "O que faço se meu documento for recusado?",
    resposta:
      "Em Documentos, abra o item recusado e leia o motivo informado pela equipe. Faça a correção indicada e envie uma nova versão pelo mesmo tipo. O status volta automaticamente para análise.",
  },
  {
    id: "default-avisos",
    pergunta: "Onde vejo avisos importantes?",
    resposta:
      "Os comunicados ficam em Avisos, no menu lateral. Avisos fixados aparecem no topo, e o aviso mais relevante também aparece no Assistente do Aluno (página inicial).",
  },
  {
    id: "default-calendario",
    pergunta: "Como acompanho datas e prazos?",
    resposta:
      "A página Calendário mostra eventos, prazos e reuniões publicados pela equipe. O próximo evento publicado também é destacado no Assistente do Aluno.",
  },
  {
    id: "default-quando-abrir-duvida",
    pergunta: "Quando devo abrir uma dúvida?",
    resposta:
      "Se a sua pergunta não foi resolvida nas perguntas frequentes acima, abra um chamado clicando em “Nova dúvida”. A equipe responde diretamente por aqui e você acompanha tudo no portal.",
  },
];

function fmtDateTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function inputBaseClass() {
  return "mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2.5 text-sm text-slate-200 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] outline-none transition-colors placeholder:text-slate-400 focus:border-violet-400/55 focus:ring-2 focus:ring-violet-400/35";
}

function selectBaseClass() {
  return "mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2.5 text-sm text-slate-200 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] outline-none transition-colors focus:border-violet-400/55 focus:ring-2 focus:ring-violet-400/35";
}

function tabClass(active: boolean) {
  return active
    ? "relative flex-1 rounded-2xl border border-violet-400/35 bg-violet-500/15 px-4 py-3 text-sm font-semibold text-violet-100 shadow-[0_0_22px_rgba(139,92,246,0.14)]"
    : "flex-1 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.06] hover:text-slate-100";
}

export default function DuvidasPage() {
  const router = useRouter();
  const { userId, isLoading: ctxBoot } = useDashboardData();

  const [tab, setTab] = useState<Tab>("faq");
  const [faq, setFaq] = useState<FaqRow[]>([]);
  const [duvidas, setDuvidas] = useState<DuvidaRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  // New dúvida modal
  const [openNew, setOpenNew] = useState(false);
  const [pendingNew, setPendingNew] = useState(false);
  const [newAssunto, setNewAssunto] = useState("");
  const [newCategoria, setNewCategoria] = useState("");
  const [newPrioridade, setNewPrioridade] = useState<
    "baixa" | "normal" | "alta"
  >("normal");
  const [newMensagem, setNewMensagem] = useState("");

  const load = useCallback(async () => {
    if (!userId) return;
    setError(null);
    const supabase = getSupabaseClient();
    const [faqQ, duvQ] = await Promise.all([
      supabase
        .from("faq")
        .select(
          "id, pergunta, resposta, categoria, ativo, ordem, criado_em, atualizado_em",
        )
        .order("ordem", { ascending: true })
        .limit(500),
      supabase
        .from("duvidas")
        .select(
          "id, aluno_id, assunto, categoria, status, prioridade, criado_em, atualizado_em",
        )
        .order("atualizado_em", { ascending: false })
        .limit(200),
    ]);
    if (faqQ.error || duvQ.error) {
      setError((faqQ.error ?? duvQ.error)!.message);
      return;
    }
    setFaq((faqQ.data ?? []) as FaqRow[]);
    setDuvidas((duvQ.data ?? []) as DuvidaRow[]);
  }, [userId]);

  useEffect(() => {
    if (ctxBoot) return;
    if (!userId) {
      router.replace("/login?next=/dashboard/duvidas");
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

  const faqList: FaqItem[] = useMemo(() => {
    const fromDb = faq
      .filter((f) => f.ativo)
      .sort((a, b) => {
        if (a.ordem !== b.ordem) return a.ordem - b.ordem;
        return (a.pergunta ?? "").localeCompare(b.pergunta ?? "");
      })
      .map((f) => ({
        id: f.id,
        pergunta: f.pergunta,
        resposta: f.resposta,
      }));
    return fromDb.length > 0 ? fromDb : DEFAULT_FAQ;
  }, [faq]);

  function openNovaDuvida() {
    setTab("minhas");
    setOpenNew(true);
  }

  async function criarDuvida(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    const assunto = newAssunto.trim();
    const mensagem = newMensagem.trim();
    if (assunto.length < 3) {
      setError("Assunto deve ter pelo menos 3 caracteres.");
      return;
    }
    if (mensagem.length < 3) {
      setError("Escreva uma mensagem (mínimo 3 caracteres).");
      return;
    }
    setError(null);
    setPendingNew(true);
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("duvidas")
        .insert({
          aluno_id: userId,
          assunto,
          categoria: newCategoria.trim() ? newCategoria.trim() : null,
          prioridade: newPrioridade,
          status: "aberta",
        })
        .select("id")
        .maybeSingle();

      if (error) {
        setError(error.message);
        return;
      }
      const duvidaId = data?.id as string | undefined;
      if (!duvidaId) {
        setError("Não foi possível criar a dúvida.");
        return;
      }

      const { error: msgErr } = await supabase.from("duvida_mensagens").insert({
        duvida_id: duvidaId,
        autor_id: userId,
        autor_tipo: "aluno",
        mensagem,
      });
      if (msgErr) {
        setError(msgErr.message);
        return;
      }

      setOpenNew(false);
      setNewAssunto("");
      setNewCategoria("");
      setNewPrioridade("normal");
      setNewMensagem("");
      await load();
      router.push(`/dashboard/duvidas/${duvidaId}`);
    } finally {
      setPendingNew(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(900px_480px_at_12%_0%,rgba(139,92,246,0.14),transparent_50%),radial-gradient(700px_420px_at_88%_10%,rgba(59,130,246,0.1),transparent_50%),linear-gradient(to_bottom,#070a12,#03050c)] text-slate-100">
      <DashboardHeader
        variant="dark"
        title="Central de ajuda"
        subtitle="Perguntas frequentes e seus chamados com a equipe."
      />

      <main className="px-4 pb-12 pt-5 sm:px-6 lg:px-8">
        {error ? (
          <div className="mx-auto mb-4 w-full max-w-3xl rounded-xl border border-red-500/25 bg-red-950/40 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <div className="mx-auto w-full max-w-3xl space-y-5">
          <section className="rounded-3xl border border-white/10 bg-slate-950/55 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_80px_rgba(0,0,0,0.35)] sm:p-5">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTab("faq")}
                className={tabClass(tab === "faq")}
              >
                Perguntas frequentes
              </button>
              <button
                type="button"
                onClick={() => setTab("minhas")}
                className={tabClass(tab === "minhas")}
              >
                Minhas dúvidas
              </button>
            </div>
          </section>

          {isLoading ? (
            <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-6 text-sm text-slate-400 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
              Carregando…
            </div>
          ) : tab === "faq" ? (
            <section className="space-y-5">
              <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_80px_rgba(0,0,0,0.35)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Perguntas frequentes
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-50">
                  Respostas rápidas para o dia a dia
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Selecione uma pergunta para ver a resposta.
                </p>

                <ul className="mt-5 space-y-2">
                  {faqList.map((f) => {
                    const open = openFaqId === f.id;
                    return (
                      <li key={f.id}>
                        <button
                          type="button"
                          onClick={() => setOpenFaqId(open ? null : f.id)}
                          aria-expanded={open}
                          className={[
                            "w-full rounded-2xl border px-5 py-4 text-left transition",
                            open
                              ? "border-violet-400/30 bg-violet-500/10"
                              : "border-white/10 bg-black/20 hover:bg-white/[0.04]",
                          ].join(" ")}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 text-sm font-semibold text-slate-50">
                              {f.pergunta}
                            </div>
                            <span
                              aria-hidden="true"
                              className="shrink-0 text-base text-slate-400"
                            >
                              {open ? "−" : "+"}
                            </span>
                          </div>
                          {open ? (
                            <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                              {f.resposta}
                            </div>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-base font-semibold text-slate-50">
                      Não encontrou o que procurava?
                    </div>
                    <p className="mt-1 text-sm text-slate-400">
                      Abra uma dúvida e nossa equipe responde por aqui.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={openNovaDuvida}
                    className="inline-flex h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-blue-600 px-5 text-sm font-semibold text-white shadow-[0_0_34px_rgba(139,92,246,0.26)] transition hover:from-violet-500 hover:via-fuchsia-500 hover:to-blue-500"
                  >
                    Nova dúvida
                  </button>
                </div>
              </div>
            </section>
          ) : (
            <div className="space-y-4">
              <section className="rounded-3xl border border-white/10 bg-slate-950/55 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_80px_rgba(0,0,0,0.35)]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Chamados
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-slate-50">
                      Minhas dúvidas
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      Abra um chamado e acompanhe a resposta da equipe.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpenNew(true)}
                    className="inline-flex h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-blue-600 px-5 text-sm font-semibold text-white shadow-[0_0_34px_rgba(139,92,246,0.26)] transition hover:from-violet-500 hover:via-fuchsia-500 hover:to-blue-500"
                  >
                    Nova dúvida
                  </button>
                </div>
              </section>

              {duvidas.length === 0 ? (
                <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-6 text-sm text-slate-400 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
                  <div className="text-slate-200 font-semibold">
                    Você ainda não abriu nenhuma dúvida.
                  </div>
                  <div className="mt-1">
                    Quando precisar, clique em “Nova dúvida”.
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/35 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur lg:overflow-x-visible">
                  <table className="min-w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-xs text-slate-400">
                        <th className="px-4 py-3.5 font-semibold">Assunto</th>
                        <th className="px-4 py-3.5 font-semibold">Status</th>
                        <th className="px-4 py-3.5 font-semibold">Prioridade</th>
                        <th className="px-4 py-3.5 font-semibold">
                          Atualização
                        </th>
                        <th className="px-4 py-3.5 text-right font-semibold">
                          Abrir
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {duvidas.map((d) => (
                        <tr
                          key={d.id}
                          className="text-slate-200/90 transition-colors hover:bg-white/[0.025]"
                        >
                          <td className="px-4 py-3.5">
                            <div className="font-semibold text-slate-50 truncate">
                              {d.assunto}
                            </div>
                            {d.categoria?.trim() ? (
                              <div className="mt-0.5 text-xs text-slate-500 truncate">
                                {d.categoria}
                              </div>
                            ) : null}
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ring-1 ${duvidaStatusPillClass(
                                String(d.status),
                              )}`}
                            >
                              {duvidaStatusLabel(String(d.status))}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ring-1 ${duvidaPrioridadePillClass(
                                String(d.prioridade),
                              )}`}
                            >
                              {duvidaPrioridadeLabel(String(d.prioridade))}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                            {fmtDateTime(d.atualizado_em)}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <Link
                              href={`/dashboard/duvidas/${d.id}`}
                              className="inline-flex h-9 items-center rounded-xl border border-violet-400/25 bg-violet-500/10 px-3 text-xs font-semibold text-violet-100 hover:bg-violet-500/15"
                            >
                              Ver conversa
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {openNew ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 py-6 sm:items-center">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-slate-950/80 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_36px_120px_rgba(0,0,0,0.75)] backdrop-blur">
            <div className="border-b border-white/10 px-5 py-4">
              <div className="text-sm font-semibold text-slate-50">
                Nova dúvida
              </div>
              <div className="mt-0.5 text-xs text-slate-400">
                Envie sua pergunta. A equipe responde quando possível (sem chat em tempo real).
              </div>
            </div>
            <form onSubmit={criarDuvida} className="space-y-4 px-5 py-5">
              <label className="block">
                <span className="text-sm font-medium text-slate-300">Assunto</span>
                <input
                  value={newAssunto}
                  onChange={(e) => setNewAssunto(e.target.value)}
                  className={inputBaseClass()}
                  placeholder="Ex.: Problema ao enviar documento"
                  required
                  minLength={3}
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-slate-300">Categoria (opcional)</span>
                  <input
                    value={newCategoria}
                    onChange={(e) => setNewCategoria(e.target.value)}
                    className={inputBaseClass()}
                    placeholder="Ex.: Documentos"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-300">Prioridade</span>
                  <select
                    value={newPrioridade}
                    onChange={(e) =>
                      setNewPrioridade(e.target.value as "baixa" | "normal" | "alta")
                    }
                    className={selectBaseClass()}
                  >
                    <option value="baixa">Baixa</option>
                    <option value="normal">Normal</option>
                    <option value="alta">Alta</option>
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-medium text-slate-300">Mensagem</span>
                <textarea
                  value={newMensagem}
                  onChange={(e) => setNewMensagem(e.target.value)}
                  className={inputBaseClass()}
                  rows={6}
                  required
                  minLength={3}
                  placeholder="Explique o que aconteceu e, se possível, inclua detalhes."
                />
              </label>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setOpenNew(false)}
                  className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-5 text-sm font-semibold text-slate-200 hover:bg-white/[0.06]"
                  disabled={pendingNew}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={pendingNew}
                  className="inline-flex h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-blue-600 px-5 text-sm font-semibold text-white shadow-[0_0_34px_rgba(139,92,246,0.26)] transition hover:from-violet-500 hover:via-fuchsia-500 hover:to-blue-500 disabled:opacity-60"
                >
                  {pendingNew ? "Enviando…" : "Criar dúvida"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
