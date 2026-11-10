import { Avatar, BrandMark, Icon, Pill, ProgressBar, type IconName } from "@stayflow/ui";
import type { ProductId } from "@/lib/catalog";

/** Illustrative property "photos" drawn in SVG. Real hosts upload their own. */
export function SceneArt({ variant = 0, className = "" }: { variant?: 0 | 1 | 2; className?: string }) {
  const sets = [
    { sky: ["#ffb27a", "#ffe2b8"], sea: "#16405e", wall: "#f1eadf", sun: "#fff1c9" },
    { sky: ["#6d82d6", "#cfc6ee"], sea: "#12304d", wall: "#ece8f2", sun: "#ffffff" },
    { sky: ["#2f6a52", "#b4d89a"], sea: "#163d2e", wall: "#f0ecd9", sun: "#ffe9a3" },
  ] as const;
  const c = sets[variant];
  const id = `sc${variant}`;
  return (
    <svg aria-hidden viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" className={className}>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={c.sky[0]} /><stop offset="1" stopColor={c.sky[1]} /></linearGradient>
        <linearGradient id={`${id}s`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={c.sea} /><stop offset="1" stopColor="#060b14" /></linearGradient>
      </defs>
      <rect width="320" height="200" fill={`url(#${id})`} />
      <circle cx="238" cy="52" r="26" fill={c.sun} opacity="0.95" />
      <rect y="140" width="320" height="60" fill={`url(#${id}s)`} />
      <polygon points="62,140 62,86 130,66 198,86 198,140" fill={c.wall} />
      <rect x="92" y="102" width="22" height="38" rx="2" fill="#3a2c28" />
      <rect x="132" y="98" width="44" height="26" rx="3" fill="#8fc3e0" />
    </svg>
  );
}

export function QrArt({ className = "h-24 w-24" }: { className?: string }) {
  const cells = Array.from({ length: 81 }, (_, i) => ((i * i * 7 + i * 13 + 3) % 11 < 5 ? 1 : 0));
  return (
    <svg aria-hidden viewBox="0 0 9 9" className={`shrink-0 rounded-xl bg-white p-1.5 ${className}`} shapeRendering="crispEdges">
      {cells.map((c, i) => (c ? <rect key={i} x={i % 9} y={Math.floor(i / 9)} width="1" height="1" fill="#06101f" /> : null))}
      {[[0, 0], [6, 0], [0, 6]].map(([x, y]) => (
        <g key={`${x}${y}`}>
          <rect x={x} y={y} width="3" height="3" fill="#06101f" />
          <rect x={x! + 0.5} y={y! + 0.5} width="2" height="2" fill="#fff" />
          <rect x={x! + 1} y={y! + 1} width="1" height="1" fill="#06101f" />
        </g>
      ))}
    </svg>
  );
}

const DAYS = 14;
const SCHEDULE: { v: 0 | 1 | 2; bars: { g: string; s: number; n: number; tone: "a" | "s" | "m" }[] }[] = [
  { v: 0, bars: [{ g: "Marta L.", s: 2, n: 5, tone: "s" }, { g: "Jorge R.", s: 9, n: 5, tone: "a" }] },
  { v: 1, bars: [{ g: "Diego F.", s: 1, n: 3, tone: "m" }, { g: "Clara S.", s: 6, n: 4, tone: "a" }, { g: "Pablo V.", s: 11, n: 4, tone: "a" }] },
  { v: 2, bars: [{ g: "Ortega family", s: 4, n: 7, tone: "a" }] },
];
const TONE = { a: "bg-gradient-to-r from-accent to-accent/75 text-onaccent", s: "bg-gradient-to-r from-sky-400 to-sky-500 text-white", m: "bg-line text-muted" } as const;

/** The schedule: one row per property, one bar per stay. */
export function ScheduleVisual({ compact = false }: { compact?: boolean }) {
  const grid = { gridTemplateColumns: `${compact ? "2.6rem" : "3.4rem"} repeat(${DAYS}, minmax(0, 1fr))` } as const;
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-bg/60">
      {SCHEDULE.map((r, i) => (
        <div key={i} className="relative grid border-b border-line/60 last:border-b-0" style={grid}>
          <div className="flex items-center justify-center p-1.5"><SceneArt variant={r.v} className="h-8 w-full rounded-md" /></div>
          {Array.from({ length: DAYS }, (_, d) => <div key={d} style={{ gridColumn: d + 2, gridRow: 1 }} className={`h-11 border-l border-line/40 ${d === 5 ? "bg-accent/10" : ""}`} />)}
          {r.bars.map((b) => (
            <div key={b.g} style={{ gridColumn: `${b.s + 1} / span ${b.n}`, gridRow: 1 }} className={`z-10 m-1 flex items-center overflow-hidden rounded-lg px-2 text-[10px] font-medium ${TONE[b.tone]}`}>
              <span className="truncate">{b.g}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

const panel = "flex h-full flex-col justify-center gap-3 px-5 pb-5 pt-11";

/** A small, honest picture of what each product does. Dark panels so they pop on the light page. */
export function ProductArt({ id }: { id: ProductId }) {
  switch (id) {
    case "host":
      return <div className={panel}><ScheduleVisual compact /><div className="flex gap-2"><Pill tone="success">Occupied</Pill><Pill tone="accent">3 arrivals this week</Pill></div></div>;
    case "guest":
      return (
        <div className={`${panel} items-center`}>
          <div className="flex items-center gap-4">
            <QrArt className="h-24 w-24 shadow-[0_0_40px_-10px_rgb(var(--accent))]" />
            <div className="space-y-1.5 text-[11px]">
              {["Wi-Fi", "Check-in", "House rules", "Nearby"].map((x) => <p key={x} className="flex items-center gap-2 rounded-lg border border-line bg-surface/70 px-2.5 py-1.5"><Icon name="check" className="h-3 w-3 text-accent" />{x}</p>)}
            </div>
          </div>
        </div>
      );
    case "ai":
      return (
        <div className={panel}>
          <p className="max-w-[80%] rounded-2xl rounded-bl-md border border-line bg-surface/70 px-3.5 py-2 text-xs">What&apos;s the Wi-Fi password?</p>
          <div className="ml-auto max-w-[88%] rounded-2xl rounded-br-md bg-accent/15 px-3.5 py-2 text-xs text-fg">
            <span className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-accent"><Icon name="sparkles" className="h-3 w-3" />Suggested reply</span>
            Hi! The Wi-Fi details are in your guest guide, under “Wi-Fi”. Enjoy your stay!
          </div>
          <span className="ml-auto rounded-lg bg-accent px-3 py-1.5 text-[11px] font-semibold text-onaccent">Use reply</span>
        </div>
      );
    case "profit":
      return (
        <div className={panel}>
          {[["Collected", 100, "rgb(var(--accent) / 0.5)", "$1,251"], ["Expenses", 20, "rgb(var(--danger) / 0.8)", "−$250"], ["Net profit", 80, "rgb(var(--accent))", "$1,001"]].map(([l, w, c, v]) => (
            <div key={l as string}>
              <p className="mb-1 flex justify-between text-[11px]"><span className="text-muted">{l}</span><span className="font-semibold tabular-nums">{v}</span></p>
              <div className="h-2 rounded-full bg-line/70"><div className="h-full rounded-full" style={{ width: `${w}%`, background: c as string }} /></div>
            </div>
          ))}
        </div>
      );
    case "operations":
      return (
        <div className={panel}>
          {[["Clean the loft", "Thu", true], ["Restock amenities", "Thu", true], ["Check boiler", "Fri", false], ["Meet next guest", "Sat", false]].map(([t, d, done]) => (
            <p key={t as string} className="flex items-center gap-3 rounded-xl border border-line bg-surface/70 px-3 py-2 text-xs">
              <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${done ? "border-accent bg-accent text-onaccent" : "border-line"}`}>{done && <Icon name="check" className="h-3 w-3" />}</span>
              <span className={`flex-1 ${done ? "text-muted line-through" : "font-medium"}`}>{t}</span><span className="text-[10px] text-muted">{d}</span>
            </p>
          ))}
        </div>
      );
    case "listing":
      return (
        <div className={panel}>
          <p className="font-display text-sm">Sunny loft steps from the sea</p>
          <div className="space-y-1.5">{[100, 92, 76].map((w) => <div key={w} className="h-2 rounded-full bg-line/80" style={{ width: `${w}%` }} />)}</div>
          <div className="flex flex-wrap gap-2 text-[10px]">{["Sea view", "Fast Wi-Fi", "Self check-in"].map((x) => <span key={x} className="rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 text-accent">{x}</span>)}</div>
          <p className="flex items-center gap-1.5 text-[11px] text-muted"><Icon name="sparkles" className="h-3.5 w-3.5 text-accent" />Description optimized</p>
        </div>
      );
    case "academy":
      return (
        <div className={panel}>
          {[["Start in short-term rentals", 100], ["Prepare your property", 60], ["Improve the guest experience", 20]].map(([t, p]) => (
            <div key={t as string} className="rounded-xl border border-line bg-surface/70 px-3 py-2.5">
              <p className="mb-1.5 flex items-center justify-between text-xs font-medium"><span>{t}</span><span className="text-[10px] text-muted">{p}%</span></p>
              <ProgressBar value={p as number} label={t as string} />
            </div>
          ))}
        </div>
      );
    case "experiences":
      return (
        <div className={`${panel} sm:flex-row sm:items-center`}>
          {[["Sunset kayak", "$45", 0], ["Local food tour", "$60", 2]].map(([t, p, v]) => (
            <div key={t as string} className="flex-1 overflow-hidden rounded-xl border border-line bg-surface/70">
              <SceneArt variant={v as 0 | 2} className="h-16 w-full" />
              <p className="flex items-center justify-between px-3 py-2 text-xs"><span className="font-medium">{t}</span><span className="font-semibold text-accent">{p}</span></p>
            </div>
          ))}
        </div>
      );
    case "website":
      return (
        <div className={panel}>
          <div className="overflow-hidden rounded-xl border border-line bg-surface/70">
            <div className="flex items-center gap-1 border-b border-line px-3 py-1.5" aria-hidden><i className="h-1.5 w-1.5 rounded-full bg-danger/70" /><i className="h-1.5 w-1.5 rounded-full bg-amber-300/70" /><i className="h-1.5 w-1.5 rounded-full bg-success/70" /></div>
            <div className="relative"><SceneArt variant={0} className="h-24 w-full" /><span className="absolute bottom-2 left-3 rounded-md bg-black/55 px-2 py-1 text-[11px] font-semibold text-white">Casa del Mar</span><span className="absolute bottom-2 right-3 rounded-md bg-accent px-2.5 py-1 text-[11px] font-semibold text-onaccent">Book now</span></div>
          </div>
        </div>
      );
  }
}

/** The hero: a dark dashboard in a tilted device with a glowing ring and floating cards. */
export function HeroVisual() {
  const kpis: [string, string, IconName][] = [["Occupancy", "68.4%", "dashboard"], ["Income", "$4,280", "wallet"], ["Arrivals", "4", "key"]];
  return (
    <div className="zone-dark relative rounded-[28px] shadow-[0_40px_90px_-30px_rgb(0_0_0/0.55)]">
      <div className="flex items-center gap-1.5 border-b border-line/70 px-4 py-2.5" aria-hidden>
        <i className="h-2.5 w-2.5 rounded-full bg-danger/70" /><i className="h-2.5 w-2.5 rounded-full bg-amber-300/70" /><i className="h-2.5 w-2.5 rounded-full bg-success/70" />
        <span className="mx-auto flex items-center gap-1.5 rounded-md bg-bg/60 px-6 py-1 text-[10px] text-muted"><BrandMark className="h-3.5 w-3.5 rounded-md" />stayflow</span>
      </div>
      <div className="p-4 sm:p-5">
        <p className="font-display text-lg">Good morning, <span className="text-gradient">Lucía</span></p>
        <div className="mt-3 grid grid-cols-3 gap-2.5">
          {kpis.map(([l, v, icon]) => (
            <div key={l} className="rounded-2xl border border-line bg-surface/70 p-3">
              <div className="flex items-center justify-between"><p className="text-[10px] text-muted">{l}</p><span className="flex h-5 w-5 items-center justify-center rounded-md bg-accent/12 text-accent"><Icon name={icon} className="h-3 w-3" /></span></div>
              <p className="font-display mt-1.5 text-lg tabular-nums">{v}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-2xl border border-line bg-surface/70 p-3.5">
          <p className="text-[11px] font-medium">Schedule</p>
          <div className="mt-2.5"><ScheduleVisual compact /></div>
        </div>
        <ul className="mt-3 space-y-2">
          {[["Loft by the Sea", 74, 0], ["Olive Grove House", 51, 2]].map(([n, o, v]) => (
            <li key={n as string} className="flex items-center gap-3 rounded-2xl border border-line bg-surface/70 p-2">
              <SceneArt variant={v as 0 | 2} className="h-12 w-20 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1"><p className="truncate font-display text-sm">{n}</p><div className="mt-1.5"><ProgressBar value={o as number} label={n as string} /></div></div>
              <span className="pr-2 text-xs tabular-nums text-muted">{o}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function FloatCard({ icon, tone, title, sub, className = "", style }: { icon: IconName; tone: "success" | "accent" | "danger"; title: string; sub: string; className?: string; style?: React.CSSProperties }) {
  const bg = tone === "success" ? "bg-success/15 text-success" : tone === "danger" ? "bg-danger/15 text-danger" : "bg-accent/15 text-accent";
  return (
    <div className={`drift fx-card absolute z-10 hidden w-60 rounded-2xl p-3 shadow-2xl sm:block ${className}`} style={style}>
      <div className="flex items-center gap-3">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${bg}`}><Icon name={icon} className="h-[18px] w-[18px]" /></span>
        <div className="min-w-0"><p className="truncate text-[13px] font-semibold">{title}</p><p className="truncate text-[11px] text-muted">{sub}</p></div>
      </div>
    </div>
  );
}

export { Avatar };
