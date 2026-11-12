"use client";

import { useEffect, useState } from "react";
import { PROMO_PACK_PRICE, promoEndsAt, promoIsOn, type PackId } from "@/lib/catalog";
import { packTotals, usd } from "@/lib/pricing";
import { fmt } from "@/i18n";
import { useMessages } from "@/i18n/client";

/** True while the launch promotion is running. Starts false (same on server and browser), turns on after load, and turns itself off at the deadline. */
export function usePromoOn(): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const end = promoEndsAt();
    const check = () => setOn(promoIsOn(Date.now(), end));
    check();
    if (end === null) return;
    const id = setInterval(check, 15_000);
    return () => clearInterval(id);
  }, []);
  return on;
}

function useLeft(): number {
  const end = promoEndsAt();
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (end === null) return;
    const tick = () => setLeft(Math.max(0, end - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [end]);
  return left;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** hh:mm:ss, or "2d 03:12:45" when it is more than a day away. */
export function Countdown({ className = "" }: { className?: string }) {
  const left = useLeft();
  const s = Math.floor(left / 1000);
  const d = Math.floor(s / 86400);
  const text = `${d > 0 ? `${d}d ` : ""}${pad(Math.floor((s % 86400) / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
  return <span className={`tabular-nums ${className}`} aria-live="off">{text}</span>;
}

/** "hoy a las 23:59" or "el 15 nov a las 23:59", in the visitor's own clock. */
function endLabel(end: number, locale: string, words: { today: string; on: string; at: string }): string {
  const d = new Date(end);
  const sameDay = d.toDateString() === new Date().toDateString();
  const time = d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  return sameDay ? `${words.today} ${words.at} ${time}` : `${words.on} ${d.toLocaleDateString(locale, { day: "numeric", month: "short" }).replace(".", "")} ${words.at} ${time}`;
}

/** The strip at the very top of the page while the promotion lasts. Real deadline, real prices. */
export function PromoBar() {
  const { m, locale } = useMessages();
  const on = usePromoOn();
  const end = promoEndsAt();
  if (!on || end === null) return null;
  return (
    <div role="region" aria-label={m.promo.title} className="relative z-50 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-gradient-to-r from-accent to-accent2 px-4 py-2 text-center text-[13px] font-semibold text-onaccent">
      <span>{m.promo.title}</span>
      <span className="hidden sm:inline">{fmt(m.promo.prices, { a: usd(PROMO_PACK_PRICE.essential), b: usd(PROMO_PACK_PRICE.mega) })}</span>
      <span>{m.promo.ends} {endLabel(end, locale, m.promo.words)} · <Countdown /></span>
      <a href="/#packs" className="rounded-full bg-black/25 px-3 py-0.5 text-xs transition hover:bg-black/40">{m.promo.cta}</a>
    </div>
  );
}

/** The price of a pack: the normal one, or the promotion's (with the normal one crossed out and the time left). */
export function PackPrice({ id }: { id: PackId }) {
  const { m, locale } = useMessages();
  const on = usePromoOn();
  const end = promoEndsAt();
  const regular = packTotals(id);
  const t = on ? packTotals(id, true) : regular;
  const promo = on && t.promoPack === id && end !== null;
  return (
    <>
      {promo && <p className="mt-4 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">{m.promo.title} · {m.promo.ends} {endLabel(end, locale, m.promo.words)}</p>}
      <p className="mt-4 flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1">
        <span className="font-display text-gradient whitespace-nowrap text-4xl tabular-nums">{usd(t.total)}</span>
        <span className="whitespace-nowrap text-sm text-muted line-through">{usd(t.originalTotal)}</span>
      </p>
      <p className="mt-1 text-sm font-medium text-success">{fmt(m.packs.saves, { amount: usd(t.saved) })} · {m.solution.oneTime}</p>
      {promo && (
        <p className="mt-1 text-xs text-muted">{m.promo.normal} {usd(regular.total)} · <Countdown className="font-semibold text-fg" /></p>
      )}
    </>
  );
}
