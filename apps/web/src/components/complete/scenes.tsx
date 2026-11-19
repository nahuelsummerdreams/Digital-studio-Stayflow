"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatedNumber, Icon } from "@stayflow/ui";
import { fmt, plural } from "@/i18n";
import { useMessages } from "@/i18n/client";
import {
  addBooking,
  canBook,
  DEMO_BOOKINGS,
  DEMO_DAYS,
  DEMO_PLACES,
  nextPayment,
  nextToPay,
  owedOf,
  registerPayment,
  statusOf,
  totalOwed,
  type DemoBooking,
} from "@/lib/complete-demo";
import { completeLaunchEndsAt } from "@/lib/complete";
import { btnPrimary } from "../styles";
import { useCompleteOffer } from "./offer";

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** 1200 → "1.200". Written by hand so the server and the browser print exactly the same thing. */
const grouped = (n: number): string => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const usd = (n: number): string => `US$ ${grouped(n)}`;

const AMBER = "#f5b942";

/** The colour of a stay by how much has been paid. Blue is "has a deposit", lime is "paid", amber is "nothing yet". */
function barLook(b: DemoBooking): { fill: string; track: string; text: string } {
  const s = statusOf(b);
  if (s === "paid") return { fill: "linear-gradient(90deg, rgb(var(--accent)), rgb(var(--accent-2)))", track: "rgb(var(--accent-2) / 0.55)", text: "text-white [text-shadow:0_1px_4px_rgb(0_0_0/0.6)]" };
  if (s === "partial") return { fill: "linear-gradient(90deg, rgb(var(--accent) / 0.95), rgb(var(--accent) / 0.65))", track: "rgb(var(--accent) / 0.5)", text: "text-white [text-shadow:0_1px_4px_rgb(0_0_0/0.6)]" };
  return { fill: "transparent", track: `${AMBER}99`, text: "text-[#ffe2a3]" };
}

/**
 * A week of three properties, drawn as bars, and the money still to collect. Everything is invented sample data.
 * With `autoplay` it registers payments by itself (a visitor who touches it takes over); with `list` it adds the list with buttons.
 */
export function ProductScene({ autoplay = false, list: showList = false, book = false }: { autoplay?: boolean; list?: boolean; book?: boolean }) {
  const { m, locale } = useMessages();
  const s = m.complete.scene;
  const [bookings, setBookings] = useState<DemoBooking[]>(() => [...DEMO_BOOKINGS]);
  const [toast, setToast] = useState<{ k: number; text: string; warn?: boolean } | null>(null);
  const ref = useRef<DemoBooking[]>(bookings);
  const last = useRef<string | undefined>(undefined);
  const taken = useRef(false);
  const count = useRef(0);

  const pay = useCallback(
    (id: string) => {
      const b = ref.current.find((x) => x.id === id);
      if (!b) return;
      const amount = nextPayment(b);
      if (amount <= 0) return;
      const next = registerPayment(ref.current, id, amount);
      ref.current = next;
      last.current = id;
      setBookings(next);
      count.current += 1;
      setToast({ k: count.current, text: fmt(s.toast, { guest: b.guest, amount: usd(amount) }) });
    },
    [s.toast],
  );

  const reset = useCallback(() => {
    const fresh = [...DEMO_BOOKINGS];
    ref.current = fresh;
    last.current = undefined;
    setBookings(fresh);
    setToast(null);
  }, []);

  useEffect(() => {
    if (!autoplay || reduced()) return;
    const id = setInterval(() => {
      if (taken.current || document.hidden) return;
      const b = nextToPay(ref.current, last.current);
      if (b) pay(b.id);
      else reset();
    }, 2700);
    return () => clearInterval(id);
  }, [autoplay, pay, reset]);

  const touch = (id: string) => {
    taken.current = true;
    pay(id);
  };

  /** Booking mode: a free day becomes a stay; a taken one refuses, like the real calendar; a stay you added can be taken away again. */
  const tapDay = (row: number, start: number) => {
    taken.current = true;
    // Two nights if they fit, one if only that fits, and a refusal if the day itself is taken.
    const len = [2, 1].find((l) => canBook(ref.current, row, start, l)) ?? 0;
    if (len === 0) {
      count.current += 1;
      setToast({ k: count.current, text: s.busy, warn: true });
      return;
    }
    const place = DEMO_PLACES[row] ?? "";
    const next = addBooking(ref.current, { id: `n${count.current + 1}`, guest: s.newBooking, place, row, start, len, total: 100 * len * 3, paid: 0 });
    ref.current = next;
    count.current += 1;
    setBookings(next);
    setToast({ k: count.current, text: fmt(s.booked, { place }) });
  };

  const tapBar = (b: DemoBooking) => {
    taken.current = true;
    if (!b.id.startsWith("n")) {
      count.current += 1;
      setToast({ k: count.current, text: s.busy, warn: true });
      return;
    }
    const next = ref.current.filter((x) => x.id !== b.id);
    ref.current = next;
    setBookings(next);
  };

  const owed = totalOwed(bookings);

  return (
    <figure className="relative min-w-0">
      <div aria-hidden className="cx-orb pointer-events-none absolute -left-10 top-10 h-56 w-56 rounded-full bg-accent/30 blur-3xl" />
      <div aria-hidden className="cx-orb pointer-events-none absolute -right-8 bottom-6 h-56 w-56 rounded-full blur-3xl" style={{ background: "rgb(var(--accent-2) / 0.28)", animationDelay: "-4s" }} />

      <div className="fx-card fx-hero relative rounded-[28px] p-4 shadow-[0_40px_90px_-30px_rgb(var(--accent)/0.5)] sm:p-6">
        {toast && (
          <div key={toast.k} role="status" className="cx-toast absolute -top-5 right-3 z-20 flex max-w-[90%] items-center gap-2 rounded-full border bg-bg/90 px-3.5 py-2 text-xs font-medium shadow-lg backdrop-blur" style={{ borderColor: toast.warn ? `${AMBER}aa` : "rgb(var(--accent-2) / 0.5)" }}>
            {toast.warn ? <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-[#2a1a00]" style={{ background: AMBER }}>!</span> : <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full tick"><Icon name="check" className="h-3 w-3" /></span>}
            <span className="truncate sm:whitespace-normal">{toast.text}</span>
          </div>
        )}

        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted">{book ? s.thisWeek : s.owed}</p>
            <p className="font-display text-gradient mt-1 text-4xl font-extrabold leading-none sm:text-5xl">
              {book ? plural(s, "bookings", bookings.length, locale).replace("{count}", String(bookings.length)) : <AnimatedNumber value={owed} format={usd} duration={700} />}
            </p>
          </div>
          <ul className="flex flex-wrap justify-end gap-x-3 gap-y-1 text-[11px] text-muted" aria-label={s.legend}>
            <li className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full" style={{ background: "rgb(var(--accent-2))" }} />{s.legendPaid}</li>
            <li className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-accent" />{s.legendPartial}</li>
            <li className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full" style={{ background: AMBER }} />{s.legendPending}</li>
          </ul>
        </div>

        <div className="mt-6 space-y-2" role="group" aria-label={s.week}>
          <div className="grid grid-cols-[4.4rem_1fr] items-center gap-2 sm:grid-cols-[5.6rem_1fr]">
            <span className="whitespace-nowrap text-[10px] uppercase tracking-wide text-muted">{s.week}</span>
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted">
              {DEMO_DAYS.map((d, i) => <span key={i}>{d}</span>)}
            </div>
          </div>
          {DEMO_PLACES.map((place, row) => (
            <div key={place} className="grid grid-cols-[4.4rem_1fr] items-center gap-2 sm:grid-cols-[5.6rem_1fr]">
              <span className="truncate text-[11px] font-medium text-fg/80 sm:text-xs">{place}</span>
              <div className="grid h-11 grid-cols-7 gap-1 sm:h-14">
                {Array.from({ length: 7 }, (_, i) =>
                  book ? (
                    <button key={i} type="button" onClick={() => tapDay(row, i)} aria-label={`${place} · ${DEMO_DAYS[i]}`} className="cursor-pointer rounded-md bg-line/30 transition hover:bg-[rgb(var(--accent-2)/0.28)]" style={{ gridRow: 1, gridColumn: i + 1 }} />
                  ) : (
                    <span key={i} aria-hidden className="rounded-md bg-line/30" style={{ gridRow: 1, gridColumn: i + 1 }} />
                  ),
                )}
                {bookings.filter((b) => b.row === row).map((b) => {
                  const look = barLook(b);
                  const pct = Math.min(100, (b.paid / b.total) * 100);
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => (book ? tapBar(b) : touch(b.id))}
                      disabled={!book && owedOf(b) === 0}
                      aria-label={`${b.guest}: ${owedOf(b) === 0 ? s.paidLabel : fmt(s.missing, { amount: usd(owedOf(b)) })}`}
                      className={`cx-bar relative z-10 overflow-hidden rounded-lg border text-left transition-[border-color,box-shadow] duration-700 enabled:cursor-pointer enabled:hover:brightness-125 disabled:cursor-default ${look.text}`}
                      style={{ gridRow: 1, gridColumn: `${b.start + 1} / span ${b.len}`, borderColor: look.track, borderStyle: statusOf(b) === "pending" ? "dashed" : "solid", boxShadow: statusOf(b) === "paid" ? "0 0 22px -4px rgb(var(--accent-2) / 0.65)" : "none", background: statusOf(b) === "pending" ? `${AMBER}1f` : "rgb(var(--surface-2) / 0.9)" }}
                    >
                      <span aria-hidden className="absolute inset-y-0 left-0 transition-[width] duration-700 ease-out" style={{ width: `${pct}%`, background: look.fill }} />
                      <span className="relative block truncate px-2 text-[11px] font-semibold leading-[2.75rem] sm:text-sm sm:leading-[3.5rem]">{b.guest}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {showList && (
          <ul className="mt-6 divide-y divide-line/50 border-t border-line/50">
            {bookings.map((b) => {
              const st = statusOf(b);
              const pct = Math.min(100, (b.paid / b.total) * 100);
              return (
                <li key={b.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-sm font-semibold">{b.guest}</p>
                      <p className={`shrink-0 text-xs font-semibold ${st === "paid" ? "text-success" : st === "partial" ? "text-accent" : ""}`} style={st === "pending" ? { color: AMBER } : undefined}>
                        {st === "paid" ? s.paidLabel : fmt(s.missing, { amount: usd(owedOf(b)) })}
                      </p>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-line/50">
                      <div className="h-full rounded-full transition-[width] duration-700 ease-out" style={{ width: `${pct}%`, background: "linear-gradient(90deg, rgb(var(--accent)), rgb(var(--accent-2)))" }} />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => touch(b.id)}
                    disabled={st === "paid"}
                    className="shrink-0 rounded-lg border border-line bg-surface px-3 py-2 text-xs font-semibold transition enabled:hover:border-[rgb(var(--accent-2)/0.7)] enabled:hover:text-[rgb(var(--accent-2))] disabled:opacity-40"
                  >
                    {s.register}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {showList && (
          <div className="mt-3 text-right">
            <button type="button" onClick={() => { taken.current = true; reset(); }} className="text-xs text-muted underline-offset-4 transition hover:text-fg hover:underline">{s.reset}</button>
          </div>
        )}
      </div>
      <figcaption className="mt-3 text-center text-xs text-muted">{book ? s.sampleBook : showList ? s.sampleList : s.sample}</figcaption>
    </figure>
  );
}

/** Time left of the launch price, ticking every second. Renders nothing before it is mounted (so the server and the browser match) or when there is no launch. */
export function Countdown({ className = "" }: { className?: string }) {
  const { m, locale } = useMessages();
  const c = m.complete.countdown;
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const end = completeLaunchEndsAt();
  if (now === null || end === null || end <= now) return null;
  const left = end - now;
  const parts = [
    { n: Math.floor(left / 86_400_000), label: c.days },
    { n: Math.floor((left % 86_400_000) / 3_600_000), label: c.hours },
    { n: Math.floor((left % 3_600_000) / 60_000), label: c.minutes },
    { n: Math.floor((left % 60_000) / 1000), label: c.seconds },
  ];
  void locale;
  return (
    <div className={className} role="timer" aria-label={c.label}>
      <p className="text-center text-[11px] font-medium uppercase tracking-[0.2em] text-muted">{c.label}</p>
      <div className="mt-2 grid grid-cols-4 gap-2">
        {parts.map((p) => (
          <div key={p.label} className="rounded-xl border border-line bg-surface/70 px-2 py-2.5 text-center">
            <p className="font-display tabular-nums text-2xl font-extrabold leading-none text-[rgb(var(--accent-2))] sm:text-3xl">{String(p.n).padStart(2, "0")}</p>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-muted">{p.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** A bar at the bottom that follows the visitor with the price and one button. It steps aside while the price section or the closing section is on screen. */
export function StickyCta() {
  const { m, locale } = useMessages();
  const st = m.complete.sticky;
  const offer = useCompleteOffer();
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
    if (els.length === 0) return;
    const seen = new Set<string>();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) seen.add(e.target.id);
        else seen.delete(e.target.id);
      }
      setCovered(seen.size > 0);
    }, { threshold: 0.15 });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);

  const show = scrolled && !covered;
  return (
    <div aria-hidden={!show} className={`pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-3 transition duration-500 sm:px-5 ${show ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"}`} style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
      <div className="pointer-events-auto mx-auto flex max-w-3xl items-center justify-between gap-3 rounded-2xl border border-line bg-bg/85 px-4 py-3 shadow-[0_20px_60px_-15px_rgb(0_0_0/0.7)] backdrop-blur-xl">
        <div className="min-w-0">
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-display tabular-nums text-2xl font-extrabold leading-none">USD {offer.price}</span>
            {offer.launch && <span className="tabular-nums text-sm text-muted line-through">USD {offer.regular}</span>}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-muted">
            {offer.launch && offer.daysLeft > 0 ? plural(m.complete.price, "daysLeft", offer.daysLeft, locale) : st.once}
          </p>
        </div>
        <a href="#precio" tabIndex={show ? 0 : -1} className={`${btnPrimary} cta-glow shrink-0 whitespace-nowrap !px-5 !py-3`}>
          {st.button}
          <Icon name="arrow" className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
