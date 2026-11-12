"use client";

import { useState, type ReactNode } from "react";
import { Icon } from "@stayflow/ui";

export interface ShowcaseItem {
  key: string;
  tag: string;
  pain: string;
  title: string;
  body: string;
  bullets: string[];
  visual: ReactNode;
}

/** One screen at a time instead of five stacked blocks: the pain, the promise, and the real screen. */
export function ShowcaseTabs({ items }: { items: ShowcaseItem[] }) {
  const [i, setI] = useState(0);
  const it = items[i] as ShowcaseItem;
  return (
    <div>
      <div role="tablist" aria-label="Pantallas de Host" className="flex flex-wrap justify-center gap-2">
        {items.map((x, n) => (
          <button
            key={x.key}
            role="tab"
            type="button"
            aria-selected={n === i}
            onClick={() => setI(n)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${n === i ? "border-accent bg-accent text-onaccent shadow-[0_0_24px_-6px_rgb(var(--accent))]" : "border-line bg-surface/60 text-muted hover:border-accent/50 hover:text-fg"}`}
          >
            {x.tag}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="mt-10 grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div key={it.key} className="rise-in">
          <p className="flex gap-3 text-lg font-medium leading-snug text-danger/90"><span aria-hidden className="mt-0.5 shrink-0"><Icon name="alert" className="h-5 w-5" /></span>{it.pain}</p>
          <h3 className="font-display mt-4 text-3xl leading-tight md:text-4xl">{it.title}</h3>
          <p className="mt-4 text-base leading-relaxed text-muted md:text-lg">{it.body}</p>
          <ul className="mt-6 space-y-3">
            {it.bullets.map((b) => (
              <li key={b} className="flex items-start gap-3 text-[15px]"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success"><Icon name="check" className="h-3 w-3" /></span>{b}</li>
            ))}
          </ul>
        </div>
        <div className="relative min-w-0">
          <div aria-hidden className="absolute -inset-4 rounded-[40px] bg-accent/10 blur-2xl" />
          <div key={`v-${it.key}`} className="rise-in relative">{it.visual}</div>
        </div>
      </div>
    </div>
  );
}
