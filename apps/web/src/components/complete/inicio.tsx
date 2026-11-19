"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { AnimatedNumber, Icon, Sparkline } from "@stayflow/ui";
import { fmt } from "@/i18n";
import { useMessages } from "@/i18n/client";
import {
  collectedPct,
  DEMO_BOOKINGS,
  DEMO_OCCUPANCY,
  DEMO_TREND,
  nextPayment,
  nextToPay,
  owedOf,
  registerPayment,
  statusOf,
  totalOwed,
  type DemoBooking,
} from "@/lib/complete-demo";

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const grouped = (n: number): string => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const usd = (n: number): string => `US$ ${grouped(n)}`;
const AMBER = "#f5b942";

function Ring({ pct, label }: { pct: number; label: string }) {
  const id = useId().replace(/:/g, "");
  const R = 24;
  const C = 2 * Math.PI * R;
  return (
    <div className="relative h-[4.5rem] w-[4.5rem] sm:h-20 sm:w-20" role="img" aria-label={`${pct} % ${label}`}>
      <svg viewBox="0 0 60 60" className="h-full w-full -rotate-90">
        <defs>
          <linearGradient id={`rg-${id}`} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="rgb(var(--accent))" />
            <stop offset="1" stopColor="rgb(var(--accent-2))" />
          </linearGradient>
        </defs>
        <circle cx="30" cy="30" r={R} fill="none" stroke="rgb(var(--line))" strokeOpacity={0.55} strokeWidth="6" />
        <circle cx="30" cy="30" r={R} fill="none" stroke={`url(#rg-${id})`} strokeWidth="6" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)} style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.2,0.8,0.2,1)", filter: "drop-shadow(0 0 4px rgb(var(--accent-2) / 0.5))" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="font-display tabular-nums text-base font-extrabold sm:text-lg">{pct}%</span>
        <span className="mt-0.5 text-[9px] uppercase tracking-wide text-muted">{label}</span>
      </div>
    </div>
  );
}

/**
 * The owner's Inicio, drawn the way the app shows it: money still to collect, who owes it, how the money moved and how full the properties are.
 * It is a picture with invented data that reacts: it registers payments by itself, and tapping a guest registers one too.
 */
export function InicioScene({ autoplay = false }: { autoplay?: boolean }) {
  const { m } = useMessages();
  const s = m.complete.inicio;
  const [bookings, setBookings] = useState<DemoBooking[]>(() => [...DEMO_BOOKINGS]);
  const [toast, setToast] = useState<{ k: number; text: string } | null>(null);
  const ref = useRef<DemoBooking[]>(bookings);
  const last = useRef<string | undefined>(undefined);
  const taken = useRef(false);
  const count = useRef(0);
  const toastText = m.complete.scene.toast;

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
      setToast({ k: count.current, text: fmt(toastText, { guest: b.guest, amount: usd(amount) }) });
    },
    [toastText],
  );

  useEffect(() => {
    if (!autoplay || reduced()) return;
    const id = setInterval(() => {
      if (taken.current || document.hidden) return;
      const b = nextToPay(ref.current, last.current);
      if (b) pay(b.id);
      else {
        const fresh = [...DEMO_BOOKINGS];
        ref.current = fresh;
        last.current = undefined;
        setBookings(fresh);
        setToast(null);
      }
    }, 2900);
    return () => clearInterval(id);
  }, [autoplay, pay]);

  const owed = totalOwed(bookings);
  const pct = collectedPct(bookings);
  const owing = bookings.slice(0, 4);
  const avg = Math.round(DEMO_OCCUPANCY.reduce((a, b) => a + b, 0) / DEMO_OCCUPANCY.length);

  return (
    <figure className="relative min-w-0">
      <div aria-hidden className="cx-orb pointer-events-none absolute -left-12 top-8 h-60 w-60 rounded-full bg-accent/30 blur-3xl" />
      <div aria-hidden className="cx-orb pointer-events-none absolute -right-10 bottom-4 h-60 w-60 rounded-full blur-3xl" style={{ background: "rgb(var(--accent-2) / 0.26)", animationDelay: "-4s" }} />

      <div className="relative overflow-hidden rounded-[26px] border border-line bg-bg/80 shadow-[0_40px_90px_-30px_rgb(var(--accent)/0.55)] backdrop-blur">
        <div className="flex items-center gap-2 border-b border-line/60 bg-surface/70 px-4 py-2.5">
          <span aria-hidden className="flex gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-danger/70" /><i className="h-2.5 w-2.5 rounded-full" style={{ background: AMBER }} /><i className="h-2.5 w-2.5 rounded-full" style={{ background: "rgb(var(--accent-2))" }} /></span>
          <span className="mx-auto text-[11px] tracking-wide text-muted">{s.window}</span>
        </div>

        <div className="space-y-3 p-3 sm:p-5">
          {toast && (
            <div className="pointer-events-none absolute inset-x-3 bottom-3 z-20 flex justify-center">
              <div key={toast.k} role="status" className="cx-toast flex max-w-full items-center gap-2 rounded-full border border-[rgb(var(--accent-2)/0.5)] bg-bg/95 px-3.5 py-2 text-xs font-medium shadow-lg backdrop-blur">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full tick"><Icon name="check" className="h-3 w-3" /></span>
                <span className="truncate">{toast.text}</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <p className="font-display text-lg sm:text-xl">{s.hello}</p>
            <span className="inline-flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-[11px] font-semibold text-onaccent"><Icon name="plus" className="h-3 w-3" />{s.newBooking}</span>
          </div>

          <div className="fx-card fx-hero rounded-2xl p-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">{s.owed}</p>
            <p className="font-display text-gradient mt-1 text-4xl font-extrabold leading-none sm:text-5xl">
              <AnimatedNumber value={owed} format={usd} duration={700} />
            </p>
            <ul className="mt-4 space-y-2.5">
              {owing.map((b) => {
                const st = statusOf(b);
                const p = Math.min(100, (b.paid / b.total) * 100);
                return (
                  <li key={b.id}>
                    <button type="button" disabled={st === "paid"} onClick={() => { taken.current = true; pay(b.id); }} className="block w-full text-left enabled:cursor-pointer enabled:hover:brightness-125">
                      <span className="flex items-baseline justify-between gap-2 text-xs sm:text-sm">
                        <span className="truncate font-medium">{b.guest}</span>
                        <span className={`shrink-0 text-[11px] font-semibold ${st === "paid" ? "text-success" : ""}`} style={st === "pending" ? { color: AMBER } : st === "partial" ? { color: "rgb(var(--accent))" } : undefined}>
                          {st === "paid" ? s.paid : fmt(s.missing, { amount: usd(owedOf(b)) })}
                        </span>
                      </span>
                      <span className="mt-1.5 block h-2 overflow-hidden rounded-full bg-line/50">
                        <span className="block h-full rounded-full transition-[width] duration-700 ease-out" style={{ width: `${p}%`, background: st === "pending" ? AMBER : "linear-gradient(90deg, rgb(var(--accent)), rgb(var(--accent-2)))" }} />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            <div className="fx-card flex flex-col items-center justify-between gap-2 rounded-2xl p-3">
              <Ring pct={pct} label={s.collected} />
            </div>
            <div className="fx-card flex flex-col rounded-2xl p-3">
              <p className="text-[10px] leading-tight text-muted">{s.trend}</p>
              <Sparkline values={[...DEMO_TREND]} className="mt-auto h-12 w-full sm:h-14" />
            </div>
            <div className="fx-card flex flex-col rounded-2xl p-3">
              <p className="text-[10px] leading-tight text-muted">{s.occupancy}</p>
              <div role="img" aria-label={fmt(s.avg, { pct: avg })} className="mt-auto flex h-12 items-end gap-[3px] sm:h-14">
                {DEMO_OCCUPANCY.map((v, i) => (
                  <span key={i} className="flex-1 rounded-sm" style={{ height: `${Math.max(v, 8)}%`, background: "linear-gradient(to top, rgb(var(--accent)), rgb(var(--accent-2)))", animation: `fade-up 0.6s var(--ease) ${i * 40}ms both` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-xs text-muted">{s.sample}</figcaption>
    </figure>
  );
}
