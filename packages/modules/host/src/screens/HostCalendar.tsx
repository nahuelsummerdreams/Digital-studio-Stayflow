"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { errorKey, useI18n } from "@stayflow/i18n";
import { formatMoney } from "@stayflow/money";
import { Avatar, EmptyState, Icon, Pill, PropertyPhoto, Skeleton, buttonClass, cardClass, errorClass, ghostButtonClass, inputClass, labelClass } from "@stayflow/ui";
import { addBlock, removeBooking } from "../data";
import { addDays, daysInMonth, localToday, shiftMonth } from "../dates";
import { STATUS_KEY, monthTitle, shortDate } from "../format";
import { monthRange } from "../insights";
import { isActive, monthHalfSegments, nightsWithin, occupancyPct, owed, paymentState, turnoverDays } from "../logic";
import type { Booking, BookingStatus, HostProperty } from "../types";

interface Props {
  client: SupabaseClient;
  orgId: string;
  currency: string;
  properties: HostProperty[];
  bookings: Booking[];
  /** Dates held for maintenance or own use. */
  blocks: Booking[];
  loading: boolean;
  /** Start a booking on this day (the guest arrives after noon). */
  onCreateBooking: (propertyId: string, checkIn: string) => void;
  onOpenBookings: () => void;
  /** Called after a block is added or removed so the shared data reloads. */
  onChanged: () => Promise<void>;
}

const BAR: Record<BookingStatus, string> = {
  inquiry: "",
  pending: "bg-gradient-to-r from-amber-400/80 to-amber-400/50 text-bg",
  confirmed: "bg-gradient-to-r from-accent to-accent/70 text-onaccent shadow-[0_10px_24px_-10px_rgb(var(--accent)/0.9)]",
  checked_in: "bg-gradient-to-r from-success to-success/70 text-bg shadow-[0_10px_24px_-10px_rgb(var(--success)/0.9)]",
  checked_out: "bg-line/80 text-muted",
  canceled: "",
};
const TONE = { inquiry: "muted", pending: "warning", confirmed: "accent", checked_in: "success", checked_out: "muted", canceled: "danger" } as const;
const HATCH: CSSProperties = { backgroundImage: "repeating-linear-gradient(135deg, rgb(var(--muted) / 0.3) 0 6px, rgb(var(--surface-2)) 6px 12px)" };
const NAME_COL = 13.5; // rem
const DAY_MIN = 2.1; // rem per day (two half-day squares)
const SLANT = 7; // px: the diagonal that makes check-out and the next check-in meet like two puzzle pieces

/** Parallelogram edges: a bar that really starts/ends inside the month is cut on the diagonal, the rest stay flat. */
function barShape(startsBefore: boolean, endsAfter: boolean): CSSProperties {
  const tl = startsBefore ? "0px" : `${SLANT}px`;
  const br = endsAfter ? "100%" : `calc(100% - ${SLANT}px)`;
  return { clipPath: `polygon(${tl} 0, 100% 0, ${br} 100%, 0 100%)` };
}

/**
 * The rental schedule. One row per property, the whole month at once, and two squares per day:
 * guests check in on the second square (after noon) and leave on the first (before noon), so the same day can
 * close one stay and open the next. Tap a free square to book it or to block the dates.
 */
export function HostCalendar({ client, orgId, currency, properties, bookings, blocks, loading, onCreateBooking, onOpenBookings, onChanged }: Props) {
  const { t, locale } = useI18n();
  const today = localToday();
  const [ty, tm] = today.split("-").map(Number) as [number, number];
  const [cursor, setCursor] = useState({ year: ty, month: tm });
  const [openId, setOpenId] = useState<string | null>(null);
  const [picked, setPicked] = useState<{ propertyId: string; day: string } | null>(null);
  const [blocking, setBlocking] = useState<{ propertyId: string; from: string; to: string; reason: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (properties.length === 0) return <EmptyState icon="calendar" title={t("host.calEmpty")} />;
  if (loading) return <Skeleton className="h-72 rounded-card" />;

  const days = daysInMonth(cursor.year, cursor.month);
  const title = monthTitle(cursor.year, cursor.month, locale);
  const mm = String(cursor.month).padStart(2, "0");
  const iso = (d: number) => `${cursor.year}-${mm}-${String(d).padStart(2, "0")}`;
  const weekday = (d: number) => new Date(Date.UTC(cursor.year, cursor.month - 1, d)).getUTCDay();
  const { from, to } = monthRange(cursor.year, cursor.month);
  const todayDay = today.startsWith(`${cursor.year}-${mm}`) ? Number(today.slice(8)) : null;
  const all = [...bookings, ...blocks];
  const open = all.find((b) => b.id === openId) ?? null;
  const nameOf = (id: string) => properties.find((p) => p.id === id)?.name ?? t("properties.archived");
  const reset = () => {
    setOpenId(null);
    setPicked(null);
    setBlocking(null);
    setError(null);
  };
  const nav = (delta: number) => {
    setCursor((c) => shiftMonth(c.year, c.month, delta));
    reset();
  };

  // Month summary across every property (stays only: blocks never count as occupancy).
  const ids = properties.map((p) => p.id);
  const monthStays = bookings.filter((b) => isActive(b) && ids.includes(b.propertyId));
  const nights = monthStays.reduce((s, b) => s + nightsWithin(b, from, to), 0);
  const arrivals = monthStays.filter((b) => b.checkIn >= from && b.checkIn < to).length;
  const departures = monthStays.filter((b) => b.checkOut >= from && b.checkOut < to).length;
  const blockedNights = blocks.filter((b) => isActive(b) && ids.includes(b.propertyId)).reduce((s, b) => s + nightsWithin(b, from, to), 0);
  const summary: { label: string; value: string; icon: "chart" | "bed" | "key" | "lock" }[] = [
    { label: t("hx.calOccupancy"), value: `${occupancyPct(bookings, ids, from, to).toFixed(0)}%`, icon: "chart" },
    { label: t("hx.calNights"), value: String(nights), icon: "bed" },
    { label: t("hx.calArrivals"), value: `${arrivals} → ${departures}`, icon: "key" },
    { label: t("hx.calBlockedNights"), value: String(blockedNights), icon: "lock" },
  ];

  const grid = { gridTemplateColumns: `${NAME_COL}rem repeat(${days * 2}, minmax(${DAY_MIN / 2}rem, 1fr))` } as const;
  const legend = (cls: string, label: string, style?: CSSProperties) => (
    <span className="flex items-center gap-1.5"><i className={`h-2.5 w-4 rounded-sm ${cls}`} style={style} />{label}</span>
  );

  async function saveBlock(e: FormEvent) {
    e.preventDefault();
    if (!blocking) return;
    setError(null);
    if (!blocking.from || !blocking.to || blocking.to <= blocking.from) return setError(t("hx.blockErrDates"));
    if (all.some((b) => isActive(b) && b.propertyId === blocking.propertyId && b.checkIn < blocking.to && blocking.from < b.checkOut)) return setError(t("hx.blockErrOverlap"));
    setBusy(true);
    try {
      await addBlock(client, orgId, { propertyId: blocking.propertyId, reason: blocking.reason, checkIn: blocking.from, checkOut: blocking.to });
      reset();
      await onChanged();
    } catch (err) {
      setError(t(errorKey(err)));
    } finally {
      setBusy(false);
    }
  }

  async function dropBlock(b: Booking) {
    if (!window.confirm(t("hx.blockRemoveConfirm"))) return;
    try {
      await removeBooking(client, b.id);
      reset();
      await onChanged();
    } catch (err) {
      setError(t(errorKey(err)));
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-3xl" aria-live="polite">{title}</h2>
          <span className="hidden text-xs text-muted lg:inline">{t("host.calHint")}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={ghostButtonClass} onClick={() => { setPicked(null); setBlocking({ propertyId: properties[0]!.id, from: today, to: addDays(today, 2), reason: "" }); }}>
            <Icon name="lock" className="mr-1.5 inline h-4 w-4" />{t("hx.blockTitle")}
          </button>
          <button type="button" className={ghostButtonClass} onClick={() => nav(-1)} aria-label={t("host.calPrev")}><Icon name="chevronLeft" className="h-4 w-4" /></button>
          <button type="button" className={ghostButtonClass} onClick={() => { setCursor({ year: ty, month: tm }); reset(); }}>{t("host.calToday")}</button>
          <button type="button" className={ghostButtonClass} onClick={() => nav(1)} aria-label={t("host.calNext")}><Icon name="chevronRight" className="h-4 w-4" /></button>
        </div>
      </div>

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summary.map((s) => (
          <li key={s.label} className={`${cardClass} flex items-center gap-3 !p-4`}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/12 text-accent"><Icon name={s.icon} className="h-5 w-5" /></span>
            <span className="min-w-0"><span className="font-display block text-xl tabular-nums">{s.value}</span><span className="block truncate text-xs text-muted">{s.label}</span></span>
          </li>
        ))}
      </ul>

      <div className={`${cardClass} anim-in overflow-x-auto !p-0`} role="group" aria-label={t("host.calLabel", { month: title })}>
        <div style={{ minWidth: `${NAME_COL * 16 + days * DAY_MIN * 16}px` }}>
          <div className="grid border-b border-line bg-surface2/30" style={grid}>
            <div className="sticky left-0 z-30 flex items-end bg-surface2 px-4 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{t("host.property")}</div>
            {Array.from({ length: days }, (_, i) => i + 1).map((d) => {
              const isToday = d === todayDay;
              const weekend = weekday(d) === 0 || weekday(d) === 6;
              return (
                <div key={d} style={{ gridColumn: `span 2` }} className={`py-2 text-center text-xs ${isToday ? "font-bold text-accent" : weekend ? "text-muted/60" : "text-muted"}`}>
                  <div className={isToday ? "mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-accent text-onaccent" : ""}>{d}</div>
                  <div className="mt-0.5 text-[10px] uppercase opacity-70">{new Date(Date.UTC(2024, 0, 7 + weekday(d))).toLocaleDateString(locale, { weekday: "narrow", timeZone: "UTC" })}</div>
                </div>
              );
            })}
          </div>

          {properties.map((p) => {
            const segs = monthHalfSegments(all, p.id, cursor.year, cursor.month);
            const occ = occupancyPct(bookings, [p.id], from, to);
            const turns = new Set(turnoverDays(bookings, p.id, from, to));
            return (
              <div key={p.id} className="relative grid border-b border-line/60 last:border-b-0" style={grid}>
                <div className="sticky left-0 z-30 flex items-center gap-3 bg-surface px-4 py-2">
                  <PropertyPhoto url={p.photoUrl} name={p.name} className="h-11 w-14 shrink-0 rounded-lg" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-line"><span className="block h-full rounded-full bg-gradient-to-r from-accent to-success" style={{ width: `${Math.min(100, occ)}%` }} /></span>
                      <span className="text-[11px] tabular-nums text-muted">{occ.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>

                {Array.from({ length: days * 2 }, (_, h) => h).map((h) => {
                  const d = Math.floor(h / 2) + 1;
                  const second = h % 2 === 1;
                  const date = iso(d);
                  const weekend = weekday(d) === 0 || weekday(d) === 6;
                  // The first half of a day can only be free if no stay ends here; either way a new stay always starts on the second half.
                  const past = date < today;
                  const selected = picked?.propertyId === p.id && picked.day === date;
                  return (
                    <button
                      key={h}
                      type="button"
                      disabled={past}
                      title={second ? t("hx.calCheckInHalf") : t("hx.calCheckOutHalf")}
                      aria-label={t("hx.calFree", { property: p.name, date: shortDate(date, locale) })}
                      onClick={() => { setOpenId(null); setBlocking(null); setPicked({ propertyId: p.id, day: date }); }}
                      style={{ gridColumn: h + 2, gridRow: 1 }}
                      className={`group/cell h-[4.5rem] transition ${second ? "border-r border-line/70" : "border-l border-line/70 border-r border-dashed border-r-line/40"} ${d === todayDay ? (second ? "bg-accent/10" : "bg-accent/15") : weekend ? (second ? "bg-bg/40" : "bg-bg/60") : second ? "" : "bg-line/20"} ${selected ? "!bg-accent/25" : ""} ${past ? "cursor-default" : "hover:bg-accent/15"}`}
                    >
                      {!past && <Icon name="plus" className="mx-auto h-3 w-3 text-accent opacity-0 transition group-hover/cell:opacity-100" />}
                    </button>
                  );
                })}

                {segs.map((s) => {
                  const b = all.find((x) => x.id === s.bookingId);
                  const selected = s.bookingId === openId;
                  const isBlock = s.kind === "block";
                  const wide = s.spanHalves >= 6;
                  return (
                    <button
                      key={s.bookingId}
                      type="button"
                      onClick={() => { setPicked(null); setBlocking(null); setOpenId(selected ? null : s.bookingId); }}
                      aria-pressed={selected}
                      title={b ? `${b.guestName} · ${shortDate(b.checkIn, locale)} → ${shortDate(b.checkOut, locale)}` : s.label}
                      style={{ gridColumn: `${s.startHalf + 2} / span ${s.spanHalves}`, gridRow: 1, ...barShape(s.startsBefore, s.endsAfter), ...(isBlock ? HATCH : {}) }}
                      className={`z-10 my-2 flex items-center gap-2 overflow-hidden text-left text-xs font-medium transition duration-300 hover:brightness-110 ${s.startsBefore ? "pl-2" : "pl-4"} ${s.endsAfter ? "pr-2" : "pr-4"} ${isBlock ? "text-muted" : BAR[s.status]} ${selected ? "brightness-125 saturate-150" : ""}`}
                    >
                      {isBlock ? <Icon name="lock" className="h-3.5 w-3.5 shrink-0" /> : wide && <Avatar name={s.label} className="h-6 w-6 shrink-0 text-[10px] ring-1 ring-white/30" />}
                      <span className="truncate">{s.label}</span>
                      {!isBlock && s.spanHalves >= 10 && b && <span className="ml-auto shrink-0 opacity-75">{t("entries.nights", { count: b.nights })}</span>}
                    </button>
                  );
                })}

                {todayDay !== null && (
                  <span aria-hidden className="pointer-events-none absolute inset-y-0 z-20 w-px bg-accent shadow-[0_0_10px_rgb(var(--accent))]" style={{ left: `calc(${NAME_COL}rem + (100% - ${NAME_COL}rem) * ${(todayDay - 0.5) / days})` }} />
                )}
                {[...turns].map((date) => (
                  <span key={date} aria-label={t("hx.calTurnover")} title={t("hx.calTurnover")} className="pointer-events-none absolute bottom-0.5 z-20 -translate-x-1/2 text-[10px] text-amber-300" style={{ left: `calc(${NAME_COL}rem + (100% - ${NAME_COL}rem) * ${(Number(date.slice(8)) - 0.5) / days})` }}>⇄</span>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {picked && !blocking && (
        <div className="fx-card anim-in flex flex-wrap items-center gap-3 rounded-card p-4" role="region" aria-label={t("hx.calPickTitle", { property: nameOf(picked.propertyId), date: shortDate(picked.day, locale) })}>
          <p className="font-display mr-auto text-lg">{t("hx.calPickTitle", { property: nameOf(picked.propertyId), date: shortDate(picked.day, locale) })}</p>
          <button type="button" className={buttonClass} onClick={() => onCreateBooking(picked.propertyId, picked.day)}>{t("hx.calPickBook")}</button>
          <button type="button" className={ghostButtonClass} onClick={() => setBlocking({ propertyId: picked.propertyId, from: picked.day, to: addDays(picked.day, 2), reason: "" })}>{t("hx.calPickBlock")}</button>
        </div>
      )}

      {blocking && (
        <form onSubmit={saveBlock} className={`${cardClass} anim-in grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1.4fr_auto] lg:items-end`}>
          <label className={labelClass}>
            {t("host.property")}
            <select className={inputClass} value={blocking.propertyId} onChange={(e) => setBlocking({ ...blocking, propertyId: e.target.value })}>
              {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label className={labelClass}>{t("hx.blockFrom")}<input className={inputClass} type="date" value={blocking.from} onChange={(e) => setBlocking({ ...blocking, from: e.target.value, to: blocking.to <= e.target.value ? addDays(e.target.value, 1) : blocking.to })} required /></label>
          <label className={labelClass}>{t("hx.blockTo")}<input className={inputClass} type="date" value={blocking.to} min={addDays(blocking.from, 1)} onChange={(e) => setBlocking({ ...blocking, to: e.target.value })} required /></label>
          <label className={labelClass}>{t("hx.blockReason")}<input className={inputClass} value={blocking.reason} maxLength={100} placeholder={t("hx.blockReasonPh")} onChange={(e) => setBlocking({ ...blocking, reason: e.target.value })} /></label>
          <div className="flex gap-2">
            <button className={buttonClass} disabled={busy}>{t("hx.blockSave")}</button>
            <button type="button" className={ghostButtonClass} onClick={reset}>{t("host.cancel")}</button>
          </div>
          <p className="text-xs text-muted sm:col-span-2 lg:col-span-5">{t("hx.blockHint")}</p>
          {error && <p role="alert" className={`${errorClass} sm:col-span-2 lg:col-span-5`}>{error}</p>}
        </form>
      )}

      {open && open.kind === "stay" && (
        <div className="fx-card fx-hero anim-in flex flex-wrap items-center gap-4 rounded-card p-5" role="region" aria-label={t("host.detail")}>
          <Avatar name={open.guestName} className="h-12 w-12 text-base" />
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-2"><span className="font-display text-xl">{open.guestName}</span><Pill tone={TONE[open.status]}>{t(STATUS_KEY[open.status])}</Pill>{open.externalUid && <Pill tone="muted">{t("hx.calLegendImported")}</Pill>}</p>
            <p className="mt-1 text-sm text-muted">
              {nameOf(open.propertyId)} · {shortDate(open.checkIn, locale)} → {shortDate(open.checkOut, locale, true)} · {t("entries.nights", { count: open.nights })} · {t("host.people", { count: open.guestsCount })} · {t(`sources.${open.source}`)}
            </p>
          </div>
          <div className="text-right">
            <p className="font-display text-2xl tabular-nums">{open.amount > 0 ? formatMoney(open.amount, currency, locale) : "—"}</p>
            <p className="text-xs text-muted">{(() => {
              const st = paymentState(open);
              return st === "unpriced" ? t("hx.payUnpriced") : st === "unpaid" ? t("hx.payUnpaid") : st === "paid" ? t("hx.payPaid") : t("hx.payPartial", { paid: formatMoney(open.paid, currency, locale), owed: formatMoney(owed(open), currency, locale) });
            })()}</p>
          </div>
          <button type="button" className={ghostButtonClass} onClick={onOpenBookings}>{t("host.openInBookings")}</button>
        </div>
      )}
      {open && open.kind === "block" && (
        <div className="fx-card anim-in flex flex-wrap items-center gap-4 rounded-card p-5" role="region" aria-label={t("hx.blockLabel")}>
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-line text-muted"><Icon name="lock" className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-xl">{open.guestName}</p>
            <p className="mt-1 text-sm text-muted">{nameOf(open.propertyId)} · {shortDate(open.checkIn, locale)} → {shortDate(open.checkOut, locale, true)} · {t("entries.nights", { count: open.nights })}</p>
          </div>
          <button type="button" className={ghostButtonClass} onClick={() => dropBlock(open)}>{t("hx.blockRemove")}</button>
          {error && <p role="alert" className={errorClass}>{error}</p>}
        </div>
      )}

      <p className="flex flex-wrap items-center gap-5 text-xs text-muted">
        {legend("bg-accent", t("host.calLegendConfirmed"))}
        {legend("bg-success", t("host.calLegendStay"))}
        {legend("bg-line", t("host.calLegendDone"))}
        {legend("", t("hx.calLegendBlocked"), HATCH)}
        <span className="flex items-center gap-1.5 text-amber-300">⇄ <span className="text-muted">{t("hx.calTurnover")}</span></span>
        <span className="text-muted">{t("hx.calCheckInHalf")} · {t("hx.calCheckOutHalf")}</span>
      </p>
    </section>
  );
}
