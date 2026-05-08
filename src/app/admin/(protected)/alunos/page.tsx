import { AlunosListClient } from "@/components/admin/AlunosListClient";
import { alunoResumoFromDocStatuses } from "@/lib/adminAlunoResumo";
import { createServerSupabase } from "@/lib/supabaseServer";
import type { AlunoListRow } from "@/lib/adminTypes";

export default async function AdminAlunosPage() {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from("alunos")
    .select(
      `
      id,
      nome_completo,
      email,
      created_at,
      telefone_pessoal,
      telefone_contato,
      documentos ( id, status )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
        Erro a carregar alunos: {error.message}
      </div>
    );
  }

  const rows: AlunoListRow[] = (data ?? []).map((r) => {
    const docs = (r.documentos ?? []) as { id: string; status: string }[];
    return {
      id: r.id,
      nome_completo: r.nome_completo,
      email: r.email,
      created_at: r.created_at,
      telefone_pessoal: r.telefone_pessoal,
      telefone_contato: r.telefone_contato,
      docCount: docs.length,
      resumo: alunoResumoFromDocStatuses(docs),
    };
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
          Alunos
        </h1>
        <p className="mt-1 text-sm text-slate-300/90">
          Gerencie usuários cadastrados
        </p>
      </div>
      <AlunosListClient rows={rows} />
    </div>
  );
}
