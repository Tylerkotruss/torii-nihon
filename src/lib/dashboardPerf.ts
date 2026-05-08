/**
 * Ative métricas no console: NEXT_PUBLIC_DASH_PERF=1 (dev ou build local).
 * Desative omitindo a variável ou =0.
 */
export const isDashboardPerfEnabled = (): boolean =>
  process.env.NEXT_PUBLIC_DASH_PERF === "1";

export function dashTimeSync<T>(label: string, run: () => T): T {
  const on = isDashboardPerfEnabled();
  if (!on) {
    return run();
  }
  const start = performance.now();
  try {
    return run();
  } finally {
    // eslint-disable-next-line no-console
    console.log(
      `[dash:perf] ${label}: ${(performance.now() - start).toFixed(1)}ms`,
    );
  }
}

export async function dashTimeAsync<T>(
  label: string,
  run: () => Promise<T>,
): Promise<T> {
  const on = isDashboardPerfEnabled();
  if (!on) {
    return run();
  }
  const start = performance.now();
  try {
    return await run();
  } finally {
    // eslint-disable-next-line no-console
    console.log(
      `[dash:perf] ${label}: ${(performance.now() - start).toFixed(1)}ms`,
    );
  }
}
