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
      <div className="flex flex-col items-start gap-3 px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6 sm:px-6 sm:py-4">
        <div className="flex w-full min-w-0 items-start gap-3">
          <span
            className={
              isDark
                ? "h-5 w-1 shrink-0 rounded-full bg-violet-400 shadow-[0_0_16px_rgba(139,92,246,0.45)]"
                : "h-5 w-1 shrink-0 rounded-full bg-violet-600"
            }
          />
          <div className="min-w-0 flex-1">
            <div
              className={
                isDark
                  ? "truncate text-base font-semibold tracking-tight text-slate-50 sm:text-lg"
                  : "truncate text-base font-semibold tracking-tight text-zinc-950 sm:text-lg"
              }
            >
              {title}
            </div>
            {subtitle ? (
              <div
                className={
                  isDark
                    ? "mt-0.5 text-xs text-slate-400 sm:text-sm"
                    : "mt-0.5 text-xs text-zinc-600 sm:text-sm"
                }
              >
                {subtitle}
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex min-w-0 items-center gap-3 self-end text-right sm:mt-0.5 sm:max-w-sm sm:self-auto">
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
