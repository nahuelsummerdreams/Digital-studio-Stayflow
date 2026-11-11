import { describe, expect, it } from "vitest";
import { addDays, daysBetween, localToday } from "./dates";
import { checklistToLines, groupJobs, itemsToChecklist, linesToItems, nextStatus, progress, staffLink, summary, toggleItem, turnover, urgency, validateJob, workload } from "./logic";
import type { Job, Staff } from "./types";

let n = 0;
const job = (over: Partial<Job>): Job => ({
  id: `j${++n}`, propertyId: "p1", kind: "cleaning", title: "Limpieza", dueOn: "2026-11-10", status: "pending", assigneeId: null,
  checklist: itemsToChecklist(["a", "b", "c", "d"]), notes: "", bookingId: null, recurringId: null, nextCheckin: null, doneAt: null, ...over,
});

describe("dates", () => {
  it("adds days across borders and uses the local calendar day", () => {
    expect(addDays("2026-12-30", 3)).toBe("2027-01-02");
    expect(daysBetween("2026-11-10", "2026-11-14")).toBe(4);
    expect(localToday(new Date(2026, 10, 9, 23, 30))).toBe("2026-11-09");
  });
});

describe("progress and checklist", () => {
  it("counts ticked lines", () => {
    expect(progress(job({}))).toEqual({ done: 0, total: 4, pct: 0 });
    expect(progress(job({ checklist: toggleItem(toggleItem(job({}).checklist, 0), 2) }))).toEqual({ done: 2, total: 4, pct: 50 });
    expect(progress(job({ checklist: [] })).pct).toBe(0);
  });
  it("toggles one line and leaves the rest", () => {
    const t = toggleItem(itemsToChecklist(["x", "y"]), 1);
    expect(t).toEqual([{ text: "x", done: false }, { text: "y", done: true }]);
  });
  it("turns text into lines and back, trimming and capping", () => {
    expect(linesToItems("  uno \n\n dos\r\ntres  ")).toEqual(["uno", "dos", "tres"]);
    expect(linesToItems("x".repeat(300))[0]).toHaveLength(160);
    expect(linesToItems(Array.from({ length: 80 }, (_, i) => `l${i}`).join("\n"))).toHaveLength(60);
    expect(checklistToLines(itemsToChecklist(["a", "b"]))).toBe("a\nb");
  });
});

describe("urgency and turnover", () => {
  it("tells overdue, today, soon and later", () => {
    const t = "2026-11-10";
    expect(urgency(job({ dueOn: "2026-11-09" }), t)).toBe("overdue");
    expect(urgency(job({ dueOn: "2026-11-09", status: "done" }), t)).not.toBe("overdue");
    expect(urgency(job({ dueOn: "2026-11-10" }), t)).toBe("today");
    expect(urgency(job({ dueOn: "2026-11-15" }), t)).toBe("soon");
    expect(urgency(job({ dueOn: "2026-12-30" }), t)).toBe("later");
  });
  it("flags tight cleanings: the next guest arrives the same day", () => {
    expect(turnover(job({ dueOn: "2026-11-10", nextCheckin: "2026-11-10" }))).toEqual({ days: 0, tight: true });
    expect(turnover(job({ dueOn: "2026-11-10", nextCheckin: "2026-11-13" }))).toEqual({ days: 3, tight: false });
    expect(turnover(job({ nextCheckin: null }))).toBeNull();
    expect(turnover(job({ kind: "maintenance", nextCheckin: "2026-11-10" }))).toBeNull();
  });
});

describe("grouping", () => {
  const t = "2026-11-10";
  const jobs = [
    job({ id: "late", dueOn: "2026-11-08" }),
    job({ id: "calm", dueOn: "2026-11-10", title: "B calm", nextCheckin: "2026-11-14" }),
    job({ id: "tight", dueOn: "2026-11-10", title: "Z tight", nextCheckin: "2026-11-10" }),
    job({ id: "tom", dueOn: "2026-11-11" }),
    job({ id: "wk", dueOn: "2026-11-15" }),
    job({ id: "far", dueOn: "2026-12-20" }),
    job({ id: "fin", dueOn: "2026-11-09", status: "done", doneAt: "2026-11-10T09:00:00Z" }),
  ];
  it("splits by day and puts tight turnovers first", () => {
    const g = groupJobs(jobs, t);
    expect(g.overdue.map((j) => j.id)).toEqual(["late"]);
    expect(g.today.map((j) => j.id)).toEqual(["tight", "calm"]);
    expect(g.tomorrow.map((j) => j.id)).toEqual(["tom"]);
    expect(g.week.map((j) => j.id)).toEqual(["wk"]);
    expect(g.later.map((j) => j.id)).toEqual(["far"]);
    expect(g.done.map((j) => j.id)).toEqual(["fin"]);
  });
  it("summarises the day", () => {
    expect(summary(jobs, t)).toEqual({ overdue: 1, today: 2, doneToday: 1, tight: 1 });
  });
  it("moves a job through its statuses", () => {
    expect(nextStatus("pending")).toBe("in_progress");
    expect(nextStatus("in_progress")).toBe("done");
    expect(nextStatus("done")).toBeNull();
  });
});

describe("team", () => {
  const rosa: Staff = { id: "s1", name: "Rosa", phone: "", token: "tok", active: true };
  it("counts open jobs per person from a day on", () => {
    const w = workload([job({ assigneeId: "s1", dueOn: "2026-11-12" }), job({ assigneeId: "s1", dueOn: "2026-11-11" }), job({ assigneeId: "s1", status: "done" }), job({ assigneeId: "s1", dueOn: "2026-11-01" }), job({ assigneeId: null })], [rosa], "2026-11-10");
    expect(w).toEqual([{ staff: rosa, open: 2, next: "2026-11-11" }]);
  });
  it("builds the private link without double slashes", () => {
    expect(staffLink("https://ops.test/", "abc")).toBe("https://ops.test/t/abc");
  });
});

describe("validateJob", () => {
  it("asks for property, title and a real date", () => {
    expect(validateJob({ propertyId: "", title: "x", dueOn: "2026-11-10" })).toBe("ops.errProperty");
    expect(validateJob({ propertyId: "p", title: "  ", dueOn: "2026-11-10" })).toBe("ops.errTitle");
    expect(validateJob({ propertyId: "p", title: "x", dueOn: "" })).toBe("ops.errDate");
    expect(validateJob({ propertyId: "p", title: "x", dueOn: "2026-11-10" })).toBeNull();
  });
});
