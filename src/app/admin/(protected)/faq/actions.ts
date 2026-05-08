"use server";

import { requireAdmin } from "@/lib/adminAuth";
import { revalidatePath } from "next/cache";

export type ActionResult = { error: string | null };
export type FaqInput = {
  pergunta: string;
  resposta: string;
  categoria: string;
  ativo: boolean;
  ordem: number;
};

function normalize(input: FaqInput) {
  return {
    pergunta: input.pergunta.trim(),
    resposta: input.resposta.trim(),
    categoria: input.categoria.trim() ? input.categoria.trim() : null,
    ativo: !!input.ativo,
    ordem: Number.isFinite(input.ordem) ? Math.trunc(input.ordem) : 0,
  };
}

export async function criarFaq(input: FaqInput): Promise<ActionResult> {
  const p = normalize(input);
  if (!p.pergunta) return { error: "Pergunta é obrigatória." };
  if (!p.resposta) return { error: "Resposta é obrigatória." };
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("faq").insert(p);
  if (error) return { error: error.message };
  revalidatePath("/admin/faq");
  revalidatePath("/dashboard/duvidas");
  return { error: null };
}

export async function atualizarFaq(
  id: string,
  input: FaqInput,
): Promise<ActionResult> {
  const p = normalize(input);
  if (!p.pergunta) return { error: "Pergunta é obrigatória." };
  if (!p.resposta) return { error: "Resposta é obrigatória." };
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("faq").update(p).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/faq");
  revalidatePath("/dashboard/duvidas");
  return { error: null };
}

export async function excluirFaq(id: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("faq").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/faq");
  revalidatePath("/dashboard/duvidas");
  return { error: null };
}

export async function setFaqAtivo(id: string, ativo: boolean): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("faq").update({ ativo: !!ativo }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/faq");
  revalidatePath("/dashboard/duvidas");
  return { error: null };
}

export async function setFaqOrdem(id: string, ordem: number): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const n = Number.isFinite(ordem) ? Math.trunc(ordem) : 0;
  const { error } = await supabase.from("faq").update({ ordem: n }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/faq");
  revalidatePath("/dashboard/duvidas");
  return { error: null };
}

