"use client";

import {
  atualizarEvento,
  criarEvento,
  excluirEvento,
  publicarEvento,
  voltarParaRascunhoEvento,
  type CalendarioEventoInput,
} from "@/app/admin/(protected)/calendario/actions";
import type { AdminCalendarioEventoRow } from "@/lib/adminCalendarioTypes";
import {
  calendarioStatusLabel,
  calendarioStatusPillClass,
  calendarioTipoLabel,
  calendarioTipoPillClass,
  type CalendarioEventoStatus,
  type CalendarioEventoTipo,
} from "@/lib/calendario";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Props = { rows: AdminCalendarioEventoRow[] };

type StatusFiltro = CalendarioEventoStatus | "qualquer";
type TipoFiltro = CalendarioEventoTipo | "qualquer";
type DestaqueFiltro = "qualquer" | "destaque" | "sem_destaque";

function getAllowedYearRange(now: Date = new Date()) {
  const currentYear = now.getFullYear();
  return { minYear: currentYear - 1, maxYear: currentYear + 5 };
}

function getDateInputBounds(now: Date = new Date()) {
  const { minYear, maxYear } = getAllowedYearRange(now);
  return {
    min: `${minYear}-01-01T00:00`,
    max: `${maxYear}-12-31T23:59`,
  };
}

function parseLocalDateTimeStrict(value: string): Date | null {
  const match = value
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) return null;

  const [, yearText, monthText, dayText, hourText, minuteText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const { minYear, maxYear } = getAllowedYearRange();

  if (year < minYear || year > maxYear) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  if (hour < 0 || hour > 23) return null;
  if (minute < 0 || minute > 59) return null;

  const date = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (Number.isNaN(date.getTime())) return null;
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getHours() !== hour ||
    date.getMinutes() !== minute
  ) {
    return null;
  }

  return date;
}

function validateEventDates(form: CalendarioEventoInput): string | null {
  const start = form.data_inicio?.trim()
    ? parseLocalDateTimeStrict(form.data_inicio)
    : null;
  if (!start) return "Informe uma data de início válida.";

  if (!form.data_fim?.trim()) return null;

  const end = parseLocalDateTimeStrict(form.data_fim);
  if (!end) return "Informe uma data de fim válida.";
  if (end.getTime() < start.getTime()) {
    return "A data de fim não pode ser anterior à data de início.";
  }

  return null;
}

function fmtDateTime(value: string | null) {
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

/**
 * Converte um Date para o formato esperado por <input type="datetime-local">:
 * "YYYY-MM-DDTHH:mm" no fuso local. Sem segundos, sem timezone — é o que o
 * input nativo aceita de forma estável.
 */
function toLocalInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function emptyForm(now: Date = new Date()): CalendarioEventoInput {
  const start = new Date(now.getTime() + 60 * 60 * 1000);
  start.setMinutes(0, 0, 0);
  return {
    titulo: "",
    descricao: "",
    tipo: "evento",
    status: "publicado",
    destaque: false,
    // Mantemos o valor do input no formato local (string do datetime-local).
    // A server action já normaliza para ISO via `new Date(...).toISOString()`.
    data_inicio: toLocalInputValue(start.toISOString()),
    data_fim: null,
    cor: "",
  };
}

export function CalendarioAdminClient({ rows }: Props) {
  const router = useRouter();
  const dateBounds = useMemo(() => getDateInputBounds(), []);
  const [q, setQ] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<StatusFiltro>("qualquer");
  const [tipoFiltro, setTipoFiltro] = useState<TipoFiltro>("qualquer");
  const [destaqueFiltro, setDestaqueFiltro] =
    useState<DestaqueFiltro>("qualquer");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCalendarioEventoRow | null>(null);
  const [form, setForm] = useState<CalendarioEventoInput>(() => emptyForm());
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (s) {
        const t = (r.titulo ?? "").toLowerCase();
        const d = (r.descricao ?? "").toLowerCase();
        if (!t.includes(s) && !d.includes(s)) return false;
      }
      if (statusFiltro !== "qualquer" && r.status !== statusFiltro) return false;
      if (tipoFiltro !== "qualquer" && r.tipo !== tipoFiltro) return false;
      if (destaqueFiltro === "destaque" && !r.destaque) return false;
      if (destaqueFiltro === "sem_destaque" && r.destaque) return false;
      return true;
    });
  }, [rows, q, statusFiltro, tipoFiltro, destaqueFiltro]);

  function openCreate() {
    setMsg(null);
    setEditing(null);
    setForm(emptyForm());
    setOpen(true);
  }

  function openEdit(row: AdminCalendarioEventoRow) {
    setMsg(null);
    setEditing(row);
    setForm({
      titulo: row.titulo ?? "",
      descricao: row.descricao ?? "",
      tipo: (row.tipo as CalendarioEventoTipo) ?? "evento",
      status: (row.status as CalendarioEventoStatus) ?? "publicado",
      destaque: !!row.destaque,
      // Convertemos o ISO vindo do banco para o formato local do input apenas
      // ao abrir o modal. Durante a edição, o state guarda a string do input.
      data_inicio: toLocalInputValue(row.data_inicio),
      data_fim: row.data_fim ? toLocalInputValue(row.data_fim) : null,
      cor: row.cor ?? "",
    });
    setOpen(true);
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const dateError = validateEventDates(form);
    if (dateError) {
      setMsg(dateError);
      return;
    }
    setPending(true);
    try {
      if (editing) {
        const r = await atualizarEvento(editing.id, form);
        if (r.error) setMsg(r.error);
        else {
          setOpen(false);
          router.refresh();
        }
      } else {
        const r = await criarEvento(form);
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

  async function toggleStatus(row: AdminCalendarioEventoRow) {
    setMsg(null);
    setPending(true);
    try {
      const r =
        row.status === "publicado"
          ? await voltarParaRascunhoEvento(row.id)
          : await publicarEvento(row.id);
      if (r.error) setMsg(r.error);
      else router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function del(row: AdminCalendarioEventoRow) {
    const ok = window.confirm("Excluir este evento? Esta ação não pode ser desfeita.");
    if (!ok) return;
    setMsg(null);
    setPending(true);
    try {
      const r = await excluirEvento(row.id);
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
            placeholder="Título ou descrição"
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
              <option value="evento">Evento</option>
              <option value="prazo">Prazo</option>
              <option value="reuniao">Reunião</option>
              <option value="aula">Aula</option>
              <option value="feriado">Feriado</option>
              <option value="aviso">Aviso</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-300">Destaque</span>
            <select
              value={destaqueFiltro}
              onChange={(e) =>
                setDestaqueFiltro(e.target.value as DestaqueFiltro)
              }
              className={selectBaseClass()}
            >
              <option value="qualquer">Qualquer</option>
              <option value="destaque">Somente destaque</option>
              <option value="sem_destaque">Sem destaque</option>
            </select>
          </label>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-blue-600 px-5 text-sm font-semibold text-white shadow-[0_0_34px_rgba(139,92,246,0.26)] transition hover:from-violet-500 hover:via-fuchsia-500 hover:to-blue-500 disabled:opacity-60"
            disabled={pending}
          >
            Novo evento
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/35 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur lg:overflow-x-visible">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs text-slate-400">
              <th className="px-4 py-3.5 font-semibold">Título</th>
              <th className="px-4 py-3.5 font-semibold">Tipo</th>
              <th className="px-4 py-3.5 font-semibold">Status</th>
              <th className="px-4 py-3.5 font-semibold">Início</th>
              <th className="px-4 py-3.5 font-semibold">Fim</th>
              <th className="px-4 py-3.5 font-semibold">Destaque</th>
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
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-slate-50">
                      {row.titulo}
                    </div>
                    {row.descricao?.trim() ? (
                      <div className="mt-1 line-clamp-2 text-xs text-slate-400">
                        {row.descricao}
                      </div>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ring-1 ${calendarioTipoPillClass(
                      String(row.tipo),
                    )}`}
                  >
                    {calendarioTipoLabel(String(row.tipo))}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ring-1 ${calendarioStatusPillClass(
                      String(row.status),
                    )}`}
                  >
                    {calendarioStatusLabel(String(row.status))}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                  {fmtDateTime(row.data_inicio)}
                </td>
                <td className="px-4 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                  {fmtDateTime(row.data_fim)}
                </td>
                <td className="px-4 py-3.5 text-xs text-slate-300">
                  {row.destaque ? "Sim" : "—"}
                </td>
                <td className="px-4 py-3.5 text-right">
                  <div className="inline-flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(row)}
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
            Nenhum evento com esse critério.
          </p>
        ) : null}
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 py-6 sm:items-center">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-slate-950/80 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_36px_120px_rgba(0,0,0,0.75)] backdrop-blur">
            <div className="border-b border-white/10 px-5 py-4">
              <div className="text-sm font-semibold text-slate-50">
                {editing ? "Editar evento" : "Novo evento"}
              </div>
              <div className="mt-0.5 text-xs text-slate-400">
                Publicado aparece para os alunos em “Calendário”.
              </div>
            </div>

            <form onSubmit={salvar} className="space-y-4 px-5 py-5">
              <label className="block">
                <span className="text-sm font-medium text-slate-300">Título</span>
                <input
                  value={form.titulo}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, titulo: e.target.value }))
                  }
                  className={inputBaseClass()}
                  maxLength={160}
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-300">
                  Descrição
                </span>
                <textarea
                  value={form.descricao}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, descricao: e.target.value }))
                  }
                  className={inputBaseClass()}
                  rows={4}
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-slate-300">Tipo</span>
                  <select
                    value={form.tipo}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        tipo: e.target.value as CalendarioEventoTipo,
                      }))
                    }
                    className={selectBaseClass()}
                  >
                    <option value="evento">Evento</option>
                    <option value="prazo">Prazo</option>
                    <option value="reuniao">Reunião</option>
                    <option value="aula">Aula</option>
                    <option value="feriado">Feriado</option>
                    <option value="aviso">Aviso</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-300">
                    Status
                  </span>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        status: e.target.value as CalendarioEventoStatus,
                      }))
                    }
                    className={selectBaseClass()}
                  >
                    <option value="publicado">Publicado</option>
                    <option value="rascunho">Rascunho</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-slate-300">
                    Data / hora início
                  </span>
                  <input
                    type="datetime-local"
                    value={form.data_inicio}
                    min={dateBounds.min}
                    max={dateBounds.max}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, data_inicio: e.target.value }))
                    }
                    className={inputBaseClass()}
                    required
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-300">
                    Data / hora fim (opcional)
                  </span>
                  <input
                    type="datetime-local"
                    value={form.data_fim ?? ""}
                    min={dateBounds.min}
                    max={dateBounds.max}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        data_fim: e.target.value || null,
                      }))
                    }
                    className={inputBaseClass()}
                  />
                </label>
              </div>

              <div className="flex flex-wrap items-end gap-3">
                <label className={checkboxLabelClass()}>
                  <input
                    type="checkbox"
                    checked={form.destaque}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, destaque: e.target.checked }))
                    }
                  />
                  Destaque
                </label>

                <label className="block min-w-0 flex-1 sm:min-w-[240px]">
                  <span className="text-sm font-medium text-slate-300">
                    Cor (hex opcional)
                  </span>
                  <input
                    value={form.cor}
                    onChange={(e) => setForm((p) => ({ ...p, cor: e.target.value }))}
                    placeholder="#8B5CF6"
                    className={inputBaseClass()}
                  />
                </label>
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

