"use client";

import { useEffect } from "react";

/**
 * One delegated pointer listener for the whole app: it tells the card under the cursor where the cursor is,
 * so CSS can draw the spotlight. Costs nothing when the pointer is not over a card.
 */
export function FxProvider() {
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const card = (e.target as Element | null)?.closest?.(".fx-card") as HTMLElement | null;
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    return () => document.removeEventListener("pointermove", onMove);
  }, []);
  return null;
}
