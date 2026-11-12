"use client";

import { useCallback, useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { errorKey, useI18n } from "@stayflow/i18n";
import { Icon, buttonClass, cardClass, errorClass, ghostButtonClass } from "@stayflow/ui";
import { loadDemoPropertyIds, loadSyncProperties, removeDemo, seedDemo } from "../data";
import { addDays, localToday } from "../dates";
import type { Booking, HostProperty } from "../types";

interface Props {
  client: SupabaseClient;
  orgId: string;
  properties: HostProperty[];
  bookings: Booking[];
  onGo: (href: string) => void;
  /** Reload account properties and Host data after the sample data changes. */
  onChanged: () => Promise<void>;
  /** The sample account is made of rental properties, so hotels and hostels do not offer it. Default true. */
  allowDemo?: boolean;
}

const KEY = (orgId: string) => `stayflow-host-start-${orgId}`;

/** First steps for a new host, with real progress, plus a one-click sample account to try everything. */
export function HostGettingStarted({ client, orgId, properties, bookings, onGo, onChanged, allowDemo = true }: Props) {
  const { t } = useI18n();
  const [demoIds, setDemoIds] = useState<string[] | null>(null);
  const [linked, setLinked] = useState(false);
  const [hidden, setHidden] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setDemoIds(await loadDemoPropertyIds(client, orgId));
      setLinked((await loadSyncProperties(client, orgId)).some((p) => p.icalUrl));
    } catch {
      setDemoIds([]);
    }
  }, [client, orgId]);

  useEffect(() => {
    try {
      setHidden(localStorage.getItem(KEY(orgId)) === "1");
    } catch {
      setHidden(false);
    }
    void refresh();
  }, [orgId, refresh, properties.length]);

  if (demoIds === null) return null;
  const real = properties.filter((p) => !demoIds.includes(p.id));
  const realBookings = bookings.filter((b) => real.some((p) => p.id === b.propertyId));
  const steps = [
    { done: real.length > 0, label: t("hx.gsProperty"), go: "/properties", cta: t("hx.gsPropertyCta") },
    { done: real.some((p) => p.photoUrl), label: t("hx.gsPhoto"), go: "/properties", cta: t("hx.gsPhotoCta") },
    { done: realBookings.length > 0, label: t("hx.gsBooking"), go: "/bookings?new=1", cta: t("hx.gsBookingCta") },
    { done: linked, label: t("hx.gsSync"), go: "/sync", cta: t("hx.gsSyncCta"), optional: true },
  ];
  const required = steps.filter((s) => !s.optional);
  const allDone = required.every((s) => s.done);
  const hasDemo = demoIds.length > 0;

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await onChanged();
      await refresh();
    } catch (err) {
      setError(t(errorKey(err)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {hasDemo && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4" role="status">
          <p className="mr-auto text-sm text-amber-200">{t("hx.demoActive")}</p>
          <button type="button" className={ghostButtonClass} disabled={busy} onClick={() => run(() => removeDemo(client, orgId))}>{t("hx.demoRemove")}</button>
        </div>
      )}
      {!(allDone || hidden) && (
        <section className={`${cardClass} fx-hero`} aria-label={t("hx.gsTitle")}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl">{t("hx.gsTitle")}</h2>
              <p className="mt-1 text-sm text-muted">{t("hx.gsBody")}</p>
            </div>
            <button type="button" className="text-xs text-muted underline-offset-4 hover:underline" onClick={() => { try { localStorage.setItem(KEY(orgId), "1"); } catch { /* the card simply comes back next time */ } setHidden(true); }}>{t("hx.gsHide")}</button>
          </div>
          <ol className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.label} className={`flex flex-col justify-between gap-3 rounded-2xl border p-4 ${s.done ? "border-success/30 bg-success/5" : "border-line bg-bg/40"}`}>
                <p className="flex items-start gap-2.5 text-sm font-medium">
                  <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] ${s.done ? "bg-success text-bg" : "border border-line text-muted"}`}>{s.done ? <Icon name="check" className="h-3 w-3" /> : i + 1}</span>
                  <span className={s.done ? "text-muted line-through" : ""}>{s.label}{s.optional && <span className="ml-1.5 text-[11px] font-normal text-muted">({t("hx.gsOptional")})</span>}</span>
                </p>
                {!s.done && <button type="button" className={`${i === steps.findIndex((x) => !x.done) ? buttonClass : ghostButtonClass} !py-2 text-sm`} onClick={() => onGo(s.go)}>{s.cta}</button>}
              </li>
            ))}
          </ol>
          {allowDemo && real.length === 0 && !hasDemo && (
            <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-4">
              <p className="text-sm text-muted">{t("hx.demoBody")}</p>
              <button type="button" className={`${ghostButtonClass} gap-2`} disabled={busy} onClick={() => run(() => seedDemo(client, orgId, localToday(), addDays))}>
                <Icon name="sparkles" className="h-4 w-4" />{busy ? t("auth.busy") : t("hx.demoTry")}
              </button>
            </div>
          )}
          {error && <p role="alert" className={`${errorClass} mt-3`}>{error}</p>}
        </section>
      )}
    </div>
  );
}
