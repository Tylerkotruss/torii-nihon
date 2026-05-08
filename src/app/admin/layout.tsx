import type { ReactNode } from "react";

/**
 * Shell partilhado por /admin (incl. /admin/access-denied).
 * Área exigindo admin fica em (protected)/layout.tsx.
 */
export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_15%_0%,rgba(139,92,246,0.18),transparent_55%),radial-gradient(900px_520px_at_85%_20%,rgba(59,130,246,0.14),transparent_55%),linear-gradient(to_bottom,#070a12,#050814)] text-slate-100">
      {children}
    </div>
  );
}
