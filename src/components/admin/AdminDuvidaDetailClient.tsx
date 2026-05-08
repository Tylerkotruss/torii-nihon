"use client";

import { responderDuvida, atualizarStatusDuvida } from "@/app/admin/(protected)/duvidas/actions";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Msg = { id: string; autor_tipo: string; mensagem: string; criado_em: string };

function fmtDateTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function inputBaseClass() {
  return "w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-200 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] outline-none transition-colors placeholder:text-slate-400 focus:border-violet-400/55 focus:ring-2 focus:ring-violet-400/35";
}

export function AdminDuvidaDetailClient({
  duvidaId,
  initialMessages,
  initialStatus,
}: {
  duvidaId: string;
  initialMessages: Msg[];
  initialStatus: string;
}) {
  const router = useRouter();
  const [msgs] = useState<Msg[]>(initialMessages);
  const [status, setStatus] = useState(initialStatus);
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [msgErr, setMsgErr] = useState<string | null>(null);

  const canReply = useMemo(() => status !== "fechada", [status]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setMsgErr(null);
    const m = text.trim();
    if (!m) return;
    setPending(true);
    try {
      const r = await responderDuvida(duvidaId, m);
      if (r.error) {
        setMsgErr(r.error);
        return;
      }
      setText("");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function setStatusRemote(next: "aberta" | "respondida" | "fechada") {
    setMsgErr(null);
    setPending(true);
    try {
      const r = await atualizarStatusDuvida(duvidaId, next);
      if (r.error) {
        setMsgErr(r.error);
        return;
      }
      setStatus(next);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      {msgErr ? (
        <div className="rounded-xl border border-red-500/25 bg-red-950/40 px-4 py-3 text-sm text-red-100">
          {msgErr}
        </div>
      ) : null}

      <section className="rounded-3xl border border-white/10 bg-slate-950/55 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_80px_rgba(0,0,0,0.35)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-semibold text-slate-50">Status</div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => void setStatusRemote("aberta")}
              className="inline-flex h-9 items-center rounded-xl border border-white/10 bg-white/[0.03] px-3 text-xs font-semibold text-slate-200 hover:bg-white/[0.06] disabled:opacity-60"
            >
              Aberta
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => void setStatusRemote("respondida")}
              className="inline-flex h-9 items-center rounded-xl border border-white/10 bg-white/[0.03] px-3 text-xs font-semibold text-slate-200 hover:bg-white/[0.06] disabled:opacity-60"
            >
              Respondida
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => void setStatusRemote("fechada")}
              className="inline-flex h-9 items-center rounded-xl border border-red-400/25 bg-red-500/10 px-3 text-xs font-semibold text-red-100 hover:bg-red-500/15 disabled:opacity-60"
            >
              Fechar
            </button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/55 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_80px_rgba(0,0,0,0.35)]">
        <div className="min-w-0 space-y-3">
          {msgs.length === 0 ? (
            <p className="text-sm text-slate-400">Sem mensagens.</p>
          ) : (
            msgs.map((m) => {
              const fromAdmin = String(m.autor_tipo) === "admin";
              return (
                <div
                  key={m.id}
                  className={
                    fromAdmin
                      ? "flex w-full min-w-0 justify-end"
                      : "flex w-full min-w-0 justify-start"
                  }
                >
                  <div
                    className={
                      fromAdmin
                        ? "min-w-0 max-w-[85%] overflow-hidden rounded-3xl border border-violet-400/25 bg-violet-500/10 px-4 py-3 text-sm text-slate-100 shadow-[0_0_24px_rgba(139,92,246,0.10)] sm:max-w-[80%]"
                        : "min-w-0 max-w-[85%] overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200 sm:max-w-[80%]"
                    }
                  >
                    <div className="whitespace-pre-wrap break-words leading-relaxed [overflow-wrap:anywhere]">
                      {m.mensagem}
                    </div>
                    <div className="mt-2 text-[11px] text-slate-500">
                      {fromAdmin ? "Admin" : "Aluno"} · {fmtDateTime(m.criado_em)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form onSubmit={send} className="mt-6 space-y-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            disabled={!canReply || pending}
            placeholder={
              canReply
                ? "Escreva a resposta…"
                : "Dúvida fechada (não aceita novas mensagens)."
            }
            className={inputBaseClass()}
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!canReply || pending || text.trim().length === 0}
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-blue-600 px-5 text-sm font-semibold text-white shadow-[0_0_34px_rgba(139,92,246,0.26)] transition hover:from-violet-500 hover:via-fuchsia-500 hover:to-blue-500 disabled:opacity-60"
            >
              {pending ? "Enviando…" : "Responder"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

