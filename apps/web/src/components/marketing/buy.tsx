"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Icon } from "@stayflow/ui";
import { MARKETING_CHECKOUT_URL, MARKETING_PRICE } from "@/lib/marketing";
import { saveLead } from "@/lib/leads";
import { btnPrimary } from "../styles";
import { COPY } from "./copy";

const p = COPY.price;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * The buy action. With a payment link it sends people there; without one it is honest: it only collects the email
 * (the store is not open yet) and says nothing was charged.
 */
export function MarketingBuy({ where }: { where: string }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  if (MARKETING_CHECKOUT_URL) {
    return (
      <a href={MARKETING_CHECKOUT_URL} target="_blank" rel="noopener noreferrer" className={`${btnPrimary} w-full !py-4 !text-base`} data-where={where}>
        {p.link} · USD {MARKETING_PRICE}
        <Icon name="arrow" className="h-4 w-4" />
      </a>
    );
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!EMAIL.test(email.trim())) return setError(p.errEmail);
    setBusy(true);
    const ok = await saveLead(email, "checkout", { product: "marketing", intent: "reserve", price: MARKETING_PRICE, where });
    setBusy(false);
    if (!ok) return setError(p.errSave);
    setDone(email.trim());
  }

  if (done) {
    return (
      <div role="status" className="rounded-2xl border border-success/40 bg-success/10 p-4 text-sm">
        <p className="font-semibold text-success">{p.doneTitle}</p>
        <p className="mt-1 text-fg/85">{p.doneBody.replace("{email}", done)}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <label className="block text-xs font-medium text-muted" htmlFor={`mk-email-${where}`}>
        {p.emailLabel}
      </label>
      <input
        id={`mk-email-${where}`}
        type="email"
        autoComplete="email"
        inputMode="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={p.emailPh}
        className="w-full rounded-xl border border-line bg-bg/70 px-4 py-3 text-base text-fg outline-none transition placeholder:text-muted/60 focus:border-accent"
      />
      {error && (
        <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className={`${btnPrimary} w-full !py-4 !text-base disabled:opacity-60`}>
        {busy ? p.sending : p.send}
      </button>
      <p className="text-xs leading-relaxed text-muted">{p.note}</p>
    </form>
  );
}

/** A bar at the bottom of phones that keeps the main action in reach, and gets out of the way when the price is on screen. */
export function MarketingSticky() {
  const [scrolled, setScrolled] = useState(false);
  const [covered, setCovered] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 640);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const els = ["precio", "cierre"].map((id) => document.getElementById(id)).filter((e): e is HTMLElement => e !== null);
    const seen = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) (e.isIntersecting ? seen.add(e.target.id) : seen.delete(e.target.id));
        setCovered(seen.size > 0);
      },
      { threshold: 0.15 },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);

  const show = scrolled && !covered;
  return (
    <div aria-hidden={!show} className={`fixed inset-x-0 bottom-0 z-30 border-t border-line/60 bg-bg/85 px-4 py-3 backdrop-blur-xl transition md:hidden ${show ? "translate-y-0" : "pointer-events-none translate-y-full"}`}>
      <a href="#precio" tabIndex={show ? 0 : -1} className={`${btnPrimary} w-full !py-3.5 !text-base`}>
        {COPY.sticky} · USD {MARKETING_PRICE}
      </a>
    </div>
  );
}
