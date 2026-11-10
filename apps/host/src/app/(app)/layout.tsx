"use client";

import type { ReactNode } from "react";
import { useT } from "@stayflow/i18n";
import { AppShell, StayflowProviders } from "@stayflow/shell";
import { RegisterServiceWorker } from "@/components/RegisterServiceWorker";

function Frame({ children }: { children: ReactNode }) {
  const t = useT();
  return (
    <AppShell
      product="host"
      nav={[
        { href: "/", label: t("nav.dashboard"), icon: "dashboard", description: t("navDesc.dashboard") },
        { href: "/bookings", label: t("nav.bookings"), icon: "bed", description: t("navDesc.bookings") },
        { href: "/calendar", label: t("nav.calendar"), icon: "calendar", description: t("navDesc.calendar") },
        { href: "/guests", label: t("nav.guests"), icon: "users", description: t("navDesc.guests") },
        { href: "/tasks", label: t("nav.tasks"), icon: "tasks", description: t("navDesc.tasks") },
        { href: "/properties", label: t("nav.properties"), icon: "building", description: t("navDesc.properties") },
      ]}
    >
      {children}
    </AppShell>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <StayflowProviders url={process.env.NEXT_PUBLIC_SUPABASE_URL} anonKey={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}>
      <Frame>{children}</Frame>
      <RegisterServiceWorker />
    </StayflowProviders>
  );
}
