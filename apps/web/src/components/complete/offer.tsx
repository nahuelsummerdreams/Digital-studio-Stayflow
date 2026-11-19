"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Icon } from "@stayflow/ui";
import { fmt, plural } from "@/i18n";
import { useMessages } from "@/i18n/client";
import { COMPLETE_CHECKOUT_URL, COMPLETE_PRICE, completeLaunchEndsAt, completeOffer, launchDaysLeft, type CompleteOffer } from "@/lib/complete";
import { saveLead } from "@/lib/leads";
import { btnPrimary } from "../styles";

/**
 * The offer that applies RIGHT NOW. It starts as "launch on" when a launch is configured (so the page does not flash the regular price),
 * is corrected right after load with the real clock, and turns itself off at the deadline.
 */
export function useCompleteOffer(): CompleteOffer & { daysLeft: number } {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  const end = completeLaunchEndsAt();
  // Before the clock is read: assume the launch is on if it is configured, to match the server-rendered page.
  const offer = now === null ? completeOffer(end === null ? Number.POSITIVE_INFINITY : end - 1, end) : completeOffer(now, end);
  return { ...offer, daysLeft: now === null ? 0 : launchDaysLeft(now, end) };
}

const usd = (n: number) => `USD ${n}`;

/** "15 de diciembre", in Argentina time so every visitor reads the same day. */
function endDay(): string {
  const end = completeLaunchEndsAt();
  if (end === null) return "";
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", timeZone: "America/Argentina/Buenos_Aires" }).format(new Date(end));
}

/** The price block: the price that applies now, the regular one struck through, and when the launch ends. Never invents a date. */
export function PriceBlock({ className = "" }: { className?: string }) {
  const { m, locale } = useMessages();
  const p = m.complete.price;
  const offer = useCompleteOffer();
  return (
    <div className={className}>
      {offer.launch && (
        <p className="inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-0.5 rounded-xl border border-[rgb(var(--accent-2)/0.5)] bg-[rgb(var(--accent-2)/0.1)] px-3 py-1.5 text-xs">
          <span aria-hidden className="pulse-lime h-1.5 w-1.5 shrink-0 rounded-full bg-[rgb(var(--accent-2))]" />
          <span className="font-semibold text-[rgb(var(--accent-2))]">{p.badge}</span>
          <span className="text-fg/80">{fmt(p.until, { date: endDay(), regular: usd(COMPLETE_PRICE) })}</span>
          {offer.daysLeft > 0 && <span className="text-fg/60">· {plural(p, "daysLeft", offer.daysLeft, locale)}</span>}
        </p>
      )}
      <p className="mt-4 flex flex-wrap items-baseline gap-x-3">
        <span className="font-display tabular-nums text-6xl md:text-7xl">{usd(offer.price)}</span>
        {offer.launch && <span className="tabular-nums text-2xl text-muted line-through">{usd(offer.regular)}</span>}
      </p>
      <p className="mt-1 text-sm text-muted">{p.oneTime}</p>
    </div>
  );
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * The buy action. With a payment link configured it sends people there. Without one it is honest about it: it only collects the email
 * (the store is not open yet) and says so, instead of pretending to sell.
 */
export function BuyBox({ where }: { where: string }) {
  const { m } = useMessages();
  const p = m.complete.price;
  const offer = useCompleteOffer();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  if (COMPLETE_CHECKOUT_URL) {
    return (
      <a href={COMPLETE_CHECKOUT_URL} target="_blank" rel="noopener noreferrer" className={`${btnPrimary} w-full !py-4 !text-base`} data-where={where}>
        {p.ctaLink} · {usd(offer.price)}
        <Icon name="arrow" className="h-4 w-4" />
      </a>
    );
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!EMAIL.test(email.trim())) return setError(p.errEmail);
    setBusy(true);
    const ok = await saveLead(email, "checkout", { product: "complete", intent: "reserve", price: offer.price, launch: offer.launch, where });
    setBusy(false);
    if (!ok) return setError(p.errSave);
    setDone(email.trim());
  }

  if (done) {
    return (
      <div role="status" className="rounded-2xl border border-success/40 bg-success/10 p-4 text-sm">
        <p className="font-semibold text-success">{p.doneTitle}</p>
        <p className="mt-1 text-fg/85">{fmt(p.doneBody, { email: done })}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <label className="block text-xs font-medium text-muted" htmlFor={`cx-email-${where}`}>
        {p.emailLabel}
      </label>
      <input
        id={`cx-email-${where}`}
        type="email"
        autoComplete="email"
        inputMode="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={p.emailPh}
        className="w-full rounded-xl border border-line bg-bg/70 px-4 py-3 text-base text-fg outline-none transition placeholder:text-muted/60 focus:border-accent"
      />
      {error && <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
      <button type="submit" disabled={busy} className={`${btnPrimary} w-full !py-4 !text-base disabled:opacity-60`}>
        {busy ? p.sending : p.send}
      </button>
      <p className="text-xs leading-relaxed text-muted">{p.trialNote}</p>
    </form>
  );
}
