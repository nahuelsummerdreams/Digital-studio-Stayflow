"use client";

import { useMemo, type ReactNode } from "react";
import { useAccount } from "@stayflow/auth";
import { useT } from "@stayflow/i18n";
import { HostDataProvider, alertText, guestsDirectory, hostAlerts, localToday, useHostData } from "@stayflow/module-host";
import { AppShell, StayflowProviders, type SearchItem, type ShellAlert } from "@stayflow/shell";
import { RegisterServiceWorker } from "@/components/RegisterServiceWorker";

function Frame({ children }: { children: ReactNode }) {
  const t = useT();
  const { properties } = useAccount();
  const { bookings, tasks } = useHostData();
  const today = localToday();

  const alerts = useMemo<ShellAlert[]>(
    () =>
      hostAlerts(bookings, tasks, today).map((a) => {
        const text = alertText(a, t, properties);
        const tone = a.kind === "overdueTask" ? "danger" : a.kind === "departurePending" || a.kind === "arrivalPending" ? "warning" : a.kind === "arrivalsToday" ? "success" : "accent";
        return { id: a.id, tone, title: text.title, detail: text.detail, href: a.kind === "overdueTask" ? "/tasks" : a.kind === "noAmount" ? "/bookings" : "/calendar" };
      }),
    [bookings, tasks, properties, today, t],
  );

  const searchItems = useMemo<SearchItem[]>(
    () => [
      ...properties.map((p) => ({ label: p.name, hint: p.city ?? t("nav.properties"), href: "/properties", icon: "building" as const })),
      ...guestsDirectory(bookings).slice(0, 60).map((g) => ({ label: g.name, hint: t("nav.guests"), href: "/guests", icon: "users" as const })),
    ],
    [properties, bookings, t],
  );

  const upcoming = bookings.filter((b) => b.status === "confirmed" && b.checkIn >= today).length;
  const pending = tasks.filter((x) => !x.done).length;

  return (
    <AppShell
      product="host"
      quickAction={{ label: t("host.newBookingShort"), href: "/bookings?new=1" }}
      alerts={alerts}
      searchItems={searchItems}
      plansUrl={process.env.NEXT_PUBLIC_WEB_URL ? `${process.env.NEXT_PUBLIC_WEB_URL}#precios` : undefined}
      nav={[
        { href: "/", label: t("nav.dashboard"), icon: "dashboard", description: t("navDesc.dashboard"), group: t("navGroup.control"), ownHeading: true },
        { href: "/bookings", label: t("nav.bookings"), icon: "bed", description: t("navDesc.bookings"), badge: upcoming },
        { href: "/calendar", label: t("nav.schedule"), icon: "calendar", description: t("navDesc.calendar") },
        { href: "/guests", label: t("nav.guests"), icon: "users", description: t("navDesc.guests"), group: t("navGroup.manage") },
        { href: "/tasks", label: t("nav.tasks"), icon: "tasks", description: t("navDesc.tasks"), badge: pending },
        { href: "/properties", label: t("nav.properties"), icon: "building", description: t("navDesc.properties"), badge: properties.length },
      ]}
    >
      {children}
    </AppShell>
  );
}

function WithData({ children }: { children: ReactNode }) {
  const { client, org } = useAccount();
  return (
    <HostDataProvider client={client} orgId={org?.id ?? ""}>
      <Frame>{children}</Frame>
    </HostDataProvider>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <StayflowProviders url={process.env.NEXT_PUBLIC_SUPABASE_URL} anonKey={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}>
      <WithData>{children}</WithData>
      <RegisterServiceWorker />
    </StayflowProviders>
  );
}
