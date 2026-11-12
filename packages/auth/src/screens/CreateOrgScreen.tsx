"use client";

import { useState, type FormEvent } from "react";
import { errorKey, useT } from "@stayflow/i18n";
import { buttonClass, cardClass, errorClass, inputClass, labelClass } from "@stayflow/ui";
import { useAccount } from "../account";
import { acceptTeamInvite, createOrganization, setLodgingType, type LodgingType } from "../api";
import { LodgingPicker } from "./LodgingPicker";

const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "MXN", "BRL", "ARS"];

/** First run: name the business and pick its currency. */
export function CreateOrgScreen() {
  const t = useT();
  const { client, refresh, signOut } = useAccount();
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [type, setType] = useState<LodgingType>("rental");
  const [step, setStep] = useState<"category" | "details">("category");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState(() => {
    try { return new URLSearchParams(window.location.search).get("invite") ?? ""; } catch { return ""; }
  });
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  async function join(e: FormEvent) {
    e.preventDefault();
    setJoining(true);
    setJoinError(null);
    try {
      await acceptTeamInvite(client, code);
      await refresh();
    } catch {
      setJoinError(t("team.joinInvalid"));
      setJoining(false);
    }
  }

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

  if (step === "category") {
    return (
      <main className="mx-auto max-w-4xl px-5 pb-16 pt-12">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">{t("org.step", { n: 1, total: 2 })}</p>
        <h1 className="mt-2 font-display text-4xl leading-tight">{t("category.chooseTitle")}</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted">{t("category.chooseHint")}</p>
        <div className="mt-8">
          <LodgingPicker value={type} onChange={setType} />
        </div>
        <button type="button" className={`${buttonClass} mt-6 w-full sm:w-auto sm:px-10`} onClick={() => setStep("details")}>
          {t("org.continue")}
        </button>
        <form onSubmit={join} className={`${cardClass} mt-10 space-y-3`}>
          <h2 className="text-sm font-medium">{t("team.joinTitle")}</h2>
          <p className="text-xs text-muted">{t("team.joinHint")}</p>
          <input className={inputClass} value={code} onChange={(e) => setCode(e.target.value)} placeholder={t("team.joinPlaceholder")} aria-label={t("team.joinTitle")} required />
          {joinError && <p role="alert" className={errorClass}>{joinError}</p>}
          <button className={`${buttonClass} w-full`} disabled={joining}>{joining ? t("team.joining") : t("team.join")}</button>
        </form>
        <button type="button" onClick={signOut} className="mt-4 text-sm text-muted underline-offset-4 hover:underline">
          {t("common.signOut")}
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-5 pb-16 pt-14">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">{t("org.step", { n: 2, total: 2 })}</p>
      <h1 className="mt-2 font-display text-4xl leading-tight">{t("org.title")}</h1>
      <p className="mt-3 text-sm text-muted">{t("org.subtitle")}</p>
      <div className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-accent/40 bg-accent/10 px-4 py-3">
        <span className="text-sm font-medium text-accent">{t(`category.${type}.brand`)}</span>
        <button type="button" className="text-xs text-muted underline-offset-4 hover:underline" onClick={() => setStep("category")} disabled={busy}>{t("org.changeCategory")}</button>
      </div>
      <form onSubmit={submit} className={`${cardClass} mt-4 space-y-5`}>
        <label className={labelClass}>
          {t("org.name")}
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder={t("org.namePlaceholder")} maxLength={120} required autoFocus />
        </label>
        <label className={labelClass}>
          {t("org.currency")}
          <select className={inputClass} value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        {error && <p role="alert" className={errorClass}>{error}</p>}
        <button className={`${buttonClass} w-full`} disabled={busy}>
          {busy ? t("org.creating") : t("org.create")}
        </button>
      </form>
      <button type="button" onClick={signOut} className="mt-4 text-sm text-muted underline-offset-4 hover:underline">
        {t("common.signOut")}
      </button>
    </main>
  );
}
