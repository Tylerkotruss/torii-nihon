"use server";

import { requireAdmin } from "@/lib/adminAuth";
import type { AvisoPublico, AvisoStatus, AvisoTipo } from "@/lib/avisos";
import { revalidatePath } from "next/cache";

export type AvisoInput = {
  titulo: string;
  mensagem: string;
  tipo: AvisoTipo;
  status: AvisoStatus;
  fixado: boolean;
  publicado_em: string | null;
  expira_em: string | null;
  publico: AvisoPublico;
  aluno_ids: string[];
};

export type ActionResult = { error: string | null };
export type CreateAvisoResult = { id: string | null; error: string | null };

function normalizeIsoOrNull(v: string | null | undefined) {
  const s = (v ?? "").trim();
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function validateInput(input: AvisoInput): string | null {
  if (!input.titulo?.trim()) return "Título é obrigatório.";
  if (!input.mensagem?.trim()) return "Mensagem é obrigatória.";
  if (!["informacao", "importante", "urgente"].includes(input.tipo)) {
    return "Tipo inválido.";
  }
  if (!["rascunho", "publicado"].includes(input.status)) {
    return "Status inválido.";
  }
  if (!["todos", "especificos"].includes(input.publico)) {
    return "Público inválido.";
  }
  if (input.publico === "especificos" && input.aluno_ids.length === 0) {
    return "Selecione pelo menos 1 aluno para público 'específicos'.";
  }
  return null;
}

async function syncDestinatarios(avisoId: string, alunoIds: string[]) {
  const { supabase } = await requireAdmin();
  const { error: delErr } = await supabase
    .from("aviso_destinatarios")
    .delete()
    .eq("aviso_id", avisoId);
  if (delErr) {
    return delErr.message;
  }
  if (alunoIds.length === 0) {
    return null;
  }
  const payload = alunoIds.map((aluno_id) => ({ aviso_id: avisoId, aluno_id }));
  const { error: insErr } = await supabase
    .from("aviso_destinatarios")
    .insert(payload);
  if (insErr) {
    return insErr.message;
  }
  return null;
}

export async function criarAviso(input: AvisoInput): Promise<CreateAvisoResult> {
  const v = validateInput(input);
  if (v) return { id: null, error: v };

  const { supabase, user } = await requireAdmin();

  const publicadoEm =
    input.status === "publicado"
      ? normalizeIsoOrNull(input.publicado_em) ?? new Date().toISOString()
      : null;

  const { data, error } = await supabase
    .from("avisos")
    .insert({
      titulo: input.titulo.trim(),
      mensagem: input.mensagem.trim(),
      tipo: input.tipo,
      status: input.status,
      fixado: !!input.fixado,
      publico: input.publico,
      publicado_em: publicadoEm,
      expira_em: normalizeIsoOrNull(input.expira_em),
      criado_por: user.id,
    })
    .select("id")
    .maybeSingle();

  if (error) return { id: null, error: error.message };
  if (!data?.id) return { id: null, error: "Falha ao criar aviso." };

  if (input.publico === "especificos") {
    const syncErr = await syncDestinatarios(data.id, input.aluno_ids);
    if (syncErr) return { id: data.id, error: syncErr };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/avisos");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/avisos");
  return { id: data.id, error: null };
}

export async function atualizarAviso(
  avisoId: string,
  input: AvisoInput,
): Promise<ActionResult> {
  const v = validateInput(input);
  if (v) return { error: v };
  const { supabase } = await requireAdmin();

  const publicadoEm =
    input.status === "publicado"
      ? normalizeIsoOrNull(input.publicado_em) ?? new Date().toISOString()
      : null;

  const { error } = await supabase
    .from("avisos")
    .update({
      titulo: input.titulo.trim(),
      mensagem: input.mensagem.trim(),
      tipo: input.tipo,
      status: input.status,
      fixado: !!input.fixado,
      publico: input.publico,
      publicado_em: publicadoEm,
      expira_em: normalizeIsoOrNull(input.expira_em),
    })
    .eq("id", avisoId);

  if (error) return { error: error.message };

  const syncErr =
    input.publico === "especificos"
      ? await syncDestinatarios(avisoId, input.aluno_ids)
      : await syncDestinatarios(avisoId, []);
  if (syncErr) return { error: syncErr };

  revalidatePath("/admin");
  revalidatePath("/admin/avisos");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/avisos");
  return { error: null };
}

export async function excluirAviso(avisoId: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("avisos").delete().eq("id", avisoId);
  if (error) return { error: error.message };
  revalidatePath("/admin");
  revalidatePath("/admin/avisos");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/avisos");
  return { error: null };
}

export async function publicarAviso(avisoId: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("avisos")
    .update({ status: "publicado", publicado_em: new Date().toISOString() })
    .eq("id", avisoId);
  if (error) return { error: error.message };
  revalidatePath("/admin");
  revalidatePath("/admin/avisos");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/avisos");
  return { error: null };
}

export async function voltarParaRascunho(avisoId: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("avisos")
    .update({ status: "rascunho" })
    .eq("id", avisoId);
  if (error) return { error: error.message };
  revalidatePath("/admin");
  revalidatePath("/admin/avisos");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/avisos");
  return { error: null };
}

