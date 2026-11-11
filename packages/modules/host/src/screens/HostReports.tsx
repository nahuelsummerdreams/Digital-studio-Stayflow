"use client";

import { useState } from "react";
import { useI18n } from "@stayflow/i18n";
import { formatMoney } from "@stayflow/money";
import { EmptyState, Icon, Skeleton, buttonClass, cardClass, ghostButtonClass } from "@stayflow/ui";
import { localToday, shiftMonth } from "../dates";
import { monthTitle } from "../format";
import { monthReport } from "../report";
import type { Booking, HostProperty } from "../types";

interface Props {
  currency: string;
  orgName: string;
  properties: HostProperty[];
  bookings: Booking[];
  loading: boolean;
}

/** The month closed, property by property. "Print" lets the browser save it as a PDF. */
export function HostReports({ currency, orgName, properties, bookings, loading }: Props) {
  const { t, locale } = useI18n();
  const [ty, tm] = localToday().split("-").map(Number) as [number, number];
  const [cursor, setCursor] = useState({ year: ty, month: tm });
  if (properties.length === 0) return <EmptyState icon="report" title={t("hx.repEmpty")} />;
  if (loading) return <Skeleton className="h-72 rounded-card" />;

  const r = monthReport(bookings, properties, cursor.year, cursor.month);
  const money = (n: number) => (n > 0 ? formatMoney(n, currency, locale) : "—");
  const head = ["repProperty", "repBookings", "repNights", "repOccupancy", "repBilled", "repCollected", "repPending", "repAvgNight", "repAvgStay"] as const;

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3 print:hidden">
        <div className="max-w-xl">
          <h2 className="font-display text-2xl">{t("hx.repTitle")}</h2>
          <p className="mt-1.5 text-sm text-muted">{t("hx.repBody")}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" className={ghostButtonClass} onClick={() => setCursor((c) => shiftMonth(c.year, c.month, -1))} aria-label={t("host.calPrev")}><Icon name="chevronLeft" className="h-4 w-4" /></button>
          <button type="button" className={ghostButtonClass} onClick={() => setCursor((c) => shiftMonth(c.year, c.month, 1))} aria-label={t("host.calNext")}><Icon name="chevronRight" className="h-4 w-4" /></button>
          <button type="button" className={`${buttonClass} gap-2`} onClick={() => window.print()}><Icon name="report" className="h-4 w-4" />{t("hx.repPrint")}</button>
        </div>
      </div>

      <div className={`${cardClass} print-area overflow-x-auto`}>
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-display text-2xl">{monthTitle(cursor.year, cursor.month, locale)}</h3>
          <p className="text-sm text-muted">{orgName}</p>
        </div>
        <table className="w-full min-w-[44rem] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[11px] uppercase tracking-[0.12em] text-muted">
              {head.map((h, i) => <th key={h} className={`pb-2 font-semibold ${i === 0 ? "" : "text-right"}`}>{t(`hx.${h}`)}</th>)}
            </tr>
          </thead>
          <tbody>
            {r.rows.map((p) => (
              <tr key={p.propertyId} className="border-b border-line/60">
                <td className="py-3 font-medium">{p.name}</td>
                <td className="text-right tabular-nums">{p.bookings}</td>
                <td className="text-right tabular-nums">{p.nights}</td>
                <td className="text-right tabular-nums">{p.occupancy.toFixed(0)}%</td>
                <td className="text-right tabular-nums">{money(p.billed)}</td>
                <td className="text-right tabular-nums">{money(p.collected)}</td>
                <td className="text-right tabular-nums">{money(p.pending)}</td>
                <td className="text-right tabular-nums">{money(p.avgNightly)}</td>
                <td className="text-right tabular-nums">{p.avgStay || "—"}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-semibold">
              <td className="pt-3">{t("hx.repTotal")}</td>
              <td className="pt-3 text-right tabular-nums">{r.totals.bookings}</td>
              <td className="pt-3 text-right tabular-nums">{r.totals.nights}</td>
              <td className="pt-3 text-right tabular-nums">{r.totals.occupancy.toFixed(0)}%</td>
              <td className="pt-3 text-right tabular-nums">{money(r.totals.billed)}</td>
              <td className="pt-3 text-right tabular-nums">{money(r.totals.collected)}</td>
              <td className="pt-3 text-right tabular-nums">{money(r.totals.pending)}</td>
              <td />
              <td />
            </tr>
          </tfoot>
        </table>
        <p className="mt-5 text-xs text-muted">{t("hx.repNote")}</p>
      </div>
    </section>
  );
}
