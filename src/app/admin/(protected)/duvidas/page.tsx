import { AdminHeader } from "@/components/admin/AdminHeader";
import { DuvidasAdminClient } from "@/components/admin/DuvidasAdminClient";
import type { AdminDuvidaRow } from "@/lib/adminDuvidasTypes";
import { createServerSupabase } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export default async function AdminDuvidasPage() {
  const supabase = await createServerSupabase();

  const [rowsQ, totalC, abertasC] = await Promise.all([
    supabase
      .from("duvidas")
      .select(
        `
        id, aluno_id, assunto, categoria, status, prioridade, criado_em, atualizado_em,
        alunos ( nome_completo, email )
      `,
      )
      .order("atualizado_em", { ascending: false })
      .limit(500),
    supabase.from("duvidas").select("*", { count: "exact", head: true }),
    supabase
      .from("duvidas")
      .select("*", { count: "exact", head: true })
      .eq("status", "aberta"),
  ]);

  if (rowsQ.error || totalC.error || abertasC.error) {
    const e = rowsQ.error || totalC.error || abertasC.error;
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
        Erro a carregar dúvidas: {e!.message}
      </div>
    );
  }

  type DuvidaRowDb = {
    id: string;
    aluno_id: string;
    assunto: string | null;
    categoria: string | null;
    status: string | null;
    prioridade: string | null;
    criado_em: string | null;
    atualizado_em: string | null;
    alunos:
      | { nome_completo: string | null; email: string | null }
      | { nome_completo: string | null; email: string | null }[]
      | null;
  };

  const rows: AdminDuvidaRow[] = ((rowsQ.data ?? []) as DuvidaRowDb[]).map((r) => {
    const raw = r.alunos;
    const al = Array.isArray(raw) ? raw[0] ?? null : raw;
    return {
      id: String(r.id),
      aluno_id: String(r.aluno_id),
      assunto: String(r.assunto ?? ""),
      categoria: r.categoria ?? null,
      status: String(r.status ?? ""),
      prioridade: String(r.prioridade ?? ""),
      criado_em: String(r.criado_em ?? ""),
      atualizado_em: String(r.atualizado_em ?? ""),
      alunoNome: al?.nome_completo?.trim() || "—",
      alunoEmail: al?.email ?? null,
    };
  });

  return (
    <div className="space-y-4">
      <AdminHeader
        title="Dúvidas"
        subtitle="Central de suporte assíncrona (sem chat)."
        stats={[
          { label: "Total", value: totalC.count ?? 0, tone: "violet" },
          { label: "Abertas", value: abertasC.count ?? 0, tone: "amber" },
          { label: "Listadas", value: rows.length, tone: "violet" },
          { label: "Respondidas", value: rows.filter((r) => r.status === "respondida").length, tone: "green" },
          { label: "Fechadas", value: rows.filter((r) => r.status === "fechada").length, tone: "blue" },
        ]}
      />
      <DuvidasAdminClient rows={rows} />
    </div>
  );
}

