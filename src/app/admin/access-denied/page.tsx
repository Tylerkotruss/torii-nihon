import { createServerSupabase } from "@/lib/supabaseServer";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Só para utilizadores autenticados que não têm linha em admin_profiles.
 * Sem sessão → middleware não chega cá com normalidade; ainda assim forçamos login.
 */
export default async function AdminAccessDeniedPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin");
  }

  const { data: adminRow, error: adminErr } = await supabase
    .from("admin_profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (adminRow) {
    redirect("/admin");
  }

  const isDev = process.env.NODE_ENV !== "production";
  const email = user.email ?? "—";
  const uid = user.id;
  const uidShort = `${uid.slice(0, 8)}…${uid.slice(-4)}`;

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <div className="rounded-2xl border border-amber-200 bg-white p-8 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">Acesso negado</h1>
        <p className="mt-2 text-sm text-slate-600">
          A sua conta não tem permissão de administrador. Se precisar de
          acesso, contacte a equipa ou entre com outra conta.
        </p>

        {isDev ? (
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Diagnóstico (somente dev)
            </div>
            <dl className="mt-3 grid gap-2 text-sm text-slate-700">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">E-mail</dt>
                <dd className="truncate font-medium text-slate-800">{email}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">user.id</dt>
                <dd className="font-mono font-semibold text-slate-800">
                  {uidShort}
                </dd>
              </div>
              {adminErr ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  <div className="font-semibold">Erro ao consultar admin_profiles</div>
                  <div className="mt-1 font-mono">{adminErr.message}</div>
                  <div className="mt-2 text-amber-950/80">
                    Dica: se isto for “permission denied”, é RLS/política no
                    Supabase bloqueando SELECT com a anon key.
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
                  <div className="font-semibold">Sem admin_profiles visível para esta sessão</div>
                  <div className="mt-1 text-slate-600">
                    Se você já inseriu este UUID e ainda assim cai aqui, quase
                    sempre é <strong>RLS/policy</strong>: a linha existe, mas o
                    SELECT não tem permissão e volta vazio (sem erro).
                  </div>
                </div>
              )}
            </dl>
            <div className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Dica rápida
              </div>
              <p className="mt-2 text-xs text-slate-600">
                Para liberar este usuário, adicione o UUID abaixo em{" "}
                <span className="font-mono">public.admin_profiles</span>:
              </p>
              <div className="mt-2 select-all rounded-md bg-slate-950 px-3 py-2 font-mono text-xs text-slate-100">
                {uid}
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
          >
            Ir para a área do aluno
          </Link>
          <Link
            href="/login?next=/admin"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Entrar com outra conta
          </Link>
        </div>
      </div>
    </div>
  );
}
