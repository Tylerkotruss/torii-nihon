"use client";

import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { useDashboardData } from "@/contexts/DashboardDataContext";
import {
  buildDocumentStorageKey,
  DOCUMENT_TYPE_OPTIONS,
  tipoLabel,
  validateDocumentFile,
} from "@/lib/documents";
import { getSupabaseClient } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Documento = {
  id: string;
  aluno_id: string;
  tipo: string;
  titulo: string | null;
  nome_arquivo_original: string;
  content_type: string | null;
  tamanho_bytes: number | null;
  storage_bucket: string;
  storage_path: string;
  status: string;
  motivo_rejeicao: string | null;
  created_at: string;
  updated_at: string;
};

function formatUploadedAt(value: string) {
  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function normalizeDocStatus(status?: string | null): {
  label: "Pendente" | "Em análise" | "Recusado" | "Aprovado";
  hint: string;
  actionLabel: string;
  badgeClass: string;
  labelClass: string;
} {
  if (status === "aprovado") {
    return {
      label: "Aprovado",
      hint: "Validado pela equipe.",
      actionLabel: "Documento aprovado",
      badgeClass:
        "border-emerald-400/25 bg-emerald-500/10 text-emerald-200 ring-emerald-400/20",
      labelClass: "text-emerald-200",
    };
  }
  if (status === "rejeitado" || status === "recusado") {
    return {
      label: "Recusado",
      hint: "Corrigir e reenviar.",
      actionLabel: "Reenviar documento",
      badgeClass: "border-red-400/25 bg-red-500/10 text-red-200 ring-red-400/20",
      labelClass: "text-red-200",
    };
  }
  if (status === "enviado" || status === "em_analise") {
    return {
      label: "Em análise",
      hint: "Aguardando validação.",
      actionLabel: "Aguardando análise",
      badgeClass:
        "border-amber-400/25 bg-amber-500/10 text-amber-200 ring-amber-400/20",
      labelClass: "text-amber-200",
    };
  }
  return {
    label: "Pendente",
    hint: "",
    actionLabel: "Enviar documento",
    badgeClass: "border-white/10 bg-white/[0.04] text-slate-300 ring-white/10",
    labelClass: "text-slate-200",
  };
}

export default function DocumentsPage() {
  const router = useRouter();
  const { userId, refreshDocumentos, isLoading: ctxBoot } = useDashboardData();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const selectedTipoRef = useRef(DOCUMENT_TYPE_OPTIONS[0]!.value);
  const [items, setItems] = useState<Documento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedTipo, setSelectedTipo] = useState(
    DOCUMENT_TYPE_OPTIONS[0]!.value,
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  const loadDocuments = useCallback(async (uid: string) => {
    setListError(null);
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("documentos")
      .select(
        "id, aluno_id, tipo, titulo, nome_arquivo_original, content_type, tamanho_bytes, storage_bucket, storage_path, status, motivo_rejeicao, created_at, updated_at",
      )
      .eq("aluno_id", uid)
      .order("created_at", { ascending: false });

    if (error) {
      setListError(error.message);
      return;
    }
    setItems((data ?? []) as Documento[]);
  }, []);

  useEffect(() => {
    if (ctxBoot) {
      return;
    }
    if (!userId) {
      router.replace("/login?next=/dashboard/docs");
      return;
    }
    let active = true;
    (async () => {
      setIsLoading(true);
      await loadDocuments(userId);
      if (active) {
        setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [ctxBoot, userId, loadDocuments, router]);

  const latestByTipo = useMemo(() => {
    const latest: Record<string, Documento | null> = {};
    for (const option of DOCUMENT_TYPE_OPTIONS) {
      latest[option.value] = null;
    }
    for (const item of items) {
      if (!(item.tipo in latest)) {
        continue;
      }
      const current = latest[item.tipo];
      if (
        !current ||
        new Date(item.created_at).getTime() > new Date(current.created_at).getTime()
      ) {
        latest[item.tipo] = item;
      }
    }
    return latest;
  }, [items]);

  const priorityTipo = useMemo(() => {
    // Prioridade: corrigir recusado primeiro; senão, enviar o primeiro pendente.
    for (const opt of DOCUMENT_TYPE_OPTIONS) {
      const cur = latestByTipo[opt.value];
      if (cur?.status === "rejeitado" || cur?.status === "recusado") {
        return opt.value;
      }
    }
    for (const opt of DOCUMENT_TYPE_OPTIONS) {
      const cur = latestByTipo[opt.value];
      if (!cur) {
        return opt.value;
      }
    }
    return DOCUMENT_TYPE_OPTIONS[0]?.value ?? "";
  }, [latestByTipo]);

  const orderedOptions = useMemo(() => {
    const all = [...DOCUMENT_TYPE_OPTIONS];
    if (!priorityTipo) {
      return all;
    }
    all.sort((a, b) => {
      if (a.value === priorityTipo) return -1;
      if (b.value === priorityTipo) return 1;
      return 0;
    });
    return all;
  }, [priorityTipo]);

  function handleEscolherArquivo(tipo: string) {
    const current = latestByTipo[tipo];
    if (current?.status === "aprovado") {
      setFormError("Este documento já está aprovado e não pode ser reenviado.");
      setFormSuccess(null);
      return;
    }
    selectedTipoRef.current = tipo;
    setSelectedTipo(tipo);
    setFormError(null);
    setFormSuccess(null);
    fileInputRef.current?.click();
  }

  async function onSubmitFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !userId) {
      return;
    }

    setFormError(null);
    setFormSuccess(null);

    const v = validateDocumentFile(file);
    if (v) {
      setFormError(v);
      return;
    }

    setIsUploading(true);
    try {
      const tipoUpload = selectedTipoRef.current;
      const current = latestByTipo[tipoUpload];
      if (current?.status === "aprovado") {
        setFormError("Este documento já está aprovado e não pode ser reenviado.");
        return;
      }
      const supabase = getSupabaseClient();
      const { storagePath, bucket } = buildDocumentStorageKey(
        { id: userId } as User,
        tipoUpload,
        file,
      );

      const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(storagePath, file, {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });

      if (upErr) {
        setFormError(upErr.message);
        return;
      }

      const tituloOut = tipoLabel(tipoUpload) || null;

      const { error: insErr } = await supabase.from("documentos").insert({
        aluno_id: userId,
        tipo: tipoUpload,
        titulo: tituloOut,
        nome_arquivo_original: file.name,
        content_type: file.type || null,
        tamanho_bytes: file.size,
        storage_bucket: bucket,
        storage_path: storagePath,
        status: "enviado",
      });

      if (insErr) {
        setFormError(
          `Documento enviado, mas o registro falhou: ${insErr.message}. Tente falar com o suporte.`,
        );
        return;
      }

      setFormSuccess(
        `${tipoLabel(tipoUpload)} enviado com sucesso. A equipe já pode iniciar a análise.`,
      );
      await loadDocuments(userId);
      await refreshDocumentos();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Erro ao enviar o documento.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(900px_480px_at_12%_0%,rgba(139,92,246,0.14),transparent_50%),radial-gradient(700px_420px_at_88%_10%,rgba(59,130,246,0.1),transparent_50%),linear-gradient(to_bottom,#070a12,#03050c)] text-slate-100">
      <DashboardHeader
        variant="dark"
        title="Documentos"
      />
      <main className="px-4 pb-12 pt-5 sm:px-6 lg:px-8">
        {listError ? (
          <div className="mx-auto mb-4 w-full max-w-7xl rounded-xl border border-red-500/25 bg-red-950/40 px-4 py-3 text-sm text-red-100">
            {listError}
          </div>
        ) : null}

        <div className="mx-auto w-full max-w-7xl space-y-6">
          <section className="rounded-3xl border border-white/10 bg-slate-950/55 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_80px_rgba(0,0,0,0.35)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Ação
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-50">
              Envie seus documentos abaixo para concluir sua etapa.
            </h1>
          </section>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            disabled={isUploading || !userId}
            onChange={onSubmitFile}
          />

          {formError ? (
            <div className="rounded-xl border border-red-500/25 bg-red-950/40 px-4 py-3 text-sm text-red-100">
              {formError}
            </div>
          ) : null}
          {formSuccess ? (
            <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              {formSuccess}
            </div>
          ) : null}

          <section>
            <div className="mb-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Documentos obrigatórios
              </p>
              <div className="mt-3 space-y-3 text-sm text-slate-400">
                <p>Para concluir seu cadastro, envie os 4 documentos obrigatórios:</p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>RG/CPF</li>
                  <li>Diploma ou certificado</li>
                  <li>Histórico escolar</li>
                  <li>Comprovante de endereço</li>
                </ul>
                <p>Se algum documento for recusado, basta corrigir e reenviar.</p>
              </div>
            </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {orderedOptions.map((doc) => {
              const current = latestByTipo[doc.value];
              const hasDocument = Boolean(current);
              const isApproved = current?.status === "aprovado";
              const status = normalizeDocStatus(current?.status);
              const isRejected =
                current?.status === "rejeitado" || current?.status === "recusado";
              const isInReview =
                current?.status === "enviado" || current?.status === "em_analise";
              const isPriority = doc.value === priorityTipo;
              return (
                <section
                  key={doc.value}
                  className={
                    isPriority
                      ? "relative overflow-hidden rounded-3xl border border-violet-400/40 bg-gradient-to-br from-violet-950/40 to-slate-950/70 p-7 shadow-[0_0_0_1px_rgba(139,92,246,0.22),0_26px_90px_rgba(0,0,0,0.55)]"
                      : "relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/55 p-7 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_22px_70px_rgba(0,0,0,0.45)]"
                  }
                >
                  <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/35 to-transparent" />

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="min-w-0 text-lg font-semibold tracking-tight text-slate-50">
                          {doc.label}
                        </h2>
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {isPriority ? (
                            <span className="inline-flex items-center rounded-full border border-violet-400/40 bg-violet-500/20 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.22em] text-violet-100 shadow-[0_0_22px_rgba(139,92,246,0.18)] whitespace-nowrap">
                              PRIORIDADE AGORA
                            </span>
                          ) : null}
                          <span
                            className={`inline-flex items-center justify-center rounded-2xl border px-4 py-2.5 text-sm font-extrabold uppercase tracking-wide ring-1 whitespace-nowrap ${status.badgeClass}`}
                          >
                            {status.label}
                          </span>
                        </div>
                      </div>
                      {status.hint ? (
                        <p className="mt-2 text-sm font-medium text-slate-300">
                          {status.hint}
                        </p>
                      ) : null}
                      {current ? (
                        <div className="mt-5 space-y-1.5 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-xs text-slate-400">
                          <p className="truncate">
                            <span className="text-slate-500">Último documento:</span>{" "}
                            <span className="text-slate-200">
                              {String(current.nome_arquivo_original ?? "Documento")}
                            </span>
                          </p>
                          <p>
                            <span className="text-slate-500">Enviado em:</span>{" "}
                            {formatUploadedAt(String(current.created_at ?? ""))}
                          </p>
                        </div>
                      ) : null}
                      {isRejected && current?.motivo_rejeicao ? (
                        <p className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-xs leading-relaxed text-red-100">
                          <span className="font-semibold text-red-200">
                            Motivo da recusa:
                          </span>{" "}
                          {current.motivo_rejeicao}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isUploading || !userId || isApproved || isInReview}
                    onClick={() => handleEscolherArquivo(doc.value)}
                    className={
                      isApproved || isInReview
                        ? "mt-6 inline-flex h-12 w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-base font-semibold text-slate-400 disabled:cursor-not-allowed"
                        : isPriority
                          ? "mt-6 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-blue-600 px-5 text-base font-semibold text-white shadow-[0_0_34px_rgba(139,92,246,0.28)] transition hover:from-violet-500 hover:via-fuchsia-500 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                          : "mt-6 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 text-base font-semibold text-white shadow-[0_0_22px_rgba(139,92,246,0.18)] transition hover:from-violet-500 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                    }
                  >
                    {isApproved
                      ? status.actionLabel
                      : isUploading && selectedTipo === doc.value
                        ? "Enviando…"
                        : isInReview
                          ? status.actionLabel
                          : isRejected
                            ? "Reenviar documento"
                            : hasDocument
                              ? "Enviar nova versão"
                              : "Enviar documento"}
                  </button>
                </section>
              );
            })}
          </div>
          </section>

        <section className="rounded-2xl border border-white/10 bg-slate-950/45 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <div className="text-sm font-semibold text-slate-100">Histórico de envios</div>
          {isLoading ? (
            <p className="mt-3 text-sm text-slate-500">Carregando…</p>
          ) : items.length === 0 ? (
            <div className="mt-3" />
          ) : (
            <ul className="mt-4 divide-y divide-white/10">
              {items.map((d) => (
                <li
                  key={d.id}
                  className="flex flex-col gap-2 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-slate-100">
                      {d.titulo ?? tipoLabel(d.tipo) ?? "Documento"}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      {String(d.nome_arquivo_original ?? "Documento")} ·{" "}
                      {tipoLabel(d.tipo) ?? "Documento"} ·{" "}
                      {formatUploadedAt(String(d.created_at ?? ""))}
                    </div>
                    {(d.status === "rejeitado" || d.status === "recusado") &&
                    d.motivo_rejeicao ? (
                      <div className="mt-1 text-xs text-red-200">
                        Motivo: {d.motivo_rejeicao}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ring-1 ${normalizeDocStatus(d.status).badgeClass}`}
                    >
                      {normalizeDocStatus(d.status).label}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
        </div>
      </main>
    </div>
  );
}
