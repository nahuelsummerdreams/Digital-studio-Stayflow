"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "@stayflow/auth";
import { POPULAR_TOPICS, STRONG_SCORE, helpTopic, matchHelp, useI18n, type HelpTopic } from "@stayflow/i18n";
import { Icon, buttonClass, cardClass, ghostButtonClass, inputClass } from "@stayflow/ui";

type Msg =
  | { kind: "user"; text: string }
  | { kind: "topic"; topic: HelpTopic; others: HelpTopic[] }
  | { kind: "ai"; text: string }
  | { kind: "note"; text: string; chips: boolean };

const SUPPORT_URL = process.env.NEXT_PUBLIC_SUPPORT_URL;

/**
 * "How do I…?" help. It first looks the question up in the app's own how-to topics (free, instant, always available).
 * If the question is not covered and the AI is switched on (server key + daily cap), the AI answers using ONLY those topics.
 * It never sees the user's data and cannot change anything.
 */
export function HelpChat() {
  const { t, locale } = useI18n();
  const { client } = useAccount();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [aiOn, setAiOn] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Is the AI part switched on? (A key on the server; the answer carries no secret.)
  useEffect(() => {
    let alive = true;
    fetch("/api/help")
      .then((r) => (r.ok ? r.json() : { ai: false }))
      .then((j: { ai?: boolean }) => alive && setAiOn(Boolean(j.ai)))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [msgs, busy]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const popular = POPULAR_TOPICS.map((id) => helpTopic(locale, id));

  function showTopic(topic: HelpTopic, others: HelpTopic[] = []) {
    setMsgs((m) => [...m, { kind: "topic", topic, others }]);
  }

  async function ask(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    setInput("");
    setMsgs((m) => [...m, { kind: "user", text: q }]);
    const found = matchHelp(locale, q, 3);
    const best = found[0];
    // A confident match is answered from the topics: instant and free.
    if (best && best.score >= STRONG_SCORE) {
      showTopic(best.topic, found.slice(1).map((f) => f.topic));
      return;
    }
    if (!aiOn) {
      if (best) showTopic(best.topic, found.slice(1).map((f) => f.topic));
      else setMsgs((m) => [...m, { kind: "note", text: t("help.ui.noMatch"), chips: true }]);
      return;
    }
    setBusy(true);
    try {
      const { data } = await client.auth.getSession();
      const token = data.session?.access_token;
      const history = [...msgs, { kind: "user" as const, text: q }]
        .filter((m): m is { kind: "user"; text: string } | { kind: "ai"; text: string } => m.kind === "user" || m.kind === "ai")
        .map((m) => ({ role: m.kind === "user" ? ("user" as const) : ("assistant" as const), content: m.text }));
      const res = await fetch("/api/help", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${token ?? ""}` }, body: JSON.stringify({ locale, messages: history }) });
      if (res.status === 429) {
        setMsgs((m) => [...m, { kind: "note", text: t("help.ui.limit"), chips: true }]);
      } else if (!res.ok) {
        throw new Error(String(res.status));
      } else {
        const j = (await res.json()) as { reply: string };
        setMsgs((m) => [...m, { kind: "ai", text: j.reply }]);
      }
    } catch {
      if (best) showTopic(best.topic, found.slice(1).map((f) => f.topic));
      else setMsgs((m) => [...m, { kind: "note", text: t("help.ui.aiError"), chips: true }]);
    } finally {
      setBusy(false);
    }
  }

  function go(route: string) {
    router.push(route);
    if (window.matchMedia("(max-width: 639px)").matches) setOpen(false);
  }

  const chips = (
    <div className="flex flex-wrap gap-2">
      {popular.map((p) => (
        <button key={p.id} type="button" onClick={() => showTopic(p)} className="rounded-full border border-line bg-surface/50 px-3 py-1.5 text-left text-xs text-muted transition hover:border-accent/60 hover:text-fg">
          {p.title}
        </button>
      ))}
    </div>
  );

  return (
    <>
      {/* The wrapper does the fixed positioning: the theme's button class sets its own `position`. */}
      <div className="fixed bottom-4 right-4 z-[60] sm:bottom-6 sm:right-6">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? t("help.ui.close") : t("help.ui.open")}
          aria-expanded={open}
          className="fx-btn flex h-12 w-12 items-center justify-center rounded-full text-onaccent shadow-2xl"
        >
          <Icon name={open ? "close" : "message"} className="h-5 w-5" />
        </button>
      </div>

      {open && (
        <div className="fixed bottom-20 right-4 z-[60] w-[min(24rem,calc(100vw-2rem))] sm:bottom-24 sm:right-6">
        <div role="dialog" aria-label={t("help.ui.title")} className={`${cardClass} flex max-h-[min(34rem,calc(100dvh-7rem))] w-full flex-col !p-0 shadow-2xl`}>
          <header className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="font-display text-base">{t("help.ui.title")}</h2>
            <button type="button" onClick={() => setOpen(false)} aria-label={t("help.ui.close")} className="text-muted transition hover:text-fg">
              <Icon name="close" className="h-4 w-4" />
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3 text-sm" aria-live="polite">
            <p className="text-muted">{t("help.ui.hello")}</p>
            {msgs.length === 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">{t("help.ui.popular")}</p>
                {chips}
              </div>
            )}
            {msgs.map((m, i) => {
              if (m.kind === "user") {
                return (
                  <p key={i} className="ml-8 rounded-2xl rounded-br-md bg-accent/15 px-3 py-2">
                    {m.text}
                  </p>
                );
              }
              if (m.kind === "note") {
                return (
                  <div key={i} className="space-y-2">
                    <p className="text-muted">{m.text}</p>
                    {m.chips && chips}
                  </div>
                );
              }
              if (m.kind === "ai") {
                return (
                  <div key={i} className="mr-4 space-y-1.5 rounded-2xl rounded-bl-md border border-line bg-surface/60 px-3 py-2">
                    <p className="whitespace-pre-line">{m.text}</p>
                    <p className="text-[11px] text-muted">{t("help.ui.aiLabel")}</p>
                    {SUPPORT_URL && (
                      <a className="text-[11px] text-accent underline-offset-4 hover:underline" href={SUPPORT_URL} target="_blank" rel="noopener noreferrer">
                        {t("help.ui.contact")}
                      </a>
                    )}
                  </div>
                );
              }
              return (
                <div key={i} className="mr-4 space-y-2 rounded-2xl rounded-bl-md border border-line bg-surface/60 px-3 py-3">
                  <p className="font-medium">{m.topic.title}</p>
                  <ol className="list-decimal space-y-1 pl-5 text-muted">
                    {m.topic.steps.map((s, k) => (
                      <li key={k}>{s}</li>
                    ))}
                  </ol>
                  {m.topic.route && (
                    <button type="button" onClick={() => go(m.topic.route!)} className={`${buttonClass} !px-3 !py-2 text-xs`}>
                      {t("help.ui.goThere")}
                    </button>
                  )}
                  {m.others.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <p className="text-[11px] uppercase tracking-wide text-muted">{t("help.ui.related")}</p>
                      <div className="flex flex-wrap gap-2">
                        {m.others.map((o) => (
                          <button key={o.id} type="button" onClick={() => showTopic(o)} className="rounded-full border border-line px-2.5 py-1 text-left text-[11px] text-muted transition hover:border-accent/60 hover:text-fg">
                            {o.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {busy && <p className="text-muted">{t("help.ui.thinking")}</p>}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              void ask(input);
            }}
            className="flex gap-2 border-t border-line p-3"
          >
            <input ref={inputRef} className={`${inputClass} !mt-0 flex-1`} value={input} onChange={(e) => setInput(e.target.value)} placeholder={t("help.ui.placeholder")} maxLength={300} aria-label={t("help.ui.placeholder")} />
            <button type="submit" className={`${ghostButtonClass} shrink-0`} disabled={busy || input.trim() === ""}>
              {t("help.ui.send")}
            </button>
          </form>
        </div>
        </div>
      )}
    </>
  );
}
