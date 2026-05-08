/**
 * Após login, só permite `next` interno sob /dashboard ou /admin (evita open redirect).
 * Sem `next` válido → /dashboard.
 */
export function getSafeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/")) {
    return "/dashboard";
  }
  if (next.startsWith("//") || next.includes(":")) {
    return "/dashboard";
  }
  const pathOnly = next.split("?")[0] ?? next;
  if (
    pathOnly === "/dashboard" ||
    pathOnly.startsWith("/dashboard/") ||
    pathOnly === "/admin" ||
    pathOnly.startsWith("/admin/")
  ) {
    return next;
  }
  return "/dashboard";
}
