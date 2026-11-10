import { describe, expect, it } from "vitest";
import { errorKey } from "./errors";
import { translate } from "./index";

describe("translate", () => {
  it("returns plain text and fills variables", () => {
    expect(translate("es", "auth.signIn")).toBe("Iniciar sesión");
    expect(translate("es", "trial.endedTitle", { product: "Stayflow Profit" })).toBe("Tu plan de Stayflow Profit terminó.");
  });
  it("picks singular and plural by count", () => {
    expect(translate("es", "entries.nights", { count: 1 })).toBe("1 noche");
    expect(translate("es", "entries.nights", { count: 5 })).toBe("5 noches");
    expect(translate("es", "entries.nights", { count: 0 })).toBe("0 noches");
    expect(translate("es", "common.trialDays", { count: 1 })).toBe("Prueba gratis: 1 día restante.");
  });
  it("leaves unknown placeholders visible instead of printing undefined", () => {
    expect(translate("es", "trial.title")).toBe("Prueba {product} gratis durante 14 días.");
  });
  it("shows the key itself when a translation is missing", () => {
    expect(translate("es", "nope.missing" as never)).toBe("nope.missing");
  });
});

describe("errorKey", () => {
  it("maps Supabase auth codes", () => {
    expect(errorKey({ code: "invalid_credentials", message: "x" })).toBe("errors.invalidCredentials");
    expect(errorKey({ code: "user_already_exists" })).toBe("errors.userExists");
    expect(errorKey({ code: "over_email_send_rate_limit" })).toBe("errors.rateLimit");
  });
  it("maps permission and network failures", () => {
    expect(errorKey({ code: "42501" })).toBe("errors.noPermission");
    expect(errorKey({ message: 'new row violates row-level security policy for table "x"' })).toBe("errors.noPermission");
    expect(errorKey(new TypeError("Failed to fetch"))).toBe("errors.network");
  });
  it("never throws and always falls back to a generic message", () => {
    expect(errorKey(null)).toBe("errors.generic");
    expect(errorKey("boom")).toBe("errors.generic");
    expect(errorKey({ message: 42 })).toBe("errors.generic");
  });
});
