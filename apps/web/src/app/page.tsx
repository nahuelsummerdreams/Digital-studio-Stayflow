import { Header } from "@/components/Header";
import { Precios } from "@/components/precios";
import { Proximamente } from "@/components/soon";
import { Blocks, Faq, FinalCta, Footer, Hero, Pain, Steps, Strip, Ticker } from "@/components/sections";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Strip />
        <Ticker />
        <Pain />
        <Blocks />
        <Precios />
        <Proximamente />
        <Steps />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
