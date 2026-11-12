"use client";

import { useMemo, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { errorKey, useI18n } from "@stayflow/i18n";
import { Icon, buttonClass, cardClass, errorClass, ghostButtonClass, infoClass, inputClass, labelClass } from "@stayflow/ui";
import { importBookings, type ImportResult } from "../data";
import { localToday } from "../dates";
import { matchProperty, readReservations, type DateOrder } from "../importer";
import { BOOKING_SOURCES, type BookingSource, type HostProperty } from "../types";

interface Props {
  client: SupabaseClient;
  orgId: string;
  properties: HostProperty[];
  onImported: () => Promise<void>;
}

/** Upload the reservations file from Airbnb or Booking: names, amounts and history in two minutes. */
export function HostImport({ client, orgId, properties, onImported }: Props) {
  const { t } = useI18n();
  const fileRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState<string | null>(null);
  const [order, setOrder] = useState<DateOrder | undefined>(undefined);
  const [source, setSource] = useState<BookingSource | null>(null);
  const [map, setMap] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parsed = useMemo(() => (text === null ? null : readReservations(text, order)), [text, order]);
  const detected = parsed?.source ?? null;
  const effectiveSource: BookingSource = source ?? detected ?? "other";
  const listingKeys = parsed && parsed.listings.length > 0 ? parsed.listings : [""];
  const mapped = (listing: string) => map[listing] ?? matchProperty(listing, properties) ?? (properties.length === 1 ? (properties[0]?.id ?? "") : "");

  const live = parsed?.rows.filter((r) => !r.canceled) ?? [];
  const ready = live.filter((r) => mapped(r.listing) !== "");
  const canceled = (parsed?.rows.length ?? 0) - live.length;

  async function pick(file: File | undefined) {
    if (!file) return;
    setError(null);
    setResult(null);
    setOrder(undefined);
    setSource(null);
    try {
      if (file.size > 5_000_000) throw new Error("big");
      setText(await file.text());
    } catch {
      setText(null);
      setError(t("hx.impErr"));
    }
  }

  async function run() {
    if (!parsed) return;
    setBusy(true);
    setError(null);
    try {
      const items = parsed.rows.flatMap((row) => {
        const propertyId = mapped(row.listing);
        return propertyId ? [{ propertyId, row, source: effectiveSource }] : [];
      });
      const r = await importBookings(client, orgId, items, localToday(), t("hx.impGuest"));
      setResult(r);
      setText(null);
      if (fileRef.current) fileRef.current.value = "";
      await onImported();
    } catch (err) {
      setError(t(errorKey(err)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={`${cardClass} space-y-4`}>
      <div className="max-w-2xl">
        <h2 className="font-display text-2xl">{t("hx.impTitle")}</h2>
        <p className="mt-1.5 text-sm text-muted">{t("hx.impBody")}</p>
        <p className="mt-2 text-xs text-muted">{t("hx.impHow")}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input ref={fileRef} type="file" accept=".csv,.txt,text/csv,text/plain" className="sr-only" id="hx-import-file" onChange={(e) => void pick(e.target.files?.[0])} />
        <label htmlFor="hx-import-file" className={`${ghostButtonClass} cursor-pointer gap-2`}>
          <Icon name="image" className="h-4 w-4" />{t("hx.impPick")}
        </label>
      </div>

      {error && <p role="alert" className={errorClass}>{error}</p>}
      {result && (
        <p role="status" className={infoClass}>
          {[t("hx.impDone", { added: result.added }), result.duplicates ? t("hx.impDup", { count: result.duplicates }) : "", result.conflicts ? t("hx.impConflict", { count: result.conflicts }) : "", result.failed ? t("hx.impFailed", { count: result.failed }) : ""].filter(Boolean).join(" · ")}
        </p>
      )}

      {parsed && parsed.missing.length > 0 && <p role="alert" className={errorClass}>{t("hx.impMissing")}</p>}

      {parsed && parsed.missing.length === 0 && (
        <div className="space-y-4">
          <p className="text-sm">
            <strong>{t("hx.impFound", { count: live.length })}</strong>
            {canceled > 0 && <span className="text-muted"> · {t("hx.impCanceled", { count: canceled })}</span>}
            {parsed.invalid > 0 && <span className="text-muted"> · {t("hx.impInvalid", { count: parsed.invalid })}</span>}
          </p>
          {detected && <p className="text-xs text-muted">{t("hx.impDetected", { source: t(`sources.${detected}`) })}</p>}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              {t("hx.impOrder")}
              <select className={inputClass} value={order ?? parsed.order} onChange={(e) => setOrder(e.target.value as DateOrder)}>
                <option value="dmy">{t("hx.impDmy")}</option>
                <option value="mdy">{t("hx.impMdy")}</option>
              </select>
            </label>
            {!detected && (
              <label className={labelClass}>
                {t("hx.impSource")}
                <select className={inputClass} value={effectiveSource} onChange={(e) => setSource(e.target.value as BookingSource)}>
                  {BOOKING_SOURCES.map((s) => <option key={s} value={s}>{t(`sources.${s}`)}</option>)}
                </select>
              </label>
            )}
          </div>
          {parsed.ambiguous && <p role="status" className={infoClass}>{t("hx.impOrderWarn")}</p>}

          <div className="space-y-2">
            <p className="text-sm font-medium">{t("hx.impMap")}</p>
            {listingKeys.map((l) => (
              <label key={l || "all"} className={`${labelClass} sm:grid sm:grid-cols-[1fr_16rem] sm:items-center sm:gap-3`}>
                <span className="truncate">{l || t("hx.impGuest")}</span>
                <select className={inputClass} value={mapped(l)} onChange={(e) => setMap({ ...map, [l]: e.target.value })}>
                  <option value="">{t("hx.impSkip")}</option>
                  {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </label>
            ))}
          </div>

          <div>
            <p className="text-sm font-medium">{t("hx.impPreview")}</p>
            <ul className="mt-2 divide-y divide-line rounded-xl border border-line text-sm">
              {live.slice(0, 5).map((r) => (
                <li key={r.code} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                  <span className="truncate">{r.guest || t("hx.impGuest")}</span>
                  <span className="text-xs text-muted">{r.checkIn} → {r.checkOut}{r.amount ? ` · ${(r.amount / 100).toLocaleString()}` : ""}</span>
                </li>
              ))}
            </ul>
          </div>

          {live.length > 0 && ready.length < live.length && <p role="status" className={infoClass}>{t("hx.impPickProp", { count: live.length - ready.length })}</p>}
          <button type="button" className={buttonClass} disabled={busy || ready.length === 0} onClick={run}>
            {busy ? t("hx.impGoing") : t("hx.impGo", { count: ready.length })}
          </button>
        </div>
      )}
    </section>
  );
}
