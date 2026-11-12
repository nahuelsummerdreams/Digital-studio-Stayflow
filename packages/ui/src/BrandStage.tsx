"use client";

import { useT } from "@stayflow/i18n";
import { DigitalStudioLogo } from "./DigitalStudioLogo";

/** Fixed positions (no randomness, so server and client render the same). x/y in %, d = delay s, s = size px, t = duration s. */
const SPARKS = [
  { x: 12, y: 62, d: 0, s: 3, t: 7 }, { x: 22, y: 30, d: 1.2, s: 2, t: 9 }, { x: 34, y: 78, d: 2.1, s: 4, t: 8 },
  { x: 48, y: 16, d: 0.6, s: 2, t: 10 }, { x: 60, y: 84, d: 3, s: 3, t: 7.5 }, { x: 72, y: 26, d: 1.8, s: 4, t: 9.5 },
  { x: 84, y: 66, d: 0.3, s: 2, t: 8.5 }, { x: 90, y: 38, d: 2.6, s: 3, t: 10 }, { x: 6, y: 40, d: 3.4, s: 2, t: 11 },
  { x: 54, y: 52, d: 4, s: 2, t: 9 }, { x: 28, y: 52, d: 2.4, s: 3, t: 12 }, { x: 78, y: 82, d: 1, s: 2, t: 8 },
] as const;

/**
 * Cinematic opening: the Stayflow mark at the center with light rings, a drawn wave and drifting sparks,
 * the product name underneath, and "a product by Digital Studio" so the customer sees who stands behind it.
 * `compact` is the loading splash; the default sits above the sign-in form.
 */
export function BrandStage({ product, tagline, compact = false }: { product: string; tagline?: string; compact?: boolean }) {
  const t = useT();
  const name = product.replace(/^Stayflow\s*/i, "");
  return (
    <header className={`stage ${compact ? "stage-compact" : ""}`}>
      <div className="stage-by">
        <span>{t("common.productBy")}</span>
        <DigitalStudioLogo className="h-7 w-auto text-fg" />
      </div>

      <div className="stage-core" aria-hidden>
        <span className="stage-halo" />
        <span className="stage-ring stage-ring-a" />
        <span className="stage-ring stage-ring-b" />
        {SPARKS.map((p, i) => (
          <i key={i} className="stage-spark" style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.s, height: p.s, animationDelay: `${p.d}s`, animationDuration: `${p.t}s` }} />
        ))}
        <span className="stage-tile">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" className="stage-wave">
            <path pathLength={1} d="M3 15c2.6 0 2.6-6 6-6s3.4 6 6 6 2.6-6 6-6" />
          </svg>
        </span>
      </div>

      <div className="stage-name">
        <p className="stage-word font-display">Stayflow</p>
        {name && <p className="stage-product">{name}</p>}
        {tagline && !compact && <p className="stage-tag">{tagline}</p>}
      </div>
    </header>
  );
}
