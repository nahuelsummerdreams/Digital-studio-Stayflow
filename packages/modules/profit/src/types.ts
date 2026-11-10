import type { Minor } from "@stayflow/money";
export type { Minor };

export interface Income {
  propertyId: string;
  amount: Minor;
  nights: number;
  date: string; // YYYY-MM-DD
}

export interface Expense {
  propertyId: string | null; // null = shared across the organization
  amount: Minor;
  date: string; // YYYY-MM-DD
  category?: string;
}

export interface PropertySummary {
  propertyId: string;
  revenue: Minor;
  expenses: Minor;
  net: Minor;
  nights: number;
  marginPct: number; // 0..100, 0 when there is no revenue
}

export interface MonthSummary {
  month: string; // YYYY-MM
  revenue: Minor;
  expenses: Minor;
  net: Minor;
}
