import { CalendarioAdminClient } from "@/components/admin/CalendarioAdminClient";
import { AdminHeader } from "@/components/admin/AdminHeader";
import type { AdminCalendarioEventoRow } from "@/lib/adminCalendarioTypes";
import { createServerSupabase } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export default async function AdminCalendarioPage() {
  const supabase = await createServerSupabase();

  const [rowsQ, totalC, pubC, draftC] = await Promise.all([
    supabase
      .from("calendario_eventos")
      .select(
        "id, titulo, descricao, tipo, status, destaque, data_inicio, data_fim, cor, criado_em, atualizado_em",
      )
      .order("data_inicio", { ascending: true })
      .limit(800),
    supabase
      .from("calendario_eventos")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("calendario_eventos")
      .select("*", { count: "exact", head: true })
      .eq("status", "publicado"),
    supabase
      .from("calendario_eventos")
      .select("*", { count: "exact", head: true })
      .eq("status", "rascunho"),
  ]);

  if (rowsQ.error || totalC.error || pubC.error || draftC.error) {
    const e = rowsQ.error || totalC.error || pubC.error || draftC.error;
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
        Erro a carregar calendário: {e!.message}
      </div>
    );
  }

  const rows = (rowsQ.data ?? []) as AdminCalendarioEventoRow[];

  return (
    <div className="space-y-4">
      <AdminHeader
        title="Calendário"
        subtitle="Crie eventos manualmente para os alunos."
        stats={[
          { label: "Total", value: totalC.count ?? 0, tone: "violet" },
          { label: "Publicados", value: pubC.count ?? 0, tone: "green" },
          { label: "Rascunhos", value: draftC.count ?? 0, tone: "amber" },
          { label: "Destaques", value: rows.filter((r) => r.destaque).length, tone: "blue" },
          { label: "Listados", value: rows.length, tone: "violet" },
        ]}
      />
      <CalendarioAdminClient rows={rows} />
    </div>
  );
}

