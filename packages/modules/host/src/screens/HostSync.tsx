"use client";

import { useCallback, useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { errorKey, useI18n } from "@stayflow/i18n";
import { EmptyState, Icon, buttonClass, cardClass, errorClass, ghostButtonClass, infoClass, inputClass, labelClass } from "@stayflow/ui";
import { loadSyncProperties, saveIcalUrl, syncCalendars, type SyncProperty } from "../data";

interface Props {
  client: SupabaseClient;
  orgId: string;
  /** Called after a sync so bookings and the calendar reload. */
  onSynced: () => Promise<void>;
}

/** Connect the calendars of Airbnb, Booking or VRBO (in) and publish yours (out). */
export function HostSync({ client, orgId, onSynced }: Props) {
  const { t, locale } = useI18n();
  const [props, setProps] = useState<SyncProperty[] | null>(null);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    const list = await loadSyncProperties(client, orgId);
    setProps(list);
    setUrls((u) => ({ ...Object.fromEntries(list.map((p) => [p.id, p.icalUrl ?? ""])), ...u }));
  }, [client, orgId]);
  useEffect(() => {
    void load().catch(() => setProps([]));
  }, [load]);

  if (props === null) return null;
  if (props.length === 0) return <EmptyState icon="refresh" title={t("hx.syncNoProps")} />;
  const origin = typeof window === "undefined" ? "" : window.location.origin;

  async function saveLink(p: SyncProperty) {
    setError(null);
    const value = (urls[p.id] ?? "").trim();
    if (value !== "" && !/^https:\/\//i.test(value)) return setError(t("hx.syncErrUrl"));
    try {
      await saveIcalUrl(client, p.id, value);
      setMsg((m) => ({ ...m, [p.id]: t("hx.syncSaved") }));
      await load();
    } catch (err) {
      setError(t(errorKey(err)));
    }
  }

  async function sync(p: SyncProperty) {
    setError(null);
    setBusy(p.id);
    try {
      await saveIcalUrl(client, p.id, urls[p.id] ?? "");
      const [r] = await syncCalendars(client, p.id);
      if (!r || !r.ok) setError(t("hx.syncErr"));
      else {
        setMsg((m) => ({ ...m, [p.id]: `${t("hx.syncResult", { added: r.added, updated: r.updated, canceled: r.canceled })}${r.skipped ? ` · ${t("hx.syncSkipped", { count: r.skipped })}` : ""}` }));
        await onSynced();
      }
      await load();
    } catch {
      setError(t("hx.syncErr"));
    } finally {
      setBusy(null);
    }
  }

  async function copy(link: string, id: string) {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(id);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      setError(t("errors.generic"));
    }
  }

  return (
    <section className="space-y-5">
      <div className="max-w-2xl">
        <h2 className="font-display text-2xl">{t("hx.syncTitle")}</h2>
        <p className="mt-1.5 text-sm text-muted">{t("hx.syncBody")}</p>
      </div>
      {error && <p role="alert" className={errorClass}>{error}</p>}

      <div className="space-y-4">
        {props.map((p) => {
          const feed = `${origin}/api/ical/${p.icalToken}.ics`;
          return (
            <article key={p.id} className={`${cardClass} space-y-4`}>
              <h3 className="font-display text-lg">{p.name}</h3>
              <label className={labelClass}>
                {t("hx.syncImport")}
                <input className={inputClass} type="url" inputMode="url" placeholder={t("hx.syncImportPh")} value={urls[p.id] ?? ""} onChange={(e) => setUrls({ ...urls, [p.id]: e.target.value })} maxLength={600} />
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" className={ghostButtonClass} onClick={() => saveLink(p)}>{t("hx.syncSaveLink")}</button>
                <button type="button" className={`${buttonClass} gap-2`} disabled={busy === p.id || (urls[p.id] ?? "").trim() === ""} onClick={() => sync(p)}>
                  <Icon name="refresh" className={`h-4 w-4 ${busy === p.id ? "animate-spin" : ""}`} />{busy === p.id ? t("hx.syncing") : t("hx.syncNow")}
                </button>
                <span className="text-xs text-muted">{p.syncedAt ? t("hx.syncLast", { when: new Date(p.syncedAt).toLocaleString(locale) }) : t("hx.syncNever")}{p.status && p.status !== "ok" ? ` · ${p.status}` : ""}</span>
              </div>
              {msg[p.id] && <p role="status" className={infoClass}>{msg[p.id]}</p>}
              <div className="border-t border-line pt-4">
                <p className="text-sm font-medium">{t("hx.syncExport")}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded-lg border border-line bg-bg/50 px-3 py-2 text-xs">{feed}</code>
                  <button type="button" className={`${ghostButtonClass} gap-2`} onClick={() => copy(feed, p.id)}><Icon name={copied === p.id ? "check" : "copy"} className="h-4 w-4" />{t("hx.syncCopy")}</button>
                </div>
                <p className="mt-2 text-xs text-muted">{t("hx.syncExportHint")}</p>
              </div>
            </article>
          );
        })}
      </div>

      <div className={`${cardClass}`}>
        <p className="text-sm font-medium">{t("hx.syncHow")}</p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-muted">{t("hx.syncSteps").split("|").map((x) => <li key={x}>{x}</li>)}</ul>
      </div>
    </section>
  );
}
