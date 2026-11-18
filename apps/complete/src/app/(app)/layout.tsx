"use client";

import { useMemo, type ReactNode } from "react";
import { useAccount } from "@stayflow/auth";
import { useT } from "@stayflow/i18n";
import { HostDataProvider, SyncNotice, alertText, guestsDirectory, hostAlerts, localToday, nextDueOn, pendingPayments, useAutoSync, useHostData } from "@stayflow/module-host";
import { formatMoney } from "@stayflow/money";
import { OpsDataProvider, groupJobs, useOpsData } from "@stayflow/module-operations";
import { AppShell, StayflowProviders, type SearchItem, type ShellAlert } from "@stayflow/shell";
import { RegisterServiceWorker } from "@/components/RegisterServiceWorker";

/**
 * STAYflow Complete: one menu for the whole business. Reservations, calendar, properties, guests, finances,
 * operations and the guest guide share one account, one set of properties and one set of bookings.
 * Tasks have a single source (Operations jobs); the old Host to-do list is not shown here.
 */
function Frame({ children }: { children: ReactNode }) {
  const t = useT();
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
        .map((b) => ({ id: `due-${b.id}`, tone: "danger" as const, title: `Cobro vencido: ${b.guestName}`, detail: `Falta ${formatMoney(b.amount - b.paid, org?.currency ?? "USD")}`, href: "/bookings" })),
      ...g.overdue.slice(0, 6).map((j) => ({ id: `late-${j.id}`, tone: "danger" as const, title: j.title, detail: properties.find((p) => p.id === j.propertyId)?.name ?? "", href: "/operations/jobs" })),
    ],
    [bookings, g, properties, today, t, org?.currency],
  );

  const searchItems = useMemo<SearchItem[]>(
    () => [
      ...properties.map((p) => ({ label: p.name, hint: p.city ?? "Propiedades", href: "/properties", icon: "building" as const })),
      ...guestsDirectory(bookings).slice(0, 60).map((x) => ({ label: x.name, hint: "Huéspedes", href: "/guests", icon: "users" as const })),
    ],
    [properties, bookings],
  );

  const upcoming = bookings.filter((b) => b.status === "confirmed" && b.checkIn >= today).length;
  const debtors = pendingPayments(bookings);
  const opsOpen = g.overdue.length + g.today.length;
  const unitsLabel =
    org?.lodgingType === "hostel" ? t("nav.roomsBeds") : org?.lodgingType === "hotel" ? t("nav.rooms") : org?.lodgingType === "cabins" ? t("unit.cabins.many").replace(/^./, (c) => c.toUpperCase()) : "Propiedades";

  return (
    <AppShell
      product="suite"
      quickAction={{ label: t("host.newBookingShort"), href: "/bookings?new=1" }}
      alerts={alerts}
      searchItems={searchItems}
      plansUrl={process.env.NEXT_PUBLIC_WEB_URL ? `${process.env.NEXT_PUBLIC_WEB_URL}#precios` : undefined}
      nav={[
        { href: "/", module: "dashboard", label: "Inicio", icon: "dashboard", description: "Lo que importa hoy", group: "Tu negocio", ownHeading: true },
        { href: "/calendar", module: "calendar", label: "Calendario", icon: "calendar", description: "Ocupación de todas tus propiedades" },
        { href: "/bookings", module: "bookings", label: "Reservas", icon: "bed", description: "Entradas, salidas y cobros", badge: upcoming },
        { href: "/properties", module: "properties", label: unitsLabel, icon: "building", description: "Fichas, fotos y datos de acceso", badge: properties.length },
        { href: "/guests", module: "guests", label: "Huéspedes", icon: "users", description: "Contactos e historial" },
        { href: "/finance", label: "Finanzas", icon: "wallet", description: "Cobros, saldos, ingresos y gastos", group: "Gestión", badge: debtors.length || undefined },
        { href: "/operations", label: "Operaciones", icon: "tasks", description: "Limpieza, mantenimiento y tareas", badge: opsOpen || undefined },
        { href: "/guide", label: "Guía del huésped", icon: "qr", description: "Guía digital con código QR" },
        { href: "/team", label: "Equipo", icon: "users", description: "Quién puede entrar y con qué permisos" },
        { href: "/sync", module: "channels", label: "Configuración", icon: "settings", description: "Sincronización con Airbnb y Booking", group: "Más" },
        { href: "/reception", module: "reception", label: t("nav.reception"), icon: "key", description: t("navDesc.reception") },
        { href: "/messages", module: "messages", label: t("nav.messages"), icon: "message", description: t("navDesc.messages") },
        { href: "/reports", module: "reports", label: t("nav.reports"), icon: "report", description: t("navDesc.reports") },
        { href: "/sheets", label: t("sheet.nav"), icon: "report", description: t("navDesc.sheets") },
      ]}
    >
      <SyncNotice client={client} orgId={org?.id ?? ""} onDone={reload} />
      {children}
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
    <StayflowProviders url={process.env.NEXT_PUBLIC_SUPABASE_URL} anonKey={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}>
      <WithData>{children}</WithData>
      <RegisterServiceWorker />
    </StayflowProviders>
  );
}
