import { ThemeSwitcher, buttonClass } from "@stayflow/ui";
import { APP_URL, t } from "@/lib/t";

const LINKS = [
  { href: "#producto", key: "landing.nav.product" },
  { href: "#apps", key: "landing.nav.apps" },
  { href: "#precios", key: "landing.nav.pricing" },
  { href: "#preguntas", key: "landing.nav.faq" },
] as const;

export function Wordmark() {
  return (
    <span className="flex items-center gap-2.5">
      <svg aria-hidden width="22" height="22" viewBox="0 0 512 512" className="text-accent">
        <path
          d="M70 340c70 0 70-130 186-130s116 130 186 130"
          fill="none"
          stroke="currentColor"
          strokeWidth="56"
          strokeLinecap="round"
        />
      </svg>
      <span className="text-lg font-bold tracking-tight">Stayflow</span>
    </span>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-bg/70 backdrop-blur-xl">
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
