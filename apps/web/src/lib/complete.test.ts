import { describe, expect, it } from "vitest";
import { COMPLETE_LAUNCH_PRICE, COMPLETE_PRICE, completeLaunchEndsAt, completeLaunchIsOn, completeOffer, launchDaysLeft } from "./complete";

const END = Date.parse("2026-12-15T23:59:00-03:00");

describe("COMPLETE price", () => {
  it("is 40 during the launch and 89 afterwards", () => {
    expect(COMPLETE_LAUNCH_PRICE).toBe(40);
    expect(COMPLETE_PRICE).toBe(89);
    const during = completeOffer(Date.parse("2026-11-18T12:00:00-03:00"), END);
    expect(during).toEqual({ launch: true, price: 40, regular: 89, saved: 49, savedPct: 55 });
    const after = completeOffer(Date.parse("2026-12-16T00:00:00-03:00"), END);
    expect(after).toEqual({ launch: false, price: 89, regular: 89, saved: 0, savedPct: 0 });
  });

  it("ends exactly at the deadline: the last minute still has the launch price, the next instant does not", () => {
    expect(completeLaunchIsOn(END - 1, END)).toBe(true);
    expect(completeLaunchIsOn(END, END)).toBe(false);
  });

  it("reads the deadline in Argentina time, so the whole of 15 December counts", () => {
    // 23:30 in Buenos Aires on the 15th is already 16 December in UTC, but the launch is still on.
    expect(completeLaunchIsOn(Date.parse("2026-12-15T23:30:00-03:00"), END)).toBe(true);
    expect(new Date(END).toISOString()).toBe("2026-12-16T02:59:00.000Z");
  });

  it("can be moved or turned off with the environment value, and never invents a launch from a bad value", () => {
    expect(completeLaunchEndsAt(undefined)).toBe(END);
    expect(completeLaunchEndsAt("2027-01-15T23:59:00-03:00")).toBe(Date.parse("2027-01-15T23:59:00-03:00"));
    expect(completeLaunchEndsAt("off")).toBeNull();
    expect(completeLaunchEndsAt("OFF")).toBeNull();
    expect(completeLaunchEndsAt("")).toBeNull();
    expect(completeLaunchEndsAt("not a date")).toBeNull();
    expect(completeOffer(Date.now(), null).price).toBe(89);
  });

  it("counts the days left, a started day counting as one, and never goes below zero", () => {
    expect(launchDaysLeft(Date.parse("2026-11-18T12:00:00-03:00"), END)).toBe(28);
    expect(launchDaysLeft(END - 3_600_000, END)).toBe(1);
    expect(launchDaysLeft(END + 5_000, END)).toBe(0);
    expect(launchDaysLeft(Date.now(), null)).toBe(0);
  });
});
