export type AvisoTipo = "informacao" | "importante" | "urgente";
export type AvisoStatus = "rascunho" | "publicado";
export type AvisoPublico = "todos" | "especificos";

export type AvisoRow = {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: AvisoTipo | string;
  status: AvisoStatus | string;
  fixado: boolean;
  publico: AvisoPublico | string;
  publicado_em: string | null;
  expira_em: string | null;
  criado_por: string | null;
  criado_em: string;
  atualizado_em: string;
};

export function avisoTipoLabel(tipo: string) {
  switch (tipo) {
    case "informacao":
      return "Informação";
    case "importante":
      return "Importante";
    case "urgente":
      return "Urgente";
    default:
      return tipo;
  }
}

export function avisoTipoPillClass(tipo: string) {
  switch (tipo) {
    case "urgente":
      return "border-red-400/25 bg-red-500/10 text-red-200 ring-red-400/20 shadow-[0_0_18px_rgba(239,68,68,0.14)]";
    case "importante":
      return "border-amber-400/25 bg-amber-500/10 text-amber-200 ring-amber-400/20 shadow-[0_0_18px_rgba(245,158,11,0.14)]";
    case "informacao":
    default:
      return "border-cyan-400/20 bg-cyan-500/10 text-cyan-200 ring-cyan-400/20 shadow-[0_0_18px_rgba(34,211,238,0.12)]";
  }
}

export function avisoStatusLabel(status: string) {
  switch (status) {
    case "rascunho":
      return "Rascunho";
    case "publicado":
      return "Publicado";
    default:
      return status;
  }
}

export function avisoStatusPillClass(status: string) {
  switch (status) {
    case "publicado":
      return "border-emerald-400/25 bg-emerald-500/10 text-emerald-200 ring-emerald-400/20";
    case "rascunho":
    default:
      return "border-white/10 bg-white/[0.04] text-slate-300 ring-white/10";
  }
}

