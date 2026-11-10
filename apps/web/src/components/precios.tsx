import Link from "next/link";
import { Icon, Pill } from "@stayflow/ui";
import { LAUNCH_KIT, PACK_IDS, PACKS, PLAN_IDS, PLAN_PRICE, PRODUCT_LIST, PRODUCTS, type ProductId } from "@/lib/catalog";
import { packTotals, usd } from "@/lib/pricing";
import { fmt, getMessages, plural } from "@/i18n";
import { AddPack, AddToCart, Builder, GetHostButton, KitButton, PlanCta } from "./client";
import { btnGhost } from "./styles";
import { HUE, PackCover, ProductCover } from "./covers";

const m = getMessages();
const SECTION = "mx-auto max-w-6xl px-5 py-16 md:py-24";

function Sub({ title, body }: { title: string; body?: string }) {
  return (
    <div className="reveal max-w-2xl">
      <h3 className="font-display text-2xl md:text-3xl">{title}</h3>
      {body && <p className="mt-2 text-muted">{body}</p>}
    </div>
  );
}

/** A tool as a boxed product: the cover with the real system inside, then its price and the buy button. */
export function ProductCard({ id }: { id: ProductId }) {
  const p = PRODUCTS[id];
  const c = m.products[id];
  return (
    <article className="reveal fx-card group relative flex flex-col items-center overflow-hidden rounded-3xl px-5 pb-6 pt-3 text-center" style={{ backgroundImage: `radial-gradient(90% 55% at 50% 0%, hsl(${HUE[id]} 85% 45% / 0.2), transparent)` }}>
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

        <div id="host" className="mt-16 grid items-center gap-10 lg:grid-cols-2">
          <div className="reveal relative"><div aria-hidden className="absolute inset-x-6 top-10 h-72 rounded-full bg-accent/20 blur-3xl" /><div className="relative"><ProductCover id="host" size="lg" /><div className="mt-2 flex flex-wrap justify-center gap-2"><Pill tone="success">{m.prices.host.chipA}</Pill><Pill tone="accent">{m.prices.host.chipB}</Pill><Pill tone="warning">{m.prices.host.chipC}</Pill></div></div></div>
          <div className="reveal">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-accent">{m.prices.host.eyebrow}</p>
            <h3 className="font-display mt-3 text-3xl leading-tight md:text-4xl">{fmt(m.prices.host.title, { price: usd(PRODUCTS.host.price) })}</h3>
            <p className="mt-4 text-muted">{m.prices.host.body}</p>
            <p className="mt-6 flex items-baseline gap-3"><span className="font-display text-gradient text-6xl tabular-nums">{usd(PRODUCTS.host.price)}</span><span className="text-sm text-muted">{m.prices.host.once}</span></p>
            <ul className="mt-5 grid gap-2 sm:grid-cols-2">
              {m.products.host.features.slice(0, 6).map((f) => <li key={f} className="flex items-start gap-2.5 text-sm"><Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-accent" />{f}</li>)}
            </ul>
            <div className="mt-7 flex flex-wrap gap-3">
              <GetHostButton where="price" />
              <a href="#arma-tu-pack" className={`${btnGhost} !px-6 !py-3.5 !text-base`}>{m.prices.host.mix}</a>
            </div>
          </div>
        </div>

        <div id="arma-tu-pack" className="mt-24">
          <Sub title={m.prices.mixTitle} body={m.prices.mixBody} />
          <div className="reveal mt-8"><Builder /></div>
        </div>

        <div id="herramientas" className="mt-24">
          <Sub title={m.prices.separateTitle} body={m.prices.separateBody} />
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{PRODUCT_LIST.filter((p) => p.id !== "host").map((p) => <ProductCard key={p.id} id={p.id} />)}</div>
        </div>

        <div id="packs" className="mt-24">
          <Sub title={m.prices.packsLast} body={m.packs.body} />
          <div className="mt-8 grid items-stretch gap-5 lg:grid-cols-3">{PACK_IDS.map((id) => <PackCard key={id} id={id} />)}</div>
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
          <Sub title={m.plans.title} body={m.plans.body} />
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {PLAN_IDS.map((id) => {
              const p = m.plans.list[id];
              const featured = id === "pro";
              return (
                <article key={id} className={`reveal fx-card relative flex flex-col rounded-3xl p-7 ${featured ? "fx-hero" : ""}`}>
                  {featured && "badge" in p && <span className="absolute -top-3 left-7 rounded-full bg-accent px-3 py-1 text-[11px] font-semibold text-onaccent">{p.badge}</span>}
                  <h4 className="font-display text-xl">{p.name}</h4>
                  <p className="mt-1 text-sm text-muted">{p.for}</p>
                  <p className="mt-5 flex items-baseline gap-1"><span className="font-display text-4xl tabular-nums">{usd(PLAN_PRICE[id])}</span><span className="text-sm text-muted">{m.plans.perMonth}</span></p>
                  <ul className="mt-5 flex-1 space-y-2.5 border-t border-line pt-5">
                    {p.features.map((f) => <li key={f} className="flex items-start gap-2.5 text-sm"><Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-accent" />{f}</li>)}
                  </ul>
                  <p className="mt-5 text-xs font-medium text-accent">{m.plans.soon}</p>
                  <div className="mt-3"><PlanCta plan={id} /></div>
                </article>
              );
            })}
          </div>
          <p className="mt-6 text-center text-sm text-muted">{m.plans.notice}</p>
        </div>

        <p className="mx-auto mt-14 max-w-2xl text-center text-xs leading-relaxed text-muted">{m.prices.disclaimer}</p>
      </div>
    </section>
  );
}
