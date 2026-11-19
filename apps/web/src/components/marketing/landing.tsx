import { BrandMark, Icon, type IconName } from "@stayflow/ui";
import { MARKETING_APP_URL, MARKETING_PRICE } from "@/lib/marketing";
import { t } from "@/lib/t";
import { Motes } from "../effects";
import { btnGhost, btnPrimary } from "../styles";
import { MarketingBuy } from "./buy";
import { COPY } from "./copy";
import { TryIt } from "./tryit";

function Head({ eyebrow, title, body, center = false }: { eyebrow: string; title: string; body?: string; center?: boolean }) {
  return (
    <div className={`reveal ${center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}`}>
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-accent">{eyebrow}</p>
      <h2 className="font-display mt-4 text-3xl leading-tight md:text-5xl">{title}</h2>
      {body && <p className="mt-5 text-base leading-relaxed text-muted md:text-lg">{body}</p>}
    </div>
  );
}

function Ticks({ items }: { items: readonly string[] }) {
  return (
    <ul className="mt-6 space-y-3">
      {items.map((b) => (
        <li key={b} className="flex items-start gap-3 text-[15px]">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full tick">
            <Icon name="check" className="h-3 w-3" />
          </span>
          {b}
        </li>
      ))}
    </ul>
  );
}

export function MarketingHeader() {
  const links = [
    { href: "#que", label: COPY.nav.what },
    { href: "#pruebalo", label: COPY.nav.demo },
    { href: "#preguntas", label: COPY.nav.faq },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-line/50 bg-bg/60 backdrop-blur-2xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <a href="/marketing" aria-label="Stayflow · Digital Studio" className="flex items-center gap-3">
          <span className="flex items-center gap-2.5">
            <span className="keep-blue">
              <BrandMark className="h-8 w-8" />
            </span>
            <span className="font-display text-lg tracking-tight">STAYflow</span>
          </span>
          <span aria-hidden className="h-6 w-px bg-line" />
          <span className="flex items-center gap-2">
            <span className="hidden text-[10px] uppercase tracking-[0.2em] text-muted sm:inline">{t("landing.nav.by")}</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/digital-studio-logo-white.svg" alt="Digital Studio" className="h-6 w-auto sm:h-7" />
          </span>
        </a>
        <nav aria-label="Principal" className="hidden items-center gap-7 text-sm text-muted lg:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="transition hover:text-fg">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3 sm:gap-4">
          <a href={MARKETING_APP_URL} className="hidden text-sm text-muted transition hover:text-fg md:inline">
            {t("landing.nav.login")}
          </a>
          <a href="#precio" className={`${btnPrimary} whitespace-nowrap !px-3.5 !py-2`}>
            {COPY.nav.cta}
          </a>
        </div>
      </div>
    </header>
  );
}

export function MarketingHero() {
  const h = COPY.hero;
  return (
    <section id="top" className="relative overflow-hidden">
      <div aria-hidden className="bg-grid pointer-events-none absolute inset-0" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[640px]" style={{ background: "radial-gradient(55% 60% at 72% 12%, rgb(var(--accent) / 0.3), transparent 70%), radial-gradient(40% 45% at 12% 85%, rgb(var(--accent-2) / 0.13), transparent 70%)" }} />
      <Motes count={14} />
      <div className="relative mx-auto max-w-4xl px-5 pb-16 pt-14 text-center md:pt-24">
        <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/60 px-3.5 py-1.5 text-xs text-muted backdrop-blur">
          <span aria-hidden className="pulse-ring h-1.5 w-1.5 rounded-full bg-accent" />
          {h.eyebrow}
        </p>
        <h1 className="font-display mt-5 text-[2.2rem] font-extrabold uppercase leading-[1.08] tracking-tight sm:text-5xl">
          {h.title} <span className="text-gradient block">{h.accent}</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-fg/85 md:text-xl">{h.body}</p>
        <p className="mt-7 flex flex-wrap items-baseline justify-center gap-x-3">
          <span className="font-display tabular-nums text-5xl md:text-6xl">USD {MARKETING_PRICE}</span>
          <span className="text-sm text-muted">{COPY.price.oneTime}</span>
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <a href="#precio" className={`${btnPrimary} cta-glow !px-6 !py-3.5 !text-base`}>
            {h.cta}
          </a>
          <a href="#pruebalo" className={btnGhost}>
            {h.secondary}
          </a>
        </div>
        <ul className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-muted">
          {h.chips.map((c) => (
            <li key={c} className="flex items-center gap-1.5">
              <Icon name="check" className="h-3.5 w-3.5 text-success" />
              {c}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function MarketingPain() {
  const p = COPY.pain;
  return (
    <section className="mx-auto max-w-6xl px-5 py-16">
      <Head eyebrow={p.eyebrow} title={p.title} center />
      <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {p.items.map((it) => (
          <li key={it.title} className="fx-card reveal rounded-3xl p-6">
            <h3 className="font-display text-lg">{it.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{it.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function MarketingDemo() {
  const d = COPY.demo;
  return (
    <section id="pruebalo" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16">
      <Head eyebrow={d.eyebrow} title={d.title} body={d.body} center />
      <TryIt />
    </section>
  );
}

export function MarketingWhat() {
  const w = COPY.what;
  return (
    <section id="que" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16">
      <Head eyebrow={w.eyebrow} title={w.title} center />
      <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {w.items.map((it) => (
          <li key={it.title} className="fx-card reveal rounded-3xl p-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Icon name={it.icon as IconName} className="h-5 w-5" />
            </span>
            <h3 className="font-display mt-4 text-lg">{it.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{it.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function MarketingSteps() {
  const s = COPY.steps;
  return (
    <section className="mx-auto max-w-5xl px-5 py-16">
      <Head eyebrow={s.eyebrow} title={s.title} center />
      <ol className="mt-10 grid gap-4 md:grid-cols-3">
        {s.items.map((it, i) => (
          <li key={it.title} className="fx-card reveal rounded-3xl p-6">
            <span className="font-display text-3xl text-accent">{i + 1}</span>
            <h3 className="font-display mt-3 text-lg">{it.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{it.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function MarketingHonest() {
  const h = COPY.honest;
  return (
    <section className="mx-auto max-w-6xl px-5 py-16">
      <Head eyebrow={h.eyebrow} title={h.title} center />
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        <div className="fx-card rounded-3xl p-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-success">{h.yesTitle}</p>
          <Ticks items={h.yes} />
        </div>
        <div className="fx-card rounded-3xl p-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted">{h.noTitle}</p>
          <ul className="mt-6 space-y-3">
            {h.no.map((b) => (
              <li key={b} className="flex items-start gap-3 text-[15px] text-fg/85">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-line text-muted">
                  <Icon name="info" className="h-3 w-3" />
                </span>
                {b}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mt-6 text-center text-xs text-muted">{h.disclaimer}</p>
    </section>
  );
}

export function MarketingPricing() {
  const p = COPY.price;
  return (
    <section id="precio" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20">
      <Head eyebrow={p.eyebrow} title={p.title} center />
      <div className="fx-card fx-hero mx-auto mt-12 grid max-w-4xl gap-10 rounded-[2rem] p-8 md:grid-cols-2 md:p-12">
        <div>
          <p className="flex flex-wrap items-baseline gap-x-3">
            <span className="font-display tabular-nums text-6xl md:text-7xl">USD {MARKETING_PRICE}</span>
          </p>
          <p className="mt-1 text-sm text-muted">{p.oneTime}</p>
          <p className="mt-7 text-xs font-semibold uppercase tracking-wide text-muted">{p.includesTitle}</p>
          <Ticks items={p.includes} />
        </div>
        <div className="self-center">
          <MarketingBuy where="pricing" />
          <p className="mt-4 text-center text-xs text-muted">{p.fine}</p>
        </div>
      </div>
    </section>
  );
}

export function MarketingFaq() {
  const f = COPY.faq;
  return (
    <section id="preguntas" className="mx-auto max-w-3xl scroll-mt-20 px-5 py-20">
      <Head eyebrow={f.eyebrow} title={f.title} center />
      <div className="mt-10 divide-y divide-line/60 rounded-3xl border border-line bg-surface/40">
        {f.items.map((it) => (
          <details key={it.q} className="group px-6 py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-medium">
              {it.q}
              <Icon name="chevron" className="h-4 w-4 shrink-0 text-muted transition group-open:rotate-180" />
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted">{it.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function MarketingFinalCta() {
  const c = COPY.cta;
  return (
    <section id="cierre" className="mx-auto max-w-4xl scroll-mt-20 px-5 pb-28 pt-8 text-center">
      <h2 className="font-display text-3xl md:text-5xl">{c.title}</h2>
      <p className="mx-auto mt-4 max-w-xl text-muted md:text-lg">{c.body}</p>
      <div className="fx-card fx-hero mx-auto mt-8 max-w-md rounded-3xl p-6 text-left">
        <MarketingBuy where="final" />
      </div>
    </section>
  );
}
