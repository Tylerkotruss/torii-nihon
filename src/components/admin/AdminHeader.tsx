import Image from "next/image";
import type { ReactNode } from "react";

type Stat = {
  label: string;
  value: number;
  tone?: "violet" | "blue" | "amber" | "green" | "red";
};

function toneClasses(tone: Stat["tone"]) {
  switch (tone) {
    case "violet":
      return "border-violet-400/20 from-violet-500/14 to-blue-500/6 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_0_36px_rgba(139,92,246,0.16)]";
    case "blue":
      return "border-blue-400/20 from-blue-500/14 to-violet-500/6 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_0_36px_rgba(59,130,246,0.14)]";
    case "amber":
      return "border-amber-400/20 from-amber-500/10 to-slate-950/10 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_0_36px_rgba(245,158,11,0.12)]";
    case "green":
      return "border-emerald-400/20 from-emerald-500/10 to-slate-950/10 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_0_36px_rgba(16,185,129,0.12)]";
    case "red":
      return "border-red-400/20 from-red-500/10 to-slate-950/10 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_0_36px_rgba(239,68,68,0.12)]";
    default:
      return "border-white/10 from-white/[0.06] to-white/[0.02] shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_24px_80px_rgba(0,0,0,0.55)]";
  }
}

export function AdminHeader({
  title,
  subtitle,
  stats,
  attention,
  actions,
}: {
  title: string;
  subtitle?: string;
  stats: Stat[];
  /** Visão geral: bloco entre título e métricas */
  attention?: ReactNode;
  /** Ação secundária (ex.: atualizar) */
  actions?: ReactNode;
}) {
  const statsGrid = (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {stats.map((s) => (
        <div
          key={s.label}
          className={[
            "rounded-2xl border bg-gradient-to-b px-4 py-3 opacity-95",
            toneClasses(s.tone),
          ].join(" ")}
        >
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300/80">
            {s.label}
          </div>
          <div className="mt-1 text-2xl font-semibold text-slate-50">
            {s.value}
          </div>
        </div>
      ))}
    </div>
  );

  const titleBlock = (
    <div className="flex items-center gap-4">
      <div className="relative h-14 w-14">
        <Image
          src="/torii-logo.png"
          alt="Torii Nihon"
          fill
          sizes="56px"
          className="object-contain drop-shadow-[0_0_26px_rgba(139,92,246,0.20)]"
          priority
        />
      </div>
      <div className="flex min-w-0 items-center gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-0.5 text-sm text-slate-300/90">{subtitle}</p>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </div>
  );

  if (attention) {
    return (
      <section className="rounded-3xl border border-white/10 bg-slate-950/35 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_30px_90px_rgba(0,0,0,0.55)] backdrop-blur">
        <div className="flex flex-col gap-5">
          <div className="flex justify-center text-center sm:text-left">
            {titleBlock}
          </div>
          <div className="flex justify-center">
            <div className="w-full max-w-5xl">{attention}</div>
          </div>
          {statsGrid}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950/35 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_30px_90px_rgba(0,0,0,0.55)] backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {titleBlock}
        {statsGrid}
      </div>
    </section>
  );
}
