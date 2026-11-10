"use client";

import { useState, type FormEvent } from "react";
import { buttonClass, cardClass, errorClass, inputClass, labelClass } from "@stayflow/ui";
import { useAccount } from "../account";
import { createOrganization, errorMessage } from "../api";

const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "MXN", "BRL", "ARS"];

/** First run: name the business and pick its currency. */
export function CreateOrgScreen() {
  const { client, refresh, signOut } = useAccount();
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await createOrganization(client, name.trim(), currency);
      await refresh();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-5 pb-16 pt-14">
      <h1 className="font-display text-4xl leading-tight">Let’s set up your business.</h1>
      <p className="mt-3 text-sm text-muted">This is where your properties and numbers will live.</p>
      <form onSubmit={submit} className={`${cardClass} mt-8 space-y-4`}>
        <label className={labelClass}>
          Business name
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Costa Rentals" maxLength={120} required />
        </label>
        <label className={labelClass}>
          Currency
          <select className={inputClass} value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        {error && <p role="alert" className={errorClass}>{error}</p>}
        <button className={`${buttonClass} w-full`} disabled={busy}>
          {busy ? "Creating…" : "Continue"}
        </button>
      </form>
      <button type="button" onClick={signOut} className="mt-4 text-sm text-muted underline-offset-4 hover:underline">
        Sign out
      </button>
    </main>
  );
}
