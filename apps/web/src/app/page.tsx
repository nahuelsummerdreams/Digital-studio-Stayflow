import { Header } from "@/components/Header";
import { Precios } from "@/components/precios";
import { Apps, Blocks, Faq, FinalCta, Footer, Hero, Pain, Steps, Strip } from "@/components/sections";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Strip />
        <Pain />
        <Blocks />
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
