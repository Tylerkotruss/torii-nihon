"use client";

import { getSupabaseClient } from "@/lib/supabaseClient";
import { getSafeNextPath } from "@/lib/safeNextPath";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);

  // Lê ?next=/admin a partir do URL (sem useSearchParams para não exigir Suspense).
  // O form de submit já lê o `next` de window.location.search; aqui é só sinalização visual.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setIsAdminMode(params.get("next") === "/admin");
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const { error } = await getSupabaseClient().auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      const next = getSafeNextPath(
        new URLSearchParams(window.location.search).get("next"),
      );
      // Garante que a sessão nova é visto pelo App Router (útil p.ex. pós-login para /admin)
      await router.replace(next);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center px-4 py-16 sm:py-24"
      style={{
        background:
          "radial-gradient(1200px 520px at 50% 40%, rgba(124,58,237,0.14), rgba(0,0,0,0) 55%), radial-gradient(900px 420px at 55% 60%, rgba(255,255,255,0.06), rgba(0,0,0,0) 60%), radial-gradient(900px 560px at 20% 30%, rgba(124,58,237,0.08), rgba(0,0,0,0) 65%), #09090b",
      }}
    >
      <div className="w-full max-w-md">
        <div
          className="rounded-[28px] border border-zinc-800/80 bg-zinc-950/75 p-7 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_40px_120px_rgba(0,0,0,0.72)] backdrop-blur-md sm:p-8"
          style={{
            boxShadow:
              "0 0 0 1px rgba(255,255,255,0.06), 0 40px 120px rgba(0,0,0,0.72), 0 0 0 1px rgba(124,58,237,0.10) inset, 0 0 140px rgba(124,58,237,0.14)",
          }}
        >
          <div className="space-y-2 text-center">
            <div className="text-xs font-semibold tracking-[0.28em] text-violet-200/90">
              PORTAL DO ALUNO
            </div>
            <h1 className="text-2xl font-semibold tracking-[0.18em] text-zinc-100">
              {isAdminMode ? "ACESSO ADMINISTRATIVO" : "ACESSO AO PORTAL"}
            </h1>
            <p className="text-sm text-zinc-400">
              {isAdminMode
                ? "Entre com sua conta de administrador para abrir o painel."
                : "Acesse sua conta para continuar no Portal do Aluno."}
            </p>
            {isAdminMode ? (
              <div className="!mt-3 flex justify-center">
                <span className="inline-flex items-center gap-2 rounded-full border border-violet-400/40 bg-violet-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-100">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-300" aria-hidden="true" />
                  Modo administrativo
                </span>
              </div>
            ) : null}
          </div>

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <label className="block space-y-1">
              <span className="text-sm font-medium text-zinc-300">E-mail</span>
              <input
                className="h-11 w-full rounded-xl border border-zinc-700/60 bg-zinc-900/80 px-3 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition-colors focus:border-violet-400/80 focus:ring-2 focus:ring-violet-500/25"
                type="email"
                placeholder="seu@email.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <label className="block space-y-1">
              <span className="text-sm font-medium text-zinc-300">Senha</span>
              <input
                className="h-11 w-full rounded-xl border border-zinc-700/60 bg-zinc-900/80 px-3 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition-colors focus:border-violet-400/80 focus:ring-2 focus:ring-violet-500/25"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>

            {errorMessage ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {errorMessage}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-b from-violet-500/95 to-violet-700 px-4 text-sm font-medium text-white shadow-[0_14px_40px_rgba(124,58,237,0.28)] ring-1 ring-violet-400/20 transition-all hover:from-violet-400 hover:to-violet-700 hover:shadow-[0_16px_44px_rgba(124,58,237,0.34)] hover:ring-violet-300/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </button>

            <p className="pt-1 text-center text-xs text-zinc-500">
              Use o mesmo e-mail e senha do seu cadastro.
            </p>
          </form>

          <div className="mt-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-zinc-800/80" aria-hidden="true" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
              ou
            </span>
            <span className="h-px flex-1 bg-zinc-800/80" aria-hidden="true" />
          </div>

          <div className="mt-5 rounded-2xl border border-violet-400/20 bg-violet-500/[0.06] px-4 py-4 text-center">
            <p className="text-sm text-zinc-300">
              Ainda não possui conta?
            </p>
            <Link
              href="/cadastro"
              className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-xl border border-violet-400/40 bg-zinc-950/40 px-4 text-sm font-semibold text-violet-100 shadow-[0_0_28px_rgba(124,58,237,0.18)] transition-colors hover:bg-violet-500/10 hover:text-white"
            >
              Criar cadastro
            </Link>
          </div>

          <div className="mt-4 text-center">
            {isAdminMode ? (
              <Link
                href="/login"
                className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 underline-offset-4 transition-colors hover:text-zinc-200 hover:underline"
              >
                <span aria-hidden="true">←</span> Voltar ao acesso comum
              </Link>
            ) : (
              <Link
                href="/login?next=/admin"
                className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 underline-offset-4 transition-colors hover:text-violet-200 hover:underline"
              >
                Acesso administrativo <span aria-hidden="true">→</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

