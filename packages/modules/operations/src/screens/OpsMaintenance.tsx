"use client";

import { useState, type FormEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { errorKey, useI18n } from "@stayflow/i18n";
import { EmptyState, Pill, buttonClass, cardClass, errorClass, ghostButtonClass, inputClass, labelClass } from "@stayflow/ui";
import { addRecurring, removeRecurring, setRecurringActive } from "../data";
import { addDays, localToday, shortDate } from "../dates";
import { itemsToChecklist, linesToItems } from "../logic";
import type { OpsProperty, Recurring } from "../types";

interface Props {
  client: SupabaseClient;
  orgId: string;
  properties: OpsProperty[];
  recurring: Recurring[];
  reload: () => Promise<void>;
}

const PRESETS = [7, 30, 90, 180, 365];

/** Maintenance that comes back: "limpiar filtros del aire cada 90 días". A week before it is due, it becomes a job. */
export function OpsMaintenance({ client, orgId, properties, recurring, reload }: Props) {
  const { t, locale } = useI18n();
  const today = localToday();
  const [propertyId, setPropertyId] = useState("");
  const [title, setTitle] = useState("");
  const [every, setEvery] = useState("90");
  const [first, setFirst] = useState(addDays(today, 7));
  const [lines, setLines] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (properties.length === 0) return <EmptyState icon="building" title={t("ops.needProperty")} body={t("ops.needPropertyBody")} />;
  const selected = propertyId || properties[0]?.id || "";

  async function submit(e: FormEvent) {
    e.preventDefault();
    const days = Math.floor(Number(every));
    if (title.trim() === "") return setError(t("ops.errTitle"));
    if (!Number.isFinite(days) || days < 1 || days > 365) return setError(t("ops.errEvery"));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(first)) return setError(t("ops.errDate"));
    setBusy(true);
    setError(null);
    try {
      await addRecurring(client, orgId, { propertyId: selected, title, everyDays: days, nextDue: first, checklist: itemsToChecklist(linesToItems(lines)) });
      setTitle("");
      setLines("");
      await reload();
    } catch (err) {
      setError(t(errorKey(err)));
    } finally {
      setBusy(false);
    }
  }

  async function run(fn: () => Promise<void>) {
    setError(null);
    try {
      await fn();
      await reload();
    } catch (err) {
      setError(t(errorKey(err)));
    }
  }

  return (
    <div className="space-y-6 lg:grid lg:grid-cols-[22rem_1fr] lg:items-start lg:gap-6 lg:space-y-0">
      <form onSubmit={submit} className={`${cardClass} space-y-4 lg:sticky lg:top-8`}>
        <h2 className="text-sm font-medium">{t("ops.newRecurring")}</h2>
        <label className={labelClass}>
          {t("ops.property")}
          <select className={inputClass} value={selected} onChange={(e) => setPropertyId(e.target.value)}>{properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        </label>
        <label className={labelClass}>{t("ops.what")}<input className={inputClass} value={title} maxLength={160} onChange={(e) => setTitle(e.target.value)} placeholder={t("ops.recurringPh")} /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className={labelClass}>
            {t("ops.everyDays")}
            <input className={inputClass} type="number" min={1} max={365} value={every} onChange={(e) => setEvery(e.target.value)} list="ops-presets" />
            <datalist id="ops-presets">{PRESETS.map((d) => <option key={d} value={d} />)}</datalist>
          </label>
          <label className={labelClass}>{t("ops.firstDue")}<input className={inputClass} type="date" value={first} onChange={(e) => setFirst(e.target.value)} required /></label>
        </div>
        <label className={labelClass}>{t("ops.checklistLines")}<textarea className={`${inputClass} min-h-24`} rows={4} value={lines} onChange={(e) => setLines(e.target.value)} /></label>
        {error && <p role="alert" className={errorClass}>{error}</p>}
        <button className={`${buttonClass} w-full`} disabled={busy}>{busy ? t("ops.saving") : t("ops.addRecurring")}</button>
      </form>

      <section>
        {recurring.length === 0 ? <EmptyState icon="repeat" title={t("ops.noRecurring")} body={t("ops.noRecurringBody")} /> : (
          <ul className="space-y-3">
            {recurring.map((r) => (
              <li key={r.id} className={`${cardClass} ${r.active ? "" : "opacity-60"}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-lg">{r.title}</span>
                  <Pill tone="muted">{properties.find((p) => p.id === r.propertyId)?.name ?? "—"}</Pill>
                  <Pill tone="accent">{t("ops.everyN", { count: r.everyDays })}</Pill>
                </div>
                <p className="mt-2 text-sm text-muted">{r.active ? t("ops.nextDue", { date: shortDate(r.nextDue, locale) }) : t("ops.paused")}</p>
                <div className="mt-4 flex gap-2">
                  <button type="button" className={ghostButtonClass} onClick={() => run(() => setRecurringActive(client, r.id, !r.active))}>{r.active ? t("ops.pause") : t("ops.resume")}</button>
                  <button type="button" className={ghostButtonClass} onClick={() => window.confirm(t("ops.deleteConfirm")) && run(() => removeRecurring(client, r.id))}>{t("ops.delete")}</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
