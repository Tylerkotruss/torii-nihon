import type { CalendarioEventoStatus, CalendarioEventoTipo } from "@/lib/calendario";

export type AdminCalendarioEventoRow = {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: CalendarioEventoTipo | string;
  status: CalendarioEventoStatus | string;
  destaque: boolean;
  data_inicio: string;
  data_fim: string | null;
  cor: string | null;
  criado_em: string;
  atualizado_em: string;
};

