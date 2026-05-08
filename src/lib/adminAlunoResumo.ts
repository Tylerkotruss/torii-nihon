/**
 * Resumo de documentação no painel (lista de { status } de um aluno).
 */
export function alunoResumoFromDocStatuses(
  docs: { status: string }[] | null | undefined,
): string {
  if (!docs?.length) {
    return "Sem documentos";
  }
  if (docs.some((d) => d.status === "rejeitado")) {
    return "Com recusas";
  }
  if (
    docs.some((d) => d.status === "enviado" || d.status === "em_analise")
  ) {
    return "Pendente / em análise";
  }
  if (docs.every((d) => d.status === "aprovado")) {
    return "Tudo aprovado";
  }
  return "—";
}
