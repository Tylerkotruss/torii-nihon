"use client";

import {
  atualizarAviso,
  criarAviso,
  excluirAviso,
  publicarAviso,
  voltarParaRascunho,
  type AvisoInput,
} from "@/app/admin/(protected)/avisos/actions";
import type { AdminAvisoRow } from "@/lib/adminAvisosTypes";
import {
  avisoStatusLabel,
  avisoStatusPillClass,
  avisoTipoLabel,
  avisoTipoPillClass,
  type AvisoPublico,
  type AvisoStatus,
  type AvisoTipo,
} from "@/lib/avisos";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Props = { rows: AdminAvisoRow[] };

type PublicoFiltro = "todos" | "especificos" | "qualquer";
type StatusFiltro = "rascunho" | "publicado" | "qualquer";
type TipoFiltro = "informacao" | "importante" | "urgente" | "qualquer";

type AlunoPick = { id: string; nome_completo: string | null; email: string };

function fmtDate(value: string | null) {
  if (!value) return "—";
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

function checkboxLabelClass() {
  return "inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200";
}

function emptyAvisoInput(): AvisoInput {
  return {
    titulo: "",
    mensagem: "",
    tipo: "informacao",
    status: "rascunho",
    fixado: false,
    publicado_em: null,
    expira_em: null,
    publico: "todos",
    aluno_ids: [],
  };
}

export function AvisosAdminClient({ rows }: Props) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<StatusFiltro>("qualquer");
  const [tipoFiltro, setTipoFiltro] = useState<TipoFiltro>("qualquer");
  const [publicoFiltro, setPublicoFiltro] =
    useState<PublicoFiltro>("qualquer");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminAvisoRow | null>(null);
  const [form, setForm] = useState<AvisoInput>(() => emptyAvisoInput());
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [alunoQuery, setAlunoQuery] = useState("");
  const [alunoSearching, setAlunoSearching] = useState(false);
  const [alunoResults, setAlunoResults] = useState<AlunoPick[]>([]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (s) {
        const t = (r.titulo ?? "").toLowerCase();
        const m = (r.mensagem ?? "").toLowerCase();
        if (!t.includes(s) && !m.includes(s)) return false;
      }
      if (statusFiltro !== "qualquer" && r.status !== statusFiltro) return false;
      if (tipoFiltro !== "qualquer" && r.tipo !== tipoFiltro) return false;
      if (publicoFiltro !== "qualquer" && r.publico !== publicoFiltro)
        return false;
      return true;
    });
  }, [rows, q, statusFiltro, tipoFiltro, publicoFiltro]);

  function openCreate() {
    setMsg(null);
    setEditing(null);
    setForm(emptyAvisoInput());
    setAlunoQuery("");
    setAlunoResults([]);
    setOpen(true);
  }

  async function openEdit(row: AdminAvisoRow) {
    setMsg(null);
    setEditing(row);
    setAlunoQuery("");
    setAlunoResults([]);
    setPending(true);
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("aviso_destinatarios")
        .select("aluno_id")
        .eq("aviso_id", row.id)
        .limit(2000);
      if (error) {
        setMsg(error.message);
        return;
      }
      const aluno_ids = (data ?? []).map((d) => String(d.aluno_id));
      setForm({
        titulo: row.titulo ?? "",
        mensagem: row.mensagem ?? "",
        tipo: (row.tipo as AvisoTipo) ?? "informacao",
        status: (row.status as AvisoStatus) ?? "rascunho",
        fixado: !!row.fixado,
        publicado_em: row.publicado_em,
        expira_em: row.expira_em,
        publico: (row.publico as AvisoPublico) ?? "todos",
        aluno_ids,
      });
      setOpen(true);
    } finally {
      setPending(false);
    }
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setPending(true);
    try {
      if (editing) {
        const r = await atualizarAviso(editing.id, form);
        if (r.error) setMsg(r.error);
        else {
          setOpen(false);
          router.refresh();
        }
      } else {
        const r = await criarAviso(form);
        if (r.error) setMsg(r.error);
        else {
          setOpen(false);
          router.refresh();
        }
      }
    } finally {
      setPending(false);
    }
  }

  async function toggleStatus(row: AdminAvisoRow) {
    setMsg(null);
    setPending(true);
    try {
      const r =
        row.status === "publicado"
          ? await voltarParaRascunho(row.id)
          : await publicarAviso(row.id);
      if (r.error) setMsg(r.error);
      else router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function del(row: AdminAvisoRow) {
    const ok = window.confirm("Excluir este aviso? Esta ação não pode ser desfeita.");
    if (!ok) return;
    setMsg(null);
    setPending(true);
    try {
      const r = await excluirAviso(row.id);
      if (r.error) setMsg(r.error);
      else router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function buscarAlunos() {
    const q = alunoQuery.trim();
    if (q.length < 2) {
      setAlunoResults([]);
      return;
    }
    setAlunoSearching(true);
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("alunos")
        .select("id, nome_completo, email")
        .or(`nome_completo.ilike.%${q}%,email.ilike.%${q}%`)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) {
        setMsg(error.message);
        return;
      }
      setAlunoResults((data ?? []) as AlunoPick[]);
    } finally {
      setAlunoSearching(false);
    }
  }

  function toggleAlunoId(alunoId: string) {
    setForm((prev) => {
      const exists = prev.aluno_ids.includes(alunoId);
      const aluno_ids = exists
        ? prev.aluno_ids.filter((id) => id !== alunoId)
        : [...prev.aluno_ids, alunoId];
      return { ...prev, aluno_ids };
    });
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
            placeholder="Título ou mensagem"
            className={inputBaseClass()}
          />
        </label>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-end">
          <label className="block">
            <span className="text-sm font-medium text-slate-300">Status</span>
            <select
              value={statusFiltro}
              onChange={(e) => setStatusFiltro(e.target.value as StatusFiltro)}
              className={selectBaseClass()}
            >
              <option value="qualquer">Qualquer</option>
              <option value="rascunho">Rascunho</option>
              <option value="publicado">Publicado</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-300">Tipo</span>
            <select
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value as TipoFiltro)}
              className={selectBaseClass()}
            >
              <option value="qualquer">Qualquer</option>
              <option value="informacao">Informação</option>
              <option value="importante">Importante</option>
              <option value="urgente">Urgente</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-300">Público</span>
            <select
              value={publicoFiltro}
              onChange={(e) => setPublicoFiltro(e.target.value as PublicoFiltro)}
              className={selectBaseClass()}
            >
              <option value="qualquer">Qualquer</option>
              <option value="todos">Todos</option>
              <option value="especificos">Específicos</option>
            </select>
          </label>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-blue-600 px-5 text-sm font-semibold text-white shadow-[0_0_34px_rgba(139,92,246,0.26)] transition hover:from-violet-500 hover:via-fuchsia-500 hover:to-blue-500 disabled:opacity-60"
            disabled={pending}
          >
            Novo aviso
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/35 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur lg:overflow-x-visible">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs text-slate-400">
              <th className="px-4 py-3.5 font-semibold">Título</th>
              <th className="px-4 py-3.5 font-semibold">Tipo</th>
              <th className="px-4 py-3.5 font-semibold">Público</th>
              <th className="px-4 py-3.5 font-semibold">Status</th>
              <th className="px-4 py-3.5 font-semibold">Publicado</th>
              <th className="px-4 py-3.5 font-semibold">Expira</th>
              <th className="px-4 py-3.5 text-right font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((row) => (
              <tr
                key={row.id}
                className="align-top text-slate-200/90 transition-colors hover:bg-white/[0.025]"
              >
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-slate-50">
                        {row.titulo}
                      </div>
                      <div className="mt-1 line-clamp-2 text-xs text-slate-400">
                        {row.mensagem}
                      </div>
                    </div>
                    {row.fixado ? (
                      <span className="shrink-0 rounded-full border border-violet-400/30 bg-violet-500/15 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-violet-100">
                        Fixado
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ring-1 ${avisoTipoPillClass(
                      String(row.tipo),
                    )}`}
                  >
                    {avisoTipoLabel(String(row.tipo))}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-xs text-slate-300">
                  {row.publico === "todos" ? "Todos" : "Específicos"}
                </td>
                <td className="px-4 py-3.5">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ring-1 ${avisoStatusPillClass(
                      String(row.status),
                    )}`}
                  >
                    {avisoStatusLabel(String(row.status))}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                  {fmtDate(row.publicado_em)}
                </td>
                <td className="px-4 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                  {fmtDate(row.expira_em)}
                </td>
                <td className="px-4 py-3.5 text-right">
                  <div className="inline-flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => void openEdit(row)}
                      disabled={pending}
                      className="inline-flex h-9 items-center rounded-xl border border-white/10 bg-white/[0.03] px-3 text-xs font-semibold text-slate-200 hover:bg-white/[0.06] disabled:opacity-60"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => void toggleStatus(row)}
                      disabled={pending}
                      className="inline-flex h-9 items-center rounded-xl border border-violet-400/25 bg-violet-500/10 px-3 text-xs font-semibold text-violet-100 hover:bg-violet-500/15 disabled:opacity-60"
                    >
                      {row.status === "publicado" ? "Voltar rascunho" : "Publicar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void del(row)}
                      disabled={pending}
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
          <p className="p-5 text-sm text-slate-300/80">
            Nenhum aviso com esse critério.
          </p>
        ) : null}
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 py-6 sm:items-center">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-slate-950/80 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_36px_120px_rgba(0,0,0,0.75)] backdrop-blur">
            <div className="border-b border-white/10 px-5 py-4">
              <div className="text-sm font-semibold text-slate-50">
                {editing ? "Editar aviso" : "Novo aviso"}
              </div>
              <div className="mt-0.5 text-xs text-slate-400">
                Publique para aparecer no dashboard dos alunos conforme o público.
              </div>
            </div>

            <form onSubmit={salvar} className="space-y-4 px-5 py-5">
              <label className="block">
                <span className="text-sm font-medium text-slate-300">Título</span>
                <input
                  value={form.titulo}
                  onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))}
                  className={inputBaseClass()}
                  maxLength={140}
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-300">Mensagem</span>
                <textarea
                  value={form.mensagem}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, mensagem: e.target.value }))
                  }
                  className={inputBaseClass()}
                  rows={5}
                  required
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-slate-300">Tipo</span>
                  <select
                    value={form.tipo}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, tipo: e.target.value as AvisoTipo }))
                    }
                    className={selectBaseClass()}
                  >
                    <option value="informacao">Informação</option>
                    <option value="importante">Importante</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-300">Status</span>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        status: e.target.value as AvisoStatus,
                      }))
                    }
                    className={selectBaseClass()}
                  >
                    <option value="rascunho">Rascunho</option>
                    <option value="publicado">Publicado</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-slate-300">
                    Publicado em (opcional)
                  </span>
                  <input
                    type="datetime-local"
                    value={form.publicado_em ? form.publicado_em.slice(0, 16) : ""}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        publicado_em: e.target.value
                          ? new Date(e.target.value).toISOString()
                          : null,
                      }))
                    }
                    className={inputBaseClass()}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-300">
                    Expira em (opcional)
                  </span>
                  <input
                    type="datetime-local"
                    value={form.expira_em ? form.expira_em.slice(0, 16) : ""}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        expira_em: e.target.value
                          ? new Date(e.target.value).toISOString()
                          : null,
                      }))
                    }
                    className={inputBaseClass()}
                  />
                </label>
              </div>

              <div className="flex flex-wrap gap-3">
                <label className={checkboxLabelClass()}>
                  <input
                    type="checkbox"
                    checked={form.fixado}
                    onChange={(e) => setForm((p) => ({ ...p, fixado: e.target.checked }))}
                  />
                  Fixado
                </label>
                <label className="block min-w-[240px] flex-1">
                  <span className="text-sm font-medium text-slate-300">Público</span>
                  <select
                    value={form.publico}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        publico: e.target.value as AvisoPublico,
                        aluno_ids:
                          e.target.value === "especificos" ? p.aluno_ids : [],
                      }))
                    }
                    className={selectBaseClass()}
                  >
                    <option value="todos">Todos</option>
                    <option value="especificos">Específicos</option>
                  </select>
                </label>
              </div>

              {form.publico === "especificos" ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-sm font-semibold text-slate-100">
                    Destinatários
                  </div>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
                    <label className="block w-full">
                      <span className="text-xs font-medium text-slate-400">
                        Buscar alunos
                      </span>
                      <input
                        value={alunoQuery}
                        onChange={(e) => setAlunoQuery(e.target.value)}
                        placeholder="Nome ou e-mail (mín. 2)"
                        className={inputBaseClass()}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => void buscarAlunos()}
                      disabled={alunoSearching || alunoQuery.trim().length < 2}
                      className="inline-flex h-11 items-center justify-center rounded-2xl border border-violet-400/25 bg-violet-500/10 px-4 text-sm font-semibold text-violet-100 hover:bg-violet-500/15 disabled:opacity-60"
                    >
                      {alunoSearching ? "Buscando…" : "Buscar"}
                    </button>
                  </div>

                  <div className="mt-3">
                    <div className="text-xs text-slate-400">
                      Selecionados:{" "}
                      <span className="font-semibold text-slate-200">
                        {form.aluno_ids.length}
                      </span>
                    </div>
                    {alunoResults.length ? (
                      <ul className="mt-3 space-y-2">
                        {alunoResults.map((a) => {
                          const on = form.aluno_ids.includes(a.id);
                          return (
                            <li key={a.id}>
                              <button
                                type="button"
                                onClick={() => toggleAlunoId(a.id)}
                                className={[
                                  "w-full rounded-2xl border px-4 py-3 text-left transition",
                                  on
                                    ? "border-violet-400/40 bg-violet-500/10"
                                    : "border-white/10 bg-black/20 hover:bg-white/[0.04]",
                                ].join(" ")}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="truncate text-sm font-semibold text-slate-100">
                                      {a.nome_completo?.trim() || "—"}
                                    </div>
                                    <div className="mt-0.5 truncate text-xs text-slate-400">
                                      {a.email}
                                    </div>
                                  </div>
                                  <span className="shrink-0 text-xs font-semibold text-slate-300">
                                    {on ? "Selecionado" : "Selecionar"}
                                  </span>
                                </div>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="mt-3 text-xs text-slate-500">
                        Faça uma busca para listar alunos.
                      </p>
                    )}
                  </div>
                </div>
              ) : null}

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

