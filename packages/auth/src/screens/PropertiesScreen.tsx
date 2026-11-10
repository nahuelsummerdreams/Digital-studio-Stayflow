"use client";

import { useState, type FormEvent } from "react";
import { buttonClass, cardClass, errorClass, ghostButtonClass, inputClass, labelClass } from "@stayflow/ui";
import { useAccount } from "../account";
import { archiveProperty, createProperty, errorMessage } from "../api";

/** Properties are shared by every Stayflow app, so this screen lives with the account. */
export function PropertiesScreen() {
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
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function archive(id: string, label: string) {
    if (!window.confirm(`Archive "${label}"? Its history is kept, it just stops showing up.`)) return;
    setError(null);
    try {
      await archiveProperty(client, id);
      await refresh();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <div className="space-y-6">
      <section className={cardClass}>
        <h2 className="text-sm font-medium">Your properties</h2>
        {properties.length === 0 ? (
          <p className="mt-3 text-sm text-black/60">No properties yet. Add your first one below.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {properties.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <span>
                  <span className="font-medium">{p.name}</span>
                  {p.city && <span className="text-black/50"> · {p.city}</span>}
                </span>
                <button type="button" className={ghostButtonClass} onClick={() => archive(p.id, p.name)}>
                  Archive
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form onSubmit={add} className={`${cardClass} space-y-4`}>
        <h2 className="text-sm font-medium">Add a property</h2>
        <label className={labelClass}>
          Name
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sea View Loft" maxLength={120} required />
        </label>
        <label className={labelClass}>
          City (optional)
          <input className={inputClass} value={city} onChange={(e) => setCity(e.target.value)} />
        </label>
        {error && <p role="alert" className={errorClass}>{error}</p>}
        <button className={buttonClass} disabled={busy}>
          {busy ? "Adding…" : "Add property"}
        </button>
      </form>
    </div>
  );
}
