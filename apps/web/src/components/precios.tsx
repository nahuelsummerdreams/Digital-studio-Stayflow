import Link from "next/link";
import { PACK_IDS, PACKS, PRODUCTS, type ProductId } from "@/lib/catalog";
import { Icon } from "@stayflow/ui";
import { fmt, getMessages } from "@/i18n";
import { usd } from "@/lib/pricing";
import { AddPack, AddToCart, GetHostButton, SupportPicker } from "./client";
import { HUE, PackCover, ProductCover } from "./covers";
import { HostPrice, LaunchBadge, PriceText, RegularPrice } from "./launch";
import { PackPrice } from "./promo";
import { Shelf } from "./shelf";
import { btnGhost } from "./styles";

const m = getMessages();

/** A tool as a compact boxed card (used for cross-sell on product pages). */
export function ProductCard({ id }: { id: ProductId }) {
  const p = PRODUCTS[id];
  const c = m.products[id];
  return (
    <article className="reveal fx-card group relative flex flex-col items-center overflow-hidden rounded-3xl px-5 pb-6 pt-3 text-center" style={{ backgroundImage: `radial-gradient(90% 55% at 50% 0%, hsl(${HUE[id]} 100% 50% / 0.3), transparent)` }}>
      <ProductCover id={id} />
      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${p.status === "available" ? "bg-accent text-onaccent" : "border border-line bg-surface text-muted"}`}>{p.status === "available" ? m.solution.live : m.solution.soon}</span>
      <h3 className="font-display mt-3 text-xl">{p.name}</h3>
      <p className="mt-1 max-w-[17rem] text-sm text-muted">{c.problem}</p>
      <p className="mt-4 flex items-baseline justify-center gap-2"><span className="font-display text-gradient text-4xl tabular-nums">{usd(p.price)}</span><span className="text-xs text-muted">{m.solution.oneTime}</span></p>
      <div className="mt-5 grid w-full grid-cols-[1.5fr_1fr] gap-2.5">
        <AddToCart id={id} className="!px-2 whitespace-nowrap !text-[13px]" />
        <Link href={`/products/${id}`} className={`${btnGhost} !px-3`}>{m.solution.learn}</Link>
      </div>
    </article>
  );
}

/** A ready-made pack, compact: its box, what it is for, the price (with the promotion if it is running) and the button. */
function PackMini({ id }: { id: (typeof PACK_IDS)[number] }) {
  const c = m.packs.list[id];
  const featured = id === "mega";
  return (
    <article className={`reveal fx-card relative flex flex-col items-center gap-4 rounded-3xl p-5 text-center sm:flex-row sm:text-left ${featured ? "fx-hero" : ""}`}>
      {c.badge && <span className="absolute -top-3 left-6 whitespace-nowrap rounded-full bg-accent px-3 py-1 text-[11px] font-semibold text-onaccent shadow-[0_0_24px_-4px_rgb(var(--accent))]">{c.badge}</span>}
      <div className="shrink-0"><PackCover id={id} size="sm" /></div>
      <div className="flex min-w-0 flex-1 flex-col items-center sm:items-start">
        <h4 className="font-display text-xl">{c.name}</h4>
        <p className="mt-1 text-sm text-muted">{c.for}</p>
        <div className="flex flex-col items-center sm:items-start [&_p]:justify-start"><PackPrice id={id} /></div>
        <ul className="mt-3 flex flex-wrap justify-center gap-1.5 sm:justify-start">
          {PACKS[id].apps.map((a) => <li key={a} className="rounded-full border border-line bg-bg/50 px-2.5 py-1 text-[11px] text-muted">{PRODUCTS[a].name.replace("Stayflow ", "")}</li>)}
        </ul>
        <div className="mt-4 w-full"><AddPack pack={id} /></div>
      </div>
    </article>
  );
}

/**
 * The offer. One product leads (Host: the winner), then the way to add more:
 * the shelf with the live ticket, two ready-made packs, and optional support tucked away.
 */
export function Precios() {
  const c = m.products.host;
  const o = m.funnel.offer;
  return (
    <section id="precios" className="relative overflow-hidden border-t border-line/60 bg-surface/30">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-[480px] w-[800px] -translate-x-1/2 rounded-full bg-accent/10 blur-3xl" />
      <div className="relative mx-auto max-w-6xl px-5 py-16 md:py-24">
        <div className="reveal fx-card fx-hero grid items-center gap-10 rounded-[2rem] p-6 md:p-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="relative flex justify-center">
            <div aria-hidden className="absolute inset-x-8 top-8 h-60 rounded-full blur-3xl" style={{ background: `hsl(${HUE.host} 100% 50% / 0.25)` }} />
            <div className="relative"><ProductCover id="host" size="lg" /></div>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-accent">{o.eyebrow}</p>
            <h2 className="font-display mt-3 text-3xl leading-tight md:text-5xl"><PriceText template={o.title} /></h2>
            <p className="mt-4 text-base leading-relaxed text-muted md:text-lg">{o.body}</p>
            <h3 className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-muted">{o.includes}</h3>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {c.features.slice(0, 6).map((f) => <li key={f} className="flex items-start gap-2.5 text-sm"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success"><Icon name="check" className="h-3 w-3" /></span>{f}</li>)}
            </ul>
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
              <p className="flex items-baseline gap-2"><span className="font-display text-gradient text-5xl tabular-nums md:text-6xl"><HostPrice /></span><RegularPrice className="text-xl" /><span className="text-sm text-muted">{m.solution.oneTime}</span></p>
              <GetHostButton where="offer" />
            </div>
            <LaunchBadge className="mt-4" />
            <p className="mt-4 rounded-xl border border-success/30 bg-success/8 px-4 py-2.5 text-sm text-success">{o.bonusLine}</p>
            <p className="mt-4 flex items-start gap-2 text-sm text-success"><Icon name="check" className="mt-0.5 h-4 w-4 shrink-0" />{o.guarantee}</p>
            <div className="mt-7 border-t border-line pt-5">
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{o.stepsTitle}</h3>
              <ol className="mt-3 grid gap-3 sm:grid-cols-3">
                {o.steps.map((x, i) => <li key={x} className="flex items-start gap-3 text-sm"><span className="font-display text-gradient text-2xl leading-none">{i + 1}</span><span className="text-muted">{x}</span></li>)}
              </ol>
            </div>
          </div>
        </div>

        <div id="arma-tu-pack" className="mt-20">
          <div className="reveal max-w-2xl">
            <h3 className="font-display text-2xl md:text-3xl">{o.moreTitle}</h3>
            <p className="mt-2 text-muted">{o.moreBody}</p>
          </div>
          <div className="reveal mt-8"><Shelf /></div>
        </div>

        <div id="packs" className="mt-20">
          <h3 className="reveal font-display text-2xl md:text-3xl">{o.packsTitle}</h3>
          <div className="mt-8 grid items-stretch gap-6 lg:grid-cols-2">{PACK_IDS.map((id) => <PackMini key={id} id={id} />)}</div>
        </div>

        <details id="planes" className="reveal fx-card group mt-14 rounded-3xl p-5 md:p-6">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
            <span>{o.support}</span>
            <span aria-hidden className="text-2xl leading-none text-accent transition group-open:rotate-45">+</span>
          </summary>
          <div className="mt-6">
            <p className="mb-5 max-w-2xl text-sm text-muted">{m.support.body}</p>
            <SupportPicker />
            <p className="mt-5 text-center text-sm text-muted">{m.support.notice}</p>
          </div>
        </details>

        <p className="mx-auto mt-12 max-w-2xl text-center text-xs leading-relaxed text-muted">{m.prices.disclaimer}</p>
      </div>
    </section>
  );
}
