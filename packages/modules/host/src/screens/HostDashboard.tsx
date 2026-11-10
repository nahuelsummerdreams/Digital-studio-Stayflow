"use client";

import { useState, type ReactNode } from "react";
import { useI18n, type TFn } from "@stayflow/i18n";
import { formatMoney } from "@stayflow/money";
import {
  AnimatedNumber, AreaChart, Avatar, Delta, DonutChart, EmptyState, Icon, Pill, ProgressBar, PropertyPhoto, Skeleton, Sparkline, StatCard, TONE_TEXT, activeTabClass, buttonClass, cardClass, ghostButtonClass, idleTabClass,
  type IconName, type Tone,
} from "@stayflow/ui";
import { addDays, firstOfMonth, firstOfNextMonth, localToday } from "../dates";
import { shortDate } from "../format";
import { bookedRevenue, isActive, movementsOn, occupancyPct, upcomingArrivals } from "../logic";
import { changePct, hostAlerts, monthRange, monthlyOccupancy, monthlyRevenue, movementDays, propertyState, sourceBreakdown, weekOf, type HostAlert } from "../insights";
import type { Booking, HostProperty, HostTask } from "../types";

interface Props {
  currency: string;
  userName: string;
  properties: HostProperty[];
  bookings: Booking[];
  tasks: HostTask[];
  loading: boolean;
  links: { profit?: string; guest?: string };
  onGoBookings: () => void;
  onGoCalendar: () => void;
  onGoTasks: () => void;
  onGoProperties: () => void;
  onNewBooking: () => void;
}

const ALERT_TONE: Record<HostAlert["kind"], { tone: Tone; icon: IconName }> = {
  overdueTask: { tone: "danger", icon: "alert" },
  departurePending: { tone: "warning", icon: "alert" },
  arrivalPending: { tone: "warning", icon: "alert" },
  noAmount: { tone: "accent", icon: "info" },
  arrivalsToday: { tone: "success", icon: "login" },
  departuresToday: { tone: "accent", icon: "logout" },
};

/** Title and detail of an alert, shared by the dashboard and the bell. */
export function alertText(a: HostAlert, t: TFn, properties: HostProperty[]): { title: string; detail: string } {
  const prop = (id: string) => properties.find((p) => p.id === id)?.name ?? "";
  switch (a.kind) {
    case "overdueTask":
      return { title: a.task.title, detail: t("host.alertLate", { count: a.daysLate }) };
    case "departurePending":
      return { title: t("host.alertDeparturePending", { name: a.booking.guestName }), detail: prop(a.booking.propertyId) };
    case "arrivalPending":
      return { title: t("host.alertArrivalPending", { name: a.booking.guestName }), detail: prop(a.booking.propertyId) };
    case "noAmount":
      return { title: t("host.alertNoAmount", { name: a.booking.guestName }), detail: prop(a.booking.propertyId) };
    case "arrivalsToday":
      return { title: t("host.alertArrivalsToday", { count: a.count }), detail: t("host.alertRegister") };
    case "departuresToday":
      return { title: t("host.alertDeparturesToday", { count: a.count }), detail: t("host.alertCleaning") };
  }
}

function Card({ title, subtitle, action, children, className = "" }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`${cardClass} !p-5 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

const linkBtn = "inline-flex shrink-0 items-center gap-1 text-xs font-medium text-accent transition hover:opacity-80";

function Tool({ icon, name, body, href, label }: { icon: IconName; name: string; body: string; href?: string; label: string }) {
  const content = (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent transition-transform duration-300 group-hover:scale-110"><Icon name={icon} className="h-5 w-5" /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{name}</span>
        <span className="mt-0.5 block text-xs text-muted">{body}</span>
      </span>
      {href && <span className="flex items-center gap-1 text-xs font-medium text-accent">{label}<Icon name="arrow" className="h-3.5 w-3.5" /></span>}
    </>
  );
  const cls = "group flex items-center gap-3 rounded-2xl border border-line bg-bg/40 p-3.5 transition duration-300 hover:-translate-y-0.5 hover:border-accent/50 hover:bg-bg/60";
  return href ? <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{content}</a> : <div className={cls}>{content}</div>;
}

function relative(iso: string, locale: string): string {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const abs = Math.abs(diff);
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86_400) return rtf.format(Math.round(diff / 3600), "hour");
  return rtf.format(Math.round(diff / 86_400), "day");
}

export function HostDashboard({ currency, userName, properties, bookings, tasks, loading, links, onGoBookings, onGoCalendar, onGoTasks, onGoProperties, onNewBooking }: Props) {
  const { t, locale } = useI18n();
  const today = localToday();
  const [y, m] = today.split("-").map(Number) as [number, number];
  const [chartTab, setChartTab] = useState<"occupancy" | "revenue">("occupancy");
  const [weekShift, setWeekShift] = useState(0);
  const [selected, setSelected] = useState(today);

  if (properties.length === 0) {
    return (
      <EmptyState icon="building" title={t("host.needProperty")} body={t("host.needPropertyBody")}>
        <button type="button" className={buttonClass} onClick={onGoProperties}>{t("host.goProperties")}</button>
      </EmptyState>
    );
  }
  if (loading) {
    return (
      <div className="space-y-6" aria-busy="true">
        <Skeleton className="h-16 w-full max-w-md" />
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-36 rounded-card" />)}</div>
        <Skeleton className="h-72 rounded-card" />
      </div>
    );
  }

  const ids = properties.map((p) => p.id);
  const cur = monthRange(y, m);
  const prevM = m === 1 ? { y: y - 1, m: 12 } : { y, m: m - 1 };
  const prev = monthRange(prevM.y, prevM.m);
  const occupancy = occupancyPct(bookings, ids, cur.from, cur.to);
  const occupancyPrev = occupancyPct(bookings, ids, prev.from, prev.to);
  const revenue = bookedRevenue(bookings, cur.from, cur.to);
  const revenuePrev = bookedRevenue(bookings, prev.from, prev.to);
  const week = upcomingArrivals(bookings, today, 7);
  const pending = tasks.filter((x) => !x.done);
  const overdue = pending.filter((x) => x.dueOn && x.dueOn < today);
  const occSeries = monthlyOccupancy(bookings, ids, y);
  const revSeries = monthlyRevenue(bookings, y);
  const alerts = hostAlerts(bookings, tasks, today);
  const channels = sourceBreakdown(bookings, firstOfMonth(y, 1), firstOfNextMonth(y, 12));
  const channelTotal = channels.reduce((s, c) => s + c.count, 0);

  const hour = new Date().getHours();
  const greeting = hour < 6 ? t("host.greetNight") : hour < 13 ? t("host.greetMorning") : hour < 20 ? t("host.greetAfternoon") : t("host.greetNight");
  const dateLabel = new Date().toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const firstName = userName.split(/\s+/)[0] ?? userName;
  const monthShort = (i: number) => new Date(Date.UTC(y, i, 1)).toLocaleDateString(locale, { month: "short", timeZone: "UTC" }).replace(".", "");
  const labels = Array.from({ length: 12 }, (_, i) => monthShort(i));
  const pct = (n: number) => `${Math.round(n)} %`;

  const days = weekOf(selected, weekShift);
  const movementSet = movementDays(bookings);
  const dayMoves = movementsOn(bookings, selected);
  const dayList = [
    ...dayMoves.arrivals.map((b) => ({ b, kind: "in" as const })),
    ...dayMoves.departures.map((b) => ({ b, kind: "out" as const })),
  ];
  const nextMoves = upcomingArrivals(bookings, today, 21).slice(0, 4);
  const nameOf = (id: string) => properties.find((p) => p.id === id)?.name ?? t("properties.archived");
  const summary = [t("host.sumArrivals", { count: week.length }), t("host.sumTasks", { count: pending.length })].join(" · ");
  const recent = [...bookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);
  const statusTone = (b: Booking): { tone: Tone; label: string } =>
    b.status === "checked_in" ? { tone: "success", label: t("host.statusCheckedIn") } : b.status === "confirmed" ? { tone: "accent", label: t("host.statusConfirmed") } : b.status === "canceled" ? { tone: "danger", label: t("host.statusCanceled") } : { tone: "muted", label: t("host.statusCheckedOut") };

  return (
    <div className="anim-stagger space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">{dateLabel}</p>
          <h1 className="font-display mt-1.5 text-3xl sm:text-[2.1rem]">{greeting}, <span className="text-gradient">{firstName}</span></h1>
          <p className="mt-1.5 text-sm text-muted">{summary}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" className={`${ghostButtonClass} gap-2`} onClick={onGoCalendar}><Icon name="calendar" className="h-4 w-4" />{t("host.viewSchedule")}</button>
          <button type="button" className={`${buttonClass} gap-2`} onClick={onNewBooking}><Icon name="plus" className="h-4 w-4" />{t("host.newBookingShort")}</button>
        </div>
      </header>

      <section aria-label={t("host.kpis")} className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard hero label={t("host.occupancy")} icon="dashboard" sub={t("host.occupancySub", { count: properties.length })}>
          <AnimatedNumber value={occupancy} format={(n) => `${n.toFixed(1).replace(".", ",")} %`} />
          <Delta pct={changePct(occupancy, occupancyPrev)} suffix={t("host.vsLastMonth")} />
        </StatCard>
        <StatCard label={t("host.monthRevenue")} icon="wallet" sub={<Sparkline values={revSeries} className="h-8 w-full" />}>
          <AnimatedNumber value={revenue} format={(n) => formatMoney(n, currency, locale)} />
          <Delta pct={changePct(revenue, revenuePrev)} suffix={t("host.vsLastMonth")} />
        </StatCard>
        <StatCard label={t("host.arrivalsWeek")} icon="key" sub={week[0] ? t("host.nextArrival", { name: week[0].guestName, date: shortDate(week[0].checkIn, locale) }) : t("host.noArrivals")}>
          <AnimatedNumber value={week.length} format={(n) => String(Math.round(n))} />
        </StatCard>
        <StatCard label={t("host.pendingTasks")} icon="tasks" sub={overdue.length > 0 ? <span className="text-danger">{t("host.overdue", { count: overdue.length })}</span> : t("host.allOnTime")}>
          <AnimatedNumber value={pending.length} format={(n) => String(Math.round(n))} />
        </StatCard>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_21.5rem]">
        <div className="min-w-0 space-y-6">
          <div className="grid gap-6 2xl:grid-cols-5">
            <Card
              className="2xl:col-span-3"
              title={chartTab === "occupancy" ? t("host.chartOccupancy") : t("host.chartRevenue")}
              subtitle={t("host.chartYear", { year: y })}
              action={
                <div role="group" aria-label={t("host.chartTitle")} className="flex gap-1 rounded-lg border border-line bg-bg/40 p-0.5">
                  {(["occupancy", "revenue"] as const).map((k) => (
                    <button key={k} type="button" aria-pressed={chartTab === k} onClick={() => setChartTab(k)} className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${chartTab === k ? activeTabClass : idleTabClass}`}>
                      {k === "occupancy" ? t("host.tabOccupancy") : t("host.tabRevenue")}
                    </button>
                  ))}
                </div>
              }
            >
              <AreaChart
                key={chartTab}
                labels={labels}
                series={[{ name: chartTab === "occupancy" ? t("host.tabOccupancy") : t("host.tabRevenue"), values: chartTab === "occupancy" ? occSeries : revSeries }]}
                format={chartTab === "occupancy" ? pct : (n) => formatMoney(n, currency, locale)}
                describe={t("host.chartDescribe", { year: y })}
              />
            </Card>
            <Card className="2xl:col-span-2" title={t("host.channels")} subtitle={t("host.channelsSub", { year: y })}>
              {channelTotal === 0 ? (
                <p className="py-8 text-center text-sm text-muted">{t("host.noChannels")}</p>
              ) : (
                <DonutChart
                  slices={channels.map((c) => ({ label: t(`sources.${c.source}`), value: c.count }))}
                  format={(n) => String(n)}
                  describe={t("host.channels")}
                  center={<><span className="font-display text-3xl tabular-nums">{channelTotal}</span><span className="text-[11px] text-muted">{t("host.bookingsWord", { count: channelTotal })}</span></>}
                />
              )}
            </Card>
          </div>

          <Card
            title={t("host.propertiesTitle")}
            subtitle={t("host.propertiesSub", { count: properties.length })}
            action={<button type="button" className={linkBtn} onClick={onGoProperties}>{t("host.managePhotos")} <Icon name="arrow" className="h-3.5 w-3.5" /></button>}
          >
            <ul className="space-y-3">
              {properties.map((p) => {
                const occ = occupancyPct(bookings, [p.id], cur.from, cur.to);
                const rev = bookedRevenue(bookings.filter((b) => b.propertyId === p.id), cur.from, cur.to);
                const st = propertyState(bookings, p.id, today);
                const pill =
                  st.kind === "occupied" ? <Pill tone="success">{t("host.stateOccupied")}</Pill> : st.kind === "arriving" ? <Pill tone="warning">{t("host.stateArriving")}</Pill> : <Pill tone="muted">{t("host.stateFree")}</Pill>;
                const detail =
                  st.kind === "occupied"
                    ? t("host.stayUntil", { name: st.booking.guestName, date: shortDate(st.booking.checkOut, locale) })
                    : st.kind === "arriving"
                      ? t("host.arrivesOn", { name: st.booking.guestName, date: shortDate(st.booking.checkIn, locale) })
                      : st.next
                        ? t("host.nextOn", { date: shortDate(st.next.checkIn, locale) })
                        : t("host.noNext");
                return (
                  <li key={p.id} className="group flex flex-col gap-4 rounded-2xl border border-line/70 bg-bg/30 p-3 transition duration-300 hover:border-accent/40 hover:bg-bg/50 sm:flex-row sm:items-center">
                    <div className="relative shrink-0 overflow-hidden rounded-xl">
                      <PropertyPhoto url={p.photoUrl} name={p.name} className="h-40 w-full rounded-xl transition duration-700 group-hover:scale-105 sm:h-32 sm:w-52" />
                      {!p.photoUrl && (
                        <button type="button" onClick={onGoProperties} className="absolute inset-x-2 bottom-2 flex items-center justify-center gap-1.5 rounded-lg bg-black/55 px-2 py-1.5 text-[11px] font-medium text-white backdrop-blur transition hover:bg-black/75">
                          <Icon name="camera" className="h-3.5 w-3.5" />{t("properties.addPhoto")}
                        </button>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-display truncate text-lg">{p.name}</p>
                        {pill}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted">{p.city ? `${p.city} · ` : ""}{detail}</p>
                      <div className="mt-3 flex items-center gap-3">
                        <span className="w-24 shrink-0 text-xs text-muted">{t("host.occupancyOf", { pct: occ.toFixed(0) })}</span>
                        <ProgressBar value={occ} label={t("host.occupancy")} />
                      </div>
                    </div>
                    <div className="flex shrink-0 items-baseline justify-between gap-2 sm:block sm:text-right">
                      <p className="text-xs text-muted">{t("host.monthRevenue")}</p>
                      <p className="font-display text-xl tabular-nums">{formatMoney(rev, currency, locale)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card
            title={t("host.activity")}
            subtitle={t("host.activitySub")}
            action={<button type="button" className={linkBtn} onClick={onGoBookings}>{t("host.viewAll")} <Icon name="arrow" className="h-3.5 w-3.5" /></button>}
          >
            {recent.length === 0 ? (
              <p className="text-sm text-muted">{t("host.noActivity")}</p>
            ) : (
              <ul className="divide-y divide-line/70">
                {recent.map((b) => {
                  const s = statusTone(b);
                  return (
                    <li key={b.id} className="flex items-center gap-3 py-3">
                      <Avatar name={b.guestName} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm"><span className="font-semibold">{b.guestName}</span> <span className="text-muted">{t("host.bookedAt")}</span> <span className="font-semibold">{nameOf(b.propertyId)}</span></p>
                        <p className="truncate text-xs text-muted">{shortDate(b.checkIn, locale)} → {shortDate(b.checkOut, locale)} · {relative(b.createdAt, locale)}</p>
                      </div>
                      <Pill tone={s.tone}>{s.label}</Pill>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        <aside className="min-w-0 space-y-6">
          <Card
            title={t("host.agenda")}
            subtitle={new Date(`${selected}T00:00:00Z`).toLocaleDateString(locale, { month: "long", year: "numeric", timeZone: "UTC" })}
            action={
              <div className="flex items-center gap-1">
                <button type="button" aria-label={t("host.calPrev")} className="flex h-7 w-7 items-center justify-center rounded-lg border border-line text-muted transition hover:text-fg" onClick={() => setWeekShift((w) => w - 1)}><Icon name="chevronLeft" className="h-4 w-4" /></button>
                <button type="button" aria-label={t("host.calNext")} className="flex h-7 w-7 items-center justify-center rounded-lg border border-line text-muted transition hover:text-fg" onClick={() => setWeekShift((w) => w + 1)}><Icon name="chevronRight" className="h-4 w-4" /></button>
              </div>
            }
          >
            <div className="grid grid-cols-7 gap-1.5 text-center" role="group" aria-label={t("host.agenda")}>
              {days.map((d) => {
                const active = d === selected;
                const isToday = d === today;
                return (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelected(d)}
                    className={`relative rounded-xl border py-2 transition ${active ? "border-accent bg-accent text-onaccent shadow-[0_8px_20px_-8px_rgb(var(--accent)/0.9)]" : isToday ? "border-accent/50 text-accent" : "border-transparent text-muted hover:border-line hover:text-fg"}`}
                  >
                    <span className="block text-[10px] uppercase">{new Date(`${d}T00:00:00Z`).toLocaleDateString(locale, { weekday: "short", timeZone: "UTC" }).replace(".", "").slice(0, 3)}</span>
                    <span className="block text-sm font-semibold tabular-nums">{Number(d.slice(8))}</span>
                    {movementSet.has(d) && <i aria-hidden className={`absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${active ? "bg-onaccent" : "bg-accent"}`} />}
                  </button>
                );
              })}
            </div>
            <p className="mb-2 mt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              {selected === today ? t("host.today") : shortDate(selected, locale)} · {t("host.movements", { count: dayList.length })}
            </p>
            {dayList.length === 0 ? (
              <p className="text-sm text-muted">{t("host.nothingToday")}</p>
            ) : (
              <ul className="space-y-2">
                {dayList.map(({ b, kind }) => (
                  <li key={`${b.id}-${kind}`} className={`rounded-xl border-l-[3px] bg-bg/40 py-2 pl-3 pr-2 ${kind === "in" ? "border-l-accent" : "border-l-amber-300"}`}>
                    <p className="flex items-center justify-between gap-2 text-sm font-medium"><span className="truncate">{b.guestName}</span><span className={`shrink-0 text-[11px] ${kind === "in" ? "text-accent" : "text-amber-300"}`}>{kind === "in" ? t("host.arrivals") : t("host.departures")}</span></p>
                    <p className="truncate text-xs text-muted">{nameOf(b.propertyId)} · {t("host.people", { count: b.guestsCount })}</p>
                  </li>
                ))}
              </ul>
            )}
            {nextMoves.length > 0 && (
              <>
                <p className="mb-2 mt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{t("host.upcoming")}</p>
                <ul className="divide-y divide-line/60">
                  {nextMoves.map((b) => (
                    <li key={b.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                      <span className="min-w-0 truncate">{b.guestName}</span>
                      <span className="shrink-0 text-xs text-muted">{shortDate(b.checkIn, locale)} · {t("entries.nights", { count: b.nights })}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Card>

          <Card title={t("host.alerts")} subtitle={t("host.alertsSub", { count: alerts.length })} action={alerts.length > 0 ? <button type="button" className={linkBtn} onClick={onGoCalendar}>{t("host.review")}</button> : undefined}>
            {alerts.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-muted"><Icon name="check" className="h-4 w-4 text-success" />{t("host.noAlerts")}</p>
            ) : (
              <ul className="space-y-3">
                {alerts.slice(0, 5).map((a) => {
                  const { tone, icon } = ALERT_TONE[a.kind];
                  const txt = alertText(a, t, properties);
                  return (
                    <li key={a.id} className="flex items-start gap-3">
                      <span className={`mt-0.5 ${TONE_TEXT[tone]}`}><Icon name={icon} className="h-[18px] w-[18px]" /></span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{txt.title}</span>
                        <span className={`block truncate text-xs ${TONE_TEXT[tone]}`}>{txt.detail}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card title={t("host.todo")} action={<button type="button" className={linkBtn} onClick={onGoTasks}>{t("host.viewAll")}</button>}>
            {pending.length === 0 ? (
              <p className="text-sm text-muted">{t("host.allDone")}</p>
            ) : (
              <ul className="space-y-2.5">
                {pending.slice(0, 4).map((task) => (
                  <li key={task.id} className="flex items-start gap-3 text-sm">
                    <span aria-hidden className="mt-0.5 h-4 w-4 shrink-0 rounded border border-line" />
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{task.title}</span>
                      <span className={`block text-xs ${task.dueOn && task.dueOn < today ? "text-danger" : "text-muted"}`}>
                        {task.dueOn ? t("host.dueOn", { date: shortDate(task.dueOn, locale) }) : task.propertyId ? nameOf(task.propertyId) : t("host.noDate")}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title={t("host.tools")}>
            <div className="space-y-3">
              <Tool icon="chart" name="Stayflow Profit" body={t("host.toolProfit")} href={links.profit} label={t("host.open")} />
              <Tool icon="qr" name="Stayflow Guest" body={t("host.toolGuest")} href={links.guest} label={t("host.open")} />
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
