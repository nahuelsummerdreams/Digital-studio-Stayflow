"use client";

import { useState } from "react";
import { useI18n } from "@stayflow/i18n";
import { formatMoney } from "@stayflow/money";
import { Avatar, EmptyState, Icon, Pill, PropertyPhoto, Skeleton, cardClass, ghostButtonClass } from "@stayflow/ui";
import { daysInMonth, localToday, shiftMonth } from "../dates";
import { STATUS_KEY, monthTitle, shortDate } from "../format";
import { monthRange } from "../insights";
import { monthSegments, occupancyPct } from "../logic";
import type { Booking, BookingStatus, HostProperty } from "../types";

interface Props {
  currency: string;
  properties: HostProperty[];
  bookings: Booking[];
  loading: boolean;
  /** Click on a free day: start a booking there. */
  onCreateBooking: (propertyId: string, checkIn: string) => void;
  onOpenBookings: () => void;
}

const BAR: Record<BookingStatus, string> = {
  confirmed: "bg-gradient-to-r from-accent to-accent/75 text-onaccent shadow-[0_8px_20px_-8px_rgb(var(--accent)/0.8)]",
  checked_in: "bg-gradient-to-r from-success to-success/75 text-bg shadow-[0_8px_20px_-8px_rgb(var(--success)/0.8)]",
  checked_out: "bg-line/80 text-muted",
  canceled: "",
};
const TONE = { confirmed: "accent", checked_in: "success", checked_out: "muted", canceled: "danger" } as const;

const NAME_COL = 13; // rem

/** The rental schedule: one row per property, one column per day, every stay drawn as a bar. Click a free day to book it. */
export function HostCalendar({ currency, properties, bookings, loading, onCreateBooking, onOpenBookings }: Props) {
  const { t, locale } = useI18n();
  const today = localToday();
  const [ty, tm] = today.split("-").map(Number) as [number, number];
  const [cursor, setCursor] = useState({ year: ty, month: tm });
  const [openId, setOpenId] = useState<string | null>(null);

  if (properties.length === 0) return <EmptyState icon="calendar" title={t("host.calEmpty")} />;
  if (loading) return <Skeleton className="h-72 rounded-card" />;

  const days = daysInMonth(cursor.year, cursor.month);
  const title = monthTitle(cursor.year, cursor.month, locale);
  const grid = { gridTemplateColumns: `${NAME_COL}rem repeat(${days}, minmax(1.75rem, 1fr))` } as const;
  const iso = (d: number) => `${cursor.year}-${String(cursor.month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const weekday = (d: number) => new Date(Date.UTC(cursor.year, cursor.month - 1, d)).getUTCDay();
  const nav = (delta: number) => {
    setCursor((c) => shiftMonth(c.year, c.month, delta));
    setOpenId(null);
  };
  const { from, to } = monthRange(cursor.year, cursor.month);
  const todayDay = today.startsWith(`${cursor.year}-${String(cursor.month).padStart(2, "0")}`) ? Number(today.slice(8)) : null;
  const open = bookings.find((b) => b.id === openId) ?? null;
  const nameOf = (id: string) => properties.find((p) => p.id === id)?.name ?? t("properties.archived");
  const legend = (tone: string, label: string) => (
    <span className="flex items-center gap-1.5"><i className={`h-2.5 w-2.5 rounded-sm ${tone}`} />{label}</span>
  );

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-2xl" aria-live="polite">{title}</h2>
          <span className="hidden text-xs text-muted sm:inline">{t("host.calHint")}</span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className={ghostButtonClass} onClick={() => nav(-1)} aria-label={t("host.calPrev")}><Icon name="chevronLeft" className="h-4 w-4" /></button>
          <button type="button" className={ghostButtonClass} onClick={() => { setCursor({ year: ty, month: tm }); setOpenId(null); }}>{t("host.calToday")}</button>
          <button type="button" className={ghostButtonClass} onClick={() => nav(1)} aria-label={t("host.calNext")}><Icon name="chevronRight" className="h-4 w-4" /></button>
        </div>
      </div>

      <div className={`${cardClass} anim-in overflow-x-auto !p-0`} role="group" aria-label={t("host.calLabel", { month: title })}>
        <div style={{ minWidth: `${NAME_COL * 16 + days * 32}px` }}>
          <div className="grid border-b border-line bg-surface2/30" style={grid}>
            <div className="flex items-end px-4 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{t("host.property")}</div>
            {Array.from({ length: days }, (_, i) => i + 1).map((d) => {
              const isToday = d === todayDay;
              const weekend = weekday(d) === 0 || weekday(d) === 6;
              return (
                <div key={d} className={`py-2 text-center text-xs ${isToday ? "font-bold text-accent" : weekend ? "text-muted/60" : "text-muted"}`}>
                  <div className={isToday ? "mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-accent text-onaccent" : ""}>{d}</div>
                  <div className="mt-0.5 text-[10px] uppercase opacity-70">{new Date(Date.UTC(2024, 0, 7 + weekday(d))).toLocaleDateString(locale, { weekday: "narrow", timeZone: "UTC" })}</div>
                </div>
              );
            })}
          </div>
          {properties.map((p) => {
            const segs = monthSegments(bookings, p.id, cursor.year, cursor.month);
            const occ = occupancyPct(bookings, [p.id], from, to);
            return (
              <div key={p.id} className="relative grid border-b border-line/60 last:border-b-0" style={grid}>
                <div className="flex items-center gap-3 px-4 py-2">
                  <PropertyPhoto url={p.photoUrl} name={p.name} className="h-11 w-14 rounded-lg" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="text-[11px] text-muted">{t("host.occupancyOf", { pct: occ.toFixed(0) })}</p>
                  </div>
                </div>
                {Array.from({ length: days }, (_, i) => i + 1).map((d) => {
                  const weekend = weekday(d) === 0 || weekday(d) === 6;
                  const past = iso(d) < today;
                  return (
                    <button
                      key={d}
                      type="button"
                      disabled={past}
                      aria-label={t("host.bookDay", { property: p.name, date: shortDate(iso(d), locale) })}
                      onClick={() => onCreateBooking(p.id, iso(d))}
                      style={{ gridColumn: d + 1, gridRow: 1 }}
                      className={`group/cell h-[4.25rem] border-l border-line/40 transition ${d === todayDay ? "bg-accent/10" : weekend ? "bg-bg/40" : ""} ${past ? "cursor-default" : "hover:bg-accent/10"}`}
                    >
                      {!past && <Icon name="plus" className="mx-auto h-3.5 w-3.5 text-accent opacity-0 transition group-hover/cell:opacity-100" />}
                    </button>
                  );
                })}
                {segs.map((s) => {
                  const b = bookings.find((x) => x.id === s.bookingId);
                  const selected = s.bookingId === openId;
                  return (
                    <button
                      key={s.bookingId}
                      type="button"
                      onClick={() => setOpenId(selected ? null : s.bookingId)}
                      aria-pressed={selected}
                      title={b ? `${b.guestName} · ${shortDate(b.checkIn, locale)} → ${shortDate(b.checkOut, locale)}` : s.guestName}
                      style={{ gridColumn: `${s.startDay + 1} / span ${s.span}`, gridRow: 1 }}
                      className={`z-10 m-1.5 flex items-center gap-2 overflow-hidden px-2 text-left text-xs font-medium transition duration-300 hover:scale-[1.02] hover:brightness-110 ${selected ? "ring-2 ring-fg ring-offset-2 ring-offset-bg" : ""} ${BAR[s.status]} ${s.startsBefore ? "rounded-l-none" : "rounded-l-xl"} ${s.endsAfter ? "rounded-r-none" : "rounded-r-xl"}`}
                    >
                      {s.span >= 3 && <Avatar name={s.guestName} className="h-6 w-6 text-[10px] ring-1 ring-white/30" />}
                      <span className="truncate">{s.guestName}</span>
                      {s.span >= 5 && b && <span className="ml-auto shrink-0 pr-1 opacity-75">{t("entries.nights", { count: b.nights })}</span>}
                    </button>
                  );
                })}
                {todayDay !== null && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 z-20 w-px bg-accent shadow-[0_0_10px_rgb(var(--accent))]"
                    style={{ left: `calc(${NAME_COL}rem + (100% - ${NAME_COL}rem) * ${(todayDay - 0.5) / days})` }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {open && (
        <div className="fx-card fx-hero anim-in flex flex-wrap items-center gap-4 rounded-card p-5" role="region" aria-label={t("host.detail")}>
          <Avatar name={open.guestName} className="h-12 w-12 text-base" />
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-2"><span className="font-display text-xl">{open.guestName}</span><Pill tone={TONE[open.status]}>{t(STATUS_KEY[open.status])}</Pill></p>
            <p className="mt-1 text-sm text-muted">
              {nameOf(open.propertyId)} · {shortDate(open.checkIn, locale)} → {shortDate(open.checkOut, locale, true)} · {t("entries.nights", { count: open.nights })} · {t("host.people", { count: open.guestsCount })} · {t(`sources.${open.source}`)}
            </p>
          </div>
          <p className="font-display text-2xl tabular-nums">{open.amount > 0 ? formatMoney(open.amount, currency, locale) : "—"}</p>
          <button type="button" className={ghostButtonClass} onClick={onOpenBookings}>{t("host.openInBookings")}</button>
        </div>
      )}

      <p className="flex flex-wrap items-center gap-5 text-xs text-muted">
        {legend("bg-accent", t("host.calLegendConfirmed"))}
        {legend("bg-success", t("host.calLegendStay"))}
        {legend("bg-line", t("host.calLegendDone"))}
      </p>
    </section>
  );
}
