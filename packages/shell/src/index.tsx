"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, type ReactNode } from "react";
import { AccountProvider, AuthScreen, CreateOrgScreen, TrialScreen, createStayflowClient, useAccount } from "@stayflow/auth";
import { I18nProvider, useT } from "@stayflow/i18n";
import type { ProductKey } from "@stayflow/licensing";
import { Icon, PRODUCT_BRAND, Skeleton, StudioSeal, ThemeSwitcher, activeTabClass, errorClass, idleTabClass, type IconName } from "@stayflow/ui";

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
}

/**
 * What every Stayflow app shows around its screens:
 * sign in -> business setup -> free trial / license -> the app (header, tabs, Digital Studio seal).
 */
export function AppShell({ product, nav, children }: { product: ProductKey; nav: NavItem[]; children: ReactNode }) {
  const t = useT();
  const { loading, error, session, org, licenses, can, signOut } = useAccount();
  const pathname = usePathname();
  const brand = PRODUCT_BRAND[product];

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-5 pt-14" aria-busy="true" aria-label={t("common.loading")}>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-4 h-10 w-64" />
        <div className="mt-10 grid grid-cols-2 gap-4 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-card" />
          ))}
        </div>
      </main>
    );
  }
  if (!session) return <AuthScreen productName={brand.name} tagline={brand.tagline} />;
  if (error) {
    return (
      <main className="mx-auto max-w-md px-5 pt-14">
        <p role="alert" className={errorClass}>{t("common.loadError")}</p>
      </main>
    );
  }
  if (!org) return <CreateOrgScreen />;
  if (!can(product)) return <TrialScreen product={product} productName={brand.name} />;

  const trial = licenses.find((l) => l.product === product && l.status === "trialing");
  const daysLeft = trial?.currentPeriodEnd
    ? Math.max(0, Math.ceil((trial.currentPeriodEnd.getTime() - Date.now()) / 86_400_000))
    : null;

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));
  const current = nav.find((n) => isActive(n.href));

  return (
    <div className="lg:grid lg:min-h-screen lg:grid-cols-[17rem_1fr]">
      {/* Desktop: fixed side menu. This is how a host uses the installed app. */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-line bg-surface/40 px-5 py-8 lg:flex">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">{brand.name}</p>
          <p className="font-display mt-2 truncate text-xl leading-tight">{org.name}</p>
        </div>
        <nav className="mt-10 flex flex-col gap-1" aria-label={t("common.sections")}>
          {nav.map((n) => {
            const active = isActive(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active ? "bg-accent/15 text-accent" : "text-muted hover:bg-surface hover:text-fg"
                }`}
              >
                {n.icon && <Icon name={n.icon} />}
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto space-y-5">
          <ThemeSwitcher />
          <button type="button" onClick={signOut} className="block text-sm text-muted underline-offset-4 hover:underline">
            {t("common.signOut")}
          </button>
          <StudioSeal className="!flex-col !items-start !gap-2" />
        </div>
      </aside>

      <main className="min-w-0 px-5 pb-16 pt-8 lg:px-10 lg:pt-12">
        <div className="mx-auto max-w-5xl">
          {/* Phone and small tablet: header + tabs. */}
          <header className="flex items-start justify-between gap-4 lg:hidden">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">{brand.name}</p>
              <h1 className="font-display mt-2 text-3xl leading-tight">{org.name}</h1>
            </div>
            <div className="mt-1 flex flex-col items-end gap-3">
              <ThemeSwitcher />
              <button type="button" onClick={signOut} className="text-sm text-muted underline-offset-4 hover:underline">
                {t("common.signOut")}
              </button>
            </div>
          </header>

          {daysLeft !== null && (
            <p className="mt-4 rounded-xl bg-accent/10 px-3 py-2 text-sm text-accent lg:mt-0">
              {t("common.trialDays", { count: daysLeft })}
            </p>
          )}

          <nav className="mt-6 flex flex-wrap gap-1 rounded-xl border border-line bg-surface p-1 lg:hidden" aria-label={t("common.sections")}>
            {nav.map((n) => {
              const active = isActive(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={active ? "page" : undefined}
                  className={`min-w-[30%] flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-center text-sm font-medium transition sm:min-w-0 ${
                    active ? activeTabClass : idleTabClass
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>

          {current && (
            <div className="mt-4 hidden lg:block">
              <h1 className="font-display text-3xl">{current.label}</h1>
              {current.description && <p className="mt-1.5 text-sm text-muted">{current.description}</p>}
            </div>
          )}

          <div className="mt-6">{children}</div>

          <footer className="mt-10 rounded-card border border-line bg-surface px-6 py-5 lg:hidden">
            <StudioSeal className="justify-between" />
          </footer>
        </div>
      </main>
    </div>
  );
}
