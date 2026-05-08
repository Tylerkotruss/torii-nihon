export default function AdminProtectedLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 rounded-lg bg-white/[0.06]" />
      <div className="h-4 w-72 max-w-full rounded-md bg-white/[0.04]" />
      <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
        <div className="space-y-3">
          <div className="h-4 w-full rounded bg-white/[0.05]" />
          <div className="h-4 w-[92%] rounded bg-white/[0.04]" />
          <div className="h-4 w-[78%] rounded bg-white/[0.04]" />
        </div>
      </div>
    </div>
  );
}
