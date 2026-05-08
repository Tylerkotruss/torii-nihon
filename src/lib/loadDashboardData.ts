import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { DocumentoResumo } from "@/lib/documents";
import { dashTimeAsync } from "@/lib/dashboardPerf";

export type AlunoRow = {
  id: string;
  nome_completo: string | null;
  email: string;
};

export type LoadDashboardResult = {
  aluno: AlunoRow | null;
  documentos: DocumentoResumo[];
  loadError: string | null;
  docsError: string | null;
};

/**
 * Garante linha em alunos (com rascunho se existir) e carrega resumo de documentos.
 * Usar uma vez no layout do dashboard; evitar chamar a cada troca de rota.
 */
export async function loadAlunoEDocumentos(
  supabase: SupabaseClient,
  user: User,
): Promise<LoadDashboardResult> {
  return dashTimeAsync("supabase:loadAlunoEDocumentos", () =>
    loadAlunoEDocumentosCore(supabase, user),
  );
}

async function loadAlunoEDocumentosCore(
  supabase: SupabaseClient,
  user: User,
): Promise<LoadDashboardResult> {
  const selectAluno = async () => {
    const { data, error: selectError } = await supabase
      .from("alunos")
      .select("id, nome_completo, email")
      .eq("id", user.id)
      .maybeSingle();

    if (selectError) {
      return { aluno: null, error: selectError.message } as const;
    }
    return { aluno: data as AlunoRow | null, error: null } as const;
  };

  const { aluno: alunoInicial, error: selectErr } = await selectAluno();
  let aluno = alunoInicial;
  if (selectErr) {
    return {
      aluno: null,
      documentos: [],
      loadError: selectErr,
      docsError: null,
    };
  }

  if (!aluno) {
    if (!user.email) {
      return {
        aluno: null,
        documentos: [],
        loadError: "E-mail do usuário indisponível para sincronizar o perfil.",
        docsError: null,
      };
    }

    let draft: Record<string, unknown> | null = null;
    try {
      const raw = localStorage.getItem("portal.cadastro.draft.v1");
      if (raw) {
        draft = JSON.parse(raw) as Record<string, unknown>;
      }
    } catch (err) {
      console.error("[cadastro] failed to read draft:", err);
    }

    const draftEmail =
      typeof draft?.email === "string" ? draft.email.toLowerCase() : null;
    const userEmail = user.email.toLowerCase();
    const canUseDraft = !!draft && draftEmail === userEmail;

    const normalizedDraft = (() => {
      if (!canUseDraft || !draft) {
        return null;
      }
      const d = { ...draft } as Record<string, unknown>;
      if (typeof d.nome_completo !== "string" && typeof d.nome === "string") {
        d.nome_completo = d.nome;
      }
      delete d.nome;
      return d;
    })();

    const insertPayload = {
      ...(normalizedDraft ?? null),
      id: user.id,
      email: user.email,
    };

    const { error: insertError } = await supabase
      .from("alunos")
      .insert(insertPayload);

    if (insertError) {
      return {
        aluno: null,
        documentos: [],
        loadError: insertError.message,
        docsError: null,
      };
    }

    if (canUseDraft) {
      try {
        localStorage.removeItem("portal.cadastro.draft.v1");
      } catch (err) {
        console.error("[cadastro] failed to clear draft:", err);
      }
    }

    const res = await selectAluno();
    aluno = res.aluno;
    if (res.error) {
      return {
        aluno: null,
        documentos: [],
        loadError: res.error,
        docsError: null,
      };
    }
  }

  if (!aluno) {
    return {
      aluno: null,
      documentos: [],
      loadError: "Não foi possível carregar os dados de cadastro em alunos.",
      docsError: null,
    };
  }

  const { data: docRows, error: docSelectErr } = await supabase
    .from("documentos")
    .select("id, tipo, status, created_at")
    .eq("aluno_id", user.id)
    .order("created_at", { ascending: false });

  if (docSelectErr) {
    return {
      aluno,
      documentos: [],
      loadError: null,
      docsError: docSelectErr.message,
    };
  }

  return {
    aluno,
    documentos: (docRows ?? []) as DocumentoResumo[],
    loadError: null,
    docsError: null,
  };
}

export async function fetchDocumentosResumo(
  supabase: SupabaseClient,
  alunoId: string,
): Promise<{ documentos: DocumentoResumo[]; error: string | null }> {
  return dashTimeAsync("supabase:fetchDocumentosResumo", async () => {
    const { data, error } = await supabase
      .from("documentos")
      .select("id, tipo, status, created_at")
      .eq("aluno_id", alunoId)
      .order("created_at", { ascending: false });

    if (error) {
      return { documentos: [], error: error.message };
    }
    return { documentos: (data ?? []) as DocumentoResumo[], error: null };
  });
}
