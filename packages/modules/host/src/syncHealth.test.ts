import { describe, expect, it } from "vitest";
import { agoLabel, syncHealth } from "./syncHealth";

const NOW = Date.parse("2026-11-15T12:00:00Z");
const ago = (min: number) => new Date(NOW - min * 60_000).toISOString();
const linked = (syncedAt: string | null, status: string | null = "ok") => ({ icalUrl: "https://x.test/c.ics", syncedAt, status });

describe("syncHealth", () => {
  it("says nothing when no calendar is linked", () => {
    const h = syncHealth([{ icalUrl: null, syncedAt: null, status: null }], NOW);
    expect(h).toMatchObject({ level: "none", linked: 0, needsAttention: false });
  });
  it("fresh calendars need no notice", () => {
    const h = syncHealth([linked(ago(5)), linked(ago(29))], NOW);
    expect(h.level).toBe("fresh");
    expect(h.needsAttention).toBe(false);
    expect(h.oldestMinutes).toBe(29);
  });
  it("older than 30 minutes is stale, older than 2 hours is old", () => {
    expect(syncHealth([linked(ago(45))], NOW).level).toBe("stale");
    expect(syncHealth([linked(ago(45))], NOW).needsAttention).toBe(true);
    expect(syncHealth([linked(ago(300))], NOW).level).toBe("old");
  });
  it("uses the least recently read calendar", () => {
    const h = syncHealth([linked(ago(2)), linked(ago(200))], NOW);
    expect(h.oldestMinutes).toBe(200);
    expect(h.level).toBe("old");
  });
  it("a calendar never read counts as old", () => {
    const h = syncHealth([linked(null, null)], NOW);
    expect(h.level).toBe("old");
    expect(h.oldestMinutes).toBeNull();
  });
  it("flags read errors and overlaps even when the data is fresh", () => {
    const e = syncHealth([linked(ago(1), "No se pudo leer el calendario (timeout)")], NOW);
    expect(e).toMatchObject({ level: "fresh", errors: 1, needsAttention: true });
    const c = syncHealth([linked(ago(1), "3 se cruzan con reservas tuyas"), linked(ago(2), "2 se cruzan con reservas tuyas")], NOW);
    expect(c).toMatchObject({ conflicts: 5, needsAttention: true });
  });
  it("ignores clocks that are a little ahead", () => {
    expect(syncHealth([linked(new Date(NOW + 60_000).toISOString())], NOW).level).toBe("fresh");
  });
});

describe("agoLabel", () => {
  it("minutes under an hour and a half, hours after", () => {
    expect(agoLabel(0)).toEqual({ unit: "min", n: 1 });
    expect(agoLabel(45)).toEqual({ unit: "min", n: 45 });
    expect(agoLabel(180)).toEqual({ unit: "h", n: 3 });
  });
});
