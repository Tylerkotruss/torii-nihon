"use server";

import { requireAdmin } from "@/lib/adminAuth";
import { revalidatePath } from "next/cache";

export type ActionResult = { error: string | null };
export type SignedUrlResult = { url: string | null; error: string | null };

export async function gerarUrlDocumento(
  documentoId: string,
): Promise<SignedUrlResult> {
  const { supabase } = await requireAdmin();
  const { data: documento, error: docErr } = await supabase
    .from("documentos")
    .select("storage_bucket, storage_path")
    .eq("id", documentoId)
    .maybeSingle();

  if (docErr) {
    return { url: null, error: docErr.message };
  }
  if (!documento?.storage_bucket || !documento.storage_path) {
    return { url: null, error: "Arquivo indisponível para este documento." };
  }

  const { data, error } = await supabase.storage
    .from(documento.storage_bucket)
    .createSignedUrl(documento.storage_path, 60 * 5);

  if (error) {
    return {
      url: null,
      error: `Não foi possível gerar o link do arquivo: ${error.message}`,
    };
  }

  return { url: data.signedUrl, error: null };
}

export async function aprovarDocumento(documentoId: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const { data: cur, error: curErr } = await supabase
    .from("documentos")
    .select("status")
    .eq("id", documentoId)
    .maybeSingle();
  if (curErr) {
    return { error: curErr.message };
  }
  if (cur?.status === "aprovado") {
    return { error: "Documento já está aprovado (estado final)." };
  }
  const { error } = await supabase
    .from("documentos")
    .update({ status: "aprovado", motivo_rejeicao: null })
    .eq("id", documentoId);

  if (error) {
    return { error: error.message };
  }
  revalidatePath("/admin");
  revalidatePath("/admin/documentos");
  return { error: null };
}

export async function recusarDocumento(
  documentoId: string,
  motivo: string,
): Promise<ActionResult> {
  const m = motivo.trim();
  if (m.length < 3) {
    return { error: "Indique um motivo (mínimo 3 caracteres)." };
  }
  const { supabase } = await requireAdmin();
  const { data: cur, error: curErr } = await supabase
    .from("documentos")
    .select("status")
    .eq("id", documentoId)
    .maybeSingle();
  if (curErr) {
    return { error: curErr.message };
  }
  if (cur?.status === "aprovado") {
    return { error: "Documento aprovado não pode ser recusado (estado final)." };
  }
  const { error } = await supabase
    .from("documentos")
    .update({ status: "rejeitado", motivo_rejeicao: m })
    .eq("id", documentoId);

  if (error) {
    return { error: error.message };
  }
  revalidatePath("/admin");
  revalidatePath("/admin/documentos");
  return { error: null };
}
