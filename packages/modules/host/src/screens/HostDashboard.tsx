"use client";

import type { ReactNode } from "react";
import { useI18n } from "@stayflow/i18n";
import { formatMoney } from "@stayflow/money";
import { EmptyState, Icon, Skeleton, cardClass, type IconName } from "@stayflow/ui";
import { firstOfMonth, firstOfNextMonth, localToday } from "../dates";
import { shortDate } from "../format";
import { bookedRevenue, movementsOn, occupancyPct, upcomingArrivals } from "../logic";
import type { Booking, HostTask } from "../types";

interface Props {
  currency: string;
  properties: { id: string; name: string }[];
  bookings: Booking[];
  tasks: HostTask[];
  loading: boolean;
  links: { profit?: string; guest?: string };
  onGoBookings: () => void;
  onGoTasks: () => void;
  onGoProperties: () => void;
}

function Kpi({ label, value, hero = false, sub }: { label: string; value: string; hero?: boolean; sub?: string }) {
  return (
    <article className={`rounded-card border p-4 sm:p-5 ${hero ? "border-accent/40 bg-surface shadow-[0_0_70px_-35px_rgb(var(--accent)/0.9)]" : "border-line bg-surface"}`}>
      <p className="text-sm text-muted">{label}</p>
      <p className={`font-display mt-2 text-2xl sm:text-3xl xl:text-4xl ${hero ? "text-money" : ""}`}>{value}</p>
      {sub && <p className="mt-2 text-sm text-muted">{sub}</p>}
    </article>
  );
}

function Tool({ icon, name, body, href, label }: { icon: IconName; name: string; body: string; href?: string; label: string }) {
  const content: ReactNode = (
    <>
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent"><Icon name={icon} className="h-5 w-5" /></span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{name}</span>
        <span className="mt-0.5 block text-sm text-muted">{body}</span>
      </span>
      {href && <span className="flex items-center gap-1 text-sm font-medium text-accent">{label}<Icon name="arrow" className="h-4 w-4" /></span>}
    </>
  );
  const cls = "flex items-center gap-4 rounded-2xl border border-line bg-bg/40 p-4 transition hover:border-accent/50";
  return href ? <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{content}</a> : <div className={cls}>{content}</div>;
}

export function HostDashboard({ currency, properties, bookings, tasks, loading, links, onGoBookings, onGoTasks, onGoProperties }: Props) {
  const { t, locale } = useI18n();
  const today = localToday();
  const [y, m] = today.split("-").map(Number) as [number, number];

  if (properties.length === 0) {
    return (
      <EmptyState icon="building" title={t("host.needProperty")} body={t("host.needPropertyBody")}>
        <button type="button" className="inline-flex items-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-onaccent" onClick={onGoProperties}>
          {t("host.goProperties")}
        </button>
      </EmptyState>
    );
  }
  if (loading) {
    return (
      <div className="space-y-6" aria-busy="true">
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-card" />)}</div>
        <Skeleton className="h-56 rounded-card" />
      </div>
    );
  }

  const monthFrom = firstOfMonth(y, m);
  const monthTo = firstOfNextMonth(y, m);
  const occupancy = occupancyPct(bookings, properties.map((p) => p.id), monthFrom, monthTo);
  const week = upcomingArrivals(bookings, today, 7);
  const upcoming = upcomingArrivals(bookings, today, 14).slice(0, 5);
  const revenue = bookedRevenue(bookings, monthFrom, monthTo);
  const pending = tasks.filter((x) => !x.done);
  const { arrivals, departures } = movementsOn(bookings, today);
  const nameOf = (id: string) => properties.find((p) => p.id === id)?.name ?? t("properties.archived");
  const nothingToday = arrivals.length === 0 && departures.length === 0;

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Kpi hero label={t("host.occupancy")} value={`${String(occupancy).replace(".", ",")} %`} />
        <Kpi label={t("host.arrivalsWeek")} value={String(week.length)} />
        <Kpi label={t("host.monthRevenue")} value={formatMoney(revenue, currency, locale)} />
        <Kpi label={t("host.pendingTasks")} value={String(pending.length)} />
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className={`${cardClass} lg:col-span-2`}>
          <h2 className="text-sm font-medium">{t("host.today")} · {shortDate(today, locale, true)}</h2>
          {nothingToday ? (
            <p className="mt-4 text-sm text-muted">{t("host.nothingToday")}</p>
          ) : (
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              {([[t("host.arrivals"), arrivals], [t("host.departures"), departures]] as const).map(([label, list]) => (
                <div key={label}>
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent">{label} · {list.length}</p>
                  <ul className="mt-3 space-y-3">
                    {list.map((b) => (
                      <li key={b.id} className="text-sm">
                        <span className="block font-medium">{b.guestName}</span>
                        <span className="block text-muted">{nameOf(b.propertyId)} · {t("host.people", { count: b.guestsCount })}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
          <div className="mt-6 border-t border-line pt-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">{t("host.upcoming")}</h3>
              <button type="button" className="text-sm text-accent underline-offset-4 hover:underline" onClick={onGoBookings}>{t("host.viewAll")}</button>
            </div>
            {upcoming.length === 0 ? (
              <p className="mt-3 text-sm text-muted">{t("host.noUpcoming")}</p>
            ) : (
              <ul className="mt-2 divide-y divide-line">
                {upcoming.map((b) => (
                  <li key={b.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{b.guestName}</span>
                      <span className="block truncate text-muted">{nameOf(b.propertyId)}</span>
                    </span>
                    <span className="shrink-0 text-right text-muted">
                      {shortDate(b.checkIn, locale)} · {t("entries.nights", { count: b.nights })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <div className="space-y-4">
          <section className={cardClass}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium">{t("host.todo")}</h2>
              <button type="button" className="text-sm text-accent underline-offset-4 hover:underline" onClick={onGoTasks}>{t("host.viewAll")}</button>
            </div>
            {pending.length === 0 ? (
              <p className="mt-3 text-sm text-muted">{t("host.allDone")}</p>
            ) : (
              <ul className="mt-2 divide-y divide-line">
                {pending.slice(0, 5).map((task) => (
                  <li key={task.id} className="py-2.5 text-sm">
                    <span className="block truncate font-medium">{task.title}</span>
                    <span className={`block text-xs ${task.dueOn && task.dueOn < today ? "text-danger" : "text-muted"}`}>
                      {task.dueOn ? t("host.dueOn", { date: shortDate(task.dueOn, locale) }) : nameOf(task.propertyId ?? "")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={`${cardClass} space-y-3`}>
            <h2 className="text-sm font-medium">{t("host.tools")}</h2>
            <Tool icon="chart" name="Stayflow Profit" body={t("host.toolProfit")} href={links.profit} label={t("host.open")} />
            <Tool icon="qr" name="Stayflow Guest" body={t("host.toolGuest")} href={links.guest} label={t("host.open")} />
          </section>
        </div>
      </div>
    </div>
  );
}
