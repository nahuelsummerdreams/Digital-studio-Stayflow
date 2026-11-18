"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { formatMoney } from "@stayflow/money";
import { localToday, owedWhen, ownerOverview, useHostData, type HostProperty, type OwedRow, type OwnerOverview } from "@stayflow/module-host";
import { useOpsData } from "@stayflow/module-operations";
import { useLedger } from "@stayflow/module-profit";
import { EmptyState, Icon, Pill, ProgressBar, Skeleton, StatCard, buttonClass, cardClass, ghostButtonClass, type IconName, type Tone } from "@stayflow/ui";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function whenText(row: OwedRow): string {
  const w = owedWhen(row.daysToCheckIn);
  switch (w.kind) {
    case "arrived": return `Llegó hace ${plural(w.days, "día", "días")}`;
    case "today": return "Llega hoy";
    case "tomorrow": return "Llega mañana";
    case "inDays": return `Llega en ${w.days} días`;
  }
}

const URGENCY: Record<OwedRow["urgency"], { tone: Tone; label: string }> = {
  overdue: { tone: "danger", label: "Ya está alojado" },
  soon: { tone: "warning", label: "Esta semana" },
  later: { tone: "muted", label: "Más adelante" },
};

const ACTIONS: { href: string; label: string; icon: IconName }[] = [
  { href: "/properties", label: "Nueva propiedad", icon: "building" },
  { href: "/guests", label: "Nuevo huésped", icon: "users" },
  { href: "/finance/entries", label: "Registrar ingreso o gasto", icon: "wallet" },
  { href: "/operations/jobs?new=1", label: "Crear tarea", icon: "tasks" },
];

/**
 * The owner's home: what is happening today and, above all, who still owes money and how much.
 * Money figures are what was collected, not what was billed.
 */
export function CompleteHome({ client, orgId, currency, userName, properties }: { client: SupabaseClient; orgId: string; currency: string; userName: string; properties: HostProperty[] }) {
  const host = useHostData();
  const ops = useOpsData();
  const { ledger } = useLedger(client, orgId);
  const today = localToday();
  const money = (n: number) => formatMoney(n, currency);

  const o = useMemo(() => ownerOverview({ bookings: host.bookings, jobs: ops.jobs, expenses: ledger.expenses, today }), [host.bookings, ops.jobs, ledger.expenses, today]);
  const propName = (id: string) => properties.find((p) => p.id === id)?.name ?? "";

  if (host.loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-56" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-28" />)}</div>
      </div>
    );
  }

  return <HomeView o={o} money={money} userName={userName} propName={propName} />;
}

/** The screen itself, without data fetching, so it can be previewed and tested with plain numbers. */
export function HomeView({ o, money, userName, propName }: { o: OwnerOverview; money: (n: number) => string; userName: string; propName: (id: string) => string }) {
  const shown = o.owedList.slice(0, 6);
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl">Hola, {userName}</h1>
          <p className="mt-1 text-sm text-muted">Esto es lo que pasa hoy en tu negocio.</p>
        </div>
        <Link href="/bookings?new=1" className={buttonClass}>
          <Icon name="plus" className="mr-1.5 h-4 w-4" />
          Nueva reserva
        </Link>
      </header>

      <nav aria-label="Acciones rápidas" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible">
        {ACTIONS.map((a) => (
          <Link key={a.href} href={a.href} className={`${ghostButtonClass} shrink-0 whitespace-nowrap`}>
            <Icon name={a.icon} className="mr-1.5 h-4 w-4" />
            {a.label}
          </Link>
        ))}
      </nav>

      <section aria-labelledby="owed-title" className={`${cardClass} fx-hero`}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="owed-title" className="text-[13px] text-muted">Por cobrar</h2>
            <p className="font-display tabular mt-1 text-4xl sm:text-5xl">{money(o.owedTotal)}</p>
            <p className="mt-1 text-sm text-muted">
              {o.owedList.length === 0 ? "No hay saldos pendientes." : `${plural(o.owedList.length, "reserva con saldo", "reservas con saldo")}.`}
            </p>
          </div>
          {o.owedList.length > shown.length && (
            <Link href="/bookings" className={ghostButtonClass}>Ver las {o.owedList.length}</Link>
          )}
        </div>

        {shown.length === 0 ? (
          <div className="mt-5">
            <EmptyState icon="check" title="Todo cobrado" body="Cuando una reserva tenga saldo pendiente, vas a ver acá quién debe, cuánto falta y cuándo llega." />
          </div>
        ) : (
          <ul className="mt-5 divide-y divide-line/60">
            {shown.map((r) => {
              const u = URGENCY[r.urgency];
              const paid = Math.max(0, r.booking.amount - r.owed);
              return (
                <li key={r.booking.id}>
                  <Link href={`/bookings?property=${r.booking.propertyId}&in=${r.booking.checkIn}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3 transition hover:bg-accent/5 sm:flex-nowrap">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{r.booking.guestName}</p>
                      <p className="truncate text-xs text-muted">{propName(r.booking.propertyId)} · {whenText(r)}</p>
                    </div>
                    <div className="w-full sm:w-44">
                      <ProgressBar label={`Pagado por ${r.booking.guestName}`} tone={r.urgency === "overdue" ? "danger" : "accent"} value={r.booking.amount > 0 ? (paid / r.booking.amount) * 100 : 0} />
                      <p className="mt-1 text-[11px] text-muted">Pagó {money(paid)} de {money(r.booking.amount)}</p>
                    </div>
                    <div className="flex items-center gap-3 sm:w-44 sm:justify-end">
                      <Pill tone={u.tone}>{u.label}</Pill>
                      <span className="font-display tabular text-lg">{money(r.owed)}</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-label="Resumen" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Reservas activas" icon="bed" sub="Todavía no terminaron">{o.activeBookings}</StatCard>
        <StatCard label="Alojados hoy" icon="users" sub={plural(o.staying.stays, "reserva en curso", "reservas en curso")}>{o.staying.guests}</StatCard>
        <StatCard label="Próximas entradas" icon="login" sub="En los próximos 7 días">{o.arrivalsNext7}</StatCard>
        <StatCard label="Salidas hoy" icon="logout" sub="Se pueden limpiar hoy">{o.departuresToday}</StatCard>
        <StatCard label="Cobrado este mes" icon="wallet" sub={`De ${money(o.month.billed)} de reservas del mes`}>{money(o.month.collected)}</StatCard>
        <StatCard label="Gastos del mes" icon="list" sub="Los que registraste">{money(o.month.expenses)}</StatCard>
        <StatCard label="Resultado del mes" icon="chart" sub="Cobrado menos gastos" hero>{money(o.month.result)}</StatCard>
        <StatCard label="Limpiezas pendientes" icon="tasks" sub={o.jobs.overdue > 0 ? `${plural(o.jobs.overdue, "trabajo vencido", "trabajos vencidos")}` : "Sin vencidos"}>{o.jobs.cleaningOpen}</StatCard>
        <StatCard label="Mantenimientos pendientes" icon="repeat" sub="Reparaciones y revisiones">{o.jobs.maintenanceOpen}</StatCard>
      </section>
    </div>
  );
}
