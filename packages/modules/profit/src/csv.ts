export interface CsvRow {
  date: string;
  kind: "income" | "expense";
  property: string;
  detail: string;
  /** Integer minor units (cents). */
  amount: number;
}

const quote = (v: string) => (/[;"\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
/** Spreadsheet-injection guard: a cell that starts like a formula is read as text. */
const safe = (v: string) => (/^[=+\-@\t\r]/.test(v) ? `'${v}` : v);

/**
 * A CSV that opens cleanly in Excel with Spanish settings: `;` separator, decimal comma, UTF-8 with BOM.
 * Expenses come out negative so the column adds up to the net result.
 */
export function entriesCsv(rows: CsvRow[], headers: { date: string; type: string; property: string; detail: string; amount: string; income: string; expense: string }, locale = "es"): string {
  const num = (minor: number) => (minor / 100).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: false });
  const lines = [[headers.date, headers.type, headers.property, headers.detail, headers.amount].map(quote).join(";")];
  for (const r of [...rows].sort((a, b) => a.date.localeCompare(b.date))) {
    lines.push([r.date, r.kind === "income" ? headers.income : headers.expense, safe(r.property), safe(r.detail), num(r.kind === "income" ? r.amount : -r.amount)].map(quote).join(";"));
  }
  return "﻿" + lines.join("\r\n") + "\r\n";
}
