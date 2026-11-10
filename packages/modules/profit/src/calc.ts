import type { Expense, Income, Minor, MonthSummary, PropertySummary } from "./types";

const sum = (xs: number[]): number => xs.reduce((a, b) => a + b, 0);
const monthOf = (isoDate: string): string => isoDate.slice(0, 7);

export function netProfit(incomes: Income[], expenses: Expense[]): Minor {
  return sum(incomes.map((i) => i.amount)) - sum(expenses.map((e) => e.amount));
}

export function marginPct(revenue: Minor, net: Minor): number {
  return revenue > 0 ? Math.round((net / revenue) * 1000) / 10 : 0;
}

/**
 * Profit per property. Shared expenses (propertyId = null) are split equally across
 * the properties passed in `propertyIds`, so the per-property net adds up to the total.
 */
export function profitByProperty(
  propertyIds: string[],
  incomes: Income[],
  expenses: Expense[],
): PropertySummary[] {
  if (propertyIds.length === 0) return [];
  const shared = sum(expenses.filter((e) => e.propertyId === null).map((e) => e.amount));
  const base = Math.floor(shared / propertyIds.length);
  let remainder = shared - base * propertyIds.length; // spread leftover cents so totals match

  return propertyIds.map((id) => {
    const revenue = sum(incomes.filter((i) => i.propertyId === id).map((i) => i.amount));
    const nights = sum(incomes.filter((i) => i.propertyId === id).map((i) => i.nights));
    const own = sum(expenses.filter((e) => e.propertyId === id).map((e) => e.amount));
    const share = base + (remainder-- > 0 ? 1 : 0);
    const exp = own + share;
    const net = revenue - exp;
    return { propertyId: id, revenue, expenses: exp, net, nights, marginPct: marginPct(revenue, net) };
  });
}

/** Month-by-month totals, ascending. Months with no activity are not invented. */
export function monthlyComparison(incomes: Income[], expenses: Expense[]): MonthSummary[] {
  const map = new Map<string, MonthSummary>();
  const bucket = (m: string): MonthSummary => {
    let b = map.get(m);
    if (!b) map.set(m, (b = { month: m, revenue: 0, expenses: 0, net: 0 }));
    return b;
  };
  for (const i of incomes) bucket(monthOf(i.date)).revenue += i.amount;
  for (const e of expenses) bucket(monthOf(e.date)).expenses += e.amount;
  return [...map.values()]
    .map((b) => ({ ...b, net: b.revenue - b.expenses }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

export interface BreakEvenInput {
  fixedCostsMonthly: Minor;
  nightlyRate: Minor;
  variableCostPerNight: Minor; // cleaning, supplies, utilities per night
  platformCommissionPct: number; // e.g. 3 for 3%
}

/** Nights per month needed to cover fixed costs. Returns null if each night loses money. */
export function breakEvenNights(i: BreakEvenInput): number | null {
  const commission = Math.round((i.nightlyRate * i.platformCommissionPct) / 100);
  const contribution = i.nightlyRate - commission - i.variableCostPerNight;
  if (contribution <= 0) return null;
  return Math.ceil(i.fixedCostsMonthly / contribution);
}

export interface RateInput {
  fixedCostsMonthly: Minor;
  variableCostPerNight: Minor;
  targetProfitMonthly: Minor;
  expectedNightsMonthly: number;
  platformCommissionPct: number; // must be < 100
}

/**
 * Minimum nightly rate that reaches the target profit at the expected occupancy,
 * after the platform takes its commission. Rounded up to a whole currency unit.
 */
export function suggestedNightlyRate(i: RateInput): Minor | null {
  if (i.expectedNightsMonthly <= 0 || i.platformCommissionPct >= 100) return null;
  const netNeededPerNight =
    (i.fixedCostsMonthly + i.targetProfitMonthly) / i.expectedNightsMonthly + i.variableCostPerNight;
  const gross = netNeededPerNight / (1 - i.platformCommissionPct / 100);
  return Math.ceil(gross / 100) * 100;
}

export function occupancyPct(nightsBooked: number, daysInPeriod: number): number {
  if (daysInPeriod <= 0) return 0;
  return Math.min(100, Math.round((nightsBooked / daysInPeriod) * 1000) / 10);
}

/** Simple projection: average net of the last `window` months, repeated forward. */
export function projectNet(history: MonthSummary[], monthsAhead: number, window = 3): Minor[] {
  const recent = history.slice(-window);
  if (recent.length === 0) return Array.from({ length: monthsAhead }, () => 0);
  const avg = Math.round(sum(recent.map((m) => m.net)) / recent.length);
  return Array.from({ length: monthsAhead }, () => avg);
}
