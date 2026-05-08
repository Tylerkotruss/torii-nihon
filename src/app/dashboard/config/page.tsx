import { DashboardHeader } from "@/components/layout/DashboardHeader";

export default function ConfigPage() {
  return (
    <div className="min-h-screen">
      <DashboardHeader title="Configurações" />
      <main className="px-6 pt-4 pb-6">
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <div className="text-sm text-zinc-700">
            Área de configurações (placeholder).
          </div>
        </div>
      </main>
    </div>
  );
}

