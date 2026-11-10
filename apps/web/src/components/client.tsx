"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { Icon } from "@stayflow/ui";
import { track } from "@/lib/analytics";
import { LAUNCH_KIT, MULTIPACK_PERCENT, PACKS, PLAN_IDS, PLAN_PRICE, PRODUCT_LIST, PRODUCTS, type PlanId, type ProductId } from "@/lib/catalog";
import { saveLead, type LeadSource } from "@/lib/leads";
import { usd } from "@/lib/pricing";
import { fmt, plural } from "@/i18n";
import { useMessages } from "@/i18n/client";
import { Breakdown, CartButton, DiscountMeter, OffersList, useCart } from "./cart";
import { btnGhost, btnPrimary } from "./styles";
import { ProductArt } from "./visuals";

export function AddToCart({ id, className = "", wide = false }: { id: ProductId; className?: string; wide?: boolean }) {
  const { m } = useMessages();
  const { has, toggle } = useCart();
  const on = has(id);
  return (
    <button
      type="button"
      onClick={() => toggle(id)}
      aria-pressed={on}
      className={`${on ? "inline-flex items-center justify-center gap-2 rounded-xl border border-accent bg-accent/10 px-5 py-3 text-sm font-semibold text-accent" : btnPrimary} ${wide ? "w-full" : ""} ${className}`}
    >
      {on ? <Icon name="check" className="h-4 w-4" /> : <Icon name="plus" className="h-4 w-4" />}
      {on ? m.solution.added : m.solution.add}
    </button>
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

/** Pick any tools: the cart updates live, the discount unlocks at two apps. */
export function Builder() {
  const { m, locale } = useMessages();
  const cart = useCart();
  const { totals } = cart;
  const missing = totals.appsToUnlock;
  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div>
        <p className="mb-4 text-sm font-semibold">{m.builder.pick}</p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {PRODUCT_LIST.map((p) => {
            const on = cart.has(p.id);
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => cart.toggle(p.id)}
                  aria-pressed={on}
                  className={`flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition ${on ? "border-accent bg-accent/8 shadow-[0_0_0_3px_rgb(var(--accent)/0.12)]" : "border-line bg-surface hover:border-accent/50"}`}
                >
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${on ? "border-accent bg-accent text-onaccent" : "border-line"}`}>{on && <Icon name="check" className="h-4 w-4" />}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{p.name}</span>
                    <span className="block truncate text-xs text-muted">{m.products[p.id].tagline}</span>
                  </span>
                  <span className="text-sm font-semibold tabular-nums">{usd(p.price)}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 text-xs text-muted">{m.builder.note}</p>
      </div>

      <aside className="fx-card fx-hero h-fit rounded-3xl p-6 lg:sticky lg:top-24" aria-live="polite">
        <h3 className="font-display text-xl">{m.builder.summary}</h3>
        {totals.appCount === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-line p-5 text-center text-sm text-muted">{m.builder.empty}</p>
        ) : (
          <>
            <ul className="mt-4 space-y-2 text-sm">
              {totals.lines.map((l) => (
                <li key={l.id} className="flex justify-between"><span>{l.name}</span><span className="tabular-nums text-muted">{usd(l.price)}</span></li>
              ))}
            </ul>
            <div className="my-4 h-px bg-line" />
            <DiscountMeter className="mb-4" />
            <Breakdown totals={totals} labels={m.builder} />
            <OffersList className="mt-5" />
            <Link href="/checkout" className={`${btnPrimary} mt-5 w-full`}>{m.builder.checkout}</Link>
          </>
        )}
        {missing > 0 && <p className="sr-only">{plural(m.builder, "more", missing, locale)}</p>}
      </aside>
    </div>
  );
}

export function KitButton({ className = "" }: { className?: string }) {
  const { m } = useMessages();
  const { kit, setKit } = useCart();
  return (
    <button type="button" onClick={() => setKit(!kit)} aria-pressed={kit} className={`${kit ? "inline-flex items-center justify-center gap-2 rounded-xl border border-accent bg-accent/10 px-5 py-3 text-sm font-semibold text-accent" : btnPrimary} ${className}`}>
      <Icon name={kit ? "check" : "plus"} className="h-4 w-4" />
      {kit ? m.kit.inCart : `${m.kit.cta} · ${usd(LAUNCH_KIT.price)}`}
    </button>
  );
}

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

export function PlanCta({ plan }: { plan: PlanId }) {
  const { m } = useMessages();
  const [open, setOpen] = useState(false);
  return open ? (
    <LeadForm source={`plan-${plan}` as LeadSource} items={{ plan }} compact />
  ) : (
    <button type="button" onClick={() => setOpen(true)} className={`${btnGhost} w-full`}>{m.plans.notify}</button>
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
                <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">{l.name}{l.preorder && <span className="rounded-full border border-line px-2 py-0.5 text-[10px] font-medium text-muted">{m.cart.preorderTag}</span>}</p>
                <button type="button" onClick={() => (l.id === "kit" ? cart.setKit(false) : cart.remove(l.id))} className="text-xs text-muted underline-offset-4 hover:underline">{m.cart.remove}</button>
              </div>
              <span className="font-display tabular-nums">{usd(l.price)}</span>
            </li>
          ))}
        </ul>
        <DiscountMeter className="my-5" />
        <Breakdown totals={totals} labels={m.cart} />
        <OffersList className="mt-6" />
        <p className="mt-5 text-xs text-muted">{m.checkout.preorderNote}</p>
      </section>
      <section className="fx-card fx-hero rounded-3xl p-6 sm:p-8">
        <span className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent"><Icon name="clock" className="h-3.5 w-3.5" />{m.checkout.soonTitle}</span>
        <p className="mt-4 text-sm leading-relaxed text-muted">{m.checkout.soonBody}</p>
        <div className="mt-5"><LeadForm source="checkout" items={items} /></div>
      </section>
    </div>
  );
}

export { fmt, MULTIPACK_PERCENT, PLAN_IDS, PLAN_PRICE, ProductArt };

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
