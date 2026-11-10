import { Agentes } from "@/components/agents";
import { Header } from "@/components/Header";
import { Precios } from "@/components/precios";
import { Apps, Blocks, Faq, FinalCta, Footer, Hero, Pain, Steps, Strip, Ticker } from "@/components/sections";

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
        <Agentes />
        <Precios />
        <Apps />
        <Steps />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
