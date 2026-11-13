"use client";

import { useState } from "react";
import { Icon } from "@stayflow/ui";
import { getMessages } from "@/i18n";
import { GetHostButton, NotifyButton } from "./client";
import { ContactLink } from "./contact";
import { LaunchBadge } from "./launch";

const m = getMessages();
type Cat = keyof typeof m.funnel.cats;
const ORDER: Cat[] = ["all", "rental", "hotel", "cabins", "hostel"];
const NOTIFY_ID: Record<Exclude<Cat, "all" | "rental">, string> = { hotel: "hotels", cabins: "cabins", hostel: "hostels" };
const DOT: Record<Cat, string> = { all: "bg-accent", rental: "bg-success", hotel: "bg-amber-400", cabins: "bg-muted", hostel: "bg-amber-400" };
const STATUS_TONE: Record<string, string> = { ok: "border-success/40 bg-success/10 text-success", beta: "border-amber-400/40 bg-amber-400/10 text-amber-300", soon: "border-line bg-surface/60 text-muted" };

/**
 * The first thing a visitor sees. By default it speaks to every kind of lodging (Airbnb, hotel, hostel, cabins) and says honestly what is ready today.
 * Picking a kind changes the promise, the three benefits and the action. Only Rentals is on sale today; the others say so and let the visitor ask to be told,
 * which also tells us what to build next.
 */
export function CategoryHero() {
  const [cat, setCat] = useState<Cat>("all");
  const c = m.funnel.cats[cat];
  const mf = m.funnel.manifesto;
  const buyable = cat === "all" || cat === "rental";
  const openAssistant = () => window.dispatchEvent(new Event("stayflow:open-assistant"));
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
        <h1 className={`font-display mt-5 font-extrabold uppercase tracking-tight ${cat === "all" ? "text-[1.6rem] leading-[1.2] sm:text-3xl xl:text-[2.15rem]" : "text-[1.95rem] leading-[1.16] sm:text-4xl xl:text-[2.5rem]"}`}>
          {c.title} <span className="text-gradient block">{c.accent}</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-fg/85 md:text-xl">{c.sub}</p>
        {cat === "all" ? (
          <div className="mt-6 max-w-xl">
            <ul className="grid gap-2 sm:grid-cols-2">
              {mf.pains.map((x) => (
                <li key={x} className="flex items-start gap-2.5 text-[15px]"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-danger/15 text-danger"><Icon name="close" className="h-3 w-3" /></span>{x}</li>
              ))}
            </ul>
          </div>
        ) : (
        <ul className="mt-6 space-y-2.5">
          {c.bullets.map((x) => (
            <li key={x} className="flex items-start gap-3 text-[15px] md:text-base"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full tick"><Icon name="check" className="h-3 w-3" /></span>{x}</li>
          ))}
        </ul>
        )}

        {buyable ? (
          <>
            <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-3">
              <GetHostButton where="hero" label={cat === "all" ? mf.cta : undefined} className="!px-8 !py-4 !text-lg" />
              <LaunchBadge showRegular />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <a href={cat === "all" ? "#manifiesto" : "#sistema"} className="font-medium text-fg/80 underline-offset-4 transition hover:text-fg hover:underline">{m.funnel.hero.how}</a>
              <button type="button" onClick={openAssistant} className="inline-flex items-center gap-1.5 font-medium text-accent underline-offset-4 transition hover:underline">
                <Icon name="message" className="h-4 w-4" />{m.hero.ask}
              </button>
            </div>
            {cat === "all" && (
              <ul aria-label={m.funnel.allStatus.title} className="mt-5 flex flex-wrap gap-2">
                {m.funnel.allStatus.items.map((it) => {
                  const [name, state, tone] = it.split("|");
                  return <li key={it} className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${STATUS_TONE[tone!]}`}><span className="font-semibold">{name}</span><span className="opacity-80">· {state}</span></li>;
                })}
              </ul>
            )}
            <p className="mt-5 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-muted">
              {m.funnel.hero.trust.map((x) => <span key={x} className="flex items-center gap-1.5"><Icon name="check" className="h-3.5 w-3.5 text-success" />{x}</span>)}
            </p>
          </>
        ) : (
          <div className="mt-8 max-w-md space-y-4">
            <p className="rounded-xl border border-line bg-surface/50 px-4 py-3 text-sm text-muted">
              <span className="font-semibold text-fg">{m.funnel.status[cat === "cabins" ? "soon" : "beta"]}.</span> {m.funnel.notReady}
            </p>
            <NotifyButton id={NOTIFY_ID[cat as Exclude<Cat, "all" | "rental">]} label={m.funnel.notifyCat} className="w-full" />
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
