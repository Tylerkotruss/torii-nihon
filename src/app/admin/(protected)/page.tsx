import { AdminAttentionGuidance } from "@/components/admin/AdminAttentionGuidance";
import { AdminHeader } from "@/components/admin/AdminHeader";
import {
  documentAdminStatusBadgeClass,
  documentStatusLabel,
  tipoLabel,
} from "@/lib/documents";
import { createServerSupabase } from "@/lib/supabaseServer";

const RECENT_LIMIT = 5;

export default async function AdminHomePage() {
  const supabase = await createServerSupabase();

  const [
    alunosC,
    totalC,
    pendentesC,
    aprovadosC,
    recusadosC,
    recentesE,
  ] = await Promise.all([
    supabase.from("alunos").select("*", { count: "exact", head: true }),
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
    supabase
      .from("documentos")
      .select(
        `
        id, tipo, status, created_at,
        alunos ( nome_completo, email )
      `,
      )
      .order("created_at", { ascending: false })
      .limit(RECENT_LIMIT),
  ]);

  const errStats =
    alunosC.error ||
    totalC.error ||
    pendentesC.error ||
    aprovadosC.error ||
    recusadosC.error;
  const errRecentes = recentesE.error;

  if (errStats) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
        Erro a carregar resumo: {errStats.message}
        {errStats.message?.includes("relation")
          ? " — Verifique se executou os ficheiros SQL em supabase/ (admin + RLS)."
          : null}
      </div>
    );
  }

  const alunosN = alunosC.count ?? 0;
  const totalDocs = totalC.count ?? 0;
  const pendentesN = pendentesC.count ?? 0;
  const aprovadosN = aprovadosC.count ?? 0;
  const recusadosN = recusadosC.count ?? 0;
  const recentes = recentesE.data ?? [];

  const hasRecentRejected =
    !errRecentes &&
    recentes.some(
      (r) => r.status === "rejeitado" || r.status === "recusado",
    );

  return (
    <div className="space-y-5">
      <AdminHeader
        title="Visão geral"
        subtitle="Números e fila num relance."
        attention={
          <AdminAttentionGuidance
            pendentes={pendentesN}
            hasRecentRejected={hasRecentRejected}
          />
        }
        stats={[
          { label: "Documentos", value: totalDocs, tone: "violet" },
          { label: "Pendentes", value: pendentesN, tone: "amber" },
          { label: "Aprovados", value: aprovadosN, tone: "green" },
          { label: "Recusados", value: recusadosN, tone: "red" },
          { label: "Alunos", value: alunosN, tone: "blue" },
        ]}
      />

      <section
        id="atividade-recente"
        className="rounded-2xl border border-white/10 bg-slate-950/35 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur scroll-mt-6"
      >
        <div className="border-b border-white/10 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-50">
            Envios recentes
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Últimos {RECENT_LIMIT} · aluno, tipo, estado e data
          </p>
        </div>
        {errRecentes ? (
          <p className="p-5 text-sm text-red-200/90">
            Erro: {errRecentes.message}
          </p>
        ) : !recentes.length ? (
          <p className="p-5 text-sm text-slate-400">Ainda sem envios.</p>
        ) : (
          <>
            <div className="md:hidden divide-y divide-white/5">
              {recentes.map((row) => {
                const raw = row.alunos;
                const al = (Array.isArray(raw) ? raw[0] : raw) as
                  | { nome_completo: string | null; email: string | null }
                  | null
                  | undefined;
                const alunoNome = al?.nome_completo?.trim() || "—";
                const alunoEmail = al?.email ?? null;
                return (
                  <div
                    key={row.id}
                    className="flex flex-col gap-2 px-4 py-3.5 text-sm"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-50 truncate">
                        {alunoNome}
                      </div>
                      <div className="text-xs text-slate-400 truncate">
                        {alunoEmail ?? "—"}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-medium text-slate-100">
                        {tipoLabel(row.tipo)}
                      </span>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${documentAdminStatusBadgeClass(row.status)}`}
                      >
                        {documentStatusLabel(row.status)}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">
                      {new Date(row.created_at).toLocaleString("pt-PT", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full table-auto text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-xs text-slate-400">
                    <th className="px-4 py-3 font-semibold">Aluno</th>
                    <th className="px-4 py-3 font-semibold">Tipo</th>
                    <th className="px-4 py-3 font-semibold">Data</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recentes.map((row) => {
                    const raw = row.alunos;
                    const al = (Array.isArray(raw) ? raw[0] : raw) as
                      | { nome_completo: string | null; email: string | null }
                      | null
                      | undefined;
                    const alunoNome = al?.nome_completo?.trim() || "—";
                    const alunoEmail = al?.email ?? null;
                    return (
                      <tr
                        key={row.id}
                        className="text-slate-200/90 hover:bg-white/[0.03]"
                      >
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-50 truncate">
                            {alunoNome}
                          </div>
                          <div className="mt-0.5 text-xs text-slate-400 truncate">
                            {alunoEmail ?? "—"}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-100">
                          {tipoLabel(row.tipo)}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                          {new Date(row.created_at).toLocaleString("pt-PT", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${documentAdminStatusBadgeClass(row.status)}`}
                          >
                            {documentStatusLabel(row.status)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
