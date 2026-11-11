"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@stayflow/ui";
import { track } from "@/lib/analytics";
import { PRODUCT_LIST, PRODUCTS, type ProductId } from "@/lib/catalog";
import { usd } from "@/lib/pricing";
import { useMessages } from "@/i18n/client";
import { DiscountMeter, OffersList, useCart } from "./cart";
import { HUE, ProductCover } from "./covers";
import { useBurst } from "./effects";
import { btnPrimary } from "./styles";

const MOVE = 8; // px before a press becomes a drag (below that it is a tap)

interface Drag {
  id: ProductId;
  x: number;
  y: number;
}

/**
 * The shelf: every tool as a box on a shelf. Drag one onto "Tu pack" (or tap it) and the ticket grows,
 * the total moves and the 30% unlocks at the second app. Sideways swipes scroll the shelf; a vertical pull picks a box up.
 */
export function Shelf() {
  const { m } = useMessages();
  const cart = useCart();
  const { totals } = cart;
  const basket = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [over, setOver] = useState(false);
  const { fire, layer } = useBurst();
  const press = useRef<{ id: ProductId; x: number; y: number; moved: boolean } | null>(null);

  const inside = (x: number, y: number) => {
    const r = basket.current?.getBoundingClientRect();
    return !!r && x >= r.left - 16 && x <= r.right + 16 && y >= r.top - 16 && y <= r.bottom + 16;
  };

  function add(id: ProductId) {
    if (cart.has(id)) return;
    fire();
    cart.add(id);
    track("add_to_cart", { item_id: id, item_name: PRODUCTS[id].name, price: PRODUCTS[id].price, currency: "USD", from: "shelf" });
  }

  function down(e: ReactPointerEvent<HTMLDivElement>, id: ProductId) {
    if (e.button !== 0) return;
    press.current = { id, x: e.clientX, y: e.clientY, moved: false };
  }

  function move(e: ReactPointerEvent<HTMLDivElement>) {
    const p = press.current;
    if (!p) return;
    if (!p.moved && Math.hypot(e.clientX - p.x, e.clientY - p.y) < MOVE) return;
    if (!p.moved) {
      p.moved = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    setDrag({ id: p.id, x: e.clientX, y: e.clientY });
    setOver(inside(e.clientX, e.clientY));
  }

  function up(e: ReactPointerEvent<HTMLDivElement>) {
    const p = press.current;
    press.current = null;
    if (!p) return;
    if (p.moved && inside(e.clientX, e.clientY)) add(p.id);
    else if (!p.moved) {
      // a tap: a box taps in and out, like the button
      if (cart.has(p.id)) cart.remove(p.id);
      else add(p.id);
    }
    setDrag(null);
    setOver(false);
  }

  function cancel() {
    press.current = null;
    setDrag(null);
    setOver(false);
  }

  // Escape drops whatever is in the air.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && cancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[2rem] border border-line bg-gradient-to-b from-surface/70 to-bg/40 px-2 pb-8 pt-6 sm:px-6">
        <div aria-hidden className="pointer-events-none absolute inset-x-10 top-0 h-40 rounded-full bg-accent/15 blur-3xl" />
        <p className="relative mb-4 flex items-center justify-center gap-2 text-center text-xs font-medium uppercase tracking-[0.2em] text-muted">
          <Icon name="sparkles" className="h-3.5 w-3.5 text-accent" />
          {m.shelf.hint}
        </p>

        <div className="relative -mx-2 overflow-x-auto px-2 pb-2 [scrollbar-width:thin]" role="list" aria-label={m.builder.pick}>
          <div className="relative flex w-max snap-x gap-3 px-2 pt-2">
            {PRODUCT_LIST.map((p) => {
              const on = cart.has(p.id);
              const lifted = drag?.id === p.id;
              return (
                <div key={p.id} role="listitem" className="relative flex w-[11.5rem] shrink-0 snap-center flex-col items-center sm:w-[12.5rem]">
                  <div
                    onPointerDown={(e) => down(e, p.id)}
                    onPointerMove={move}
                    onPointerUp={up}
                    onPointerCancel={cancel}
                    onDragStart={(e) => e.preventDefault()} // the cover images would start a native drag and cancel ours
                    style={{ touchAction: "pan-x" }}
                    className={`relative cursor-grab select-none transition duration-300 active:cursor-grabbing ${lifted ? "scale-95 opacity-30" : ""} ${on ? "opacity-60 saturate-50" : ""}`}
                  >
                    <ProductCover id={p.id} size="sm" />
                    <span aria-hidden className="pointer-events-none absolute -bottom-1 -left-[0.9rem] -right-[0.9rem] z-0 h-3 rounded-full bg-gradient-to-b from-white/30 to-transparent" />
                    {on && <span aria-hidden className="absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-success text-bg shadow-lg"><Icon name="check" className="h-4 w-4" /></span>}
                  </div>
                  <p className="font-display mt-1 text-base">{p.name.replace("Stayflow ", "")}</p>
                  <p className="text-sm tabular-nums text-muted">{usd(p.price)}</p>
                  <button
                    type="button"
                    onClick={() => (on ? cart.remove(p.id) : add(p.id))}
                    aria-pressed={on}
                    className={`mt-2 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${on ? "border-success/50 bg-success/10 text-success" : "border-line bg-surface hover:border-accent hover:text-accent"}`}
                  >
                    <Icon name={on ? "check" : "plus"} className="h-3.5 w-3.5" />
                    {on ? m.shelf.inPack : m.solution.add}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[1.1fr_1fr]">
        <div
          ref={basket}
          aria-live="polite"
          className={`relative min-h-[16rem] rounded-3xl border-2 border-dashed p-6 transition duration-300 ${over ? "scale-[1.02] border-accent bg-accent/10 shadow-[0_0_60px_-10px_rgb(var(--accent)/0.6)]" : totals.appCount > 0 ? "border-accent/40 bg-surface/50" : "border-line bg-surface/30"}`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{m.shelf.basket}</p>
          {totals.appCount === 0 ? (
            <div className="flex min-h-[10rem] flex-col items-center justify-center text-center">
              <span aria-hidden className={`flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed ${over ? "border-accent text-accent" : "border-line text-muted"}`}><Icon name="plus" className="h-6 w-6" /></span>
              <p className="mt-3 font-display text-xl">{over ? m.shelf.dropNow : m.shelf.drop}</p>
              <p className="mt-1 max-w-xs text-sm text-muted">{m.builder.empty}</p>
            </div>
          ) : (
            <ul className="mt-4 flex flex-wrap gap-3">
              {totals.lines.filter((l) => l.id !== "kit").map((l) => (
                <li key={l.id} className="rise-in flex items-center gap-2.5 rounded-2xl border border-line bg-bg/60 py-2 pl-2.5 pr-2">
                  <span aria-hidden className="h-8 w-8 shrink-0 rounded-lg" style={{ background: `linear-gradient(135deg, hsl(${HUE[l.id as ProductId]} 100% 55%), hsl(${HUE[l.id as ProductId]} 100% 30%))` }} />
                  <span className="text-sm font-medium">{l.name.replace("Stayflow ", "")}</span>
                  <button type="button" onClick={() => cart.remove(l.id as ProductId)} aria-label={`${m.cart.remove} ${l.name}`} className="flex h-6 w-6 items-center justify-center rounded-full text-muted transition hover:bg-line/70 hover:text-fg"><Icon name="close" className="h-3.5 w-3.5" /></button>
                </li>
              ))}
            </ul>
          )}
          {layer}
        </div>

        <aside className="fx-card fx-hero rounded-3xl p-6" aria-label={m.shelf.ticket}>
          <h3 className="font-display text-xl">{m.shelf.ticket}</h3>
          {totals.appCount === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-line p-5 text-center text-sm text-muted">{m.shelf.ticketEmpty}</p>
          ) : (
            <>
              <ul className="mt-4 space-y-2 font-mono text-[13px]">
                {totals.lines.map((l) => (
                  <li key={l.id} className="flex items-baseline gap-2"><span>{l.name.replace("Stayflow ", "")}</span><span aria-hidden className="min-w-4 flex-1 border-b border-dotted border-line" /><span className="tabular-nums">{usd(l.price)}</span></li>
                ))}
                {totals.discountActive && <li className="flex items-baseline gap-2 text-success"><span>{m.builder.discount}</span><span aria-hidden className="min-w-4 flex-1 border-b border-dotted border-success/40" /><span className="tabular-nums">−{usd(totals.discount)}</span></li>}
              </ul>
              <div className="my-4 border-t-2 border-dashed border-line" />
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold uppercase tracking-[0.12em]">{m.builder.total}</span>
                <span key={totals.total} className="rise-in font-display text-4xl tabular-nums text-gradient">{usd(totals.total)}</span>
              </div>
              {totals.discountActive && <p className="mt-1 text-right text-sm font-medium text-success">{m.builder.saved} {usd(totals.saved)}</p>}
              <DiscountMeter className="mt-4" />
              <OffersList className="mt-4" />
              <Link href="/checkout" className={`${btnPrimary} mt-5 w-full`}>{m.builder.checkout}</Link>
            </>
          )}
        </aside>
      </div>

      {/* The box in your hand while you drag. */}
      {drag && typeof document !== "undefined" && createPortal(
        <div aria-hidden className="pointer-events-none fixed left-0 top-0 z-[80]" style={{ transform: `translate(${drag.x - 85}px, ${drag.y - 100}px) scale(0.62) rotate(${over ? -4 : 3}deg)`, transformOrigin: "50% 50%", transition: "none" }}>
          <div className={over ? "drop-shadow-[0_0_30px_rgb(var(--accent))]" : "drop-shadow-2xl"}><ProductCover id={drag.id} size="sm" /></div>
        </div>,
        document.body,
      )}
    </div>
  );
}
