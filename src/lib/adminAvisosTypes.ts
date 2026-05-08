import type { AvisoPublico, AvisoStatus, AvisoTipo } from "@/lib/avisos";

export type AdminAvisoRow = {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: AvisoTipo | string;
  status: AvisoStatus | string;
  fixado: boolean;
  publico: AvisoPublico | string;
  publicado_em: string | null;
  expira_em: string | null;
  criado_em: string;
  atualizado_em: string;
};

