import { t } from "@/lib/t";
import { getMessages } from "@/i18n";
import { BookingsMock, GuestsMock, ProfitMock, ScheduleMock, TasksMock } from "./mock";
import { ShowcaseTabs, type ShowcaseItem } from "./showcase-tabs";

const m = getMessages();

/** "Míralo por dentro": the five real screens, one at a time. Replaces five stacked blocks. */
export function Showcase() {
  const k = (key: "schedule" | "bookings" | "guests" | "tasks" | "profit", visual: ShowcaseItem["visual"]): ShowcaseItem => ({
    key,
    tag: t(`landing.blocks.${key}.tag`),
    pain: t(`landing.blocks.${key}.pain`),
    title: t(`landing.blocks.${key}.title`),
    body: t(`landing.blocks.${key}.body`),
    bullets: [t(`landing.blocks.${key}.b1`), t(`landing.blocks.${key}.b2`), t(`landing.blocks.${key}.b3`)],
    visual,
  });
  const items = [
    k("schedule", <div role="img" aria-label={t("landing.blocks.schedule.alt")}><ScheduleMock /></div>),
    k("bookings", <BookingsMock />),
    k("guests", <GuestsMock />),
    k("tasks", <TasksMock />),
    k("profit", <ProfitMock />),
  ];
  return (
    <section id="sistema" className="border-t border-line/60 bg-surface/30">
      <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
        <div className="reveal mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-accent">{m.funnel.showcase.eyebrow}</p>
          <h2 className="font-display mt-4 text-3xl leading-tight md:text-5xl">{m.funnel.showcase.title}</h2>
          <p className="mt-4 text-sm text-muted">{m.funnel.showcase.body}</p>
        </div>
        <div className="reveal mt-10"><ShowcaseTabs items={items} /></div>
      </div>
    </section>
  );
}
