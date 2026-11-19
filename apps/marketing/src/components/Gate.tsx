"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Icon, PRODUCT_BRAND, STUDIO_BRAND, buttonClass, cardClass, errorClass, inputClass, labelClass } from "@stayflow/ui";
import { checkCode, forget, newDeviceId, readSaved, save, tidyCode, type AccessResult } from "@/lib-access";

const MESSAGE: Record<Exclude<AccessResult, "ok">, string> = {
  invalid: "Ese código no es válido. Revisa que esté completo, con sus tres bloques.",
  revoked: "Este código fue cancelado. Si crees que es un error, escríbenos.",
  full: "Este código ya se está usando en 3 dispositivos. Escríbenos y te ayudamos a cambiar uno.",
  offline: "No pudimos conectarnos. Revisa tu internet e inténtalo de nuevo.",
};

type State = "checking" | "locked" | "open";

/** Shows the app only with a valid code. Once a device is activated it opens straight away; the code is re-checked in the background,
 * so a cancelled code stops working and a lost connection never locks a paying customer out. */
export function Gate({ children }: { children: (signOut: () => void) => ReactNode }) {
  const [state, setState] = useState<State>("checking");
  const [input, setInput] = useState("");
  const [error, setError] = useState<Exclude<AccessResult, "ok"> | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const saved = readSaved();
    if (!saved) {
      setState("locked");
      return;
    }
    setState("open"); // optimistic: the customer already activated this device
    void checkCode(saved.code, saved.device).then((r) => {
      if (r === "invalid" || r === "revoked" || r === "full") {
        forget();
        setError(r);
        setState("locked");
      }
    });
  }, []);

  async function activate() {
    const code = tidyCode(input);
    if (code.length < 17) {
      setError("invalid");
      return;
    }
    setBusy(true);
    setError(null);
    const device = readSaved()?.device ?? newDeviceId();
    const r = await checkCode(code, device);
    setBusy(false);
    if (r === "ok") {
      save({ code, device });
      setState("open");
    } else setError(r);
  }

  if (state === "checking")
    return (
      <main className="mx-auto max-w-md px-4 py-24 text-center text-sm text-muted" aria-busy="true">
        Cargando…
      </main>
    );
  if (state === "open")
    return (
      <>
        {children(() => {
          forget();
          setInput("");
          setState("locked");
        })}
      </>
    );

  const brand = PRODUCT_BRAND.marketing;
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
      <p className="text-xs font-medium uppercase tracking-widest text-accent">{STUDIO_BRAND.name}</p>
      <h1 className="font-display mt-1 text-3xl">{brand.name}</h1>
      <p className="mt-2 text-sm text-muted">{brand.tagline}</p>

      <form
        className={`${cardClass} mt-8 space-y-4`}
        onSubmit={(e) => {
          e.preventDefault();
          void activate();
        }}
      >
        <label className="block">
          <span className={labelClass}>Tu código de acceso</span>
          <input
            className={inputClass + " font-mono tracking-wider"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="MK-XXXX-XXXX-XXXX"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={24}
            aria-invalid={error ? true : undefined}
          />
        </label>
        {error && (
          <p className={errorClass} role="alert">
            {MESSAGE[error]}
          </p>
        )}
        <button type="submit" className={buttonClass + " w-full gap-2"} disabled={busy || input.trim().length === 0}>
          <Icon name="key" className="h-4 w-4" />
          {busy ? "Revisando…" : "Activar"}
        </button>
        <p className="text-xs text-muted">El código te llega por correo después de tu compra. Funciona en hasta 3 dispositivos. Si compraste y no lo recibiste, escríbenos desde el correo de tu compra.</p>
      </form>
    </main>
  );
}
