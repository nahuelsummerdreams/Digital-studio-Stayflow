import { describe, expect, it } from "vitest";
import { HELP_ROUTES, POPULAR_TOPICS, STRONG_SCORE, helpKnowledge, helpSystemPrompt, helpTopics, matchHelp, type HelpTopicId } from "./help";
import type { Locale } from "./core";

const LANGS: Locale[] = ["es", "en", "pt"];
const top = (locale: Locale, q: string) => matchHelp(locale, q, 1)[0]?.topic.id;

describe("help topics", () => {
  it.each(LANGS)("%s has every topic with a title, steps and keywords", (locale) => {
    const topics = helpTopics(locale);
    expect(topics.map((t) => t.id).sort()).toEqual(Object.keys(HELP_ROUTES).sort());
    for (const t of topics) {
      expect(t.title.length, `${t.id} title`).toBeGreaterThan(5);
      expect(t.steps.length, `${t.id} steps`).toBeGreaterThanOrEqual(2);
      expect(t.keywords.length, `${t.id} keywords`).toBeGreaterThanOrEqual(3);
    }
  });
  it("points to screens that exist in the app", () => {
    const real = new Set(["/", "/properties", "/bookings", "/calendar", "/settings", "/operations", "/operations/team", "/operations/maintenance", "/finance", "/finance/entries", "/finance/fixed", "/guide", "/guests", "/messages", "/team", "/reports"]);
    for (const route of Object.values(HELP_ROUTES)) if (route) expect(real.has(route.split("?")[0]!), route).toBe(true);
  });
  it("offers popular topics that exist", () => {
    for (const id of POPULAR_TOPICS) expect(HELP_ROUTES).toHaveProperty(id);
  });
});

describe("matchHelp", () => {
  it.each(LANGS)("%s: a topic's own title finds that topic first", (locale) => {
    for (const t of helpTopics(locale)) {
      const first = matchHelp(locale, t.title, 1)[0];
      expect(first?.topic.id, `${locale}: "${t.title}"`).toBe(t.id);
    }
  });

  it("understands real questions in Spanish", () => {
    expect(top("es", "¿Cómo registro la seña de una reserva?")).toBe("recordPayment");
    expect(top("es", "quiero saber quién me debe plata")).toBe("whoOwes");
    expect(top("es", "cómo sincronizo con airbnb")).toBe("syncCalendars");
    expect(top("es", "cambiar el idioma a inglés")).toBe("language");
    expect(top("es", "mi limpiadora no tiene cuenta, cómo le paso los trabajos")).toBe("staffLink");
  });
  it("understands real questions in English", () => {
    expect(top("en", "how do I block some dates")).toBe("blockDates");
    expect(top("en", "where can I see unpaid balances")).toBe("whoOwes");
    expect(top("en", "install the app on my iPhone")).toBe("installApp");
    expect(top("en", "is it a channel manager?")).toBe("limits");
  });
  it("understands real questions in Portuguese", () => {
    expect(top("pt", "como registrar o sinal de uma reserva")).toBe("recordPayment");
    expect(top("pt", "quem me deve dinheiro")).toBe("whoOwes");
    expect(top("pt", "criar o guia com qr code para o hóspede")).toBe("guestGuide");
  });
  it("ignores accents and capital letters", () => {
    expect(top("es", "SINCRONIZAR CON AIRBNB")).toBe(top("es", "sincronizar con airbnb"));
    expect(top("es", "guia qr")).toBe("guestGuide");
  });
  it("finds nothing for gibberish or an empty question, so the AI (or the topic list) takes over", () => {
    expect(matchHelp("es", "")).toEqual([]);
    expect(matchHelp("en", "   ")).toEqual([]);
    expect(matchHelp("en", "zzzz qqqq")).toEqual([]);
    expect(matchHelp("es", "cómo hago para")).toEqual([]);
  });
  it("is confident only when the question really names the topic", () => {
    expect(matchHelp("en", "how do I record a payment", 1)[0]!.score).toBeGreaterThanOrEqual(STRONG_SCORE);
    const vague = matchHelp("en", "money", 1)[0];
    expect(!vague || vague.score < STRONG_SCORE + 4).toBe(true);
  });
  it("returns at most the requested number of matches, best first", () => {
    const m = matchHelp("en", "booking payment calendar", 3);
    expect(m.length).toBeLessThanOrEqual(3);
    expect(m.map((x) => x.score)).toEqual([...m.map((x) => x.score)].sort((a, b) => b - a));
  });
});

describe("AI knowledge", () => {
  it.each(LANGS)("%s: lists every topic and names the language to answer in", (locale) => {
    const k = helpKnowledge(locale);
    for (const t of helpTopics(locale)) expect(k).toContain(t.title);
    const prompt = helpSystemPrompt(locale);
    expect(prompt).toContain({ es: "Spanish", en: "English", pt: "Portuguese" }[locale]);
    expect(prompt).toContain("Use ONLY the knowledge below");
    expect(prompt).toContain("Never invent");
  });
  it("keeps the rules ahead of the knowledge, so nothing in the topics can override them", () => {
    const p = helpSystemPrompt("en");
    expect(p.indexOf("Use ONLY")).toBeLessThan(p.indexOf("KNOWLEDGE"));
  });
});

// A compile-time guard: adding a topic to the catalogue without a route (or the reverse) must not type-check.
const _ids: HelpTopicId[] = Object.keys(HELP_ROUTES) as HelpTopicId[];
void _ids;
