import { Announce, Benefits, Compare, Faq, FinalCta, Footer, Header, Hero, Kit, MultiPack, Plans, Problem, Solution } from "@/components/sections";

export default function Home() {
  return (
    <>
      <Announce />
      <Header />
      <main>
        <Hero />
        <Problem />
        <Solution />
        <Compare />
        <MultiPack />
        <Kit />
        <Plans />
        <Benefits />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
