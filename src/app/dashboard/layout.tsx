import type { ReactNode } from "react";
import { DashboardAppShell } from "@/components/layout/DashboardAppShell";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardAppShell>{children}</DashboardAppShell>;
}

