"use client";

import { useEffect, useState } from "react";
import { HOST_LAUNCH_PRICE, PRODUCTS, launchEndsAt, launchIsOn } from "@/lib/catalog";
import { usd } from "@/lib/pricing";
import { fmt } from "@/i18n";
import { useMessages } from "@/i18n/client";

/**
 * True while the Host launch price lasts. It starts as "on" when the launch is configured (so the page does not flash the regular price),
 * is corrected right after load with the real clock, and turns itself off at the deadline.
 */
export function useLaunchOn(): boolean {
  const [on, setOn] = useState(() => launchEndsAt() !== null);
  useEffect(() => {
    const end = launchEndsAt();
    const check = () => setOn(launchIsOn(Date.now(), end));
    check();
    if (end === null) return;
    const id = setInterval(check, 30_000);
    return () => clearInterval(id);
  }, []);
  return on;
}

/** The price Host is sold at right now, as a number. */
export function useHostPrice(): number {
  return useLaunchOn() ? HOST_LAUNCH_PRICE : PRODUCTS.host.price;
}

/** "30 de noviembre", in Argentina time so every visitor reads the same day. */
function endDay(): string {
  const end = launchEndsAt();
  if (end === null) return "";
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", timeZone: "America/Argentina/Buenos_Aires" }).format(new Date(end));
}

/** "USD 38" while the launch lasts, "USD 49" afterwards. */
export function HostPrice() {
  return <>{usd(useHostPrice())}</>;
}

/** The honest launch line: it ends on a real date and the price then goes back. Renders nothing when there is no launch. */
export function LaunchNote({ className = "" }: { className?: string }) {
  const { m } = useMessages();
  const on = useLaunchOn();
  if (!on) return null;
  return <span className={className}>{fmt(m.launch.until, { date: endDay(), regular: usd(PRODUCTS.host.price) })}</span>;
}

/** Replaces {price} in a text with the Host price that applies right now. */
export function PriceText({ template }: { template: string }) {
  const price = usd(useHostPrice());
  return <>{template.replace("{price}", price)}</>;
}

/** The regular price, struck through, only while the launch price is on. */
export function RegularPrice({ className = "" }: { className?: string }) {
  const on = useLaunchOn();
  if (!on) return null;
  return <span className={`tabular-nums text-muted line-through ${className}`}>{usd(PRODUCTS.host.price)}</span>;
}

/** A small pill: "Precio de lanzamiento · hasta el 30 de noviembre. Después vuelve a USD 49." */
export function LaunchBadge({ className = "", showRegular = false }: { className?: string; showRegular?: boolean }) {
  const { m } = useMessages();
  const on = useLaunchOn();
  if (!on) return null;
  return (
    <p className={`inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-0.5 rounded-xl border border-[rgb(var(--accent-2)/0.5)] bg-[rgb(var(--accent-2)/0.1)] px-3 py-1.5 text-xs ${className}`}>
      <span aria-hidden className="pulse-lime h-1.5 w-1.5 shrink-0 rounded-full bg-[rgb(var(--accent-2))]" />
      {showRegular && <RegularPrice />}
      <span className="font-semibold text-[rgb(var(--accent-2))]">{m.launch.badge}</span>
      <LaunchNote className="text-fg/80" />
    </p>
  );
}

/** A product's price. Host shows the launch price while it lasts; every other product shows its list price. */
export function ProductPrice({ id, price }: { id: string; price: number }) {
  const hostPrice = useHostPrice();
  return <>{usd(id === "host" ? hostPrice : price)}</>;
}
