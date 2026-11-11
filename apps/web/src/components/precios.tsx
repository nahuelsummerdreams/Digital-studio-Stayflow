import Link from "next/link";
import { Icon, Pill } from "@stayflow/ui";
import { LAUNCH_KIT, PACK_IDS, PACKS, PRODUCT_LIST, PRODUCTS, type ProductId } from "@/lib/catalog";
import { computeTotals, packTotals, usd } from "@/lib/pricing";
import { fmt, getMessages, plural } from "@/i18n";
import { AddPack, AddToCart, KitButton, SupportPicker } from "./client";
import { Shelf } from "./shelf";
import { btnGhost } from "./styles";
import { HUE, PackCover, ProductCover } from "./covers";

const m = getMessages();
const SECTION = "mx-auto max-w-6xl px-5 py-16 md:py-24";

/** Real numbers for the upsell and downsell examples, from the same price rules the cart uses. */
const upA = computeTotals({ apps: ["host"], kit: false });
const upB = computeTotals({ apps: ["host", "guest"], kit: false });
const downA = computeTotals({ apps: ["host", "guest", "ai", "operations"], kit: false });
const downB = computeTotals({ apps: ["guest", "ai", "operations"], kit: false });

function Sub({ title, body }: { title: string; body?: string }) {
  return (
    <div className="reveal max-w-2xl">
      <h3 className="font-display text-2xl md:text-3xl">{title}</h3>
      {body && <p className="mt-2 text-muted">{body}</p>}
    </div>
  );
}

/** A tool as a compact boxed card (used for cross-sell on product pages). */
export function ProductCard({ id }: { id: ProductId }) {
  const p = PRODUCTS[id];
  const c = m.products[id];
  return (
    <article className="reveal fx-card group relative flex flex-col items-center overflow-hidden rounded-3xl px-5 pb-6 pt-3 text-center" style={{ backgroundImage: `radial-gradient(90% 55% at 50% 0%, hsl(${HUE[id]} 100% 50% / 0.3), transparent)` }}>
      <ProductCover id={id} />
      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${p.status === "available" ? "bg-accent text-onaccent" : "border border-line bg-surface text-muted"}`}>{p.status === "available" ? m.solution.live : m.solution.preorder}</span>
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

/** A tool sold on its own: the box, the pain it solves, what it is for, what you get, and the add-to-cart. */
export function ProductRow({ id, flip }: { id: ProductId; flip: boolean }) {
  const p = PRODUCTS[id];
  const c = m.products[id];
  const sell = m.sell[id];
  const live = p.status === "available";
  return (
    <article id={`p-${id}`} className="reveal fx-card relative grid items-center gap-8 overflow-hidden rounded-3xl p-6 md:p-10 lg:grid-cols-2 lg:gap-12" style={{ backgroundImage: `radial-gradient(70% 90% at ${flip ? "100%" : "0%"} 0%, hsl(${HUE[id]} 100% 50% / 0.22), transparent)` }}>
      <div className={`flex justify-center ${flip ? "lg:order-2" : ""}`}><ProductCover id={id} size="lg" /></div>
      <div>
        <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold ${live ? "bg-accent text-onaccent" : "border border-line bg-surface text-muted"}`}>{live ? m.solution.live : m.solution.preorder}</span>
        <h3 className="font-display mt-3 text-3xl leading-tight md:text-4xl">{sell.pain}</h3>
        <p className="mt-2 text-sm font-semibold uppercase tracking-[0.14em] text-accent">{m.sell.forLabel}</p>
        <p className="mt-2 text-base leading-relaxed text-muted">{sell.serves}</p>
        <ul className="mt-5 space-y-2.5">
          {c.benefits.map((b) => <li key={b} className="flex items-start gap-3 text-sm"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success"><Icon name="check" className="h-3 w-3" /></span>{b}</li>)}
        </ul>
        <p className="mt-6 flex items-baseline gap-2"><span className="font-display text-gradient text-5xl tabular-nums">{usd(p.price)}</span><span className="text-sm text-muted">{m.solution.oneTime}</span></p>
        <div className="mt-4 flex flex-wrap gap-3">
          <AddToCart id={id} className="!px-7 !py-3.5 !text-base" />
          <Link href={`/products/${id}`} className={`${btnGhost} !py-3.5`}>{m.solution.learn}</Link>
        </div>
      </div>
    </article>
  );
}

function PackCard({ id }: { id: (typeof PACK_IDS)[number] }) {
  const c = m.packs.list[id];
  const t = packTotals(id);
  const featured = id === "mega";
  return (
    <article className={`reveal fx-card relative flex flex-col items-center rounded-3xl px-6 pb-7 pt-3 text-center ${featured ? "fx-hero" : ""}`}>
      {c.badge && <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-accent px-3 py-1 text-[11px] font-semibold text-onaccent shadow-[0_0_24px_-4px_rgb(var(--accent))]">{c.badge}</span>}
      <PackCover id={id} />
      <h4 className="font-display mt-2 text-xl">{c.name}</h4>
      <p className="mt-1 text-sm text-muted">{c.for}</p>
      <p className="mt-4 flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1">
        <span className="font-display text-gradient whitespace-nowrap text-4xl tabular-nums">{usd(t.total)}</span>
        <span className="whitespace-nowrap text-sm text-muted line-through">{usd(t.originalTotal)}</span>
      </p>
      <p className="mt-1 text-sm font-medium text-success">{fmt(m.packs.saves, { amount: usd(t.saved) })} · {m.solution.oneTime}</p>
      <ul className="mt-5 flex flex-wrap justify-center gap-1.5">
        {PACKS[id].apps.map((a) => <li key={a} className="rounded-full border border-line bg-bg/50 px-2.5 py-1 text-[11px] text-muted">{PRODUCTS[a].name.replace("Stayflow ", "")} · {usd(PRODUCTS[a].price)}</li>)}
      </ul>
      <div className="mt-6 w-full"><AddPack pack={id} /></div>
    </article>
  );
}

/** Everything about money in one place: ready-made packs, each tool's price, a live pack builder, the Launch Kit and the plans. */
export function Precios() {
  return (
    <section id="precios" className="relative overflow-hidden border-t border-line/60 bg-surface/30">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-[480px] w-[800px] -translate-x-1/2 rounded-full bg-accent/10 blur-3xl" />
      <div className={`${SECTION} relative`}>
        <div className="reveal mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-accent">{m.prices.eyebrow}</p>
          <h2 className="font-display mt-4 text-3xl leading-tight md:text-5xl">{m.prices.title}</h2>
          <p className="mt-5 text-base leading-relaxed text-muted md:text-lg">{m.prices.body}</p>
        </div>

        <div id="herramientas" className="mt-16">
          <Sub title={m.prices.separateTitle} body={m.prices.separateBody} />
          <div className="mt-8 space-y-6">{PRODUCT_LIST.map((p, i) => <ProductRow key={p.id} id={p.id} flip={i % 2 === 1} />)}</div>
        </div>

        <div id="packs" className="mt-24">
          <Sub title={m.prices.packsLast} body={m.packs.body} />
          <div className="mt-8 grid items-stretch gap-5 lg:grid-cols-3">{PACK_IDS.map((id) => <PackCard key={id} id={id} />)}</div>
        </div>

        <div id="arma-tu-pack" className="mt-24">
          <Sub title={m.prices.mixTitle} body={m.prices.mixBody} />
          <div className="reveal mt-8"><Shelf /></div>
          <div className="mt-10">
            <h4 className="reveal font-display text-xl">{m.prices.offersTitle}</h4>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="reveal fx-card rounded-3xl border-accent/30 p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent"><Icon name="trendUp" className="h-5 w-5" /></span>
                <h5 className="font-display mt-4 text-lg">{m.prices.upsellTitle}</h5>
                <p className="mt-2 text-sm leading-relaxed text-muted">{fmt(m.prices.upsellBody, { a: usd(upA.total), b: usd(upB.total), c: usd(upB.originalTotal), d: usd(upB.saved) })}</p>
              </div>
              <div className="reveal fx-card rounded-3xl p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-line/60 text-muted"><Icon name="trendDown" className="h-5 w-5" /></span>
                <h5 className="font-display mt-4 text-lg">{m.prices.downsellTitle}</h5>
                <p className="mt-2 text-sm leading-relaxed text-muted">{fmt(m.prices.downsellBody, { a: usd(downA.total), b: usd(downB.total) })}</p>
              </div>
            </div>
          </div>
        </div>

        <div id="kit" className="mt-24 grid items-center gap-10 lg:grid-cols-2">
          <div className="reveal">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-accent">{m.kit.eyebrow}</p>
            <h3 className="font-display mt-3 text-3xl leading-tight md:text-4xl">{m.kit.title}</h3>
            <p className="mt-4 text-muted">{m.kit.body}</p>
            <p className="mt-6 flex items-baseline gap-2"><span className="font-display text-gradient text-6xl">{usd(LAUNCH_KIT.price)}</span><span className="text-sm text-muted">{m.kit.price}</span></p>
            <KitButton className="mt-5 !px-6 !py-3.5 !text-base" />
            <p className="mt-4 text-xs leading-relaxed text-muted">{m.kit.status}<br />{m.kit.note}</p>
          </div>
          <div className="reveal fx-card rounded-3xl p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{m.kit.includes}</p>
            <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {m.kit.items.map((x) => <li key={x} className="flex items-center gap-3 rounded-xl border border-line bg-bg/50 px-3.5 py-3 text-sm"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent"><Icon name="check" className="h-3.5 w-3.5" /></span>{x}</li>)}
            </ul>
          </div>
        </div>

        <div id="planes" className="mt-24">
          <Sub title={m.support.title} body={m.support.body} />
          <div className="reveal mt-8"><SupportPicker /></div>
          <p className="mt-6 text-center text-sm text-muted">{m.support.notice}</p>
        </div>

        <p className="mx-auto mt-14 max-w-2xl text-center text-xs leading-relaxed text-muted">{m.prices.disclaimer}</p>
      </div>
    </section>
  );
}
