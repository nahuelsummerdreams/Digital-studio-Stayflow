import type { CSSProperties, ReactNode } from "react";
import { PLANS, PLAN_LIMITS, PLAN_PRICE_USD, type PlanKey } from "@stayflow/licensing";
import { Avatar, Icon, Pill, buttonClass, type IconName } from "@stayflow/ui";
import { GUEST_URL, HOST_URL, PROFIT_URL, t } from "@/lib/t";
import { DashboardMock, SceneArt, ScheduleMock } from "./mock";

const SECTION = "mx-auto max-w-6xl px-5 py-20 md:py-28";

function Head({ eyebrow, title, body, center = false }: { eyebrow: string; title: string; body?: string; center?: boolean }) {
  return (
    <div className={`reveal ${center ? "mx-auto max-w-2xl text-center" : "max-w-xl"}`}>
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
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[640px]"
        style={{ background: "radial-gradient(55% 60% at 50% 0%, rgb(var(--accent) / 0.26), transparent 70%)" }}
      />
      <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-16 md:pb-28 md:pt-24">
        <div className="anim-stagger mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/60 px-3.5 py-1.5 text-xs text-muted backdrop-blur">
            <span aria-hidden className="pulse-ring h-1.5 w-1.5 rounded-full bg-accent" />
            {t("landing.hero.eyebrow")}
          </p>
          <h1 className="font-display mt-7 text-5xl leading-[1.04] md:text-7xl">
            {t("landing.hero.title")} <span className="text-gradient block md:inline">{t("landing.hero.accent")}</span>
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-muted md:text-xl">{t("landing.hero.body")}</p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <a href={HOST_URL} className={`${buttonClass} !px-7 !py-4 !text-base`}>
              {t("landing.hero.cta")}
            </a>
            <a href="#sistema" className="inline-flex items-center rounded-xl border border-line bg-surface/40 px-7 py-4 text-base text-muted backdrop-blur transition hover:border-muted hover:text-fg">
              {t("landing.hero.secondary")}
            </a>
          </div>
          <p className="mt-5 text-sm text-muted">{t("landing.hero.note")}</p>
        </div>

        <div className="relative mx-auto mt-16 max-w-5xl">
          <div aria-hidden className="absolute -inset-x-10 -bottom-10 -top-6 rounded-[56px] bg-accent/20 blur-3xl" />
          <div className="relative transition-transform duration-700 ease-out lg:[transform:perspective(1800px)_rotateX(5deg)] lg:hover:[transform:perspective(1800px)_rotateX(1deg)]">
            <DashboardMock />
          </div>
          <div className="drift fx-card absolute -left-3 top-[28%] hidden w-60 rounded-2xl p-3.5 shadow-2xl lg:block xl:-left-14" style={{ "--r": "-2deg" } as CSSProperties}>
            <div className="flex items-center gap-3">
              <Avatar name="Familia Ortega" className="h-9 w-9 text-xs" />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold">{t("landing.hero.floatA")}</p>
                <p className="truncate text-[11px] text-muted">{t("landing.hero.floatAsub")}</p>
              </div>
            </div>
          </div>
          <div className="drift fx-card absolute -right-3 bottom-[18%] hidden w-64 rounded-2xl p-3.5 shadow-2xl lg:block xl:-right-14" style={{ "--r": "2deg", animationDelay: "-3s" } as CSSProperties}>
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-success/15 text-success"><Icon name="check" className="h-[18px] w-[18px]" /></span>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold">{t("landing.hero.floatB")}</p>
                <p className="text-[11px] leading-snug text-muted">{t("landing.hero.floatBsub")}</p>
              </div>
            </div>
          </div>
          <p className="mt-5 text-center text-[11px] text-muted">{t("landing.hero.sample")}</p>
        </div>
      </div>
    </section>
  );
}

/** Slow ticker of what the system covers: movement without noise. */
export function Marquee() {
  const items = t("landing.marquee").split("|");
  const row = [...items, ...items];
  return (
    <div aria-hidden className="overflow-hidden border-y border-line/60 bg-surface/30 py-5 [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
      <div className="marquee flex w-max items-center gap-10 whitespace-nowrap">
        {row.map((x, i) => (
          <span key={i} className="font-display flex items-center gap-10 text-lg text-muted">
            {x}
            <i className="h-1.5 w-1.5 rounded-full bg-accent" />
          </span>
        ))}
      </div>
    </div>
  );
}

function Tile({ title, body, children, className = "" }: { title: string; body: string; children: ReactNode; className?: string }) {
  return (
    <article className={`reveal fx-card group flex flex-col overflow-hidden rounded-3xl ${className}`}>
      <div className="flex-1 p-5 pb-0">{children}</div>
      <div className="p-6 pt-5">
        <h3 className="font-display text-lg leading-snug">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
      </div>
    </article>
  );
}

function QrArt() {
  const cells = Array.from({ length: 81 }, (_, i) => ((i * i * 7 + i * 13 + 3) % 11 < 5 ? 1 : 0));
  return (
    <div className="mx-auto flex h-36 items-center justify-center gap-4">
      <svg aria-hidden viewBox="0 0 9 9" className="h-28 w-28 rounded-2xl bg-white p-2 shadow-[0_0_50px_-12px_rgb(var(--accent))]" shapeRendering="crispEdges">
        {cells.map((c, i) => (c ? <rect key={i} x={i % 9} y={Math.floor(i / 9)} width="1" height="1" fill="#06101f" /> : null))}
        <rect x="0" y="0" width="3" height="3" fill="#06101f" /><rect x="0.5" y="0.5" width="2" height="2" fill="#fff" /><rect x="1" y="1" width="1" height="1" fill="#06101f" />
        <rect x="6" y="0" width="3" height="3" fill="#06101f" /><rect x="6.5" y="0.5" width="2" height="2" fill="#fff" /><rect x="7" y="1" width="1" height="1" fill="#06101f" />
        <rect x="0" y="6" width="3" height="3" fill="#06101f" /><rect x="0.5" y="6.5" width="2" height="2" fill="#fff" /><rect x="1" y="7" width="1" height="1" fill="#06101f" />
      </svg>
      <div aria-hidden className="space-y-2 text-[11px] text-muted">
        {["Wi-Fi", "Check-in", "Restaurantes"].map((x) => (
          <p key={x} className="flex items-center gap-2 rounded-lg border border-line bg-bg/60 px-2.5 py-1.5"><Icon name="check" className="h-3 w-3 text-accent" />{x}</p>
        ))}
      </div>
    </div>
  );
}

/** Bento grid: each tile is a small live-looking piece of the product. */
export function System() {
  const alerts: { icon: IconName; text: string; sub: string; tone: string }[] = [
    { icon: "alert", text: t("host.alertLate", { count: 2 }), sub: "Cambiar sábanas", tone: "text-danger" },
    { icon: "login", text: t("host.alertArrivalsToday", { count: 1 }), sub: t("host.alertRegister"), tone: "text-success" },
    { icon: "info", text: t("host.alertNoAmount", { name: "Clara" }), sub: "Estudio Casco Antiguo", tone: "text-accent" },
  ];
  return (
    <section id="sistema" className={SECTION}>
      <Head eyebrow={t("landing.system.eyebrow")} title={t("landing.system.title")} body={t("landing.system.body")} />
      <div className="mt-14 grid gap-4 lg:grid-cols-3">
        <Tile className="lg:col-span-2" title={t("landing.system.schedule.title")} body={t("landing.system.schedule.body")}>
          <ScheduleMock compact />
        </Tile>
        <Tile title={t("landing.system.photos.title")} body={t("landing.system.photos.body")}>
          <div className="relative mx-auto h-44 max-w-xs" aria-hidden>
            <SceneArt variant={1} className="absolute left-0 top-6 h-28 w-44 -rotate-6 rounded-2xl border border-white/10 shadow-xl transition duration-500 group-hover:-rotate-12" />
            <SceneArt variant={2} className="absolute right-0 top-2 h-28 w-44 rotate-6 rounded-2xl border border-white/10 shadow-xl transition duration-500 group-hover:rotate-12" />
            <SceneArt variant={0} className="absolute left-1/2 top-12 h-32 w-48 -translate-x-1/2 rounded-2xl border border-white/20 shadow-2xl transition duration-500 group-hover:-translate-y-2" />
          </div>
        </Tile>
        <Tile title={t("landing.system.panel.title")} body={t("landing.system.panel.body")}>
          <div className="rounded-2xl border border-line bg-bg/60 p-4">
            <p className="text-xs text-muted">{t("host.occupancy")}</p>
            <p className="font-display text-money mt-1 text-4xl tabular-nums">68,4 %</p>
            <p className="mt-1 text-xs text-success">+12,4 % {t("host.vsLastMonth")}</p>
            <div className="mt-4 flex h-14 items-end gap-1.5" aria-hidden>
              {[35, 48, 42, 60, 55, 72, 68, 84].map((h, i) => (
                <i key={i} className="grow-view block flex-1 rounded-t-md bg-gradient-to-t from-accent/30 to-accent" style={{ height: `${h}%`, transformOrigin: "bottom" }} />
              ))}
            </div>
          </div>
        </Tile>
        <Tile title={t("landing.system.alerts.title")} body={t("landing.system.alerts.body")}>
          <ul className="space-y-3 rounded-2xl border border-line bg-bg/60 p-4">
            {alerts.map((a) => (
              <li key={a.text} className="flex items-start gap-3">
                <span className={`mt-0.5 ${a.tone}`}><Icon name={a.icon} className="h-[18px] w-[18px]" /></span>
                <span className="min-w-0"><span className="block truncate text-sm font-medium">{a.text}</span><span className={`block truncate text-xs ${a.tone}`}>{a.sub}</span></span>
              </li>
            ))}
          </ul>
        </Tile>
        <Tile title={t("landing.system.guest.title")} body={t("landing.system.guest.body")}>
          <QrArt />
        </Tile>
      </div>
    </section>
  );
}

/** One big look at the schedule, because it is what hosts open every morning. */
export function Schedule() {
  const points = ["b1", "b2", "b3", "b4"] as const;
  return (
    <section id="cronograma" className="relative overflow-hidden border-y border-line/60 bg-surface/30">
      <div aria-hidden className="pointer-events-none absolute -right-40 top-0 h-[500px] w-[500px] rounded-full bg-accent/10 blur-3xl" />
      <div className={`${SECTION} relative`}>
        <Head eyebrow={t("landing.schedule.eyebrow")} title={t("landing.schedule.title")} body={t("landing.schedule.body")} />
        <div className="reveal mt-12">
          <ScheduleMock />
        </div>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {points.map((k) => (
            <li key={k} className="reveal flex items-center gap-3 text-base">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent"><Icon name="check" className="h-4 w-4" /></span>
              {t(`landing.schedule.${k}`)}
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Pill tone="accent">{t("landing.apps.available")}</Pill>
          <a href={HOST_URL} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
            {t("landing.apps.open")} Stayflow Host
            <Icon name="arrow" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </div>
      </div>
    </section>
  );
}

/** "What you collect is not what you earn": the one idea the product is built on. */
export function Reveal() {
  const rows: { label: string; amount: string; width: number; tone: "accent" | "danger" | "net"; strong?: boolean }[] = [
    { label: t("landing.reveal.collected"), amount: "1.251 €", width: 100, tone: "accent" },
    { label: t("landing.reveal.expenses"), amount: "−200 €", width: 16, tone: "danger" },
    { label: t("landing.reveal.fixed"), amount: "−50 €", width: 4, tone: "danger" },
    { label: t("landing.reveal.net"), amount: "1.001 €", width: 80, tone: "net", strong: true },
  ];
  const fill = (tone: "accent" | "danger" | "net") =>
    tone === "danger"
      ? "rgb(var(--danger) / 0.75)"
      : tone === "net"
        ? "linear-gradient(90deg, rgb(var(--accent)), rgb(var(--accent-2)))"
        : "rgb(var(--accent) / 0.45)";
  return (
    <section id="ganancia">
      <div className={`${SECTION} grid items-center gap-14 md:grid-cols-2`}>
        <Head eyebrow={t("landing.reveal.eyebrow")} title={t("landing.reveal.title")} body={t("landing.reveal.body")} />
        <div className="reveal fx-card rounded-3xl p-6 md:p-8">
          <ul className="space-y-6">
            {rows.map((r) => (
              <li key={r.label}>
                <div className="flex items-baseline justify-between gap-4 text-sm">
                  <span className={r.strong ? "font-semibold" : "text-muted"}>{r.label}</span>
                  <span className={`font-display tabular-nums ${r.strong ? "text-xl" : "text-base"}`}>{r.amount}</span>
                </div>
                <div className="mt-2.5 h-2.5 rounded-full bg-bg">
                  <div className="h-full rounded-full" style={{ width: `${r.width}%`, background: fill(r.tone) }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function Apps() {
  const apps: { name: string; body: string; live: boolean; href?: string }[] = [
    { name: "Stayflow Host", body: t("landing.apps.host"), live: true, href: HOST_URL },
    { name: "Stayflow Profit", body: t("landing.apps.profit"), live: true, href: PROFIT_URL },
    { name: "Stayflow Guest", body: t("landing.apps.guest"), live: true, href: GUEST_URL },
    { name: "Stayflow AI", body: t("landing.apps.ai"), live: false },
    { name: "Stayflow Operations", body: t("landing.apps.operations"), live: false },
  ];
  return (
    <section id="apps" className="border-y border-line/60 bg-surface/30">
      <div className={SECTION}>
        <Head eyebrow={t("landing.apps.eyebrow")} title={t("landing.apps.title")} body={t("landing.apps.body")} />
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {apps.map((a) => (
            <article key={a.name} className={`reveal fx-card rounded-3xl p-7 ${a.live ? "fx-hero" : "opacity-80"}`}>
              <span
                className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-medium ${
                  a.live ? "bg-accent text-onaccent" : "border border-line text-muted"
                }`}
              >
                {a.live ? t("landing.apps.available") : t("landing.apps.soon")}
              </span>
              <h3 className="font-display mt-5 text-lg">{a.name}</h3>
              <p className={`mt-2 text-sm leading-relaxed ${a.live ? "text-fg/80" : "text-muted"}`}>{a.body}</p>
              {a.href && (
                <a href={a.href} target="_blank" rel="noopener noreferrer" className="group mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
                  {t("landing.apps.open")}
                  <Icon name="arrow" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              )}
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
  const steps = (["one", "two", "three"] as const).map((k, i) => ({
    n: i + 1,
    title: t(`landing.steps.${k}.title`),
    body: t(`landing.steps.${k}.body`),
  }));
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
      <p className="fx-card mt-12 inline-block rounded-2xl px-5 py-4 text-sm text-muted">
        {t("landing.steps.install")}
      </p>
    </section>
  );
}

const INCLUDED = ["landing.pricing.includesFixed", "landing.pricing.includesCalculator", "landing.pricing.includesCompare"] as const;

function Check({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-3 text-sm">
      <span aria-hidden className="mt-0.5 text-accent">
        ✓
      </span>
      <span>{children}</span>
    </li>
  );
}

export function Pricing() {
  return (
    <section id="precios" className="border-y border-line/60 bg-surface/30">
      <div className={SECTION}>
        <Head center eyebrow={t("landing.pricing.eyebrow")} title={t("landing.pricing.title")} body={t("landing.pricing.body")} />
        <div className="mt-14 grid gap-4 lg:grid-cols-3">
          {PLANS.map((plan: PlanKey) => {
            const limits = PLAN_LIMITS[plan];
            const featured = plan === "pro";
            return (
              <article
                key={plan}
                className={`reveal fx-card relative flex flex-col rounded-3xl p-8 ${featured ? "fx-hero" : ""}`}
              >
                {featured && (
                  <span className="absolute -top-3 left-8 rounded-full bg-accent px-3 py-1 text-[11px] font-semibold text-onaccent">
                    {t("landing.pricing.recommended")}
                  </span>
                )}
                <h3 className="font-display text-xl">{t(`landing.pricing.${plan}.name`)}</h3>
                <p className="mt-2 min-h-10 text-sm text-muted">{t(`landing.pricing.${plan}.body`)}</p>
                <p className="mt-6 flex items-baseline gap-2">
                  <span className="text-xs text-muted">{t("landing.pricing.currency")}</span>
                  <span className="font-display text-5xl">{PLAN_PRICE_USD[plan]}</span>
                  <span className="text-sm text-muted">{t("landing.pricing.perMonth")}</span>
                </p>
                <ul className="mt-7 flex-1 space-y-3.5 border-t border-line pt-7">
                  <Check>
                    {Number.isFinite(limits.properties)
                      ? t("landing.pricing.properties", { count: limits.properties })
                      : t("landing.pricing.propertiesUnlimited")}
                  </Check>
                  <Check>{t("landing.pricing.users", { count: limits.users })}</Check>
                  {INCLUDED.map((k) => (
                    <Check key={k}>{t(k)}</Check>
                  ))}
                </ul>
                <a
                  href={HOST_URL}
                  className={
                    featured
                      ? `${buttonClass} mt-8 w-full`
                      : "mt-8 inline-flex w-full items-center justify-center rounded-xl border border-line px-4 py-2.5 text-sm font-semibold transition hover:border-accent hover:text-accent"
                  }
                >
                  {t("landing.pricing.cta")}
                </a>
              </article>
            );
          })}
        </div>
        <p className="mt-8 text-center text-sm text-muted">{t("landing.pricing.footnote")}</p>
      </div>
    </section>
  );
}

const FAQ_N = [1, 2, 3, 4, 5, 6] as const;

export function Faq() {
  const items = FAQ_N.map((n) => ({ q: t(`landing.faq.q${n}`), a: t(`landing.faq.a${n}`) }));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: i.q,
      acceptedAnswer: { "@type": "Answer", text: i.a },
    })),
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
              <span aria-hidden className="text-2xl leading-none text-accent transition group-open:rotate-45">
                +
              </span>
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
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(60% 80% at 50% 120%, rgb(var(--accent) / 0.32), transparent 70%)" }}
        />
        <div className="relative">
          <h2 className="font-display mx-auto max-w-2xl text-3xl leading-tight md:text-5xl">{t("landing.cta.title")}</h2>
          <p className="mx-auto mt-5 max-w-md text-lg text-muted">{t("landing.cta.body")}</p>
          <a href={HOST_URL} className={`${buttonClass} mt-9 !px-7 !py-3.5 !text-base`}>
            {t("landing.cta.button")}
          </a>
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
        <p className="text-xs text-muted">
          © {new Date().getFullYear()} Digital Studio. {t("landing.footer.rights")}
        </p>
      </div>
    </footer>
  );
}
