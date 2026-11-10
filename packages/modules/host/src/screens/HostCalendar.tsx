"use client";

import { useState } from "react";
import { useI18n } from "@stayflow/i18n";
import { EmptyState, Skeleton, cardClass, ghostButtonClass } from "@stayflow/ui";
import { daysInMonth, localToday, shiftMonth } from "../dates";
import { monthTitle, shortDate } from "../format";
import { monthSegments } from "../logic";
import type { Booking, BookingStatus } from "../types";

interface Props {
  properties: { id: string; name: string }[];
  bookings: Booking[];
  loading: boolean;
}

const BAR: Record<BookingStatus, string> = {
  confirmed: "bg-accent text-onaccent",
  checked_in: "bg-success text-bg",
  checked_out: "bg-line text-muted",
  canceled: "",
};

/** Month grid: one row per property, one column per day, stays drawn as bars. */
export function HostCalendar({ properties, bookings, loading }: Props) {
  const { t, locale } = useI18n();
  const today = localToday();
  const [ty, tm] = today.split("-").map(Number) as [number, number];
  const [cursor, setCursor] = useState({ year: ty, month: tm });

  if (properties.length === 0) return <EmptyState icon="calendar" title={t("host.calEmpty")} />;
  if (loading) return <Skeleton className="h-72 rounded-card" />;

  const days = daysInMonth(cursor.year, cursor.month);
  const title = monthTitle(cursor.year, cursor.month, locale);
  const grid = { gridTemplateColumns: `11rem repeat(${days}, minmax(1.5rem, 1fr))` } as const;
  const iso = (d: number) => `${cursor.year}-${String(cursor.month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const weekday = (d: number) => new Date(Date.UTC(cursor.year, cursor.month - 1, d)).getUTCDay();
  const nav = (delta: number) => setCursor((c) => shiftMonth(c.year, c.month, delta));
  const legend = (tone: string, label: string) => (
    <span className="flex items-center gap-1.5"><i className={`h-2.5 w-2.5 rounded-sm ${tone}`} />{label}</span>
  );

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl" aria-live="polite">{title}</h2>
        <div className="flex items-center gap-2">
          <button type="button" className={ghostButtonClass} onClick={() => nav(-1)} aria-label={t("host.calPrev")}>‹</button>
          <button type="button" className={ghostButtonClass} onClick={() => setCursor({ year: ty, month: tm })}>{t("host.calToday")}</button>
          <button type="button" className={ghostButtonClass} onClick={() => nav(1)} aria-label={t("host.calNext")}>›</button>
        </div>
      </div>

      <div className={`${cardClass} overflow-x-auto !p-0`} role="group" aria-label={t("host.calLabel", { month: title })}>
        <div style={{ minWidth: `${11 * 16 + days * 28}px` }}>
          <div className="grid border-b border-line" style={grid}>
            <div />
            {Array.from({ length: days }, (_, i) => i + 1).map((d) => {
              const isToday = iso(d) === today;
              const weekend = weekday(d) === 0 || weekday(d) === 6;
              return (
                <div key={d} className={`py-2 text-center text-xs ${isToday ? "font-semibold text-accent" : weekend ? "text-muted/60" : "text-muted"}`}>
                  <div>{d}</div>
                  <div className="text-[10px] uppercase opacity-70">{new Date(Date.UTC(2024, 0, 7 + weekday(d))).toLocaleDateString(locale, { weekday: "narrow", timeZone: "UTC" })}</div>
                </div>
              );
            })}
          </div>
          {properties.map((p) => {
            const segs = monthSegments(bookings, p.id, cursor.year, cursor.month);
            return (
              <div key={p.id} className="grid border-b border-line/60 last:border-b-0" style={grid}>
                <div className="flex items-center px-4 text-sm font-medium"><span className="truncate">{p.name}</span></div>
                {Array.from({ length: days }, (_, i) => i + 1).map((d) => {
                  const weekend = weekday(d) === 0 || weekday(d) === 6;
                  return (
                    <div
                      key={d}
                      style={{ gridColumn: d + 1, gridRow: 1 }}
                      className={`h-14 border-l border-line/40 ${iso(d) === today ? "bg-accent/10" : weekend ? "bg-bg/40" : ""}`}
                    />
                  );
                })}
                {segs.map((s) => {
                  const b = bookings.find((x) => x.id === s.bookingId);
                  return (
                    <div
                      key={s.bookingId}
                      title={b ? `${b.guestName} · ${shortDate(b.checkIn, locale)} → ${shortDate(b.checkOut, locale)}` : s.guestName}
                      style={{ gridColumn: `${s.startDay + 1} / span ${s.span}`, gridRow: 1 }}
                      className={`z-10 m-1.5 flex items-center overflow-hidden px-2.5 text-xs font-medium ${BAR[s.status]} ${s.startsBefore ? "rounded-l-none" : "rounded-l-lg"} ${s.endsAfter ? "rounded-r-none" : "rounded-r-lg"}`}
                    >
                      <span className="truncate">{s.guestName}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <p className="flex flex-wrap items-center gap-5 text-xs text-muted">
        {legend("bg-accent", t("host.calLegendConfirmed"))}
        {legend("bg-success", t("host.calLegendStay"))}
        {legend("bg-line", t("host.calLegendDone"))}
      </p>
    </section>
  );
}
