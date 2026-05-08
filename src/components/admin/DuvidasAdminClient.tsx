"use client";

import type { AdminDuvidaRow } from "@/lib/adminDuvidasTypes";
import {
  duvidaPrioridadeLabel,
  duvidaPrioridadePillClass,
  duvidaStatusLabel,
  duvidaStatusPillClass,
} from "@/lib/duvidas";
import Link from "next/link";
import { useMemo, useState } from "react";

type Props = { rows: AdminDuvidaRow[] };

type StatusFiltro = "aberta" | "respondida" | "fechada" | "qualquer";
type PrioridadeFiltro = "baixa" | "normal" | "alta" | "qualquer";

function fmtDateTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function inputBaseClass() {
  return "mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2.5 text-sm text-slate-200 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] outline-none transition-colors placeholder:text-slate-400 focus:border-violet-400/55 focus:ring-2 focus:ring-violet-400/35";
}

function selectBaseClass() {
  return "mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2.5 text-sm text-slate-200 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] outline-none transition-colors focus:border-violet-400/55 focus:ring-2 focus:ring-violet-400/35";
}

export function DuvidasAdminClient({ rows }: Props) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusFiltro>("qualquer");
  const [prio, setPrio] = useState<PrioridadeFiltro>("qualquer");
  const [cat, setCat] = useState<string>("qualquer");

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) {
      const c = (r.categoria ?? "").trim();
      if (c) set.add(c);
    }
    return ["qualquer", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [rows]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (s) {
        const a = (r.assunto ?? "").toLowerCase();
        const n = (r.alunoNome ?? "").toLowerCase();
        const e = (r.alunoEmail ?? "").toLowerCase();
        if (!a.includes(s) && !n.includes(s) && !e.includes(s)) return false;
      }
      if (status !== "qualquer" && r.status !== status) return false;
      if (prio !== "qualquer" && r.prioridade !== prio) return false;
      if (cat !== "qualquer" && (r.categoria ?? "") !== cat) return false;
      return true;
    });
  }, [rows, q, status, prio, cat]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <label className="block w-full max-w-xl">
          <span className="text-base font-medium text-slate-300">Buscar</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Assunto, aluno ou e-mail"
            className={inputBaseClass()}
          />
        </label>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-end">
          <label className="block">
            <span className="text-sm font-medium text-slate-300">Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusFiltro)}
              className={selectBaseClass()}
            >
              <option value="qualquer">Qualquer</option>
              <option value="aberta">Aberta</option>
              <option value="respondida">Respondida</option>
              <option value="fechada">Fechada</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-300">Prioridade</span>
            <select
              value={prio}
              onChange={(e) => setPrio(e.target.value as PrioridadeFiltro)}
              className={selectBaseClass()}
            >
              <option value="qualquer">Qualquer</option>
              <option value="baixa">Baixa</option>
              <option value="normal">Normal</option>
              <option value="alta">Alta</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-300">Categoria</span>
            <select
              value={cat}
              onChange={(e) => setCat(e.target.value)}
              className={selectBaseClass()}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === "qualquer" ? "Qualquer" : c}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/35 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur lg:overflow-x-visible">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs text-slate-400">
              <th className="px-4 py-3.5 font-semibold">Aluno</th>
              <th className="px-4 py-3.5 font-semibold">Assunto</th>
              <th className="px-4 py-3.5 font-semibold">Status</th>
              <th className="px-4 py-3.5 font-semibold">Prioridade</th>
              <th className="px-4 py-3.5 font-semibold">Atualização</th>
              <th className="px-4 py-3.5 text-right font-semibold">Abrir</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((r) => (
              <tr
                key={r.id}
                className="text-slate-200/90 transition-colors hover:bg-white/[0.025]"
              >
                <td className="px-4 py-3.5">
                  <div className="font-semibold text-slate-50 truncate">
                    {r.alunoNome}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-400 truncate">
                    {r.alunoEmail ?? "—"}
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <div className="font-semibold text-slate-50 truncate">
                    {r.assunto}
                  </div>
                  {r.categoria?.trim() ? (
                    <div className="mt-0.5 text-xs text-slate-500 truncate">
                      {r.categoria}
                    </div>
                  ) : null}
                </td>
                <td className="px-4 py-3.5">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ring-1 ${duvidaStatusPillClass(
                      String(r.status),
                    )}`}
                  >
                    {duvidaStatusLabel(String(r.status))}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ring-1 ${duvidaPrioridadePillClass(
                      String(r.prioridade),
                    )}`}
                  >
                    {duvidaPrioridadeLabel(String(r.prioridade))}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                  {fmtDateTime(r.atualizado_em)}
                </td>
                <td className="px-4 py-3.5 text-right">
                  <Link
                    href={`/admin/duvidas/${r.id}`}
                    className="inline-flex h-9 items-center rounded-xl border border-violet-400/25 bg-violet-500/10 px-3 text-xs font-semibold text-violet-100 hover:bg-violet-500/15"
                  >
                    Ver conversa
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 ? (
          <p className="p-5 text-sm text-slate-300/80">
            Nenhuma dúvida com esse critério.
          </p>
        ) : null}
      </div>
    </div>
  );
}

