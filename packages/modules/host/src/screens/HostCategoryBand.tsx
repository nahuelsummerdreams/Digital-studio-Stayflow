"use client";

import { useState, type ReactNode } from "react";
import { useI18n } from "@stayflow/i18n";
import { formatMoney } from "@stayflow/money";
import { Icon, buttonClass, cardClass, ghostButtonClass } from "@stayflow/ui";
import { firstOfMonth, firstOfNextMonth, localToday } from "../dates";
import { categorySnapshot } from "../lodging";
import type { Booking, HostProperty, LodgingType } from "../types";

interface Props {
  lodgingType: LodgingType;
  currency: string;
  /** Reservable units for this category: properties, cabins, rooms or beds. */
  units: HostProperty[];
  bookings: Booking[];
  onAdd: () => void;
  /** The category-change flow (rendered by the app, which owns the account). */
  changeSlot?: ReactNode;
}

/**
 * The dashboard header of each category: what the business is, its own vocabulary and numbers,
 * and the one action that grows it (add properties, cabins, rooms or beds).
 */
export function HostCategoryBand({ lodgingType, currency, units, bookings, onAdd, changeSlot }: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const today = localToday();
  const [y, m] = today.split("-").map(Number) as [number, number];
  const snap = categorySnapshot(bookings, units.map((u) => u.id), today, firstOfMonth(y, m), firstOfNextMonth(y, m));
  const many = t(`unit.${lodgingType}.many`);
  const kpis = [
    { label: t("band.occupied"), value: `${snap.occupiedToday}`, sub: t("band.of", { total: snap.units }) + " " + many },
    { label: t("band.occupancy"), value: `${snap.occupancyToday} %`, sub: "" },
    { label: t("band.arrivals"), value: `${snap.arrivalsToday}`, sub: `${t("band.departures")}: ${snap.departuresToday}` },
    { label: t("band.adr"), value: snap.adr ? formatMoney(snap.adr, currency) : "—", sub: snap.revPau ? `${t(`unit.${lodgingType}.revpau`)}: ${formatMoney(snap.revPau, currency)}` : "" },
  ];
  return (
    <section className={`${cardClass} !p-5`} aria-label={t(`unit.${lodgingType}.band`)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
            <Icon name="building" className="h-3.5 w-3.5" />
            Stayflow · {t(`unit.${lodgingType}.band`)}
          </span>
          <p className="mt-2 text-sm text-muted">{t("band.title")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={buttonClass} onClick={onAdd}>{t(`unit.${lodgingType}.add`)}</button>
          {changeSlot ? (
            <button type="button" className={ghostButtonClass} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
              {open ? t("band.changeHide") : t("band.change")}
            </button>
          ) : null}
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-border/60 bg-surface/40 p-3">
            <dt className="text-xs text-muted">{k.label}</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums">{k.value}</dd>
            {k.sub ? <p className="mt-0.5 text-xs text-muted">{k.sub}</p> : null}
          </div>
        ))}
      </dl>
      {open && changeSlot ? <div className="mt-4">{changeSlot}</div> : null}
    </section>
  );
}
