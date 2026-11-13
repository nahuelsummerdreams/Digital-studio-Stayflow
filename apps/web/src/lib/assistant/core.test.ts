import { describe, expect, it } from "vitest";
import { RateLimiter, TOOLS, actionsFromToolUses, buildSystemPrompt, knowledgeText, recommend, sanitizeCart, sanitizeMessages } from "./core";

describe("sanitizeMessages", () => {
  it("accepts a normal conversation and trims it", () => {
    const out = sanitizeMessages([{ role: "user", content: "  Hola   quiero   ayuda " }]);
    expect(out).toEqual([{ role: "user", content: "Hola quiero ayuda" }]);
  });
  it("rejects wrong shapes, empty text and unknown roles", () => {
    expect(sanitizeMessages(null)).toBeNull();
    expect(sanitizeMessages([])).toBeNull();
    expect(sanitizeMessages([{ role: "system", content: "x" }])).toBeNull();
    expect(sanitizeMessages([{ role: "user", content: "   " }])).toBeNull();
    expect(sanitizeMessages([{ role: "user", content: 5 }])).toBeNull();
    expect(sanitizeMessages(["hola"])).toBeNull();
  });
  it("must end with the visitor and start with the visitor", () => {
    expect(sanitizeMessages([{ role: "user", content: "a" }, { role: "assistant", content: "b" }])).toBeNull();
    const out = sanitizeMessages([{ role: "assistant", content: "hola" }, { role: "user", content: "a" }]);
    expect(out?.[0]?.role).toBe("user");
  });
  it("cuts long messages and keeps only the latest turns", () => {
    const out = sanitizeMessages([{ role: "user", content: "x".repeat(5000) }]);
    expect(out?.[0]?.content.length).toBe(600);
    const many = Array.from({ length: 30 }, (_, i) => ({ role: i % 2 === 0 ? "user" : "assistant", content: `m${i}` }));
    many.push({ role: "user", content: "último" });
    const cut = sanitizeMessages(many);
    expect(cut!.length).toBeLessThanOrEqual(12);
    expect(cut![cut!.length - 1]!.content).toContain("último");
  });
  it("merges consecutive turns of the same role", () => {
    const out = sanitizeMessages([{ role: "user", content: "uno" }, { role: "user", content: "dos" }]);
    expect(out).toHaveLength(1);
    expect(out![0]!.content).toBe("uno\ndos");
  });
});

describe("sanitizeCart", () => {
  it("keeps only apps that are on sale", () => {
    expect(sanitizeCart(["guest", "host", "ai", "nope", 3])).toEqual(["host", "guest"]);
    expect(sanitizeCart("host")).toEqual([]);
  });
});

describe("actionsFromToolUses", () => {
  it("accepts real apps and packs", () => {
    expect(actionsFromToolUses([{ name: "add_apps", input: { ids: ["host", "guest"] } }])).toEqual([{ type: "add_apps", ids: ["host", "guest"] }]);
    expect(actionsFromToolUses([{ name: "set_pack", input: { pack: "essential" } }])).toEqual([{ type: "set_pack", pack: "essential" }]);
    expect(actionsFromToolUses([{ name: "open_checkout", input: {} }])).toEqual([{ type: "open_checkout" }]);
  });
  it("never lets through something that is not sold or does not exist", () => {
    expect(actionsFromToolUses([{ name: "add_apps", input: { ids: ["ai", "website", "kit"] } }])).toEqual([]);
    expect(actionsFromToolUses([{ name: "add_apps", input: { ids: ["ai", "host"] } }])).toEqual([{ type: "add_apps", ids: ["host"] }]);
    expect(actionsFromToolUses([{ name: "set_pack", input: { pack: "free" } }])).toEqual([]);
    expect(actionsFromToolUses([{ name: "delete_everything", input: {} }])).toEqual([]);
    expect(actionsFromToolUses([{ name: "add_apps", input: null }])).toEqual([]);
  });
  it("tool schemas only offer apps that are on sale", () => {
    const addApps = TOOLS.find((t) => t.name === "add_apps")!;
    const ids = (addApps.input_schema.properties as { ids: { items: { enum: string[] } } }).ids.items.enum;
    expect(ids).toEqual(["host", "guest", "profit", "operations"]);
  });
});

describe("RateLimiter", () => {
  it("slows a fast visitor and recovers after the window", () => {
    const l = new RateLimiter(3, 1000, 100);
    expect([1, 2, 3].map((i) => l.check("a", i))).toEqual(["ok", "ok", "ok"]);
    expect(l.check("a", 4)).toBe("slow");
    expect(l.check("b", 5)).toBe("ok");
    expect(l.check("a", 2000)).toBe("ok");
  });
  it("stops everyone when the daily budget is used and resets the next day", () => {
    const l = new RateLimiter(100, 1000, 2);
    const day1 = Date.UTC(2026, 10, 12, 10);
    expect([l.check("a", day1), l.check("b", day1), l.check("c", day1)]).toEqual(["ok", "ok", "full"]);
    expect(l.check("c", day1 + 24 * 3600_000)).toBe("ok");
  });
});

describe("recommend with the launch price", () => {
  it("Host alone costs 38 while the launch lasts", () => {
    const r = recommend("one", "bookings", true);
    expect(r.total).toBe(38);
    expect(r.launch).toBe(true);
    expect(r.discount).toBe(false);
  });
  it("combinations and packs do not stack the launch price", () => {
    const r = recommend("few", "cleaning", true);
    expect(r.launch).toBe(false);
    expect(r.total).toBe(54.6);
  });
});

describe("recommend (guided mode)", () => {
  it("bookings → Host alone, no discount yet", () => {
    const r = recommend("one", "bookings");
    expect(r.ids).toEqual(["host"]);
    expect(r.total).toBe(49);
    expect(r.discount).toBe(false);
  });
  it("cleaning → Host + Operations with the 30% (Operations builds cleanings from Host's bookings)", () => {
    const r = recommend("few", "cleaning");
    expect(r.ids).toEqual(["host", "operations"]);
    expect(r.original).toBe(78);
    expect(r.total).toBe(54.6);
    expect(r.discount).toBe(true);
  });
  it("many properties always get Host as the common panel", () => {
    expect(recommend("many", "profit").ids).toEqual(["host", "profit"]);
    expect(recommend("many", "guests").ids).toEqual(["host", "guest"]);
  });
  it("only ever recommends apps that are on sale", () => {
    for (const s of ["one", "few", "many"] as const) for (const p of ["bookings", "guests", "cleaning", "profit"] as const) {
      for (const id of recommend(s, p).ids) expect(["host", "guest", "profit", "operations"]).toContain(id);
    }
  });
});

describe("what the assistant is told", () => {
  const text = knowledgeText();
  it("states the real prices and pack totals from the catalogue", () => {
    expect(text).toContain("USD 49 pago único");
    expect(text).toContain("cuesta USD 69");
    expect(text).toContain("cuesta USD 89");
  });
  it("marks unfinished apps as not for sale", () => {
    expect(text).toContain("TODAVÍA NO EXISTEN");
    expect(text).toMatch(/NO EXISTEN[^\n]*Stayflow AI/);
    expect(text).not.toMatch(/Stayflow AI \(id "ai"/);
  });
  it("says that payment is not open yet", () => {
    expect(text).toContain("todavía no está abierto");
  });
  it("states the launch price with its real deadline, and drops it after", () => {
    const before = knowledgeText(Date.parse("2026-11-20T12:00:00-03:00"));
    expect(before).toContain("Stayflow Host cuesta USD 38 hasta el 30 de noviembre de 2026");
    expect(before).toContain("después vuelve a USD 49");
    const after = knowledgeText(Date.parse("2026-12-01T12:00:00-03:00"));
    expect(after).toContain("no hay una promoción activa");
    expect(after).not.toContain("USD 38");
  });
  it("is honest about hotels, hostels and cabins", () => {
    expect(text).toContain("Hotels");
    expect(text).toContain("están en desarrollo y todavía no se venden");
  });
  it("the system prompt forbids absolute promises and carries the cart", () => {
    const p = buildSystemPrompt(["host", "guest"]);
    expect(p).toContain("no digas \"cero dobles reservas\"");
    expect(p).toContain("No prometas ingresos");
    expect(p).toContain("USD 51,80");
    expect(buildSystemPrompt([])).toContain("El carrito está vacío");
  });
});
