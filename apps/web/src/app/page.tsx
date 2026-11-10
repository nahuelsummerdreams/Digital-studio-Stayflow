import { Header } from "@/components/Header";
import { Apps, Blocks, Faq, FinalCta, Footer, Hero, Pain, Price, Steps, Strip } from "@/components/sections";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Strip />
        <Pain />
        <Blocks />
        <Price />
        <Apps />
        <Steps />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
