"use client";

import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { ToriiCard } from "@/components/torii/ToriiCard";

export default function CarteiraToriiPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(900px_480px_at_12%_0%,rgba(139,92,246,0.14),transparent_50%),radial-gradient(700px_420px_at_88%_10%,rgba(59,130,246,0.1),transparent_50%),linear-gradient(to_bottom,#070a12,#03050c)] text-slate-100">
      <DashboardHeader
        variant="dark"
        title="Carteira Torii"
        subtitle="Sua identidade digital dentro do ecossistema Torii Nihon."
      />

      <main className="px-4 pb-12 pt-5 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-3xl space-y-6">
          <ToriiCard mode="full" />
        </div>
      </main>
    </div>
  );
}

