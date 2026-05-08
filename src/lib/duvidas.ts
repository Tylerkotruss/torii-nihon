export type DuvidaStatus = "aberta" | "respondida" | "fechada";
export type DuvidaPrioridade = "baixa" | "normal" | "alta";

export type FaqRow = {
  id: string;
  pergunta: string;
  resposta: string;
  categoria: string | null;
  ativo: boolean;
  ordem: number;
  criado_em: string;
  atualizado_em: string;
};

export type DuvidaRow = {
  id: string;
  aluno_id: string;
  assunto: string;
  categoria: string | null;
  status: DuvidaStatus | string;
  prioridade: DuvidaPrioridade | string;
  criado_em: string;
  atualizado_em: string;
};

export type DuvidaMensagemRow = {
  id: string;
  duvida_id: string;
  autor_id: string;
  mensagem: string;
  autor_tipo: "aluno" | "admin" | string;
  criado_em: string;
};

export function duvidaStatusLabel(status: string) {
  switch (status) {
    case "aberta":
      return "Aberta";
    case "respondida":
      return "Respondida";
    case "fechada":
      return "Fechada";
    default:
      return status;
  }
}

export function duvidaStatusPillClass(status: string) {
  switch (status) {
    case "aberta":
      return "border-amber-400/25 bg-amber-500/10 text-amber-200 ring-amber-400/20 shadow-[0_0_18px_rgba(245,158,11,0.14)]";
    case "respondida":
      return "border-emerald-400/25 bg-emerald-500/10 text-emerald-200 ring-emerald-400/20 shadow-[0_0_18px_rgba(16,185,129,0.12)]";
    case "fechada":
    default:
      return "border-white/10 bg-white/[0.04] text-slate-300 ring-white/10";
  }
}

export function duvidaPrioridadeLabel(prioridade: string) {
  switch (prioridade) {
    case "baixa":
      return "Baixa";
    case "normal":
      return "Normal";
    case "alta":
      return "Alta";
    default:
      return prioridade;
  }
}

export function duvidaPrioridadePillClass(prioridade: string) {
  switch (prioridade) {
    case "alta":
      return "border-red-400/25 bg-red-500/10 text-red-200 ring-red-400/20 shadow-[0_0_18px_rgba(239,68,68,0.14)]";
    case "baixa":
      return "border-slate-400/15 bg-slate-500/10 text-slate-200 ring-white/10";
    case "normal":
    default:
      return "border-blue-400/25 bg-blue-500/10 text-blue-200 ring-blue-400/20 shadow-[0_0_18px_rgba(59,130,246,0.14)]";
  }
}

