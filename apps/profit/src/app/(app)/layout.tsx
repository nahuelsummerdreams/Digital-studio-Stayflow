"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AuthScreen, CreateOrgScreen, TrialScreen, useAccount } from "@stayflow/auth";
import { useT } from "@stayflow/i18n";
import { PRODUCT_BRAND, ThemeSwitcher, activeTabClass, errorClass, idleTabClass } from "@stayflow/ui";

const brand = PRODUCT_BRAND.profit;
const NAV = [
  { href: "/", key: "nav.overview" },
  { href: "/entries", key: "nav.entries" },
  { href: "/fixed", key: "nav.fixed" },
  { href: "/calculator", key: "nav.calculator" },
  { href: "/properties", key: "nav.properties" },
] as const;

/** Decides what the visitor sees: sign in -> business setup -> trial -> the app. */
export default function AppLayout({ children }: { children: ReactNode }) {
  const t = useT();
  const { loading, error, session, org, licenses, can, signOut } = useAccount();
  const pathname = usePathname();

  if (loading) return <p className="px-5 pt-14 text-center text-sm text-muted">{t("common.loading")}</p>;
  if (!session) return <AuthScreen productName={brand.name} tagline={brand.tagline} />;
  if (error) {
    return (
      <main className="mx-auto max-w-md px-5 pt-14">
        <p role="alert" className={errorClass}>{t("common.loadError")}</p>
      </main>
    );
  }
  if (!org) return <CreateOrgScreen />;
  if (!can("profit")) return <TrialScreen product="profit" productName={brand.name} />;

  const trial = licenses.find((l) => l.product === "profit" && l.status === "trialing");
  const daysLeft = trial?.currentPeriodEnd
    ? Math.max(0, Math.ceil((trial.currentPeriodEnd.getTime() - Date.now()) / 86_400_000))
    : null;

  return (
    <main className="mx-auto max-w-3xl px-5 pb-16 pt-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">{brand.name}</p>
          <h1 className="mt-2 font-display text-3xl leading-tight">{org.name}</h1>
        </div>
        <div className="mt-1 flex flex-col items-end gap-3">
          <ThemeSwitcher />
          <button type="button" onClick={signOut} className="text-sm text-muted underline-offset-4 hover:underline">
            {t("common.signOut")}
          </button>
        </div>
      </header>

      {daysLeft !== null && (
        <p className="mt-4 rounded-xl bg-accent/10 px-3 py-2 text-sm text-accent">{t("common.trialDays", { count: daysLeft })}</p>
      )}

      <nav className="mt-6 flex flex-wrap gap-1 rounded-xl border border-line bg-surface p-1" aria-label={t("common.sections")}>
        {NAV.map((n) => {
          const active = pathname === n.href;
          return (
            <Link
              key={n.href}
              href={n.href}
              aria-current={active ? "page" : undefined}
              className={`min-w-[30%] flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-center text-sm font-medium transition sm:min-w-0 ${
                active ? activeTabClass : idleTabClass
              }`}
            >
              {t(n.key)}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6">{children}</div>

      <footer className="mt-10 flex items-center justify-between rounded-card border border-line bg-surface px-6 py-5">
        <span className="text-xs uppercase tracking-[0.2em] text-muted">{t("common.productBy")}</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/digital-studio-logo-white.svg" alt="Digital Studio" className="h-7 w-auto" />
      </footer>
    </main>
  );
}
