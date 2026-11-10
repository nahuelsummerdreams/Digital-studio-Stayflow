import type { CSSProperties, ReactNode } from "react";
import { Avatar, Icon, buttonClass, type IconName } from "@stayflow/ui";
import { GUEST_URL, HOST_URL, PROFIT_URL, t } from "@/lib/t";
import { Motes, Tilt } from "./effects";
import { BookingsMock, DashboardMock, GuestsMock, ProfitMock, ScheduleMock, TasksMock } from "./mock";

const SECTION = "mx-auto max-w-6xl px-5 py-20 md:py-28";

function Head({ eyebrow, title, body, center = false }: { eyebrow: string; title: string; body?: string; center?: boolean }) {
  return (
    <div className={`reveal ${center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}`}>
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-accent">{eyebrow}</p>
      <h2 className="font-display mt-4 text-3xl leading-tight md:text-5xl">{title}</h2>
      {body && <p className="mt-5 text-base leading-relaxed text-muted md:text-lg">{body}</p>}
    </div>
  );
}

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div aria-hidden className="bg-grid pointer-events-none absolute inset-0" />
      <Motes />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[680px]" style={{ background: "radial-gradient(60% 60% at 70% 10%, rgb(var(--accent) / 0.24), transparent 70%)" }} />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-12 md:pt-20 lg:grid-cols-[0.95fr_1.05fr] lg:pb-24">
        <div className="anim-stagger">
          <p className="inline-flex max-w-full items-center gap-2 rounded-full border border-line bg-surface/60 px-3.5 py-1.5 text-xs text-muted backdrop-blur">
            <span aria-hidden className="pulse-ring h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
            <span className="truncate">{t("landing.hero.eyebrow")}</span>
          </p>
          <h1 className="font-display mt-6 text-[1.95rem] font-extrabold uppercase leading-[1.16] tracking-tight sm:text-4xl xl:text-[2.5rem]">
            {t("landing.hero.title")} <span className="text-gradient block">{t("landing.hero.accent")}</span>
          </h1>
          <ul className="mt-6 flex flex-wrap gap-2">
            {t("landing.hero.pains").split("|").map((x) => (
              <li key={x} className="rounded-full border border-danger/30 bg-danger/10 px-3 py-1.5 text-[13px] text-fg/90">{x}</li>
            ))}
          </ul>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted md:text-lg">{t("landing.hero.body")}</p>
          <p className="font-display mt-4 max-w-xl text-xl font-bold leading-snug md:text-2xl">{t("landing.hero.question")}</p>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted"><b className="font-extrabold text-fg">STAY</b><span className="font-semibold text-fg">flow</span> {t("landing.hero.brand")}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href="#sistema" className={`${buttonClass} gap-2 !px-6 !py-3.5 !text-base`}>
              {t("landing.hero.cta")} <Icon name="arrow" className="h-4 w-4" />
            </a>
            <a href="#herramientas" className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface/40 px-6 py-3.5 text-base font-semibold text-fg backdrop-blur transition hover:border-accent/60">
              {t("landing.hero.secondary")}
            </a>
          </div>
        </div>

        <div className="relative">
          <div aria-hidden className="absolute -inset-6 rounded-[56px] bg-accent/20 blur-3xl" />
          <div className="relative pb-10 pt-4">
            <div className="orbit hidden lg:block" aria-hidden />
            <Tilt className="relative">
              {/* A ring of light travels around the screen; the screen itself is alive (see DashboardMock). */}
              <div className="relative overflow-hidden rounded-[30px] p-[1.5px] shadow-[0_40px_90px_-30px_rgb(var(--accent)/0.5)]">
                <span aria-hidden className="spin-ring" />
                <div className="relative rounded-[28px] bg-bg"><DashboardMock compact /></div>
              </div>
            </Tilt>
            <div className="drift fx-card absolute -left-2 top-[34%] hidden w-64 rounded-2xl p-3 shadow-2xl sm:block lg:-left-8" style={{ "--r": "-2deg" } as CSSProperties}>
              <div className="flex items-center gap-3">
                <Avatar name="Familia Ortega" className="h-9 w-9 text-xs" />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold">{t("landing.hero.floatA")}</p>
                  <p className="truncate text-[11px] text-muted">{t("landing.hero.floatAsub")}</p>
                </div>
              </div>
            </div>
            <div className="drift fx-card absolute -right-2 bottom-[16%] hidden w-60 rounded-2xl p-3 shadow-2xl sm:block lg:-right-6" style={{ "--r": "2deg", animationDelay: "-3s" } as CSSProperties}>
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-danger/15 text-danger"><Icon name="alert" className="h-[18px] w-[18px]" /></span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold">{t("landing.hero.floatB")}</p>
                  <p className="text-[11px] leading-snug text-muted">{t("landing.hero.floatBsub")}</p>
                </div>
              </div>
            </div>
            <p className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 text-center text-xs font-medium text-fg/90"><Icon name="sparkles" className="h-3.5 w-3.5 text-accent" />{t("landing.hero.tag")}</p>
          </div>
          <p className="text-center text-[11px] text-muted lg:text-right">{t("landing.hero.sample")}</p>
        </div>
      </div>
    </section>
  );
}

/** The five promises as a strip, then the facts as numbers. No invented customer counts or ratings. */
export function Strip() {
  const items: { icon: IconName; k: "one" | "two" | "three" | "four" | "five" }[] = [
    { icon: "check", k: "one" },
    { icon: "calendar", k: "two" },
    { icon: "bell", k: "three" },
    { icon: "wallet", k: "four" },
    { icon: "key", k: "five" },
  ];
  return (
    <section aria-label="Resumen" className="mx-auto max-w-6xl px-5 pb-20">
      <ul className="reveal fx-card grid gap-px overflow-hidden rounded-2xl bg-line/40 sm:grid-cols-2 lg:grid-cols-5">
        {items.map((i) => (
          <li key={i.k} className="flex items-center gap-3.5 bg-surface/90 p-5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/12 text-accent shadow-[0_0_24px_-6px_rgb(var(--accent))]"><Icon name={i.icon} className="h-5 w-5" /></span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{t(`landing.strip.${i.k}.title`)}</span>
              <span className="block text-xs text-muted">{t(`landing.strip.${i.k}.body`)}</span>
            </span>
          </li>
        ))}
      </ul>
      <dl className="mt-12 grid grid-cols-2 gap-8 text-center lg:grid-cols-4">
        {(["one", "two", "three", "four"] as const).map((k) => (
          <div key={k} className="reveal">
            <dt className="font-display text-gradient text-5xl">{t(`landing.stats.${k}.n`)}</dt>
            <dd className="mt-2 text-sm text-muted">{t(`landing.stats.${k}.l`)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function Pain() {
  return (
    <section id="sistema" className="border-t border-line/60 bg-surface/30">
      <div className="mx-auto max-w-6xl px-5 pb-6 pt-20 md:pt-28">
        <Head center eyebrow={t("landing.pain.eyebrow")} title={t("landing.pain.title")} body={t("landing.pain.body")} />
      </div>
    </section>
  );
}

function Block({ id, icon, tag, pain, title, body, bullets, visual, flip = false }: { id?: string; icon: IconName; tag: string; pain: string; title: string; body: string; bullets: string[]; visual: ReactNode; flip?: boolean }) {
  return (
    <div id={id} className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-14 md:py-20 lg:grid-cols-2 lg:gap-20">
      <div className={`reveal ${flip ? "lg:order-2" : ""}`}>
        <p className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
          <Icon name={icon} className="h-3.5 w-3.5" />{tag}
        </p>
        <p className="mt-6 flex gap-3 text-lg font-medium leading-snug text-danger/90">
          <span aria-hidden className="mt-0.5 shrink-0"><Icon name="alert" className="h-5 w-5" /></span>
          <span>{pain}</span>
        </p>
        <h3 className="font-display mt-5 text-3xl leading-tight md:text-4xl">{title}</h3>
        <p className="mt-4 text-base leading-relaxed text-muted md:text-lg">{body}</p>
        <ul className="mt-6 space-y-3">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-3 text-[15px]">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success"><Icon name="check" className="h-3 w-3" /></span>
              {b}
            </li>
          ))}
        </ul>
      </div>
      <div className={`reveal relative ${flip ? "lg:order-1" : ""}`}>
        <div aria-hidden className="absolute -inset-4 rounded-[40px] bg-accent/10 blur-2xl" />
        <div className="relative">{visual}</div>
      </div>
    </div>
  );
}

/** One block per promise: the pain, what changes, and a picture of it working. */
export function Blocks() {
  const b = (k: "bookings" | "schedule" | "guests" | "tasks" | "profit") => ({
    tag: t(`landing.blocks.${k}.tag`),
    pain: t(`landing.blocks.${k}.pain`),
    title: t(`landing.blocks.${k}.title`),
    body: t(`landing.blocks.${k}.body`),
    bullets: [t(`landing.blocks.${k}.b1`), t(`landing.blocks.${k}.b2`), t(`landing.blocks.${k}.b3`)],
  });
  return (
    <section className="bg-surface/30 pb-10">
      <Block icon="bed" {...b("bookings")} visual={<BookingsMock />} />
      <Block id="cronograma" icon="calendar" {...b("schedule")} flip visual={<div role="img" aria-label={t("landing.blocks.schedule.alt")}><ScheduleMock /></div>} />
      <Block icon="users" {...b("guests")} visual={<GuestsMock />} />
      <Block icon="tasks" {...b("tasks")} flip visual={<TasksMock />} />
      <Block icon="wallet" {...b("profit")} visual={<ProfitMock />} />
    </section>
  );
}

export function Apps() {
  const apps: { name: string; body: string; href: string; icon: IconName }[] = [
    { name: "Stayflow Host", body: t("landing.apps.host"), href: HOST_URL, icon: "dashboard" },
    { name: "Stayflow Profit", body: t("landing.apps.profit"), href: PROFIT_URL, icon: "chart" },
    { name: "Stayflow Guest", body: t("landing.apps.guest"), href: GUEST_URL, icon: "qr" },
  ];
  const soon = [
    { name: "Stayflow AI", body: t("landing.apps.ai") },
    { name: "Stayflow Operations", body: t("landing.apps.operations") },
  ];
  return (
    <section id="apps" className="border-y border-line/60 bg-surface/30">
      <div className={SECTION}>
        <Head eyebrow={t("landing.apps.eyebrow")} title={t("landing.apps.title")} body={t("landing.apps.body")} />
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {apps.map((a) => (
            <article key={a.name} className="reveal fx-card fx-hero rounded-3xl p-7">
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/12 text-accent"><Icon name={a.icon} className="h-5 w-5" /></span>
                <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-medium text-onaccent">{t("landing.apps.available")}</span>
              </div>
              <h3 className="font-display mt-5 text-lg">{a.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-fg/80">{a.body}</p>
              <a href={a.href} target="_blank" rel="noopener noreferrer" className="group mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
                {t("landing.apps.open")}
                <Icon name="arrow" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </article>
          ))}
          {soon.map((a) => (
            <article key={a.name} className="reveal fx-card rounded-3xl p-7 opacity-80">
              <span className="inline-block rounded-full border border-line px-2.5 py-1 text-[11px] font-medium text-muted">{t("landing.apps.soon")}</span>
              <h3 className="font-display mt-5 text-lg">{a.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{a.body}</p>
            </article>
          ))}
          <article className="reveal rounded-3xl border border-dashed border-line p-7">
            <h3 className="font-display text-lg">Stayflow Suite</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{t("landing.apps.suite")}</p>
          </article>
        </div>
      </div>
    </section>
  );
}

export function Steps() {
  const steps = (["one", "two", "three"] as const).map((k, i) => ({ n: i + 1, title: t(`landing.steps.${k}.title`), body: t(`landing.steps.${k}.body`) }));
  return (
    <section id="como-empieza" className={SECTION}>
      <Head eyebrow={t("landing.steps.eyebrow")} title={t("landing.steps.title")} />
      <ol className="mt-14 grid gap-10 md:grid-cols-3">
        {steps.map((s) => (
          <li key={s.n} className="reveal">
            <span className="font-display text-6xl text-gradient">{s.n}</span>
            <h3 className="font-display mt-4 text-xl">{s.title}</h3>
            <p className="mt-2 leading-relaxed text-muted">{s.body}</p>
          </li>
        ))}
      </ol>
      <p className="fx-card mt-12 inline-block rounded-2xl px-5 py-4 text-sm text-muted">{t("landing.steps.install")}</p>
    </section>
  );
}

const FAQ_N = [1, 2, 3, 4, 5, 6] as const;

export function Faq() {
  const items = FAQ_N.map((n) => ({ q: t(`landing.faq.q${n}`), a: t(`landing.faq.a${n}`) }));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })),
  };
  return (
    <section id="preguntas" className="mx-auto max-w-3xl px-5 py-20 md:py-28">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Head center eyebrow={t("landing.faq.eyebrow")} title={t("landing.faq.title")} />
      <div className="mt-12 divide-y divide-line border-y border-line">
        {items.map((i) => (
          <details key={i.q} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-base font-medium [&::-webkit-details-marker]:hidden">
              {i.q}
              <span aria-hidden className="text-2xl leading-none text-accent transition group-open:rotate-45">+</span>
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
      <div className="reveal fx-card fx-hero relative overflow-hidden rounded-[32px] px-6 py-16 text-center md:px-16 md:py-24">
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(60% 80% at 50% 120%, rgb(var(--accent) / 0.32), transparent 70%)" }} />
        <div className="relative">
          <h2 className="font-display mx-auto max-w-2xl text-3xl leading-tight md:text-5xl">{t("landing.cta.title")}</h2>
          <p className="mx-auto mt-5 max-w-md text-lg text-muted">{t("landing.cta.body")}</p>
          <a href="#precios" className={`${buttonClass} mt-9 !px-7 !py-3.5 !text-base`}>{t("landing.cta.button")}</a>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line/60">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 py-10 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <span className="text-xs uppercase tracking-[0.2em] text-muted">{t("landing.footer.by")}</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/digital-studio-logo-white.svg" alt="Digital Studio" className="h-8 w-auto" />
        </div>
        <p className="text-xs text-muted">© {new Date().getFullYear()} Digital Studio. {t("landing.footer.rights")}</p>
      </div>
    </footer>
  );
}

/** A slow ticker of everything the system covers. Motion between sections keeps the page alive. */
export function Ticker() {
  const words = ["RESERVAS", "CRONOGRAMA", "HUÉSPEDES", "TAREAS", "GANANCIA REAL", "GUÍA CON QR", "SIN DOBLES RESERVAS", "AVISOS A TIEMPO", "FOTOS DE TUS PROPIEDADES"];
  const row = [...words, ...words];
  return (
    <div aria-hidden className="overflow-hidden border-y border-line/60 bg-surface/30 py-5 [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
      <div className="ticker flex w-max items-center gap-10 whitespace-nowrap">
        {row.map((x, i) => (
          <span key={i} className="font-display flex items-center gap-10 text-lg tracking-[0.12em] text-muted">
            {x}
            <i className="h-1.5 w-1.5 rotate-45 bg-accent shadow-[0_0_10px_rgb(var(--accent))]" />
          </span>
        ))}
      </div>
    </div>
  );
}
