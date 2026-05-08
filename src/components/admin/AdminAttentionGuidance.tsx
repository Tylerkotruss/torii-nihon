import Link from "next/link";

type Props = {
  pendentes: number;
  hasRecentRejected: boolean;
};

const linkPrimary =
  "inline-flex w-full items-center justify-center rounded-xl border border-violet-300/35 bg-gradient-to-r from-violet-500/20 to-blue-500/12 px-4 py-2.5 text-sm font-semibold text-violet-50 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_0_28px_rgba(139,92,246,0.18)] transition hover:border-violet-300/50 hover:from-violet-500/28 hover:to-blue-500/18";

const linkSecondary =
  "inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/[0.025] px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-white/18 hover:bg-white/[0.055] hover:text-slate-100";

function buildOperationalState(pendentes: number, hasRecentRejected: boolean) {
  if (pendentes > 0) {
    return {
      tone: "amber",
      priority:
        pendentes === 1
          ? "1 documento aguardando análise"
          : `${pendentes} documentos aguardando análise`,
      recommendation:
        "Revise os documentos pendentes para manter o fluxo em dia.",
      actionLabel: "Revisar pendentes",
      actionHref: "/admin/documentos",
    };
  }

  if (hasRecentRejected) {
    return {
      tone: "red",
      priority: "Há documentos recusados recentemente",
      recommendation:
        "Revise os motivos de recusa e acompanhe possíveis reenvios.",
      actionLabel: "Revisar recusas",
      actionHref: "/admin/documentos",
    };
  }

  return {
    tone: "green",
    priority: "Tudo em dia",
    recommendation: "Nenhuma ação crítica no momento.",
    actionLabel: "Ver envios recentes",
    actionHref: "/admin#atividade-recente",
  };
}

function toneDotClass(tone: string) {
  switch (tone) {
    case "amber":
      return "bg-amber-300 shadow-[0_0_18px_rgba(251,191,36,0.72)]";
    case "red":
      return "bg-red-300 shadow-[0_0_18px_rgba(248,113,113,0.58)]";
    default:
      return "bg-emerald-300 shadow-[0_0_18px_rgba(52,211,153,0.52)]";
  }
}

export function AdminAttentionGuidance({
  pendentes,
  hasRecentRejected,
}: Props) {
  const state = buildOperationalState(pendentes, hasRecentRejected);

  return (
    <section className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(700px_220px_at_15%_0%,rgba(139,92,246,0.18),transparent_55%),linear-gradient(135deg,rgba(15,23,42,0.92),rgba(2,6,23,0.72))] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_28px_80px_rgba(0,0,0,0.45)] backdrop-blur ring-1 ring-white/[0.06] sm:p-6">
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-violet-300/30 to-transparent" />

      <div className="flex flex-col gap-5 lg:flex-row lg:items-stretch lg:justify-between">
        <div className="min-w-0 lg:max-w-lg">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex h-2.5 w-2.5 rounded-full ${toneDotClass(state.tone)}`}
              aria-hidden="true"
            />
            <h2 className="text-lg font-semibold tracking-tight text-slate-50">
              Assistente operacional
            </h2>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Prioridade do momento
              </p>
              <p className="mt-1.5 text-lg font-semibold leading-snug text-slate-50">
                {state.priority}
              </p>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Recomendação
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
                {state.recommendation}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 lg:w-72">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Ações rápidas
            </p>
            <div className="mt-3">
              <Link href={state.actionHref} prefetch className={linkPrimary}>
                {state.actionLabel}
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-white/10 pt-3">
            <Link href="/admin/alunos" prefetch className={linkSecondary}>
              Ver alunos
            </Link>
            <Link href="/admin/documentos" prefetch className={linkSecondary}>
              Ver documentos
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
