"use server";

import { requireAdmin } from "@/lib/adminAuth";
import { revalidatePath } from "next/cache";

export type ActionResult = { error: string | null };

export async function responderDuvida(
  duvidaId: string,
  mensagem: string,
): Promise<ActionResult> {
  const m = (mensagem ?? "").trim();
  if (m.length < 1) {
    return { error: "Mensagem vazia." };
  }
  const { supabase, user } = await requireAdmin();

  const { error: insErr } = await supabase.from("duvida_mensagens").insert({
    duvida_id: duvidaId,
    autor_id: user.id,
    autor_tipo: "admin",
    mensagem: m,
  });
  if (insErr) return { error: insErr.message };

  // Marca como respondida, mas não obriga (se já estiver fechada, mantém)
  const { data: cur, error: curErr } = await supabase
    .from("duvidas")
    .select("status")
    .eq("id", duvidaId)
    .maybeSingle();
  if (curErr) return { error: curErr.message };

  if (cur?.status !== "fechada") {
    const { error: upErr } = await supabase
      .from("duvidas")
      .update({ status: "respondida" })
      .eq("id", duvidaId);
    if (upErr) return { error: upErr.message };
  }

  revalidatePath("/admin/duvidas");
  revalidatePath(`/admin/duvidas/${duvidaId}`);
  revalidatePath("/dashboard/duvidas");
  return { error: null };
}

export async function atualizarStatusDuvida(
  duvidaId: string,
  status: "aberta" | "respondida" | "fechada",
): Promise<ActionResult> {
  if (!["aberta", "respondida", "fechada"].includes(status)) {
    return { error: "Status inválido." };
  }
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("duvidas")
    .update({ status })
    .eq("id", duvidaId);
  if (error) return { error: error.message };
  revalidatePath("/admin/duvidas");
  revalidatePath(`/admin/duvidas/${duvidaId}`);
  revalidatePath("/dashboard/duvidas");
  return { error: null };
}

