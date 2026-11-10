"use client";

import type { ReactNode } from "react";
import { useT } from "@stayflow/i18n";
import { AppShell, StayflowProviders } from "@stayflow/shell";
import { RegisterServiceWorker } from "@/components/RegisterServiceWorker";

function Nav({ children }: { children: ReactNode }) {
  const t = useT();
  return (
    <AppShell
      product="guest"
      nav={[
        { href: "/", label: t("nav.guides") },
        { href: "/properties", label: t("nav.properties") },
      ]}
    >
      {children}
    </AppShell>
  );
}

/** The editor for hosts. Guests never touch this: they use /g/<link>. */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <StayflowProviders url={process.env.NEXT_PUBLIC_SUPABASE_URL} anonKey={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}>
      <Nav>{children}</Nav>
      <RegisterServiceWorker />
    </StayflowProviders>
  );
}
