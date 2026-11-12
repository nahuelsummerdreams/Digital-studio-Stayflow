"use client";

import { useState } from "react";
import { Icon } from "@stayflow/ui";
import { getMessages } from "@/i18n";
import { GetHostButton, NotifyButton } from "./client";
import { ContactLink } from "./contact";

const m = getMessages();
type Cat = keyof typeof m.funnel.cats;
const ORDER: Cat[] = ["rental", "hotel", "cabins", "hostel"];
const NOTIFY_ID: Record<Exclude<Cat, "rental">, string> = { hotel: "hotels", cabins: "cabins", hostel: "hostels" };
const DOT: Record<Cat, string> = { rental: "bg-success", hotel: "bg-amber-400", cabins: "bg-muted", hostel: "bg-amber-400" };

/**
 * The first thing a visitor sees: which kind of lodging do you run? Each answer changes the promise, the three benefits and the action.
 * Only Rentals is on sale today; the others say so and let the visitor ask to be told, which also tells us what to build next.
 */
export function CategoryHero() {
  const [cat, setCat] = useState<Cat>("rental");
  const c = m.funnel.cats[cat];
  return (
    <div>
      <div role="radiogroup" aria-label={m.funnel.catsLabel} className="flex flex-wrap gap-2">
        {ORDER.map((k) => {
          const on = k === cat;
          return (
            <button key={k} type="button" role="radio" aria-checked={on} onClick={() => setCat(k)}
              className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition ${on ? "border-accent bg-accent/15 font-semibold text-accent" : "border-line bg-surface/50 text-muted hover:border-accent/50 hover:text-fg"}`}>
              <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${DOT[k]}`} />
              {m.funnel.cats[k].label}
            </button>
          );
        })}
      </div>

      <div key={cat} className="anim-stagger">
        <p className="mt-6 inline-flex max-w-full items-center gap-2 rounded-full border border-line bg-surface/60 px-3.5 py-1.5 text-xs text-muted backdrop-blur">
          <span aria-hidden className={`pulse-ring h-1.5 w-1.5 shrink-0 rounded-full ${DOT[cat]}`} />
          <span className="truncate">{c.eyebrow}</span>
        </p>
        <h1 className="font-display mt-5 text-[1.95rem] font-extrabold uppercase leading-[1.16] tracking-tight sm:text-4xl xl:text-[2.5rem]">
          {c.title} <span className="text-gradient block">{c.accent}</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-fg/85 md:text-xl">{c.sub}</p>
        <ul className="mt-6 space-y-2.5">
          {c.bullets.map((x) => (
            <li key={x} className="flex items-start gap-3 text-[15px] md:text-base"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success"><Icon name="check" className="h-3 w-3" /></span>{x}</li>
          ))}
        </ul>
        {cat === "rental" ? (
          <>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <GetHostButton where="hero" />
              <a href="#sistema" className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface/40 px-6 py-3.5 text-base font-semibold text-fg backdrop-blur transition hover:border-accent/60">{m.funnel.hero.how}</a>
            </div>
            <p className="mt-5 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-muted">
              {m.funnel.hero.trust.map((x) => <span key={x} className="flex items-center gap-1.5"><Icon name="check" className="h-3.5 w-3.5 text-success" />{x}</span>)}
            </p>
          </>
        ) : (
          <div className="mt-8 max-w-md space-y-4">
            <p className="rounded-xl border border-line bg-surface/50 px-4 py-3 text-sm text-muted">
              <span className="font-semibold text-fg">{m.funnel.status[cat === "cabins" ? "soon" : "beta"]}.</span> {m.funnel.notReady}
            </p>
            <NotifyButton id={NOTIFY_ID[cat]} label={m.funnel.notifyCat} className="w-full" />
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              <button type="button" onClick={() => setCat("rental")} className="font-medium text-accent underline-offset-4 hover:underline">{m.funnel.startRentals}</button>
              <ContactLink variant="text" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
