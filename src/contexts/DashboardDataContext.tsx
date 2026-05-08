"use client";

import { getSupabaseClient } from "@/lib/supabaseClient";
import {
  fetchDocumentosResumo,
  loadAlunoEDocumentos,
  type AlunoRow,
} from "@/lib/loadDashboardData";
import {
  DOCUMENTOS_META_TOTAL,
  resumoDocumentosParaDashboard,
  type DocumentoResumo,
} from "@/lib/documents";
import { isDashboardPerfEnabled } from "@/lib/dashboardPerf";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type AlunoDocumentosResumo = ReturnType<
  typeof resumoDocumentosParaDashboard
>;

type DashboardDataContextValue = {
  aluno: AlunoRow | null;
  documentos: DocumentoResumo[];
  resumo: AlunoDocumentosResumo;
  isLoading: boolean;
  loadError: string | null;
  docsError: string | null;
  userId: string | null;
  /** Atualiza só o resumo de documentos (ex.: após upload em /docs) */
  refreshDocumentos: () => Promise<void>;
};

const DashboardDataContext = createContext<DashboardDataContextValue | null>(
  null,
);

export function useDashboardData() {
  const ctx = useContext(DashboardDataContext);
  if (!ctx) {
    throw new Error("useDashboardData must be used within DashboardDataProvider");
  }
  return ctx;
}

/**
 * Uso na Sidebar (fora de erro estrito) — não rebenta se contexto faltar
 */
export function useDashboardDataOptional() {
  return useContext(DashboardDataContext);
}

export function DashboardDataProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;

  const [aluno, setAluno] = useState<AlunoRow | null>(null);
  const [documentos, setDocumentos] = useState<DocumentoResumo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [docsError, setDocsError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const resumo = useMemo(
    () => resumoDocumentosParaDashboard(documentos, DOCUMENTOS_META_TOTAL),
    [documentos],
  );

  const runInitialLoad = useCallback(async () => {
    const perf = isDashboardPerfEnabled();
    if (perf) {
      // eslint-disable-next-line no-console
      console.time("DashboardProvider:boot (auth+aluno+docs)");
    }
    setLoadError(null);
    setDocsError(null);
    setIsLoading(true);
    const supabase = getSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      setLoadError(userError.message);
      setIsLoading(false);
      if (perf) {
        // eslint-disable-next-line no-console
        console.timeEnd("DashboardProvider:boot (auth+aluno+docs)");
      }
      return;
    }
    if (!user) {
      routerRef.current.replace("/login?next=/dashboard");
      setIsLoading(false);
      if (perf) {
        // eslint-disable-next-line no-console
        console.timeEnd("DashboardProvider:boot (auth+aluno+docs)");
      }
      return;
    }

    setUserId(user.id);
    const result = await loadAlunoEDocumentos(supabase, user);
    setAluno(result.aluno);
    setDocumentos(result.documentos);
    setLoadError(result.loadError);
    setDocsError(result.docsError);
    setIsLoading(false);
    if (perf) {
      // eslint-disable-next-line no-console
      console.timeEnd("DashboardProvider:boot (auth+aluno+docs)");
    }
  }, []);

  // Boot único após o mount: runInitialLoad é estável (useCallback []).
  useEffect(() => {
    void runInitialLoad();
    // Não reexecuta em mudança de rota: não listar runInitialLoad para evitar confusão com Strict Mode
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshDocumentos = useCallback(async () => {
    if (!userId) {
      return;
    }
    const supabase = getSupabaseClient();
    const { documentos: next, error } = await fetchDocumentosResumo(
      supabase,
      userId,
    );
    if (error) {
      setDocsError(error);
      return;
    }
    setDocumentos(next);
    setDocsError(null);
  }, [userId]);

  const value = useMemo(
    () => ({
      aluno,
      documentos,
      resumo,
      isLoading,
      loadError,
      docsError,
      userId,
      refreshDocumentos,
    }),
    [
      aluno,
      documentos,
      resumo,
      isLoading,
      loadError,
      docsError,
      userId,
      refreshDocumentos,
    ],
  );

  return (
    <DashboardDataContext.Provider value={value}>
      {children}
    </DashboardDataContext.Provider>
  );
}
