"use client";

import { useEffect, useState } from "react";
import { Icon } from "@stayflow/ui";
import { useMessages } from "@/i18n/client";

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const HUES = [28, 203, 312];

/**
 * A chat window that "plays" three conversations in a loop: someone types an @command, the agent answers with a
 * result to approve. It is a preview of what Stayflow AI will do, and the page says so.
 */
export function AgentDemo() {
  const { m } = useMessages();
  const scenes = m.agents.scenes;
  const [i, setI] = useState(0);
  const [typed, setTyped] = useState(scenes[0]!.cmd.length);
  const [replied, setReplied] = useState(true);

  useEffect(() => {
    if (reduced()) return;
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const play = (n: number) => {
      if (cancelled) return;
      const cmd = scenes[n]!.cmd;
      setI(n);
      setReplied(false);
      setTyped(0);
      let k = 0;
      const tick = () => {
        if (cancelled) return;
        k += 1;
        setTyped(k);
        if (k < cmd.length) timers.push(setTimeout(tick, 38));
        else {
          timers.push(setTimeout(() => !cancelled && setReplied(true), 700));
          timers.push(setTimeout(() => play((n + 1) % scenes.length), 5200));
        }
      };
      timers.push(setTimeout(tick, 600));
    };
    timers.push(setTimeout(() => play(1), 3500));
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [scenes]);

  const s = scenes[i]!;
  const hue = HUES[i % HUES.length]!;
  return (
    <div className="fx-card fx-hero sheen overflow-hidden rounded-[28px] text-left" style={{ ["--agent" as string]: hue }}>
      <div className="flex items-center gap-2 border-b border-line/70 bg-surface2/40 px-4 py-3">
        <span aria-hidden className="flex gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-danger/70" /><i className="h-2.5 w-2.5 rounded-full bg-amber-300/70" /><i className="h-2.5 w-2.5 rounded-full bg-success/70" /></span>
        <span className="mx-auto flex items-center gap-2 text-xs font-semibold"><Icon name="sparkles" className="h-3.5 w-3.5 text-accent" />Stayflow AI</span>
        <span className="rounded-full border border-line px-2 py-0.5 text-[10px] text-muted">{m.agents.example}</span>
      </div>
      <div className="min-h-[19rem] space-y-4 p-5 sm:min-h-[20rem]">
        <div className="flex justify-end">
          <p className="max-w-[88%] rounded-2xl rounded-br-md bg-accent px-4 py-2.5 text-sm font-medium text-onaccent" aria-live="polite">
            {s.cmd.slice(0, typed)}
            {typed < s.cmd.length && <span aria-hidden className="ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 animate-pulse bg-onaccent" />}
          </p>
        </div>
        {replied && (
          <div key={i} className="rise-in flex gap-3">
            <span aria-hidden className="relative mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white" style={{ background: `radial-gradient(circle at 30% 25%, hsl(${hue} 100% 70%), hsl(${hue} 100% 42%))`, boxShadow: `0 0 1.1rem hsl(${hue} 100% 55%)` }}>
              <Icon name="sparkles" className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md border border-line bg-bg/60 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: `hsl(${hue} 100% 70%)` }}>{s.agent}</p>
              <p className="font-display mt-1 text-base">{s.title}</p>
              <ul className="mt-3 space-y-2">
                {s.lines.map((l) => (
                  <li key={l} className="flex items-start gap-2.5 text-sm text-muted"><Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-success" />{l}</li>
                ))}
              </ul>
              <span className="fx-btn mt-4 inline-flex rounded-lg px-4 py-2 text-xs font-semibold text-onaccent">{m.agents.approve}</span>
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 border-t border-line/70 px-4 py-3 text-xs text-muted">
        <span className="rounded-md border border-line px-1.5 py-0.5 font-mono text-accent">@</span>
        {m.agents.hint}
      </div>
    </div>
  );
}
