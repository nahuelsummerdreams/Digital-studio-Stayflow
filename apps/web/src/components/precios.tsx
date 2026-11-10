import Link from "next/link";
import { Icon } from "@stayflow/ui";
import { LAUNCH_KIT, PACK_IDS, PACKS, PLAN_IDS, PLAN_PRICE, PRODUCT_LIST, PRODUCTS, type ProductId } from "@/lib/catalog";
import { packTotals, usd } from "@/lib/pricing";
import { fmt, getMessages, plural } from "@/i18n";
import { AddPack, AddToCart, Builder, KitButton, PlanCta } from "./client";
import { btnGhost } from "./styles";
import { ProductArt } from "./visuals";

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

/** A tool with its price, its picture and what it does for you. Used in the price list and on the product pages. */
export function ProductCard({ id }: { id: ProductId }) {
  const p = PRODUCTS[id];
  const c = m.products[id];
  return (
    <article className="reveal fx-card flex flex-col overflow-hidden rounded-3xl">
      <div className="relative h-52 border-b border-line bg-bg/60">
        <ProductArt id={id} />
        <span className={`absolute left-4 top-4 rounded-full px-2.5 py-1 text-[11px] font-semibold ${p.status === "available" ? "bg-accent text-onaccent" : "border border-line bg-surface text-muted"}`}>{p.status === "available" ? m.solution.live : m.solution.preorder}</span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-display text-xl">{p.name}</h3>
          <p className="shrink-0 text-right"><span className="font-display text-2xl tabular-nums">{usd(p.price)}</span><span className="block text-[11px] text-muted">{m.solution.oneTime}</span></p>
        </div>
        <p className="mt-2 text-sm text-muted">{c.problem}</p>
        <ul className="mt-4 space-y-2">
          {c.benefits.map((b) => <li key={b} className="flex items-start gap-2.5 text-sm"><span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent"><Icon name="check" className="h-2.5 w-2.5" /></span>{b}</li>)}
        </ul>
        <div className="mt-auto grid grid-cols-2 gap-2.5 pt-6">
          <AddToCart id={id} className="!px-3" />
          <Link href={`/products/${id}`} className={`${btnGhost} !px-3`}>{m.solution.learn}</Link>
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
    <article className={`reveal fx-card relative flex flex-col rounded-3xl p-7 ${featured ? "fx-hero" : ""}`}>
      {c.badge && <span className="absolute -top-3 left-7 rounded-full bg-accent px-3 py-1 text-[11px] font-semibold text-onaccent shadow-[0_0_24px_-4px_rgb(var(--accent))]">{c.badge}</span>}
      <h4 className="font-display text-xl">{c.name}</h4>
      <p className="mt-1 min-h-10 text-sm text-muted">{c.for}</p>
      <p className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-display text-gradient whitespace-nowrap text-4xl tabular-nums xl:text-[2.6rem]">{usd(t.total)}</span>
        <span className="whitespace-nowrap text-sm text-muted line-through">{usd(t.originalTotal)}</span>
      </p>
      <p className="mt-1 text-sm font-medium text-success">{fmt(m.packs.saves, { amount: usd(t.saved) })} · {m.solution.oneTime}</p>
      <p className="mb-3 mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-muted">{m.packs.includes} · {plural(m.packs, "apps", t.appCount)}</p>
      <ul className="flex-1 space-y-2">
        {PACKS[id].apps.map((a) => (
          <li key={a} className="flex items-center justify-between gap-3 text-sm"><span className="flex items-center gap-2.5"><Icon name="check" className="h-4 w-4 text-accent" />{PRODUCTS[a].name}</span><span className="text-xs tabular-nums text-muted">{usd(PRODUCTS[a].price)}</span></li>
        ))}
      </ul>
      <div className="mt-7"><AddPack pack={id} /></div>
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

        <div className="mt-16">
          <Sub title={m.packs.title} body={m.packs.body} />
          <div className="mt-8 grid items-stretch gap-5 lg:grid-cols-3">{PACK_IDS.map((id) => <PackCard key={id} id={id} />)}</div>
        </div>

        <div id="herramientas" className="mt-24">
          <Sub title={m.prices.toolsTitle} />
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{PRODUCT_LIST.map((p) => <ProductCard key={p.id} id={p.id} />)}</div>
        </div>

        <div id="arma-tu-pack" className="mt-24">
          <Sub title={m.builder.title} />
          <div className="reveal mt-8"><Builder /></div>
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
