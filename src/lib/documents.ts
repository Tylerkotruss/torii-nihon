import type { User } from "@supabase/supabase-js";

export const DOCUMENT_MAX_BYTES = 5 * 1024 * 1024;

/** Meta de tipos distintos a cobrir (dashboard: progresso e pendências) */
export const DOCUMENTOS_META_TOTAL = 4;

export type DocumentoResumo = {
  id: string;
  tipo: string;
  status: string;
  created_at: string;
};

/**
 * Estatísticas para dashboard (sem mock).
 * Pendências = tipos distintos ainda em falta face à meta.
 */
export function resumoDocumentosParaDashboard(
  rows: DocumentoResumo[],
  meta: number = DOCUMENTOS_META_TOTAL,
) {
  const tiposOficiais = new Set(DOCUMENT_TYPE_OPTIONS.map((o) => o.value));
  const rowsOficiais = rows.filter((r) => tiposOficiais.has(r.tipo));
  const latestByTipo = new Map<string, DocumentoResumo>();

  for (const row of rowsOficiais) {
    const current = latestByTipo.get(row.tipo);
    if (
      !current ||
      new Date(row.created_at).getTime() > new Date(current.created_at).getTime()
    ) {
      latestByTipo.set(row.tipo, row);
    }
  }

  const latestRows = Array.from(latestByTipo.values());
  const totalFicheiros = rowsOficiais.length;
  const uniqueTipos = latestByTipo.size;
  const tiposCobertos = uniqueTipos;
  const pendencias = Math.max(0, meta - tiposCobertos);
  const progressPct = Math.min(100, Math.round((tiposCobertos / meta) * 100));

  let lastAt: Date | null = null;
  for (const r of rowsOficiais) {
    const t = new Date(r.created_at).getTime();
    if (!Number.isNaN(t) && (!lastAt || t > lastAt.getTime())) {
      lastAt = new Date(r.created_at);
    }
  }

  let statusGeral: string;
  let statusDetalhe: string;

  if (latestRows.length === 0) {
    statusGeral = "Sem documentos";
    statusDetalhe = "Ainda não enviou documentos.";
  } else if (latestRows.some((d) => d.status === "rejeitado")) {
    statusGeral = "Ação necessária";
    statusDetalhe = "Há documento recusado — reenvie ou corrija na área de documentos.";
  } else if (tiposCobertos === meta && latestRows.every((d) => d.status === "aprovado")) {
    statusGeral = "Aprovado";
    statusDetalhe = "Toda a documentação está aprovada.";
  } else if (latestRows.some((d) => d.status === "em_analise")) {
    statusGeral = "Em análise";
    statusDetalhe = "Documentação em revisão pela equipa.";
  } else {
    statusGeral = "Documentação enviada";
    statusDetalhe = "Aguarde a análise (ou conclua os tipos em falta).";
  }

  return {
    totalFicheiros,
    uniqueTipos,
    tiposCobertos,
    meta,
    pendencias,
    progressPct,
    lastAt,
    statusGeral,
    statusDetalhe,
  };
}

export const DOCUMENT_TYPE_OPTIONS: {
  value: string;
  label: string;
  description: string;
}[] = [
  {
    value: "rg_cpf",
    label: "Cópia do RG/CPF",
    description: "Envie uma cópia legível do seu documento de identificação.",
  },
  {
    value: "diploma_certificado",
    label: "Cópia do diploma/certificado da titulação",
    description: "Comprove a titulação informada no cadastro.",
  },
  {
    value: "historico_escolar",
    label: "Histórico escolar",
    description: "Anexe o histórico escolar completo da formação.",
  },
  {
    value: "comprovante_endereco",
    label: "Cópia comprovante de endereço",
    description: "Envie um comprovante recente com o seu endereço.",
  },
];

const ALLOWED_EXT = [".pdf", ".doc", ".docx"] as const;

function extensionLower(name: string): string {
  const i = name.lastIndexOf(".");
  if (i < 0) {
    return "";
  }
  return name.slice(i).toLowerCase();
}

/** Segmento de path: sem / e estável. */
export function slugTipoForPath(tipo: string): string {
  return tipo.trim().replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-|-$/g, "") || "doc";
}

export function sanitizeFileNameForPath(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "arquivo";
  return base.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-|-$/g, "") || "arquivo";
}

export function validateDocumentFile(
  file: File,
  maxBytes: number = DOCUMENT_MAX_BYTES,
): string | null {
  if (file.size > maxBytes) {
    return `Arquivo muito grande. Tamanho máximo: ${Math.floor(maxBytes / (1024 * 1024))}MB.`;
  }
  if (file.size < 1) {
    return "Arquivo vazio ou inválido.";
  }
  const ext = extensionLower(file.name);
  if (!ALLOWED_EXT.includes(ext as (typeof ALLOWED_EXT)[number])) {
    return "Formato inválido. Use PDF, DOC ou DOCX.";
  }
  return null;
}

/**
 * name no Storage = {userId}/{tipoSlug}/{Date.now()}_{arquivo} — 1.º segmento = auth.uid()
 */
export function buildDocumentStorageKey(
  user: User,
  tipoValue: string,
  file: File,
): { storagePath: string; bucket: string } {
  const bucket = "documentos";
  const tipoSeg = slugTipoForPath(tipoValue);
  const safe = sanitizeFileNameForPath(file.name);
  const storagePath = `${user.id}/${tipoSeg}/${Date.now()}_${safe}`;
  return { storagePath, bucket };
}

const STATUS_LABEL: Record<string, string> = {
  enviado: "Enviado",
  em_analise: "Pendente",
  aprovado: "Aprovado",
  rejeitado: "Recusado",
  recusado: "Recusado",
};

export function documentStatusLabel(status: string): string {
  return STATUS_LABEL[status] ?? status;
}

/** Pill de status (tema escuro / admin), alinhada com DocumentoAdminList */
export function documentAdminStatusBadgeClass(status: string): string {
  switch (status) {
    case "aprovado":
      return "bg-emerald-500/10 text-emerald-200 ring-emerald-400/25 shadow-[0_0_18px_rgba(16,185,129,0.18)]";
    case "rejeitado":
    case "recusado":
      return "bg-red-500/10 text-red-200 ring-red-400/25 shadow-[0_0_18px_rgba(239,68,68,0.18)]";
    case "enviado":
    case "em_analise":
      return "bg-amber-500/10 text-amber-200 ring-amber-400/25 shadow-[0_0_18px_rgba(245,158,11,0.18)]";
    default:
      return "bg-slate-500/10 text-slate-200 ring-white/10";
  }
}

export function documentStatusClass(status: string): string {
  switch (status) {
    case "enviado":
      return "bg-zinc-100 text-zinc-800 ring-zinc-200/80";
    case "em_analise":
      return "bg-amber-50 text-amber-900 ring-amber-200/80";
    case "aprovado":
      return "bg-emerald-50 text-emerald-900 ring-emerald-200/80";
    case "rejeitado":
      return "bg-red-50 text-red-900 ring-red-200/80";
    default:
      return "bg-zinc-100 text-zinc-800 ring-zinc-200/80";
  }
}

export function tipoLabel(value: string): string {
  const labels: Record<string, string> = {
    rg: "RG ou CNH",
    comprovante_residencia: "Comprovante de residência",
    diploma: "Diploma / certificado",
    outro: "Outro",
  };
  return (
    DOCUMENT_TYPE_OPTIONS.find((o) => o.value === value)?.label ??
    labels[value] ??
    value
  );
}
