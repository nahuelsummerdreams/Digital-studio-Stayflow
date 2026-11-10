"use client";

import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { DIM, type BoxSize } from "./box-dims";

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * A product "box" like a physical book or software pack: front cover, spine and page edge in real 3D.
 * It floats gently, turns toward the pointer (or a finger dragging on it), catches a glare of light, and hops when tapped.
 */
export function ProductBox({
  hue,
  size = "md",
  spine,
  children,
  label,
}: {
  hue: number;
  size?: BoxSize;
  spine: string;
  /** The cover artwork. Sized in `em`, with 1em = width / 13. */
  children: ReactNode;
  label: string;
}) {
  const { w, h, d } = DIM[size];
  const box = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);
  const [pop, setPop] = useState(0);

  function point(e: React.PointerEvent) {
    if (reduced()) return;
    const el = box.current;
    if (!el) return;
    const r = el.parentElement!.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    el.style.setProperty("--ry", `${(-26 + (x - 0.5) * 58).toFixed(1)}deg`);
    el.style.setProperty("--rx", `${(5 - (y - 0.5) * 30).toFixed(1)}deg`);
    el.style.setProperty("--gx", `${(x * 100).toFixed(0)}%`);
    el.style.setProperty("--gy", `${(y * 100).toFixed(0)}%`);
    setLive(true);
  }
  function rest() {
    const el = box.current;
    if (el) {
      el.style.removeProperty("--ry");
      el.style.removeProperty("--rx");
    }
    setLive(false);
  }

  const vars = { "--w": `${w}px`, "--h": `${h}px`, "--d": `${d}px`, "--hue": hue, fontSize: `${w / 13}px` } as CSSProperties;
  return (
    <div className="pbox-stage" onPointerMove={point} onPointerLeave={rest} onPointerCancel={rest} onPointerDown={(e) => { point(e); setPop((n) => n + 1); }} role="img" aria-label={label}>
      <div className="relative">
        <div className="pbox-plate" aria-hidden />
        <div key={pop} className={`pbox-float ${pop ? "pbox-pop" : ""}`} style={{ transformStyle: "preserve-3d" }}>
          <div ref={box} className={`pbox ${live ? "is-live" : ""}`} style={vars}>
            <div className="pbox-face pbox-back" />
            <div className="pbox-face pbox-pages" />
            <div className="pbox-face pbox-top" />
            <div className="pbox-face pbox-spine"><span style={{ fontSize: `${d * 0.42}px` }}>{spine}</span></div>
            <div className="pbox-face pbox-front">
              {children}
              <div className="pbox-glare" />
            </div>
          </div>
          <div className="pbox-shadow" aria-hidden />
        </div>
      </div>
    </div>
  );
}
