"use client";

import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { useDashboardData } from "@/contexts/DashboardDataContext";
import {
  buildDocumentStorageKey,
  documentStatusClass,
  documentStatusLabel,
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
          `Arquivo enviado, mas o registo falhou: ${insErr.message}. Tente falar com o suporte.`,
        );
        return;
      }

      setFormSuccess(`${tipoLabel(tipoUpload)} enviado com sucesso.`);
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
    <div className="min-h-screen">
      <DashboardHeader title="Documentos" />
      <main className="px-6 pt-4 pb-10">
        {listError ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {listError}
          </div>
        ) : null}

        <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-zinc-900">
            Documentos obrigatórios
          </div>
          <p className="mt-1 text-sm text-zinc-600">
            Envie um arquivo para cada item abaixo. Aceitamos PDF, DOC ou DOCX,
            até 5MB.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            disabled={isUploading || !userId}
            onChange={onSubmitFile}
          />

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {DOCUMENT_TYPE_OPTIONS.map((doc) => {
              const current = latestByTipo[doc.value];
              const hasDocument = Boolean(current);
              const isApproved = current?.status === "aprovado";
              return (
                <section
                  key={doc.value}
                  className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h2 className="font-medium text-zinc-950">{doc.label}</h2>
                      <p className="mt-1 text-sm text-zinc-600">
                        {doc.description}
                      </p>
                      {current ? (
                        <p className="mt-2 truncate text-xs text-zinc-500">
                          Último arquivo: {current.nome_arquivo_original}
                        </p>
                      ) : null}
                      {current?.status === "rejeitado" &&
                      current.motivo_rejeicao ? (
                        <p className="mt-2 text-xs text-red-700">
                          Motivo: {current.motivo_rejeicao}
                        </p>
                      ) : null}
                    </div>
                    <span
                      className={`inline-flex w-fit rounded-md px-2.5 py-1 text-xs font-medium ring-1 ${
                        current
                          ? documentStatusClass(current.status)
                          : "bg-zinc-100 text-zinc-700 ring-zinc-200/80"
                      }`}
                    >
                      {current
                        ? documentStatusLabel(current.status)
                        : "Não enviado"}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={isUploading || !userId || isApproved}
                    onClick={() => handleEscolherArquivo(doc.value)}
                    className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-violet-600 px-4 text-sm font-medium text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isApproved
                      ? "Documento aprovado"
                      : isUploading && selectedTipo === doc.value
                      ? "A enviar…"
                      : hasDocument
                        ? "Substituir arquivo"
                        : "Enviar arquivo"}
                  </button>
                </section>
              );
            })}
          </div>

          {formError ? (
            <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {formError}
            </div>
          ) : null}
          {formSuccess ? (
            <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              {formSuccess}
            </div>
          ) : null}
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-zinc-900">
            Histórico de envios
          </div>
          {isLoading ? (
            <p className="mt-3 text-sm text-zinc-500">A carregar…</p>
          ) : items.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-600">
              Ainda não enviou documentos.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-zinc-100">
              {items.map((d) => (
                <li
                  key={d.id}
                  className="flex flex-col gap-2 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-zinc-900 truncate">
                      {d.titulo || tipoLabel(d.tipo)}
                    </div>
                    <div className="mt-0.5 text-xs text-zinc-500">
                      {d.nome_arquivo_original} · {tipoLabel(d.tipo)} ·{" "}
                      {new Date(d.created_at).toLocaleString("pt-PT", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </div>
                    {d.status === "rejeitado" && d.motivo_rejeicao ? (
                      <div className="mt-1 text-xs text-red-700">
                        Motivo: {d.motivo_rejeicao}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={`inline-flex rounded-md px-2.5 py-1 text-xs font-medium ring-1 ${documentStatusClass(d.status)}`}
                    >
                      {documentStatusLabel(d.status)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
