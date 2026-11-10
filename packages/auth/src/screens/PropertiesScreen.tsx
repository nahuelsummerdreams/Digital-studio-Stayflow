"use client";

import { useState, type FormEvent } from "react";
import { errorKey, useT } from "@stayflow/i18n";
import { buttonClass, cardClass, errorClass, ghostButtonClass, inputClass, labelClass } from "@stayflow/ui";
import { useAccount } from "../account";
import { archiveProperty, createProperty } from "../api";

/** Properties are shared by every Stayflow app, so this screen lives with the account. */
export function PropertiesScreen() {
  const t = useT();
  const { client, org, properties, refresh } = useAccount();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!org) return;
    setBusy(true);
    setError(null);
    try {
      await createProperty(client, org.id, { name, city });
      setName("");
      setCity("");
      await refresh();
    } catch (err) {
      setError(t(errorKey(err)));
    } finally {
      setBusy(false);
    }
  }

  async function archive(id: string, label: string) {
    if (!window.confirm(t("properties.archiveConfirm", { name: label }))) return;
    setError(null);
    try {
      await archiveProperty(client, id);
      await refresh();
    } catch (err) {
      setError(t(errorKey(err)));
    }
  }

  return (
    <div className="space-y-6 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6 lg:space-y-0">
      <section className={cardClass}>
        <h2 className="text-sm font-medium">{t("properties.yourProperties")}</h2>
        {properties.length === 0 ? (
          <p className="mt-3 text-sm text-muted">{t("properties.none")}</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {properties.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <span>
                  <span className="font-medium">{p.name}</span>
                  {p.city && <span className="text-muted"> · {p.city}</span>}
                </span>
                <button type="button" className={ghostButtonClass} onClick={() => archive(p.id, p.name)}>
                  {t("properties.archive")}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form onSubmit={add} className={`${cardClass} space-y-4`}>
        <h2 className="text-sm font-medium">{t("properties.addTitle")}</h2>
        <label className={labelClass}>
          {t("properties.name")}
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder={t("properties.namePlaceholder")} maxLength={120} required />
        </label>
        <label className={labelClass}>
          {t("properties.city")}
          <input className={inputClass} value={city} onChange={(e) => setCity(e.target.value)} />
        </label>
        {error && <p role="alert" className={errorClass}>{error}</p>}
        <button className={buttonClass} disabled={busy}>
          {busy ? t("properties.adding") : t("properties.add")}
        </button>
      </form>
    </div>
  );
}
