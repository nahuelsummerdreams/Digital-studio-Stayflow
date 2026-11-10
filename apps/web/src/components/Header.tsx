import { BrandMark, ThemeSwitcher, buttonClass } from "@stayflow/ui";
import { HOST_URL as APP_URL, t } from "@/lib/t";

const LINKS = [
  { href: "#sistema", key: "landing.nav.product" },
  { href: "#cronograma", key: "landing.nav.schedule" },
  { href: "#apps", key: "landing.nav.apps" },
  { href: "#precios", key: "landing.nav.pricing" },
  { href: "#preguntas", key: "landing.nav.faq" },
] as const;

export function Wordmark() {
  return (
    <span className="flex items-center gap-2.5">
      <BrandMark className="h-8 w-8" />
      <span className="font-display text-lg tracking-tight">Stayflow</span>
    </span>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/50 bg-bg/60 backdrop-blur-2xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <a href="#top" aria-label="Stayflow">
          <Wordmark />
        </a>
        <nav aria-label="Principal" className="hidden items-center gap-8 text-sm text-muted md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="transition hover:text-fg">
              {t(l.key)}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <ThemeSwitcher />
          <a href={APP_URL} className="hidden text-sm text-muted transition hover:text-fg sm:inline">
            {t("landing.nav.login")}
          </a>
          <a href={APP_URL} className={`${buttonClass} !px-3.5 !py-2`}>
            {t("landing.nav.start")}
          </a>
        </div>
      </div>
    </header>
  );
}
