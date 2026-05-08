"use client";

import { DashboardHeader } from "@/components/layout/DashboardHeader";
import {
  type AlunoDocumentosResumo,
  useDashboardData,
} from "@/contexts/DashboardDataContext";
import {
  DOCUMENT_TYPE_OPTIONS,
  documentAdminStatusBadgeClass,
  type DocumentoResumo,
} from "@/lib/documents";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AvisosHighlightCard } from "@/components/dashboard/AvisosHighlightCard";
import { ProximoEventoCard } from "@/components/dashboard/ProximoEventoCard";
import { SuporteCard } from "@/components/dashboard/SuporteCard";

type AssistantTab = "resumo" | "pendencias" | "proximos";

type AssistantScenario =
  | "empty"
  | "incomplete"
  | "in_review"
  | "rejected"
  | "approved";

const PROCESS_JOURNEY_STEPS = [
  "Enviar documento",
  "Validação da equipe",
  "Aprovação",
  "Finalização",
] as const;

function journeyActiveIndexForScenario(scenario: AssistantScenario): number {
  switch (scenario) {
    case "empty":
    case "incomplete":
      return 0;
    case "in_review":
      return 1;
    case "rejected":
      return 2;
    case "approved":
      return 3;
    default:
      return 0;
  }
}

function processStepClass(
  index: number,
  active: number,
  scenario: AssistantScenario,
): string {
  if (scenario === "approved") {
    return index === 3
      ? "font-semibold text-emerald-200"
      : "font-medium text-emerald-400/80";
  }
  if (index < active) {
    return "font-medium text-emerald-400/75";
  }
  if (index === active) {
    return "font-semibold text-violet-200";
  }
  return "text-slate-600";
}

function ProcessJourneyCard({
  scenario,
  activeIndex,
}: {
  scenario: AssistantScenario;
  activeIndex: number;
}) {
  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/55 px-5 py-5 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_22px_70px_rgba(0,0,0,0.45)]"
      aria-label="Etapas do processo de documentação"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_200px_at_0%_0%,rgba(139,92,246,0.18),transparent)]" />
      <p className="text-[11px] font-medium text-slate-500">
        Sua documentação segue estas etapas:
      </p>
      <div className="relative mt-4">
        <div className="pointer-events-none absolute left-4 right-4 top-5 hidden h-px bg-gradient-to-r from-transparent via-white/10 to-transparent sm:block" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {PROCESS_JOURNEY_STEPS.map((label, i) => (
          <div key={label} className="relative">
            <span
              className={`relative flex w-full items-center justify-center rounded-2xl border px-3 py-3 text-xs ${processStepClass(i, activeIndex, scenario)} ${
                i === activeIndex && scenario !== "approved"
                  ? "border-violet-400/30 bg-violet-500/10"
                  : i < activeIndex || scenario === "approved"
                    ? "border-emerald-400/15 bg-emerald-500/5"
                    : "border-white/10 bg-white/[0.02]"
              }`}
            >
              <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-black/30 text-[11px] font-extrabold text-slate-200">
                {i + 1}
              </span>
              <span className="font-semibold text-slate-100">{label}</span>
            </span>
          </div>
        ))}
        </div>
      </div>
    </section>
  );
}

function tipoLabelFromValue(value: string) {
  return DOCUMENT_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

function pickVariant(roll: number, variants: readonly string[]): string {
  if (variants.length === 0) {
    return "";
  }
  const i = Math.min(
    variants.length - 1,
    Math.floor(roll * variants.length),
  );
  return variants[i] ?? variants[0] ?? "";
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

function buildAssistantModel(
  resumo: AlunoDocumentosResumo,
  latestRows: DocumentoResumo[],
  faltantesLista: { value: string; label: string }[],
  totalFicheirosOficiais: number,
  voice: { roll: number; roll2: number },
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

  const recusadosRows = latestRows.filter(
    (d) => d.status === "rejeitado" || d.status === "recusado",
  );
  const recusadosLabels = recusadosRows.map((d) => tipoLabelFromValue(d.tipo));

  const emFilaAnalise = latestRows.some(
    (d) => d.status === "em_analise" || d.status === "enviado",
  );

  let scenario: AssistantScenario;
  if (todosAprovadosPorTipo) {
    scenario = "approved";
  } else if (precisaCorrecao) {
    scenario = "rejected";
  } else if (faltam > 0 && resumo.uniqueTipos === 0) {
    scenario = "empty";
  } else if (faltam > 0) {
    scenario = "incomplete";
  } else if (emFilaAnalise && !todosAprovadosPorTipo) {
    scenario = "in_review";
  } else {
    scenario = "in_review";
  }

  const primeiroFaltante = faltantesLista[0];
  const faltantesPriorityIdx =
    faltantesLista.length > 1
      ? Math.min(
          faltantesLista.length - 1,
          Math.floor(voice.roll2 * faltantesLista.length),
        )
      : 0;
  const priorityFaltante = faltantesLista[faltantesPriorityIdx] ?? primeiroFaltante;

  const recusadosPriorityIdx =
    recusadosRows.length > 1
      ? Math.min(
          recusadosRows.length - 1,
          Math.floor(voice.roll2 * recusadosRows.length),
        )
      : 0;
  const priorityRecRow = recusadosRows[recusadosPriorityIdx];
  const priorityRecLabel = priorityRecRow
    ? tipoLabelFromValue(priorityRecRow.tipo)
    : recusadosLabels[0];

  const guidedBase = (() => {
    if (faltam > 0) {
      const proximoTitulo = priorityFaltante
        ? `Comece enviando: ${priorityFaltante.label}`
        : "Envie os documentos obrigatórios na área de Documentos.";
      return {
        pendenciaTitulo: "O que ainda falta",
        pendenciaDescricao:
          faltam === 1
            ? "Falta 1 tipo obrigatório para a sua documentação ficar completa."
            : `Faltam ${faltam} tipos obrigatórios para a sua documentação ficar completa.`,
        pendenciaItens: faltantesLista.map((o) => o.label),
        proximoPassoTitulo: proximoTitulo,
        proximoPassoDetalhe:
          "Envie um documento por tipo (PDF, DOC ou DOCX).",
        primaryCta: { label: "Ir para Documentos", href: "/dashboard/docs" },
      };
    }
    if (precisaCorrecao) {
      const proximoTitulo = priorityRecLabel
        ? `Corrija e reenvie primeiro: ${priorityRecLabel}`
        : "Corrija os documentos recusados na área de Documentos.";
      return {
        pendenciaTitulo: "Documentos a corrigir",
        pendenciaDescricao:
          "A equipe deixou observações. Corrija e reenvie.",
        pendenciaItens: recusadosLabels,
        proximoPassoTitulo: proximoTitulo,
        proximoPassoDetalhe:
          "Depois do reenvio, o documento volta para validação.",
        primaryCta: { label: "Corrigir em Documentos", href: "/dashboard/docs" },
      };
    }
    if (todosAprovadosPorTipo) {
      return {
        pendenciaTitulo: "Situação",
        pendenciaDescricao:
          "Neste momento não peço mais nada de documentação obrigatória. Respira um pouco — você fez a parte de casa.",
        pendenciaItens: [] as string[],
        proximoPassoTitulo: "Tudo certo por aqui",
        proximoPassoDetalhe:
          "Se surgir algo novo, eu aviso por aqui.",
        primaryCta: { label: "Ver documentos", href: "/dashboard/docs" },
      };
    }
    return {
      pendenciaTitulo: "Atenção",
      pendenciaDescricao: resumo.statusDetalhe,
      pendenciaItens: [] as string[],
      proximoPassoTitulo: "Próximo passo",
      proximoPassoDetalhe:
        "Acompanhe o andamento em Documentos.",
      primaryCta: { label: "Ver documentos", href: "/dashboard/docs" },
    };
  })();

  const diagnosticoTecnico = `Resumo: ${resumo.uniqueTipos} de ${resumo.meta} documentos enviados.`;

  const assistantLead = (() => {
    switch (scenario) {
      case "empty":
        return pickVariant(voice.roll, [
          "Que bom te ver aqui — este é o primeiro passo da sua jornada com a gente.",
          "Bem-vindo(a): o painel está pronto; falta só o primeiro envio para eu te guiar de perto.",
          "Respira fundo: ninguém começa com tudo pronto. Daqui, o caminho é um primeiro documento na área certa.",
        ]);
      case "incomplete":
        return pickVariant(voice.roll, [
          "Bom começo: já há envios, mas a documentação ainda não está fechada.",
          "Você já deu um ótimo primeiro passo — falta fechar o pacote.",
          "Legal, você já iniciou sua documentação; agora é amarrar as pontas soltas.",
        ]);
      case "in_review":
        return pickVariant(voice.roll, [
          "Seus documentos estão com a equipe.",
          "Do seu lado está enviado; agora a equipe está validando com atenção.",
          "Estamos na fase de análise — eu fico de olho e aviso se algo precisar de você.",
        ]);
      case "rejected":
        return pickVariant(voice.roll, [
          "Um ou mais documentos precisam de um ajuste.",
          "A equipe pediu um retoque — faz parte do processo.",
          "Temos um ponto a lapidar: há documento com correção pedida.",
        ]);
      case "approved":
        return pickVariant(voice.roll, [
          "Parabéns — a documentação obrigatória está aprovada.",
          "Excelente notícia: por aqui está tudo aprovado no que é obrigatório.",
          "Missão cumprida nesta etapa — documentação obrigatória verde.",
        ]);
      default:
        return "Aqui está a leitura da sua situação.";
    }
  })();

  const assistantMessage = (() => {
    switch (scenario) {
      case "empty":
        return pickVariant(voice.roll, [
          "O início da jornada é sempre o mesmo: um primeiro envio em Documentos. É ele que acende o progresso aqui, deixa as pendências claras e me dá dados reais para te orientar — escolha um tipo, anexe um PDF ou Word legível e volte quando quiser; eu atualizo tudo na hora.",
          "Pense no primeiro envio como o início: depois dele, o assistente passa a guiar sua documentação de verdade.",
          "Você não está atrasado(a) — está no passo zero, que é onde todo mundo começa. Quando subir o primeiro documento, eu organizo o painel, marco o que falta e te digo o próximo movimento com precisão.",
        ]);
      case "incomplete":
        return pickVariant(voice.roll, [
          `Faltam ${faltam} documento(s) para finalizar esta etapa.`,
          `Ainda faltam ${faltam} documento(s). Enviar agora acelera a validação.`,
          `Estamos quase: ${faltam} tipo(s) em aberto. Cada envio novo atualiza minha leitura — quando fechar, o foco passa inteiro para a análise.`,
        ]);
      case "in_review":
        return pickVariant(voice.roll, [
          "Seus documentos estão em validação. Acompanhe em Documentos.",
          "A equipe está validando. Se houver ajuste, eu aviso.",
          "Acompanhe em Documentos.",
        ]);
      case "rejected":
        return pickVariant(voice.roll, [
          `Há correção solicitada. Reenvie a nova versão do documento.`,
          `Respira: recusa não é “não”, é “quase”. ${recusadosLabels.length > 1 ? `Há ${recusadosLabels.length} tipos` : "Há um tipo"} com ajuste pedido — com uma nova versão, a gente retoma o ritmo.`,
          `Reenvie o documento recusado e siga.`,
        ]);
      case "approved":
        return pickVariant(voice.roll, [
          "Isto libera você mentalmente para as próximas etapas do programa. Se no futuro pedirem algo extra, eu aviso aqui de novo.",
          "Pode celebrar um pouco: a parte pesada de obrigatórios está resolvida. Se aparecer algo novo, eu te puxo de volta.",
          "Agora é manter tranquilidade e seguir o fluxo do programa; qualquer pedido extra, eu sinalizo neste painel.",
        ]);
      default:
        return resumo.statusDetalhe;
    }
  })();

  const decisaoAbertura =
    voice.roll < 0.5 ? "Vou te direcionar para começar por:" : "Minha recomendação agora é focar em:";

  const multiFaltantesNote =
    faltantesLista.length > 1
      ? "Outros documentos também estão pendentes, mas este é o que mais acelera seu progresso agora."
      : null;
  const multiRecusadosNote =
    recusadosLabels.length > 1
      ? "Outros itens também precisam de correção, mas este é o que eu trataria primeiro para destravar o fluxo."
      : null;

  const recommendationTitle = (() => {
    if (scenario === "approved") {
      return pickVariant(voice.roll2, [
        "Manter tudo organizado na área de Documentos",
        "Revisar Documentos de vez em quando, por precaução",
        "Manter os documentos organizados em Documentos",
      ]);
    }
    if (scenario === "rejected" && priorityRecLabel) {
      return `${decisaoAbertura} ${priorityRecLabel}`;
    }
    if (
      (scenario === "incomplete" || scenario === "empty") &&
      priorityFaltante
    ) {
      return `${decisaoAbertura} ${priorityFaltante.label}`;
    }
    if (scenario === "in_review") {
      return pickVariant(voice.roll2, [
        "Acompanhar o estado em Documentos",
        "Abrir Documentos e confirmar se há algum recado da equipe",
        "Ficar de olho em Documentos enquanto a análise corre",
      ]);
    }
    return guidedBase.proximoPassoTitulo;
  })();

  const recommendationReason = (() => {
    if (scenario === "approved") {
      return pickVariant(voice.roll2, [
        "Não há ação urgente; manter os documentos acessíveis ajuda se a equipe precisar rever algo.",
        "Sem pressa: só vale garantir que continua tudo legível e atualizado por lá.",
        "É manutenção leve — se precisarem de um reenvio, você já sabe onde ir.",
      ]);
    }
    if (scenario === "rejected" && priorityRecLabel) {
      const base =
        "Resolver o que foi recusado primeiro destrava o restante fluxo — as outras peças já enviadas continuam válidas enquanto isso.";
      return multiRecusadosNote ? `${base} ${multiRecusadosNote}` : base;
    }
    if (
      (scenario === "incomplete" || scenario === "empty") &&
      priorityFaltante
    ) {
      const base =
        "Completar os documentos pendentes acelera a validação.";
      return multiFaltantesNote ? `${base} ${multiFaltantesNote}` : base;
    }
    if (scenario === "in_review") {
      return pickVariant(voice.roll2, [
        "Enquanto a análise corre, vale confirmar se não há pedido de esclarecimento na página de Documentos.",
        "Às vezes a equipe deixa um recado por lá — vale um check rápido.",
        "Se nada piscar em vermelho, é só aguardar; eu continuo lendo o estado por você.",
      ]);
    }
    return guidedBase.proximoPassoDetalhe;
  })();

  const insightSituacao =
    scenario === "approved"
      ? `Você concluiu ${resumo.meta} de ${resumo.meta} documentos.`
      : `Você enviou ${resumo.uniqueTipos} de ${resumo.meta} documentos.`;

  const insightRisco =
    scenario === "approved"
      ? "Sem pendências nesta etapa."
      : scenario === "rejected"
        ? "Há correção pendente."
        : faltam > 0
          ? "Ainda há itens pendentes."
          : "Aguardando validação da equipe.";

  const insightMelhorPasso =
    priorityRecLabel && scenario === "rejected"
      ? `Reenvie: ${priorityRecLabel}`
      : priorityFaltante && (scenario === "empty" || scenario === "incomplete")
        ? `Envie: ${priorityFaltante.label}`
        : "Acompanhe em Documentos.";

  const aprovadosCount = latestRows.filter((d) => d.status === "aprovado").length;

  const progressEmotionalLine = pickVariant(voice.roll, [
    `Você já completou ${resumo.progressPct}%.`,
    `Progresso: ${resumo.progressPct}%.`,
  ]);

  const microReactionLine = "";

  const priorityHighlightTipo: string | null =
    scenario === "rejected" && priorityRecRow
      ? priorityRecRow.tipo
      : scenario === "incomplete" || scenario === "empty"
        ? (priorityFaltante?.value ?? null)
        : null;

  const journeyActiveIndex = journeyActiveIndexForScenario(scenario);

  const confidenceCaption = "";

  const confidenceHintShort = "";

  const microRewardLine = null;
  const urgencyNudgeLine = null;

  return {
    scenario,
    journeyActiveIndex,
    // Aliases defensivos para evitar crash em páginas que esperam esses campos.
    headline: assistantLead,
    stateLine: assistantMessage,
    guidanceLine: recommendationReason,
    nextDocLabel:
      (scenario === "rejected" ? priorityRecLabel : priorityFaltante?.label) ??
      null,
    confidenceCaption,
    confidenceHintShort,
    progressEmotionalLine,
    microRewardLine,
    urgencyNudgeLine,
    diagnosticoTecnico,
    assistantLead,
    assistantMessage,
    microReactionLine,
    recommendationTitle,
    recommendationReason,
    recommendationFollowUp:
      "Posso te orientar no próximo passo depois disso." as const,
    priorityHighlightTipo,
    executeHref: "/dashboard/docs" as const,
    insightSituacao,
    insightRisco,
    insightMelhorPasso,
    ...guidedBase,
    aprovadosCount,
    totalFicheirosOficiais,
  };
}

const CHECKLIST_HINT_HIDE_TIPOS = new Set([
  "rg_cpf",
  "diploma_certificado",
  "historico_escolar",
  "comprovante_endereco",
]);

function checklistRow(tipo: string, doc: DocumentoResumo | undefined): {
  statusLabel: string;
  hint: string;
  badgeClass: string;
} {
  const hidePendingHint = CHECKLIST_HINT_HIDE_TIPOS.has(tipo);
  if (!doc) {
    return {
      statusLabel: "Pendente",
      hint: hidePendingHint ? "" : "Envie este documento para avançar.",
      badgeClass: documentAdminStatusBadgeClass("pendente"),
    };
  }
  const s = doc.status;
  if (s === "aprovado") {
    return {
      statusLabel: "Aprovado",
      hint: "Nenhuma ação necessária.",
      badgeClass: documentAdminStatusBadgeClass("aprovado"),
    };
  }
  if (s === "rejeitado" || s === "recusado") {
    return {
      statusLabel: "Recusado",
      hint: "Corrija e envie novamente.",
      badgeClass: documentAdminStatusBadgeClass("rejeitado"),
    };
  }
  if (s === "em_analise" || s === "enviado") {
    return {
      statusLabel: "Em análise",
      hint: "Aguardando análise da equipe.",
      badgeClass: documentAdminStatusBadgeClass("em_analise"),
    };
  }
  return {
    statusLabel: "Pendente",
    hint: hidePendingHint ? "" : "Envie este documento para avançar.",
    badgeClass: documentAdminStatusBadgeClass("pendente"),
  };
}

function computeAnalyzingDelayMs(
  totalFicheirosOficiais: number,
  allDocsCount: number,
): number {
  const volume = totalFicheirosOficiais + Math.min(allDocsCount, 15);
  return volume <= 3 ? 400 : 900;
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "relative flex-1 rounded-xl border border-violet-400/35 bg-violet-500/15 px-3 py-2.5 text-sm font-semibold text-violet-100 shadow-[0_0_20px_rgba(139,92,246,0.12)]"
          : "flex-1 rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:border-white/10 hover:bg-white/[0.04] hover:text-slate-200"
      }
    >
      {children}
    </button>
  );
}

export default function DashboardPage() {
  const [tab, setTab] = useState<AssistantTab>("resumo");
  const [aiReady, setAiReady] = useState(false);
  const {
    aluno: profile,
    documentos,
    resumo,
    isLoading,
    loadError,
    docsError,
  } = useDashboardData();

  const documentosSafe = Array.isArray(documentos) ? documentos : [];
  const resumoSafe = (resumo ??
    ({
      pendencias: 0,
      uniqueTipos: 0,
      totalFicheiros: 0,
      progressPct: 0,
      statusGeral: "",
      statusDetalhe: "",
      meta: DOCUMENT_TYPE_OPTIONS.length,
    } as unknown)) as AlunoDocumentosResumo;

  const { latestRows, totalFicheirosOficiais, faltantesLista, latestByTipo } =
    useMemo(() => computeOfficialState(documentosSafe), [documentosSafe]);

  const analyzingMs = useMemo(
    () =>
      computeAnalyzingDelayMs(
        totalFicheirosOficiais,
        documentosSafe.length,
      ),
    [totalFicheirosOficiais, documentosSafe.length],
  );

  useEffect(() => {
    if (isLoading) {
      setAiReady(false);
      return;
    }
    if (loadError) {
      setAiReady(true);
      return;
    }
    setAiReady(false);
    const t = window.setTimeout(() => setAiReady(true), analyzingMs);
    return () => window.clearTimeout(t);
  }, [isLoading, loadError, analyzingMs]);

  const voiceSeed = useMemo(
    () =>
      [
        documentosSafe.length,
        resumoSafe.pendencias,
        resumoSafe.uniqueTipos,
        resumoSafe.totalFicheiros,
        resumoSafe.progressPct,
        resumoSafe.statusGeral,
        totalFicheirosOficiais,
        latestRows.map((r) => `${r.tipo}-${r.status}`).join("|"),
      ].join(":"),
    [
      documentosSafe.length,
      resumoSafe.pendencias,
      resumoSafe.uniqueTipos,
      resumoSafe.totalFicheiros,
      resumoSafe.progressPct,
      resumoSafe.statusGeral,
      totalFicheirosOficiais,
      latestRows,
    ],
  );

  const voice = useMemo(
    () => ({ roll: Math.random(), roll2: Math.random() }),
    [voiceSeed],
  );

  const model = useMemo(
    () =>
      buildAssistantModel(
        resumoSafe,
        latestRows,
        faltantesLista,
        totalFicheirosOficiais,
        voice,
      ),
    [resumoSafe, latestRows, faltantesLista, totalFicheirosOficiais, voice],
  );

  const headlineText = String(model.headline ?? "");
  const headlineParts = headlineText.split(" — ");
  const headlineMain = headlineParts[0] ?? headlineText;
  const headlineAccent =
    headlineParts.length > 1 ? (headlineParts[1] ?? "") : "";

  const heroMessages = useMemo(() => {
    const baseTitle = headlineMain;
    const baseHighlight = headlineAccent || "Vamos concluir sua documentação.";
    const stateLine = String(model.stateLine ?? "");
    const guidanceLine = String(model.guidanceLine ?? "");
    const recTitle = String(model.recommendationTitle ?? "");
    const recReason = String(model.recommendationReason ?? "");
    const nextDoc = model.nextDocLabel ? `Envie: ${model.nextDocLabel}` : "";

    return [
      {
        title: baseTitle,
        highlight: baseHighlight,
        description: stateLine,
        footer: guidanceLine,
      },
      {
        title: recTitle || baseTitle,
        highlight: nextDoc || baseHighlight,
        description: recReason || stateLine,
        footer: guidanceLine,
      },
      {
        title: baseTitle,
        highlight: baseHighlight,
        description: String(model.diagnosticoTecnico ?? stateLine),
        footer: recReason || guidanceLine,
      },
    ];
  }, [
    headlineMain,
    headlineAccent,
    model.stateLine,
    model.guidanceLine,
    model.recommendationTitle,
    model.recommendationReason,
    model.nextDocLabel,
    model.diagnosticoTecnico,
  ]);

  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (heroMessages.length <= 1) {
      return;
    }
    const t = window.setInterval(() => {
      setIsTransitioning(true);
      if (transitionTimeoutRef.current) {
        window.clearTimeout(transitionTimeoutRef.current);
      }
      transitionTimeoutRef.current = window.setTimeout(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % heroMessages.length);
        setIsTransitioning(false);
      }, 250);
    }, 9000);
    return () => {
      window.clearInterval(t);
      if (transitionTimeoutRef.current) {
        window.clearTimeout(transitionTimeoutRef.current);
        transitionTimeoutRef.current = null;
      }
    };
  }, [heroMessages.length]);

  const hero = heroMessages[currentMessageIndex] ?? heroMessages[0]!;
  const heroMotionClass = [
    "transition-all duration-500 ease-out will-change-transform",
    isTransitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0",
  ].join(" ");

  const todosDocumentosAprovados = model.scenario === "approved";

  return (
    <div className="min-h-screen bg-[radial-gradient(900px_480px_at_12%_0%,rgba(139,92,246,0.14),transparent_50%),radial-gradient(700px_420px_at_88%_10%,rgba(59,130,246,0.1),transparent_50%),linear-gradient(to_bottom,#070a12,#03050c)] text-slate-100">
      <DashboardHeader
        variant="dark"
        title="Assistente do Aluno"
        subtitle="Uma leitura inteligente da sua documentação — passo a passo, sem ruído."
        showUserSummary
        accountName={profile?.nome_completo}
        accountEmail={profile?.email}
        isAccountLoading={isLoading}
      />
      <main className="px-4 pb-12 pt-5 sm:px-6 lg:px-8">
        {loadError ? (
          <div className="mx-auto mb-4 w-full max-w-7xl rounded-xl border border-red-500/25 bg-red-950/40 px-4 py-3 text-sm text-red-100">
            {loadError}
          </div>
        ) : null}
        {docsError && !loadError ? (
          <div className="mx-auto mb-4 w-full max-w-7xl rounded-xl border border-amber-500/25 bg-amber-950/30 px-4 py-3 text-sm text-amber-100">
            Documentos: {docsError}
          </div>
        ) : null}

        {isLoading ? (
          <div className="mx-auto w-full max-w-7xl animate-pulse rounded-3xl border border-white/10 bg-slate-950/50 p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
            <div className="flex gap-4">
              <div className="h-14 w-14 shrink-0 rounded-2xl bg-white/10" />
              <div className="flex-1 space-y-3">
                <div className="h-5 w-48 rounded-lg bg-white/10" />
                <div className="h-4 w-full rounded bg-white/[0.07]" />
                <div className="h-4 w-full max-w-lg rounded bg-white/[0.05]" />
              </div>
            </div>
            <div className="mt-8 h-12 rounded-xl bg-white/[0.06]" />
            <div className="mt-6 h-40 rounded-2xl bg-white/[0.05]" />
          </div>
        ) : !loadError && !aiReady ? (
          <div className="mx-auto w-full max-w-7xl rounded-3xl border border-white/10 bg-slate-950/55 px-6 py-12 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
            <p className="text-sm font-medium tracking-wide text-slate-200">
              Analisando…
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Cruzando seus envios com os requisitos desta etapa.
            </p>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-7xl">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
              <div className="min-w-0 space-y-6 lg:col-span-2">
            {/* 1) Hero — Assistente */}
            <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/55 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_28px_100px_rgba(0,0,0,0.55)] backdrop-blur sm:p-8">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_420px_at_10%_0%,rgba(139,92,246,0.22),transparent_55%),radial-gradient(800px_400px_at_90%_10%,rgba(34,211,238,0.12),transparent_55%)]" />
              <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/40 to-transparent" />
              <div className="pointer-events-none absolute -left-20 -bottom-28 h-72 w-72 rounded-full bg-blue-600/10 blur-3xl" />
              <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-violet-600/14 blur-3xl" />

              <div className="relative grid gap-6 lg:grid-cols-[1fr_240px] lg:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-400/35 bg-gradient-to-br from-violet-600/55 via-fuchsia-600/30 to-cyan-500/20 shadow-[0_0_32px_rgba(139,92,246,0.35)]"
                      aria-hidden
                    >
                      <span className="select-none text-sm font-extrabold tracking-wide text-white">
                        AI
                      </span>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ring-1 ${documentAdminStatusBadgeClass(
                        model.scenario === "approved"
                          ? "aprovado"
                          : model.scenario === "rejected"
                            ? "rejeitado"
                            : model.scenario === "in_review"
                              ? "em_analise"
                              : model.scenario === "empty"
                                ? "pendente"
                                : "em_analise",
                      )}`}
                    >
                      <span className={heroMotionClass}>{resumoSafe.statusGeral}</span>
                    </span>
                  </div>

                  <h2 className="mt-5 text-3xl font-semibold leading-[1.05] tracking-tight text-slate-50 sm:text-[40px]">
                    <span className={`block ${heroMotionClass}`}>
                      {hero.title}
                    </span>
                    <span
                      className={`mt-2 block bg-gradient-to-r from-violet-300 via-blue-300 to-cyan-200 bg-clip-text text-transparent ${heroMotionClass}`}
                    >
                      {hero.highlight}
                    </span>
                  </h2>

                  <p className={`mt-4 text-sm leading-relaxed text-slate-300 ${heroMotionClass}`}>
                    {hero.description}
                  </p>

                  <div className="mt-6">
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Progresso</span>
                      <span className="font-semibold text-slate-200">
                        {resumoSafe.progressPct}%
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-white/[0.07] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-400 shadow-[0_0_22px_rgba(34,211,238,0.18)] transition-[width] duration-500"
                        style={{ width: `${resumoSafe.progressPct}%` }}
                      />
                    </div>
                  </div>

                  <p className={`mt-4 text-[11px] leading-relaxed text-slate-400 ${heroMotionClass}`}>
                    {hero.footer}
                  </p>
                </div>

                <div className="relative hidden lg:block">
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/[0.06] to-transparent" />
                  <div className="relative mx-auto h-48 w-48 rounded-[28px] border border-white/10 bg-gradient-to-br from-violet-600/25 via-slate-950/10 to-cyan-500/15 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_30px_90px_rgba(0,0,0,0.55)]">
                    <div className="absolute left-10 top-10 h-24 w-24 rotate-12 rounded-2xl border border-violet-400/25 bg-violet-500/10 shadow-[0_0_28px_rgba(139,92,246,0.16)]" />
                    <div className="absolute bottom-10 right-9 h-10 w-10 rounded-xl border border-cyan-400/25 bg-cyan-500/10 shadow-[0_0_20px_rgba(34,211,238,0.16)]" />
                  </div>
                </div>
              </div>
            </section>

            {/* 3) Próximo passo */}
            <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/55 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_22px_70px_rgba(0,0,0,0.45)]">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(700px_260px_at_0%_0%,rgba(139,92,246,0.22),transparent)]" />
              <p className="relative text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-200/90">
                Próximo passo
              </p>
              <p className="relative mt-2 text-2xl font-semibold tracking-tight text-white">
                {model.nextDocLabel
                  ? `Envie: ${model.nextDocLabel}`
                  : "Acompanhe em Documentos"}
              </p>
              <div className="relative mt-6 grid gap-3 sm:grid-cols-2">
                <Link
                  href={model.executeHref}
                  className="inline-flex h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-blue-600 px-6 text-sm font-semibold text-white shadow-[0_0_34px_rgba(139,92,246,0.26)] transition hover:from-violet-500 hover:via-fuchsia-500 hover:to-blue-500"
                >
                  Enviar documento
                </Link>
                <Link
                  href="/dashboard/docs"
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-6 text-sm font-semibold text-slate-200 transition hover:border-white/15 hover:bg-white/[0.06]"
                >
                  Acessar Documentos
                </Link>
              </div>
            </section>

            {todosDocumentosAprovados ? (
              <section className="relative overflow-hidden rounded-3xl border border-emerald-400/15 bg-slate-950/55 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_22px_70px_rgba(0,0,0,0.45)]">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(700px_260px_at_0%_0%,rgba(16,185,129,0.18),transparent)]" />
                <p className="relative text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-200/90">
                  Documentação em ordem
                </p>
                <p className="relative mt-2 text-sm leading-relaxed text-slate-300">
                  Todos os documentos obrigatórios foram aprovados. Nenhuma ação é necessária no momento.
                </p>
              </section>
            ) : (
              <ProcessJourneyCard
                scenario={model.scenario}
                activeIndex={model.journeyActiveIndex}
              />
            )}

            {/* 2) Abas locais */}
            <section className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="flex gap-1 border-b border-white/10 bg-black/20 p-1.5 sm:p-2">
                <TabButton active={tab === "resumo"} onClick={() => setTab("resumo")}>
                  Resumo
                </TabButton>
                <TabButton
                  active={tab === "pendencias"}
                  onClick={() => setTab("pendencias")}
                >
                  Pendências
                </TabButton>
                <TabButton
                  active={tab === "proximos"}
                  onClick={() => setTab("proximos")}
                >
                  Próximos passos
                </TabButton>
              </div>
              <div className="p-5 sm:p-6">
                {tab === "resumo" ? (
                  <div className="space-y-4 text-sm leading-relaxed text-slate-300">
                    <p>{model.diagnosticoTecnico}</p>
                    <p className="text-slate-400">
                    Se quiser o detalhe do que falta ou do que foi comentado
                      pela equipe, use as abas <strong className="text-slate-200">Pendências</strong> e{" "}
                      <strong className="text-slate-200">Próximos passos</strong>.
                    </p>
                  </div>
                ) : null}
                {tab === "pendencias" ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        {model.pendenciaTitulo}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-300">
                        {model.pendenciaDescricao}
                      </p>
                      {model.pendenciaItens.length > 0 ? (
                        <ul className="mt-4 space-y-2 border-l-2 border-violet-500/40 pl-4">
                          {model.pendenciaItens.map((item) => (
                            <li
                              key={item}
                              className="flex items-center gap-2 text-sm text-slate-200"
                            >
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-3 text-sm text-slate-500">
                          Nada listado aqui — boa notícia.
                        </p>
                      )}
                    </div>
                  </div>
                ) : null}
                {tab === "proximos" ? (
                  <div className="space-y-4">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Orientação
                    </h3>
                    <p className="text-base font-semibold text-slate-50">
                      {model.proximoPassoTitulo}
                    </p>
                    <p className="text-sm leading-relaxed text-slate-400">
                      {model.proximoPassoDetalhe}
                    </p>
                    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-slate-400">
                      Depois de cada envio, a equipe valida com calma. Se algo
                      precisar de ajuste, eu destaco na aba Pendências.
                    </div>
                    <Link
                      href={model.primaryCta.href}
                      className="inline-flex h-10 items-center justify-center rounded-xl border border-violet-400/40 bg-violet-500/15 px-5 text-sm font-semibold text-violet-100 transition hover:bg-violet-500/25"
                    >
                      {model.primaryCta.label}
                    </Link>
                  </div>
                ) : null}
              </div>
            </section>

            <section
              id="entender-pendencias"
              className="scroll-mt-8 rounded-2xl border border-white/10 bg-slate-950/35 px-5 py-5 text-sm text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
            >
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Como funciona
              </h2>
              <div className="mt-3 space-y-4 text-sm">
                <p className="text-slate-200 font-medium leading-relaxed">
                  Este portal foi desenvolvido para centralizar todo o seu processo e
                  oferecer uma visão clara da sua jornada.
                </p>
                <p className="text-slate-400 leading-relaxed">
                  Aqui você consegue acompanhar sua situação atual, entender o que já
                  foi concluído e identificar o que ainda precisa ser feito, tudo de
                  forma organizada e acessível.
                </p>
                <p className="text-slate-400 leading-relaxed">
                  Cada etapa foi pensada para simplificar o acompanhamento e permitir
                  que você avance com segurança até a conclusão.
                </p>
              </div>
            </section>
              </div>

              <div className="min-w-0 space-y-6 lg:sticky lg:top-6 lg:col-span-1 lg:self-start">
            {/* Aviso mais relevante */}
            <AvisosHighlightCard />
            {/* Próximo evento */}
            <ProximoEventoCard />
            {/* Suporte */}
            <SuporteCard />
            {/* 4) Checklist inteligente */}
            <section className="rounded-3xl border border-white/10 bg-slate-950/50 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_22px_70px_rgba(0,0,0,0.45)] sm:p-6">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Documentos obrigatórios
              </h2>
              <ul className="mt-4 space-y-3">
                {DOCUMENT_TYPE_OPTIONS.map((opt) => {
                  const doc = latestByTipo.get(opt.value);
                  const row = checklistRow(opt.value, doc);
                  return (
                    <li
                      key={opt.value}
                      className={
                        model.priorityHighlightTipo === opt.value
                          ? "flex flex-col gap-2 rounded-2xl border border-violet-400/40 bg-gradient-to-br from-violet-950/40 to-slate-950/70 px-4 py-3 shadow-[0_0_0_1px_rgba(139,92,246,0.18),0_0_40px_rgba(139,92,246,0.08)] sm:flex-row sm:items-center sm:justify-between"
                          : "flex flex-col gap-2 rounded-2xl border border-white/[0.06] bg-black/25 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                      }
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-slate-100">{opt.label}</p>
                          {model.priorityHighlightTipo === opt.value ? (
                            <span className="rounded-full border border-violet-400/40 bg-violet-500/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-violet-100 shadow-[0_0_18px_rgba(139,92,246,0.14)]">
                              PRIORIDADE AGORA
                            </span>
                          ) : null}
                        </div>
                        {row.hint ? (
                          <p className="mt-1 text-xs text-slate-500">{row.hint}</p>
                        ) : null}
                      </div>
                      <span
                        className={`inline-flex w-fit shrink-0 rounded-full px-3 py-1 text-xs font-semibold ring-1 shadow-[0_0_18px_rgba(255,255,255,0.04)] ${row.badgeClass}`}
                      >
                        {row.statusLabel}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>

            {/* 5) Status da sua documentação */}
            <section className="rounded-3xl border border-white/10 bg-slate-950/55 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_22px_70px_rgba(0,0,0,0.45)] sm:p-6">
              <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/80">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyan-400/25 bg-cyan-500/10 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.12)]"
                  aria-hidden
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 19V5" />
                    <path d="M8 19V11" />
                    <path d="M12 19V9" />
                    <path d="M16 19V13" />
                    <path d="M20 19V7" />
                  </svg>
                </span>
                Status da sua documentação
              </h2>

              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-emerald-400/15 bg-emerald-500/5 p-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-500/10 text-emerald-200">
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 12a8 8 0 1 1-16 0a8 8 0 0 1 16 0Z" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-200/80">
                        Situação atual
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-100">
                        {model.insightSituacao}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-amber-400/15 bg-amber-500/5 p-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-500/10 text-amber-200">
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 9v4" />
                        <path d="M12 17h.01" />
                        <path d="M10.3 3.6a2 2 0 0 1 3.4 0l8 14A2 2 0 0 1 20 20H4a2 2 0 0 1-1.7-2.4l8-14Z" />
                      </svg>
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-200/80">
                        Risco de atraso
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-100">
                        {model.insightRisco}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-violet-400/15 bg-violet-500/5 p-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-500/10 text-violet-200">
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7z" />
                      </svg>
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-200/80">
                        Próximo passo
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-100">
                        {model.insightMelhorPasso}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
