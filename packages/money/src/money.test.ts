import { describe, expect, it } from "vitest";
import { formatMoney, formatMoneyExact, parseMoney } from "./index";

const plain = (s: string) => s.replace(/[  ]/g, " ");

describe("money", () => {
  it("formats in Spanish with thousands separators, rounded and exact", () => {
    expect(plain(formatMoney(125_050, "EUR"))).toBe("1.251 €");
    expect(plain(formatMoneyExact(125_050, "EUR"))).toBe("1.250,50 €");
    expect(plain(formatMoneyExact(-20_000, "EUR"))).toBe("-200,00 €");
  });
  it("parses Spanish and English input", () => {
    expect(parseMoney("1.250,50")).toBe(125_050);
    expect(parseMoney("1,250.50")).toBe(125_050);
    expect(parseMoney("1.250")).toBe(125_000);
    expect(parseMoney("€ 80")).toBe(8_000);
    expect(parseMoney("abc")).toBeNull();
  });
});
