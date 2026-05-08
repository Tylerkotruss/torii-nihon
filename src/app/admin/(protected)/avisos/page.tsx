import { AvisosAdminClient } from "@/components/admin/AvisosAdminClient";
import { AdminHeader } from "@/components/admin/AdminHeader";
import type { AdminAvisoRow } from "@/lib/adminAvisosTypes";
import { createServerSupabase } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export default async function AdminAvisosPage() {
  const supabase = await createServerSupabase();

  const [rowsQ, totalC, pubC, draftC] = await Promise.all([
    supabase
      .from("avisos")
      .select(
        "id, titulo, mensagem, tipo, status, fixado, publico, publicado_em, expira_em, criado_em, atualizado_em",
      )
      .order("criado_em", { ascending: false })
      .limit(400),
    supabase.from("avisos").select("*", { count: "exact", head: true }),
    supabase
      .from("avisos")
      .select("*", { count: "exact", head: true })
      .eq("status", "publicado"),
    supabase
      .from("avisos")
      .select("*", { count: "exact", head: true })
      .eq("status", "rascunho"),
  ]);

  if (rowsQ.error || totalC.error || pubC.error || draftC.error) {
    const e = rowsQ.error || totalC.error || pubC.error || draftC.error;
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
        Erro a carregar avisos: {e!.message}
      </div>
    );
  }

  const rows = (rowsQ.data ?? []) as AdminAvisoRow[];

  return (
    <div className="space-y-4">
      <AdminHeader
        title="Avisos"
        subtitle="Crie avisos para todos os alunos ou destinatários específicos."
        stats={[
          { label: "Total", value: totalC.count ?? 0, tone: "violet" },
          { label: "Publicados", value: pubC.count ?? 0, tone: "green" },
          { label: "Rascunhos", value: draftC.count ?? 0, tone: "amber" },
          { label: "Fixados", value: rows.filter((r) => r.fixado).length, tone: "blue" },
          { label: "Listados", value: rows.length, tone: "violet" },
        ]}
      />
      <AvisosAdminClient rows={rows} />
    </div>
  );
}

