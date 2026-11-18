import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { NewBooking } from "./types";

type Result = { data: unknown[] | null; error: { code: string; message: string } | null };

/** A stand-in for the Supabase client that records what was selected and answers from a script. */
function fakeClient(answer: (columns: string) => Result) {
  const selects: string[] = [];
  const writes: { op: "insert" | "update"; payload: Record<string, unknown> }[] = [];
  const client = {
    from: () => ({
      select: (columns: string) => {
        selects.push(columns);
        const chain: Record<string, unknown> = {};
        for (const k of ["eq", "order", "limit"]) chain[k] = () => chain;
        chain.returns = () => Promise.resolve(answer(columns));
        return chain;
      },
      insert: (payload: Record<string, unknown>) => {
        writes.push({ op: "insert", payload });
        return Promise.resolve({ error: null });
      },
      update: (payload: Record<string, unknown>) => {
        writes.push({ op: "update", payload });
        return { eq: () => Promise.resolve({ error: null }) };
      },
    }),
  } as unknown as SupabaseClient;
  return { client, selects, writes };
}

const row = (extra: Record<string, unknown> = {}) => ({
  id: "b1", property_id: "p1", guest_name: "Ana", guest_email: "", guest_phone: "", guests_count: 2, check_in: "2026-12-01", check_out: "2026-12-04", nights: 3,
  source: "direct", status: "confirmed", amount_minor: 100000, notes: "", created_at: "2026-11-01T10:00:00Z", paid_minor: 0, kind: "stay", external_uid: null, ...extra,
});
const missingColumn = { data: null, error: { code: "42703", message: "column bookings.deposit_due_on does not exist" } };

// The loader remembers that the columns are missing, so each test starts from a fresh copy of the module.
beforeEach(() => vi.resetModules());
const load = () => import("./data");

describe("booking due dates: loading", () => {
  it("reads the due dates when the database has them", async () => {
    const { client, selects } = fakeClient(() => ({ data: [row({ deposit_due_on: "2026-11-20", balance_due_on: "2026-11-28" })], error: null }));
    const { loadBookings } = await load();
    const [b] = await loadBookings(client, "o1");
    expect(selects[0]).toContain("deposit_due_on");
    expect(b).toMatchObject({ depositDueOn: "2026-11-20", balanceDueOn: "2026-11-28" });
  });

  it("falls back to the old columns when migration 0035 is not applied, and remembers it", async () => {
    const { client, selects } = fakeClient((columns) => (columns.includes("deposit_due_on") ? missingColumn : { data: [row()], error: null }));
    const { loadBookings } = await load();
    const first = await loadBookings(client, "o1");
    expect(first).toHaveLength(1);
    expect(first[0]).toMatchObject({ depositDueOn: null, balanceDueOn: null });
    expect(selects).toHaveLength(2); // tried with the new columns, retried without
    await loadBookings(client, "o1");
    expect(selects).toHaveLength(3); // the next load goes straight to the old columns
    expect(selects[2]).not.toContain("deposit_due_on");
  });

  it("does not hide a different error behind the fallback", async () => {
    const { client, selects } = fakeClient(() => ({ data: null, error: { code: "42501", message: "permission denied" } }));
    const { loadBookings } = await load();
    await expect(loadBookings(client, "o1")).rejects.toMatchObject({ code: "42501" });
    expect(selects).toHaveLength(1);
  });
});

describe("booking due dates: saving", () => {
  const base: NewBooking = { propertyId: "p1", guestName: "Ana", guestEmail: "", guestPhone: "", guestsCount: 2, checkIn: "2026-12-01", checkOut: "2026-12-04", source: "direct", amount: 100000, notes: "" };

  it("sends no due-date columns when nothing was said about them (so it still works before the migration)", async () => {
    const { client, writes } = fakeClient(() => ({ data: [], error: null }));
    const { addBooking, updateBooking } = await load();
    await addBooking(client, "o1", base);
    await updateBooking(client, "b1", base);
    for (const w of writes) {
      expect(w.payload).not.toHaveProperty("deposit_due_on");
      expect(w.payload).not.toHaveProperty("balance_due_on");
    }
  });

  it("sets a date, and clears one with null", async () => {
    const { client, writes } = fakeClient(() => ({ data: [], error: null }));
    const { addBooking, updateBooking } = await load();
    await addBooking(client, "o1", { ...base, depositDueOn: "2026-11-20", balanceDueOn: "2026-11-28" });
    await updateBooking(client, "b1", { ...base, depositDueOn: null });
    expect(writes[0]?.payload).toMatchObject({ deposit_due_on: "2026-11-20", balance_due_on: "2026-11-28" });
    expect(writes[1]?.payload).toMatchObject({ deposit_due_on: null });
    expect(writes[1]?.payload).not.toHaveProperty("balance_due_on");
  });
});
