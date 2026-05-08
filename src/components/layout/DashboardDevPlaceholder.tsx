import { DashboardHeader } from "@/components/layout/DashboardHeader";
import Link from "next/link";

type Props = {
  sectionTitle: string;
};

/**
 * Página mínima para secções ainda sem funcionalidade: sem dados de exemplo nem mock.
 */
export function DashboardDevPlaceholder({ sectionTitle }: Props) {
  return (
    <div className="min-h-screen">
      <DashboardHeader title={sectionTitle} />
      <main className="px-6 pt-4 pb-6">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-700">
            Esta área está em desenvolvimento.
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            Ainda não há funcionalidade ligada a esta secção. Volte ao painel
            principal quando quiser.
          </p>
          <div className="mt-5">
            <Link
              href="/dashboard"
              className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-violet-800 hover:bg-zinc-50"
            >
              Voltar ao Assistente
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
