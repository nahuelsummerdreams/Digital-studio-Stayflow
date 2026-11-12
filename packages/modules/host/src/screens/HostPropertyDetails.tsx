"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { errorKey, useI18n } from "@stayflow/i18n";
import { EmptyState, PropertyPhoto, Skeleton, buttonClass, cardClass, errorClass, inputClass, labelClass } from "@stayflow/ui";
import { AMENITIES, loadDetails, saveDetails, type PropertyDetails } from "../data";
import type { HostProperty } from "../types";

interface Props {
  client: SupabaseClient;
  orgId: string;
  properties: HostProperty[];
  /** "cabaña", "habitación"... in the plural, for the intro. */
  unitsLabel: string;
}

const blank = (propertyId: string): PropertyDetails => ({ propertyId, capacity: null, bedrooms: null, beds: null, bathrooms: null, amenities: [], houseRules: "", checkinTime: "", checkoutTime: "", accessNotes: "" });
const num = (v: string): number | null => (v.trim() === "" ? null : Number(v.replace(",", ".")));

/** The technical sheet of each unit: capacity, amenities, rules, check-in times and access notes (private to the team). */
export function HostPropertyDetails({ client, orgId, properties, unitsLabel }: Props) {
  const { t } = useI18n();
  const [all, setAll] = useState<Record<string, PropertyDetails> | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDetails(client, orgId).then(setAll).catch((e) => { setError(t(errorKey(e))); setAll({}); });
  }, [client, orgId, t]);

  if (properties.length === 0) return <EmptyState icon="building" title={t("host.needProperty")} body={t("host.needPropertyBody")} />;
  if (all === null) return <Skeleton className="h-48 rounded-card" />;

  return (
    <section className="space-y-5">
      <div className="max-w-2xl">
        <p className="text-sm text-muted">{t("sheet.body", { units: unitsLabel })}</p>
      </div>
      {error && <p role="alert" className={errorClass}>{error}</p>}
      <ul className="grid gap-4 lg:grid-cols-2">
        {properties.map((p) => (
          <li key={p.id} className={`${cardClass} !p-4`}>
            <button type="button" className="flex w-full items-center gap-3 text-left" aria-expanded={openId === p.id} onClick={() => setOpenId(openId === p.id ? null : p.id)}>
              <PropertyPhoto url={p.photoUrl ?? null} name={p.name} className="h-12 w-12 shrink-0 rounded-xl" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{p.name}</span>
                <span className="block text-xs text-muted">{summary(all[p.id], t)}</span>
              </span>
              <span className="text-xs text-accent">{openId === p.id ? t("sheet.close") : t("sheet.edit")}</span>
            </button>
            {openId === p.id && <Sheet client={client} orgId={orgId} initial={all[p.id] ?? blank(p.id)} onSaved={(d) => setAll((a) => ({ ...(a ?? {}), [p.id]: d }))} />}
          </li>
        ))}
      </ul>
    </section>
  );
}

function summary(d: PropertyDetails | undefined, t: ReturnType<typeof useI18n>["t"]): string {
  if (!d) return t("sheet.empty");
  const parts = [d.capacity ? t("sheet.sumGuests", { n: d.capacity }) : "", d.bedrooms !== null ? t("sheet.sumBedrooms", { n: d.bedrooms }) : "", d.bathrooms !== null ? t("sheet.sumBaths", { n: d.bathrooms }) : ""].filter(Boolean);
  return parts.length ? parts.join(" · ") : t("sheet.empty");
}

function Sheet({ client, orgId, initial, onSaved }: { client: SupabaseClient; orgId: string; initial: PropertyDetails; onSaved: (d: PropertyDetails) => void }) {
  const { t } = useI18n();
  const [d, setD] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const set = <K extends keyof PropertyDetails>(k: K, v: PropertyDetails[K]) => { setSaved(false); setD((x) => ({ ...x, [k]: v })); };
  const toggle = (a: string) => set("amenities", d.amenities.includes(a) ? d.amenities.filter((x) => x !== a) : [...d.amenities, a]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await saveDetails(client, orgId, d);
      onSaved(d);
      setSaved(true);
    } catch (err) {
      setError(t(errorKey(err)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-4 border-t border-line pt-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <label className={labelClass}>{t("sheet.capacity")}<input className={inputClass} inputMode="numeric" value={d.capacity ?? ""} onChange={(e) => set("capacity", num(e.target.value))} /></label>
        <label className={labelClass}>{t("sheet.bedrooms")}<input className={inputClass} inputMode="numeric" value={d.bedrooms ?? ""} onChange={(e) => set("bedrooms", num(e.target.value))} /></label>
        <label className={labelClass}>{t("sheet.beds")}<input className={inputClass} inputMode="numeric" value={d.beds ?? ""} onChange={(e) => set("beds", num(e.target.value))} /></label>
        <label className={labelClass}>{t("sheet.baths")}<input className={inputClass} inputMode="decimal" value={d.bathrooms ?? ""} onChange={(e) => set("bathrooms", num(e.target.value))} /></label>
      </div>
      <div>
        <p className={labelClass}>{t("sheet.amenities")}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {AMENITIES.map((a) => (
            <button key={a} type="button" aria-pressed={d.amenities.includes(a)} onClick={() => toggle(a)}
              className={`rounded-full border px-3 py-1 text-xs transition ${d.amenities.includes(a) ? "border-accent bg-accent/15 text-accent" : "border-line text-muted hover:text-text"}`}>
              {t(`sheet.am_${a}`)}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className={labelClass}>{t("sheet.checkin")}<input className={inputClass} placeholder="15:00" value={d.checkinTime} onChange={(e) => set("checkinTime", e.target.value)} maxLength={10} /></label>
        <label className={labelClass}>{t("sheet.checkout")}<input className={inputClass} placeholder="10:00" value={d.checkoutTime} onChange={(e) => set("checkoutTime", e.target.value)} maxLength={10} /></label>
      </div>
      <label className={labelClass}>{t("sheet.rules")}<textarea className={`${inputClass} min-h-20`} rows={3} value={d.houseRules} onChange={(e) => set("houseRules", e.target.value)} maxLength={2000} /></label>
      <label className={labelClass}>
        {t("sheet.access")}
        <textarea className={`${inputClass} min-h-16`} rows={2} value={d.accessNotes} onChange={(e) => set("accessNotes", e.target.value)} maxLength={1000} />
        <span className="mt-1 block text-xs text-muted">{t("sheet.accessHint")}</span>
      </label>
      {error && <p role="alert" className={errorClass}>{error}</p>}
      <div className="flex items-center gap-3">
        <button className={buttonClass} disabled={busy}>{busy ? t("sheet.saving") : t("sheet.save")}</button>
        {saved && <span className="text-xs text-success">{t("sheet.saved")}</span>}
      </div>
    </form>
  );
}
