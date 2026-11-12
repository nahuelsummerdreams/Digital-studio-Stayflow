import { Header } from "@/components/Header";
import { Precios } from "@/components/precios";
import { Faq, FinalCta, Footer, Hero, Strip } from "@/components/sections";
import { DailyOps } from "@/components/daily";
import { Showcase } from "@/components/showcase";
import { Proximamente } from "@/components/soon";
import { StickyBuy } from "@/components/sticky";

/** The funnel, in order: promise and action → proof in numbers → the product, seen → the offer (and how to add more) → what is coming → doubts → the action again. */
export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Strip />
        <Showcase />
        <DailyOps />
        <Precios />
        <Proximamente />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      <StickyBuy />
    </>
  );
}
