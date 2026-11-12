import { describe, expect, it } from "vitest";
import { hasModule, visibleNav } from "./modules";

describe("hasModule", () => {
  it("shows everything when the list is unknown or empty", () => {
    expect(hasModule(undefined, "reception")).toBe(true);
    expect(hasModule(null, "reception")).toBe(true);
    expect(hasModule([], "reception")).toBe(true);
  });
  it("follows the list when there is one", () => {
    expect(hasModule(["dashboard", "reception"], "reception")).toBe(true);
    expect(hasModule(["dashboard"], "reception")).toBe(false);
  });
  it("items without a module key are always shown", () => {
    expect(hasModule(["dashboard"], undefined)).toBe(true);
  });
});

describe("visibleNav", () => {
  const nav = [{ href: "/", module: "dashboard" }, { href: "/reception", module: "reception" }, { href: "/sync", module: "channels" }, { href: "/x" }];
  it("keeps only what the category has", () => {
    expect(visibleNav(nav, ["dashboard", "reception"]).map((n) => n.href)).toEqual(["/", "/reception", "/x"]);
  });
  it("does not hide anything while modules are not loaded", () => {
    expect(visibleNav(nav, [])).toHaveLength(4);
  });
});
