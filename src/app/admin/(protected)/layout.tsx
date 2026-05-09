import { AdminNav } from "@/components/admin/AdminNav";
import { requireAdmin } from "@/lib/adminAuth";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default async function AdminProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdmin();

  return (
    <>
      <AdminNav />
      <div className="w-full min-w-0 px-4 py-4 sm:px-6 sm:py-6 xl:px-8">
        {children}
      </div>
    </>
  );
}
