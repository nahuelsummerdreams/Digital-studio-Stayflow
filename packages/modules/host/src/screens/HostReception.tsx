"use client";

import { useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { errorKey, useI18n } from "@stayflow/i18n";
import { formatMoney } from "@stayflow/money";
import { cardClass, errorClass, ghostButtonClass } from "@stayflow/ui";
import { setBookingStatus } from "../data";
import { firstOfMonth, firstOfNextMonth, localToday } from "../dates";
import { occupancyPct } from "../logic";
import { averageDailyRate, bookableIds, receptionDay } from "../lodging";
import type { Booking, BookingStatus, HostProperty, LodgingType } from "../types";

interface Props {
  client: SupabaseClient;
  currency: string;
  type: LodgingType;
  /** The whole tree (establishments, rooms, beds). */
  allProperties: HostProperty[];
  /** Reservable units with readable names ("Hotel Sol · Hab 101"). */
  units: HostProperty[];
  bookings: Booking[];
  onChanged: () => Promise<void>;
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-bg/40 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="font-display mt-1 text-3xl">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </div>
  );
}

/** Front desk for hotels and hostels: who arrives, who leaves, who is in the house and how full it is. */
export function HostReception({ client, currency, type, allProperties, units, bookings, onChanged }: Props) {
  const { t, locale } = useI18n();
  const today = localToday();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const day = receptionDay(bookings, allProperties, type, today);
  const unitName = (id: string) => units.find((u) => u.id === id)?.name ?? "—";
  const unitWord = type === "hostel" ? t("reception.beds") : t("reception.rooms");

  const [y, m] = today.split("-").map(Number) as [number, number];
  const from = firstOfMonth(y, m);
  const to = firstOfNextMonth(y, m);
  const ids = bookableIds(allProperties, type);
  const stays = bookings.filter((b) => b.kind === "stay");
  const monthOcc = occupancyPct(stays, ids, from, to);
  const adr = averageDailyRate(bookings, allProperties, type, from, to);

  async function move(b: Booking, status: BookingStatus) {
    setBusy(b.id);
    setError(null);
    try {
      await setBookingStatus(client, b.id, status);
      await onChanged();
    } catch (err) {
      setError(t(errorKey(err)));
    } finally {
      setBusy(null);
    }
  }

  const row = (b: Booking, action?: { label: string; status: BookingStatus }) => (
    <li key={b.id} className="flex items-center justify-between gap-3 border-t border-line py-2.5 first:border-t-0">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{b.guestName}</p>
        <p className="truncate text-xs text-muted">
          {unitName(b.propertyId)} · {t("host.people", { count: b.guestsCount })} · {b.checkIn} → {b.checkOut}
        </p>
      </div>
      {action && (
        <button type="button" className={`${ghostButtonClass} shrink-0`} disabled={busy === b.id} onClick={() => void move(b, action.status)}>
          {action.label}
        </button>
      )}
    </li>
  );

  const section = (title: string, list: Booking[], action?: (b: Booking) => { label: string; status: BookingStatus } | undefined) => (
    <section className={`${cardClass} !p-5`}>
      <h2 className="text-sm font-medium">
        {title} · {list.length}
      </h2>
      {list.length === 0 ? <p className="mt-2 text-sm text-muted">{t("reception.none")}</p> : <ul className="mt-2">{list.map((b) => row(b, action?.(b)))}</ul>}
    </section>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">{t("reception.title")}</h1>
        <p className="text-sm text-muted">{t("reception.subtitle", { date: today })}</p>
      </div>
      {error && <p role="alert" className={errorClass}>{error}</p>}
      {ids.length === 0 ? (
        <p className={`${cardClass} text-sm text-muted`}>{t("reception.noUnits")}</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Tile label={t("reception.occupancyToday")} value={`${day.occupancyPct}%`} sub={t("reception.occupiedOf", { n: day.occupiedUnits, total: day.totalUnits, what: unitWord })} />
            <Tile label={t("reception.arrivals")} value={String(day.arrivals.length)} />
            <Tile label={t("reception.departures")} value={String(day.departures.length)} />
            <Tile label={t("reception.inHouse")} value={String(day.inHouse.length)} />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            {section(t("reception.arrivals"), day.arrivals, (b) => (b.status === "confirmed" ? { label: t("reception.doCheckIn"), status: "checked_in" } : undefined))}
            {section(t("reception.departures"), day.departures, (b) => (b.status === "checked_in" ? { label: t("reception.doCheckOut"), status: "checked_out" } : undefined))}
          </div>
          {section(t("reception.inHouse"), day.inHouse)}
          <section className={`${cardClass} !p-5`}>
            <h2 className="text-sm font-medium">{t("reception.monthTitle")}</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Tile label={t("reception.monthOccupancy")} value={`${monthOcc}%`} />
              <Tile label={t("reception.adr")} value={adr > 0 ? formatMoney(adr, currency, locale) : "—"} sub={t("reception.adrHint")} />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
