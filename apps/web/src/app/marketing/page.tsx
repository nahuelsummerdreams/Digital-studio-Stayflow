import type { Metadata } from "next";
import { Footer } from "@/components/sections";
import { MarketingSticky } from "@/components/marketing/buy";
import { COPY } from "@/components/marketing/copy";
import {
  MarketingDemo,
  MarketingFaq,
  MarketingFinalCta,
  MarketingHeader,
  MarketingHero,
  MarketingHonest,
  MarketingPain,
  MarketingPricing,
  MarketingSteps,
  MarketingWhat,
} from "@/components/marketing/landing";

export const metadata: Metadata = {
  title: COPY.meta.title,
  description: COPY.meta.description,
  openGraph: { title: COPY.meta.title, description: COPY.meta.description, type: "website" },
  // Kept out of search results until the page is approved.
  robots: { index: false, follow: false },
};

/** The Marketing add-on: promise → the pain → a live preview → what you get → how it works → honesty → price → doubts → the action again. */
export default function MarketingPage() {
  return (
    <>
      <MarketingHeader />
      <main className="overflow-x-clip">
        <MarketingHero />
        <MarketingPain />
        <MarketingDemo />
        <MarketingWhat />
        <MarketingSteps />
        <MarketingHonest />
        <MarketingPricing />
        <MarketingFaq />
        <MarketingFinalCta />
      </main>
      <Footer />
      <MarketingSticky />
    </>
  );
}
