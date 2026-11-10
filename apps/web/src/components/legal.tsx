import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./sections";

export const CONTACT = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "";

export function Contact() {
  return CONTACT ? <a className="text-accent underline underline-offset-4" href={`mailto:${CONTACT}`}>{CONTACT}</a> : <span>el email de contacto publicado en este sitio</span>;
}

/** Shared shell for the legal pages. */
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-5 py-12 md:py-16">
        <h1 className="font-display text-4xl md:text-5xl">{title}</h1>
        <p className="mt-3 text-sm text-muted">Última actualización: {updated}</p>
        <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-muted [&_h2]:font-display [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:text-fg [&_li]:mt-1.5 [&_ul]:list-disc [&_ul]:pl-5">{children}</div>
      </main>
      <Footer />
    </>
  );
}
