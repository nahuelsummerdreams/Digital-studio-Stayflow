"use client";

import { useMemo } from "react";
import { useI18n } from "@stayflow/i18n";
import { averageOccupancy, type MonthPoint, type OccupancyDay, type OwnerOverview } from "@stayflow/module-host";
import { AreaChart, DonutChart, cardClass } from "@stayflow/ui";

export interface HomeChartData {
  months: MonthPoint[];
  occupancy: OccupancyDay[];
  propertyCount: number;
}

function Card({ title, aside, children, className = "" }: { title: string; aside?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`${cardClass} ${className}`}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[13px] font-medium text-muted">{title}</h2>
        {aside && <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">{aside}</span>}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

const Empty = ({ text }: { text: string }) => <p className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted">{text}</p>;

/**
 * Three pictures of the business under "who owes": how the money splits, how it moved in the last six months,
 * and how full the properties are over the next two weeks. Every chart has a text description and an empty state.
 */
export function HomeCharts({ o, data, money }: { o: OwnerOverview; data: HomeChartData; money: (n: number) => string }) {
  const { t, locale } = useI18n();

  const collected = o.month.collected;
  const overdue = o.pastDue.total;
  const owedOk = Math.max(0, o.owedTotal - overdue);
  const split = collected + owedOk + overdue;
  const pctCollected = split > 0 ? Math.round((collected / split) * 100) : 0;

  const monthLabels = useMemo(() => {
    const f = new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" });
    return data.months.map((m) => f.format(new Date(Date.UTC(m.year, m.month - 1, 1))));
  }, [data.months, locale]);
  const trendHasData = data.months.some((m) => m.collected > 0 || m.expenses > 0);

  const dayFmt = useMemo(() => new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }), [locale]);
  const dayNum = useMemo(() => new Intl.DateTimeFormat(locale, { day: "numeric", timeZone: "UTC" }), [locale]);
  const avg = averageOccupancy(data.occupancy);

  return (
    <div aria-label={t("complete.home.chartsLabel")} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
      <Card title={t("complete.home.chartMoneyTitle")}>
        {split > 0 ? (
          <DonutChart
            describe={t("complete.home.chartMoneyDesc")}
            format={money}
            slices={[
              { label: t("complete.home.chartCollected"), value: collected, color: "rgb(var(--accent-2))" },
              { label: t("complete.home.chartOwedOk"), value: owedOk, color: "rgb(var(--accent))" },
              { label: t("complete.home.chartOverdue"), value: overdue, color: "rgb(var(--danger))" },
            ]}
            center={
              <>
                <span className="font-display tabular text-3xl">{pctCollected} %</span>
                <span className="text-xs text-muted">{t("complete.home.chartMoneyCenter")}</span>
              </>
            }
          />
        ) : (
          <Empty text={t("complete.home.chartMoneyEmpty")} />
        )}
      </Card>

      <Card title={t("complete.home.chartTrendTitle")}>
        {trendHasData ? (
          <>
            <AreaChart
              labels={monthLabels}
              format={money}
              describe={t("complete.home.chartTrendDesc")}
              series={[
                { name: t("complete.home.chartIncome"), values: data.months.map((m) => m.collected), color: "rgb(var(--accent-2))" },
                { name: t("complete.home.chartExpenses"), values: data.months.map((m) => m.expenses), color: "rgb(251 191 36)" },
              ]}
            />
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
              <li className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full" style={{ background: "rgb(var(--accent-2))" }} />{t("complete.home.chartIncome")}</li>
              <li className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full" style={{ background: "rgb(251 191 36)" }} />{t("complete.home.chartExpenses")}</li>
            </ul>
          </>
        ) : (
          <Empty text={t("complete.home.chartTrendEmpty")} />
        )}
      </Card>

      <Card title={t("complete.home.chartOccTitle")} aside={data.propertyCount > 0 ? t("complete.home.chartOccAvg", { pct: avg }) : undefined} className="lg:col-span-2">
        {data.propertyCount > 0 ? (
          <div role="img" aria-label={t("complete.home.chartOccDesc")}>
            <div className="flex h-36 items-end gap-1.5 sm:gap-2" aria-hidden>
              {data.occupancy.map((d, i) => (
                <div
                  key={d.date}
                  title={t("complete.home.chartOccDay", { date: dayFmt.format(new Date(`${d.date}T00:00:00Z`)), busy: d.busy, total: data.propertyCount, pct: d.pct })}
                  className="group relative flex h-full flex-1 items-end rounded-md bg-line/25"
                >
                  <div
                    className="w-full rounded-md transition-[filter] duration-200 group-hover:brightness-125"
                    style={{
                      height: `${Math.max(d.pct, 4)}%`,
                      background: d.pct === 0 ? "rgb(var(--line) / 0.6)" : "linear-gradient(to top, rgb(var(--accent)), rgb(var(--accent-2)))",
                      boxShadow: d.pct >= 70 ? "0 0 16px -4px rgb(var(--accent-2) / 0.7)" : undefined,
                      outline: i === 0 ? "2px solid rgb(var(--accent-2) / 0.6)" : undefined,
                      animation: `fade-up 0.6s var(--ease) ${i * 35}ms both`,
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-1.5 text-[10px] text-muted sm:gap-2" aria-hidden>
              {data.occupancy.map((d) => (
                <span key={d.date} className="flex-1 text-center">{dayNum.format(new Date(`${d.date}T00:00:00Z`))}</span>
              ))}
            </div>
          </div>
        ) : (
          <Empty text={t("complete.home.chartOccEmpty")} />
        )}
      </Card>
    </div>
  );
}
