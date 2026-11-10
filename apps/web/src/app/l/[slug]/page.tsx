import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Icon } from "@stayflow/ui";
import { GetProductButton, ViewItem } from "@/components/client";
import { ProductCover } from "@/components/covers";
import { Footer } from "@/components/sections";
import { ADS, AD_IDS, type AdId } from "@/lib/ads";
import { PRODUCTS } from "@/lib/catalog";
import { usd } from "@/lib/pricing";

export function generateStaticParams() {
  return AD_IDS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (!(slug in ADS)) return {};
  return { title: `${PRODUCTS[slug as AdId].name} · Stayflow`, description: ADS[slug as AdId].sub, robots: { index: false, follow: true } };
}

export default async function AdLanding({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!(slug in ADS)) notFound();
  const id = slug as AdId;
  const a = ADS[id];
  const p = PRODUCTS[id];
  return (
    <>
      <ViewItem id={id} />
      <header className="border-b border-line/50 px-5 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <a href="/" className="font-display text-lg">Stayflow</a>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/digital-studio-logo-white.svg" alt="Digital Studio" className="h-6 w-auto" />
        </div>
      </header>
      <main className="mx-auto grid max-w-5xl items-center gap-10 overflow-x-clip px-5 py-10 pb-28 md:grid-cols-2 md:py-16">
        <div>
          <h1 className="font-display text-4xl leading-[1.08] md:text-5xl">{a.hook}</h1>
          <p className="mt-4 text-lg text-muted">{a.sub}</p>
          <ul className="mt-6 space-y-3">
            {a.points.map((x) => (
              <li key={x} className="flex items-start gap-3"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success"><Icon name="check" className="h-3 w-3" /></span>{x}</li>
            ))}
          </ul>
          <p className="mt-7 flex items-baseline gap-2"><span className="font-display text-gradient text-5xl tabular-nums">{usd(p.price)}</span><span className="text-sm text-muted">pago único · actualizaciones de por vida</span></p>
          <GetProductButton id={id} label={a.cta} where={`ad-${id}`} className="mt-5 hidden md:inline-flex" />
          <p className="mt-4 text-xs text-muted">Garantía de 14 días. Funciona en tu navegador y se instala como app.</p>
        </div>
        <div className="relative"><div aria-hidden className="absolute inset-x-8 top-10 h-64 rounded-full bg-accent/20 blur-3xl" /><div className="relative"><ProductCover id={id} size="lg" /></div></div>
      </main>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line/60 bg-bg/90 p-3 backdrop-blur md:hidden">
        <GetProductButton id={id} label={a.cta} where={`ad-${id}-sticky`} className="w-full" />
      </div>
      <Footer />
    </>
  );
}
