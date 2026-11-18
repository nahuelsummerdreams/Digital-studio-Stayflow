"use client";

import { useMemo, type ReactNode } from "react";
import { useAccount } from "@stayflow/auth";
import { useI18n } from "@stayflow/i18n";
import { HostDataProvider, SyncNotice, alertText, guestsDirectory, hostAlerts, localToday, nextDueOn, pendingPayments, useAutoSync, useHostData } from "@stayflow/module-host";
import { formatMoney } from "@stayflow/money";
import { OpsDataProvider, groupJobs, useOpsData } from "@stayflow/module-operations";
import { AppShell, StayflowProviders, type SearchItem, type ShellAlert } from "@stayflow/shell";
import { HelpChat } from "@/components/HelpChat";
import { RegisterServiceWorker } from "@/components/RegisterServiceWorker";

/**
 * STAYflow Complete: one menu for the whole business. Reservations, calendar, properties, guests, finances,
 * operations and the guest guide share one account, one set of properties and one set of bookings.
 * Tasks have a single source (Operations jobs); the old Host to-do list is not shown here.
 */
function Frame({ children }: { children: ReactNode }) {
  const { t, locale } = useI18n();
  const { client, org, properties } = useAccount();
  const { bookings, reload } = useHostData();
  const { jobs } = useOpsData();
  useAutoSync(client, org?.id ?? "", reload);
  const today = localToday();
  const g = useMemo(() => groupJobs(jobs, today), [jobs, today]);

  const alerts = useMemo<ShellAlert[]>(
    () => [
      // Host's own to-do list is not used here, so its "overdue task" alert is left out; Operations jobs replace it.
      ...hostAlerts(bookings, [], today).map((a) => {
        const text = alertText(a, t, properties);
        const tone = a.kind === "departurePending" || a.kind === "arrivalPending" ? ("warning" as const) : a.kind === "arrivalsToday" ? ("success" as const) : ("accent" as const);
        return { id: a.id, tone, title: text.title, detail: text.detail, href: a.kind === "noAmount" ? "/bookings" : "/calendar" };
      }),
      // A payment whose date the owner set has passed and money is still missing.
      ...pendingPayments(bookings)
        .filter((b) => {
          const due = nextDueOn(b);
          return due !== null && due < today;
        })
        .slice(0, 6)
        .map((b) => ({ id: `due-${b.id}`, tone: "danger" as const, title: t("complete.alerts.dueTitle", { name: b.guestName }), detail: t("complete.alerts.dueDetail", { amount: formatMoney(b.amount - b.paid, org?.currency ?? "USD", locale) }), href: "/bookings" })),
      ...g.overdue.slice(0, 6).map((j) => ({ id: `late-${j.id}`, tone: "danger" as const, title: j.title, detail: properties.find((p) => p.id === j.propertyId)?.name ?? "", href: "/operations/jobs" })),
    ],
    [bookings, g, properties, today, t, locale, org?.currency],
  );

  const searchItems = useMemo<SearchItem[]>(
    () => [
      ...properties.map((p) => ({ label: p.name, hint: p.city ?? t("complete.nav.properties"), href: "/properties", icon: "building" as const })),
      ...guestsDirectory(bookings).slice(0, 60).map((x) => ({ label: x.name, hint: t("complete.nav.guests"), href: "/guests", icon: "users" as const })),
    ],
    [properties, bookings, t],
  );

  const upcoming = bookings.filter((b) => b.status === "confirmed" && b.checkIn >= today).length;
  const debtors = pendingPayments(bookings);
  const opsOpen = g.overdue.length + g.today.length;
  const unitsLabel =
    org?.lodgingType === "hostel" ? t("nav.roomsBeds") : org?.lodgingType === "hotel" ? t("nav.rooms") : org?.lodgingType === "cabins" ? t("unit.cabins.many").replace(/^./, (c) => c.toUpperCase()) : t("complete.nav.properties");

  return (
    <AppShell
      product="suite"
      quickAction={{ label: t("host.newBookingShort"), href: "/bookings?new=1" }}
      alerts={alerts}
      searchItems={searchItems}
      plansUrl={process.env.NEXT_PUBLIC_WEB_URL ? `${process.env.NEXT_PUBLIC_WEB_URL}#precios` : undefined}
      nav={[
        { href: "/", module: "dashboard", label: t("complete.nav.home"), icon: "dashboard", description: t("complete.navDesc.home"), group: t("complete.nav.groupBusiness"), ownHeading: true },
        { href: "/calendar", module: "calendar", label: t("complete.nav.calendar"), icon: "calendar", description: t("complete.navDesc.calendar") },
        { href: "/bookings", module: "bookings", label: t("complete.nav.bookings"), icon: "bed", description: t("complete.navDesc.bookings"), badge: upcoming },
        { href: "/properties", module: "properties", label: unitsLabel, icon: "building", description: t("complete.navDesc.properties"), badge: properties.length },
        { href: "/guests", module: "guests", label: t("complete.nav.guests"), icon: "users", description: t("complete.navDesc.guests") },
        { href: "/finance", label: t("complete.nav.finance"), icon: "wallet", description: t("complete.navDesc.finance"), group: t("complete.nav.groupManage"), badge: debtors.length || undefined },
        { href: "/operations", label: t("complete.nav.operations"), icon: "tasks", description: t("complete.navDesc.operations"), badge: opsOpen || undefined },
        { href: "/guide", label: t("complete.nav.guide"), icon: "qr", description: t("complete.navDesc.guide") },
        { href: "/team", label: t("complete.nav.team"), icon: "users", description: t("complete.navDesc.team") },
        { href: "/settings", label: t("complete.nav.settings"), icon: "settings", description: t("complete.navDesc.settings"), group: t("complete.nav.groupMore") },
        { href: "/reception", module: "reception", label: t("nav.reception"), icon: "key", description: t("navDesc.reception") },
        { href: "/messages", module: "messages", label: t("nav.messages"), icon: "message", description: t("navDesc.messages") },
        { href: "/reports", module: "reports", label: t("nav.reports"), icon: "report", description: t("navDesc.reports") },
        { href: "/sheets", label: t("sheet.nav"), icon: "report", description: t("navDesc.sheets") },
      ]}
    >
      <SyncNotice client={client} orgId={org?.id ?? ""} onDone={reload} />
      {children}
      <HelpChat />
    </AppShell>
  );
}

function WithData({ children }: { children: ReactNode }) {
  const { client, org, can } = useAccount();
  return (
    <HostDataProvider client={client} orgId={org?.id ?? ""} lodgingType={org?.lodgingType}>
      <OpsDataProvider client={client} orgId={org?.id ?? ""} enabled={can("operations")}>
        <Frame>{children}</Frame>
      </OpsDataProvider>
    </HostDataProvider>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <StayflowProviders url={process.env.NEXT_PUBLIC_SUPABASE_URL} anonKey={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY} detectLocale>
      <WithData>{children}</WithData>
      <RegisterServiceWorker />
    </StayflowProviders>
  );
}
