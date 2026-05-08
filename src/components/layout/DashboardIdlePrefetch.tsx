"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

const DASHBOARD_PREFETCH_PATHS = [
  "/dashboard",
  "/dashboard/docs",
  "/dashboard/avisos",
  "/dashboard/calendario",
  "/dashboard/duvidas",
] as const;

function scheduleWhenIdle(fn: () => void): (() => void) | void {
  if (typeof window === "undefined") {
    return;
  }
  const w = window;
  if ("requestIdleCallback" in w && typeof w.requestIdleCallback === "function") {
    const id = w.requestIdleCallback(fn, { timeout: 2000 });
    return () => w.cancelIdleCallback(id);
  }
  const id = w.setTimeout(fn, 1);
  return () => w.clearTimeout(id);
}

/**
 * Uma execução após mount, em idle, para antecipar os chunks das rotas do menu.
 * router.prefetch() corre dentro do callback agendado (requestIdleCallback ou setTimeout).
 */
export function DashboardIdlePrefetch() {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;

  useEffect(() => {
    const cancel = scheduleWhenIdle(() => {
      for (const path of DASHBOARD_PREFETCH_PATHS) {
        void routerRef.current.prefetch(path);
      }
    });

    return () => {
      if (typeof cancel === "function") {
        cancel();
      }
    };
    // Apenas no mount do shell do dashboard
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
