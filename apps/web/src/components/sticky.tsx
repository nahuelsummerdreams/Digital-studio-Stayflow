"use client";

import { useEffect, useState } from "react";
import { usd } from "@/lib/pricing";
import { GetHostButton } from "./client";
import { useHostPrice } from "./launch";
import { useCart } from "./cart";

/** Phone only: once the hero is gone, a bar keeps the one action in reach. It steps aside when the cart bar is showing. */
export function StickyBuy() {
  const [show, setShow] = useState(false);
  const { totals } = useCart();
  const hostPrice = useHostPrice();
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 700);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (!show || totals.lines.length > 0) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-line/70 bg-bg/90 px-4 py-3 backdrop-blur md:hidden">
      <p className="min-w-0 leading-tight"><span className="block truncate text-sm font-semibold">Stayflow Host</span><span className="text-xs text-muted">{usd(hostPrice)} · pago único</span></p>
      <GetHostButton where="sticky" className="!px-4 !py-2.5 !text-sm" />
    </div>
  );
}
