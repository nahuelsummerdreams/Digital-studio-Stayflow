"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useI18n, type TFn } from "@stayflow/i18n";
import { formatMoney } from "@stayflow/money";
import { localToday, owedWhen, ownerOverview, useHostData, type HostProperty, type OwedRow, type OwnerOverview } from "@stayflow/module-host";
import { useOpsData } from "@stayflow/module-operations";
import { useLedger } from "@stayflow/module-profit";
import { EmptyState, Icon, Pill, ProgressBar, Skeleton, StatCard, buttonClass, cardClass, ghostButtonClass, type IconName, type Tone } from "@stayflow/ui";

function whenText(row: OwedRow, t: TFn): string {
  if (row.dueOn !== null && row.daysToDue !== null) {
    if (row.daysToDue < 0) return t("complete.home.dueAgo", { count: -row.daysToDue });
    if (row.daysToDue === 0) return t("complete.home.dueToday");
    if (row.daysToDue === 1) return t("complete.home.dueTomorrow");
    return t("complete.home.dueIn", { count: row.daysToDue });
  }
  const w = owedWhen(row.daysToCheckIn);
  switch (w.kind) {
    case "arrived": return t("complete.home.arrivedAgo", { count: w.days });
    case "today": return t("complete.home.arrivesToday");
    case "tomorrow": return t("complete.home.arrivesTomorrow");
    case "inDays": return t("complete.home.arrivesIn", { count: w.days });
  }
}

/** "Overdue" only when the owner's payment date passed; with no date, an already-arrived guest who owes is shown as staying. */
function urgencyOf(row: OwedRow, t: TFn): { tone: Tone; label: string } {
  if (row.urgency === "overdue" && row.daysToDue === null) return { tone: "danger", label: t("complete.home.urgStaying") };
  if (row.urgency === "overdue") return { tone: "danger", label: t("complete.home.urgOverdue") };
  if (row.urgency === "soon") return { tone: "warning", label: t("complete.home.urgSoon") };
  return { tone: "muted", label: t("complete.home.urgLater") };
}

const ACTIONS: { href: string; key: "actProperty" | "actGuest" | "actEntry" | "actTask"; icon: IconName }[] = [
  { href: "/properties", key: "actProperty", icon: "building" },
  { href: "/guests", key: "actGuest", icon: "users" },
  { href: "/finance/entries", key: "actEntry", icon: "wallet" },
  { href: "/operations/jobs?new=1", key: "actTask", icon: "tasks" },
];

/**
 * The owner's home: what is happening today and, above all, who still owes money and how much.
 * Money figures are what was collected, not what was billed.
 */
export function CompleteHome({ client, orgId, currency, userName, properties }: { client: SupabaseClient; orgId: string; currency: string; userName: string; properties: HostProperty[] }) {
  const host = useHostData();
  const ops = useOpsData();
  const { ledger } = useLedger(client, orgId, { collected: true });
  const { locale } = useI18n();
  const today = localToday();
  const money = (n: number) => formatMoney(n, currency, locale);

  const o = useMemo(() => ownerOverview({ bookings: host.bookings, jobs: ops.jobs, expenses: ledger.expenses, today, collectedIncomes: ledger.basis === "collected" ? ledger.incomes : undefined }), [host.bookings, ops.jobs, ledger.expenses, today]);
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
  const { t } = useI18n();
  const shown = o.owedList.slice(0, 6);
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl">{t("complete.home.hello", { name: userName })}</h1>
          <p className="mt-1 text-sm text-muted">{t("complete.home.sub")}</p>
        </div>
        <Link href="/bookings?new=1" className={buttonClass}>
          <Icon name="plus" className="mr-1.5 h-4 w-4" />
          {t("complete.home.newBooking")}
        </Link>
      </header>

      <nav aria-label={t("complete.home.quickLabel")} className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible">
        {ACTIONS.map((a) => (
          <Link key={a.href} href={a.href} className={`${ghostButtonClass} shrink-0 whitespace-nowrap`}>
            <Icon name={a.icon} className="mr-1.5 h-4 w-4" />
            {t(`complete.home.${a.key}`)}
          </Link>
        ))}
      </nav>

      <section aria-labelledby="owed-title" className={`${cardClass} fx-hero`}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="owed-title" className="text-[13px] text-muted">{t("complete.home.owed")}</h2>
            <p className="font-display tabular mt-1 text-4xl sm:text-5xl">{money(o.owedTotal)}</p>
            <p className="mt-1 text-sm text-muted">
              {o.owedList.length === 0 ? t("complete.home.owedNone") : t("complete.home.owedCount", { count: o.owedList.length })}
            </p>
            {o.pastDue.count > 0 && (
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-danger/40 bg-danger/10 px-3 py-1 text-xs font-medium text-danger">
                <Icon name="alert" className="h-3.5 w-3.5" />
                {t("complete.home.pastDue", { amount: money(o.pastDue.total), count: o.pastDue.count })}
              </p>
            )}
          </div>
          {o.owedList.length > shown.length && (
            <Link href="/bookings" className={ghostButtonClass}>{t("complete.home.viewAll", { count: o.owedList.length })}</Link>
          )}
        </div>

        {shown.length === 0 ? (
          <div className="mt-5">
            <EmptyState icon="check" title={t("complete.home.allPaid")} body={t("complete.home.allPaidBody")} />
          </div>
        ) : (
          <ul className="mt-5 divide-y divide-line/60">
            {shown.map((r) => {
              const u = urgencyOf(r, t);
              const paid = Math.max(0, r.booking.amount - r.owed);
              return (
                <li key={r.booking.id}>
                  <Link href={`/bookings?property=${r.booking.propertyId}&in=${r.booking.checkIn}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3 transition hover:bg-accent/5 sm:flex-nowrap">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{r.booking.guestName}</p>
                      <p className="truncate text-xs text-muted">{propName(r.booking.propertyId)} · {whenText(r, t)}</p>
                    </div>
                    <div className="w-full sm:w-44">
                      <ProgressBar label={t("complete.home.paidBy", { name: r.booking.guestName })} tone={r.urgency === "overdue" ? "danger" : "accent"} value={r.booking.amount > 0 ? (paid / r.booking.amount) * 100 : 0} />
                      <p className="mt-1 text-[11px] text-muted">{t("complete.home.paidOf", { paid: money(paid), total: money(r.booking.amount) })}</p>
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

      <section aria-label={t("complete.home.summary")} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label={t("complete.home.statActive")} icon="bed" sub={t("complete.home.statActiveSub")}>{o.activeBookings}</StatCard>
        <StatCard label={t("complete.home.statStaying")} icon="users" sub={t("complete.home.statStayingSub", { count: o.staying.stays })}>{o.staying.guests}</StatCard>
        <StatCard label={t("complete.home.statArrivals")} icon="login" sub={t("complete.home.statArrivalsSub")}>{o.arrivalsNext7}</StatCard>
        <StatCard label={t("complete.home.statDepartures")} icon="logout" sub={t("complete.home.statDeparturesSub")}>{o.departuresToday}</StatCard>
        <StatCard label={t("complete.home.statCollected")} icon="wallet" sub={t("complete.home.statCollectedSub", { billed: money(o.month.billed) })}>{money(o.month.collected)}</StatCard>
        <StatCard label={t("complete.home.statExpenses")} icon="list" sub={t("complete.home.statExpensesSub")}>{money(o.month.expenses)}</StatCard>
        <StatCard label={t("complete.home.statResult")} icon="chart" sub={t("complete.home.statResultSub")} hero>{money(o.month.result)}</StatCard>
        <StatCard label={t("complete.home.statCleaning")} icon="tasks" sub={o.jobs.overdue > 0 ? t("complete.home.statCleaningLate", { count: o.jobs.overdue }) : t("complete.home.statCleaningNone")}>{o.jobs.cleaningOpen}</StatCard>
        <StatCard label={t("complete.home.statMaintenance")} icon="repeat" sub={t("complete.home.statMaintenanceSub")}>{o.jobs.maintenanceOpen}</StatCard>
      </section>
    </div>
  );
}
