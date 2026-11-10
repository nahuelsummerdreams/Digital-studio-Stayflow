import type { ReactNode } from "react";
import { PLANS, PLAN_LIMITS, PLAN_PRICE_USD, type PlanKey } from "@stayflow/licensing";
import { Icon, buttonClass } from "@stayflow/ui";
import { APP_URL, GUEST_URL, HOST_URL, PROFIT_URL, t } from "@/lib/t";
import { ProductPreview } from "./ProductPreview";

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
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[560px]"
        style={{ background: "radial-gradient(60% 60% at 50% 0%, rgb(var(--accent) / 0.22), transparent 70%)" }}
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-14 md:pb-28 md:pt-24 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="anim-stagger">
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/60 px-3 py-1.5 text-xs text-muted backdrop-blur">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent" />
            {t("landing.hero.eyebrow")}
          </p>
          <h1 className="font-display mt-6 text-5xl leading-[1.05] md:text-6xl lg:text-5xl xl:text-6xl">
            {t("landing.hero.title")} <span className="block text-gradient">{t("landing.hero.accent")}</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">{t("landing.hero.body")}</p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a href={APP_URL} className={`${buttonClass} !px-6 !py-3.5 !text-base`}>
              {t("landing.hero.cta")}
            </a>
            <a
              href="#como-empieza"
              className="inline-flex items-center rounded-xl border border-line px-6 py-3.5 text-base text-muted transition hover:border-muted hover:text-fg"
            >
              {t("landing.hero.secondary")}
            </a>
          </div>
          <p className="mt-5 text-sm text-muted">{t("landing.hero.note")}</p>
        </div>
        <ProductPreview />
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
    <section id="producto" className="border-y border-line/60 bg-surface/30">
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

export function Features() {
  const items = (["one", "two", "three", "four"] as const).map((k, i) => ({
    n: `0${i + 1}`,
    title: t(`landing.features.${k}.title`),
    body: t(`landing.features.${k}.body`),
  }));
  return (
    <section className={SECTION}>
      <Head eyebrow={t("landing.features.eyebrow")} title={t("landing.features.title")} />
      <div className="mt-14 grid gap-4 md:grid-cols-2">
        {items.map((f) => (
          <article key={f.n} className="reveal fx-card group rounded-3xl p-7">
            <p className="font-display text-sm text-accent">{f.n}</p>
            <h3 className="font-display mt-5 text-xl leading-snug">{f.title}</h3>
            <p className="mt-3 leading-relaxed text-muted">{f.body}</p>
          </article>
        ))}
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
                  href={APP_URL}
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
          <a href={APP_URL} className={`${buttonClass} mt-9 !px-7 !py-3.5 !text-base`}>
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
