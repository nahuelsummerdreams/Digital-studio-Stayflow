import { Avatar, BrandMark, Icon, Pill, ProgressBar, type IconName } from "@stayflow/ui";
import { CountUp } from "./effects";
import { t } from "@/lib/t";

const PHOTOS = [
  { src: "/photos/treehouse.jpg", pos: "50% 45%" },
  { src: "/photos/villa.jpg", pos: "40% 55%" },
  { src: "/photos/villa.jpg", pos: "88% 40%" },
] as const;

/** Property thumbnails use the two sample photos. Real hosts upload their own. */
export function SceneArt({ variant = 0, className = "" }: { variant?: 0 | 1 | 2; className?: string }) {
  const p = PHOTOS[variant];
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={p.src} alt="" loading="lazy" decoding="async" className={`bg-surface2 object-cover ${className}`} style={{ objectPosition: p.pos }} />;
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
export function DashboardMock({ compact = false }: { compact?: boolean }) {
  const kpis: { l: string; v: React.ReactNode; d: string; icon: IconName; hero?: boolean }[] = [
    { l: t("host.occupancy"), v: <CountUp value={68.4} decimals={1} suffix=" %" />, d: "+12,4 %", icon: "dashboard" as IconName, hero: true },
    { l: t("host.monthRevenue"), v: <CountUp value={4280} prefix="US$ " delay={650} />, d: "+8,1 %", icon: "wallet" as IconName },
    { l: t("host.arrivalsWeek"), v: <CountUp value={4} delay={800} />, d: "", icon: "key" as IconName },
    { l: t("host.pendingTasks"), v: <CountUp value={3} delay={950} />, d: "", icon: "tasks" as IconName },
  ];
  const props: { name: string; city: string; pill: string; tone: "success" | "warning" | "muted"; occ: number; rev: string; v: 0 | 1 | 2 }[] = [
    { name: "Casa del Árbol", city: "Sierra de Gredos", pill: t("host.stateOccupied"), tone: "success", occ: 74, rev: "US$ 2.270", v: 0 },
    { name: "Villa Palmera", city: "Marbella", pill: t("host.stateArriving"), tone: "warning", occ: 51, rev: "US$ 1.400", v: 2 },
  ];
  return (
    <div className="fx-card fx-hero sheen overflow-hidden rounded-[28px] text-left">
      {/* Title bar: the product and the studio behind it. */}
      <div className="flex items-center gap-1.5 border-b border-line/70 bg-surface2/40 px-4 py-2.5">
        <span aria-hidden className="flex gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-danger/70" /><i className="h-2.5 w-2.5 rounded-full bg-amber-300/70" /><i className="h-2.5 w-2.5 rounded-full bg-success/70" /></span>
        <span className="mx-auto flex items-center gap-2"><span className="keep-blue"><BrandMark className="h-5 w-5 rounded-md" /></span><span className="font-display text-xs">Stayflow</span></span>
        <span className="flex items-center gap-1.5">
          <span className="hidden text-[8px] uppercase tracking-[0.18em] text-muted sm:inline">{t("landing.nav.by")}</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/digital-studio-logo-white.svg" alt="Digital Studio" className="h-5 w-auto" />
        </span>
      </div>
      <div className={compact ? "" : "grid md:grid-cols-[10.5rem_1fr]"}>
        <div className={`hidden border-r border-line/60 bg-surface/30 p-4 ${compact ? "" : "md:block"}`}>
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
          <div className="relative">
      {/* Live notifications that appear one after another. */}
      <div aria-hidden className="pointer-events-none absolute right-0 top-0 z-20 hidden h-11 w-48 sm:block">
        {[
          { icon: "bed" as IconName, tone: "bg-accent/15 text-accent", title: "Nueva reserva", sub: "Jorge Ruiz · 5 noches", delay: "0s" },
          { icon: "qr" as IconName, tone: "bg-success/15 text-success", title: "Guía abierta por QR", sub: "Villa Palmera", delay: "4s" },
          { icon: "wallet" as IconName, tone: "bg-amber-300/15 text-amber-300", title: "Ingreso registrado", sub: "+ US$ 650 en Business", delay: "8s" },
        ].map((n) => (
          <div key={n.title} className="toast-cycle absolute inset-0 flex items-center gap-2 rounded-xl border border-line bg-surface/95 px-2.5 shadow-xl backdrop-blur" style={{ animationDelay: n.delay }}>
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${n.tone}`}><Icon name={n.icon} className="h-3.5 w-3.5" /></span>
            <span className="min-w-0"><span className="block truncate text-[11px] font-semibold">{n.title}</span><span className="block truncate text-[9px] text-muted">{n.sub}</span></span>
          </div>
        ))}
      </div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted">{t("landing.mock.date")}</p>
            <p className="font-display mt-1 text-xl md:text-2xl">{t("host.greetMorning")}, <span className="text-gradient">Lucía</span></p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {kpis.map((k, i) => (
              <div key={k.l} className={`rise-in rounded-2xl border border-line bg-bg/60 p-3 ${k.hero ? "shadow-[0_0_40px_-18px_rgb(var(--accent))]" : ""}`} style={{ animationDelay: `${0.5 + i * 0.12}s` }}>
                <div className="flex items-start justify-between gap-1">
                  <p className="text-[10px] leading-tight text-muted">{k.l}</p>
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent"><Icon name={k.icon} className="h-3 w-3" /></span>
                </div>
                <p className={`font-display mt-2 text-lg tabular-nums md:text-xl ${k.hero ? "text-money" : ""}`}>{k.v}</p>
                {k.d && <p className="mt-1 text-[10px] text-success">{k.d}</p>}
              </div>
            ))}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-[1.3fr_1fr]">
            <div className="rise-in relative rounded-2xl border border-line bg-bg/60 p-3.5" style={{ animationDelay: "1s" }}>
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
              <span aria-hidden className="ping-dot absolute right-[14px] top-[3.55rem] h-2.5 w-2.5 rounded-full bg-accent shadow-[0_0_14px_rgb(var(--accent))]" style={{ animation: "fade-up 0.5s var(--ease) 2s both" }} />
            </div>
            <div className="rise-in rounded-2xl border border-line bg-bg/60 p-3.5" style={{ animationDelay: "1.15s" }}>
              <p className="text-[11px] font-medium">{t("host.agenda")}</p>
              <div className="mt-2 grid grid-cols-7 gap-1 text-center text-[9px] text-muted">
                {[9, 10, 11, 12, 13, 14, 15].map((d) => (
                  <span key={d} className={`rounded-md py-1 ${d === 10 ? "bg-accent font-semibold text-onaccent" : ""}`}>{d}</span>
                ))}
              </div>
              <div className="mt-2.5 rounded-lg border-l-[3px] border-l-accent bg-surface/60 px-2.5 py-1.5">
                <p className="text-[11px] font-medium">Familia Ortega</p>
                <p className="text-[9px] text-muted">Villa Palmera · 5</p>
              </div>
            </div>
          </div>
          <ul className="mt-3 space-y-2">
            {props.map((p) => (
              <li key={p.name} className="rise-in flex items-center gap-3 rounded-2xl border border-line bg-bg/60 p-2" style={{ animationDelay: p.v === 0 ? "1.3s" : "1.45s" }}>
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
  { name: "Casa del Árbol", v: 0, bars: [{ guest: "Marta López", start: 2, span: 5, tone: "success" }, { guest: "Jorge Ruiz", start: 9, span: 5, tone: "accent" }] },
  { name: "Villa Palmera", v: 1, bars: [{ guest: "Diego F.", start: 1, span: 3, tone: "muted" }, { guest: "Clara Soto", start: 6, span: 4, tone: "accent" }, { guest: "Pablo Vega", start: 12, span: 4, tone: "accent" }] },
  { name: "Cabaña del Pinar", v: 2, bars: [{ guest: "Familia Ortega", start: 4, span: 7, tone: "accent" }, { guest: "Lucas Gil", start: 12, span: 3, tone: "accent" }] },
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
    <div className="fx-card fx-hero overflow-hidden rounded-[24px]" role="img" aria-label={t("landing.blocks.schedule.alt")}>
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

export function QrArt() {
  const cells = Array.from({ length: 81 }, (_, i) => ((i * i * 7 + i * 13 + 3) % 11 < 5 ? 1 : 0));
  return (
    <div className="mx-auto flex items-center justify-center gap-4">
      <svg aria-hidden viewBox="0 0 9 9" className="h-28 w-28 shrink-0 rounded-2xl bg-white p-2 shadow-[0_0_50px_-12px_rgb(var(--accent))]" shapeRendering="crispEdges">
        {cells.map((c, i) => (c ? <rect key={i} x={i % 9} y={Math.floor(i / 9)} width="1" height="1" fill="#06101f" /> : null))}
        {[[0, 0], [6, 0], [0, 6]].map(([x, y]) => (
          <g key={`${x}${y}`}>
            <rect x={x} y={y} width="3" height="3" fill="#06101f" />
            <rect x={x! + 0.5} y={y! + 0.5} width="2" height="2" fill="#fff" />
            <rect x={x! + 1} y={y! + 1} width="1" height="1" fill="#06101f" />
          </g>
        ))}
      </svg>
      <div aria-hidden className="space-y-2 text-[11px] text-muted">
        {["Wi-Fi", "Check-in", "Restaurantes"].map((x) => (
          <p key={x} className="flex items-center gap-2 rounded-lg border border-line bg-bg/60 px-2.5 py-1.5"><Icon name="check" className="h-3 w-3 text-accent" />{x}</p>
        ))}
      </div>
    </div>
  );
}

const frame = "fx-card fx-hero overflow-hidden rounded-[24px] p-4 sm:p-5";

/** Bookings list with status flow and the guard against double bookings. */
export function BookingsMock() {
  const rows: { name: string; prop: string; dates: string; pill: string; tone: "accent" | "success"; action?: string; v: 0 | 1 | 2 }[] = [
    { name: "Marta López", prop: "Casa del Árbol", dates: "7 → 12 nov · 5 noches", pill: t("landing.mock.stay"), tone: "success", v: 0 },
    { name: "Jorge Ruiz", prop: "Casa del Árbol", dates: "14 → 19 nov · 5 noches", pill: t("landing.mock.confirmed"), tone: "accent", action: t("landing.mock.checkIn"), v: 0 },
    { name: "Familia Ortega", prop: "Cabaña del Pinar", dates: "11 → 18 nov · 7 noches", pill: t("landing.mock.confirmed"), tone: "accent", action: t("landing.mock.checkIn"), v: 2 },
  ];
  return (
    <div className={frame}>
      <ul className="space-y-2.5">
        {rows.map((r) => (
          <li key={r.name} className="flex items-center gap-3 rounded-2xl border border-line bg-bg/60 p-2.5">
            <SceneArt variant={r.v} className="hidden h-14 w-20 shrink-0 rounded-xl sm:block" />
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2"><span className="font-display text-sm">{r.name}</span><Pill tone={r.tone}>{r.pill}</Pill></p>
              <p className="mt-0.5 truncate text-[11px] text-muted">{r.prop} · {r.dates}</p>
            </div>
            {r.action && <span className="fx-btn hidden shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-onaccent sm:block">{r.action}</span>}
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-start gap-3 rounded-2xl border border-danger/40 bg-danger/10 p-3.5">
        <span className="mt-0.5 text-danger"><Icon name="alert" className="h-[18px] w-[18px]" /></span>
        <div>
          <p className="text-sm font-medium text-danger">{t("landing.blocks.bookings.guard")}</p>
          <p className="mt-0.5 text-[11px] text-muted">Beto Pisa · 9 → 13 nov · Casa del Árbol</p>
        </div>
      </div>
    </div>
  );
}

/** Guest directory built from bookings + the QR guide. */
export function GuestsMock() {
  const guests = [
    { n: "Marta López", s: 3, last: "12 nov" },
    { n: "Jorge Ruiz", s: 1, last: "19 nov" },
    { n: "Sofía Marín", s: 2, last: "20 oct" },
  ];
  return (
    <div className={frame}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{t("landing.mock.guestsTitle")}</p>
      <ul className="mt-3 divide-y divide-line/60">
        {guests.map((g) => (
          <li key={g.n} className="flex items-center gap-3 py-2.5">
            <Avatar name={g.n} />
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{g.n}</span>
            <span className="text-[11px] text-muted">{g.s} {t("landing.blocks.guests.stays")} · {g.last}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 rounded-2xl border border-line bg-bg/60 p-4">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{t("landing.mock.guideTitle")}</p>
        <QrArt />
      </div>
    </div>
  );
}

/** Task list plus the bell's alerts. */
export function TasksMock() {
  const alerts: { icon: IconName; text: string; sub: string; tone: string }[] = [
    { icon: "alert", text: t("host.alertLate", { count: 2 }), sub: "Cambiar sábanas · Casa del Árbol", tone: "text-danger" },
    { icon: "alert", text: t("host.alertDeparturePending", { name: "Pablo" }), sub: "Villa Palmera", tone: "text-amber-300" },
    { icon: "login", text: t("host.alertArrivalsToday", { count: 1 }), sub: t("host.alertRegister"), tone: "text-success" },
  ];
  const tasks: { t: string; due: string; late?: boolean; done?: boolean }[] = [
    { t: "Cambiar sábanas", due: "Para el 8 nov", late: true },
    { t: "Revisar la caldera", due: "Para el 11 nov" },
    { t: "Reponer amenities", due: "Hecha", done: true },
  ];
  return (
    <div className={frame}>
      <ul className="space-y-3 rounded-2xl border border-line bg-bg/60 p-4">
        {alerts.map((a) => (
          <li key={a.text} className="flex items-start gap-3">
            <span className={`mt-0.5 ${a.tone}`}><Icon name={a.icon} className="h-[18px] w-[18px]" /></span>
            <span className="min-w-0"><span className="block truncate text-sm font-medium">{a.text}</span><span className={`block truncate text-[11px] ${a.tone}`}>{a.sub}</span></span>
          </li>
        ))}
      </ul>
      <p className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{t("landing.mock.tasksTitle")}</p>
      <ul className="space-y-2">
        {tasks.map((k) => (
          <li key={k.t} className="flex items-center gap-3 text-sm">
            <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${k.done ? "border-accent bg-accent text-onaccent" : "border-line"}`}>{k.done && <Icon name="check" className="h-3 w-3" />}</span>
            <span className={`flex-1 ${k.done ? "text-muted line-through" : "font-medium"}`}>{k.t}</span>
            <span className={`text-[11px] ${k.late ? "text-danger" : "text-muted"}`}>{k.due}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** "What you collect is not what you earn", drawn as bars that grow in. */
export function ProfitMock() {
  const rows: { label: string; amount: string; width: number; tone: "accent" | "danger" | "net"; strong?: boolean }[] = [
    { label: t("landing.blocks.profit.collected"), amount: "US$ 1.251", width: 100, tone: "accent" },
    { label: t("landing.blocks.profit.expenses"), amount: "−US$ 200", width: 16, tone: "danger" },
    { label: t("landing.blocks.profit.fixed"), amount: "−US$ 50", width: 4, tone: "danger" },
    { label: t("landing.blocks.profit.net"), amount: "US$ 1.001", width: 80, tone: "net", strong: true },
  ];
  const fill = (tone: "accent" | "danger" | "net") =>
    tone === "danger" ? "rgb(var(--danger) / 0.75)" : tone === "net" ? "linear-gradient(90deg, rgb(var(--accent)), rgb(var(--accent-2)))" : "rgb(var(--accent) / 0.45)";
  return (
    <div className={`${frame} !p-6`}>
      <ul className="space-y-6">
        {rows.map((r) => (
          <li key={r.label}>
            <div className="flex items-baseline justify-between gap-4 text-sm">
              <span className={r.strong ? "font-semibold" : "text-muted"}>{r.label}</span>
              <span className={`font-display tabular-nums ${r.strong ? "text-xl text-money" : "text-base"}`}>{r.amount}</span>
            </div>
            <div className="mt-2.5 h-2.5 rounded-full bg-bg">
              <div className="grow-view h-full rounded-full" style={{ width: `${r.width}%`, background: fill(r.tone) }} />
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-6 grid grid-cols-2 gap-3">
        {[["Casa del Árbol", "US$ 1.126", false], ["Villa Palmera", "-US$ 125", true]].map(([n, v, neg]) => (
          <div key={n as string} className="rounded-2xl border border-line bg-bg/60 p-3.5">
            <p className="truncate text-[11px] font-medium">{n}</p>
            <p className={`font-display mt-1.5 text-xl tabular-nums ${neg ? "text-danger" : ""}`}>{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
