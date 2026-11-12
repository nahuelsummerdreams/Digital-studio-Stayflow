"use client";

import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useI18n } from "@stayflow/i18n";
import { formatMoney } from "@stayflow/money";
import { loadBookingEvents, loadPayments, type BookingEvent, type BookingPayment } from "../data";
import { STATUS_KEY } from "../format";
import type { BookingStatus } from "../types";

/** Small expandable timeline of a booking: created, status, dates, amount and unit changes. */
export function BookingHistory({ client, bookingId, nameOf, version, currency }: { client: SupabaseClient; bookingId: string; nameOf: (id: string) => string; version: unknown; currency: string }) {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState<BookingEvent[] | null>(null);
  const [payments, setPayments] = useState<BookingPayment[]>([]);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    loadBookingEvents(client, bookingId).then((e) => alive && setEvents(e)).catch(() => alive && setEvents([]));
    loadPayments(client, bookingId).then((p) => alive && setPayments(p)).catch(() => alive && setPayments([]));
    return () => { alive = false; };
  }, [open, client, bookingId, version]);

  const status = (v: string | null) => (v && v in STATUS_KEY ? t(STATUS_KEY[v as BookingStatus]) : (v ?? ""));
  const line = (e: BookingEvent): string => {
    switch (e.kind) {
      case "created": return t("hist.created", { status: status(e.to) });
      case "status": return t("hist.status", { from: status(e.from), to: status(e.to) });
      case "dates": return t("hist.dates", { from: e.from ?? "", to: e.to ?? "" });
      case "amount": return t("hist.amount", { from: String(Number(e.from ?? 0) / 100), to: String(Number(e.to ?? 0) / 100) });
      case "property": return t("hist.property", { from: nameOf(e.from ?? ""), to: nameOf(e.to ?? "") });
    }
  };

  return (
    <div className="mt-3">
      <button type="button" className="text-xs font-medium text-accent hover:opacity-80" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        {open ? t("hist.hide") : t("hist.show")}
      </button>
      {open && (
        <>
        {payments.length > 0 && (
          <ul className="mt-2 space-y-1 border-l border-accent/40 pl-3 text-xs text-muted">
            {payments.map((p) => (
              <li key={p.id}>
                <span className="text-text">{p.amount > 0 ? "+" : "−"} {formatMoney(Math.abs(p.amount), currency, locale)}</span> · {t(`pay.${p.method}`)}{p.note ? ` · ${p.note}` : ""} · {new Date(p.paidOn + "T12:00:00").toLocaleDateString(locale, { day: "numeric", month: "short" })}
              </li>
            ))}
          </ul>
        )}
        <ol className="mt-2 space-y-1 border-l border-line pl-3 text-xs text-muted">
          {events === null ? <li>…</li> : events.length === 0 ? <li>{t("hist.none")}</li> : events.map((e) => (
            <li key={e.id}>
              <span className="text-text">{line(e)}</span> · {new Date(e.at).toLocaleString(locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            </li>
          ))}
        </ol>
        </>
      )}
    </div>
  );
}
