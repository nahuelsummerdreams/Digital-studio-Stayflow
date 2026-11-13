import { Header } from "@/components/Header";
import { Precios } from "@/components/precios";
import { Faq, FinalCta, Footer, Hero, Strip } from "@/components/sections";
import { DailyOps } from "@/components/daily";
import { Ecosystem } from "@/components/ecosystem";
import { Showcase } from "@/components/showcase";
import { Proximamente } from "@/components/soon";
import { StickyBuy } from "@/components/sticky";

/** The funnel, in order: promise and action → proof in numbers → the ecosystem → the product, seen → the bonuses → the offer (and how to add more) → what is coming → doubts → the action again. */
export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Strip />
        <Ecosystem />
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
