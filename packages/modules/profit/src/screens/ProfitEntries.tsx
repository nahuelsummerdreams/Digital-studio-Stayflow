"use client";

import { useState, type FormEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { errorKey, useI18n } from "@stayflow/i18n";
import { activeTabClass, buttonClass, cardClass, errorClass, ghostButtonClass, idleTabClass, inputClass, labelClass } from "@stayflow/ui";
import {
  EXPENSE_CATEGORIES,
  INCOME_SOURCES,
  addExpense,
  addIncome,
  removeEntry,
  type ExpenseCategory,
  type IncomeSource,
} from "../data";
import { formatDate } from "../format";
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
  const { t, locale } = useI18n();
  const { ledger, loading, error: loadError, reload } = useLedger(client, orgId);
  const [kind, setKind] = useState<"income" | "expense">("income");
  const [propertyId, setPropertyId] = useState("");
  const [amount, setAmount] = useState("");
  const [nights, setNights] = useState("1");
  const [source, setSource] = useState<IncomeSource>("airbnb");
  const [category, setCategory] = useState<ExpenseCategory>("cleaning");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(today);
  const [visible, setVisible] = useState(20);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const money = (n: number) => formatMoneyExact(n, currency, locale);
  const nameOf = (id: string | null) =>
    id === null ? t("properties.allProperties") : properties.find((p) => p.id === id)?.name ?? t("properties.archived");
  // Income always belongs to one property; an expense can be shared.
  const selected = propertyId || (kind === "income" ? properties[0]?.id ?? "" : SHARED);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const minor = parseMoney(amount);
    if (minor === null || minor <= 0) {
      setError(t("entries.amountError"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (kind === "income") {
        if (!selected || selected === SHARED) throw new Error(t("entries.chooseProperty"));
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
      setError(err instanceof Error && err.message === t("entries.chooseProperty") ? err.message : t(errorKey(err)));
    } finally {
      setBusy(false);
    }
  }

  async function remove(entryKind: "income" | "expense", id: string) {
    if (!window.confirm(t("entries.deleteConfirm"))) return;
    try {
      await removeEntry(client, entryKind, id);
      await reload();
    } catch {
      setError(t("entries.deleteError"));
    }
  }

  if (properties.length === 0) {
    return (
      <section className={cardClass}>
        <h2 className="text-sm font-medium">{t("entries.needProperty")}</h2>
        <p className="mt-2 text-sm text-muted">
          {t("entries.needPropertyBody")}
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
      title: `${t(`sources.${i.source}`)} · ${t("entries.nights", { count: i.nights })}`,
      propertyId: i.propertyId as string | null,
    })),
    ...ledger.expenses.map((x) => ({
      key: `e-${x.id}`,
      id: x.id,
      kind: "expense" as const,
      date: x.date,
      amount: x.amount,
      title: x.description ? `${t(`categories.${x.category}`)} · ${x.description}` : t(`categories.${x.category}`),
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
        kind === k ? activeTabClass : idleTabClass
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6 lg:grid lg:grid-cols-[22rem_1fr] lg:items-start lg:gap-6 lg:space-y-0">
      <form onSubmit={submit} className={`${cardClass} space-y-4 lg:sticky lg:top-8`}>
        <div className="flex gap-1 rounded-xl bg-bg p-1">
          {tab("income", t("entries.income"))}
          {tab("expense", t("entries.expense"))}
        </div>

        <label className={labelClass}>
          {t("entries.property")}
          <select className={inputClass} value={selected} onChange={(e) => setPropertyId(e.target.value)}>
            {kind === "expense" && <option value={SHARED}>{t("entries.sharedCost")}</option>}
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className={labelClass}>
            {t("entries.amount", { currency })}
            <input className={inputClass} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" required />
          </label>
          <label className={labelClass}>
            {t("entries.date")}
            <input className={inputClass} type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>
        </div>

        {kind === "income" ? (
          <div className="grid grid-cols-2 gap-3">
            <label className={labelClass}>
              {t("entries.bookedThrough")}
              <select className={inputClass} value={source} onChange={(e) => setSource(e.target.value as IncomeSource)}>
                {INCOME_SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {t(`sources.${s}`)}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              {t("entries.nightsField")}
              <input className={inputClass} type="number" min={0} value={nights} onChange={(e) => setNights(e.target.value)} />
            </label>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <label className={labelClass}>
              {t("entries.category")}
              <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {t(`categories.${c}`)}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              {t("entries.note")}
              <input className={inputClass} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} />
            </label>
          </div>
        )}

        {error && <p role="alert" className={errorClass}>{error}</p>}
        <button className={buttonClass} disabled={busy}>
          {busy ? t("entries.saving") : kind === "income" ? t("entries.addIncome") : t("entries.addExpense")}
        </button>
      </form>

      <section className={cardClass}>
        <h2 className="text-sm font-medium">{t("entries.recent")}</h2>
        {loading ? (
          <p className="mt-3 text-sm text-muted">{t("common.loading")}</p>
        ) : loadError ? (
          <p role="alert" className={`${errorClass} mt-3`}>{t("entries.loadError")}</p>
        ) : rows.length === 0 ? (
          <p className="mt-3 text-sm text-muted">{t("entries.none")}</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {rows.slice(0, visible).map((r) => (
              <li key={r.key} className="flex items-center justify-between gap-3 py-3 text-sm">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{r.title}</span>
                  <span className="block truncate text-muted">
                    {formatDate(r.date, locale)} · {nameOf(r.propertyId)}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  <span className={`font-medium ${r.kind === "expense" ? "text-danger" : "text-success"}`}>
                    {r.kind === "expense" ? "−" : "+"}
                    {money(r.amount)}
                  </span>
                  <button type="button" className={ghostButtonClass} onClick={() => remove(r.kind, r.id)} aria-label={t("entries.deleteLabel", { title: r.title })}>
                    {t("entries.delete")}
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
        {rows.length > visible && (
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
            <span className="text-sm text-muted">{t("entries.showing", { shown: visible, total: rows.length })}</span>
            <button type="button" className={ghostButtonClass} onClick={() => setVisible((v) => v + 20)}>
              {t("entries.showMore")}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
