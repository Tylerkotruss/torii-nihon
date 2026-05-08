import { DocumentoAdminList } from "@/components/admin/DocumentoAdminList";
import type { DocumentoAdminRow } from "@/lib/adminTypes";
import { createServerSupabase } from "@/lib/supabaseServer";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminRefreshButton } from "@/components/admin/AdminRefreshButton";

export default async function AdminDocumentosPage() {
  const supabase = await createServerSupabase();

  const [docsQ, totalC, pendentesC, aprovadosC, recusadosC] = await Promise.all([
    supabase
      .from("documentos")
      .select(
        `
        id,
        tipo,
        nome_arquivo_original,
        storage_bucket,
        storage_path,
        status,
        motivo_rejeicao,
        created_at,
        alunos ( nome_completo, email )
      `,
      )
      .order("created_at", { ascending: false })
      .limit(300),
    supabase.from("documentos").select("*", { count: "exact", head: true }),
    supabase
      .from("documentos")
      .select("*", { count: "exact", head: true })
      .eq("status", "enviado"),
    supabase
      .from("documentos")
      .select("*", { count: "exact", head: true })
      .eq("status", "aprovado"),
    supabase
      .from("documentos")
      .select("*", { count: "exact", head: true })
      .in("status", ["rejeitado", "recusado"]),
  ]);

  const { data, error } = docsQ;

  const errStats =
    totalC.error || pendentesC.error || aprovadosC.error || recusadosC.error;

  if (error || errStats) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
        Erro a carregar documentos: {(error ?? errStats)!.message}
      </div>
    );
  }

  const rows: DocumentoAdminRow[] = (data ?? []).map((r) => {
    const raw = r.alunos;
    const al = (Array.isArray(raw) ? raw[0] : raw) as
      | { nome_completo: string | null; email: string | null }
      | null
      | undefined;
    return {
      id: r.id,
      tipo: r.tipo,
      nome_arquivo_original: r.nome_arquivo_original,
      storage_bucket: r.storage_bucket,
      storage_path: r.storage_path,
      status: r.status,
      motivo_rejeicao: r.motivo_rejeicao,
      created_at: r.created_at,
      alunoNome: al?.nome_completo?.trim() || "—",
      alunoEmail: al?.email ?? null,
    };
  });

  return (
    <div className="space-y-4">
      <AdminHeader
        title="Painel de Documentos"
        subtitle="Gerencie envios e decisões."
        actions={<AdminRefreshButton />}
        stats={[
          { label: "Total", value: totalC.count ?? 0, tone: "violet" },
          { label: "Pendentes", value: pendentesC.count ?? 0, tone: "amber" },
          { label: "Aprovados", value: aprovadosC.count ?? 0, tone: "green" },
          { label: "Recusados", value: recusadosC.count ?? 0, tone: "red" },
        ]}
      />
      <DocumentoAdminList rows={rows} />
    </div>
  );
}
