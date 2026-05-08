"use client";

import {
  aprovarDocumento,
  gerarUrlDocumento,
  recusarDocumento,
} from "@/app/admin/(protected)/documentos/actions";
import {
  documentAdminStatusBadgeClass,
  documentStatusLabel,
  tipoLabel,
} from "@/lib/documents";
import type { DocumentoAdminRow } from "@/lib/adminTypes";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = { rows: DocumentoAdminRow[] };

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className ?? "h-4 w-4"}
    >
      <path
        d="M2.2 12c2.2-4.7 6-7.5 9.8-7.5S19.6 7.3 21.8 12c-2.2 4.7-6 7.5-9.8 7.5S4.4 16.7 2.2 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function RowForm({ row }: { row: DocumentoAdminRow }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [openReject, setOpenReject] = useState(false);
  const [motivo, setMotivo] = useState("");

  async function aprovar() {
    setMsg(null);
    setPending(true);
    const r = await aprovarDocumento(row.id);
    setPending(false);
    if (r.error) {
      setMsg(r.error);
    } else {
      router.refresh();
    }
  }

  async function recusar(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setPending(true);
    const r = await recusarDocumento(row.id, motivo);
    setPending(false);
    if (r.error) {
      setMsg(r.error);
    } else {
      setMotivo("");
      setOpenReject(false);
      router.refresh();
    }
  }

  const isAprovado = row.status === "aprovado";
  const isRecusado = row.status === "rejeitado" || row.status === "recusado";
  const canApprove = !isAprovado;
  const canReject = !isRecusado && !isAprovado;

  return (
    <div className="px-1 py-1">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-end">
        {!openReject ? (
          <div className="flex flex-wrap justify-end gap-2">
            {canApprove ? (
              <button
                type="button"
                disabled={pending}
                onClick={aprovar}
                className="inline-flex h-8 items-center rounded-md bg-emerald-600 px-2.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                Aprovar
              </button>
            ) : null}
            {canReject ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setOpenReject(true);
                  setMsg(null);
                }}
                className="inline-flex h-8 items-center rounded-md border border-red-400/40 bg-red-950/40 px-2.5 text-xs font-medium text-red-100 hover:bg-red-950/60 disabled:opacity-50"
              >
                Recusar
              </button>
            ) : null}
          </div>
        ) : (
          <form
            onSubmit={recusar}
            className="flex w-full min-w-0 max-w-sm flex-col gap-2"
          >
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              required
              minLength={3}
              rows={2}
              placeholder="Motivo da recusa (obrigatório)"
              className="w-full rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-xs text-slate-100 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={pending}
                className="h-7 rounded bg-red-600 px-2 text-xs text-white hover:bg-red-500 disabled:opacity-50"
              >
                Confirmar recusa
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpenReject(false);
                  setMotivo("");
                }}
                className="h-7 rounded border border-slate-600 bg-slate-800 px-2 text-xs text-slate-100 hover:bg-slate-700"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
      {msg ? (
        <p className="mt-1 text-xs text-red-300">{msg}</p>
      ) : null}
    </div>
  );
}

function DocumentoLink({ row }: { row: DocumentoAdminRow }) {
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const hasArquivo = Boolean(row.storage_bucket && row.storage_path);

  async function abrirDocumento() {
    setMsg(null);
    if (!hasArquivo) {
      setMsg("Arquivo indisponível.");
      return;
    }

    setPending(true);
    const popup = window.open("about:blank", "_blank");
    if (popup) {
      popup.opener = null;
    }
    const result = await gerarUrlDocumento(row.id);
    setPending(false);

    if (result.error || !result.url) {
      popup?.close();
      setMsg(result.error ?? "Não foi possível abrir o arquivo.");
      return;
    }

    if (popup) {
      popup.location.href = result.url;
    } else {
      window.open(result.url, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div className="mt-2">
      {hasArquivo ? (
        <button
          type="button"
          disabled={pending}
          onClick={abrirDocumento}
          className="inline-flex h-9 items-center gap-2 rounded-xl border border-violet-400/25 bg-slate-950/40 px-3 text-xs font-semibold text-slate-100 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_0_28px_rgba(139,92,246,0.14)] backdrop-blur hover:border-violet-400/40 hover:bg-slate-950/60 disabled:opacity-50"
        >
          <EyeIcon className="h-4 w-4 text-violet-300" />
          {pending ? "A gerar link..." : "Ver documento"}
        </button>
      ) : (
        <span className="text-xs text-amber-200/90">Arquivo indisponível</span>
      )}
      {msg ? (
        <p className="mt-1 text-xs text-red-300">{msg}</p>
      ) : null}
    </div>
  );
}

function DocumentoRowActions({ row }: { row: DocumentoAdminRow }) {
  return (
    <div className="flex flex-col gap-2">
      <DocumentoLink row={row} />
      <div className="pt-1">
        <RowForm row={row} />
      </div>
    </div>
  );
}

function DocumentoCard({ row }: { row: DocumentoAdminRow }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold text-slate-50 truncate">
            {row.alunoNome}
          </div>
          <div className="mt-0.5 text-xs text-slate-400 truncate">
            {row.alunoEmail ?? "—"}
          </div>
          <div className="mt-3 grid gap-1 text-sm">
            <div className="text-slate-200/90">
              <span className="text-xs font-medium text-slate-400">Tipo</span>{" "}
              <span className="font-medium text-slate-100">
                {tipoLabel(row.tipo)}
              </span>
            </div>
            <div className="text-slate-200/90">
              <span className="text-xs font-medium text-slate-400">Arquivo</span>{" "}
              <span className="font-medium text-slate-100">
                {row.nome_arquivo_original}
              </span>
            </div>
            <div className="text-slate-200/90">
              <span className="text-xs font-medium text-slate-400">Data</span>{" "}
              <span className="text-slate-200">
                {new Date(row.created_at).toLocaleString("pt-PT", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </span>
            </div>
          </div>
        </div>
        <span
          className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${documentAdminStatusBadgeClass(row.status)}`}
        >
          {documentStatusLabel(row.status)}
        </span>
      </div>
      {row.motivo_rejeicao?.trim() ? (
        <div className="mt-3 rounded-xl border border-red-500/15 bg-red-500/10 px-3 py-2 text-xs text-red-100">
          <span className="font-semibold text-red-200">Recusa:</span>{" "}
          <span className="line-clamp-2">{row.motivo_rejeicao.trim()}</span>
        </div>
      ) : null}
      <div className="mt-4">
        <DocumentoRowActions row={row} />
      </div>
    </article>
  );
}

export function DocumentoAdminList({ rows }: Props) {
  if (!rows.length) {
    return <p className="text-sm text-slate-500">Ainda não há documentos.</p>;
  }

  return (
    <div className="space-y-4">
      {/* Mobile / layout em cards */}
      <div className="grid gap-4 md:hidden">
        {rows.map((row) => (
          <DocumentoCard key={row.id} row={row} />
        ))}
      </div>

      {/* Desktop / tabela */}
      <div className="hidden md:block overflow-x-auto lg:overflow-x-visible rounded-2xl border border-white/10 bg-slate-950/35 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur">
        <table className="w-full table-auto text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs text-slate-400">
              <th className="px-4 py-3 font-semibold">Aluno</th>
              <th className="px-4 py-3 font-semibold">Tipo</th>
              <th className="px-4 py-3 font-semibold">Arquivo</th>
              <th className="px-4 py-3 font-semibold">Data</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((row) => (
              <tr key={row.id} className="align-top text-slate-200/90 hover:bg-white/[0.03]">
                <td className="px-4 py-3">
                  <div className="font-semibold text-slate-50 truncate">
                    {row.alunoNome}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-400 truncate">
                    {row.alunoEmail ?? "—"}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-100">
                    {tipoLabel(row.tipo)}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div
                    className="font-medium text-slate-100 break-words"
                    title={row.nome_arquivo_original}
                  >
                    {row.nome_arquivo_original}
                  </div>
                  <div className="mt-2">
                    <DocumentoLink row={row} />
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                  {new Date(row.created_at).toLocaleString("pt-PT", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${documentAdminStatusBadgeClass(row.status)}`}
                  >
                    {documentStatusLabel(row.status)}
                  </span>
                  {row.motivo_rejeicao?.trim() ? (
                    <div className="mt-2 hidden lg:block line-clamp-2 text-xs text-red-200/90">
                      Recusa: {row.motivo_rejeicao.trim()}
                    </div>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-right">
                  <RowForm row={row} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
