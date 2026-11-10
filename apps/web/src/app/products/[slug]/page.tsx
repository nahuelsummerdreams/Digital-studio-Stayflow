import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@stayflow/ui";
import { AddToCart, ViewItem } from "@/components/client";
import { btnGhost } from "@/components/styles";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/precios";
import { Footer } from "@/components/sections";
import { ProductArt } from "@/components/visuals";
import { CROSS_SELL, MULTIPACK_PERCENT, PRODUCT_IDS, PRODUCTS, type ProductId } from "@/lib/catalog";
import { usd } from "@/lib/pricing";
import { fmt, getMessages } from "@/i18n";

const m = getMessages();

export function generateStaticParams() {
  return PRODUCT_IDS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (!(slug in PRODUCTS)) return {};
  const id = slug as ProductId;
  const p = PRODUCTS[id];
  const title = fmt(m.meta.productTitle, { name: p.name });
  const description = `${m.products[id].tagline}. ${m.products[id].problem} ${m.products[id].benefits.join(". ")}.`;
  return { title, description, alternates: { canonical: `/products/${id}` }, openGraph: { title, description, type: "website" } };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!(slug in PRODUCTS)) notFound();
  const id = slug as ProductId;
  const p = PRODUCTS[id];
  const c = m.products[id];
  const live = p.status === "available";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: c.tagline,
    brand: { "@type": "Brand", name: "Stayflow" },
    offers: { "@type": "Offer", price: p.price, priceCurrency: "USD", availability: live ? "https://schema.org/InStock" : "https://schema.org/PreOrder" },
  };
  const rows: [string, string][] = [
    [m.productPage.howItWorks, c.delivery],
    [m.productPage.requirements, c.requirements],
    [m.productPage.support, c.support],
    [m.productPage.availability, live ? m.productPage.liveNote : m.productPage.preorderNote],
  ];
  return (
    <>
      <Header />
      <ViewItem id={id} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="mx-auto max-w-6xl px-5 py-10 md:py-16">
        <Link href="/#tools" className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-fg"><Icon name="chevronLeft" className="h-4 w-4" />{m.productPage.back}</Link>
        <div className="mt-8 grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${live ? "bg-accent text-onaccent" : "border border-line bg-surface text-muted"}`}>{live ? m.solution.live : m.solution.preorder}</span>
            <h1 className="font-display mt-5 text-4xl leading-[1.08] md:text-6xl">{p.name}</h1>
            <p className="mt-4 text-xl text-muted">{c.tagline}</p>
            <p className="mt-6 flex items-baseline gap-2"><span className="font-display text-gradient text-6xl tabular-nums">{usd(p.price)}</span><span className="text-sm text-muted">{m.solution.oneTime}</span></p>
            <div className="mt-6 flex flex-wrap gap-3">
              <AddToCart id={id} className="!px-7 !py-3.5 !text-base" />
              {live && p.appUrl && <a href={p.appUrl} target="_blank" rel="noopener noreferrer" className={`${btnGhost} !px-6 !py-3.5 !text-base`}>{m.productPage.openApp}<Icon name="arrow" className="h-4 w-4" /></a>}
            </div>
            <p className="mt-5 rounded-2xl border border-accent/25 bg-accent/8 px-4 py-3 text-sm"><span className="font-semibold text-accent">{m.productPage.compareTitle}.</span> <span className="text-muted">{fmt(m.productPage.compareBody)}</span></p>
          </div>
          <div className="fx-card fx-hero overflow-hidden rounded-[28px]"><div className="h-80"><ProductArt id={id} /></div></div>
        </div>

        <div className="mt-16 grid gap-10 lg:grid-cols-[1fr_1fr]">
          <section>
            <h2 className="font-display text-2xl">{m.productPage.whatYouGet}</h2>
            <ul className="mt-5 space-y-3">
              {c.benefits.map((b) => <li key={b} className="flex items-start gap-3"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success"><Icon name="check" className="h-3 w-3" /></span>{b}</li>)}
            </ul>
            <h2 className="font-display mt-10 text-2xl">{m.productPage.features}</h2>
            <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
              {c.features.map((f) => <li key={f} className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3.5 py-3 text-sm"><Icon name="check" className="h-4 w-4 shrink-0 text-accent" />{f}</li>)}
            </ul>
          </section>
          <section className="space-y-4">
            {rows.map(([k, v]) => (
              <div key={k} className="fx-card rounded-2xl p-5"><h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{k}</h3><p className="mt-2 text-sm leading-relaxed">{v}</p></div>
            ))}
          </section>
        </div>

        {CROSS_SELL[id].length > 0 && (
          <section className="mt-20">
            <h2 className="font-display text-2xl">{m.productPage.alsoNeed}</h2>
            <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{CROSS_SELL[id].map((x) => <ProductCard key={x} id={x} />)}</div>
          </section>
        )}
        <p className="mt-12 text-center text-xs text-muted">{MULTIPACK_PERCENT}% · {m.productPage.compareBody}</p>
      </main>
      <Footer />
    </>
  );
}
