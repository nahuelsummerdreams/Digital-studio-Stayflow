"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AccountDialog, AccountProvider, AuthScreen, ResetPasswordScreen, CreateOrgScreen, ActivateScreen, createStayflowClient, useAccount } from "@stayflow/auth";
import { I18nProvider, useT } from "@stayflow/i18n";
import type { ProductKey } from "@stayflow/licensing";
import { Avatar, BrandMark, BrandStage, DigitalStudioLogo, FxProvider, Icon, PRODUCT_BRAND, StudioSeal, ThemeSwitcher, activeTabClass, errorClass, idleTabClass, type IconName } from "@stayflow/ui";
import { BellMenu, CommandPalette, UserMenu, type SearchItem, type ShellAlert } from "./chrome";

export type { SearchItem, ShellAlert } from "./chrome";

function MissingConfig() {
  const t = useT();
  return (
    <main className="mx-auto max-w-md px-5 pt-14 text-sm">
      <h1 className="font-display text-2xl">{t("common.setupTitle")}</h1>
      <p className="mt-3 text-muted">{t("common.setupBody")}</p>
    </main>
  );
}

/** Language + account for a whole app. Pass the Supabase URL and publishable key from the app's env. */
export function StayflowProviders({ url, anonKey, children }: { url?: string; anonKey?: string; children: ReactNode }) {
  const client = useMemo(() => (url && anonKey ? createStayflowClient(url, anonKey) : null), [url, anonKey]);
  return (
    <I18nProvider>
      <FxProvider />
      {client ? <AccountProvider client={client}>{children}</AccountProvider> : <MissingConfig />}
    </I18nProvider>
  );
}

export interface NavItem {
  href: string;
  label: string;
  icon?: IconName;
  /** One line under the page title on desktop. */
  description?: string;
  /** Small caption that starts a new block in the side menu ("Pilotaje"). */
  group?: string;
  /** Count shown at the right of the item. */
  badge?: number;
  /** The screen draws its own heading, so the shell skips the default one. */
  ownHeading?: boolean;
}

export interface AppShellProps {
  product: ProductKey;
  nav: NavItem[];
  children: ReactNode;
  /** The one big button in the top bar ("Nueva reserva"). */
  quickAction?: { label: string; href: string };
  /** Things that need attention. Shown in the bell. */
  alerts?: ShellAlert[];
  /** Extra things the search can jump to (properties, guests…). */
  searchItems?: SearchItem[];
  /** Where "Ver planes" goes (the Digital Studio site). Hidden when missing. */
  plansUrl?: string;
}


/**
 * What every Stayflow app shows around its screens:
 * sign in -> business setup -> license code -> the app (side menu, top bar, Digital Studio seal).
 */
export function AppShell({ product, nav, children, quickAction, alerts = [], searchItems = [], plansUrl }: AppShellProps) {
  const t = useT();
  const { loading, error, session, org, licenses, can, signOut, recovery } = useAccount();
  const pathname = usePathname();
  const brand = PRODUCT_BRAND[product];
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const paletteItems = useMemo<SearchItem[]>(
    () => [...nav.map((n) => ({ label: n.label, hint: n.description, href: n.href, icon: n.icon })), ...searchItems],
    [nav, searchItems],
  );

  if (loading) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-5" aria-busy="true" aria-label={t("common.loading")}>
        <BrandStage product={brand.name} compact />
      </main>
    );
  }
  if (session && recovery) return <ResetPasswordScreen />;
  if (!session) return <AuthScreen productName={brand.name} tagline={brand.tagline} />;
  if (error) {
    return (
      <main className="mx-auto max-w-md px-5 pt-14">
        <p role="alert" className={errorClass}>{t("common.loadError")}</p>
      </main>
    );
  }
  if (!org) return <CreateOrgScreen />;
  if (!can(product)) return <ActivateScreen product={product} productName={brand.name} buyUrl={plansUrl?.split("#")[0]} />;


  const meta = session.user.user_metadata as { full_name?: string } | undefined;
  const email = session.user.email ?? "";
  const userName = meta?.full_name?.trim() || email.split("@")[0] || org.name;

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));
  const current = nav.find((n) => isActive(n.href));

  return (
    <div className="lg:grid lg:min-h-screen lg:grid-cols-[16.5rem_1fr]">
      {/* Desktop: fixed side menu. This is how a host uses the installed app. */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-line/70 bg-surface/30 px-4 pb-4 pt-6 backdrop-blur-xl lg:flex">
        <div className="px-2">
          <div className="flex items-center gap-3">
            <BrandMark />
            <div className="min-w-0">
              <p className="font-display truncate text-lg leading-tight">Stayflow</p>
              <p className="truncate text-[11px] font-medium uppercase tracking-[0.18em] text-accent">{brand.name.replace(/^Stayflow\s*/i, "")}</p>
            </div>
          </div>
          {/* The producer's seal sits right under the product mark, so every screen says who is behind it. */}
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-line/70 bg-surface/50 px-3 py-2.5">
            <span className="shrink-0 whitespace-nowrap text-[9px] uppercase tracking-[0.18em] text-muted">{t("common.productBy")}</span>
            <DigitalStudioLogo className="h-6 w-auto text-fg" />
          </div>
        </div>

        <nav className="mt-7 min-h-0 flex-1 overflow-y-auto pr-1" aria-label={t("common.sections")}>
          {nav.map((n, i) => {
            const active = isActive(n.href);
            const showGroup = n.group && n.group !== nav[i - 1]?.group;
            return (
              <div key={n.href}>
                {showGroup && <p className={`mb-2 px-3 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted/70 ${i === 0 ? "mt-0" : "mt-6"}`}>{n.group}</p>}
                <Link
                  href={n.href}
                  aria-current={active ? "page" : undefined}
                  className={`group relative mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-all duration-300 ${
                    active ? "bg-accent/12 text-accent" : "text-muted hover:translate-x-0.5 hover:bg-surface/80 hover:text-fg"
                  }`}
                >
                  {active && <span aria-hidden className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full bg-accent shadow-[0_0_14px_rgb(var(--accent))]" />}
                  {n.icon && <Icon name={n.icon} className="h-[17px] w-[17px] transition-transform duration-300 group-hover:scale-110" />}
                  <span className="min-w-0 flex-1 truncate">{n.label}</span>
                  {typeof n.badge === "number" && n.badge > 0 && (
                    <span className={`rounded-md px-1.5 py-0.5 text-[11px] tabular-nums ${active ? "bg-accent/20 text-accent" : "bg-line/70 text-muted"}`}>{n.badge}</span>
                  )}
                </Link>
              </div>
            );
          })}
        </nav>

        <div className="mt-4 space-y-4">

          <div className="flex items-center gap-3 rounded-xl px-2">
            <Avatar name={userName} className="h-9 w-9 text-xs" />
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-[13px] font-medium">{userName}</p>
              <p className="truncate text-[11px] text-muted">{org.name}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        {/* Desktop top bar: search, alerts, quick action, account. */}
        <div className="sticky top-0 z-30 hidden h-[4.25rem] items-center gap-3 border-b border-line/70 bg-bg/70 px-8 backdrop-blur-xl lg:flex">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="flex h-10 w-full max-w-md items-center gap-3 rounded-xl border border-line bg-surface/60 px-3.5 text-left text-sm text-muted transition hover:border-accent/50"
          >
            <Icon name="search" className="h-[17px] w-[17px]" />
            <span className="flex-1 truncate">{t("shell.searchPlaceholder")}</span>
            <kbd className="rounded-md border border-line px-1.5 py-0.5 text-[10px]">Ctrl K</kbd>
          </button>
          <div className="ml-auto flex items-center gap-3">
            <ThemeSwitcher />
            <BellMenu alerts={alerts} />
            {quickAction && (
              <Link href={quickAction.href} className="fx-btn inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-onaccent">
                <Icon name="plus" className="h-4 w-4" />
                {quickAction.label}
              </Link>
            )}
            <UserMenu name={userName} detail={email || org.name} onSignOut={signOut} onAccount={() => setAccountOpen(true)} />
          </div>
        </div>

        <main className="px-5 pb-16 pt-6 lg:px-8 lg:pt-8">
          <div className="mx-auto max-w-[88rem]">
            {/* Phone and small tablet: header + tabs. */}
            <header className="flex items-start justify-between gap-4 lg:hidden">
              <div className="flex items-center gap-3">
                <BrandMark />
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-accent">{brand.name}</p>
                  <h1 className="font-display text-2xl leading-tight">{org.name}</h1>
                </div>
              </div>
              <div className="mt-1 flex flex-col items-end gap-3">
                <div className="flex items-center gap-3">
                  <ThemeSwitcher />
                  <BellMenu alerts={alerts} />
                </div>
                <button type="button" onClick={() => setAccountOpen(true)} className="text-sm text-muted underline-offset-4 hover:underline">
                  {t("shell.account")}
                </button>
                <button type="button" onClick={signOut} className="text-sm text-muted underline-offset-4 hover:underline">
                  {t("common.signOut")}
                </button>
              </div>
            </header>


            <nav className="fx-card mt-6 flex flex-wrap gap-1 rounded-xl p-1 lg:hidden" aria-label={t("common.sections")}>
              {nav.map((n) => {
                const active = isActive(n.href);
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    aria-current={active ? "page" : undefined}
                    className={`min-w-[30%] flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-center text-sm font-medium transition sm:min-w-0 ${active ? activeTabClass : idleTabClass}`}
                  >
                    {n.label}
                  </Link>
                );
              })}
            </nav>

            {quickAction && (
              <Link href={quickAction.href} className="fx-btn mt-4 flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-onaccent lg:hidden">
                <Icon name="plus" className="h-4 w-4" />
                {quickAction.label}
              </Link>
            )}

            {current && !current.ownHeading && (
              <div className="anim-in mt-2 hidden lg:block">
                <h1 className="font-display text-[1.9rem] leading-tight">{current.label}</h1>
                {current.description && <p className="mt-1.5 text-sm text-muted">{current.description}</p>}
              </div>
            )}

            {/* Re-keyed by route so every screen change plays the entrance animation. */}
            <div key={pathname} className="anim-in mt-6">
              {children}
            </div>

            <footer className="fx-card mt-10 rounded-card px-6 py-5 lg:hidden">
              <StudioSeal className="justify-between" />
            </footer>
          </div>
        </main>
      </div>
      <CommandPalette items={paletteItems} open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      {accountOpen && <AccountDialog onClose={() => setAccountOpen(false)} />}
    </div>
  );
}
