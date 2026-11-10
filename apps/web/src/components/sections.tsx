import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { BrandMark, Icon, type IconName } from "@stayflow/ui";
import { LAUNCH_KIT, PLAN_IDS, PLAN_PRICE, PRODUCT_LIST, PRODUCTS, type ProductId } from "@/lib/catalog";
import { usd } from "@/lib/pricing";
import { getMessages, type Messages } from "@/i18n";
import { AddToCart, Builder, CartBar, CartButton, KitButton, PlanCta } from "./client";
import { btnGhost, btnPrimary } from "./styles";
import { CartDrawer } from "./cart";
import { FloatCard, HeroStage, ProductArt, ScheduleVisual } from "./visuals";

const SECTION = "mx-auto max-w-6xl px-5 py-20 md:py-28";
const m: Messages = getMessages();

function Head({ eyebrow, title, body, center = false, dark = false }: { eyebrow: string; title: string; body?: string; center?: boolean; dark?: boolean }) {
  return (
    <div className={`reveal ${center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">{eyebrow}</p>
      <h2 className="font-display mt-4 text-3xl leading-[1.1] md:text-5xl">{title}</h2>
      {body && <p className={`mt-5 text-base leading-relaxed md:text-lg ${dark ? "text-muted" : "text-muted"}`}>{body}</p>}
    </div>
  );
}

/** Stayflow wordmark with the Digital Studio seal beside it. */
export function Wordmark() {
  return (
    <span className="flex items-center gap-3">
      <span className="flex items-center gap-2.5"><BrandMark className="h-8 w-8" /><span className="font-display text-lg tracking-tight">Stayflow</span></span>
      <span aria-hidden className="hidden h-6 w-px bg-line sm:block" />
      <span className="hidden items-center gap-2 sm:flex">
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted">{m.nav.by}</span>
        {/* The logo is white artwork; brightness(0) renders it as dark ink on the light page. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/digital-studio-logo-white.svg" alt="Digital Studio" className="h-7 w-auto [filter:brightness(0)]" />
      </span>
    </span>
  );
}

export function Announce() {
  return (
    <div className="zone-dark px-4 py-2 text-center text-xs font-medium sm:text-sm">
      <span className="mr-2 rounded-full bg-accent/20 px-2 py-0.5 text-[11px] font-bold text-accent">−30%</span>
      {m.announce}
    </div>
  );
}

const LINKS = [
  ["#tools", m.nav.tools],
  ["#toolkit", m.nav.toolkit],
  ["#kit", m.nav.kit],
  ["#plans", m.nav.plans],
  ["#faq", m.nav.faq],
] as const;

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/80 backdrop-blur-2xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <Link href="/" aria-label="Stayflow · Digital Studio"><Wordmark /></Link>
        <nav aria-label="Main" className="hidden items-center gap-7 text-sm text-muted lg:flex">
          {LINKS.map(([href, label]) => <a key={href} href={`/${href}`} className="transition hover:text-fg">{label}</a>)}
        </nav>
        <div className="flex items-center gap-2">
          <CartButton />
          <details className="group relative lg:hidden">
            <summary aria-label={m.nav.menu} className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-xl border border-line bg-surface [&::-webkit-details-marker]:hidden"><Icon name="menu" className="h-5 w-5" /></summary>
            <div className="absolute right-0 top-12 w-56 rounded-2xl border border-line bg-surface p-2 shadow-xl">
              {LINKS.map(([href, label]) => <a key={href} href={`/${href}`} className="block rounded-xl px-3 py-2.5 text-sm hover:bg-surface2">{label}</a>)}
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div aria-hidden className="bg-grid pointer-events-none absolute inset-0" />
      {/* Slow-moving colour behind everything: the page is never static. */}
      <div aria-hidden className="blob pointer-events-none absolute -left-24 top-10 h-80 w-80 rounded-full bg-accent2/25 blur-3xl" />
      <div aria-hidden className="blob pointer-events-none absolute right-0 top-40 h-96 w-96 rounded-full bg-accent/15 blur-3xl" style={{ animationDelay: "-7s" }} />
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-14 md:pt-20 lg:grid-cols-[0.9fr_1.1fr] lg:pb-28">
        <div>
          <p className="line-in inline-flex max-w-full items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5 text-xs text-muted shadow-sm">
            <span aria-hidden className="pulse-ring h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            <span className="truncate">{m.hero.eyebrow}</span>
          </p>
          <h1 className="font-display mt-6 text-[2.75rem] leading-[1.04] sm:text-6xl xl:text-[3.9rem]">
            <span className="line-in block" style={{ animationDelay: "0.1s" }}>{m.hero.title}</span>
            <span className="line-in text-gradient text-shine block" style={{ animationDelay: "0.3s" }}>{m.hero.accent}</span>
          </h1>
          <p className="line-in mt-6 max-w-xl text-base leading-relaxed text-muted md:text-lg" style={{ animationDelay: "0.5s" }}>{m.hero.body}</p>
          <div className="line-in mt-8 flex flex-wrap gap-3" style={{ animationDelay: "0.65s" }}>
            <a href="#tools" className={`${btnPrimary} !px-6 !py-3.5 !text-base`}>{m.hero.explore}<Icon name="arrow" className="h-4 w-4" /></a>
            <a href="#toolkit" className={`${btnGhost} !px-6 !py-3.5 !text-base`}>{m.hero.build}</a>
          </div>
          <ul className="line-in mt-8 grid gap-2.5 text-sm text-muted" style={{ animationDelay: "0.8s" }}>
            {[m.hero.point1, m.hero.point2, m.hero.point3].map((x) => (
              <li key={x} className="flex items-center gap-2.5"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/12 text-accent"><Icon name="check" className="h-3 w-3" /></span>{x}</li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <HeroStage />
          <FloatCard icon="qr" tone="accent" title={m.hero.floatA} sub={m.hero.floatAsub} className="-left-1 top-[44%] lg:-left-8" style={{ "--r": "-2deg" } as CSSProperties} />
          <FloatCard icon="check" tone="success" title={m.hero.floatB} sub={m.hero.floatBsub} className="-right-1 top-[58%] lg:-right-6" style={{ "--r": "2deg", animationDelay: "-3s" } as CSSProperties} />
          <p className="mt-3 text-center text-[11px] text-muted lg:text-right">{m.hero.sample}</p>
        </div>
      </div>
    </section>
  );
}

const PROBLEM_ICONS: IconName[] = ["bell", "calendar", "wallet", "tasks", "users", "list"];

export function Problem() {
  return (
    <section className="zone-dark">
      <div className={SECTION}>
        <Head eyebrow={m.problem.eyebrow} title={m.problem.title} />
        <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {m.problem.items.map((x, i) => (
            <li key={x.t} className="reveal fx-card rounded-3xl p-7">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-danger/12 text-danger"><Icon name={PROBLEM_ICONS[i] ?? "alert"} className="h-5 w-5" /></span>
              <h3 className="font-display mt-5 text-lg">{x.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{x.d}</p>
            </li>
          ))}
        </ul>
        <p className="reveal font-display mx-auto mt-14 max-w-2xl text-center text-2xl leading-snug text-gradient md:text-3xl">{m.problem.closing}</p>
      </div>
    </section>
  );
}

export function ProductCard({ id }: { id: ProductId }) {
  const p = PRODUCTS[id];
  const c = m.products[id];
  return (
    <article className="reveal fx-card flex flex-col overflow-hidden rounded-3xl">
      <div className="zone-dark relative h-56 border-b border-line">
        <ProductArt id={id} />
        <span className={`absolute left-4 top-4 rounded-full px-2.5 py-1 text-[11px] font-semibold ${p.status === "available" ? "bg-accent text-onaccent" : "border border-line bg-surface text-muted"}`}>{p.status === "available" ? m.solution.live : m.solution.preorder}</span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-display text-xl">{p.name}</h3>
          <p className="shrink-0"><span className="font-display text-2xl tabular-nums">{usd(p.price)}</span><span className="ml-1 text-xs text-muted">{m.solution.oneTime}</span></p>
        </div>
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">{m.solution.solves}</p>
        <p className="mt-1 text-sm leading-relaxed">{c.problem}</p>
        <ul className="mt-4 space-y-2">
          {c.benefits.map((b) => <li key={b} className="flex items-start gap-2.5 text-sm text-muted"><span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent/12 text-accent"><Icon name="check" className="h-2.5 w-2.5" /></span>{b}</li>)}
        </ul>
        <div className="mt-auto grid grid-cols-2 gap-2.5 pt-6">
          <AddToCart id={id} className="!px-3" />
          <Link href={`/products/${id}`} className={`${btnGhost} !px-3`}>{m.solution.learn}</Link>
        </div>
      </div>
    </article>
  );
}

export function Solution() {
  return (
    <section id="tools" className={SECTION}>
      <Head eyebrow={m.solution.eyebrow} title={m.solution.title} body={m.solution.body} />
      <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {PRODUCT_LIST.map((p) => <ProductCard key={p.id} id={p.id} />)}
      </div>
    </section>
  );
}

export function Compare() {
  return (
    <section className="border-y border-line/70 bg-surface2/50">
      <div className={SECTION}>
        <Head center eyebrow={m.compare.eyebrow} title={m.compare.title} body={m.compare.body} />
        <div className="reveal mt-14 overflow-hidden rounded-3xl border border-line bg-surface shadow-sm">
          <div className="grid grid-cols-2 text-sm font-semibold">
            <p className="flex items-center gap-2 bg-surface2 px-5 py-4 text-muted"><Icon name="close" className="h-4 w-4 text-danger" />{m.compare.left}</p>
            <p className="flex items-center gap-2 bg-accent/10 px-5 py-4 text-accent"><Icon name="check" className="h-4 w-4" />{m.compare.right}</p>
          </div>
          {m.compare.rows.map((r) => (
            <div key={r.a} className="grid grid-cols-2 border-t border-line text-sm">
              <p className="px-5 py-4 text-muted">{r.a}</p>
              <p className="bg-accent/[0.04] px-5 py-4 font-medium">{r.b}</p>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-xs leading-relaxed text-muted">{m.compare.disclaimer}</p>
      </div>
    </section>
  );
}

export function MultiPack() {
  return (
    <section id="toolkit" className={SECTION}>
      <Head eyebrow={m.builder.eyebrow} title={m.builder.title} body={m.builder.body} />
      <div className="reveal mt-12"><Builder /></div>
    </section>
  );
}

export function Kit() {
  return (
    <section id="kit" className="zone-dark">
      <div className={`${SECTION} grid items-center gap-12 lg:grid-cols-2`}>
        <div className="reveal">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">{m.kit.eyebrow}</p>
          <h2 className="font-display mt-4 text-3xl leading-[1.1] md:text-5xl">{m.kit.title}</h2>
          <p className="mt-5 text-base leading-relaxed text-muted md:text-lg">{m.kit.body}</p>
          <p className="mt-8 flex items-baseline gap-2"><span className="font-display text-gradient text-6xl">{usd(LAUNCH_KIT.price)}</span><span className="text-sm text-muted">{m.kit.price}</span></p>
          <KitButton className="mt-6 !px-6 !py-3.5 !text-base" />
          <p className="mt-4 text-xs leading-relaxed text-muted">{m.kit.status}<br />{m.kit.note}</p>
        </div>
        <div className="reveal fx-card fx-hero rounded-3xl p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{m.kit.includes}</p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {m.kit.items.map((x) => <li key={x} className="flex items-center gap-3 rounded-xl border border-line bg-bg/50 px-3.5 py-3 text-sm"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent"><Icon name="check" className="h-3.5 w-3.5" /></span>{x}</li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function Plans() {
  return (
    <section id="plans" className={SECTION}>
      <Head center eyebrow={m.plans.eyebrow} title={m.plans.title} body={m.plans.body} />
      <div className="mt-14 grid gap-5 lg:grid-cols-3">
        {PLAN_IDS.map((id) => {
          const p = m.plans.list[id];
          const featured = id === "pro";
          return (
            <article key={id} className={`reveal fx-card relative flex flex-col rounded-3xl p-8 ${featured ? "fx-hero !border-accent" : ""}`}>
              {featured && <span className="absolute -top-3 left-8 rounded-full bg-accent px-3 py-1 text-[11px] font-semibold text-onaccent">{"badge" in p ? p.badge : ""}</span>}
              <h3 className="font-display text-2xl">{p.name}</h3>
              <p className="mt-1 text-sm text-muted">{p.for}</p>
              <p className="mt-6 flex items-baseline gap-1"><span className="font-display text-5xl tabular-nums">{usd(PLAN_PRICE[id])}</span><span className="text-sm text-muted">{m.plans.perMonth}</span></p>
              <ul className="mt-6 flex-1 space-y-3 border-t border-line pt-6">
                {p.features.map((f) => <li key={f} className="flex items-start gap-3 text-sm"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/12 text-accent"><Icon name="check" className="h-3 w-3" /></span>{f}</li>)}
              </ul>
              <p className="mt-6 text-xs font-medium text-accent">{m.plans.soon}</p>
              <div className="mt-3"><PlanCta plan={id} /></div>
            </article>
          );
        })}
      </div>
      <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-muted">{m.plans.notice}</p>
    </section>
  );
}

const BENEFIT_ICONS: IconName[] = ["clock", "calendar", "users", "wallet", "tasks", "building"];

export function Benefits() {
  return (
    <section className="border-y border-line/70 bg-surface2/50">
      <div className={SECTION}>
        <Head center eyebrow={m.benefits.eyebrow} title={m.benefits.title} />
        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {m.benefits.items.map((b, i) => (
            <li key={b.t} className="reveal flex gap-4 rounded-3xl border border-line bg-surface p-6 shadow-sm">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/12 text-accent"><Icon name={BENEFIT_ICONS[i] ?? "check"} className="h-5 w-5" /></span>
              <span><span className="font-display block text-lg">{b.t}</span><span className="mt-1 block text-sm leading-relaxed text-muted">{b.d}</span></span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Faq() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: m.faq.items.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })),
  };
  return (
    <section id="faq" className="mx-auto max-w-3xl px-5 py-20 md:py-28">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Head center eyebrow={m.faq.eyebrow} title={m.faq.title} />
      <div className="mt-12 divide-y divide-line border-y border-line">
        {m.faq.items.map((i) => (
          <details key={i.q} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-base font-medium [&::-webkit-details-marker]:hidden">
              {i.q}<span aria-hidden className="text-2xl leading-none text-accent transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 max-w-2xl leading-relaxed text-muted">{i.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-5 pb-20 md:pb-28">
      <div className="zone-dark reveal relative overflow-hidden rounded-[32px] px-6 py-16 text-center md:px-16 md:py-24">
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(60% 80% at 50% 120%, rgb(var(--accent) / 0.35), transparent 70%)" }} />
        <div className="relative">
          <h2 className="font-display mx-auto max-w-2xl text-3xl leading-tight md:text-5xl">{m.cta.title}</h2>
          <p className="mx-auto mt-5 max-w-lg text-lg text-muted">{m.cta.body}</p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <a href="#tools" className={`${btnPrimary} !px-7 !py-3.5 !text-base`}>{m.cta.explore}</a>
            <a href="#toolkit" className="inline-flex items-center justify-center rounded-xl border border-white/20 px-7 py-3.5 text-base font-semibold text-white transition hover:bg-white/10">{m.cta.build}</a>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-12 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Wordmark />
          <p className="mt-4 max-w-xs text-sm text-muted">{m.footer.tag}</p>
        </div>
        <p className="text-xs text-muted">© {new Date().getFullYear()} Digital Studio. {m.footer.rights}</p>
      </div>
    </footer>
  );
}

/** Cart drawer + floating bar, mounted once per page. */
export function CartUi() {
  return (
    <>
      <CartDrawer />
      <CartBar />
    </>
  );
}

export { ScheduleVisual, type ReactNode };
