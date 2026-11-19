/** What a monthly cost adds up to over `months` months. Negative, fractional or non-numeric input counts as nothing. */
export function monthlyCost(monthly: number, months: number): number {
  if (!Number.isFinite(monthly) || !Number.isFinite(months) || monthly <= 0 || months <= 0) return 0;
  return Math.round(monthly * months);
}

/** How much more the monthly route costs than one payment over `months` months (0 when it does not cost more). */
export function savingsAfter(monthly: number, months: number, oncePrice: number): number {
  return Math.max(0, monthlyCost(monthly, months) - Math.max(0, oncePrice));
}
