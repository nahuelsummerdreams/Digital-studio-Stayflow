import {
  breakEvenNights,
  formatMoney,
  monthlyComparison,
  netProfit,
  profitByProperty,
  type Expense,
  type Income,
} from "@stayflow/module-profit";
import { PRODUCT_BRAND } from "@stayflow/ui";

// Demo data until the Supabase connection is wired. Amounts are cents.
const properties = [
  { id: "sea", name: "Sea View Loft" },
  { id: "old", name: "Old Town Studio" },
];
const incomes: Income[] = [
  { propertyId: "sea", amount: 142_000, nights: 7, date: "2026-03-08" },
  { propertyId: "sea", amount: 198_500, nights: 9, date: "2026-04-14" },
  { propertyId: "old", amount: 96_000, nights: 6, date: "2026-03-21" },
  { propertyId: "old", amount: 121_000, nights: 8, date: "2026-04-25" },
];
const expenses: Expense[] = [
  { propertyId: "sea", amount: 38_000, date: "2026-03-30", category: "cleaning" },
  { propertyId: "sea", amount: 52_000, date: "2026-04-30", category: "cleaning" },
  { propertyId: "old", amount: 24_000, date: "2026-03-30", category: "cleaning" },
  { propertyId: null, amount: 60_000, date: "2026-04-01", category: "taxes" },
];

export default function Home() {
  const brand = PRODUCT_BRAND.profit;
  const net = netProfit(incomes, expenses);
  const byProperty = profitByProperty(properties.map((p) => p.id), incomes, expenses);
  const months = monthlyComparison(incomes, expenses);
  const breakEven = breakEvenNights({
    fixedCostsMonthly: 80_000,
    nightlyRate: 21_000,
    variableCostPerNight: 3_500,
    platformCommissionPct: 3,
  });
  const nameOf = (id: string) => properties.find((p) => p.id === id)?.name ?? id;

  return (
    <main className="mx-auto max-w-3xl px-5 pb-16 pt-10">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">{brand.name}</p>
      <h1 className="mt-3 font-display text-4xl leading-tight">{brand.tagline}</h1>

      <section className="mt-8 rounded-card border border-line bg-white p-6">
        <p className="text-sm text-black/60">Net profit, last 2 months</p>
        <p className="mt-1 font-display text-5xl">{formatMoney(net)}</p>
        <p className="mt-3 text-sm text-black/60">
          Break-even: <strong className="text-ink">{breakEven ?? "—"} nights</strong> per month at the current rate.
        </p>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        {byProperty.map((p) => (
          <article key={p.propertyId} className="rounded-card border border-line bg-white p-5">
            <h2 className="text-sm font-medium">{nameOf(p.propertyId)}</h2>
            <p className="mt-2 font-display text-3xl">{formatMoney(p.net)}</p>
            <p className="mt-1 text-sm text-black/60">
              {p.marginPct}% margin · {p.nights} nights
            </p>
          </article>
        ))}
      </section>

      <section className="mt-6 rounded-card border border-line bg-white p-6">
        <h2 className="text-sm font-medium">Month by month</h2>
        <ul className="mt-3 divide-y divide-line">
          {months.map((m) => (
            <li key={m.month} className="flex items-center justify-between py-3 text-sm">
              <span>{m.month}</span>
              <span className="font-medium">{formatMoney(m.net)}</span>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-8 text-xs text-black/40">Demo data. Connect Supabase to see your own numbers.</p>

      <footer className="mt-10 flex items-center justify-between rounded-card bg-ink px-6 py-5">
        <span className="text-xs uppercase tracking-[0.2em] text-white/50">A product by</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/digital-studio-logo-white.svg" alt="Digital Studio" className="h-7 w-auto" />
      </footer>
    </main>
  );
}
