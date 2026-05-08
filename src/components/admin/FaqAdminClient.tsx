"use client";

import {
  atualizarFaq,
  criarFaq,
  excluirFaq,
  setFaqAtivo,
  setFaqOrdem,
  type FaqInput,
} from "@/app/admin/(protected)/faq/actions";
import type { FaqRow } from "@/lib/duvidas";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Props = { rows: FaqRow[] };

function inputBaseClass() {
  return "mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2.5 text-sm text-slate-200 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] outline-none transition-colors placeholder:text-slate-400 focus:border-violet-400/55 focus:ring-2 focus:ring-violet-400/35";
}

function selectBaseClass() {
  return "mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2.5 text-sm text-slate-200 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] outline-none transition-colors focus:border-violet-400/55 focus:ring-2 focus:ring-violet-400/35";
}

function emptyForm(): FaqInput {
  return { pergunta: "", resposta: "", categoria: "", ativo: true, ordem: 0 };
}

export function FaqAdminClient({ rows }: Props) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("qualquer");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FaqRow | null>(null);
  const [form, setForm] = useState<FaqInput>(() => emptyForm());
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

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
      if (cat !== "qualquer" && (r.categoria ?? "") !== cat) return false;
      if (!s) return true;
      const p = (r.pergunta ?? "").toLowerCase();
      const resp = (r.resposta ?? "").toLowerCase();
      return p.includes(s) || resp.includes(s);
    });
  }, [rows, q, cat]);

  function openCreate() {
    setMsg(null);
    setEditing(null);
    setForm(emptyForm());
    setOpen(true);
  }

  function openEdit(row: FaqRow) {
    setMsg(null);
    setEditing(row);
    setForm({
      pergunta: row.pergunta ?? "",
      resposta: row.resposta ?? "",
      categoria: row.categoria ?? "",
      ativo: !!row.ativo,
      ordem: row.ordem ?? 0,
    });
    setOpen(true);
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setPending(true);
    try {
      const r = editing ? await atualizarFaq(editing.id, form) : await criarFaq(form);
      if (r.error) setMsg(r.error);
      else {
        setOpen(false);
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  }

  async function del(row: FaqRow) {
    const ok = window.confirm("Excluir este FAQ? Esta ação não pode ser desfeita.");
    if (!ok) return;
    setMsg(null);
    setPending(true);
    try {
      const r = await excluirFaq(row.id);
      if (r.error) setMsg(r.error);
      else router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function toggleAtivo(row: FaqRow) {
    setMsg(null);
    setPending(true);
    try {
      const r = await setFaqAtivo(row.id, !row.ativo);
      if (r.error) setMsg(r.error);
      else router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function updateOrdem(row: FaqRow, ordem: number) {
    setMsg(null);
    setPending(true);
    try {
      const r = await setFaqOrdem(row.id, ordem);
      if (r.error) setMsg(r.error);
      else router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      {msg ? (
        <div className="rounded-xl border border-red-500/25 bg-red-950/40 px-4 py-3 text-sm text-red-100">
          {msg}
        </div>
      ) : null}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <label className="block w-full max-w-xl">
          <span className="text-base font-medium text-slate-300">Buscar</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Pergunta ou resposta"
            className={inputBaseClass()}
          />
        </label>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-end">
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
          <button
            type="button"
            onClick={openCreate}
            disabled={pending}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-blue-600 px-5 text-sm font-semibold text-white shadow-[0_0_34px_rgba(139,92,246,0.26)] transition hover:from-violet-500 hover:via-fuchsia-500 hover:to-blue-500 disabled:opacity-60"
          >
            Novo FAQ
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/35 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur lg:overflow-x-visible">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs text-slate-400">
              <th className="px-4 py-3.5 font-semibold">Pergunta</th>
              <th className="px-4 py-3.5 font-semibold">Categoria</th>
              <th className="px-4 py-3.5 font-semibold">Ordem</th>
              <th className="px-4 py-3.5 font-semibold">Ativo</th>
              <th className="px-4 py-3.5 text-right font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((r) => (
              <tr key={r.id} className="text-slate-200/90 hover:bg-white/[0.025]">
                <td className="px-4 py-3.5">
                  <div className="font-semibold text-slate-50 line-clamp-2">
                    {r.pergunta}
                  </div>
                  <div className="mt-1 text-xs text-slate-400 line-clamp-2">
                    {r.resposta}
                  </div>
                </td>
                <td className="px-4 py-3.5 text-xs text-slate-300">
                  {r.categoria?.trim() || "—"}
                </td>
                <td className="px-4 py-3.5">
                  <input
                    type="number"
                    defaultValue={r.ordem ?? 0}
                    onBlur={(e) => void updateOrdem(r, Number(e.target.value))}
                    className="w-24 rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-200 outline-none focus:border-violet-400/55 focus:ring-2 focus:ring-violet-400/35"
                  />
                </td>
                <td className="px-4 py-3.5 text-xs text-slate-300">
                  {r.ativo ? "Sim" : "Não"}
                </td>
                <td className="px-4 py-3.5 text-right">
                  <div className="inline-flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => openEdit(r)}
                      className="inline-flex h-9 items-center rounded-xl border border-white/10 bg-white/[0.03] px-3 text-xs font-semibold text-slate-200 hover:bg-white/[0.06] disabled:opacity-60"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => void toggleAtivo(r)}
                      className="inline-flex h-9 items-center rounded-xl border border-violet-400/25 bg-violet-500/10 px-3 text-xs font-semibold text-violet-100 hover:bg-violet-500/15 disabled:opacity-60"
                    >
                      {r.ativo ? "Desativar" : "Ativar"}
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => void del(r)}
                      className="inline-flex h-9 items-center rounded-xl border border-red-400/25 bg-red-500/10 px-3 text-xs font-semibold text-red-100 hover:bg-red-500/15 disabled:opacity-60"
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 ? (
          <p className="p-5 text-sm text-slate-300/80">Nenhum FAQ.</p>
        ) : null}
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 py-6 sm:items-center">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-slate-950/80 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_36px_120px_rgba(0,0,0,0.75)] backdrop-blur">
            <div className="border-b border-white/10 px-5 py-4">
              <div className="text-sm font-semibold text-slate-50">
                {editing ? "Editar FAQ" : "Novo FAQ"}
              </div>
            </div>
            <form onSubmit={salvar} className="space-y-4 px-5 py-5">
              <label className="block">
                <span className="text-sm font-medium text-slate-300">Pergunta</span>
                <input
                  value={form.pergunta}
                  onChange={(e) => setForm((p) => ({ ...p, pergunta: e.target.value }))}
                  className={inputBaseClass()}
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-300">Resposta</span>
                <textarea
                  value={form.resposta}
                  onChange={(e) => setForm((p) => ({ ...p, resposta: e.target.value }))}
                  className={inputBaseClass()}
                  rows={6}
                  required
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-slate-300">Categoria</span>
                  <input
                    value={form.categoria}
                    onChange={(e) => setForm((p) => ({ ...p, categoria: e.target.value }))}
                    className={inputBaseClass()}
                    placeholder="Ex.: Documentos"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-300">Ordem</span>
                  <input
                    type="number"
                    value={form.ordem}
                    onChange={(e) => setForm((p) => ({ ...p, ordem: Number(e.target.value) }))}
                    className={inputBaseClass()}
                  />
                </label>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <div>
                  <div className="text-sm font-semibold text-slate-100">Ativo</div>
                  <div className="text-xs text-slate-400">
                    Apenas FAQs ativas aparecem para os alunos.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={form.ativo}
                  onChange={(e) => setForm((p) => ({ ...p, ativo: e.target.checked }))}
                  className="h-5 w-5"
                />
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setEditing(null);
                    setMsg(null);
                  }}
                  className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-5 text-sm font-semibold text-slate-200 hover:bg-white/[0.06]"
                  disabled={pending}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="inline-flex h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-blue-600 px-5 text-sm font-semibold text-white shadow-[0_0_34px_rgba(139,92,246,0.26)] transition hover:from-violet-500 hover:via-fuchsia-500 hover:to-blue-500 disabled:opacity-60"
                >
                  {pending ? "Salvando…" : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

