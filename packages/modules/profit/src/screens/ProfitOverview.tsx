"use client";

import { useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useI18n } from "@stayflow/i18n";
import { activeTabClass, cardClass, errorClass, idleTabClass } from "@stayflow/ui";
import { monthlyComparison, netProfit, profitByProperty } from "../calc";
import { formatMonth, formatPct, formatSignedPct } from "../format";
import { formatMoney } from "../money";
import { PERIODS, changePct, inRange, localToday, periodRange, type Period } from "../period";
import { useLedger } from "../useLedger";

interface Props {
  client: SupabaseClient;
  orgId: string;
  currency: string;
  properties: { id: string; name: string }[];
}

const PERIOD_KEY = {
  this_month: "overview.thisMonth",
  last_month: "overview.lastMonth",
  this_year: "overview.thisYear",
  all: "overview.all",
} as const;

export function ProfitOverview({ client, orgId, currency, properties }: Props) {
  const { t, locale } = useI18n();
  const { ledger, loading, error } = useLedger(client, orgId);
  const [period, setPeriod] = useState<Period>("this_month");
  const range = useMemo(() => periodRange(period, localToday()), [period]);

  if (loading) return <p className="text-sm text-muted">{t("overview.loading")}</p>;
  if (error) return <p role="alert" className={errorClass}>{t("entries.loadError")}</p>;

  const incomes = ledger.incomes.filter((i) => inRange(i.date, range.current));
  const expenses = ledger.expenses.filter((e) => inRange(e.date, range.current));
  const money = (n: number) => formatMoney(n, currency, locale);

  const revenue = incomes.reduce((s, i) => s + i.amount, 0);
  const spent = expenses.reduce((s, e) => s + e.amount, 0);
  const net = netProfit(incomes, expenses);

  // Compare with the equivalent earlier period (same number of days, never a half month vs a full one).
  let delta: number | null = null;
  if (range.previous) {
    const prev = netProfit(
      ledger.incomes.filter((i) => inRange(i.date, range.previous)),
      ledger.expenses.filter((e) => inRange(e.date, range.previous)),
    );
    delta = changePct(net, prev);
  }

  const byProperty = profitByProperty(properties.map((p) => p.id), incomes, expenses);
  const months = monthlyComparison(incomes, expenses).reverse();
  const nameOf = (id: string) => properties.find((p) => p.id === id)?.name ?? t("properties.archived");
  const noEntriesAtAll = ledger.incomes.length === 0 && ledger.expenses.length === 0;
  const emptyPeriod = incomes.length === 0 && expenses.length === 0;

  return (
    <div className="space-y-6">
      <div role="group" aria-label={t("overview.periodLabel")} className="flex gap-1 overflow-x-auto rounded-xl border border-line bg-surface p-1">
        {PERIODS.map((p) => (
          <button
            key={p}
            type="button"
            aria-pressed={period === p}
            onClick={() => setPeriod(p)}
            className={`flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
              period === p ? activeTabClass : idleTabClass
            }`}
          >
            {t(PERIOD_KEY[p])}
          </button>
        ))}
      </div>

      <section className={cardClass}>
        <p className="text-sm text-muted">{t("overview.netProfit")}</p>
        <p className={`mt-1 font-display text-5xl ${net < 0 ? "text-danger" : "text-money"}`}>{money(net)}</p>
        <p className="mt-3 text-sm text-muted">{t("overview.earnedSpent", { earned: money(revenue), spent: money(spent) })}</p>
        {delta !== null && (
          <p className={`mt-2 text-sm font-medium ${delta >= 0 ? "text-success" : "text-danger"}`}>
            {formatSignedPct(delta, locale)} <span className="font-normal text-muted">{t("overview.vsPrevious")}</span>
          </p>
        )}
        {noEntriesAtAll ? (
          <p className="mt-4 text-sm text-muted">{t("overview.emptyAll")}</p>
        ) : (
          emptyPeriod && <p className="mt-4 text-sm text-muted">{t("overview.emptyPeriod")}</p>
        )}
      </section>

      {!emptyPeriod && byProperty.length > 0 && (
        <section className="grid gap-4 sm:grid-cols-2">
          {byProperty.map((p) => (
            <article key={p.propertyId} className="rounded-card border border-line bg-surface p-5">
              <h2 className="text-sm font-medium">{nameOf(p.propertyId)}</h2>
              <p className={`mt-2 font-display text-3xl ${p.net < 0 ? "text-danger" : ""}`}>{money(p.net)}</p>
              <p className="mt-1 text-sm text-muted">
                {t("overview.margin", { pct: formatPct(p.marginPct, locale) })} · {t("entries.nights", { count: p.nights })}
              </p>
            </article>
          ))}
        </section>
      )}

      {months.length > 1 && (
        <section className={cardClass}>
          <h2 className="text-sm font-medium">{t("overview.monthByMonth")}</h2>
          <ul className="mt-3 divide-y divide-line">
            {months.map((m) => (
              <li key={m.month} className="flex items-center justify-between py-3 text-sm">
                <span>{formatMonth(m.month, locale)}</span>
                <span className={`font-medium ${m.net < 0 ? "text-danger" : ""}`}>{money(m.net)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
