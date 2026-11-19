import type { Metadata } from "next";
import { Footer } from "@/components/sections";
import {
  CompleteAreas,
  CompleteBonus,
  CompleteCalendar,
  CompleteFaq,
  CompleteFinalCta,
  CompleteHeader,
  CompleteHero,
  CompleteHonest,
  CompleteMoney,
  CompletePain,
  CompletePricing,
  CompleteSteps,
} from "@/components/complete/landing";
import { CostCalc } from "@/components/complete/calc";
import { StickyCta } from "@/components/complete/scenes";
import { getMessages } from "@/i18n";

const m = getMessages().complete;

export const metadata: Metadata = {
  title: m.meta.title,
  description: m.meta.description,
  openGraph: { title: m.meta.title, description: m.meta.description, type: "website" },
  // Kept out of search results until the page is approved and promoted to the home page.
  robots: { index: false, follow: false },
};

/** The single-product landing: promise and price → the problem → the money and the calendar, seen → everything inside → languages → honesty → the offer → doubts → the action again. */
export default function CompletePage() {
  return (
    <>
      <CompleteHeader />
      <main className="overflow-x-clip">
        <CompleteHero />
        <CompletePain />
        <CompleteMoney />
        <CompleteCalendar />
        <CompleteAreas />
        <CompleteBonus />
        <CostCalc />
        <CompleteHonest />
        <CompleteSteps />
        <CompletePricing />
        <CompleteFaq />
        <CompleteFinalCta />
      </main>
      <Footer />
      <StickyCta />
    </>
  );
}
