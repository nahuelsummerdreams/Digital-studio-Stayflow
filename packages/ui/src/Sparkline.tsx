import { useId } from "react";

/** Tiny trend line with a soft area. Draws itself in on load. Decorative: the figures carry the meaning. */
export function Sparkline({ values, className = "h-10 w-full" }: { values: number[]; className?: string }) {
  const id = useId().replace(/:/g, "");
  if (values.length < 2) return null;
  const w = 100;
  const h = 32;
  const min = Math.min(...values);
  const span = Math.max(...values) - min || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - 3 - ((v - min) / span) * (h - 8)] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${line} L${w} ${h} L0 ${h} Z`;
  const last = pts[pts.length - 1]!;
  return (
    <svg aria-hidden viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={className}>
      <defs>
        <linearGradient id={`sp-${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="rgb(var(--accent))" stopOpacity="0.45" />
          <stop offset="1" stopColor="rgb(var(--accent))" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sp-${id})`} />
      <path
        d={line}
        fill="none"
        stroke="rgb(var(--accent))"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        pathLength={1}
        style={{ strokeDasharray: 1, strokeDashoffset: 1, animation: "draw 1.3s var(--ease) 0.2s forwards" }}
      />
      <circle cx={last[0]} cy={last[1]} r={1.6} fill="rgb(var(--accent))" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
