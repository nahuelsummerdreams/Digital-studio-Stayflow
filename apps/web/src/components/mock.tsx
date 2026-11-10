import { Avatar, BrandMark, Icon, Pill, ProgressBar, type IconName } from "@stayflow/ui";
import { t } from "@/lib/t";

/** Illustrative property "photos" drawn in SVG. Real hosts upload their own; these keep the preview honest and light. */
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
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={c.sky[0]} />
          <stop offset="1" stopColor={c.sky[1]} />
        </linearGradient>
        <linearGradient id={`${id}s`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={c.sea} />
          <stop offset="1" stopColor="#060b14" />
        </linearGradient>
      </defs>
      <rect width="320" height="200" fill={`url(#${id})`} />
      <circle cx="238" cy="52" r="26" fill={c.sun} opacity="0.95" />
      <rect y="140" width="320" height="60" fill={`url(#${id}s)`} />
      <polygon points="62,140 62,86 130,66 198,86 198,140" fill={c.wall} />
      <polygon points="52,90 130,60 208,90 198,86 130,66 72,86" fill="#00000022" />
      <rect x="92" y="102" width="22" height="38" rx="2" fill="#3a2c28" />
      <rect x="132" y="98" width="44" height="26" rx="3" fill="#8fc3e0" />
      <path d="M0 160c40-6 60 6 100 0s60-6 100 0 80 6 120 0" stroke="#ffffff22" strokeWidth="2" fill="none" />
    </svg>
  );
}

const NAV: { icon: IconName; label: string; active?: boolean; badge?: number }[] = [
  { icon: "dashboard", label: "nav.dashboard", active: true },
  { icon: "bed", label: "nav.bookings", badge: 5 },
  { icon: "calendar", label: "nav.schedule" },
  { icon: "users", label: "nav.guests" },
  { icon: "tasks", label: "nav.tasks", badge: 3 },
  { icon: "building", label: "nav.properties", badge: 3 },
];

/** A static, faithful picture of the Host panel. Figures are illustrative and labelled as such next to it. */
export function DashboardMock() {
  const kpis = [
    { l: t("host.occupancy"), v: "68,4 %", d: "+12,4 %", icon: "dashboard" as IconName, hero: true },
    { l: t("host.monthRevenue"), v: "4.280 €", d: "+8,1 %", icon: "wallet" as IconName },
    { l: t("host.arrivalsWeek"), v: "4", d: "", icon: "key" as IconName },
    { l: t("host.pendingTasks"), v: "3", d: "", icon: "tasks" as IconName },
  ];
  const props: { name: string; city: string; pill: string; tone: "success" | "warning" | "muted"; occ: number; rev: string; v: 0 | 1 | 2 }[] = [
    { name: "Loft Vista al Mar", city: "Málaga", pill: t("host.stateOccupied"), tone: "success", occ: 74, rev: "2.270 €", v: 0 },
    { name: "Casa del Olivar", city: "Ronda", pill: t("host.stateArriving"), tone: "warning", occ: 51, rev: "1.400 €", v: 2 },
  ];
  return (
    <div className="fx-card fx-hero overflow-hidden rounded-[28px] text-left">
      <div className="flex items-center gap-1.5 border-b border-line/70 bg-surface2/40 px-4 py-2.5" aria-hidden>
        <i className="h-2.5 w-2.5 rounded-full bg-danger/70" />
        <i className="h-2.5 w-2.5 rounded-full bg-amber-300/70" />
        <i className="h-2.5 w-2.5 rounded-full bg-success/70" />
        <span className="mx-auto rounded-md bg-bg/60 px-16 py-1 text-[10px] text-muted">stayflow · host</span>
      </div>
      <div className="grid md:grid-cols-[10.5rem_1fr]">
        <div className="hidden border-r border-line/60 bg-surface/30 p-4 md:block">
          <div className="flex items-center gap-2">
            <BrandMark className="h-7 w-7" />
            <span className="font-display text-sm">Stayflow</span>
          </div>
          <p className="mb-2 mt-6 px-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-muted/70">{t("navGroup.control")}</p>
          <ul className="space-y-0.5">
            {NAV.map((n) => (
              <li key={n.label} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] font-medium ${n.active ? "bg-accent/12 text-accent" : "text-muted"}`}>
                <Icon name={n.icon} className="h-3.5 w-3.5" />
                <span className="flex-1">{t(n.label as "nav.dashboard")}</span>
                {n.badge && <span className="rounded bg-line/70 px-1 text-[9px]">{n.badge}</span>}
              </li>
            ))}
          </ul>
        </div>
        <div className="min-w-0 p-4 md:p-5">
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted">{t("landing.mock.date")}</p>
          <p className="font-display mt-1 text-xl md:text-2xl">{t("host.greetMorning")}, <span className="text-gradient">Lucía</span></p>
          <div className="mt-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            {kpis.map((k) => (
              <div key={k.l} className={`rounded-2xl border border-line bg-bg/60 p-3 ${k.hero ? "shadow-[0_0_40px_-18px_rgb(var(--accent))]" : ""}`}>
                <div className="flex items-start justify-between gap-1">
                  <p className="text-[10px] leading-tight text-muted">{k.l}</p>
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent"><Icon name={k.icon} className="h-3 w-3" /></span>
                </div>
                <p className={`font-display mt-2 text-lg tabular-nums md:text-xl ${k.hero ? "text-money" : ""}`}>{k.v}</p>
                {k.d && <p className="mt-1 text-[10px] text-success">{k.d}</p>}
              </div>
            ))}
          </div>
          <div className="mt-3 grid gap-3 lg:grid-cols-[1.3fr_1fr]">
            <div className="rounded-2xl border border-line bg-bg/60 p-3.5">
              <p className="text-[11px] font-medium">{t("host.chartOccupancy")}</p>
              <svg viewBox="0 0 300 100" preserveAspectRatio="none" className="mt-2 h-24 w-full" aria-hidden>
                <defs>
                  <linearGradient id="mockArea" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0" stopColor="rgb(var(--accent))" stopOpacity="0.4" />
                    <stop offset="1" stopColor="rgb(var(--accent))" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[25, 50, 75].map((y) => <line key={y} x1="0" x2="300" y1={y} y2={y} stroke="rgb(var(--line))" strokeDasharray="3 5" />)}
                <path d="M0 82 C30 80 50 70 80 58 S130 36 160 40 S220 20 250 14 S290 10 300 6 L300 100 L0 100 Z" fill="url(#mockArea)" />
                <path d="M0 82 C30 80 50 70 80 58 S130 36 160 40 S220 20 250 14 S290 10 300 6" fill="none" stroke="rgb(var(--accent))" strokeWidth="2.2" strokeLinecap="round" pathLength={1} style={{ strokeDasharray: 1, strokeDashoffset: 1, animation: "draw 1.6s var(--ease) 0.4s forwards" }} />
              </svg>
            </div>
            <div className="rounded-2xl border border-line bg-bg/60 p-3.5">
              <p className="text-[11px] font-medium">{t("host.agenda")}</p>
              <div className="mt-2 grid grid-cols-7 gap-1 text-center text-[9px] text-muted">
                {[9, 10, 11, 12, 13, 14, 15].map((d) => (
                  <span key={d} className={`rounded-md py-1 ${d === 10 ? "bg-accent font-semibold text-onaccent" : ""}`}>{d}</span>
                ))}
              </div>
              <div className="mt-2.5 rounded-lg border-l-[3px] border-l-accent bg-surface/60 px-2.5 py-1.5">
                <p className="text-[11px] font-medium">Familia Ortega</p>
                <p className="text-[9px] text-muted">Casa del Olivar · 5</p>
              </div>
            </div>
          </div>
          <ul className="mt-3 space-y-2">
            {props.map((p) => (
              <li key={p.name} className="flex items-center gap-3 rounded-2xl border border-line bg-bg/60 p-2">
                <SceneArt variant={p.v} className="h-14 w-24 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2"><span className="font-display truncate text-sm">{p.name}</span><Pill tone={p.tone}>{p.pill}</Pill></p>
                  <p className="text-[10px] text-muted">{p.city}</p>
                  <div className="mt-1.5"><ProgressBar value={p.occ} label={p.name} /></div>
                </div>
                <p className="hidden font-display text-sm tabular-nums sm:block">{p.rev}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

const COLS = 16;
const ROWS: { name: string; v: 0 | 1 | 2; bars: { guest: string; start: number; span: number; tone: "accent" | "success" | "muted" }[] }[] = [
  { name: "Loft Vista al Mar", v: 0, bars: [{ guest: "Marta López", start: 2, span: 5, tone: "success" }, { guest: "Jorge Ruiz", start: 9, span: 5, tone: "accent" }] },
  { name: "Estudio Casco Antiguo", v: 1, bars: [{ guest: "Diego F.", start: 1, span: 3, tone: "muted" }, { guest: "Clara Soto", start: 6, span: 4, tone: "accent" }, { guest: "Pablo Vega", start: 12, span: 4, tone: "accent" }] },
  { name: "Casa del Olivar", v: 2, bars: [{ guest: "Familia Ortega", start: 4, span: 7, tone: "accent" }, { guest: "Lucas Gil", start: 12, span: 3, tone: "accent" }] },
];
const BAR = {
  accent: "bg-gradient-to-r from-accent to-accent/75 text-onaccent shadow-[0_8px_20px_-8px_rgb(var(--accent)/0.8)]",
  success: "bg-gradient-to-r from-success to-success/75 text-bg shadow-[0_8px_20px_-8px_rgb(var(--success)/0.8)]",
  muted: "bg-line/80 text-muted",
} as const;

/** The schedule, drawn like the real one. Bars grow as they scroll into view. */
export function ScheduleMock({ compact = false }: { compact?: boolean }) {
  const grid = { gridTemplateColumns: `${compact ? "6rem" : "11rem"} repeat(${COLS}, minmax(0, 1fr))` } as const;
  return (
    <div className="fx-card fx-hero overflow-hidden rounded-[24px]" role="img" aria-label={t("landing.schedule.alt")}>
      <div className="grid border-b border-line bg-surface2/30 text-center text-[10px] text-muted" style={grid}>
        <div />
        {Array.from({ length: COLS }, (_, i) => (
          <div key={i} className={`py-2 ${i === 5 ? "font-bold text-accent" : ""}`}>
            <span className={i === 5 ? "mx-auto flex h-5 w-5 items-center justify-center rounded-full bg-accent text-onaccent" : ""}>{i + 5}</span>
          </div>
        ))}
      </div>
      {ROWS.map((r) => (
        <div key={r.name} className="relative grid border-b border-line/60 last:border-b-0" style={grid}>
          <div className="flex items-center gap-2.5 px-3 py-2">
            <SceneArt variant={r.v} className={`${compact ? "hidden" : "h-9 w-12"} shrink-0 rounded-lg sm:block`} />
            <span className="truncate text-xs font-medium">{r.name}</span>
          </div>
          {Array.from({ length: COLS }, (_, i) => (
            <div key={i} style={{ gridColumn: i + 2, gridRow: 1 }} className={`h-14 border-l border-line/40 ${i === 5 ? "bg-accent/10" : ""}`} />
          ))}
          {r.bars.map((b) => (
            <div key={b.guest} style={{ gridColumn: `${b.start + 1} / span ${b.span}`, gridRow: 1 }} className={`grow-view z-10 m-1.5 flex items-center gap-1.5 overflow-hidden rounded-xl px-2 text-[11px] font-medium ${BAR[b.tone]}`}>
              {b.span >= 3 && <Avatar name={b.guest} className="h-5 w-5 text-[8px] ring-1 ring-white/30" />}
              <span className="truncate">{b.guest}</span>
            </div>
          ))}
          <span aria-hidden className="pointer-events-none absolute inset-y-0 z-20 w-px bg-accent shadow-[0_0_10px_rgb(var(--accent))]" style={{ left: `calc(${compact ? "6rem" : "11rem"} + (100% - ${compact ? "6rem" : "11rem"}) * ${5.5 / COLS})` }} />
        </div>
      ))}
    </div>
  );
}
