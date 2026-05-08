import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { createServerSupabase } from "@/lib/supabaseServer";
import { duvidaPrioridadeLabel, duvidaPrioridadePillClass, duvidaStatusLabel, duvidaStatusPillClass } from "@/lib/duvidas";
import { AdminDuvidaDetailClient } from "@/components/admin/AdminDuvidaDetailClient";

export const dynamic = "force-dynamic";

function fmtDateTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export default async function AdminDuvidaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabase();

  const [dQ, msgsQ] = await Promise.all([
    supabase
      .from("duvidas")
      .select(
        `
        id, aluno_id, assunto, categoria, status, prioridade, criado_em, atualizado_em,
        alunos ( nome_completo, email )
      `,
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("duvida_mensagens")
      .select("id, duvida_id, autor_id, autor_tipo, mensagem, criado_em")
      .eq("duvida_id", id)
      .order("criado_em", { ascending: true })
      .limit(2000),
  ]);

  if (dQ.error || msgsQ.error) {
    const e = dQ.error || msgsQ.error;
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
        Erro a carregar conversa: {e!.message}
      </div>
    );
  }

  type DuvidaWithAluno = {
    id: string;
    aluno_id: string;
    assunto: string;
    categoria: string | null;
    status: string;
    prioridade: string;
    criado_em: string;
    atualizado_em: string;
    alunos:
      | { nome_completo: string | null; email: string | null }
      | { nome_completo: string | null; email: string | null }[]
      | null;
  };

  const duvida = (dQ.data ?? null) as DuvidaWithAluno | null;
  if (!duvida) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/duvidas"
          className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm font-semibold text-slate-200 hover:bg-white/[0.06]"
        >
          Voltar
        </Link>
        <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-5 text-sm text-slate-300">
          Dúvida não encontrada.
        </div>
      </div>
    );
  }

  const raw = duvida.alunos;
  const al = (Array.isArray(raw) ? raw[0] : raw) as
    | { nome_completo: string | null; email: string | null }
    | null
    | undefined;
  const alunoNome = al?.nome_completo?.trim() || "—";
  const alunoEmail = al?.email ?? null;

  const msgs = (msgsQ.data ?? []) as {
    id: string;
    autor_tipo: string;
    mensagem: string;
    criado_em: string;
  }[];

  return (
    <div className="space-y-4">
      <AdminHeader
        title="Conversa"
        subtitle={`${alunoNome}${alunoEmail ? ` · ${alunoEmail}` : ""}`}
        stats={[
          { label: "Status", value: 0, tone: "violet" },
          { label: "Mensagens", value: msgs.length, tone: "blue" },
          { label: "—", value: 0, tone: "amber" },
          { label: "—", value: 0, tone: "green" },
          { label: "—", value: 0, tone: "red" },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/duvidas"
          className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm font-semibold text-slate-200 hover:bg-white/[0.06]"
        >
          Voltar
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ring-1 ${duvidaStatusPillClass(
              String(duvida.status),
            )}`}
          >
            {duvidaStatusLabel(String(duvida.status))}
          </span>
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ring-1 ${duvidaPrioridadePillClass(
              String(duvida.prioridade),
            )}`}
          >
            {duvidaPrioridadeLabel(String(duvida.prioridade))}
          </span>
          <span className="text-xs text-slate-400">
            Atualizada em {fmtDateTime(String(duvida.atualizado_em))}
          </span>
        </div>
      </div>

      <AdminDuvidaDetailClient duvidaId={String(duvida.id)} initialMessages={msgs} initialStatus={String(duvida.status)} />
    </div>
  );
}

