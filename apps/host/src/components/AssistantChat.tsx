"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAccount } from "@stayflow/auth";
import { useI18n } from "@stayflow/i18n";
import { Icon } from "@stayflow/ui";

interface Msg {
  role: "user" | "assistant";
  content: string;
  error?: boolean;
}
const FOCUS = ["@Cronograma", "@Operaciones", "@Ventas", "@Huéspedes", "@Finanzas"] as const;

/** The assistant: a chat that answers with this account's own data. Floating button, opens a panel. */
export function AssistantChat() {
  const { t, locale } = useI18n();
  const { session, org, can } = useAccount();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [msgs, busy, open]);
  if (!session || !org || !can("host")) return null;

  async function ask(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content: q }];
    setMsgs(next);
    setText("");
    setBusy(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session!.access_token}` },
        body: JSON.stringify({ messages: next.filter((m) => !m.error).map(({ role, content }) => ({ role, content })) }),
      });
      const data = (await res.json()) as { reply?: string; remaining?: number; code?: string };
      if (res.ok && data.reply) {
        setMsgs([...next, { role: "assistant", content: data.reply }]);
        if (typeof data.remaining === "number") setRemaining(data.remaining);
      } else {
        const m = data.code === "not_configured" ? t("assistant.notConfigured") : data.code === "limit" ? t("assistant.limit") : t("assistant.generic");
        setMsgs([...next, { role: "assistant", content: m, error: true }]);
      }
    } catch {
      setMsgs([...next, { role: "assistant", content: t("assistant.generic"), error: true }]);
    } finally {
      setBusy(false);
    }
  }
  const submit = (e: FormEvent) => {
    e.preventDefault();
    void ask(text);
  };
  const suggestions = [0, 1, 2].map((i) => t(`assistant.suggestions.${i}` as "assistant.suggestions.0"));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? t("assistant.close") : t("assistant.open")}
        aria-expanded={open}
        className="fx-btn fixed bottom-5 right-5 z-[55] flex h-14 items-center gap-2 rounded-full px-5 text-sm font-semibold text-onaccent shadow-2xl"
      >
        <Icon name={open ? "close" : "sparkles"} className="h-5 w-5" />
        <span className="hidden sm:inline">{t("assistant.title")}</span>
      </button>

      {open && (
        <section role="dialog" aria-label={t("assistant.title")} className="anim-in fixed inset-x-3 bottom-24 top-16 z-[55] border border-accent/30 bg-surface/95 backdrop-blur-xl flex flex-col overflow-hidden rounded-3xl shadow-2xl sm:inset-x-auto sm:right-5 sm:top-auto sm:h-[36rem] sm:w-[25rem]">
          <header className="flex items-center gap-3 border-b border-line px-4 py-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-accent"><Icon name="sparkles" className="h-[18px] w-[18px]" /></span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-base leading-tight">{t("assistant.title")}</p>
              {remaining !== null && <p className="text-[11px] text-muted">{t("assistant.remaining", { count: remaining })}</p>}
            </div>
          </header>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
            <p className="rounded-2xl rounded-tl-md border border-line bg-bg/60 px-3.5 py-3 text-sm leading-relaxed">{t("assistant.hello")}</p>
            {msgs.length === 0 && (
              <ul className="space-y-2">
                {suggestions.map((s) => (
                  <li key={s}><button type="button" onClick={() => void ask(s)} className="w-full rounded-xl border border-line px-3.5 py-2.5 text-left text-sm text-muted transition hover:border-accent/60 hover:text-fg">{s}</button></li>
                ))}
              </ul>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex"}>
                <p className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${m.role === "user" ? "rounded-br-md bg-accent font-medium text-onaccent" : m.error ? "rounded-tl-md border border-danger/40 bg-danger/10 text-danger" : "rounded-tl-md border border-line bg-bg/60"}`}>{m.content}</p>
              </div>
            ))}
            {busy && <p className="text-sm text-muted" role="status"><span className="animate-pulse">{t("assistant.thinking")}</span></p>}
            <div ref={end} />
          </div>

          <div className="border-t border-line px-3 pb-3 pt-2">
            <div className="mb-2 flex flex-wrap gap-1.5" aria-label={t("assistant.focus")}>
              {FOCUS.map((f) => (
                <button key={f} type="button" onClick={() => setText((x) => (x.startsWith("@") ? x.replace(/^@\S+\s*/, `${f} `) : `${f} ${x}`))} className="rounded-full border border-line px-2.5 py-1 text-[11px] text-muted transition hover:border-accent/60 hover:text-accent">{f}</button>
              ))}
            </div>
            <form onSubmit={submit} className="flex items-center gap-2">
              <input value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} placeholder={t("assistant.placeholder")} aria-label={t("assistant.placeholder")} className="min-w-0 flex-1 rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm outline-none placeholder:text-muted/60 focus:border-accent" />
              <button disabled={busy || !text.trim()} aria-label={t("assistant.send")} className="fx-btn flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-onaccent disabled:opacity-50"><Icon name="arrow" className="h-4 w-4" /></button>
            </form>
          </div>
        </section>
      )}
    </>
  );
}
