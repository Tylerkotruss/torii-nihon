"use client";

import { DashboardDataProvider } from "@/contexts/DashboardDataContext";
import { DashboardIdlePrefetch } from "@/components/layout/DashboardIdlePrefetch";
import { Sidebar } from "@/components/layout/Sidebar";
import type { ReactNode } from "react";

export function DashboardAppShell({ children }: { children: ReactNode }) {
  return (
    <DashboardDataProvider>
      <DashboardIdlePrefetch />
      <div className="min-h-screen bg-zinc-50">
        <Sidebar />
        <div className="pl-72">
          <div className="min-h-screen">{children}</div>
        </div>
      </div>
    </DashboardDataProvider>
  );
}
