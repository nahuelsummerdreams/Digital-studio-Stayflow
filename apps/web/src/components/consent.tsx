"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { captureAttribution } from "@/lib/attribution";
import { PIXEL_ID, loadPixel, readConsent, writeConsent } from "@/lib/meta";

/**
 * Cookie notice, shown only when advertising measurement (the Meta Pixel) is configured.
 * Nothing from Meta loads until the visitor accepts. The choice is remembered and can be changed from the footer.
 */
export function ConsentBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    captureAttribution();
    if (!PIXEL_ID) return;
    const c = readConsent();
    if (c === "granted") loadPixel();
    else if (c === null) setShow(true);
    const reopen = () => setShow(true);
    window.addEventListener("stayflow:cookies", reopen);
    return () => window.removeEventListener("stayflow:cookies", reopen);
  }, []);

  if (!show) return null;
  const choose = (v: "granted" | "denied") => {
    writeConsent(v);
    if (v === "granted") loadPixel();
    setShow(false);
  };
  return (
    <div role="dialog" aria-label="Cookies" className="fixed inset-x-3 bottom-3 z-[75] mx-auto max-w-xl rounded-2xl border border-line bg-surface/95 p-4 shadow-2xl backdrop-blur-xl sm:left-5 sm:right-auto">
      <p className="text-sm leading-relaxed">
        Usamos cookies de medición (Meta) para saber qué anuncios funcionan. Solo se activan si las aceptas.{" "}
        <Link href="/privacidad" className="text-accent underline-offset-4 hover:underline">Más información</Link>
      </p>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={() => choose("granted")} className="fx-btn flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-onaccent">Aceptar</button>
        <button type="button" onClick={() => choose("denied")} className="flex-1 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold transition hover:border-accent">Rechazar</button>
      </div>
    </div>
  );
}

/** Footer link that reopens the cookie choice. */
export function CookieSettings() {
  if (!PIXEL_ID) return null;
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event("stayflow:cookies"))} className="text-xs text-muted underline-offset-4 transition hover:text-fg hover:underline">
      Preferencias de cookies
    </button>
  );
}
