"use client";

import { usePromoOn } from "./promo";
import { useLaunchOn } from "./launch";
import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Icon } from "@stayflow/ui";
import { LAUNCH_KIT, PACKS, PRODUCTS, type ProductId } from "@/lib/catalog";
import { track } from "@/lib/analytics";
import { computeTotals, normalizeApps, offers, recommendations, usd, type CartState, type Offer, type Totals } from "@/lib/pricing";
import { fmt, plural } from "@/i18n";
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
  /** Replaces the apps (used by the ready-made packs). */
  setApps: (ids: readonly ProductId[]) => void;
  /** Goes up each time the 30% discount gets unlocked, to trigger the celebration. */
  celebrate: number;
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
  const [celebrate, setCelebrate] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<CartState>;
        setState({ apps: normalizeApps(Array.isArray(parsed.apps) ? parsed.apps : []), kit: false }); // anything not on sale (an old preorder, the kit) is dropped
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
  const setApps = useCallback((ids: readonly ProductId[]) => {
    setState((s) => ({ ...s, apps: normalizeApps(ids) }));
    track("select_promotion", { items: ids });
  }, []);
  const clear = useCallback(() => setState({ apps: [], kit: false }), []);

  const promoOn = usePromoOn();
  const launchOn = useLaunchOn();
  const totals = useMemo(() => computeTotals(state, promoOn, launchOn), [state, promoOn, launchOn]);
  const wasActive = useRef(false);
  useEffect(() => {
    if (!ready) return;
    if (totals.discountActive && !wasActive.current) setCelebrate((n) => n + 1);
    wasActive.current = totals.discountActive;
  }, [totals.discountActive, ready]);
  const value = useMemo<CartApi>(
    () => ({ ...state, totals, open, setOpen, has: (id) => state.apps.includes(id), toggle, add, remove, setKit, setApps, celebrate, clear }),
    [state, totals, open, toggle, add, remove, setKit, setApps, celebrate, clear],
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
  const text = totals.launchHost ? m.launch.applied : totals.promoPack ? m.promo.applied : totals.discountActive ? m.cart.unlocked : m.cart.unlockOne;
  return (
    <p className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${totals.discountActive ? "bg-success/12 text-success" : "bg-accent/10 text-accent"} ${className}`} role="status">
      <Icon name={totals.discountActive ? "check" : "sparkles"} className="h-4 w-4 shrink-0" />
      {text}
    </p>
  );
}

/** Price breakdown: original, discount, saved, final. Used by the drawer, the builder and the checkout. */
export function Breakdown({ totals, labels, className = "" }: { totals: Totals; labels: { original: string; discount: string; saved: string; total: string }; className?: string }) {
  const { m } = useMessages();
  return (
    <dl className={`space-y-2 text-sm ${className}`}>
      <div className="flex justify-between"><dt className="text-muted">{labels.original}</dt><dd className={`tabular-nums ${totals.discountActive ? "text-muted line-through" : ""}`}>{usd(totals.originalTotal)}</dd></div>
      {totals.discountActive && (
        <>
          <div className="flex justify-between text-success"><dt>{totals.launchHost ? m.launch.discountLabel : totals.promoPack ? m.promo.discountLabel : labels.discount}</dt><dd className="tabular-nums">−{usd(totals.discount)}</dd></div>
          <div className="flex justify-between font-medium text-success"><dt>{labels.saved}</dt><dd className="tabular-nums">{usd(totals.saved)}</dd></div>
        </>
      )}
      <div className="flex items-baseline justify-between border-t border-line pt-3"><dt className="font-semibold">{labels.total}</dt><dd className="font-display text-2xl tabular-nums">{usd(totals.total)}</dd></div>
    </dl>
  );
}

/** Upsell and downsell suggestions for what is in the cart. They sit inside the cart, never in the way. */
export function OffersList({ className = "" }: { className?: string }) {
  const { m, locale } = useMessages();
  const cart = useCart();
  const launchOn = useLaunchOn();
  const list = offers({ apps: cart.apps, kit: cart.kit }, 2, launchOn);
  if (list.length === 0) return null;

  const render = (o: Offer): { text: string; label: string; run: () => void } => {
    if (o.kind === "unlock") {
      const name = PRODUCTS[o.id].name;
      const text = o.extra < 0 ? fmt(m.offers.unlockCheaper, { name, amount: usd(-o.extra) }) : fmt(m.offers.unlock, { name, price: usd(o.extra) });
      return { text, label: m.offers.add, run: () => cart.add(o.id) };
    }
    if (o.kind === "pack") {
      const count = plural(m.offers, o.moreApps === 1 ? "packOne" : "packMany", o.moreApps, locale);
      return { text: fmt(m.offers.pack, { pack: m.packs.list[o.pack].name, count: fmt(count, { count: o.moreApps }), extra: usd(o.extra) }), label: m.offers.switch, run: () => cart.setApps(PACKS[o.pack].apps) };
    }
    return { text: fmt(m.offers.drop, { name: PRODUCTS[o.id].name, saving: usd(o.saving) }), label: m.offers.remove, run: () => cart.remove(o.id) };
  };

  return (
    <section aria-label={m.offers.title} className={className}>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted">{m.offers.title}</h3>
      <ul className="space-y-2">
        {list.map((o) => {
          const r = render(o);
          return (
            <li key={`${o.kind}-${"id" in o ? o.id : o.pack}`} className={`flex items-center gap-3 rounded-2xl border p-3.5 ${o.kind === "drop" ? "border-line bg-surface/60" : "border-accent/40 bg-accent/8"}`}>
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${o.kind === "drop" ? "bg-line/60 text-muted" : "bg-accent/15 text-accent"}`}><Icon name={o.kind === "drop" ? "trendDown" : "trendUp"} className="h-4 w-4" /></span>
              <p className="min-w-0 flex-1 text-sm leading-snug">{r.text}</p>
              <button type="button" onClick={r.run} className="shrink-0 rounded-lg border border-accent/50 px-3 py-1.5 text-xs font-semibold text-accent transition hover:bg-accent hover:text-onaccent">{r.label}</button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Slide-over cart with live prices and upsells that don't get in the way. */
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
      <aside role="dialog" aria-modal="true" aria-label={m.cart.title} className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-bg shadow-2xl anim-in border-l border-line">
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
                      <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">{l.name}</p>
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

          <OffersList />

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
