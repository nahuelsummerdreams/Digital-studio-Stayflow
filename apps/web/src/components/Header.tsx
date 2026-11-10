import { BrandMark, ThemeSwitcher, buttonClass } from "@stayflow/ui";
import { HOST_URL, t } from "@/lib/t";
import { CartButton } from "./client";

const LINKS = [
  { href: "/#sistema", key: "landing.nav.system" },
  { href: "/#cronograma", key: "landing.nav.schedule" },
  { href: "/#precios", key: "landing.nav.price" },
  { href: "/#preguntas", key: "landing.nav.faq" },
] as const;

/** Stayflow wordmark with the Digital Studio seal beside it: the product, and who stands behind it. */
export function Wordmark() {
  return (
    <span className="flex items-center gap-3">
      <span className="flex items-center gap-2.5">
        <BrandMark className="h-8 w-8" />
        <span className="font-display text-lg tracking-tight">Stayflow</span>
      </span>
      <span aria-hidden className="h-6 w-px bg-line" />
      <span className="flex items-center gap-2">
        <span className="hidden text-[10px] uppercase tracking-[0.2em] text-muted sm:inline">{t("landing.nav.by")}</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/digital-studio-logo-white.svg" alt="Digital Studio" className="h-6 w-auto sm:h-7" />
      </span>
    </span>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/50 bg-bg/60 backdrop-blur-2xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <a href="/" aria-label="Stayflow · Digital Studio">
          <Wordmark />
        </a>
        <nav aria-label="Principal" className="hidden items-center gap-7 text-sm text-muted lg:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="transition hover:text-fg">
              {t(l.key)}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="hidden sm:block"><ThemeSwitcher /></span>
          <a href={HOST_URL} className="hidden text-sm text-muted transition hover:text-fg md:inline">
            {t("landing.nav.login")}
          </a>
          <CartButton />
          <a href="/#precios" className={`${buttonClass} hidden !px-3.5 !py-2 sm:inline-flex`}>
            {t("landing.nav.buy")}
          </a>
        </div>
      </div>
    </header>
  );
}
