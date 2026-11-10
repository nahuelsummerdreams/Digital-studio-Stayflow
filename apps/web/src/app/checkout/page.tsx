import type { Metadata } from "next";
import { CheckoutView } from "@/components/client";
import { Announce, Footer, Header } from "@/components/sections";
import { getMessages } from "@/i18n";

const m = getMessages();
export const metadata: Metadata = { title: `${m.checkout.title} · Stayflow`, robots: { index: false, follow: false } };

export default function CheckoutPage() {
  return (
    <>
      <Announce />
      <Header />
      <main className="mx-auto max-w-6xl px-5 py-10 md:py-16">
        <h1 className="font-display mb-10 text-4xl md:text-5xl">{m.checkout.title}</h1>
        <CheckoutView />
      </main>
      <Footer />
    </>
  );
}
