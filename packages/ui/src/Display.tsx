import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

export type Tone = "accent" | "success" | "danger" | "warning" | "muted";

const TONE: Record<Tone, string> = {
  accent: "border-accent/30 bg-accent/10 text-accent",
  success: "border-success/30 bg-success/10 text-success",
  danger: "border-danger/30 bg-danger/10 text-danger",
  warning: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  muted: "border-line bg-line/40 text-muted",
};
const DOT: Record<Tone, string> = {
  accent: "bg-accent",
  success: "bg-success",
  danger: "bg-danger",
  warning: "bg-amber-300",
  muted: "bg-muted",
};
export const TONE_TEXT: Record<Tone, string> = {
  accent: "text-accent",
  success: "text-success",
  danger: "text-danger",
  warning: "text-amber-300",
  muted: "text-muted",
};

/** Small status label with a dot. */
export function Pill({ tone = "muted", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-medium ${TONE[tone]}`}>
      <i className={`h-1.5 w-1.5 rounded-full ${DOT[tone]}`} />
      {children}
    </span>
  );
}

/** Horizontal meter that grows in. `value` is 0-100. */
export function ProgressBar({ value, tone = "accent", label }: { value: number; tone?: Tone; label: string }) {
  const pct = Math.min(100, Math.max(0, value));
  const fill = tone === "accent" ? "linear-gradient(90deg, rgb(var(--accent)), rgb(var(--accent-2)))" : tone === "success" ? "rgb(var(--success))" : tone === "danger" ? "rgb(var(--danger))" : tone === "warning" ? "rgb(251 191 36)" : "rgb(var(--muted))";
  return (
    <div role="progressbar" aria-label={label} aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} className="h-1.5 w-full overflow-hidden rounded-full bg-line/70">
      <div className="h-full origin-left rounded-full" style={{ width: `${pct}%`, background: fill, animation: "grow-x 1s var(--ease) both", boxShadow: tone === "accent" ? "0 0 12px rgb(var(--accent) / 0.55)" : undefined }} />
    </div>
  );
}

/** Round initial, colored from the name so the same person always looks the same. */
export function Avatar({ name, className = "h-9 w-9 text-sm" }: { name: string; className?: string }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
  const hue = hash(name) % 360;
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${className}`}
      style={{ background: `linear-gradient(135deg, hsl(${hue} 70% 52%), hsl(${(hue + 40) % 360} 70% 38%))` }}
    >
      {initials}
    </span>
  );
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** A property's cover photo; without one, a tasteful gradient so the layout never looks broken. */
export function PropertyPhoto({ url, name, className = "h-24 w-36 rounded-xl" }: { url?: string | null; name: string; className?: string }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" loading="lazy" decoding="async" className={`shrink-0 bg-surface2 object-cover ${className}`} />;
  }
  const hue = hash(name) % 360;
  return (
    <span
      aria-hidden
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden text-white/80 ${className}`}
      style={{ background: `radial-gradient(120% 120% at 20% 10%, hsl(${hue} 60% 38%), hsl(${(hue + 50) % 360} 55% 14%))` }}
    >
      <Icon name="building" className="h-1/3 w-1/3 opacity-80" />
    </span>
  );
}

/** Headline figure with icon, delta and an optional trend line slot. */
export function StatCard({
  label,
  icon,
  children,
  sub,
  hero = false,
  className = "",
}: {
  label: string;
  icon: IconName;
  children: ReactNode;
  sub?: ReactNode;
  hero?: boolean;
  className?: string;
}) {
  return (
    <article className={`fx-card overflow-hidden rounded-card p-4 sm:p-5 ${hero ? "fx-hero" : ""} ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] text-muted">{label}</p>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-accent/20 bg-accent/10 text-accent">
          <Icon name={icon} className="h-4 w-4" />
        </span>
      </div>
      <div className="font-display tabular mt-3 text-3xl sm:text-4xl">{children}</div>
      {sub && <div className="mt-2 text-xs text-muted">{sub}</div>}
    </article>
  );
}

/** "+12,4 %" in green, "-3 %" in red. `upIsGood=false` flips the meaning. */
export function Delta({ pct, upIsGood = true, suffix }: { pct: number | null; upIsGood?: boolean; suffix?: string }) {
  if (pct === null || !Number.isFinite(pct)) return null;
  const good = upIsGood ? pct >= 0 : pct <= 0;
  const text = `${pct > 0 ? "+" : ""}${pct.toFixed(1).replace(".", ",")} %`;
  return (
    <span className="mt-3 flex items-center gap-1.5 font-sans text-xs font-normal tracking-normal">
      <span className={`inline-flex items-center gap-1 font-medium ${good ? "text-success" : "text-danger"}`}>
        <Icon name={pct >= 0 ? "trendUp" : "trendDown"} className="h-3.5 w-3.5" />
        {text}
      </span>
      {suffix && <span className="text-muted">{suffix}</span>}
    </span>
  );
}
