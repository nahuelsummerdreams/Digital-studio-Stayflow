import { Header } from "@/components/Header";
import { Apps, Faq, Features, FinalCta, Footer, Hero, Pricing, Reveal, Steps } from "@/components/sections";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Reveal />
        <Features />
        <Apps />
        <Steps />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
