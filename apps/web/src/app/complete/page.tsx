import type { Metadata } from "next";
import { Footer } from "@/components/sections";
import {
  CompleteAreas,
  CompleteCalendar,
  CompleteFaq,
  CompleteFinalCta,
  CompleteHeader,
  CompleteHero,
  CompleteHonest,
  CompleteMoney,
  CompletePain,
  CompletePricing,
  CompleteWorld,
} from "@/components/complete/landing";
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
      <main>
        <CompleteHero />
        <CompletePain />
        <CompleteMoney />
        <CompleteCalendar />
        <CompleteAreas />
        <CompleteWorld />
        <CompleteHonest />
        <CompletePricing />
        <CompleteFaq />
        <CompleteFinalCta />
      </main>
      <Footer />
    </>
  );
}
