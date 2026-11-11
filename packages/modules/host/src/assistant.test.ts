import { describe, expect, it } from "vitest";
import { cleanMessages, runAssistant, runTool, type ModelCall, type Snapshot } from "./assistant";
import type { Booking } from "./types";

let n = 0;
const bk = (over: Partial<Booking>): Booking => ({
  id: `b${++n}`, propertyId: "p1", guestName: "Ana", guestEmail: "ana@example.test", guestPhone: "+34600", guestsCount: 2,
  checkIn: "2026-12-05", checkOut: "2026-12-09", nights: 4, source: "airbnb", status: "confirmed", amount: 60_000, notes: "", createdAt: "2026-11-01T10:00:00Z", paid: 0, kind: "stay", externalUid: null, ...over,
});
const snap: Snapshot = {
  today: "2026-11-10", currency: "EUR",
  properties: [{ id: "p1", name: "Casa del Árbol", city: "Gredos" }, { id: "p2", name: "Villa Palmera", city: "Marbella" }],
  bookings: [bk({}), bk({ checkIn: "2026-12-12", checkOut: "2026-12-14", nights: 2, guestName: "Beto" }), bk({ propertyId: "p2", checkIn: "2026-12-01", checkOut: "2026-12-03", nights: 2, guestName: "Carla" }), bk({ checkIn: "2026-12-09", checkOut: "2026-12-11", status: "canceled", guestName: "Cancelada" })],
  tasks: [{ id: "t1", propertyId: "p1", title: "Cambiar sábanas", dueOn: "2026-11-08", done: false, bookingId: null }, { id: "t2", propertyId: null, title: "Hecha", dueOn: null, done: true, bookingId: null }],
};

describe("tools", () => {
  it("free_dates returns the gaps and ignores canceled bookings", () => {
    const r = runTool("free_dates", { property: "casa del arbol".replace("arbol", "árbol"), from: "2026-12-01", to: "2026-12-16" }, snap) as { freeRanges: { from: string; to: string; nights: number }[] };
    expect(r.freeRanges).toEqual([
      { from: "2026-12-01", to: "2026-12-05", nights: 4 },
      { from: "2026-12-09", to: "2026-12-12", nights: 3 },
      { from: "2026-12-14", to: "2026-12-16", nights: 2 },
    ]);
  });
  it("list_bookings never exposes email or phone", () => {
    const rows = runTool("list_bookings", { from: "2026-12-01", to: "2026-12-31" }, snap) as Record<string, unknown>[];
    expect(rows.length).toBe(4);
    expect(JSON.stringify(rows)).not.toMatch(/ana@example|\+34600/);
    expect(rows[0]).toMatchObject({ amount: 600 });
  });
  it("unknown property and bad ranges come back as errors, not exceptions", () => {
    expect(runTool("free_dates", { property: "Nada", from: "2026-12-01", to: "2026-12-05" }, snap)).toHaveProperty("error");
    expect(runTool("free_dates", { property: "Villa", from: "2026-12-05", to: "2026-12-01" }, snap)).toHaveProperty("error");
    expect(runTool("free_dates", { property: "Villa", from: "2026-01-01", to: "2026-12-01" }, snap)).toHaveProperty("error");
    expect(runTool("nope", {}, snap)).toHaveProperty("error");
  });
  it("pending_tasks flags overdue ones", () => {
    expect(runTool("pending_tasks", {}, snap)).toEqual([{ title: "Cambiar sábanas", due: "2026-11-08", overdue: true, property: "Casa del Árbol" }]);
  });
  it("month_summary computes occupancy per property", () => {
    const r = runTool("month_summary", { year: 2026, month: 12 }, snap) as { byProperty: { property: string; occupancyPercent: number }[]; bookedRevenue: number };
    expect(r.byProperty.find((p) => p.property === "Casa del Árbol")!.occupancyPercent).toBeCloseTo((6 / 31) * 100, 0);
    expect(r.bookedRevenue).toBe(1800);
  });
});

describe("conversation", () => {
  it("cleanMessages keeps the tail, starts with a user turn and trims long text", () => {
    const msgs = Array.from({ length: 14 }, (_, i) => ({ role: (i % 2 ? "assistant" : "user") as "user" | "assistant", content: `m${i}` }));
    const out = cleanMessages(msgs);
    expect(out[0]!.role).toBe("user");
    expect(out.length).toBeLessThanOrEqual(10);
    expect(cleanMessages([{ role: "user", content: "x".repeat(5000) }])[0]!.content.length).toBe(1200);
  });

  it("runs the tool loop: the model asks for data, gets it, then answers", async () => {
    const seen: string[] = [];
    const call: ModelCall = async (body) => {
      seen.push(JSON.stringify(body.messages.at(-1)));
      const last = body.messages.at(-1)!;
      if (typeof last.content === "string") return { content: [{ type: "tool_use", id: "tu1", name: "pending_tasks", input: {} }], stop_reason: "tool_use" };
      return { content: [{ type: "text", text: "Tienes 1 tarea vencida: cambiar sábanas." }], stop_reason: "end_turn" };
    };
    const r = await runAssistant({ call, snapshot: snap, orgName: "Mi negocio", messages: [{ role: "user", content: "¿Qué me falta?" }] });
    expect(r.reply).toContain("sábanas");
    expect(r.toolsUsed).toEqual(["pending_tasks"]);
    expect(seen[1]).toContain("Cambiar sábanas");
  });

  it("stops after too many steps", async () => {
    const call: ModelCall = async () => ({ content: [{ type: "tool_use", id: "x", name: "list_properties", input: {} }] });
    const r = await runAssistant({ call, snapshot: snap, orgName: "N", messages: [{ role: "user", content: "hola" }], maxSteps: 3 });
    expect(r.reply).toMatch(/demasiados pasos/);
  });
});
