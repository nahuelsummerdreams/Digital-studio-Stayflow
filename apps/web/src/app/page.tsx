import { Header } from "@/components/Header";
import { Apps, Faq, FinalCta, Footer, Hero, Marquee, Pricing, Reveal, Schedule, Steps, System } from "@/components/sections";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Marquee />
        <System />
        <Schedule />
        <Reveal />
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
