"use client";

import { DashboardHeader } from "@/components/layout/DashboardHeader";
import {
  type AlunoDocumentosResumo,
  useDashboardData,
} from "@/contexts/DashboardDataContext";
import {
  DOCUMENT_TYPE_OPTIONS,
  type DocumentoResumo,
} from "@/lib/documents";
import Link from "next/link";
import { useMemo, type ReactNode } from "react";

function tipoLabelFromValue(value: string) {
  return DOCUMENT_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

function computeOfficialState(documentos: DocumentoResumo[]) {
  const tiposOficiais = new Set(DOCUMENT_TYPE_OPTIONS.map((o) => o.value));
  const rowsOficiais = documentos.filter((r) => tiposOficiais.has(r.tipo));
  const latestByTipo = new Map<string, DocumentoResumo>();
  for (const row of rowsOficiais) {
    const cur = latestByTipo.get(row.tipo);
    if (
      !cur ||
      new Date(row.created_at).getTime() > new Date(cur.created_at).getTime()
    ) {
      latestByTipo.set(row.tipo, row);
    }
  }
  const latestRows = Array.from(latestByTipo.values());
  const covered = new Set(latestByTipo.keys());
  const faltantesLista = DOCUMENT_TYPE_OPTIONS.filter((o) => !covered.has(o.value));
  return {
    latestRows,
    latestByTipo,
    totalFicheirosOficiais: rowsOficiais.length,
    faltantesLista,
  };
}

function buildGuidedAssistant(
  resumo: AlunoDocumentosResumo,
  latestRows: DocumentoResumo[],
  faltantesLista: { value: string; label: string }[],
) {
  const precisaCorrecao = latestRows.some(
    (d) => d.status === "rejeitado" || d.status === "recusado",
  );
  const faltam = resumo.pendencias;
  const todosAprovadosPorTipo =
    faltam === 0 &&
    latestRows.length === resumo.meta &&
    latestRows.length > 0 &&
    latestRows.every((d) => d.status === "aprovado");

  const recusadosLabels = latestRows
    .filter((d) => d.status === "rejeitado" || d.status === "recusado")
    .map((d) => tipoLabelFromValue(d.tipo));

  if (faltam > 0) {
    const primeiro = faltantesLista[0];
    const proximoTitulo = primeiro
      ? `Comece enviando: ${primeiro.label}`
      : "Envie os documentos obrigatórios na área de Documentos.";
    return {
      diagnostico: `Resumo: ${resumo.uniqueTipos} de ${resumo.meta} tipo(s) obrigatório(s) já têm pelo menos um envio; ${resumo.totalFicheiros} ficheiro(s) enviado(s) no total.`,
      pendenciaTitulo: "O que ainda falta",
      pendenciaDescricao:
        faltam === 1
          ? "Falta 1 tipo obrigatório para a sua documentação ficar completa."
          : `Faltam ${faltam} tipos obrigatórios para a sua documentação ficar completa.`,
      pendenciaItens: faltantesLista.map((o) => o.label),
      proximoPassoTitulo: proximoTitulo,
      proximoPassoDetalhe:
        "Envie um ficheiro por tipo (PDF, DOC ou DOCX). Pode voltar aqui para ver o próximo passo.",
      primaryCta: { label: "Enviar documento", href: "/dashboard/docs" },
    };
  }

  if (precisaCorrecao) {
    const primeiroRec = recusadosLabels[0];
    const proximoTitulo = primeiroRec
      ? `Corrija e reenvie primeiro: ${primeiroRec}`
      : "Corrija os documentos recusados na área de Documentos.";
    return {
      diagnostico: `A equipa analisou os seus envios. Há ${recusadosLabels.length} tipo(s) com documento recusado — precisam de nova versão.`,
      pendenciaTitulo: "Documentos a corrigir",
      pendenciaDescricao:
        "Leia o motivo da recusa em Documentos e envie uma nova versão.",
      pendenciaItens: recusadosLabels,
      proximoPassoTitulo: proximoTitulo,
      proximoPassoDetalhe:
        "Depois de reenviar, o documento volta para a fila de análise.",
      primaryCta: { label: "Corrigir documentos", href: "/dashboard/docs" },
    };
  }

  if (todosAprovadosPorTipo) {
    return {
      diagnostico:
        "Todos os tipos obrigatórios estão aprovados no último envio. Não há pendências de documentação.",
      pendenciaTitulo: "Situação",
      pendenciaDescricao: "Nenhuma ação obrigatória neste momento.",
      pendenciaItens: [] as string[],
      proximoPassoTitulo: "Tudo certo por aqui",
      proximoPassoDetalhe: "Seus documentos estão em dia com o que pedimos até agora.",
      primaryCta: { label: "Ver documentos", href: "/dashboard/docs" },
    };
  }

  return {
    diagnostico: `Estado atual: ${resumo.statusGeral}.`,
    pendenciaTitulo: "Atenção",
    pendenciaDescricao: resumo.statusDetalhe,
    pendenciaItens: [] as string[],
    proximoPassoTitulo: "Próximo passo",
    proximoPassoDetalhe:
      "Acompanhe o andamento na área de Documentos ou aguarde a análise da equipa.",
    primaryCta: { label: "Ver documentos", href: "/dashboard/docs" },
  };
}

function SectionStep({
  step,
  title,
  children,
}: {
  step: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-violet-400/35 bg-violet-500/15 text-sm font-bold text-violet-200 shadow-[0_0_20px_rgba(139,92,246,0.2)]">
        {step}
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          {title}
        </h3>
        <div className="mt-2">{children}</div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const {
    aluno: profile,
    documentos,
    resumo,
    isLoading,
    loadError,
    docsError,
  } = useDashboardData();

  const { latestRows, totalFicheirosOficiais, faltantesLista } = useMemo(
    () => computeOfficialState(documentos),
    [documentos],
  );

  const aprovadosCount = useMemo(
    () => latestRows.filter((d) => d.status === "aprovado").length,
    [latestRows],
  );

  const guided = useMemo(
    () => buildGuidedAssistant(resumo, latestRows, faltantesLista),
    [resumo, latestRows, faltantesLista],
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(900px_480px_at_12%_0%,rgba(139,92,246,0.14),transparent_50%),radial-gradient(700px_420px_at_88%_10%,rgba(59,130,246,0.1),transparent_50%),linear-gradient(to_bottom,#070a12,#03050c)] text-slate-100">
      <DashboardHeader
        variant="dark"
        title="Assistente do Aluno"
        subtitle="Veja sua situação atual e o próximo passo recomendado."
        showUserSummary
        accountName={profile?.nome_completo}
        accountEmail={profile?.email}
        isAccountLoading={isLoading}
      />
      <main className="px-6 pb-10 pt-5">
        {loadError ? (
          <div className="mb-4 rounded-xl border border-red-500/25 bg-red-950/40 px-4 py-3 text-sm text-red-100">
            {loadError}
          </div>
        ) : null}
        {docsError && !loadError ? (
          <div className="mb-4 rounded-xl border border-amber-500/25 bg-amber-950/30 px-4 py-3 text-sm text-amber-100">
            Documentos: {docsError}
          </div>
        ) : null}

        {isLoading ? (
          <div className="max-w-2xl animate-pulse rounded-3xl border border-white/10 bg-slate-950/50 p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
            <div className="h-7 w-56 rounded-lg bg-white/10" />
            <div className="mt-6 h-4 w-full max-w-md rounded bg-white/[0.07]" />
            <div className="mt-10 space-y-6">
              <div className="h-16 rounded-xl bg-white/[0.05]" />
              <div className="h-24 rounded-xl bg-white/[0.05]" />
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-6">
            <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/55 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur sm:p-8">
              <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/35 to-transparent" />
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-300/90">
                    Orientação passo a passo
                  </p>
                  <p className="mt-1 text-lg font-semibold tracking-tight text-slate-50">
                    Seu assistente
                  </p>
                </div>
                <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200/95">
                  {resumo.statusGeral}
                </span>
              </div>

              <div className="mt-6 space-y-8">
                <SectionStep step={1} title="Diagnóstico">
                  <p className="text-sm leading-relaxed text-slate-300">
                    {guided.diagnostico}
                  </p>
                  <p className="mt-3 text-xs text-slate-500">
                    <span className="font-medium text-slate-400">Ficheiros:</span>{" "}
                    {totalFicheirosOficiais} enviado(s) ·{" "}
                    <span className="font-medium text-slate-400">Aprovados (último por tipo):</span>{" "}
                    {aprovadosCount} ·{" "}
                    <span className="font-medium text-slate-400">Progresso:</span>{" "}
                    {resumo.progressPct}%
                  </p>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.08]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-[width]"
                      style={{ width: `${resumo.progressPct}%` }}
                    />
                  </div>
                </SectionStep>

                <SectionStep step={2} title={guided.pendenciaTitulo}>
                  <p className="text-sm leading-relaxed text-slate-300">
                    {guided.pendenciaDescricao}
                  </p>
                  {guided.pendenciaItens.length > 0 ? (
                    <ul className="mt-3 space-y-2 border-l-2 border-violet-500/40 pl-4">
                      {guided.pendenciaItens.map((item) => (
                        <li
                          key={item}
                          className="flex items-center gap-2 text-sm text-slate-200"
                        >
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </SectionStep>

                <SectionStep step={3} title="Próximo passo recomendado">
                  <p className="text-base font-semibold leading-snug text-slate-50">
                    {guided.proximoPassoTitulo}
                  </p>
                  {guided.proximoPassoDetalhe ? (
                    <p className="mt-2 text-sm text-slate-400">
                      {guided.proximoPassoDetalhe}
                    </p>
                  ) : null}
                  <div className="mt-4 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-sm text-slate-400">
                    Depois do envio, sua documentação será analisada pela equipe.
                  </div>
                  <div className="mt-4">
                    <Link
                      href={guided.primaryCta.href}
                      className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 text-sm font-semibold text-white shadow-[0_0_24px_rgba(139,92,246,0.25)] transition hover:from-violet-500 hover:to-blue-500"
                    >
                      {guided.primaryCta.label}
                    </Link>
                  </div>
                </SectionStep>

                <SectionStep step={4} title="Ações rápidas">
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <Link
                      href="/dashboard/docs"
                      className="inline-flex h-10 items-center justify-center rounded-xl border border-violet-400/35 bg-violet-500/10 px-4 text-sm font-semibold text-violet-100 transition hover:border-violet-400/50 hover:bg-violet-500/15"
                    >
                      Enviar documento
                    </Link>
                    <Link
                      href="/dashboard/docs"
                      className="inline-flex h-10 items-center justify-center rounded-xl border border-white/12 bg-white/[0.04] px-4 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/[0.07]"
                    >
                      Ver documentos
                    </Link>
                    <a
                      href="#entender-pendencias"
                      className="inline-flex h-10 items-center justify-center rounded-xl border border-white/12 bg-transparent px-4 text-sm font-semibold text-slate-300 transition hover:border-white/20 hover:text-slate-100"
                    >
                      Entender pendências
                    </a>
                  </div>
                </SectionStep>
              </div>
            </section>

            <section
              id="entender-pendencias"
              className="scroll-mt-8 rounded-2xl border border-white/10 bg-slate-950/40 px-5 py-5 text-sm text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
            >
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Como funciona
              </h2>
              <ul className="mt-3 list-inside list-disc space-y-2 marker:text-violet-400">
                <li>
                  Precisamos de{" "}
                  <strong className="text-slate-200">
                    {DOCUMENT_TYPE_OPTIONS.length} tipos
                  </strong>{" "}
                  de documento:{" "}
                  {DOCUMENT_TYPE_OPTIONS.map((o) => o.label).join(" · ")}.
                </li>
                <li>
                  Cada tipo conta como &quot;enviado&quot; quando existe pelo menos um
                  ficheiro seu naquele tipo.
                </li>
                <li>
                  Se algo for recusado, o assistente pede correção — o motivo aparece na
                  página de Documentos.
                </li>
                <li>
                  Depois do envio, sua documentação será analisada pela equipe; pode
                  voltar ao Assistente para ver o próximo passo.
                </li>
              </ul>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
