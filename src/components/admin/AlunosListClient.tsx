"use client";

import type { AlunoListRow } from "@/lib/adminTypes";
import { useMemo, useState } from "react";

type Props = { rows: AlunoListRow[] };

type EstadoFiltro = "todos" | "tudo_aprovado" | "com_recusas" | "sem_documentos";
type DocsFiltro = "todos" | "zero" | "um_mais" | "dois_mais";

function telefoneExibir(r: AlunoListRow) {
  return r.telefone_pessoal?.trim() || r.telefone_contato?.trim() || "—";
}

function estadoPillClass(resumo: string) {
  switch (resumo) {
    case "Tudo aprovado":
      return "bg-emerald-500/10 text-emerald-200 ring-emerald-400/25 shadow-[0_0_18px_rgba(16,185,129,0.18)]";
    case "Com recusas":
      return "bg-red-500/10 text-red-200 ring-red-400/25 shadow-[0_0_18px_rgba(239,68,68,0.18)]";
    case "Pendente / em análise":
      return "bg-amber-500/10 text-amber-200 ring-amber-400/25 shadow-[0_0_18px_rgba(245,158,11,0.18)]";
    case "Sem documentos":
      return "bg-slate-500/10 text-slate-200 ring-white/10";
    default:
      return "bg-slate-500/10 text-slate-200 ring-white/10";
  }
}

function docCountBadge(n: number) {
  const label =
    n === 0 ? "0 docs" : n === 1 ? "1 doc" : `${n} docs`;
  return (
    <span className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-semibold text-slate-200 ring-1 ring-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
      {label}
    </span>
  );
}

function filterPillBase(active: boolean) {
  return [
    "inline-flex h-9 items-center rounded-full border px-3.5 text-sm font-semibold transition-colors",
    active
      ? "border-violet-400/40 bg-violet-500/15 text-slate-50 ring-1 ring-violet-400/25 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_0_22px_rgba(139,92,246,0.14)]"
      : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/15 hover:bg-white/[0.05] hover:text-slate-100",
  ].join(" ");
}

export function AlunosListClient({ rows }: Props) {
  const [q, setQ] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltro>("todos");
  const [docsFiltro, setDocsFiltro] = useState<DocsFiltro>("todos");

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const s = q.trim().toLowerCase();
      if (s) {
        const n = (r.nome_completo ?? "").toLowerCase();
        const e = (r.email ?? "").toLowerCase();
        if (!n.includes(s) && !e.includes(s)) {
          return false;
        }
      }

      if (estadoFiltro !== "todos") {
        if (estadoFiltro === "tudo_aprovado" && r.resumo !== "Tudo aprovado") {
          return false;
        }
        if (estadoFiltro === "com_recusas" && r.resumo !== "Com recusas") {
          return false;
        }
        if (estadoFiltro === "sem_documentos" && r.resumo !== "Sem documentos") {
          return false;
        }
      }

      if (docsFiltro !== "todos") {
        if (docsFiltro === "zero" && r.docCount !== 0) {
          return false;
        }
        if (docsFiltro === "um_mais" && r.docCount < 1) {
          return false;
        }
        if (docsFiltro === "dois_mais" && r.docCount < 2) {
          return false;
        }
      }

      return true;
    });
  }, [q, rows, estadoFiltro, docsFiltro]);

  const filtrosAtivos = estadoFiltro !== "todos" || docsFiltro !== "todos";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
        <label className="block w-full max-w-md lg:max-w-sm">
          <span className="text-base font-medium text-slate-300">Buscar</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nome ou e-mail"
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2.5 text-sm text-slate-200 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] outline-none transition-colors placeholder:text-slate-400 focus:border-violet-400/55 focus:ring-2 focus:ring-violet-400/35"
          />
        </label>

        <div className="flex w-full flex-col gap-3 lg:min-w-0 lg:flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-full text-base font-medium text-slate-300 sm:w-auto">
              Estado
            </span>
            <button
              type="button"
              className={filterPillBase(estadoFiltro === "todos")}
              onClick={() => setEstadoFiltro("todos")}
            >
              Todos
            </button>
            <button
              type="button"
              className={filterPillBase(estadoFiltro === "tudo_aprovado")}
              onClick={() => setEstadoFiltro("tudo_aprovado")}
            >
              Tudo aprovado
            </button>
            <button
              type="button"
              className={filterPillBase(estadoFiltro === "com_recusas")}
              onClick={() => setEstadoFiltro("com_recusas")}
            >
              Com recusas
            </button>
            <button
              type="button"
              className={filterPillBase(estadoFiltro === "sem_documentos")}
              onClick={() => setEstadoFiltro("sem_documentos")}
            >
              Sem documentos
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="w-full text-base font-medium text-slate-300 sm:w-auto">
              Documentos
            </span>
            <button
              type="button"
              className={filterPillBase(docsFiltro === "todos")}
              onClick={() => setDocsFiltro("todos")}
            >
              Todos
            </button>
            <button
              type="button"
              className={filterPillBase(docsFiltro === "zero")}
              onClick={() => setDocsFiltro("zero")}
            >
              0 docs
            </button>
            <button
              type="button"
              className={filterPillBase(docsFiltro === "um_mais")}
              onClick={() => setDocsFiltro("um_mais")}
            >
              1+ docs
            </button>
            <button
              type="button"
              className={filterPillBase(docsFiltro === "dois_mais")}
              onClick={() => setDocsFiltro("dois_mais")}
            >
              2+ docs
            </button>
            {filtrosAtivos ? (
              <button
                type="button"
                onClick={() => {
                  setEstadoFiltro("todos");
                  setDocsFiltro("todos");
                }}
                className="ml-auto inline-flex h-9 items-center rounded-full border border-white/10 px-3.5 text-sm font-semibold text-slate-300 transition-colors hover:border-white/15 hover:bg-white/[0.05] hover:text-slate-100"
              >
                Limpar filtros
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/35 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur lg:overflow-x-visible">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs text-slate-400">
              <th className="px-4 py-3.5 font-semibold">Nome</th>
              <th className="px-4 py-3.5 font-semibold">E-mail</th>
              <th className="px-4 py-3.5 font-semibold">Telefone</th>
              <th className="px-4 py-3.5 font-semibold">Cadastro</th>
              <th className="px-4 py-3.5 font-semibold">Docs</th>
              <th className="px-4 py-3.5 font-semibold">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((r) => (
              <tr
                key={r.id}
                className="text-slate-200/90 transition-colors duration-200 ease-out hover:bg-white/[0.025]"
              >
                <td className="px-4 py-3.5">
                  <div className="font-semibold text-slate-50 truncate">
                    {r.nome_completo?.trim() || "—"}
                  </div>
                </td>
                <td className="px-4 py-3.5 text-xs text-slate-400 truncate">
                  {r.email || "—"}
                </td>
                <td className="px-4 py-3.5 text-xs text-slate-400">
                  {telefoneExibir(r)}
                </td>
                <td className="px-4 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                  {new Date(r.created_at).toLocaleString("pt-PT", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </td>
                <td className="px-4 py-3.5">{docCountBadge(r.docCount)}</td>
                <td className="px-4 py-3.5">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${estadoPillClass(r.resumo)}`}
                  >
                    {r.resumo}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 ? (
          <p className="p-5 text-sm text-slate-300/80">
            Nenhum aluno com esse critério.
          </p>
        ) : null}
      </div>
    </div>
  );
}
