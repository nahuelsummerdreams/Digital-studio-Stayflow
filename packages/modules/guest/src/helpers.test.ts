import { describe, expect, it } from "vitest";
import { asCategory, completeness, groupPlaces, guideUrl, isLinkablePhone, normalizeUrl, phoneDigits, telLink, whatsappLink } from "./helpers";
import type { GuideFields } from "./types";

const empty: GuideFields = {
  title: "T", welcome: "W", accent: "blue", wifiName: "", wifiPassword: "", checkin: "", checkout: "",
  houseRules: "", safety: "", hostName: "", hostPhone: "",
};

describe("phones", () => {
  it("keeps digits and drops the 00 prefix", () => {
    expect(phoneDigits("+34 600 123 456")).toBe("34600123456");
    expect(phoneDigits("0034 600-123-456")).toBe("34600123456");
  });
  it("builds WhatsApp and tel links only for plausible numbers", () => {
    expect(whatsappLink("+34 600 123 456")).toBe("https://wa.me/34600123456");
    expect(telLink("+34 600 123 456")).toBe("tel:+34600123456");
    expect(whatsappLink("123")).toBeNull();
    expect(whatsappLink("")).toBeNull();
    expect(isLinkablePhone("1234567890123456")).toBe(false);
  });
});

describe("normalizeUrl", () => {
  it("adds https and keeps valid links", () => {
    expect(normalizeUrl("maps.google.com/place")).toBe("https://maps.google.com/place");
    expect(normalizeUrl("http://example.com")).toBe("http://example.com/");
    expect(normalizeUrl("  ")).toBe("");
  });
  it("rejects dangerous or malformed links", () => {
    expect(normalizeUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeUrl("data:text/html,<script>")).toBeNull();
    expect(normalizeUrl("mailto:a@b.com")).toBeNull();
    expect(normalizeUrl("ftp://example.com")).toBeNull();
    expect(normalizeUrl("localhost")).toBeNull();
    expect(normalizeUrl("https://" + "a".repeat(600) + ".com")).toBeNull();
  });
});

describe("guideUrl", () => {
  it("joins base and slug without double slashes", () => {
    expect(guideUrl("https://guest.stayflow.app/", "abc123def456")).toBe("https://guest.stayflow.app/g/abc123def456");
  });
});

describe("completeness", () => {
  it("is 0% for an empty guide and lists everything missing", () => {
    const c = completeness(empty, []);
    expect(c.pct).toBe(0);
    expect(c.missing).toEqual(["wifi", "checkin", "checkout", "rules", "host", "places", "faq"]);
  });
  it("counts each part once and reaches 100%", () => {
    const full: GuideFields = { ...empty, wifiName: "W", checkin: "c", checkout: "o", houseRules: "r", hostPhone: "+34600123456" };
    const c = completeness(full, [{ kind: "place" }, { kind: "faq" }, { kind: "faq" }]);
    expect(c).toEqual({ pct: 100, missing: [] });
    expect(completeness({ ...empty, wifiName: "x" }, []).pct).toBe(14);
  });
  it("ignores whitespace-only fields", () => {
    expect(completeness({ ...empty, wifiName: "   " }, []).pct).toBe(0);
  });
});

describe("places", () => {
  it("falls back to 'other' for unknown categories", () => {
    expect(asCategory("restaurant")).toBe("restaurant");
    expect(asCategory("nonsense")).toBe("other");
  });
  it("groups in a stable order and drops empty groups", () => {
    const g = groupPlaces([{ category: "activity" }, { category: "restaurant" }, { category: "weird" }, { category: "restaurant" }]);
    expect(g.map((x) => [x.category, x.items.length])).toEqual([["restaurant", 2], ["activity", 1], ["other", 1]]);
  });
});

import { guideT, localizeGuide, pickGuideLang } from "./languages";
import type { PublicGuide } from "./types";

describe("guide languages", () => {
  const base: PublicGuide = {
    title: "Casa", welcome: "Bienvenidos", accent: "blue", propertyName: "Casa", city: null, wifiName: "", wifiPassword: "",
    checkin: "A las 15", checkout: "A las 11", houseRules: "", safety: "", hostName: "", hostPhone: "",
    translations: { en: { welcome: "Welcome", checkin: "  " } },
    items: [{ kind: "faq", category: "", title: "¿Hay estacionamiento?", body: "Sí", url: "", translations: { en: { title: "Is there parking?" } } }],
  };
  it("picks the query, then the phone language, then Spanish", () => {
    expect(pickGuideLang("pt", "en-US")).toBe("pt");
    expect(pickGuideLang(undefined, "fr-FR,en;q=0.8")).toBe("en");
    expect(pickGuideLang("xx", "de")).toBe("es");
  });
  it("uses translations and falls back to the base text when empty", () => {
    const en = localizeGuide(base, "en");
    expect(en.welcome).toBe("Welcome");
    expect(en.checkin).toBe("A las 15");
    expect(en.items[0]?.title).toBe("Is there parking?");
    expect(en.items[0]?.body).toBe("Sí");
    expect(localizeGuide(base, "es")).toBe(base);
    expect(localizeGuide(base, "pt").welcome).toBe("Bienvenidos");
  });
  it("translates the fixed labels", () => {
    expect(guideT("en")("guide.rules")).toBe("House rules");
    expect(guideT("pt")("guide.hostedBy", { name: "Ana" })).toBe("Anfitrião: Ana");
    expect(guideT("es")("guide.rules")).toBe("Reglas de la casa");
  });
});
