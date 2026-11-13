import { Icon, type IconName } from "@stayflow/ui";
import { getMessages } from "@/i18n";
import { NotifyButton } from "./client";
import { HUE } from "./covers";

const m = getMessages();

const NODE_ICON: Record<string, IconName> = { guest: "qr", operations: "tasks", profit: "wallet" };
const NODE_HUE: Record<string, number> = { guest: HUE.guest, operations: HUE.operations, profit: HUE.profit };
const CAT_ICON: Record<string, IconName> = { rental: "building", hotel: "key", hostel: "bed", cabins: "calendar" };
const CAT_STATUS_STYLE: Record<string, string> = {
  ok: "border-success/40 bg-success/10 text-success",
  beta: "border-amber-400/40 bg-amber-400/10 text-amber-300",
  soon: "border-line bg-surface text-muted",
};

/**
 * The "ecosystem" idea made visible: Host in the middle, the other apps plugged into it, and which kinds of lodging it is for.
 * Status labels are honest: only Rentals is on sale today.
 */
export function Ecosystem() {
  const e = m.funnel.ecosystem;
  const cats = (["rental", "hotel", "hostel", "cabins"] as const).map((k) => {
    const label = m.funnel.cats[k].label;
    const status = k === "rental" ? { text: "Listo hoy", tone: "ok" } : k === "cabins" ? { text: m.funnel.status.soon, tone: "soon" } : { text: m.funnel.status.beta, tone: "beta" };
    return { k, label, desc: m.funnel.cats[k].eyebrow, status };
  });
  return (
    <section id="ecosistema" className="relative mx-auto max-w-6xl overflow-x-clip px-5 py-14 md:py-24">
      <div className="reveal mx-auto max-w-2xl text-center">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-accent">{e.eyebrow}</p>
        <h2 className="font-display mt-4 text-3xl leading-tight md:text-5xl">{e.title}</h2>
        <p className="mt-5 text-base leading-relaxed text-muted md:text-lg">{e.body}</p>
      </div>

      {/* hub and spokes */}
      <div className="relative mt-14">
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-72 w-[34rem] -translate-x-1/2 rounded-full bg-accent/15 blur-3xl" />
        <div className="reveal relative mx-auto max-w-md">
          <div className="fx-card fx-hero relative overflow-hidden rounded-3xl p-6 text-center" style={{ boxShadow: `0 30px 80px -30px hsl(${HUE.host} 100% 50% / 0.55)` }}>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent"><Icon name="sparkles" className="h-3 w-3" />{e.hub.tag}</span>
            <div className="mt-4 flex items-center justify-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl text-white" style={{ background: `linear-gradient(160deg, hsl(${HUE.host} 100% 58%), hsl(${HUE.host} 100% 30%))` }}><Icon name="dashboard" className="h-6 w-6" /></span>
              <p className="font-display text-3xl">Stayflow {e.hub.name}</p>
            </div>
            <p className="mt-3 text-sm text-muted">{e.hub.role}</p>
          </div>
        </div>

        {/* connector */}
        <div aria-hidden className="mx-auto h-10 w-px bg-gradient-to-b from-[rgb(var(--accent-2)/0.7)] to-transparent" />
        <div aria-hidden className="mx-auto hidden h-px w-[66%] bg-gradient-to-r from-transparent via-[rgb(var(--accent-2)/0.6)] to-transparent md:block" />

        <div className="mt-2 grid gap-5 md:grid-cols-3">
          {e.nodes.map((n, i) => (
            <article key={n.id} className="reveal fx-card relative rounded-3xl p-5" style={{ transitionDelay: `${i * 80}ms` }}>
              <span aria-hidden className="absolute -top-2 left-1/2 hidden h-2 w-px -translate-x-1/2 bg-accent/50 md:block" />
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl text-white" style={{ background: `linear-gradient(160deg, hsl(${NODE_HUE[n.id]} 100% 58%), hsl(${NODE_HUE[n.id]} 100% 30%))` }}><Icon name={NODE_ICON[n.id]!} className="h-5 w-5" /></span>
                <div className="min-w-0">
                  <p className="font-display text-xl leading-tight">Stayflow {n.name}</p>
                  <p className="text-xs text-muted">{n.role}</p>
                </div>
              </div>
              <p className="mt-4 flex items-start gap-2 rounded-xl bg-accent/8 px-3 py-2.5 text-sm"><Icon name="refresh" className="mt-0.5 h-4 w-4 shrink-0 text-[rgb(var(--accent-2))]" />{n.link}</p>
            </article>
          ))}
        </div>
      </div>

      {/* kinds of lodging */}
      <div className="reveal mt-20">
        <h3 className="font-display text-2xl md:text-3xl">{e.forTitle}</h3>
        <p className="mt-2 max-w-2xl text-muted">{e.forBody}</p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cats.map((c) => (
            <li key={c.k} className="fx-card flex flex-col rounded-2xl p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/12 text-accent"><Icon name={CAT_ICON[c.k]!} className="h-5 w-5" /></span>
                <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${CAT_STATUS_STYLE[c.status.tone]}`}>{c.status.text}</span>
              </div>
              <p className="font-display mt-4 text-lg">{c.label}</p>
              <p className="mt-1 text-sm text-muted">{c.desc}</p>
            </li>
          ))}
        </ul>
        <p className="mt-6 max-w-2xl text-sm text-muted">{m.funnel.allStatus.note}</p>
        <div className="mt-6 flex flex-wrap items-start gap-3">
          <a href="#precios" className="fx-btn inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-onaccent">{e.cta}<Icon name="arrow" className="h-4 w-4" /></a>
          <NotifyButton id="hotels" label={e.notify} className="min-w-[16rem]" />
        </div>
      </div>
    </section>
  );
}
