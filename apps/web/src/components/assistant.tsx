"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Icon } from "@stayflow/ui";
import { HOST_LAUNCH_PRICE, PACKS, PRODUCTS, type ProductId } from "@/lib/catalog";
import { HOST_CHECKOUT_URL } from "@/lib/t";
import { track } from "@/lib/analytics";
import { recommend, type AssistantAction, type Pain, type Recommendation, type Scale } from "@/lib/assistant/core";
import { usd } from "@/lib/pricing";
import { fmt } from "@/i18n";
import { useMessages } from "@/i18n/client";
import { useCart } from "./cart";
import { NotifyButton } from "./client";
import { useLaunchOn } from "./launch";
import { btnGhost, btnPrimary } from "./styles";

type Step = "start" | "kind" | "notready" | "scale" | "pain" | "done";
type Kind = "rental" | "hotel" | "hostel" | "cabins";
interface Bubble {
  id: number;
  role: "bot" | "user";
  text: string;
  rec?: Recommendation & { pain: Pain; scale: Scale };
  actions?: AssistantAction[];
  notify?: string;
}

const SEEN_KEY = "stayflow-assistant-seen-v1";
const short = (id: ProductId) => PRODUCTS[id].name.replace("Stayflow ", "");

/**
 * The shop assistant: welcomes the visitor and walks them to the right app and the cart.
 * Two layers: a guided mode that always works (rule-based, no AI), and free-text chat when the server has the AI configured.
 * It never changes the cart by itself: every offer is a button the visitor taps.
 */
export function Assistant() {
  const { m } = useMessages();
  const a = m.assistant;
  const cart = useCart();
  const router = useRouter();
  const launchOn = useLaunchOn();
  const [open, setOpen] = useState(false);
  const [teaser, setTeaser] = useState(false);
  const [ai, setAi] = useState<boolean | null>(null);
  const [step, setStep] = useState<Step>("start");
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const idRef = useRef(0);
  const endRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const opened = useRef(false);

  const push = useCallback((b: Omit<Bubble, "id">) => setBubbles((l) => [...l, { ...b, id: ++idRef.current }]), []);

  // A small, one-time nudge: never opens the chat by itself, and never comes back in the same visit.
  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN_KEY) === "1";
    } catch {
      /* private mode: show it once per page load */
    }
    if (seen) return;
    const t = window.setTimeout(() => !opened.current && setTeaser(true), 5_000);
    return () => window.clearTimeout(t);
  }, []);

  const markSeen = () => {
    setTeaser(false);
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* fine */
    }
  };

  const openChat = () => {
    setOpen(true);
    markSeen();
    if (!opened.current) {
      opened.current = true;
      track("assistant_open", {});
      push({ role: "bot", text: a.welcome });
      fetch("/api/assistant", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : { ai: false }))
        .then((j: { ai?: boolean }) => setAi(Boolean(j.ai)))
        .catch(() => setAi(false));
    }
  };

  useEffect(() => {
    const onOpen = () => openChat();
    window.addEventListener("stayflow:open-assistant", onOpen);
    return () => window.removeEventListener("stayflow:open-assistant", onOpen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [bubbles, busy, open]);

  // ---- guided mode
  const startFlow = () => {
    push({ role: "user", text: a.start });
    push({ role: "bot", text: a.qKind });
    setStep("kind");
  };
  const chooseKind = (k: Kind) => {
    push({ role: "user", text: a.kind[k] });
    if (k === "rental") {
      push({ role: "bot", text: a.qScale });
      setStep("scale");
      return;
    }
    // Hotels, hostels and cabins are not on sale yet: say so, and let the visitor leave an email to be told.
    const id = k === "hotel" ? "hotels" : k === "hostel" ? "hostels" : "cabins";
    push({ role: "bot", text: `${fmt(a.kindNotReady, { kind: a.kind[k].toLowerCase() })}\n${a.kindNotifyHint}`, notify: id });
    setStep("notready");
  };
  const continueRentals = () => {
    push({ role: "user", text: a.kindContinue });
    push({ role: "bot", text: a.qScale });
    setStep("scale");
  };
  const scaleRef = useRef<Scale>("one");
  const chooseScale = (s: Scale) => {
    scaleRef.current = s;
    push({ role: "user", text: a.scale[s] });
    push({ role: "bot", text: a.qPain });
    setStep("pain");
  };
  const choosePain = (p: Pain) => {
    const s = scaleRef.current;
    push({ role: "user", text: a.pain[p] });
    const rec = recommend(s, p, launchOn);
    track("assistant_recommend", { items: rec.ids, pain: p, scale: s });
    push({ role: "bot", text: a.recIntro, rec: { ...rec, pain: p, scale: s } });
    setStep("done");
  };
  const restart = () => {
    setStep("start");
    push({ role: "bot", text: a.welcome });
  };
  const quick = (i: number) => {
    const idx = [0, 1, 3][i]!;
    const item = m.funnel.faq.items[idx];
    if (!item) return;
    push({ role: "user", text: a.quick[i]! });
    push({ role: "bot", text: item.a });
  };

  // ---- actions (always confirmed by a tap)
  const payNote = HOST_CHECKOUT_URL ? a.payLive : a.payNote;
  const apply = (act: AssistantAction) => {
    if (act.type === "add_apps") {
      act.ids.forEach((id) => cart.add(id));
      track("assistant_add", { items: act.ids });
      push({ role: "bot", text: `${a.added} ${payNote}` });
    } else if (act.type === "set_pack") {
      cart.setApps(PACKS[act.pack].apps);
      track("assistant_add", { items: PACKS[act.pack].apps });
      push({ role: "bot", text: `${a.added} ${payNote}` });
    } else if (act.type === "open_cart") {
      setOpen(false);
      cart.setOpen(true);
    } else {
      setOpen(false);
      // Host alone goes straight to the store's secure checkout when it is connected; anything else reviews the order first.
      if (HOST_CHECKOUT_URL && cart.apps.length === 1 && cart.apps[0] === "host") window.open(HOST_CHECKOUT_URL, "_blank", "noopener,noreferrer");
      else router.push("/checkout");
    }
  };

  const actionLabel = (act: AssistantAction): string => {
    if (act.type === "add_apps") return fmt(a.addApps, { names: act.ids.map(short).join(" + ") });
    if (act.type === "set_pack") return a.addPack;
    if (act.type === "open_cart") return a.seeCart;
    return a.checkout;
  };

  // ---- free text (only when the server has the AI configured)
  async function send(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    const history = [...bubbles.filter((b) => b.text), { id: -1, role: "user" as const, text }];
    push({ role: "user", text });
    setBusy(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.slice(-10).map((b) => ({ role: b.role === "bot" ? "assistant" : "user", content: b.text })), cart: cart.apps }),
      });
      if (res.status === 429) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        push({ role: "bot", text: j.error === "busy" ? a.busy : a.slow });
      } else if (!res.ok) {
        push({ role: "bot", text: a.fallback });
        if (res.status === 503) setAi(false);
      } else {
        const j = (await res.json()) as { text: string; actions?: AssistantAction[] };
        push({ role: "bot", text: j.text, actions: j.actions ?? [] });
        track("assistant_message", {});
      }
    } catch {
      push({ role: "bot", text: a.fallback });
    } finally {
      setBusy(false);
    }
  }

  const lastBot = [...bubbles].reverse().find((b) => b.role === "bot");

  return (
    <>
      {!open && (
        <div className="fixed bottom-24 right-4 z-[55] flex flex-col items-end gap-2 sm:bottom-6">
          {teaser && (
            <div className="anim-in fx-card flex items-center gap-2 rounded-2xl py-2 pl-4 pr-2 text-sm shadow-xl" role="status">
              <button type="button" onClick={openChat} className="font-medium">{a.teaser}</button>
              <button type="button" onClick={markSeen} aria-label={a.close} className="flex h-6 w-6 items-center justify-center rounded-full text-muted hover:text-fg"><Icon name="close" className="h-3.5 w-3.5" /></button>
            </div>
          )}
          <button type="button" onClick={openChat} aria-label={a.open} className={`${btnPrimary} !h-14 !w-14 !rounded-full !p-0 shadow-2xl`}>
            <Icon name="message" className="h-6 w-6" />
          </button>
        </div>
      )}

      {open && (
        <section role="dialog" aria-label={a.title} className="anim-in fixed inset-x-3 bottom-24 z-[65] flex max-h-[min(640px,calc(100dvh-7rem))] flex-col overflow-hidden rounded-3xl border border-line bg-bg shadow-2xl sm:inset-x-auto sm:bottom-6 sm:right-4 sm:w-[390px]">
          <header className="flex items-center gap-3 border-b border-line bg-surface px-4 py-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-accent"><Icon name="sparkles" className="h-[18px] w-[18px]" /></span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="text-sm font-semibold">{a.title}</p>
              <p className="text-xs text-muted">{ai ? a.subtitleAi : a.subtitleGuided}</p>
            </div>
            <button ref={closeRef} type="button" onClick={() => setOpen(false)} aria-label={a.close} className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-muted transition hover:text-fg"><Icon name="close" className="h-4 w-4" /></button>
          </header>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
            {bubbles.map((b) => (
              <div key={b.id} className={b.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div className={`max-w-[88%] space-y-3 rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${b.role === "user" ? "bg-accent text-onaccent" : "border border-line bg-surface"}`}>
                  <p className="whitespace-pre-line">{b.text}</p>
                  {b.rec && <RecCard rec={b.rec} onAdd={(act) => apply(act)} />}
                  {b.notify && <NotifyButton id={b.notify} label={m.funnel.notifyCat} className="w-full" />}
                  {b.actions && b.actions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {b.actions.map((act, i) => (
                        <button key={i} type="button" onClick={() => apply(act)} className={`${btnPrimary} !px-3.5 !py-2 !text-xs`}>{actionLabel(act)}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {busy && <p className="text-xs text-muted" role="status">{a.thinking}</p>}

            {/* what the visitor can tap next */}
            {!busy && lastBot && lastBot.id === bubbles[bubbles.length - 1]?.id && (
              <div className="flex flex-wrap gap-2 pt-1">
                {step === "start" && <button type="button" onClick={startFlow} className={`${btnPrimary} !px-4 !py-2 !text-sm`}>{a.start}</button>}
                {step === "kind" && (["rental", "hotel", "hostel", "cabins"] as Kind[]).map((k) => <Chip key={k} onClick={() => chooseKind(k)}>{a.kind[k]}</Chip>)}
                {step === "notready" && <button type="button" onClick={continueRentals} className={`${btnPrimary} !px-4 !py-2 !text-sm`}>{a.kindContinue}</button>}
                {step === "scale" && (["one", "few", "many"] as Scale[]).map((s) => <Chip key={s} onClick={() => chooseScale(s)}>{a.scale[s]}</Chip>)}
                {step === "pain" && (["bookings", "guests", "cleaning", "profit"] as Pain[]).map((p) => <Chip key={p} onClick={() => choosePain(p)}>{a.pain[p]}</Chip>)}
                {step === "done" && (
                  <>
                    <button type="button" onClick={() => apply({ type: "open_checkout" })} className={`${btnGhost} !px-3.5 !py-2 !text-xs`}>{a.checkout}</button>
                    <Chip onClick={restart}>{a.again}</Chip>
                  </>
                )}
              </div>
            )}
            {(step === "start" || step === "done") && !busy && (
              <div className="pt-2">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{a.quickTitle}</p>
                <div className="flex flex-wrap gap-2">{a.quick.map((q, i) => <Chip key={q} onClick={() => quick(i)}>{q}</Chip>)}</div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <footer className="border-t border-line bg-surface px-4 py-3">
            {ai ? (
              <>
                <form onSubmit={send} className="flex gap-2">
                  <input value={input} onChange={(e) => setInput(e.target.value)} maxLength={600} placeholder={a.input} aria-label={a.input} autoComplete="off" className="min-w-0 flex-1 rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm outline-none transition placeholder:text-muted/60 focus:border-accent" />
                  <button disabled={busy || !input.trim()} className={`${btnPrimary} !px-4 !py-2.5 disabled:opacity-50`} aria-label={a.send}><Icon name="arrow" className="h-4 w-4" /></button>
                </form>
                <p className="mt-2 text-[11px] leading-snug text-muted">{a.aiNotice} {a.person}</p>
              </>
            ) : (
              <p className="text-[11px] leading-snug text-muted">{payNote} {a.person}</p>
            )}
          </footer>
        </section>
      )}
    </>
  );
}

function Chip({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="rounded-full border border-accent/40 bg-accent/5 px-3.5 py-1.5 text-xs font-semibold text-accent transition hover:bg-accent hover:text-onaccent">{children}</button>;
}

function RecCard({ rec, onAdd }: { rec: Recommendation & { pain: Pain; scale: Scale }; onAdd: (a: AssistantAction) => void }) {
  const { m } = useMessages();
  const a = m.assistant;
  const act: AssistantAction = rec.pack && rec.ids.length > 1 ? { type: "set_pack", pack: rec.pack } : { type: "add_apps", ids: rec.ids };
  return (
    <div className="space-y-2.5 rounded-xl border border-line bg-bg p-3">
      <ul className="space-y-1.5">
        {rec.ids.map((id) => (
          <li key={id} className="flex items-baseline justify-between gap-3"><span className="font-semibold">{PRODUCTS[id].name}</span><span className="tabular-nums text-muted">{usd(rec.launch && id === "host" ? HOST_LAUNCH_PRICE : PRODUCTS[id].price)}</span></li>
        ))}
      </ul>
      <p className="text-xs leading-snug text-muted">{a.why[rec.pain]}{rec.scale === "many" && rec.ids.includes("host") && rec.pain !== "bookings" ? ` ${a.manyNote}` : ""}</p>
      <p className="flex items-baseline justify-between border-t border-line pt-2 font-semibold"><span>{a.total}{rec.launch ? ` · ${a.withLaunch}` : rec.discount ? ` · ${a.withDiscount}` : ""}</span><span className="font-display text-lg tabular-nums">{usd(rec.total)}</span></p>
      {!rec.discount && !rec.launch && <p className="text-xs text-muted">{a.discountHint}</p>}
      <button type="button" onClick={() => onAdd(act)} className={`${btnPrimary} w-full !py-2.5 !text-sm`}><Icon name="plus" className="h-4 w-4" />{a.add}</button>
    </div>
  );
}
