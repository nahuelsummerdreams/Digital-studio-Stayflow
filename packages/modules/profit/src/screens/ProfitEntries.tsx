"use client";

import { useState, type FormEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buttonClass, cardClass, errorClass, ghostButtonClass, inputClass, labelClass } from "@stayflow/ui";
import {
  EXPENSE_CATEGORIES,
  INCOME_SOURCES,
  addExpense,
  addIncome,
  humanize,
  removeEntry,
  type ExpenseCategory,
  type IncomeSource,
} from "../data";
import { formatMoneyExact, parseMoney } from "../money";
import { useLedger } from "../useLedger";

interface Props {
  client: SupabaseClient;
  orgId: string;
  currency: string;
  properties: { id: string; name: string }[];
}

const today = () => new Date().toISOString().slice(0, 10);
const SHARED = "__shared__";

export function ProfitEntries({ client, orgId, currency, properties }: Props) {
  const { ledger, loading, error: loadError, reload } = useLedger(client, orgId);
  const [kind, setKind] = useState<"income" | "expense">("income");
  const [propertyId, setPropertyId] = useState("");
  const [amount, setAmount] = useState("");
  const [nights, setNights] = useState("1");
  const [source, setSource] = useState<IncomeSource>("airbnb");
  const [category, setCategory] = useState<ExpenseCategory>("cleaning");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(today);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const money = (n: number) => formatMoneyExact(n, currency);
  const nameOf = (id: string | null) =>
    id === null ? "All properties" : properties.find((p) => p.id === id)?.name ?? "Archived property";
  // Income always belongs to one property; an expense can be shared.
  const selected = propertyId || (kind === "income" ? properties[0]?.id ?? "" : SHARED);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const minor = parseMoney(amount);
    if (minor === null || minor <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (kind === "income") {
        if (!selected || selected === SHARED) throw new Error("Choose a property for this income.");
        await addIncome(client, {
          orgId,
          propertyId: selected,
          amount: minor,
          nights: Math.max(0, Math.floor(Number(nights) || 0)),
          source,
          date,
        });
      } else {
        await addExpense(client, {
          orgId,
          propertyId: selected === SHARED ? null : selected,
          amount: minor,
          category,
          date,
          description,
        });
      }
      setAmount("");
      setDescription("");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(entryKind: "income" | "expense", id: string) {
    if (!window.confirm("Delete this entry? This cannot be undone.")) return;
    try {
      await removeEntry(client, entryKind, id);
      await reload();
    } catch {
      setError("Could not delete the entry. Please try again.");
    }
  }

  if (properties.length === 0) {
    return (
      <section className={cardClass}>
        <h2 className="text-sm font-medium">Add a property first</h2>
        <p className="mt-2 text-sm text-black/60">
          Income and expenses are tracked per property. Create one in <strong className="text-ink">Properties</strong>.
        </p>
      </section>
    );
  }

  const rows = [
    ...ledger.incomes.map((i) => ({
      key: `i-${i.id}`,
      id: i.id,
      kind: "income" as const,
      date: i.date,
      amount: i.amount,
      title: `${humanize(i.source)} · ${i.nights} ${i.nights === 1 ? "night" : "nights"}`,
      propertyId: i.propertyId as string | null,
    })),
    ...ledger.expenses.map((x) => ({
      key: `e-${x.id}`,
      id: x.id,
      kind: "expense" as const,
      date: x.date,
      amount: x.amount,
      title: x.description ? `${humanize(x.category)} · ${x.description}` : humanize(x.category),
      propertyId: x.propertyId,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  const tab = (k: "income" | "expense", label: string) => (
    <button
      type="button"
      onClick={() => {
        setKind(k);
        setPropertyId("");
        setError(null);
      }}
      aria-pressed={kind === k}
      className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
        kind === k ? "bg-ink text-white" : "text-black/60 hover:text-black"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className={`${cardClass} space-y-4`}>
        <div className="flex gap-1 rounded-xl bg-paper p-1">
          {tab("income", "Income")}
          {tab("expense", "Expense")}
        </div>

        <label className={labelClass}>
          Property
          <select className={inputClass} value={selected} onChange={(e) => setPropertyId(e.target.value)}>
            {kind === "expense" && <option value={SHARED}>All properties (shared cost)</option>}
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className={labelClass}>
            Amount ({currency})
            <input className={inputClass} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required />
          </label>
          <label className={labelClass}>
            Date
            <input className={inputClass} type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>
        </div>

        {kind === "income" ? (
          <div className="grid grid-cols-2 gap-3">
            <label className={labelClass}>
              Booked through
              <select className={inputClass} value={source} onChange={(e) => setSource(e.target.value as IncomeSource)}>
                {INCOME_SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {humanize(s)}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              Nights
              <input className={inputClass} type="number" min={0} value={nights} onChange={(e) => setNights(e.target.value)} />
            </label>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <label className={labelClass}>
              Category
              <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {humanize(c)}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              Note (optional)
              <input className={inputClass} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} />
            </label>
          </div>
        )}

        {error && <p role="alert" className={errorClass}>{error}</p>}
        <button className={buttonClass} disabled={busy}>
          {busy ? "Saving…" : kind === "income" ? "Add income" : "Add expense"}
        </button>
      </form>

      <section className={cardClass}>
        <h2 className="text-sm font-medium">Recent entries</h2>
        {loading ? (
          <p className="mt-3 text-sm text-black/50">Loading…</p>
        ) : loadError ? (
          <p role="alert" className={`${errorClass} mt-3`}>{loadError}</p>
        ) : rows.length === 0 ? (
          <p className="mt-3 text-sm text-black/60">No entries yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {rows.map((r) => (
              <li key={r.key} className="flex items-center justify-between gap-3 py-3 text-sm">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{r.title}</span>
                  <span className="block truncate text-black/50">
                    {r.date} · {nameOf(r.propertyId)}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  <span className={`font-medium ${r.kind === "expense" ? "text-red-700" : "text-emerald-700"}`}>
                    {r.kind === "expense" ? "−" : "+"}
                    {money(r.amount)}
                  </span>
                  <button type="button" className={ghostButtonClass} onClick={() => remove(r.kind, r.id)} aria-label={`Delete ${r.title}`}>
                    Delete
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
