"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Counts up to `value` (and between values when it changes). Screen readers get the final number only.
 * With "reduce motion" it shows the value at once.
 */
export function AnimatedNumber({ value, format, duration = 900 }: { value: number; format: (n: number) => string; duration?: number }) {
  const [shown, setShown] = useState(value);
  const from = useRef<number | null>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = from.current ?? 0;
    if (reduce || start === value) {
      from.current = value;
      setShown(value);
      return;
    }
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = start + (value - start) * eased;
      from.current = v;
      setShown(v);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return (
    <>
      <span aria-hidden>{format(shown)}</span>
      <span className="sr-only">{format(value)}</span>
    </>
  );
}
