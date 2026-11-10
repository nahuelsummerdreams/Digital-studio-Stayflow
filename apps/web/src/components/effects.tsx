"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useCart } from "./cart";

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

/** A soft light that follows the cursor across the whole page. Desktop mice only. */
export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (reduced() || !window.matchMedia("(hover: hover)").matches) return;
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let x = 0;
    let y = 0;
    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!raf) raf = requestAnimationFrame(() => {
        raf = 0;
        el.style.transform = `translate3d(${x - 260}px, ${y - 260}px, 0)`;
        el.style.opacity = "1";
      });
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);
  return <div ref={ref} aria-hidden className="pointer-events-none fixed left-0 top-0 z-[5] h-[520px] w-[520px] rounded-full opacity-0 mix-blend-screen transition-opacity duration-500" style={{ background: "radial-gradient(closest-side, rgb(var(--accent) / 0.16), transparent)" }} />;
}

/** Thin progress bar at the top that fills as you scroll. Pure CSS, so it costs nothing. */
export function ScrollProgress() {
  return <div aria-hidden className="scroll-progress" />;
}

const SPARK_COLORS = ["rgb(var(--accent))", "rgb(var(--accent-2))", "#fff", "#ffd36b"];

/** A burst of sparks from the middle of whatever it wraps. Used when something goes into the cart. */
export function useBurst() {
  const [bursts, setBursts] = useState<number[]>([]);
  const fire = () => {
    if (reduced()) return;
    const id = Date.now() + Math.random();
    setBursts((b) => [...b, id]);
    setTimeout(() => setBursts((b) => b.filter((x) => x !== id)), 900);
  };
  const layer = (
    <span aria-hidden className="pointer-events-none absolute inset-0 overflow-visible">
      {bursts.map((id) => Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const r = 38 + (i % 3) * 14;
        return <i key={`${id}-${i}`} className="spark" style={{ "--dx": `${Math.cos(a) * r}px`, "--dy": `${Math.sin(a) * r}px`, background: SPARK_COLORS[i % SPARK_COLORS.length] } as CSSProperties} />;
      }))}
    </span>
  );
  return { fire, layer };
}

/** Confetti over the whole screen the moment the 30% discount unlocks. */
export function Celebration() {
  const { celebrate } = useCart();
  const [run, setRun] = useState(0);
  useEffect(() => {
    if (!celebrate || reduced()) return;
    setRun(celebrate);
    const t = setTimeout(() => setRun(0), 3200);
    return () => clearTimeout(t);
  }, [celebrate]);
  if (!run) return null;
  const colors = ["rgb(var(--accent))", "rgb(var(--accent-2))", "#ffd36b", "#ff6b8b", "#fff"];
  return (
    <div aria-hidden key={run}>
      {Array.from({ length: 44 }, (_, i) => (
        <i key={i} className="confetti" style={{ left: `${(i * 97) % 100}%`, background: colors[i % colors.length], "--dx": `${((i * 53) % 160) - 80}px`, "--rot": `${(i * 47) % 720}deg`, "--dur": `${1.6 + ((i * 13) % 14) / 10}s`, "--delay": `${((i * 7) % 10) / 20}s` } as CSSProperties} />
      ))}
    </div>
  );
}

/** Drifting glowing specks, for behind a hero. Positions are fixed so the markup is the same every render. */
export function Motes({ count = 14 }: { count?: number }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: count }, (_, i) => (
        <i key={i} className="mote" style={{ left: `${(i * 37 + 7) % 100}%`, top: `${40 + ((i * 23) % 55)}%`, width: 3 + (i % 3) * 2, height: 3 + (i % 3) * 2, "--dur": `${5 + (i % 5)}s`, "--delay": `${(i * 0.7) % 6}s` } as CSSProperties} />
      ))}
    </div>
  );
}

export { type ReactNode };
