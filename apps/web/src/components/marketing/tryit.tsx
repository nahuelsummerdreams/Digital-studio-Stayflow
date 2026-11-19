"use client";

import { useEffect, useMemo, useState } from "react";
import { AMENITIES, AUDIENCES, LODGING_TYPES, PILLARS, defaultProfile, generatePlan, type AmenityKey, type AudienceKey, type LodgingProfile } from "@stayflow/module-marketing";
import { Icon } from "@stayflow/ui";
import { btnPrimary } from "../styles";
import { COPY } from "./copy";

const c = COPY.demo;
/** The few options the preview offers; the full app has all of them. */
const TYPES = LODGING_TYPES.filter((t) => ["cabana", "departamento", "casa"].includes(t.key));
const HAVES = AMENITIES.filter((a) => ["pileta", "jacuzzi", "vista", "parrilla", "chimenea", "mascotas"].includes(a.key));
const NEEDS_OWNER = new Set(["trend", "real-review", "open-dates", "gift"]);
const WHO = AUDIENCES.filter((a) => ["pareja", "familia", "amigos"].includes(a.key));

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${on ? "border-accent bg-accent/15 text-fg" : "border-line text-muted hover:border-accent/50 hover:text-fg"}`}>
      {children}
    </button>
  );
}

const shortDate = (iso: string) => {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
};

/**
 * A live preview that uses the real generator: the visitor changes the details and sees the first three days of their plan.
 * Everything else (the other days, TikTok and Facebook texts, the three ads) stays behind the purchase.
 */
export function TryIt() {
  // The start date is "today": read it after mount so the server and the browser print the same thing.
  const [today, setToday] = useState<string | null>(null);
  const [p, setP] = useState<LodgingProfile>(() => ({ ...defaultProfile(), name: "Cabaña Los Álamos", city: "Bariloche", capacity: 4, amenities: ["vista", "chimenea"], audiences: ["pareja"], highlight: "una cabaña de madera frente al lago", platforms: ["instagram"], postsPerWeek: 4 }));
  useEffect(() => {
    const d = new Date();
    setToday(new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString().slice(0, 10));
  }, []);

  const plan = useMemo(() => (today && p.name.trim() && p.city.trim() ? generatePlan({ ...p, startDate: today }) : null), [p, today]);
  const set = (patch: Partial<LodgingProfile>) => setP((x) => ({ ...x, ...patch }));
  const toggle = <T,>(list: T[], v: T): T[] => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  // The preview shows ideas that read well on their own: the ones that ask the owner to paste a real review, dates or a trend are left for the full plan.
  const shown = plan?.items.filter((i) => !NEEDS_OWNER.has(i.ideaId)).slice(0, 3) ?? [];
  const more = plan ? Math.max(0, plan.items.length - shown.length) : 0;
  const input = "mt-1 w-full rounded-xl border border-line bg-bg/70 px-3 py-2.5 text-sm text-fg outline-none transition placeholder:text-muted/60 focus:border-accent";

  return (
    <div className="mt-10 grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <form className="fx-card space-y-4 rounded-3xl p-6 lg:self-start" onSubmit={(e) => e.preventDefault()} aria-label="Datos de tu alojamiento">
        <label className="block text-xs font-medium text-muted">
          {c.name}
          <input className={input} value={p.name} maxLength={50} onChange={(e) => set({ name: e.target.value })} />
        </label>
        <label className="block text-xs font-medium text-muted">
          {c.city}
          <input className={input} value={p.city} maxLength={50} onChange={(e) => set({ city: e.target.value })} />
        </label>
        <fieldset>
          <legend className="text-xs font-medium text-muted">{c.type}</legend>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {TYPES.map((t) => (
              <Chip key={t.key} on={p.type === t.key} onClick={() => set({ type: t.key })}>
                {t.label}
              </Chip>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-xs font-medium text-muted">{c.has}</legend>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {HAVES.map((a) => (
              <Chip key={a.key} on={p.amenities.includes(a.key)} onClick={() => set({ amenities: toggle<AmenityKey>(p.amenities, a.key) })}>
                {a.label}
              </Chip>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-xs font-medium text-muted">{c.forWho}</legend>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {WHO.map((a) => (
              <Chip key={a.key} on={p.audiences.includes(a.key)} onClick={() => set({ audiences: toggle<AudienceKey>(p.audiences, a.key) })}>
                {a.label}
              </Chip>
            ))}
          </div>
        </fieldset>
      </form>

      <div className="min-w-0 space-y-3" aria-live="polite">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">{c.preview}</p>
        {!plan && <p className="fx-card rounded-3xl p-6 text-sm text-muted">{c.loading}</p>}
        {shown.map((it) => (
          <article key={it.date} className="fx-card rounded-2xl p-5">
            <header className="flex items-start gap-3">
              <span className="flex w-14 shrink-0 flex-col items-center rounded-xl bg-accent/10 py-1.5 text-accent">
                <span className="text-[10px] uppercase tracking-wide">{it.weekday.slice(0, 3)}</span>
                <span className="font-display text-base leading-none">{shortDate(it.date)}</span>
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold">{it.title}</h3>
                <p className="mt-0.5 text-[11px] text-muted">{PILLARS.find((x) => x.key === it.pillar)?.label}</p>
              </div>
            </header>
            <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-muted">{c.gancho}</p>
            <p className="mt-1 text-sm">{it.hook}</p>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-muted">{c.how}</p>
            <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-sm text-muted">
              {it.steps.slice(0, 3).map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
            {it.posts.instagram && (
              <div className="mt-3 rounded-xl border border-line bg-bg/40 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{c.text}</p>
                <p className="mt-1 whitespace-pre-line text-sm">{it.posts.instagram.caption}</p>
                <p className="mt-2 break-words text-xs text-accent">{it.posts.instagram.hashtags.slice(0, 6).join(" ")}</p>
              </div>
            )}
          </article>
        ))}
        {plan && (
          <div className="rounded-2xl border border-dashed border-line p-5 text-center">
            <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-accent">
              <Icon name="lock" className="h-4 w-4" />
            </span>
            <p className="mt-3 text-sm text-fg/85">{c.locked.replace("{n}", String(more))}</p>
            <a href="#precio" className={`${btnPrimary} mt-4`}>
              {c.lockedCta}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
