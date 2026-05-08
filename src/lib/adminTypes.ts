export type AlunoListRow = {
  id: string;
  nome_completo: string | null;
  email: string;
  created_at: string;
  telefone_pessoal: string | null;
  telefone_contato: string | null;
  docCount: number;
  resumo: string;
};

export type DocumentoAdminRow = {
  id: string;
  tipo: string;
  nome_arquivo_original: string;
  storage_bucket: string | null;
  storage_path: string | null;
  status: string;
  motivo_rejeicao: string | null;
  created_at: string;
  alunoNome: string;
  alunoEmail: string | null;
};
