"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Counts up to `value` when it first appears. The final number is in the markup from the start (search engines and
 * no-JS visitors see it), and people who asked for less motion never see the count.
 */
export function CountUp({ value, decimals = 0, prefix = "", suffix = "", duration = 1600, delay = 500 }: { value: number; decimals?: number; prefix?: string; suffix?: string; duration?: number; delay?: number }) {
  const [shown, setShown] = useState(value);
  useEffect(() => {
    if (reduced()) return;
    let raf = 0;
    let start = 0;
    setShown(0);
    const timer = setTimeout(() => {
      const tick = (now: number) => {
        start ||= now;
        const p = Math.min(1, (now - start) / duration);
        setShown(value * (1 - Math.pow(1 - p, 3)));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [value, duration, delay]);
  const text = shown.toLocaleString("es-ES", { minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping: "always" as unknown as boolean });
  return <span className="tabular-nums">{prefix}{text}{suffix}</span>;
}

/** Tilts toward the pointer, like a real device on a desk. Flat for touch screens and for reduced motion. */
export function Tilt({ children, max = 7, className = "" }: { children: ReactNode; max?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  function move(e: React.PointerEvent) {
    if (reduced() || e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(1600px) rotateY(${(x * max * 2 - 8).toFixed(2)}deg) rotateX(${(-y * max + 2).toFixed(2)}deg)`;
  }
  function leave() {
    if (ref.current) ref.current.style.transform = "";
  }
  return (
    <div ref={ref} onPointerMove={move} onPointerLeave={leave} className={`transition-transform duration-500 ease-out lg:[transform:perspective(1600px)_rotateY(-8deg)_rotateX(2deg)] ${className}`}>
      {children}
    </div>
  );
}
