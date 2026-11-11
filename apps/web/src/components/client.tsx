"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { Icon } from "@stayflow/ui";
import { track } from "@/lib/analytics";
import { AVAILABLE_LIST, MULTIPACK_PERCENT, PACKS, SUPPORT_PRICE, PRODUCTS, type ProductId } from "@/lib/catalog";
import { saveLead, type LeadSource } from "@/lib/leads";
import { supportTotal, usd } from "@/lib/pricing";
import { fmt, plural } from "@/i18n";
import { useMessages } from "@/i18n/client";
import { Breakdown, CartButton, DiscountMeter, OffersList, useCart } from "./cart";
import { useBurst } from "./effects";
import { btnGhost, btnPrimary } from "./styles";
import { ProductArt } from "./visuals";

export function AddToCart({ id, className = "", wide = false }: { id: ProductId; className?: string; wide?: boolean }) {
  const { m } = useMessages();
  const { has, toggle } = useCart();
  const { fire, layer } = useBurst();
  const on = has(id);
  return (
    <span className={`relative ${wide ? "block w-full" : "block"}`}>
      <button
        type="button"
        onClick={() => {
          if (!on) fire();
          toggle(id);
        }}
        aria-pressed={on}
        className={`${on ? "inline-flex items-center justify-center gap-2 rounded-xl border border-accent bg-accent/10 px-5 py-3 text-sm font-semibold text-accent" : btnPrimary} w-full ${className}`}
      >
        {on ? <Icon name="check" className="h-4 w-4" /> : <Icon name="plus" className="h-4 w-4" />}
        {on ? m.solution.added : m.solution.add}
      </button>
      {layer}
    </span>
  );
}

export function ViewItem({ id }: { id: ProductId }) {
  useEffect(() => track("view_item", { item_id: id, item_name: PRODUCTS[id].name, price: PRODUCTS[id].price, currency: "USD" }), [id]);
  return null;
}

/** Floating bar that appears once something is in the cart, so checkout is always one tap away. */
export function CartBar() {
  const { m, locale } = useMessages();
  const { totals, setOpen } = useCart();
  const count = totals.lines.length;
  if (count === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <button
        type="button"
        onClick={() => { setOpen(true); track("view_cart", { value: totals.total, currency: "USD" }); }}
        className="pointer-events-auto anim-in fx-card fx-hero flex w-full max-w-md items-center gap-3 rounded-2xl px-4 py-3 text-left shadow-2xl"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-accent"><Icon name="wallet" className="h-[18px] w-[18px]" /></span>
        <span className="min-w-0 flex-1 text-sm">
          <span className="block font-semibold">{plural(m.cart, "items", count, locale)}{totals.discountActive && <span className="ml-2 rounded-full bg-success/15 px-2 py-0.5 text-[11px] text-success">−30%</span>}</span>
          <span className="block text-xs text-muted">{totals.appCount === 1 ? m.cart.unlockOne : m.cart.review}</span>
        </span>
        <span className="font-display text-lg tabular-nums">{usd(totals.total)}</span>
      </button>
    </div>
  );
}

export { CartButton };

/** Email capture used by the plans and the checkout while payments are being connected. */
export function LeadForm({ source, items, compact = false }: { source: LeadSource; items?: unknown; compact?: boolean }) {
  const { m } = useMessages();
  const [email, setEmail] = useState("");
  const [trap, setTrap] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (trap) return setState("done"); // bots fill the hidden field; pretend it worked
    setState("sending");
    const ok = await saveLead(email, source, items ?? null);
    if (ok) track("generate_lead", { source });
    setState(ok ? "done" : "error");
  }

  if (state === "done") return <p role="status" className="flex items-center gap-2 text-sm font-medium text-success"><Icon name="check" className="h-4 w-4" />{m.checkout.thanks}</p>;
  return (
    <form onSubmit={submit} className={compact ? "space-y-2" : "space-y-3"}>
      <label className="block text-xs font-medium text-muted">
        {m.checkout.email}
        <input
          type="email"
          required
          maxLength={254}
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          className="mt-1 w-full rounded-xl border border-line bg-bg px-3.5 py-3 text-sm text-fg outline-none transition placeholder:text-muted/60 focus:border-accent focus:shadow-[0_0_0_4px_rgb(var(--accent)/0.15)]"
        />
      </label>
      <input type="text" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" value={trap} onChange={(e) => setTrap(e.target.value)} name="website" />
      <button disabled={state === "sending"} className={`${btnPrimary} w-full disabled:opacity-60`}>{state === "sending" ? m.checkout.sending : m.checkout.submit}</button>
      {state === "error" && <p role="alert" className="text-sm text-danger">{m.checkout.error}</p>}
      {!compact && <p className="text-xs text-muted">{m.checkout.consent}</p>}
    </form>
  );
}

/** Optional monthly support, picked tool by tool. Not live yet: ends in an email capture. */
export function SupportPicker() {
  const { m } = useMessages();
  const [picked, setPicked] = useState<ProductId[]>([]);
  const toggle = (id: ProductId) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const total = supportTotal(picked);
  return (
    <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
      <ul className="grid gap-3 sm:grid-cols-2" aria-label={m.support.pick}>
        {AVAILABLE_LIST.map((p) => {
          const on = picked.includes(p.id);
          return (
            <li key={p.id}>
              <button type="button" aria-pressed={on} onClick={() => toggle(p.id)} className={`fx-card flex w-full items-center gap-3 rounded-2xl p-4 text-left transition ${on ? "!border-accent bg-accent/10" : ""}`}>
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${on ? "border-accent bg-accent text-onaccent" : "border-line"}`}>{on && <Icon name="check" className="h-4 w-4" />}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{p.name}</span>
                </span>
                <span className="whitespace-nowrap text-sm tabular-nums"><b>{usd(SUPPORT_PRICE[p.id])}</b><span className="text-muted">{m.support.perMonth}</span></span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="fx-card fx-hero h-fit rounded-3xl p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{m.support.total}</p>
        <p className="mt-2 flex items-baseline gap-1"><span className="font-display text-gradient text-5xl tabular-nums">{usd(total)}</span><span className="text-sm text-muted">{m.support.perMonth}</span></p>
        {picked.length === 0 ? <p className="mt-3 text-sm text-muted">{m.support.none}</p> : (
          <ul className="mt-3 space-y-1 text-sm text-muted">{picked.map((id) => <li key={id}>{PRODUCTS[id].name.replace("Stayflow ", "")}</li>)}</ul>
        )}
        <ul className="mt-5 space-y-2 border-t border-line pt-5">
          {m.support.includes.map((x) => <li key={x} className="flex items-start gap-2.5 text-sm"><Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-accent" />{x}</li>)}
        </ul>
        <p className="mt-5 text-xs font-medium text-accent">{m.support.soon}</p>
        <div className="mt-3">{picked.length > 0 ? <LeadForm key={picked.join()} source="support" items={{ support: picked }} compact /> : <p className="text-xs text-muted">{m.support.pick}</p>}</div>
      </div>
    </div>
  );
}

export function CheckoutView() {
  const { m, locale } = useMessages();
  const cart = useCart();
  const { totals } = cart;
  useEffect(() => {
    if (totals.lines.length > 0) track("begin_checkout", { value: totals.total, currency: "USD", items: totals.lines.map((l) => l.id) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (totals.lines.length === 0) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <p className="text-lg text-muted">{m.checkout.empty}</p>
        <Link href="/#tools" className={`${btnPrimary} mt-6`}>{m.checkout.back}</Link>
      </div>
    );
  }
  const items = { apps: cart.apps, kit: cart.kit, total: totals.total };
  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="fx-card rounded-3xl p-6 sm:p-8">
        <h2 className="font-display text-2xl">{m.checkout.summary}</h2>
        <ul className="mt-5 divide-y divide-line">
          {totals.lines.map((l) => (
            <li key={l.id} className="flex items-center gap-3 py-3.5">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">{l.name}</p>
                <button type="button" onClick={() => (l.id === "kit" ? cart.setKit(false) : cart.remove(l.id))} className="text-xs text-muted underline-offset-4 hover:underline">{m.cart.remove}</button>
              </div>
              <span className="font-display tabular-nums">{usd(l.price)}</span>
            </li>
          ))}
        </ul>
        <DiscountMeter className="my-5" />
        <Breakdown totals={totals} labels={m.cart} />
        <OffersList className="mt-6" />
      </section>
      <section className="fx-card fx-hero rounded-3xl p-6 sm:p-8">
        <span className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent"><Icon name="clock" className="h-3.5 w-3.5" />{m.checkout.soonTitle}</span>
        <p className="mt-4 text-sm leading-relaxed text-muted">{m.checkout.soonBody}</p>
        <div className="mt-5"><LeadForm source="checkout" items={items} /></div>
      </section>
    </div>
  );
}

export { fmt, MULTIPACK_PERCENT, ProductArt };

/** Puts a ready-made pack in the cart (replacing the apps), so the 30% rule prices it. */
export function AddPack({ pack }: { pack: import("@/lib/catalog").PackId }) {
  const { m } = useMessages();
  const { apps, setApps } = useCart();
  const ids = PACKS[pack].apps;
  const on = ids.length === apps.length && ids.every((id) => apps.includes(id));
  return (
    <button type="button" onClick={() => setApps(ids)} aria-pressed={on} className={`${on ? "inline-flex items-center justify-center gap-2 rounded-xl border border-accent bg-accent/10 px-5 py-3 text-sm font-semibold text-accent" : btnPrimary} w-full`}>
      <Icon name={on ? "check" : "plus"} className="h-4 w-4" />
      {on ? m.packs.inCart : m.packs.add}
    </button>
  );
}

/** Cart drawer + floating bar, mounted once in the layout. */
export { CartDrawer } from "./cart";

/** The main call to action: puts Stayflow Host in the cart and opens it, so the visitor can mix and match right away. */
export function GetHostButton({ className = "", where = "hero" }: { className?: string; where?: string }) {
  const { m } = useMessages();
  const { add, setOpen, totals } = useCart();
  return (
    <button
      type="button"
      onClick={() => {
        add("host");
        setOpen(true);
        track("select_promotion", { where, item_id: "host" });
        void totals;
      }}
      className={`${btnPrimary} gap-2 !px-6 !py-3.5 !text-base ${className}`}
    >
      {fmt(m.hero.getHost, { price: usd(PRODUCTS.host.price) })}
      <Icon name="arrow" className="h-4 w-4" />
    </button>
  );
}

/** Ad-landing CTA: puts one product in the cart and opens it. */
export function GetProductButton({ id, label, where, className = "" }: { id: ProductId; label: string; where: string; className?: string }) {
  const { add, setOpen } = useCart();
  return (
    <button
      type="button"
      onClick={() => {
        add(id);
        setOpen(true);
        track("select_promotion", { where, item_id: id });
      }}
      className={`${btnPrimary} gap-2 !px-6 !py-3.5 !text-base ${className}`}
    >
      {label}
      <Icon name="arrow" className="h-4 w-4" />
    </button>
  );
}

/** "Próximamente" products: nothing to buy, but you can ask to be told the day it is out. That list is also how we learn what to build first. */
export function NotifyButton({ id, className = "", label }: { id: string; className?: string; label?: string }) {
  const { m } = useMessages();
  const [open, setOpen] = useState(false);
  return open ? (
    <div className={className}>
      <LeadForm source={`notify-${id}` as LeadSource} items={{ product: id }} compact />
      <p className="mt-2 text-xs text-muted">{m.soon.consent}</p>
    </div>
  ) : (
    <button type="button" onClick={() => { setOpen(true); track("select_promotion", { where: "soon", item_id: id }); }} className={`${btnGhost} gap-2 ${className}`}>
      <Icon name="bell" className="h-4 w-4" />
      {label ?? m.soon.notify}
    </button>
  );
}
