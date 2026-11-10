"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { errorKey, useI18n } from "@stayflow/i18n";
import { buttonClass, cardClass, errorClass, ghostButtonClass, inputClass, labelClass } from "@stayflow/ui";
import {
  EXPENSE_CATEGORIES,
  addRecurring,
  deleteRecurring,
  generateRecurring,
  loadRecurring,
  setRecurringActive,
  type ExpenseCategory,
  type RecurringRow,
} from "../data";
import { formatMoneyExact, parseMoney } from "../money";

interface Props {
  client: SupabaseClient;
  orgId: string;
  currency: string;
  properties: { id: string; name: string }[];
}

const SHARED = "__shared__";

export function ProfitFixed({ client, orgId, currency, properties }: Props) {
  const { t, locale } = useI18n();
  const [rows, setRows] = useState<RecurringRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [propertyId, setPropertyId] = useState(SHARED);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("utilities");
  const [description, setDescription] = useState("");
  const [day, setDay] = useState("1");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const money = (n: number) => formatMoneyExact(n, currency, locale);
  const nameOf = (id: string | null) =>
    id === null ? t("properties.allProperties") : properties.find((p) => p.id === id)?.name ?? t("properties.archived");

  const reload = useCallback(async () => {
    try {
      setRows(await loadRecurring(client, orgId));
    } catch (err) {
      setError(t(errorKey(err)));
    } finally {
      setLoading(false);
    }
  }, [client, orgId, t]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const minor = parseMoney(amount);
    if (minor === null || minor <= 0) {
      setError(t("fixed.amountError"));
      return;
    }
    const dayOfMonth = Math.min(31, Math.max(1, Math.floor(Number(day) || 1)));
    setBusy(true);
    setError(null);
    try {
      await addRecurring(client, {
        orgId,
        propertyId: propertyId === SHARED ? null : propertyId,
        category,
        amount: minor,
        description,
        dayOfMonth,
      });
      // Month-to-date entries appear right away instead of waiting for the next visit.
      await generateRecurring(client, orgId);
      setAmount("");
      setDescription("");
      await reload();
    } catch (err) {
      setError(t(errorKey(err)));
    } finally {
      setBusy(false);
    }
  }

  async function toggle(r: RecurringRow) {
    setError(null);
    try {
      await setRecurringActive(client, r.id, !r.active);
      await reload();
    } catch (err) {
      setError(t(errorKey(err)));
    }
  }

  async function remove(r: RecurringRow) {
    if (!window.confirm(t("fixed.deleteConfirm"))) return;
    setError(null);
    try {
      await deleteRecurring(client, r.id);
      await reload();
    } catch (err) {
      setError(t(errorKey(err)));
    }
  }

  const monthlyTotal = rows.filter((r) => r.active).reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-6 lg:grid lg:grid-cols-[22rem_1fr] lg:items-start lg:gap-6 lg:space-y-0">
      <section className={`${cardClass} lg:col-span-2`}>
        <h2 className="text-sm font-medium">{t("fixed.title")}</h2>
        <p className="mt-2 text-sm text-muted">{t("fixed.intro")}</p>
      </section>

      <form onSubmit={submit} className={`${cardClass} space-y-4 lg:sticky lg:top-8`}>
        <label className={labelClass}>
          {t("fixed.property")}
          <select className={inputClass} value={propertyId} onChange={(e) => setPropertyId(e.target.value)}>
            <option value={SHARED}>{t("fixed.shared")}</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className={labelClass}>
            {t("fixed.amount", { currency })}
            <input className={inputClass} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" required />
          </label>
          <label className={labelClass}>
            {t("fixed.day")}
            <input className={inputClass} type="number" min={1} max={31} value={day} onChange={(e) => setDay(e.target.value)} required />
          </label>
        </div>
        <p className="-mt-2 text-xs text-muted">{t("fixed.dayHint")}</p>
        <div className="grid grid-cols-2 items-end gap-3">
          <label className={labelClass}>
            {t("fixed.category")}
            <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {t(`categories.${c}`)}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            {t("fixed.description")}
            <input className={inputClass} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} />
          </label>
        </div>
        {error && <p role="alert" className={errorClass}>{error}</p>}
        <button className={buttonClass} disabled={busy}>
          {busy ? t("fixed.adding") : t("fixed.add")}
        </button>
      </form>

      <section className={cardClass}>
        <h2 className="text-sm font-medium">{t("fixed.listTitle")}</h2>
        {loading ? (
          <p className="mt-3 text-sm text-muted">{t("common.loading")}</p>
        ) : rows.length === 0 ? (
          <p className="mt-3 text-sm text-muted">{t("fixed.none")}</p>
        ) : (
          <>
            <ul className="mt-3 divide-y divide-line">
              {rows.map((r) => {
                const title = r.description ? `${t(`categories.${r.category}`)} · ${r.description}` : t(`categories.${r.category}`);
                return (
                  <li key={r.id} className={`flex items-center justify-between gap-3 py-3 text-sm ${r.active ? "" : "opacity-60"}`}>
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{title}</span>
                      <span className="block truncate text-muted">
                        {t("fixed.schedule", { amount: money(r.amount), day: r.dayOfMonth })} · {nameOf(r.propertyId)}
                        {!r.active && ` · ${t("fixed.paused")}`}
                      </span>
                    </span>
                    <span className="flex shrink-0 gap-2">
                      <button type="button" className={ghostButtonClass} onClick={() => toggle(r)}>
                        {r.active ? t("fixed.pause") : t("fixed.resume")}
                      </button>
                      <button type="button" className={ghostButtonClass} onClick={() => remove(r)}>
                        {t("fixed.delete")}
                      </button>
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 text-sm font-medium">{t("fixed.monthlyTotal", { amount: money(monthlyTotal) })}</p>
          </>
        )}
      </section>
    </div>
  );
}
