"use server";

import { requireAdmin } from "@/lib/adminAuth";
import type { CalendarioEventoStatus, CalendarioEventoTipo } from "@/lib/calendario";
import { revalidatePath } from "next/cache";

export type CalendarioEventoInput = {
  titulo: string;
  descricao: string;
  tipo: CalendarioEventoTipo;
  status: CalendarioEventoStatus;
  destaque: boolean;
  data_inicio: string;
  data_fim: string | null;
  cor: string;
};

export type ActionResult = { error: string | null };
export type CreateResult = { id: string | null; error: string | null };

function getAllowedYearRange(now: Date = new Date()) {
  const currentYear = now.getFullYear();
  return { minYear: currentYear - 1, maxYear: currentYear + 5 };
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

function normalizeLocalDateTimeOrThrow(v: string, message: string) {
  const s = (v ?? "").trim();
  const d = s ? parseLocalDateTimeStrict(s) : null;
  if (!d) throw new Error(message);
  return d.toISOString();
}

function normalizeLocalDateTimeOrNull(v: string | null | undefined) {
  const s = (v ?? "").trim();
  if (!s) return null;
  const d = parseLocalDateTimeStrict(s);
  if (!d) throw new Error("Informe uma data de fim válida.");
  return d.toISOString();
}

function validateInput(input: CalendarioEventoInput): string | null {
  if (!input.titulo?.trim()) return "Título é obrigatório.";
  if (!["evento", "prazo", "reuniao", "aula", "feriado", "aviso"].includes(input.tipo)) {
    return "Tipo inválido.";
  }
  if (!["rascunho", "publicado"].includes(input.status)) {
    return "Status inválido.";
  }
  if (!input.data_inicio?.trim()) return "Informe uma data de início válida.";

  const start = parseLocalDateTimeStrict(input.data_inicio);
  if (!start) return "Informe uma data de início válida.";

  if (input.data_fim?.trim()) {
    const end = parseLocalDateTimeStrict(input.data_fim);
    if (!end) return "Informe uma data de fim válida.";
    if (end.getTime() < start.getTime()) {
      return "A data de fim não pode ser anterior à data de início.";
    }
  }

  return null;
}

export async function criarEvento(
  input: CalendarioEventoInput,
): Promise<CreateResult> {
  const v = validateInput(input);
  if (v) return { id: null, error: v };

  const { supabase, user } = await requireAdmin();
  try {
    const payload = {
      titulo: input.titulo.trim(),
      descricao: input.descricao?.trim() ? input.descricao.trim() : null,
      tipo: input.tipo,
      status: input.status,
      destaque: !!input.destaque,
      data_inicio: normalizeLocalDateTimeOrThrow(
        input.data_inicio,
        "Informe uma data de início válida.",
      ),
      data_fim: normalizeLocalDateTimeOrNull(input.data_fim),
      cor: input.cor?.trim() ? input.cor.trim() : null,
      criado_por: user.id,
    };

    const { data, error } = await supabase
      .from("calendario_eventos")
      .insert(payload)
      .select("id")
      .maybeSingle();

    if (error) return { id: null, error: error.message };
    if (!data?.id) return { id: null, error: "Falha ao criar evento." };

    revalidatePath("/admin/calendario");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/calendario");
    return { id: data.id, error: null };
  } catch (err) {
    return { id: null, error: err instanceof Error ? err.message : "Erro ao criar evento." };
  }
}

export async function atualizarEvento(
  eventoId: string,
  input: CalendarioEventoInput,
): Promise<ActionResult> {
  const v = validateInput(input);
  if (v) return { error: v };
  const { supabase } = await requireAdmin();

  try {
    const payload = {
      titulo: input.titulo.trim(),
      descricao: input.descricao?.trim() ? input.descricao.trim() : null,
      tipo: input.tipo,
      status: input.status,
      destaque: !!input.destaque,
      data_inicio: normalizeLocalDateTimeOrThrow(
        input.data_inicio,
        "Informe uma data de início válida.",
      ),
      data_fim: normalizeLocalDateTimeOrNull(input.data_fim),
      cor: input.cor?.trim() ? input.cor.trim() : null,
    };

    const { error } = await supabase
      .from("calendario_eventos")
      .update(payload)
      .eq("id", eventoId);
    if (error) return { error: error.message };

    revalidatePath("/admin/calendario");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/calendario");
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao atualizar evento." };
  }
}

export async function excluirEvento(eventoId: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("calendario_eventos")
    .delete()
    .eq("id", eventoId);
  if (error) return { error: error.message };
  revalidatePath("/admin/calendario");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/calendario");
  return { error: null };
}

export async function publicarEvento(eventoId: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("calendario_eventos")
    .update({ status: "publicado" })
    .eq("id", eventoId);
  if (error) return { error: error.message };
  revalidatePath("/admin/calendario");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/calendario");
  return { error: null };
}

export async function voltarParaRascunhoEvento(
  eventoId: string,
): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("calendario_eventos")
    .update({ status: "rascunho" })
    .eq("id", eventoId);
  if (error) return { error: error.message };
  revalidatePath("/admin/calendario");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/calendario");
  return { error: null };
}

