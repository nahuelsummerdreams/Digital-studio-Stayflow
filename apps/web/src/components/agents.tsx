import Link from "next/link";
import { Icon, type IconName } from "@stayflow/ui";
import { getMessages } from "@/i18n";
import { AgentDemo } from "./agent-demo";
import { btnPrimary } from "./styles";

const m = getMessages();

const AGENTS: { id: keyof typeof m.agents.list; icon: IconName; hue: number }[] = [
  { id: "ops", icon: "tasks", hue: 28 },
  { id: "schedule", icon: "calendar", hue: 203 },
  { id: "sales", icon: "wallet", hue: 142 },
  { id: "guests", icon: "users", hue: 276 },
  { id: "finance", icon: "chart", hue: 54 },
  { id: "listing", icon: "image", hue: 342 },
];

/** The agents idea as a section: a live-looking demo, and the team of agents you can call. Labelled as in development. */
export function Agentes() {
  return (
    <section id="agentes" className="relative overflow-hidden border-t border-line/60">
      <div aria-hidden className="pointer-events-none absolute -left-32 top-20 h-96 w-96 rounded-full bg-accent2/15 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-24 bottom-10 h-96 w-96 rounded-full bg-accent/15 blur-3xl" />
      <div className="relative mx-auto max-w-6xl px-5 py-20 md:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="reveal">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-accent">{m.agents.eyebrow}</p>
            <h2 className="font-display mt-4 text-3xl leading-tight md:text-5xl">{m.agents.title}</h2>
            <p className="mt-5 text-base leading-relaxed text-muted md:text-lg">{m.agents.body}</p>
            <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-line bg-surface/60 px-3.5 py-1.5 text-xs text-muted"><span aria-hidden className="pulse-ring h-1.5 w-1.5 rounded-full bg-amber-300" />{m.agents.status}</p>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <Link href="/products/ai" className={`${btnPrimary} !px-6 !py-3.5 !text-base`}>{m.agents.cta}<Icon name="arrow" className="h-4 w-4" /></Link>
              <span className="text-sm text-muted">{m.agents.ctaSub}</span>
            </div>
          </div>
          <div className="reveal"><AgentDemo /></div>
        </div>

        <ul className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AGENTS.map((a) => {
            const c = m.agents.list[a.id];
            return (
              <li key={a.id} className="reveal fx-card group relative overflow-hidden rounded-3xl p-6 transition duration-300 hover:-translate-y-1" style={{ backgroundImage: `radial-gradient(80% 60% at 0% 0%, hsl(${a.hue} 100% 50% / 0.16), transparent)` }}>
                <div className="flex items-center gap-4">
                  <span aria-hidden className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white transition duration-300 group-hover:scale-110" style={{ background: `radial-gradient(circle at 30% 25%, hsl(${a.hue} 100% 72%), hsl(${a.hue} 100% 42%))`, boxShadow: `0 0 1.4rem hsl(${a.hue} 100% 55% / 0.85)` }}>
                    <Icon name={a.icon} className="h-5 w-5" />
                    <i className="absolute inset-0 rounded-full border-2" style={{ borderColor: `hsl(${a.hue} 100% 65%)`, animation: "pulse-ring 2.4s ease-out infinite" }} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-display text-lg leading-tight">{c.name}</h3>
                    <span className="text-[11px] font-medium text-muted">{m.agents.soon}</span>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-muted">{c.role}</p>
                <p className="mt-4 rounded-xl border border-line bg-bg/50 px-3.5 py-2.5 text-sm"><span className="font-mono text-accent">@</span> <span className="text-[11px] uppercase tracking-wider text-muted">{m.agents.ask}</span><span className="mt-0.5 block">«{c.ask}»</span></p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
