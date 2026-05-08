import type { DuvidaPrioridade, DuvidaStatus } from "@/lib/duvidas";

export type AdminDuvidaRow = {
  id: string;
  aluno_id: string;
  assunto: string;
  categoria: string | null;
  status: DuvidaStatus | string;
  prioridade: DuvidaPrioridade | string;
  criado_em: string;
  atualizado_em: string;
  alunoNome: string;
  alunoEmail: string | null;
};

