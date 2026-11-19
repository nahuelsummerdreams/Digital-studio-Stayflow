"use client";

import { useState } from "react";
import { AnimatedNumber } from "@stayflow/ui";
import { fmt } from "@/i18n";
import { useMessages } from "@/i18n/client";
import { monthlyCost, savingsAfter } from "@/lib/complete-calc";
import { useCompleteOffer } from "./offer";

const usd = (n: number): string => `US$ ${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;

/** "Do the math": the visitor types what they pay per month today and sees 12 and 24 months next to one payment. It only uses their number. */
export function CostCalc() {
  const { m } = useMessages();
  const c = m.complete.calc;
  const offer = useCompleteOffer();
  const [monthly, setMonthly] = useState(30);

  const y1 = monthlyCost(monthly, 12);
  const y2 = monthlyCost(monthly, 24);
  const diff = savingsAfter(monthly, 12, offer.price);

  return (
    <section className="mx-auto max-w-6xl px-5 py-16">
      <div className="reveal mx-auto max-w-2xl text-center">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-accent">{c.eyebrow}</p>
        <h2 className="font-display mt-4 text-3xl leading-tight md:text-4xl">{c.title}</h2>
        <p className="mt-4 text-base leading-relaxed text-muted md:text-lg">{c.body}</p>
      </div>

      <div className="fx-card fx-hero mx-auto mt-10 max-w-3xl rounded-[2rem] p-6 sm:p-10">
        <label htmlFor="calc-monthly" className="block text-sm font-medium">{c.label}</label>
        <div className="mt-3 flex items-center gap-4">
          <input
            id="calc-monthly"
            type="range"
            min={0}
            max={200}
            step={5}
            value={monthly}
            onChange={(e) => setMonthly(Number(e.target.value))}
            className="h-2 w-full cursor-pointer accent-[rgb(var(--accent-2))]"
          />
          <span className="font-display tabular-nums w-32 shrink-0 whitespace-nowrap text-right text-3xl">{usd(monthly)}</span>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-line bg-surface/60 p-4 text-center">
            <p className="text-[11px] uppercase tracking-wide text-muted">{c.months12}</p>
            <p className="font-display tabular-nums mt-1 text-2xl text-fg/90"><AnimatedNumber value={y1} format={usd} duration={500} /></p>
          </div>
          <div className="rounded-2xl border border-line bg-surface/60 p-4 text-center">
            <p className="text-[11px] uppercase tracking-wide text-muted">{c.months24}</p>
            <p className="font-display tabular-nums mt-1 text-2xl text-fg/90"><AnimatedNumber value={y2} format={usd} duration={500} /></p>
          </div>
          <div className="rounded-2xl border p-4 text-center" style={{ borderColor: "rgb(var(--accent-2) / 0.6)", background: "rgb(var(--accent-2) / 0.1)" }}>
            <p className="text-[11px] uppercase tracking-wide text-muted">{c.once}</p>
            <p className="font-display tabular-nums mt-1 text-2xl text-[rgb(var(--accent-2))]">{usd(offer.price)}</p>
          </div>
        </div>

        <p className="mt-6 text-center text-sm font-medium" aria-live="polite">
          {diff > 0 ? <span className="text-[rgb(var(--accent-2))]">{fmt(c.saves, { amount: usd(diff) })}</span> : <span className="text-muted">{c.zero}</span>}
        </p>
        <p className="mt-3 text-center text-xs text-muted">{c.note}</p>
      </div>
    </section>
  );
}
