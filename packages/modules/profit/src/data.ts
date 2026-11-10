import type { SupabaseClient } from "@supabase/supabase-js";
import type { Expense, Income, Minor } from "./types";

export const INCOME_SOURCES = ["airbnb", "booking", "vrbo", "direct", "other"] as const;
export type IncomeSource = (typeof INCOME_SOURCES)[number];

export const EXPENSE_CATEGORIES = [
  "platform_commission",
  "cleaning",
  "utilities",
  "maintenance",
  "supplies",
  "taxes",
  "insurance",
  "mortgage_rent",
  "marketing",
  "other",
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export interface IncomeRow extends Income {
  id: string;
  source: IncomeSource;
}
export interface ExpenseRow extends Expense {
  id: string;
  category: ExpenseCategory;
  description: string | null;
}
export interface Ledger {
  incomes: IncomeRow[];
  expenses: ExpenseRow[];
}

interface IncomeDb {
  id: string;
  property_id: string;
  amount_minor: number;
  nights: number;
  received_on: string;
  source: IncomeSource;
}
interface ExpenseDb {
  id: string;
  property_id: string | null;
  amount_minor: number;
  incurred_on: string;
  category: ExpenseCategory;
  description: string | null;
}

/** Everything Profit needs for one organization. RLS + license gate apply server-side. */
export async function loadLedger(client: SupabaseClient, orgId: string): Promise<Ledger> {
  const [inc, exp] = await Promise.all([
    client
      .from("income_entries")
      .select("id, property_id, amount_minor, nights, received_on, source")
      .eq("org_id", orgId)
      .order("received_on", { ascending: false })
      .returns<IncomeDb[]>(),
    client
      .from("expense_entries")
      .select("id, property_id, amount_minor, incurred_on, category, description")
      .eq("org_id", orgId)
      .order("incurred_on", { ascending: false })
      .returns<ExpenseDb[]>(),
  ]);
  if (inc.error) throw inc.error;
  if (exp.error) throw exp.error;
  return {
    incomes: (inc.data ?? []).map((r) => ({
      id: r.id,
      propertyId: r.property_id,
      amount: Number(r.amount_minor),
      nights: r.nights,
      date: r.received_on,
      source: r.source,
    })),
    expenses: (exp.data ?? []).map((r) => ({
      id: r.id,
      propertyId: r.property_id,
      amount: Number(r.amount_minor),
      date: r.incurred_on,
      category: r.category,
      description: r.description,
    })),
  };
}

export async function addIncome(
  client: SupabaseClient,
  input: { orgId: string; propertyId: string; amount: Minor; nights: number; source: IncomeSource; date: string },
): Promise<void> {
  const { error } = await client.from("income_entries").insert({
    org_id: input.orgId,
    property_id: input.propertyId,
    amount_minor: input.amount,
    nights: input.nights,
    source: input.source,
    received_on: input.date,
  });
  if (error) throw error;
}

export async function addExpense(
  client: SupabaseClient,
  input: {
    orgId: string;
    propertyId: string | null;
    amount: Minor;
    category: ExpenseCategory;
    date: string;
    description?: string;
  },
): Promise<void> {
  const { error } = await client.from("expense_entries").insert({
    org_id: input.orgId,
    property_id: input.propertyId,
    amount_minor: input.amount,
    category: input.category,
    incurred_on: input.date,
    description: input.description?.trim() || null,
  });
  if (error) throw error;
}

export async function removeEntry(client: SupabaseClient, kind: "income" | "expense", id: string): Promise<void> {
  const { error } = await client.from(kind === "income" ? "income_entries" : "expense_entries").delete().eq("id", id);
  if (error) throw error;
}

/** "platform_commission" -> "Platform commission" */
export function humanize(key: string): string {
  const s = key.replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}
