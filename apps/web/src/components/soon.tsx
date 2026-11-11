import { SOON_LIST } from "@/lib/catalog";
import { getMessages } from "@/i18n";
import { NotifyButton } from "./client";
import { HUE, ProductCover } from "./covers";

const m = getMessages();

/** What is coming. Nothing here is for sale: each card only lets the visitor ask to be told when it is out. */
export function Proximamente() {
  return (
    <section id="proximamente" className="border-t border-line/60">
      <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
        <div className="reveal max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-accent">{m.soon.eyebrow}</p>
          <h2 className="font-display mt-4 text-3xl leading-tight md:text-5xl">{m.soon.title}</h2>
          <p className="mt-5 text-base leading-relaxed text-muted md:text-lg">{m.soon.body}</p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {SOON_LIST.map((p) => (
            <article key={p.id} className="reveal fx-card relative flex flex-col items-center overflow-hidden rounded-3xl px-5 pb-6 pt-3 text-center" style={{ backgroundImage: `radial-gradient(90% 55% at 50% 0%, hsl(${HUE[p.id]} 100% 50% / 0.16), transparent)` }}>
              <div className="opacity-70 saturate-75"><ProductCover id={p.id} /></div>
              <span className="rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] font-semibold text-muted">{m.soon.tag}</span>
              <h3 className="font-display mt-3 text-xl">{p.name}</h3>
              <p className="mt-1 max-w-[17rem] text-sm text-muted">{m.products[p.id].tagline}</p>
              <p className="mt-2 max-w-[17rem] text-sm text-muted/80">{m.products[p.id].problem}</p>
              <div className="mt-5 w-full"><NotifyButton id={p.id} className="w-full" /></div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
