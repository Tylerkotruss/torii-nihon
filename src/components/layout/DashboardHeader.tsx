export function DashboardHeader({
  title,
  subtitle,
  showUserSummary = false,
  accountName,
  accountEmail,
  isAccountLoading = false,
  variant = "light",
}: {
  title: string;
  subtitle?: string;
  showUserSummary?: boolean;
  accountName?: string | null;
  accountEmail?: string | null;
  isAccountLoading?: boolean;
  /** `dark`: cabeçalho alinhado à página Assistente (fundo escuro) */
  variant?: "light" | "dark";
}) {
  const isDark = variant === "dark";

  return (
    <header
      className={
        isDark
          ? "border-b border-white/10 bg-slate-950/80 backdrop-blur"
          : "border-b border-zinc-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60"
      }
    >
      <div className="flex items-start justify-between gap-6 px-6 py-4">
        <div className="flex items-start gap-3">
          <span
            className={
              isDark
                ? "h-5 w-1 rounded-full bg-violet-400 shadow-[0_0_16px_rgba(139,92,246,0.45)]"
                : "h-5 w-1 rounded-full bg-violet-600"
            }
          />
          <div className="min-w-0">
            <div
              className={
                isDark
                  ? "text-lg font-semibold tracking-tight text-slate-50"
                  : "text-lg font-semibold tracking-tight text-zinc-950"
              }
            >
              {title}
            </div>
            {subtitle ? (
              <div
                className={
                  isDark
                    ? "mt-0.5 text-sm text-slate-400"
                    : "mt-0.5 text-sm text-zinc-600"
                }
              >
                {subtitle}
              </div>
            ) : null}
          </div>
        </div>
        <div className="mt-0.5 flex min-w-0 max-w-sm items-center gap-3 text-right">
          {showUserSummary ? (
            <div className="min-w-0 flex-1">
              {isAccountLoading ? (
                <div className="space-y-1.5">
                  <div
                    className={
                      isDark
                        ? "ml-auto h-4 w-40 max-w-full animate-pulse rounded bg-white/10"
                        : "ml-auto h-4 w-40 max-w-full animate-pulse rounded bg-zinc-200/80"
                    }
                  />
                  <div
                    className={
                      isDark
                        ? "ml-auto h-3.5 w-52 max-w-full animate-pulse rounded bg-white/[0.07]"
                        : "ml-auto h-3.5 w-52 max-w-full animate-pulse rounded bg-zinc-200/60"
                    }
                  />
                </div>
              ) : (
                <>
                  <div
                    className={
                      isDark
                        ? "truncate text-sm font-semibold text-slate-100"
                        : "truncate text-sm font-semibold text-zinc-900"
                    }
                  >
                    {accountName?.trim() ? accountName : "—"}
                  </div>
                  <div
                    className={
                      isDark
                        ? "mt-0.5 truncate text-xs text-slate-400"
                        : "mt-0.5 truncate text-xs text-zinc-500"
                    }
                    title={accountEmail ?? undefined}
                  >
                    {accountEmail ?? "—"}
                  </div>
                </>
              )}
            </div>
          ) : null}
          <div
            className={
              isDark
                ? "h-8 w-8 shrink-0 rounded-full border border-white/15 bg-white/[0.06]"
                : "h-8 w-8 shrink-0 rounded-full border border-zinc-200 bg-zinc-50"
            }
          />
        </div>
      </div>
    </header>
  );
}
