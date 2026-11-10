"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useI18n, type TFn } from "@stayflow/i18n";
import { AnimatedNumber, Skeleton, Sparkline, activeTabClass, cardClass, errorClass, idleTabClass } from "@stayflow/ui";
import { monthlyComparison, netProfit, profitByProperty } from "../calc";
import { formatMonth, formatMonthShort, formatPct, formatSignedPct } from "../format";
import { formatMoney } from "../money";
import { PERIODS, changePct, inRange, localToday, periodRange, type Period } from "../period";
import type { MonthSummary } from "../types";
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

/** One headline figure. `upIsGood=false` flips the delta color (more spending is not good news). */
function Kpi({
  label,
  value,
  format,
  trend,
  sub,
  delta,
  upIsGood = true,
  hero = false,
  negative = false,
  locale,
  vs,
  className = "",
}: {
  label: string;
  value: number;
  format: (n: number) => string;
  trend?: number[];
  sub?: ReactNode;
  delta?: number | null;
  upIsGood?: boolean;
  hero?: boolean;
  negative?: boolean;
  locale: string;
  vs: string;
  className?: string;
}) {
  const good = delta !== null && delta !== undefined && (upIsGood ? delta >= 0 : delta <= 0);
  return (
    <article className={`fx-card overflow-hidden rounded-card p-4 sm:p-5 ${hero ? "fx-hero" : ""} ${className}`}>
      <p className="text-sm text-muted">{label}</p>
      <p className={`font-display tabular mt-2 text-2xl sm:text-3xl xl:text-4xl ${negative ? "text-danger" : hero ? "text-money" : ""}`}>
        <AnimatedNumber value={value} format={format} />
      </p>
      {trend && trend.length > 1 && <Sparkline values={trend} className="mt-3 h-9 w-full" />}
      {delta !== null && delta !== undefined && (
        <p className={`mt-2 text-sm font-medium ${good ? "text-success" : "text-danger"}`}>
          {formatSignedPct(delta, locale)} <span className="font-normal text-muted">{vs}</span>
        </p>
      )}
      {sub && <p className="mt-2 text-sm text-muted">{sub}</p>}
    </article>
  );
}

/** Income vs expenses per month. Plain HTML bars: no chart library, prints and scales cleanly. */
function MonthlyChart({ months, money, locale, t }: { months: MonthSummary[]; money: (n: number) => string; locale: string; t: TFn }) {
  const max = Math.max(1, ...months.flatMap((m) => [m.revenue, m.expenses]));
  const h = (n: number) => (n <= 0 ? "0%" : `max(3px, ${(n / max) * 100}%)`);
  return (
    <section className={cardClass}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-medium">{t("overview.chartTitle")}</h2>
        <p className="flex items-center gap-4 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <i className="h-2.5 w-2.5 rounded-sm" style={{ background: "linear-gradient(180deg, rgb(var(--accent)), rgb(var(--accent-2)))" }} />
            {t("overview.legendIncome")}
          </span>
          <span className="flex items-center gap-1.5">
            <i className="h-2.5 w-2.5 rounded-sm bg-danger/70" />
            {t("overview.legendExpense")}
          </span>
        </p>
      </div>
      <div role="img" aria-label={t("overview.chartLabel")} className="mt-6 flex h-52 items-end gap-2 sm:gap-4">
        {months.map((m, i) => (
          <div key={m.month} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2" title={`${formatMonth(m.month, locale)}: ${money(m.net)}`}>
            <div className="flex h-full w-full items-end justify-center gap-1">
              <div
                className="bar-grow w-full max-w-7 rounded-t-md"
                style={{
                  height: h(m.revenue),
                  background: "linear-gradient(180deg, rgb(var(--accent)), rgb(var(--accent-2) / 0.65))",
                  boxShadow: "0 0 24px -6px rgb(var(--accent) / 0.55)",
                  animationDelay: `${i * 70}ms`,
                }}
              />
              <div className="bar-grow w-full max-w-7 rounded-t-md bg-danger/70" style={{ height: h(m.expenses), animationDelay: `${i * 70 + 60}ms` }} />
            </div>
            <span className="text-xs text-muted">{formatMonthShort(m.month, locale)}</span>
          </div>
        ))}
      </div>
      {/* The same data as a table, for screen readers. */}
      <table className="sr-only">
        <caption>{t("overview.monthByMonth")}</caption>
        <tbody>
          {months.map((m) => (
            <tr key={m.month}>
              <th scope="row">{formatMonth(m.month, locale)}</th>
              <td>{money(m.revenue)}</td>
              <td>{money(m.expenses)}</td>
              <td>{money(m.net)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export function ProfitOverview({ client, orgId, currency, properties }: Props) {
  const { t, locale } = useI18n();
  const { ledger, loading, error } = useLedger(client, orgId);
  const [period, setPeriod] = useState<Period>("this_month");
  const range = useMemo(() => periodRange(period, localToday()), [period]);

  if (loading) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label={t("overview.loading")}>
        <Skeleton className="h-11 w-full lg:w-96" />
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-card" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-card" />
      </div>
    );
  }
  if (error) return <p role="alert" className={errorClass}>{t("entries.loadError")}</p>;

  const incomes = ledger.incomes.filter((i) => inRange(i.date, range.current));
  const expenses = ledger.expenses.filter((e) => inRange(e.date, range.current));
  const money = (n: number) => formatMoney(n, currency, locale);

  const revenue = incomes.reduce((s, i) => s + i.amount, 0);
  const spent = expenses.reduce((s, e) => s + e.amount, 0);
  const nights = incomes.reduce((s, i) => s + i.nights, 0);
  const net = netProfit(incomes, expenses);

  // Compare with the equivalent earlier period (same number of days, never a half month vs a full one).
  let dNet: number | null = null;
  let dRevenue: number | null = null;
  let dSpent: number | null = null;
  if (range.previous) {
    const pi = ledger.incomes.filter((i) => inRange(i.date, range.previous));
    const pe = ledger.expenses.filter((e) => inRange(e.date, range.previous));
    dNet = changePct(net, netProfit(pi, pe));
    dRevenue = changePct(revenue, pi.reduce((s, i) => s + i.amount, 0));
    dSpent = changePct(spent, pe.reduce((s, e) => s + e.amount, 0));
  }

  const ranking = profitByProperty(properties.map((p) => p.id), incomes, expenses).sort((a, b) => b.net - a.net);
  const bestNet = Math.max(1, ...ranking.map((r) => r.net));
  const months = monthlyComparison(incomes, expenses);
  const nameOf = (id: string) => properties.find((p) => p.id === id)?.name ?? t("properties.archived");
  const noEntriesAtAll = ledger.incomes.length === 0 && ledger.expenses.length === 0;
  const emptyPeriod = incomes.length === 0 && expenses.length === 0;
  const showChart = months.length > 1;

  return (
    <div className="anim-stagger space-y-6">
      <div role="group" aria-label={t("overview.periodLabel")} className="fx-card flex w-full gap-1 overflow-x-auto rounded-xl p-1 lg:w-fit">
        {PERIODS.map((p) => (
          <button
            key={p}
            type="button"
            aria-pressed={period === p}
            onClick={() => setPeriod(p)}
            className={`flex-1 whitespace-nowrap rounded-lg px-2.5 py-2 text-[13px] font-medium transition sm:px-4 sm:text-sm ${period === p ? activeTabClass : idleTabClass}`}
          >
            {t(PERIOD_KEY[p])}
          </button>
        ))}
      </div>

      <section aria-label={t("overview.netProfit")} className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Kpi hero className="col-span-2 xl:col-span-1" negative={net < 0} label={t("overview.netProfit")} value={net} format={money} trend={months.map((m) => m.net)} delta={dNet} locale={locale} vs={t("overview.vsShort")} />
        <Kpi label={t("overview.revenue")} value={revenue} format={money} trend={months.map((m) => m.revenue)} delta={dRevenue} locale={locale} vs={t("overview.vsShort")} />
        <Kpi label={t("overview.spent")} value={spent} format={money} delta={dSpent} upIsGood={false} locale={locale} vs={t("overview.vsShort")} />
        <Kpi
          className="col-span-2 xl:col-span-1"
          label={t("overview.nightsSold")}
          value={nights}
          format={(n) => String(Math.round(n))}
          sub={nights > 0 ? t("overview.perNight", { amount: money(Math.round(net / nights)) }) : undefined}
          locale={locale}
          vs={t("overview.vsShort")}
        />
      </section>

      {(noEntriesAtAll || emptyPeriod) && (
        <p className={`${cardClass} text-sm text-muted`}>{noEntriesAtAll ? t("overview.emptyAll") : t("overview.emptyPeriod")}</p>
      )}

      {!emptyPeriod && (
        <div className="grid gap-4 lg:grid-cols-3">
          {showChart && (
            <div className="lg:col-span-2">
              <MonthlyChart months={months} money={money} locale={locale} t={t} />
            </div>
          )}
          {ranking.length > 0 && (
            <section className={`${cardClass} ${showChart ? "" : "lg:col-span-3"}`}>
              <h2 className="text-sm font-medium">{t("overview.propertiesTitle")}</h2>
              <ul className="mt-4 space-y-5">
                {ranking.map((p) => (
                  <li key={p.propertyId}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="truncate text-sm font-medium">{nameOf(p.propertyId)}</span>
                      <span className={`font-display shrink-0 text-lg ${p.net < 0 ? "text-danger" : ""}`}>{money(p.net)}</span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-bg" aria-hidden>
                      <div
                        className="h-full origin-left rounded-full"
                        style={{
                          width: `${Math.max(0, (p.net / bestNet) * 100)}%`,
                          background: "linear-gradient(90deg, rgb(var(--accent)), rgb(var(--accent-2)))",
                          boxShadow: "0 0 14px rgb(var(--accent) / 0.6)",
                          animation: "grow-x 1s var(--ease) both",
                        }}
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-muted">
                      {t("overview.margin", { pct: formatPct(p.marginPct, locale) })} · {t("entries.nights", { count: p.nights })}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
