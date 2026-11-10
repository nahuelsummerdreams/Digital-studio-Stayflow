"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Icon } from "@stayflow/ui";
import { LAUNCH_KIT, PRODUCTS, type ProductId } from "@/lib/catalog";
import { track } from "@/lib/analytics";
import { computeTotals, normalizeApps, recommendations, usd, type CartState, type Totals } from "@/lib/pricing";
import { plural } from "@/i18n";
import { useMessages } from "@/i18n/client";

const STORAGE_KEY = "stayflow-cart-v1";

interface CartApi extends CartState {
  totals: Totals;
  open: boolean;
  setOpen: (v: boolean) => void;
  has: (id: ProductId) => boolean;
  toggle: (id: ProductId) => void;
  add: (id: ProductId) => void;
  remove: (id: ProductId) => void;
  setKit: (v: boolean) => void;
  clear: () => void;
}

const CartContext = createContext<CartApi | null>(null);

export function useCart(): CartApi {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

/** The cart lives in this browser (localStorage): no account needed to browse and build a pack. */
export function CartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CartState>({ apps: [], kit: false });
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<CartState>;
        setState({ apps: normalizeApps(Array.isArray(parsed.apps) ? parsed.apps : []), kit: parsed.kit === true });
      }
    } catch {
      /* a broken saved cart is just an empty cart */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* private mode: the cart still works for this visit */
    }
  }, [state, ready]);

  const add = useCallback((id: ProductId) => {
    setState((s) => (s.apps.includes(id) ? s : { ...s, apps: normalizeApps([...s.apps, id]) }));
    track("add_to_cart", { item_id: id, item_name: PRODUCTS[id].name, price: PRODUCTS[id].price, currency: "USD" });
  }, []);
  const remove = useCallback((id: ProductId) => {
    setState((s) => ({ ...s, apps: s.apps.filter((x) => x !== id) }));
    track("remove_from_cart", { item_id: id });
  }, []);
  const toggle = useCallback((id: ProductId) => {
    setState((s) => {
      const on = s.apps.includes(id);
      track(on ? "remove_from_cart" : "add_to_cart", { item_id: id, item_name: PRODUCTS[id].name, price: PRODUCTS[id].price, currency: "USD" });
      return { ...s, apps: on ? s.apps.filter((x) => x !== id) : normalizeApps([...s.apps, id]) };
    });
  }, []);
  const setKit = useCallback((v: boolean) => {
    setState((s) => ({ ...s, kit: v }));
    track(v ? "add_to_cart" : "remove_from_cart", { item_id: "kit", item_name: LAUNCH_KIT.name, price: LAUNCH_KIT.price, currency: "USD" });
  }, []);
  const clear = useCallback(() => setState({ apps: [], kit: false }), []);

  const totals = useMemo(() => computeTotals(state), [state]);
  const value = useMemo<CartApi>(
    () => ({ ...state, totals, open, setOpen, has: (id) => state.apps.includes(id), toggle, add, remove, setKit, clear }),
    [state, totals, open, toggle, add, remove, setKit, clear],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/** Header button with the live item count. */
export function CartButton() {
  const { m, locale } = useMessages();
  const { totals, setOpen } = useCart();
  const count = totals.lines.length;
  return (
    <button
      type="button"
      onClick={() => {
        setOpen(true);
        track("view_cart", { value: totals.total, currency: "USD" });
      }}
      aria-label={`${m.cart.open}. ${plural(m.cart, "items", count, locale)}`}
      className="relative flex h-10 items-center gap-2 rounded-xl border border-line bg-surface px-3 text-sm font-medium transition hover:border-accent"
    >
      <Icon name="wallet" className="h-[18px] w-[18px]" />
      <span className="hidden sm:inline">{m.nav.cart}</span>
      {count > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-onaccent">{count}</span>}
    </button>
  );
}

/** Progress toward the 30% discount, shown wherever prices are. */
export function DiscountMeter({ className = "" }: { className?: string }) {
  const { m, locale } = useMessages();
  const { totals } = useCart();
  if (totals.appCount === 0) return null;
  const text = totals.discountActive ? m.cart.unlocked : m.cart.unlockOne;
  return (
    <p className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${totals.discountActive ? "bg-success/12 text-success" : "bg-accent/10 text-accent"} ${className}`} role="status">
      <Icon name={totals.discountActive ? "check" : "sparkles"} className="h-4 w-4 shrink-0" />
      {text}
    </p>
  );
}

/** Price breakdown: original, discount, saved, final. Used by the drawer, the builder and the checkout. */
export function Breakdown({ totals, labels, className = "" }: { totals: Totals; labels: { original: string; discount: string; saved: string; total: string }; className?: string }) {
  return (
    <dl className={`space-y-2 text-sm ${className}`}>
      <div className="flex justify-between"><dt className="text-muted">{labels.original}</dt><dd className={`tabular-nums ${totals.discountActive ? "text-muted line-through" : ""}`}>{usd(totals.originalTotal)}</dd></div>
      {totals.discountActive && (
        <>
          <div className="flex justify-between text-success"><dt>{labels.discount}</dt><dd className="tabular-nums">−{usd(totals.discount)}</dd></div>
          <div className="flex justify-between font-medium text-success"><dt>{labels.saved}</dt><dd className="tabular-nums">{usd(totals.saved)}</dd></div>
        </>
      )}
      <div className="flex items-baseline justify-between border-t border-line pt-3"><dt className="font-semibold">{labels.total}</dt><dd className="font-display text-2xl tabular-nums">{usd(totals.total)}</dd></div>
    </dl>
  );
}

/** Slide-over cart with live prices, upsells that don't get in the way, and the Launch Kit add-on. */
export function CartDrawer() {
  const { m, locale } = useMessages();
  const cart = useCart();
  const { totals, open, setOpen } = cart;
  const recs = recommendations(cart.apps);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, setOpen]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} aria-hidden />
      <aside role="dialog" aria-modal="true" aria-label={m.cart.title} className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-bg shadow-2xl anim-in">
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-display text-xl">{m.cart.title}</h2>
          <button type="button" onClick={() => setOpen(false)} aria-label={m.nav.close} className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-muted transition hover:text-fg">
            <Icon name="close" className="h-4 w-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5">
          {totals.lines.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">{m.cart.empty}</p>
          ) : (
            <>
              <DiscountMeter />
              <ul className="space-y-3">
                {totals.lines.map((l) => (
                  <li key={l.id} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">{l.name}{l.preorder && <span className="rounded-full border border-line px-2 py-0.5 text-[10px] font-medium text-muted">{m.cart.preorderTag}</span>}</p>
                      <button type="button" onClick={() => (l.id === "kit" ? cart.setKit(false) : cart.remove(l.id))} className="mt-0.5 text-xs text-muted underline-offset-4 hover:underline">{m.cart.remove}</button>
                    </div>
                    <span className="font-display text-base tabular-nums">{usd(l.price)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}

          {recs.length > 0 && (
            <section aria-label={m.cart.recommended}>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted">{m.cart.recommended}</h3>
              <ul className="space-y-2">
                {recs.map((id) => (
                  <li key={id} className="flex items-center gap-3 rounded-2xl border border-line bg-surface/60 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{PRODUCTS[id].name}</p>
                      <p className="truncate text-xs text-muted">{m.products[id].tagline}</p>
                    </div>
                    <button type="button" onClick={() => cart.add(id)} className="shrink-0 rounded-lg border border-accent/40 px-3 py-1.5 text-xs font-semibold text-accent transition hover:bg-accent hover:text-onaccent">+ {usd(PRODUCTS[id].price)}</button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {!cart.kit && (
            <button type="button" onClick={() => cart.setKit(true)} className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-accent/50 bg-accent/5 p-3.5 text-left transition hover:bg-accent/10">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent"><Icon name="plus" className="h-5 w-5" /></span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{m.cart.addKit}</span><span className="block text-xs text-muted">{m.cart.kitLine}</span></span>
              <span className="text-sm font-semibold tabular-nums">{usd(LAUNCH_KIT.price)}</span>
            </button>
          )}
        </div>

        {totals.lines.length > 0 && (
          <footer className="space-y-4 border-t border-line bg-surface px-5 py-5">
            <Breakdown totals={totals} labels={m.cart} />
            <Link href="/checkout" onClick={() => setOpen(false)} className="fx-btn flex h-12 w-full items-center justify-center rounded-xl text-base font-semibold text-onaccent">{m.cart.review}</Link>
            <button type="button" onClick={() => setOpen(false)} className="w-full text-center text-sm text-muted underline-offset-4 hover:underline">{m.cart.continue}</button>
          </footer>
        )}
      </aside>
    </div>
  );
}
