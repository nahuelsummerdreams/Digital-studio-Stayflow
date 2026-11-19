import { describe, expect, it } from "vitest";
import { IDEAS } from "./ideas";
import { PLAN_DAYS, defaultProfile, generatePlan, hashtagsFor, planToCsv, planToText, profileIssues, toTag, type LodgingProfile } from "./generator";

const base = (over: Partial<LodgingProfile> = {}): LodgingProfile => ({
  ...defaultProfile(new Date(2026, 11, 1)),
  name: "Cabaña Los Álamos",
  city: "Villa La Angostura",
  capacity: 6,
  amenities: ["jacuzzi", "vista", "mascotas"],
  audiences: ["pareja", "familia"],
  highlight: "una cabaña de madera frente al lago",
  startDate: "2026-12-01",
  ...over,
});

describe("toTag", () => {
  it("removes accents, spaces and symbols", () => {
    expect(toTag("Cabaña Los Álamos")).toBe("cabanalosalamos");
    expect(toTag("Villa La Angostura!")).toBe("villalaangostura");
    expect(toTag("viajarconniños")).toBe("viajarconninos");
  });
});

describe("profileIssues", () => {
  it("asks for name, city and a platform", () => {
    expect(profileIssues({ ...base(), name: "", city: "" })).toEqual(["name", "city"]);
    expect(profileIssues({ ...base(), platforms: [] })).toEqual(["platforms"]);
    expect(profileIssues(base())).toEqual([]);
  });
});

describe("generatePlan", () => {
  it("posts only on the chosen weekdays and inside the 30 days", () => {
    const plan = generatePlan(base({ postsPerWeek: 3 }));
    expect(plan.items.length).toBeGreaterThanOrEqual(12);
    expect(plan.items.length).toBeLessThanOrEqual(14);
    for (const it of plan.items) {
      expect(it.day).toBeGreaterThanOrEqual(1);
      expect(it.day).toBeLessThanOrEqual(PLAN_DAYS);
      expect(["martes", "jueves", "sábado"]).toContain(it.weekday);
    }
  });

  it("posts every day on the 7-a-week plan, with no repeated idea", () => {
    const plan = generatePlan(base({ postsPerWeek: 7 }));
    expect(plan.items).toHaveLength(PLAN_DAYS);
    const ids = plan.items.filter((i) => !i.repeat).map((i) => i.ideaId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("never repeats an idea at 5 a week", () => {
    const plan = generatePlan(base({ postsPerWeek: 5 }));
    expect(plan.items.some((i) => i.repeat)).toBe(false);
    expect(new Set(plan.items.map((i) => i.ideaId)).size).toBe(plan.items.length);
  });

  it("uses amenity and audience ideas only when the owner has them", () => {
    const plan = generatePlan(base({ amenities: [], audiences: [], postsPerWeek: 7 }));
    const ids = plan.items.map((i) => i.ideaId);
    expect(ids.some((i) => i.startsWith("amenity-"))).toBe(false);
    expect(ids.some((i) => i.startsWith("aud-"))).toBe(false);
    const rich = generatePlan(base({ amenities: ["pileta"], audiences: ["pareja"], postsPerWeek: 7 })).items.map((i) => i.ideaId);
    expect(rich).toContain("amenity-pileta");
    expect(rich).toContain("aud-pareja");
  });

  it("gives a post only for the chosen platforms", () => {
    const plan = generatePlan(base({ platforms: ["tiktok"] }));
    for (const it of plan.items) {
      expect(Object.keys(it.posts)).toEqual(["tiktok"]);
      expect(it.posts.tiktok?.hashtags.length).toBeLessThanOrEqual(5);
    }
    const all = generatePlan(base({ platforms: ["tiktok", "instagram", "facebook"] }));
    expect(all.items[0]?.posts.instagram?.hashtags).toHaveLength(10);
    expect(all.items[0]?.posts.facebook?.hashtags).toHaveLength(3);
  });

  it("is deterministic, and the variant changes the picks", () => {
    const a = generatePlan(base());
    const b = generatePlan(base());
    expect(a.items.map((i) => i.ideaId)).toEqual(b.items.map((i) => i.ideaId));
    const c = generatePlan(base({ variant: 1 }));
    expect(c.items.map((i) => i.ideaId)).not.toEqual(a.items.map((i) => i.ideaId));
  });

  it("mixes content types instead of one kind in a row", () => {
    const plan = generatePlan(base({ postsPerWeek: 5 }));
    const kinds = new Set(plan.items.map((i) => i.pillar));
    expect(kinds.size).toBeGreaterThanOrEqual(5);
    expect(Object.values(plan.byPillar).reduce((a, b) => a + b, 0)).toBe(plan.items.length);
  });

  it("writes real text: no empty fields and no unfilled placeholders", () => {
    const plan = generatePlan(base({ postsPerWeek: 7, platforms: ["tiktok", "instagram", "facebook"] }));
    for (const it of plan.items) {
      expect(it.title.length).toBeGreaterThan(5);
      expect(it.hook.length).toBeGreaterThan(5);
      expect(it.steps.length).toBeGreaterThan(0);
      for (const post of Object.values(it.posts)) {
        expect(post?.caption).not.toMatch(/undefined|%CITY%|\{|\}/);
        expect((post?.caption ?? "").length).toBeGreaterThan(20);
      }
    }
  });

  it("starts every sentence with a capital, even the owner's own phrase", () => {
    const plan = generatePlan(base({ postsPerWeek: 7, platforms: ["instagram"] }));
    for (const it of plan.items) {
      const caption = it.posts.instagram?.caption ?? "";
      expect(caption).not.toMatch(/[.!?] [a-záéíóúñ]/);
    }
  });

  it("builds three ad concepts with a headline within 40 characters", () => {
    const plan = generatePlan(base());
    expect(plan.ads).toHaveLength(3);
    for (const ad of plan.ads) {
      expect(ad.headline.length).toBeLessThanOrEqual(40);
      expect(ad.primaryText).not.toMatch(/undefined/);
    }
  });

  it("does not describe pets as a feature in the ad copy", () => {
    const plan = generatePlan(base({ amenities: ["mascotas"] }));
    expect(plan.ads[1]?.primaryText).not.toMatch(/con que aceptamos/);
  });

  it("every idea builds without throwing for a bare profile", () => {
    const ctx = { name: "X", the: "la cabaña", thisKind: "esta cabaña", aKind: "una cabaña", city: "Y", cap: "hasta 2 personas", aud: "para parejas", audPlural: "las parejas", hl: "z", cta: "w" };
    for (const idea of IDEAS) {
      const b = idea.build({ ...ctx, amenity: undefined });
      expect(b.title && b.hook && b.caption && b.steps.length).toBeTruthy();
    }
  });
});

describe("exports", () => {
  it("writes a readable text plan and a CSV with one row per post", () => {
    const p = base({ platforms: ["instagram", "tiktok"] });
    const plan = generatePlan(p);
    expect(planToText(plan, p)).toContain("PLAN DE CONTENIDO");
    const csv = planToCsv(plan, p).split("\r\n");
    expect(csv).toHaveLength(1 + plan.items.length * 2);
    expect(csv[0]).toContain("fecha");
  });
});

describe("hashtagsFor", () => {
  it("starts with the place and has no duplicates", () => {
    const tags = hashtagsFor(base(), "instagram", 0);
    expect(tags[0]).toBe("#turismovillalaangostura");
    expect(new Set(tags).size).toBe(tags.length);
    expect(tags.every((t) => /^#[a-z0-9]+$/.test(t))).toBe(true);
  });
});
