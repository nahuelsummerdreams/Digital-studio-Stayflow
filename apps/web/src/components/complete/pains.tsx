"use client";

import { useState, type ReactNode } from "react";
import { Icon, Sparkline, type IconName } from "@stayflow/ui";
import { fmt } from "@/i18n";
import { useMessages } from "@/i18n/client";
import { DEMO_TREND } from "@/lib/complete-demo";

const ICONS: IconName[] = ["wallet", "tasks", "calendar", "qr", "chart"];
const AMBER = "#f5b942";
const LIME = "rgb(var(--accent-2))";
const usd = (n: number): string => `US$ ${n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;

const Chip = ({ children, tone = "lime" }: { children: ReactNode; tone?: "lime" | "amber" | "blue" }) => {
  const c = tone === "lime" ? LIME : tone === "amber" ? AMBER : "rgb(var(--accent))";
  return <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold" style={{ borderColor: `${c}88`, color: c, background: `${tone === "blue" ? "rgb(var(--accent) / 0.12)" : tone === "lime" ? "rgb(var(--accent-2) / 0.12)" : `${AMBER}1f`}` }}>{children}</span>;
};

function VCobros({ v }: { v: ReturnType<typeof useV> }) {
  const rows = [
    { name: "Familia Rossi", pct: 30, left: 840, tone: "blue" as const },
    { name: "Carlos M.", pct: 0, left: 650, tone: "amber" as const, due: true },
    { name: "Marta P.", pct: 100, left: 0, tone: "lime" as const },
  ];
  return (
    <ul className="space-y-4">
      {rows.map((r) => (
        <li key={r.name}>
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="font-medium">{r.name}</span>
            <span className="flex items-center gap-2">
              {r.due && <Chip tone="amber">{v.due}</Chip>}
              <span className="text-xs font-semibold" style={{ color: r.tone === "lime" ? LIME : r.tone === "amber" ? AMBER : "rgb(var(--accent))" }}>{r.left === 0 ? v.paid : fmt(v.missing, { amount: usd(r.left) })}</span>
            </span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-line/50">
            <div className="h-full rounded-full" style={{ width: `${Math.max(r.pct, r.pct === 0 ? 0 : 4)}%`, background: "linear-gradient(90deg, rgb(var(--accent)), rgb(var(--accent-2)))", animation: "grow-x 0.9s var(--ease) both", transformOrigin: "left" }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function VLimpieza({ v }: { v: ReturnType<typeof useV> }) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-line bg-surface/70 p-4">
        <p className="text-xs text-muted">Casa del Lago</p>
        <p className="mt-1 flex items-center gap-2 text-sm font-semibold"><Icon name="logout" className="h-4 w-4 text-accent" />{v.checkout}</p>
      </div>
      <div className="flex justify-center text-muted" aria-hidden><Icon name="chevron" className="h-5 w-5" /></div>
      <div className="rounded-xl border p-4" style={{ borderColor: "rgb(var(--accent-2) / 0.55)", background: "rgb(var(--accent-2) / 0.08)", animation: "fade-up 0.7s var(--ease) 0.2s both" }}>
        <p className="flex items-center gap-2 text-sm font-semibold"><span className="flex h-5 w-5 items-center justify-center rounded-full tick"><Icon name="check" className="h-3 w-3" /></span>{v.cleaning}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Chip tone="blue">{v.assigned}</Chip>
          <Chip>{v.link}</Chip>
        </div>
      </div>
    </div>
  );
}

function VCalendario({ v }: { v: ReturnType<typeof useV> }) {
  const bars = [
    { row: 0, start: 0, len: 4, label: "Familia Rossi", c: "linear-gradient(90deg, rgb(var(--accent)), rgb(var(--accent-2)))" },
    { row: 1, start: 1, len: 3, label: "Carlos M.", c: "rgb(var(--accent) / 0.85)" },
    { row: 2, start: 2, len: 4, label: "Ana y Leo", c: "linear-gradient(90deg, rgb(var(--accent)), rgb(var(--accent-2)))" },
  ];
  return (
    <div>
      <div className="space-y-2">
        {bars.map((b) => (
          <div key={b.row} className="grid h-10 grid-cols-7 gap-1">
            {Array.from({ length: 7 }, (_, i) => <span key={i} aria-hidden className="rounded-md bg-line/30" style={{ gridRow: 1, gridColumn: i + 1 }} />)}
            <span className="relative z-10 truncate rounded-lg px-2 text-xs font-semibold leading-10 text-white [text-shadow:0_1px_4px_rgb(0_0_0/0.6)]" style={{ gridRow: 1, gridColumn: `${b.start + 1} / span ${b.len}`, background: b.c, animation: "grow-x 0.8s var(--ease) both", transformOrigin: "left" }}>{b.label}</span>
          </div>
        ))}
      </div>
      <p className="mt-4 flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium" style={{ borderColor: `${AMBER}88`, background: `${AMBER}14`, color: "#ffe2a3" }}>
        <span className="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-[#2a1a00]" style={{ background: AMBER }}>!</span>
        {v.refused}
      </p>
    </div>
  );
}

/** A little square pattern that looks like a QR code. Decorative: it does not encode anything. */
function FakeQr() {
  const cells = Array.from({ length: 49 }, (_, i) => ((i * 7 + (i % 5) * 3 + (i % 3)) % 5) < 2);
  return (
    <svg aria-hidden viewBox="0 0 7 7" className="h-20 w-20 rounded-md bg-white p-1.5">
      {cells.map((on, i) => (on ? <rect key={i} x={i % 7} y={Math.floor(i / 7)} width="1" height="1" fill="#0b1220" /> : null))}
    </svg>
  );
}

function VHuesped({ v }: { v: ReturnType<typeof useV> }) {
  return (
    <div className="mx-auto w-52 rounded-[28px] border-2 border-line bg-bg p-3 shadow-[0_30px_70px_-25px_rgb(var(--accent)/0.6)]">
      <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-line" aria-hidden />
      <p className="text-center font-display text-sm">Casa del Lago</p>
      <p className="text-center text-[10px] uppercase tracking-wider text-muted">{v.guide}</p>
      <ul className="mt-3 space-y-2 text-xs">
        <li className="flex items-center justify-between rounded-lg bg-surface/80 px-3 py-2"><span className="text-muted">{v.wifi}</span><span className="font-semibold tracking-widest">••••••••</span></li>
        <li className="rounded-lg bg-surface/80 px-3 py-2 font-semibold">{v.checkin}</li>
      </ul>
      <div className="mt-3 flex flex-col items-center gap-1.5">
        <FakeQr />
        <p className="text-[10px] text-muted">{v.scan}</p>
      </div>
    </div>
  );
}

function VNumeros({ v }: { v: ReturnType<typeof useV> }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">{v.result}</p>
      <p className="font-display text-gradient mt-1 text-5xl font-extrabold leading-none">US$ 1.390</p>
      <div className="mt-5 rounded-xl border border-line bg-surface/60 p-3">
        <p className="text-[11px] text-muted">{v.trend}</p>
        <Sparkline values={[...DEMO_TREND]} className="mt-2 h-20 w-full" />
      </div>
      <div className="mt-4 flex items-end gap-1.5" role="img" aria-label={v.occupancy}>
        {[67, 100, 67, 67, 100, 67, 67, 33, 67, 33].map((h, i) => (
          <span key={i} className="flex-1 rounded-sm" style={{ height: `${h * 0.5}px`, background: "linear-gradient(to top, rgb(var(--accent)), rgb(var(--accent-2)))", animation: `fade-up 0.6s var(--ease) ${i * 40}ms both` }} />
        ))}
      </div>
      <p className="mt-1.5 text-[11px] text-muted">{v.occupancy}</p>
    </div>
  );
}

function useV() {
  return useMessages().m.complete.pains.v;
}

/** "Which of these costs you the most?" Five pains, each with how the system solves it and a small picture. Sample data, said so. */
export function PainTabs() {
  const { m } = useMessages();
  const p = m.complete.pains;
  const v = p.v;
  const [i, setI] = useState(0);
  const it = p.items[i] ?? p.items[0]!;
  const visuals = [<VCobros key="a" v={v} />, <VLimpieza key="b" v={v} />, <VCalendario key="c" v={v} />, <VHuesped key="d" v={v} />, <VNumeros key="e" v={v} />];

  return (
    <div className="mt-10">
      <div role="tablist" aria-label={p.title} className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 lg:justify-center">
        {p.items.map((x, k) => {
          const on = k === i;
          return (
            <button
              key={x.tab}
              role="tab"
              id={`pain-tab-${k}`}
              aria-selected={on}
              aria-controls="pain-panel"
              type="button"
              onClick={() => setI(k)}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition ${on ? "border-[rgb(var(--accent-2)/0.7)] bg-[rgb(var(--accent-2)/0.12)] text-fg shadow-[0_0_24px_-6px_rgb(var(--accent-2)/0.6)]" : "border-line bg-surface/60 text-muted hover:border-accent hover:text-fg"}`}
            >
              <Icon name={ICONS[k] ?? "check"} className="h-4 w-4" />
              {x.tab}
            </button>
          );
        })}
      </div>

      <div key={i} id="pain-panel" role="tabpanel" aria-labelledby={`pain-tab-${i}`} className="mt-6 grid items-center gap-8 lg:grid-cols-2 lg:gap-14" style={{ animation: "fade-up 0.5s var(--ease) both" }}>
        <div>
          <h3 className="font-display text-2xl leading-snug md:text-3xl">{it.title}</h3>
          <p className="mt-4 text-base leading-relaxed text-muted md:text-lg">{it.body}</p>
          <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--accent-2))]">{p.solves}</p>
          <ul className="mt-3 space-y-3">
            {it.bullets.map((b) => (
              <li key={b} className="flex items-start gap-3 text-[15px]">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full tick"><Icon name="check" className="h-3 w-3" /></span>
                {b}
              </li>
            ))}
          </ul>
        </div>
        <figure className="relative min-w-0">
          <div aria-hidden className="absolute -inset-3 rounded-[36px] bg-accent/10 blur-2xl" />
          <div className="fx-card fx-hero relative rounded-3xl p-5 sm:p-6">{visuals[i]}</div>
          <figcaption className="mt-3 text-center text-xs text-muted">{p.sample}</figcaption>
        </figure>
      </div>
    </div>
  );
}
