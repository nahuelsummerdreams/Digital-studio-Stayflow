import type { LodgingType } from "../api";

/** A small illustrated scene per category. Pure SVG: it follows the accent color of the person's theme. */
export function LodgingArt({ type }: { type: LodgingType }) {
  const id = `la-${type}`;
  const ink = "rgb(var(--fg) / 0.88)";
  const glass = "rgb(var(--accent))";
  return (
    <svg viewBox="0 0 240 120" role="img" aria-hidden className="h-full w-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="rgb(var(--accent) / 0.38)" />
          <stop offset="1" stopColor="rgb(var(--accent-2) / 0.10)" />
        </linearGradient>
      </defs>
      <rect width="240" height="120" fill={`url(#${id})`} />
      <circle cx="198" cy="26" r="11" fill="rgb(var(--fg) / 0.14)" />
      {type === "rental" && (
        <g>
          <rect x="26" y="26" width="68" height="94" rx="4" fill={ink} opacity="0.92" />
          {[0, 1, 2, 3].flatMap((r) => [0, 1, 2].map((c) => <rect key={`a${r}${c}`} x={36 + c * 19} y={36 + r * 20} width="11" height="12" rx="2" fill={glass} opacity={(r + c) % 3 === 0 ? 1 : 0.55} />))}
          <rect x="104" y="52" width="58" height="68" rx="4" fill={ink} opacity="0.7" />
          {[0, 1, 2].flatMap((r) => [0, 1].map((c) => <rect key={`b${r}${c}`} x={114 + c * 22} y={62 + r * 18} width="11" height="11" rx="2" fill={glass} opacity="0.7" />))}
          <polygon points="172,72 200,48 228,72" fill={ink} opacity="0.85" />
          <rect x="178" y="72" width="44" height="48" fill={ink} opacity="0.78" />
          <rect x="195" y="94" width="10" height="26" rx="2" fill={glass} />
        </g>
      )}
      {type === "hotel" && (
        <g>
          <rect x="30" y="64" width="40" height="56" rx="3" fill={ink} opacity="0.55" />
          <rect x="170" y="58" width="40" height="62" rx="3" fill={ink} opacity="0.55" />
          <rect x="72" y="14" width="96" height="106" rx="4" fill={ink} opacity="0.93" />
          <rect x="96" y="6" width="48" height="9" rx="3" fill={glass} />
          {[0, 1, 2, 3, 4].flatMap((r) => [0, 1, 2, 3].map((c) => <rect key={`h${r}${c}`} x={82 + c * 21} y={24 + r * 17} width="12" height="10" rx="2" fill={glass} opacity={(r * 3 + c) % 4 === 0 ? 1 : 0.5} />))}
          <rect x="92" y="104" width="56" height="7" rx="2" fill={glass} />
          <rect x="112" y="108" width="16" height="12" fill="rgb(var(--bg) / 0.9)" />
        </g>
      )}
      {type === "cabins" && (
        <g>
          <polygon points="0,120 52,62 96,120" fill={ink} opacity="0.32" />
          <polygon points="120,120 178,52 240,120" fill={ink} opacity="0.32" />
          {[28, 44].map((x, i) => <polygon key={`l${i}`} points={`${x - 11},120 ${x},${84 - i * 8} ${x + 11},120`} fill={ink} opacity="0.75" />)}
          {[200, 218].map((x, i) => <polygon key={`r${i}`} points={`${x - 11},120 ${x},${86 - i * 10} ${x + 11},120`} fill={ink} opacity="0.75" />)}
          <polygon points="82,120 120,50 158,120" fill={ink} opacity="0.95" />
          <polygon points="104,120 120,86 136,120" fill={glass} opacity="0.9" />
          <rect x="114" y="100" width="12" height="20" rx="2" fill="rgb(var(--bg) / 0.9)" />
        </g>
      )}
      {type === "hostel" && (
        <g>
          <rect x="62" y="18" width="7" height="102" rx="2" fill={ink} />
          <rect x="171" y="18" width="7" height="102" rx="2" fill={ink} />
          <rect x="62" y="40" width="116" height="9" rx="3" fill={ink} opacity="0.95" />
          <rect x="62" y="84" width="116" height="9" rx="3" fill={ink} opacity="0.95" />
          <rect x="72" y="26" width="92" height="14" rx="4" fill={glass} opacity="0.9" />
          <rect x="72" y="70" width="92" height="14" rx="4" fill={glass} opacity="0.65" />
          <rect x="72" y="22" width="22" height="8" rx="4" fill="rgb(var(--fg) / 0.9)" />
          <rect x="72" y="66" width="22" height="8" rx="4" fill="rgb(var(--fg) / 0.9)" />
          {[0, 1, 2, 3].map((i) => <rect key={i} x="178" y={52 + i * 13} width="16" height="3" rx="1.5" fill={ink} opacity="0.8" />)}
        </g>
      )}
    </svg>
  );
}
