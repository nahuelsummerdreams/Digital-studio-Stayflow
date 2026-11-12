"use client";

import { useState, type FormEvent } from "react";
import { errorKey, useT } from "@stayflow/i18n";
import { buttonClass, cardClass, errorClass, inputClass, labelClass } from "@stayflow/ui";
import { useAccount } from "../account";
import { createOrganization, setLodgingType, type LodgingType } from "../api";
import { LodgingPicker } from "./LodgingPicker";

const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "MXN", "BRL", "ARS"];

/** First run: name the business and pick its currency. */
export function CreateOrgScreen() {
  const t = useT();
  const { client, refresh, signOut } = useAccount();
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [type, setType] = useState<LodgingType>("rental");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const orgId = await createOrganization(client, name.trim(), currency);
      if (type !== "rental") await setLodgingType(client, orgId, type);
      await refresh();
    } catch (err) {
      setError(t(errorKey(err)));
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-5 pb-16 pt-14">
      <h1 className="font-display text-4xl leading-tight">{t("org.title")}</h1>
      <p className="mt-3 text-sm text-muted">{t("org.subtitle")}</p>
      <form onSubmit={submit} className={`${cardClass} mt-8 space-y-5`}>
        <label className={labelClass}>
          {t("org.name")}
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder={t("org.namePlaceholder")} maxLength={120} required />
        </label>
        <label className={labelClass}>
          {t("org.currency")}
          <select className={inputClass} value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <div>
          <p className={labelClass}>{t("category.chooseTitle")}</p>
          <p className="mb-3 mt-1 text-xs text-muted">{t("category.chooseHint")}</p>
          <LodgingPicker value={type} onChange={setType} disabled={busy} />
        </div>
        {error && <p role="alert" className={errorClass}>{error}</p>}
        <button className={`${buttonClass} w-full`} disabled={busy}>
          {busy ? t("org.creating") : t("org.continue")}
        </button>
      </form>
      <button type="button" onClick={signOut} className="mt-4 text-sm text-muted underline-offset-4 hover:underline">
        {t("common.signOut")}
      </button>
    </main>
  );
}
