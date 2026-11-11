"use client";

import { useI18n } from "@stayflow/i18n";
import { formatMoney } from "@stayflow/money";
import { Icon, cardClass, type IconName } from "@stayflow/ui";
import { localToday } from "../dates";
import { owed, pendingPayments, todayPlan } from "../logic";
import type { Booking, HostProperty, HostTask } from "../types";

interface Props {
  currency: string;
  properties: HostProperty[];
  bookings: Booking[];
  tasks: HostTask[];
  onGoBookings: () => void;
  onGoTasks: () => void;
  onGoCalendar: () => void;
}

/** One list for the day: who arrives, who leaves, what to clean, what to collect. */
export function HostToday({ currency, properties, bookings, tasks, onGoBookings, onGoTasks, onGoCalendar }: Props) {
  const { t, locale } = useI18n();
  const today = localToday();
  const plan = todayPlan(bookings, tasks, today);
  const prop = (id: string) => properties.find((p) => p.id === id)?.name ?? "—";
  const pending = pendingPayments(bookings);
  const pendingSum = pending.reduce((s, b) => s + owed(b), 0);

  type Group = { key: string; icon: IconName; tone: string; title: string; rows: { id: string; main: string; sub: string }[]; go: () => void };
  const groups = ([
    { key: "in", icon: "key", tone: "text-success", title: t("hx.todayArrivals"), go: onGoCalendar, rows: plan.arrivals.map((b) => ({ id: b.id, main: b.guestName, sub: `${prop(b.propertyId)} · ${t("host.people", { count: b.guestsCount })}` })) },
    { key: "out", icon: "logoutDoor", tone: "text-accent", title: t("hx.todayDepartures"), go: onGoCalendar, rows: plan.departures.map((b) => ({ id: b.id, main: b.guestName, sub: prop(b.propertyId) })) },
    { key: "tomorrow", icon: "calendar", tone: "text-muted", title: t("hx.todayTomorrow"), go: onGoCalendar, rows: plan.tomorrowArrivals.map((b) => ({ id: b.id, main: b.guestName, sub: prop(b.propertyId) })) },
    { key: "tasks", icon: "tasks", tone: "text-amber-300", title: t("hx.todayTasks"), go: onGoTasks, rows: plan.tasks.map((x) => ({ id: x.id, main: x.title, sub: x.propertyId ? prop(x.propertyId) : "" })) },
    { key: "overdue", icon: "alert", tone: "text-danger", title: t("hx.todayOverdue"), go: onGoTasks, rows: plan.overdue.map((x) => ({ id: x.id, main: x.title, sub: x.propertyId ? prop(x.propertyId) : "" })) },
    { key: "collect", icon: "wallet", tone: "text-amber-300", title: t("hx.todayCollect"), go: onGoBookings, rows: plan.collect.map((b) => ({ id: b.id, main: b.guestName, sub: t("hx.todayOwes", { amount: formatMoney(owed(b), currency, locale) }) })) },
  ] as Group[]).filter((g) => g.rows.length > 0);

  return (
    <section aria-label={t("hx.todayTitle")} className={`${cardClass} !p-5`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl">{t("hx.todayTitle")}</h2>
        {pendingSum > 0 && (
          <button type="button" onClick={onGoBookings} className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-300">
            {t("hx.pendingTotal")}: {formatMoney(pendingSum, currency, locale)}
          </button>
        )}
      </div>
      {groups.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{t("hx.todayNothing")}</p>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {groups.map((g) => (
            <button key={g.key} type="button" onClick={g.go} className="rounded-2xl border border-line bg-bg/40 p-4 text-left transition hover:border-accent/50">
              <p className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] ${g.tone}`}><Icon name={g.icon} className="h-4 w-4" />{g.title} · {g.rows.length}</p>
              <ul className="mt-2.5 space-y-1.5">
                {g.rows.slice(0, 4).map((r) => (
                  <li key={r.id} className="truncate text-sm"><span className="font-medium">{r.main}</span>{r.sub && <span className="text-muted"> · {r.sub}</span>}</li>
                ))}
                {g.rows.length > 4 && <li className="text-xs text-muted">+{g.rows.length - 4}</li>}
              </ul>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
