"use client";

import { useDashboardDataOptional } from "@/contexts/DashboardDataContext";
import { DOCUMENTOS_META_TOTAL } from "@/lib/documents";
import { gerarToriiId } from "@/lib/torii/toriiId";
import type { ToriiIdentity } from "@/lib/torii/types";
import { useMemo } from "react";

function pickFirstNonEmptyString(values: unknown[]): string | null {
  for (const v of values) {
    if (typeof v !== "string") continue;
    const s = v.trim();
    if (s) return s;
  }
  return null;
}

function formatMemberSince(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.trim()) {
    return null;
  }
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    return null;
  }
  return d.toLocaleDateString("pt-BR", { dateStyle: "medium" });
}

export function useToriiIdentity(): ToriiIdentity {
  const data = useDashboardDataOptional();

  const aluno = data?.aluno ?? null;
  const resumo = data?.resumo;
  const uid = data?.userId ?? aluno?.id ?? null;

  return useMemo(() => {
    const enviadosRaw = resumo?.uniqueTipos;
    const enviados =
      typeof enviadosRaw === "number" && Number.isFinite(enviadosRaw)
        ? Math.max(0, enviadosRaw)
        : 0;

    const total = DOCUMENTOS_META_TOTAL;
    const status = String(resumo?.statusGeral ?? "Em andamento");

    const nome = (aluno?.nome_completo ?? null) as string | null;
    const email = (aluno?.email ?? null) as string | null;

    const alunoAny = aluno as unknown as Record<string, unknown> | null;
    const membroDesdeRaw =
      alunoAny?.created_at ?? alunoAny?.createdAt ?? alunoAny?.data_criacao ?? null;
    const membroDesde = formatMemberSince(membroDesdeRaw);

    const area = pickFirstNonEmptyString([
      alunoAny?.curso,
      alunoAny?.area,
      alunoAny?.area_atuacao,
      alunoAny?.nivel_senioridade,
      alunoAny?.nivel_escolaridade,
    ]);

    return {
      toriiId: gerarToriiId(uid),
      nome,
      email,
      role: "aluno",
      plano: "free",
      vinculo: { label: "Vínculo", valor: "Aluno" },
      statusConta: { label: "Status", valor: "Ativo" },
      acesso: { label: "Acesso", valor: "Básico" },
      membroDesde: { label: "Membro desde", valor: membroDesde },
      area: { label: "Área", valor: area },
      docs: {
        enviados,
        total,
        status,
      },
    };
  }, [
    aluno,
    resumo?.statusGeral,
    resumo?.uniqueTipos,
    uid,
  ]);
}

