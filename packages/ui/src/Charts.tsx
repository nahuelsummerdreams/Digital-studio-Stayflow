"use client";

import { useId, useRef, useState, type ReactNode } from "react";

export const CHART_COLORS = [
  "rgb(var(--accent))",
  "rgb(var(--accent-2))",
  "rgb(139 92 246)",
  "rgb(251 191 36)",
  "rgb(139 151 173)",
] as const;

export interface Series {
  name: string;
  values: number[];
  /** Any CSS color. Defaults to the theme accent. */
  color?: string;
}

/** Smooth line through the points (monotone-ish Catmull-Rom). */
function smooth(pts: readonly (readonly [number, number])[]): string {
  if (pts.length < 2) return "";
  let d = `M${pts[0]![0].toFixed(2)} ${pts[0]![1].toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const lo = Math.min(p1[1], p2[1]);
    const hi = Math.max(p1[1], p2[1]);
    const c1y = Math.min(hi, Math.max(lo, p1[1] + (p2[1] - p0[1]) / 6));
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = Math.min(hi, Math.max(lo, p2[1] - (p3[1] - p1[1]) / 6));
    d += ` C${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  return d;
}

const W = 600;
const H = 220;

/**
 * Area/line chart with gridlines, axis labels and a hover readout. SVG for the shapes, HTML for the text,
 * so labels stay crisp at any width. Pass `describe` for the screen-reader summary.
 */
export function AreaChart({
  labels,
  series,
  format,
  height = "h-56",
  describe,
  min = 0,
}: {
  labels: string[];
  series: Series[];
  format: (n: number) => string;
  height?: string;
  describe: string;
  min?: number;
}) {
  const id = useId().replace(/:/g, "");
  const box = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const n = labels.length;
  if (n < 2 || series.length === 0) return null;

  const rawMax = Math.max(...series.flatMap((s) => s.values), min + 1);
  const step = niceStep((rawMax - min) / 4);
  const max = Math.ceil(rawMax / step) * step;
  const ticks = Array.from({ length: Math.round((max - min) / step) + 1 }, (_, i) => min + i * step);
  const x = (i: number) => (i / (n - 1)) * W;
  const y = (v: number) => H - 6 - ((v - min) / (max - min || 1)) * (H - 14);

  function onMove(clientX: number) {
    const r = box.current?.getBoundingClientRect();
    if (!r) return;
    const ratio = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    setHover(Math.round(ratio * (n - 1)));
  }

  return (
    <div className="relative">
      <div className="flex">
        <div aria-hidden className={`relative mr-3 w-9 shrink-0 text-right text-[11px] tabular-nums text-muted ${height}`}>
          {ticks.map((t) => (
            <span key={t} className="absolute right-0 -translate-y-1/2" style={{ top: `${(y(t) / H) * 100}%` }}>
              {format(t)}
            </span>
          ))}
        </div>
        <div
          ref={box}
          role="img"
          aria-label={describe}
          className={`relative min-w-0 flex-1 touch-pan-y ${height}`}
          onPointerMove={(e) => onMove(e.clientX)}
          onPointerLeave={() => setHover(null)}
        >
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
            <defs>
              {series.map((s, i) => (
                <linearGradient key={i} id={`ac-${id}-${i}`} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor={s.color ?? CHART_COLORS[0]} stopOpacity="0.32" />
                  <stop offset="1" stopColor={s.color ?? CHART_COLORS[0]} stopOpacity="0" />
                </linearGradient>
              ))}
            </defs>
            {ticks.map((t) => (
              <line key={t} x1={0} x2={W} y1={y(t)} y2={y(t)} stroke="rgb(var(--line))" strokeOpacity={0.7} strokeDasharray="3 5" vectorEffect="non-scaling-stroke" />
            ))}
            {series.map((s, i) => {
              const pts = s.values.map((v, k) => [x(k), y(v)] as const);
              const line = smooth(pts);
              return (
                <g key={i}>
                  <path d={`${line} L${W} ${H} L0 ${H} Z`} fill={`url(#ac-${id}-${i})`} style={{ animation: "fade-up 0.9s var(--ease) both" }} />
                  <path
                    d={line}
                    fill="none"
                    stroke={s.color ?? CHART_COLORS[0]}
                    strokeWidth={2.2}
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                    pathLength={1}
                    style={{ strokeDasharray: 1, strokeDashoffset: 1, animation: "draw 1.4s var(--ease) 0.15s forwards", filter: "drop-shadow(0 0 6px rgb(var(--accent) / 0.45))" }}
                  />
                </g>
              );
            })}
            {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={0} y2={H} stroke="rgb(var(--fg))" strokeOpacity={0.25} vectorEffect="non-scaling-stroke" />}
          </svg>
          {hover !== null &&
            series.map((s, i) => (
              <span
                key={i}
                aria-hidden
                className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-bg"
                style={{ left: `${(x(hover) / W) * 100}%`, top: `${(y(s.values[hover] ?? 0) / H) * 100}%`, background: s.color ?? CHART_COLORS[0], boxShadow: `0 0 12px ${s.color ?? CHART_COLORS[0]}` }}
              />
            ))}
          {hover !== null && (
            <div
              aria-hidden
              className="pointer-events-none absolute top-0 z-10 min-w-[7rem] -translate-x-1/2 rounded-xl border border-line bg-surface2/95 px-3 py-2 text-xs shadow-xl backdrop-blur"
              style={{ left: `${Math.min(88, Math.max(12, (x(hover) / W) * 100))}%` }}
            >
              <p className="font-medium text-fg">{labels[hover]}</p>
              {series.map((s, i) => (
                <p key={i} className="mt-1 flex items-center gap-2 text-muted">
                  <i className="h-2 w-2 rounded-full" style={{ background: s.color ?? CHART_COLORS[0] }} />
                  {s.name} <span className="ml-auto font-semibold tabular-nums text-fg">{format(s.values[hover] ?? 0)}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
      <div aria-hidden className="ml-12 mt-2 flex justify-between text-[11px] text-muted">
        {labels.map((l, i) => (
          <span key={i} className={hover === i ? "text-fg" : ""}>{l}</span>
        ))}
      </div>
    </div>
  );
}

function niceStep(raw: number): number {
  const pow = 10 ** Math.floor(Math.log10(raw || 1));
  const f = raw / pow;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * pow;
}

export interface Slice {
  label: string;
  value: number;
  color?: string;
}

/** Donut with a centre readout and a legend. Slices draw in one after another. */
export function DonutChart({ slices, center, describe, format }: { slices: Slice[]; center: ReactNode; describe: string; format: (n: number) => string }) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  const R = 42;
  const C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative h-40 w-40 shrink-0" role="img" aria-label={describe}>
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r={R} fill="none" stroke="rgb(var(--line))" strokeOpacity={0.5} strokeWidth="9" />
          {total > 0 &&
            slices.map((s, i) => {
              const len = (s.value / total) * C;
              const gap = slices.length > 1 ? 2.2 : 0;
              const el = (
                <circle
                  key={s.label}
                  cx="50"
                  cy="50"
                  r={R}
                  fill="none"
                  stroke={s.color ?? CHART_COLORS[i % CHART_COLORS.length]}
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={`${Math.max(0, len - gap)} ${C}`}
                  strokeDashoffset={-offset}
                  style={{ animation: `fade-up 0.8s var(--ease) ${i * 120}ms both`, filter: "drop-shadow(0 0 4px rgb(0 0 0 / 0.4))" }}
                />
              );
              offset += len;
              return el;
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{center}</div>
      </div>
      <ul className="w-full min-w-0 flex-1 space-y-2.5 text-sm">
        {slices.map((s, i) => (
          <li key={s.label} className="flex items-center gap-2.5">
            <i className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color ?? CHART_COLORS[i % CHART_COLORS.length] }} />
            <span className="min-w-0 flex-1 truncate text-muted">{s.label}</span>
            <span className="tabular-nums">{format(s.value)}</span>
            <span className="w-10 text-right tabular-nums text-muted">{total ? Math.round((s.value / total) * 100) : 0} %</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
