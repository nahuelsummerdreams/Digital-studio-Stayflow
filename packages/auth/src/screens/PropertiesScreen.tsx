"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { errorKey, useT } from "@stayflow/i18n";
import { Icon, Pill, PropertyPhoto, buttonClass, cardClass, errorClass, ghostButtonClass, inputClass, labelClass } from "@stayflow/ui";
import { useAccount } from "../account";
import { archiveProperty, createProperty, removePropertyPhoto, setPropertyPhoto, type Property } from "../api";
import { UnitsManager } from "./UnitsManager";
import { LodgingCategory } from "./LodgingCategory";

/** One property with a big cover photo. Photos are uploaded straight from the device. */
function PropertyCard({ property, onChanged, onError, children }: { property: Property; onChanged: () => Promise<void>; onError: (m: string | null) => void; children?: ReactNode }) {
  const t = useT();
  const { client, org } = useAccount();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function upload(file: File | undefined) {
    if (!file || !org) return;
    setBusy(true);
    onError(null);
    try {
      await setPropertyPhoto(client, org.id, property, file);
      await onChanged();
    } catch (err) {
      onError(t(errorKey(err)));
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  async function remove() {
    setBusy(true);
    onError(null);
    try {
      await removePropertyPhoto(client, property);
      await onChanged();
    } catch (err) {
      onError(t(errorKey(err)));
    } finally {
      setBusy(false);
    }
  }

  async function archive() {
    if (!window.confirm(t("properties.archiveConfirm", { name: property.name }))) return;
    onError(null);
    try {
      await archiveProperty(client, property.id);
      await onChanged();
    } catch (err) {
      onError(t(errorKey(err)));
    }
  }

  return (
    <li className="fx-card group overflow-hidden rounded-card">
      <div className="relative">
        <PropertyPhoto url={property.photoUrl} name={property.name} className="aspect-[16/10] w-full rounded-none transition duration-700 group-hover:scale-[1.03]" />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg/80 via-transparent to-transparent" />
        {!property.photoUrl && (
          <span className="absolute left-3 top-3">
            <Pill tone="muted">{t("properties.noPhoto")}</Pill>
          </span>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={() => input.current?.click()}
          className="absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-black/55 px-3 py-2 text-xs font-medium text-white backdrop-blur transition hover:bg-black/75 disabled:opacity-60"
        >
          <Icon name="camera" className="h-4 w-4" />
          {busy ? t("properties.uploading") : property.photoUrl ? t("properties.changePhoto") : t("properties.addPhoto")}
        </button>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label={t("properties.photoOf", { name: property.name })} onChange={(e) => void upload(e.target.files?.[0])} />
      </div>
      <div className="flex items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="font-display truncate text-lg">{property.name}</p>
          <p className="truncate text-sm text-muted">{property.city || t("properties.noCity")}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          {property.photoUrl && (
            <button type="button" className={ghostButtonClass} disabled={busy} onClick={() => void remove()}>
              {t("properties.removePhoto")}
            </button>
          )}
          <button type="button" className={ghostButtonClass} onClick={() => void archive()}>
            {t("properties.archive")}
          </button>
        </div>
      </div>
      {children}
    </li>
  );
}

/** Properties are shared by every Stayflow app, so this screen lives with the account. */
export function PropertiesScreen() {
  const t = useT();
  const { client, org, allProperties, refresh } = useAccount();
  const lodging = org?.lodgingType ?? "rental";
  /** Hotels and hostels reserve rooms or beds; rentals and cabins reserve the properties themselves. */
  const usesUnits = lodging === "hotel" || lodging === "hostel";
  const topLevel = allProperties.filter((p) => !p.parentId);
  const hasUnits = allProperties.some((p) => p.parentId);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [qty, setQty] = useState("1");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!org) return;
    setBusy(true);
    setError(null);
    try {
      const n = lodging === "cabins" ? Math.max(1, Math.min(200, Math.floor(Number(qty) || 1))) : 1;
      if (n > 1) {
        for (let i = 1; i <= n; i += 1) await createProperty(client, org.id, { name: `${name.trim()} ${topLevel.length + i}`, city });
      } else {
        await createProperty(client, org.id, { name, city });
      }
      setName("");
      setCity("");
      setQty("1");
      await refresh();
    } catch (err) {
      setError(t(errorKey(err)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && <p role="alert" className={errorClass}>{error}</p>}
      <LodgingCategory onError={setError} />
      {(hasUnits || usesUnits) && <p className="-mt-3 text-xs text-muted">{hasUnits ? t("lodging.typeHint") : t("lodging.noCapacityHint")}</p>}
      {usesUnits ? <UnitsManager /> : (
      <div className="grid gap-6 xl:grid-cols-[1fr_20rem] xl:items-start">
        <section aria-label={t("properties.yourProperties")}>
          {topLevel.length === 0 ? (
            <p className={`${cardClass} text-sm text-muted`}>{lodging === "cabins" ? t(`unit.cabins.addFirst`) : t("properties.none")}</p>
          ) : (
            <ul className="anim-stagger grid gap-4 sm:grid-cols-2">
              {topLevel.map((p) => (
                <PropertyCard key={p.id} property={p} onChanged={refresh} onError={setError} />
              ))}
            </ul>
          )}
          <p className="mt-4 text-xs text-muted">{t("properties.photoHint")}</p>
        </section>

        <form onSubmit={add} className={`${cardClass} space-y-4 xl:sticky xl:top-8`}>
          <h2 className="text-sm font-medium">{usesUnits ? t("properties.addTitle") : t(`unit.${lodging}.add`)}</h2>
          <label className={labelClass}>
            {t("properties.name")}
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder={t("properties.namePlaceholder")} maxLength={120} required />
          </label>
          {lodging === "cabins" && (
            <label className={labelClass}>
              {t("units.cabinsQty")}
              <input className={inputClass} type="number" min={1} max={200} value={qty} onChange={(e) => setQty(e.target.value)} />
              <span className="mt-1 block text-xs text-muted">{t("units.cabinsQtyHint")}</span>
            </label>
          )}
          <label className={labelClass}>
            {t("properties.city")}
            <input className={inputClass} value={city} onChange={(e) => setCity(e.target.value)} />
          </label>
          <button className={`${buttonClass} w-full`} disabled={busy}>
            {busy ? t("properties.adding") : usesUnits ? t("properties.add") : t(`unit.${lodging}.add`)}
          </button>
        </form>
      </div>
      )}
    </div>
  );
}
