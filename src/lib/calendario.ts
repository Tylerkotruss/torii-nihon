export type CalendarioEventoTipo =
  | "evento"
  | "prazo"
  | "reuniao"
  | "aula"
  | "feriado"
  | "aviso";

export type CalendarioEventoStatus = "rascunho" | "publicado";

export type CalendarioEventoRow = {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: CalendarioEventoTipo | string;
  status: CalendarioEventoStatus | string;
  destaque: boolean;
  data_inicio: string;
  data_fim: string | null;
  cor: string | null;
  criado_por: string | null;
  criado_em: string;
  atualizado_em: string;
};

export function calendarioTipoLabel(tipo: string) {
  switch (tipo) {
    case "evento":
      return "Evento";
    case "prazo":
      return "Prazo";
    case "reuniao":
      return "Reunião";
    case "aula":
      return "Aula";
    case "feriado":
      return "Feriado";
    case "aviso":
      return "Aviso";
    default:
      return tipo;
  }
}

export function calendarioTipoPillClass(tipo: string) {
  switch (tipo) {
    case "prazo":
      return "border-amber-400/25 bg-amber-500/10 text-amber-200 ring-amber-400/20 shadow-[0_0_18px_rgba(245,158,11,0.14)]";
    case "reuniao":
      return "border-blue-400/25 bg-blue-500/10 text-blue-200 ring-blue-400/20 shadow-[0_0_18px_rgba(59,130,246,0.14)]";
    case "aula":
      return "border-cyan-400/25 bg-cyan-500/10 text-cyan-200 ring-cyan-400/20 shadow-[0_0_18px_rgba(34,211,238,0.12)]";
    case "feriado":
      return "border-emerald-400/25 bg-emerald-500/10 text-emerald-200 ring-emerald-400/20 shadow-[0_0_18px_rgba(16,185,129,0.12)]";
    case "aviso":
      return "border-red-400/25 bg-red-500/10 text-red-200 ring-red-400/20 shadow-[0_0_18px_rgba(239,68,68,0.14)]";
    case "evento":
    default:
      return "border-violet-400/25 bg-violet-500/10 text-violet-200 ring-violet-400/20 shadow-[0_0_18px_rgba(139,92,246,0.14)]";
  }
}

export function calendarioStatusLabel(status: string) {
  switch (status) {
    case "rascunho":
      return "Rascunho";
    case "publicado":
      return "Publicado";
    default:
      return status;
  }
}

export function calendarioStatusPillClass(status: string) {
  switch (status) {
    case "publicado":
      return "border-emerald-400/25 bg-emerald-500/10 text-emerald-200 ring-emerald-400/20";
    case "rascunho":
    default:
      return "border-white/10 bg-white/[0.04] text-slate-300 ring-white/10";
  }
}

