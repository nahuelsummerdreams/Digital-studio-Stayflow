import { getMessages } from "@/i18n";
import { GetHostButton } from "./client";

const m = getMessages();

/** The rest of the message, right under the hero: the turn from the pain to the answer, the ecosystem in one sentence and the three-beat promise. */
export function Manifesto() {
  const mf = m.funnel.manifesto;
  return (
    <section id="manifiesto" className="mx-auto max-w-4xl px-5 py-14 text-center md:py-20">
      <p className="reveal mx-auto max-w-2xl text-base leading-relaxed text-muted md:text-lg">{mf.pivot}</p>
      <h2 className="reveal font-display mx-auto mt-6 max-w-3xl text-3xl leading-tight md:text-5xl">{mf.brand}</h2>
      <p className="reveal mx-auto mt-6 max-w-2xl text-base leading-relaxed text-fg/85 md:text-lg">{mf.ecosystem}</p>
      <p className="reveal mx-auto mt-4 max-w-2xl text-base leading-relaxed text-fg/85 md:text-lg">{mf.closing}</p>
      <p className="reveal font-display text-gradient mx-auto mt-8 max-w-3xl text-xl font-extrabold uppercase leading-snug tracking-tight md:text-3xl">{mf.tagline}</p>
      <div className="reveal mt-8 flex justify-center"><GetHostButton where="manifesto" label={mf.cta} /></div>
    </section>
  );
}
