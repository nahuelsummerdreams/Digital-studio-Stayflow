import type { ReactNode } from "react";
import { BrandMark, Icon, type IconName } from "@stayflow/ui";
import { getMessages } from "@/i18n";
import { HOST_URL, t } from "@/lib/t";
import { btnGhost, btnPrimary } from "../styles";
import { BuyBox, PriceBlock } from "./offer";

const m = getMessages().complete;

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
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full tick"><Icon name="check" className="h-3 w-3" /></span>
          {b}
        </li>
      ))}
    </ul>
  );
}

/** A real screen of the app, in a frame. Always says it is sample data: nothing here is a real customer. */
function Shot({ src, alt, note, eager = false }: { src: string; alt: string; note?: string; eager?: boolean }) {
  return (
    <figure className="relative min-w-0">
      <div aria-hidden className="absolute -inset-4 rounded-[40px] bg-accent/10 blur-2xl" />
      <div className="fx-card relative overflow-hidden rounded-3xl p-1.5 shadow-[0_40px_90px_-30px_rgb(var(--accent)/0.45)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} loading={eager ? "eager" : "lazy"} decoding="async" className="block h-auto w-full rounded-[20px]" />
      </div>
      <figcaption className="mt-3 text-center text-xs text-muted">{note ?? m.hero.sample}</figcaption>
    </figure>
  );
}

const LINKS = [
  { href: "#como", label: m.nav.how },
  { href: "#precio", label: m.nav.price },
  { href: "#preguntas", label: m.nav.faq },
] as const;

export function CompleteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/50 bg-bg/60 backdrop-blur-2xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <a href="/complete" aria-label="Stayflow · Digital Studio" className="flex items-center gap-3">
          <span className="flex items-center gap-2.5">
            <span className="keep-blue"><BrandMark className="h-8 w-8" /></span>
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
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="transition hover:text-fg">{l.label}</a>
          ))}
        </nav>
        <div className="flex items-center gap-3 sm:gap-4">
          <a href={HOST_URL} className="hidden text-sm text-muted transition hover:text-fg md:inline">{t("landing.nav.login")}</a>
          <a href="#precio" className={`${btnPrimary} whitespace-nowrap !px-3.5 !py-2`}>{m.nav.cta}</a>
        </div>
      </div>
    </header>
  );
}

export function CompleteHero() {
  const h = m.hero;
  return (
    <section id="top" className="relative overflow-hidden">
      <div aria-hidden className="bg-grid pointer-events-none absolute inset-0" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[680px]" style={{ background: "radial-gradient(60% 60% at 70% 10%, rgb(var(--accent) / 0.24), transparent 70%)" }} />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-12 md:pt-20 lg:grid-cols-[0.95fr_1.05fr] lg:pb-24">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/60 px-3.5 py-1.5 text-xs text-muted backdrop-blur">
            <span aria-hidden className="pulse-ring h-1.5 w-1.5 rounded-full bg-accent" />
            {h.eyebrow}
          </p>
          <h1 className="font-display mt-5 text-[2rem] font-extrabold uppercase leading-[1.1] tracking-tight sm:text-4xl xl:text-[2.6rem]">
            {h.title} <span className="text-gradient block">{h.accent}</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-fg/85 md:text-xl">{h.body}</p>
          <PriceBlock className="mt-7" />
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <a href="#precio" className={`${btnPrimary} cta-glow !px-6 !py-3.5 !text-base`}>{h.cta}</a>
            <a href="#como" className={btnGhost}>{h.secondary}</a>
          </div>
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
            {h.chips.map((c) => (
              <li key={c} className="flex items-center gap-1.5"><Icon name="check" className="h-3.5 w-3.5 text-success" />{c}</li>
            ))}
          </ul>
        </div>
        <Shot src="/shots/complete-inicio.webp" alt={m.money.alt} eager />
      </div>
    </section>
  );
}

export function CompletePain() {
  const p = m.pain;
  return (
    <section id="como" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20">
      <Head eyebrow={p.eyebrow} title={p.title} body={p.body} center />
      <div className="mt-12 grid gap-5 md:grid-cols-2">
        <div className="fx-card rounded-3xl p-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-danger/90">{p.beforeTitle}</p>
          <ul className="mt-4 space-y-3">
            {p.before.map((b) => (
              <li key={b} className="flex items-start gap-3 text-[15px] text-fg/85"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-danger/15 text-danger"><Icon name="close" className="h-3 w-3" /></span>{b}</li>
            ))}
          </ul>
        </div>
        <div className="fx-card fx-hero rounded-3xl p-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">{p.afterTitle}</p>
          <ul className="mt-4 space-y-3">
            {p.after.map((b) => (
              <li key={b} className="flex items-start gap-3 text-[15px]"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full tick"><Icon name="check" className="h-3 w-3" /></span>{b}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Feature({ eyebrow, title, body, bullets, note, visual, flip = false }: { eyebrow: string; title: string; body: string; bullets: readonly string[]; note?: string; visual: ReactNode; flip?: boolean }) {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16">
      <div className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-16 ${flip ? "lg:[&>*:first-child]:order-2" : ""}`}>
        <div className="reveal">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-accent">{eyebrow}</p>
          <h2 className="font-display mt-4 text-3xl leading-tight md:text-4xl">{title}</h2>
          <p className="mt-4 text-base leading-relaxed text-muted md:text-lg">{body}</p>
          <Ticks items={bullets} />
          {note && <p className="mt-5 rounded-xl border border-line bg-surface/50 px-4 py-3 text-sm text-muted">{note}</p>}
        </div>
        {visual}
      </div>
    </section>
  );
}

export function CompleteMoney() {
  const f = m.money;
  return <Feature eyebrow={f.eyebrow} title={f.title} body={f.body} bullets={f.bullets} note={f.note} visual={<Shot src="/shots/complete-inicio.webp" alt={f.alt} />} />;
}

export function CompleteCalendar() {
  const f = m.calendar;
  return <Feature flip eyebrow={f.eyebrow} title={f.title} body={f.body} bullets={f.bullets} visual={<Shot src="/shots/complete-calendario.webp" alt={f.alt} />} />;
}

const AREA_ICONS: IconName[] = ["dashboard", "calendar", "building", "wallet", "tasks", "qr", "users"];

export function CompleteAreas() {
  const a = m.areas;
  return (
    <section className="mx-auto max-w-6xl px-5 py-20">
      <Head eyebrow={a.eyebrow} title={a.title} body={a.body} center />
      <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {a.items.map((it, i) => (
          <li key={it.title} className="fx-card rounded-3xl p-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/12 text-accent"><Icon name={AREA_ICONS[i] ?? "check"} className="h-5 w-5" /></span>
            <h3 className="font-display mt-4 text-xl">{it.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{it.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function CompleteWorld() {
  const w = m.world;
  return (
    <section className="mx-auto max-w-6xl px-5 py-16">
      <div className="fx-card fx-hero rounded-[2rem] p-8 md:p-12">
        <Head eyebrow={w.eyebrow} title={w.title} body={w.body} />
        <ul className="mt-8 flex flex-wrap gap-3" aria-label={w.title}>
          {["English", "Español", "Português"].map((l) => (
            <li key={l} className="rounded-full border border-line bg-surface/60 px-5 py-2 text-sm font-semibold">{l}</li>
          ))}
        </ul>
        <p className="mt-5 text-sm text-muted">{w.note}</p>
      </div>
    </section>
  );
}

export function CompleteHonest() {
  const h = m.honest;
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
              <li key={b} className="flex items-start gap-3 text-[15px] text-fg/85"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-line text-muted"><Icon name="info" className="h-3 w-3" /></span>{b}</li>
            ))}
          </ul>
          <a href="/?tipo=hotel" className="mt-5 inline-block text-sm text-accent underline-offset-4 hover:underline">{h.waitlist}</a>
        </div>
      </div>
      <p className="mt-6 text-center text-xs text-muted">{h.disclaimer}</p>
    </section>
  );
}

export function CompletePricing() {
  const p = m.price;
  return (
    <section id="precio" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20">
      <Head eyebrow={p.eyebrow} title={p.title} center />
      <div className="fx-card fx-hero mx-auto mt-12 grid max-w-4xl gap-10 rounded-[2rem] p-8 md:grid-cols-[1fr_1fr] md:p-12">
        <div>
          <PriceBlock />
          <p className="mt-7 text-xs font-semibold uppercase tracking-wide text-muted">{p.includesTitle}</p>
          <Ticks items={p.includes} />
        </div>
        <div className="self-center">
          <BuyBox where="pricing" />
          <p className="mt-4 text-center text-xs text-muted">{p.fine}</p>
        </div>
      </div>
    </section>
  );
}

export function CompleteFaq() {
  const f = m.faq;
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

export function CompleteFinalCta() {
  const c = m.cta;
  return (
    <section className="mx-auto max-w-4xl px-5 pb-24 pt-8 text-center">
      <h2 className="font-display text-3xl md:text-5xl">{c.title}</h2>
      <p className="mx-auto mt-4 max-w-xl text-muted md:text-lg">{c.body}</p>
      <a href="#precio" className={`${btnPrimary} cta-glow mt-8 !px-8 !py-4 !text-base`}>{c.button}</a>
    </section>
  );
}
