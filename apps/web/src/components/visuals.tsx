import { Icon, Pill, ProgressBar, type IconName } from "@stayflow/ui";
import type { ProductId } from "@/lib/catalog";

/** The two sample property photos. Variant 2 is a different crop of the villa, so three rows never look identical. */
const PHOTOS = [
  { src: "/photos/treehouse.jpg", pos: "50% 45%" },
  { src: "/photos/villa.jpg", pos: "40% 55%" },
  { src: "/photos/villa.jpg", pos: "88% 40%" },
] as const;

/** A property thumbnail. */
export function SceneArt({ variant = 0, className = "" }: { variant?: 0 | 1 | 2; className?: string }) {
  const p = PHOTOS[variant];
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={p.src} alt="" loading="lazy" decoding="async" className={`bg-surface2 object-cover ${className}`} style={{ objectPosition: p.pos }} />;
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
      return <div className={panel}><ScheduleVisual compact /><div className="flex gap-2"><Pill tone="success">Ocupada</Pill><Pill tone="accent">3 llegadas esta semana</Pill></div></div>;
    case "guest":
      return (
        <div className={`${panel} items-center`}>
          <div className="flex items-center gap-4">
            <QrArt className="h-24 w-24 shadow-[0_0_40px_-10px_rgb(var(--accent))]" />
            <div className="space-y-1.5 text-[11px]">
              {["Wi-Fi", "Check-in", "Reglas", "Cerca de ti"].map((x) => <p key={x} className="flex items-center gap-2 rounded-lg border border-line bg-surface/70 px-2.5 py-1.5"><Icon name="check" className="h-3 w-3 text-accent" />{x}</p>)}
            </div>
          </div>
        </div>
      );
    case "ai":
      return (
        <div className={panel}>
          <p className="max-w-[80%] rounded-2xl rounded-bl-md border border-line bg-surface/70 px-3.5 py-2 text-xs">¿Cuál es la clave del Wi-Fi?</p>
          <div className="ml-auto max-w-[88%] rounded-2xl rounded-br-md bg-accent/15 px-3.5 py-2 text-xs text-fg">
            <span className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-accent"><Icon name="sparkles" className="h-3 w-3" />Respuesta sugerida</span>
            ¡Hola! Los datos del Wi-Fi están en tu guía, en “Wi-Fi”. ¡Disfruta tu estadía!
          </div>
          <span className="ml-auto rounded-lg bg-accent px-3 py-1.5 text-[11px] font-semibold text-onaccent">Usar respuesta</span>
        </div>
      );
    case "profit":
      return (
        <div className={panel}>
          {[["Cobrado", 100, "rgb(var(--accent) / 0.5)", "1.251 €"], ["Gastos", 20, "rgb(var(--danger) / 0.8)", "−250 €"], ["Ganancia neta", 80, "rgb(var(--accent))", "1.001 €"]].map(([l, w, c, v]) => (
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
          {[["Limpiar la casa", "Jue", true], ["Reponer amenities", "Jue", true], ["Revisar la caldera", "Vie", false], ["Recibir al huésped", "Sáb", false]].map(([t, d, done]) => (
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
          <p className="font-display text-sm">Casa del árbol entre los pinos</p>
          <div className="space-y-1.5">{[100, 92, 76].map((w) => <div key={w} className="h-2 rounded-full bg-line/80" style={{ width: `${w}%` }} />)}</div>
          <div className="flex flex-wrap gap-2 text-[10px]">{["Vista al bosque", "Wi-Fi rápido", "Check-in autónomo"].map((x) => <span key={x} className="rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 text-accent">{x}</span>)}</div>
          <p className="flex items-center gap-1.5 text-[11px] text-muted"><Icon name="sparkles" className="h-3.5 w-3.5 text-accent" />Descripción optimizada</p>
        </div>
      );
    case "academy":
      return (
        <div className={panel}>
          {[["Empezar en alquileres temporarios", 100], ["Preparar tu propiedad", 60], ["Mejorar la experiencia del huésped", 20]].map(([t, p]) => (
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
          {[["Kayak al atardecer", "$45", 1], ["Caminata nocturna", "$60", 0]].map(([t, p, v]) => (
            <div key={t as string} className="flex-1 overflow-hidden rounded-xl border border-line bg-surface/70">
              <SceneArt variant={v as 0 | 1} className="h-16 w-full" />
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
            <div className="relative"><SceneArt variant={0} className="h-24 w-full" /><span className="absolute bottom-2 left-3 rounded-md bg-black/55 px-2 py-1 text-[11px] font-semibold text-white">Villa Palmera</span><span className="absolute bottom-2 right-3 rounded-md bg-accent px-2.5 py-1 text-[11px] font-semibold text-onaccent">Reservar</span></div>
          </div>
        </div>
      );
  }
}
