"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function AdminRefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => router.refresh())}
      className={[
        "inline-flex h-9 items-center justify-center rounded-xl border px-3 text-xs font-semibold",
        "border-white/10 bg-white/[0.03] text-slate-200",
        "hover:border-white/15 hover:bg-white/[0.05]",
        "disabled:cursor-not-allowed disabled:opacity-60",
      ].join(" ")}
    >
      {isPending ? "Atualizando..." : "Atualizar"}
    </button>
  );
}

