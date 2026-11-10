"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { cardClass, errorClass } from "@stayflow/ui";
import { monthlyComparison, netProfit, profitByProperty } from "../calc";
import { formatMoney } from "../money";
import { useLedger } from "../useLedger";

interface Props {
  client: SupabaseClient;
  orgId: string;
  currency: string;
  properties: { id: string; name: string }[];
}

const monthLabel = (ym: string) =>
  new Date(`${ym}-01T00:00:00Z`).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

export function ProfitOverview({ client, orgId, currency, properties }: Props) {
  const { ledger, loading, error } = useLedger(client, orgId);
  if (loading) return <p className="text-sm text-black/50">Loading your numbers…</p>;
  if (error) return <p role="alert" className={errorClass}>{error}</p>;

  const { incomes, expenses } = ledger;
  const money = (n: number) => formatMoney(n, currency);
  const revenue = incomes.reduce((s, i) => s + i.amount, 0);
  const spent = expenses.reduce((s, e) => s + e.amount, 0);
  const net = netProfit(incomes, expenses);
  const byProperty = profitByProperty(properties.map((p) => p.id), incomes, expenses);
  const months = monthlyComparison(incomes, expenses).reverse();
  const nameOf = (id: string) => properties.find((p) => p.id === id)?.name ?? "Archived property";
  const empty = incomes.length === 0 && expenses.length === 0;

  return (
    <div className="space-y-6">
      <section className={cardClass}>
        <p className="text-sm text-black/60">Net profit, all time</p>
        <p className={`mt-1 font-display text-5xl ${net < 0 ? "text-red-700" : ""}`}>{money(net)}</p>
        <p className="mt-3 text-sm text-black/60">
          {money(revenue)} earned · {money(spent)} spent
        </p>
        {empty && (
          <p className="mt-4 text-sm text-black/60">
            Nothing recorded yet. Add your first booking in <strong className="text-ink">Entries</strong> to see what you
            really earn.
          </p>
        )}
      </section>

      {byProperty.length > 0 && (
        <section className="grid gap-4 sm:grid-cols-2">
          {byProperty.map((p) => (
            <article key={p.propertyId} className="rounded-card border border-line bg-white p-5">
              <h2 className="text-sm font-medium">{nameOf(p.propertyId)}</h2>
              <p className={`mt-2 font-display text-3xl ${p.net < 0 ? "text-red-700" : ""}`}>{money(p.net)}</p>
              <p className="mt-1 text-sm text-black/60">
                {p.marginPct}% margin · {p.nights} nights
              </p>
            </article>
          ))}
        </section>
      )}

      {months.length > 0 && (
        <section className={cardClass}>
          <h2 className="text-sm font-medium">Month by month</h2>
          <ul className="mt-3 divide-y divide-line">
            {months.map((m) => (
              <li key={m.month} className="flex items-center justify-between py-3 text-sm">
                <span>{monthLabel(m.month)}</span>
                <span className={`font-medium ${m.net < 0 ? "text-red-700" : ""}`}>{money(m.net)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
