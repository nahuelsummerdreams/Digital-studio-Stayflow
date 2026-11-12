import { describe, expect, it } from "vitest";
import { applyStarter, guideStarter } from "./starter";
import type { GuideFields } from "./types";

const empty: GuideFields = {
  title: "Hotel Sol", welcome: "", accent: "blue", wifiName: "", wifiPassword: "", checkin: "", checkout: "",
  houseRules: "", safety: "", hostName: "", hostPhone: "",
};

describe("guide starters", () => {
  it("hostel talks about dormitories and lockers, hotel about reception", () => {
    expect(guideStarter("hostel").houseRules).toMatch(/dormitorios/);
    expect(guideStarter("hostel").houseRules).toMatch(/locker/);
    expect(guideStarter("hotel").safety).toMatch(/recepción/);
  });
  it("fills empty fields and keeps the title and wifi untouched", () => {
    const out = applyStarter(empty, "hotel");
    expect(out.welcome).not.toBe("");
    expect(out.checkin).toMatch(/\[hora\]/);
    expect(out.title).toBe("Hotel Sol");
    expect(out.wifiName).toBe("");
  });
  it("never overwrites what the owner already wrote", () => {
    const out = applyStarter({ ...empty, checkin: "Desde las 14:00", houseRules: "Mis reglas" }, "hostel");
    expect(out.checkin).toBe("Desde las 14:00");
    expect(out.houseRules).toBe("Mis reglas");
    expect(out.checkout).not.toBe("");
  });
  it("does not promise services", () => {
    for (const t of ["hotel", "hostel"] as const) {
      const s = JSON.stringify(guideStarter(t));
      expect(s).not.toMatch(/gratis|piscina|spa|garantiz/i);
    }
  });
});
