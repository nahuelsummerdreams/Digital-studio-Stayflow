import { SOON_LIST } from "@/lib/catalog";
import { getMessages } from "@/i18n";
import { NotifyButton } from "./client";
import { HUE, ProductCover } from "./covers";

const m = getMessages();

/** What is coming, in one scrolling row. Nothing here is for sale: each card only lets the visitor ask to be told when it is out. */
export function Proximamente() {
  return (
    <section id="proximamente" className="border-t border-line/60">
      <div className="mx-auto max-w-6xl px-5 py-14 md:py-20">
        <div className="reveal max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-accent">{m.soon.eyebrow}</p>
          <h2 className="font-display mt-3 text-3xl leading-tight md:text-4xl">{m.soon.title}</h2>
          <p className="mt-3 text-muted">{m.soon.body}</p>
        </div>
        <div className="-mx-5 mt-8 overflow-x-auto px-5 pb-3 [scrollbar-width:thin]">
          <div className="flex w-max gap-4">
            {SOON_LIST.map((p) => (
              <article key={p.id} className="fx-card flex w-[13.5rem] shrink-0 flex-col items-center rounded-3xl px-3 pb-5 pt-2 text-center" style={{ backgroundImage: `radial-gradient(90% 55% at 50% 0%, hsl(${HUE[p.id]} 100% 50% / 0.16), transparent)` }}>
                <div className="opacity-75 saturate-75"><ProductCover id={p.id} size="sm" /></div>
                <h3 className="font-display text-base">{p.name.replace("Stayflow ", "")}</h3>
                <p className="mt-1 min-h-[2.5rem] text-xs text-muted">{m.products[p.id].tagline}</p>
                <div className="mt-3 w-full"><NotifyButton id={p.id} className="w-full !px-2 !py-2 !text-xs" /></div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
