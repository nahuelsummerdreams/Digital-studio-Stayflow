import { getMessages } from "@/i18n";
import { Icon } from "@stayflow/ui";

const m = getMessages();

/** The real screens of what was built beyond the calendar: payments, sheets, maintenance and team. Alternating rows, one idea each. */
export function DailyOps() {
  const d = m.funnel.daily;
  return (
    <section id="dia-a-dia" className="mx-auto max-w-6xl px-5 py-14 md:py-20">
      <div className="reveal max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-accent">{d.eyebrow}</p>
        <h2 className="font-display mt-4 text-3xl leading-tight md:text-5xl">{d.title}</h2>
        <p className="mt-5 text-base leading-relaxed text-muted md:text-lg">{d.body}</p>
      </div>
      <div className="mt-12 space-y-16 md:space-y-24">
        {d.items.map((it, i) => (
          <article key={it.key} className="reveal grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
            <div className={i % 2 ? "lg:order-2" : ""}>
              <h3 className="font-display text-2xl leading-snug md:text-3xl">{it.title}</h3>
              <p className="mt-4 text-base leading-relaxed text-muted md:text-lg">{it.body}</p>
              <ul className="mt-5 space-y-2.5">
                {it.points.map((p) => (
                  <li key={p} className="flex items-start gap-3 text-[15px]"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success"><Icon name="check" className="h-3 w-3" /></span>{p}</li>
                ))}
              </ul>
            </div>
            <div className={`relative ${i % 2 ? "lg:order-1" : ""}`}>
              <div aria-hidden className="absolute -inset-4 rounded-[36px] bg-accent/15 blur-2xl" />
              <div className="relative overflow-hidden rounded-2xl border border-line shadow-[0_30px_80px_-30px_rgb(var(--accent)/0.45)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/shots/${it.key}.webp`} alt={it.title} width={1600} height={1059} loading="lazy" className="block h-auto w-full" />
              </div>
            </div>
          </article>
        ))}
      </div>
      <div className="reveal mt-16 rounded-3xl border border-line bg-surface/50 p-6 md:p-8">
        <h3 className="font-display text-xl md:text-2xl">{d.extrasTitle}</h3>
        <ul className="mt-5 grid gap-3 md:grid-cols-2">
          {d.extras.map((x) => (
            <li key={x} className="flex items-start gap-3 text-[15px]"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success"><Icon name="check" className="h-3 w-3" /></span>{x}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
