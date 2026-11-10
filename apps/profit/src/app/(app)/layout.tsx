"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AuthScreen, CreateOrgScreen, TrialScreen, useAccount } from "@stayflow/auth";
import { PRODUCT_BRAND, errorClass } from "@stayflow/ui";

const brand = PRODUCT_BRAND.profit;
const NAV = [
  { href: "/", label: "Overview" },
  { href: "/entries", label: "Entries" },
  { href: "/properties", label: "Properties" },
];

/** Decides what the visitor sees: sign in -> business setup -> trial -> the app. */
export default function AppLayout({ children }: { children: ReactNode }) {
  const { loading, error, session, org, licenses, can, signOut } = useAccount();
  const pathname = usePathname();

  if (loading) return <p className="px-5 pt-14 text-center text-sm text-black/50">Loading…</p>;
  if (!session) return <AuthScreen productName={brand.name} tagline={brand.tagline} />;
  if (error) {
    return (
      <main className="mx-auto max-w-md px-5 pt-14">
        <p role="alert" className={errorClass}>{error}</p>
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
        <button type="button" onClick={signOut} className="mt-1 text-sm text-black/50 underline-offset-4 hover:underline">
          Sign out
        </button>
      </header>

      {daysLeft !== null && (
        <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Free trial: {daysLeft} {daysLeft === 1 ? "day" : "days"} left.
        </p>
      )}

      <nav className="mt-6 flex gap-1 rounded-xl bg-white p-1 ring-1 ring-line" aria-label="Sections">
        {NAV.map((n) => {
          const active = pathname === n.href;
          return (
            <Link
              key={n.href}
              href={n.href}
              aria-current={active ? "page" : undefined}
              className={`flex-1 rounded-lg px-3 py-2 text-center text-sm font-medium transition ${
                active ? "bg-ink text-white" : "text-black/60 hover:text-black"
              }`}
            >
              {n.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6">{children}</div>

      <footer className="mt-10 flex items-center justify-between rounded-card bg-ink px-6 py-5">
        <span className="text-xs uppercase tracking-[0.2em] text-white/50">A product by</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/digital-studio-logo-white.svg" alt="Digital Studio" className="h-7 w-auto" />
      </footer>
    </main>
  );
}
