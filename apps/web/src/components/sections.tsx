import type { CSSProperties } from "react";
import { Avatar, Icon } from "@stayflow/ui";
import { getMessages } from "@/i18n";
import { t } from "@/lib/t";
import { CookieSettings } from "./consent";
import { GetHostButton } from "./client";
import { CategoryHero } from "./category-hero";
import { ContactLink } from "./contact";
import { Motes, Tilt } from "./effects";
import { DashboardMock } from "./mock";
import { LaunchBadge, PriceText } from "./launch";

const m = getMessages();

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
        <CategoryHero />

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

/** Four hard facts in one row (no invented customer counts). */
export function Strip() {
  return (
    <section aria-label="Resumen" className="mx-auto max-w-6xl px-5 pb-14">
      <dl className="reveal grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-line/50 lg:grid-cols-4">
        {m.funnel.facts.map((f) => {
          const [n, label] = f.split("|");
          return (
            <div key={f} className="bg-surface/90 px-5 py-5 text-center">
              <dt className="font-display text-gradient text-3xl tabular-nums md:text-4xl">{n!.includes("{price}") ? <PriceText template={n!} /> : n}</dt>
              <dd className="mt-1 text-sm text-muted">{label}</dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}

export function Faq() {
  const items = m.funnel.faq.items;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })),
  };
  return (
    <section id="preguntas" className="mx-auto max-w-3xl px-5 py-16 md:py-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Head center eyebrow={m.funnel.faq.eyebrow} title={m.funnel.faq.title} />
      <div className="mt-10 divide-y divide-line border-y border-line">
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
    <section className="mx-auto max-w-6xl px-5 pb-16 md:pb-24">
      <div className="reveal fx-card fx-hero relative overflow-hidden rounded-[32px] px-6 py-14 text-center md:px-16 md:py-20">
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(60% 80% at 50% 120%, rgb(var(--accent) / 0.32), transparent 70%)" }} />
        <div className="relative">
          <h2 className="font-display mx-auto max-w-2xl text-3xl leading-tight md:text-5xl">{m.funnel.cta.title}</h2>
          <p className="mx-auto mt-5 max-w-md text-lg text-muted"><PriceText template={m.funnel.cta.body} /></p>
          <LaunchBadge className="mt-4" />
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <GetHostButton where="final" />
            <ContactLink />
          </div>
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
        <div className="flex flex-col gap-2 sm:items-end">
          <nav aria-label="Legal" className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
            <a href="/privacidad" className="underline-offset-4 transition hover:text-fg hover:underline">Privacidad</a>
            <a href="/terminos" className="underline-offset-4 transition hover:text-fg hover:underline">Términos</a>
            <a href="/reembolsos" className="underline-offset-4 transition hover:text-fg hover:underline">Reembolsos</a>
            <CookieSettings />
          </nav>
          <p className="text-xs text-muted">© {new Date().getFullYear()} Digital Studio. {t("landing.footer.rights")}</p>
        </div>
      </div>
    </footer>
  );
}
