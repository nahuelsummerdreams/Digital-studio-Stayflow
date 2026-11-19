"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Icon, Pill, PRODUCT_BRAND, STUDIO_BRAND, activeTabClass, buttonClass, cardClass, ghostButtonClass, idleTabClass, inputClass, labelClass, type Tone } from "@stayflow/ui";
import {
  AMENITIES,
  AUDIENCES,
  LODGING_TYPES,
  PILLARS,
  PLATFORMS,
  POSTS_PER_WEEK,
  TONES,
  defaultProfile,
  generatePlan,
  planToCsv,
  planToText,
  postToText,
  profileIssues,
  type AmenityKey,
  type AudienceKey,
  type LodgingProfile,
  type Pillar,
  type Plan,
  type PlanItem,
  type Platform,
} from "@stayflow/module-marketing";

const STORAGE_KEY = "stayflow-marketing-profile-v1";
const PILLAR_TONE: Record<Pillar, Tone> = { show: "accent", experience: "success", behind: "muted", trust: "success", offer: "warning", fun: "accent" };
const PLATFORM_LABEL = Object.fromEntries(PLATFORMS.map((p) => [p.key, p.label])) as Record<Platform, string>;

function load(): LodgingProfile {
  const fresh = defaultProfile();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fresh;
    const saved = JSON.parse(raw) as Partial<LodgingProfile>;
    return { ...fresh, ...saved, startDate: fresh.startDate };
  } catch {
    return fresh;
  }
}

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

function download(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function shortDate(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

// ---------------------------------------------------------------------------------------------------- small pieces

function CopyButton({ text, label = "Copiar" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={ghostButtonClass + " gap-1.5 !px-2.5 !py-1.5 text-xs"}
      onClick={async () => {
        if (await copy(text)) {
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        }
      }}
    >
      <Icon name={done ? "check" : "copy"} className="h-3.5 w-3.5" />
      {done ? "Copiado" : label}
    </button>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${on ? "border-accent bg-accent/15 text-fg" : "border-line text-muted hover:border-accent/50 hover:text-fg"}`}
    >
      {children}
    </button>
  );
}

function Segmented<T extends string | number>({ value, options, onChange, label }: { value: T; options: { key: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="mt-1 flex flex-wrap gap-1 rounded-xl border border-line bg-bg/60 p-1">
      {options.map((o) => (
        <button key={String(o.key)} type="button" aria-pressed={o.key === value} onClick={() => onChange(o.key)} className={`flex-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${o.key === value ? activeTabClass : idleTabClass}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

// ---------------------------------------------------------------------------------------------------- form

function Form({ p, set }: { p: LodgingProfile; set: (patch: Partial<LodgingProfile>) => void }) {
  return (
    <form className={`${cardClass} space-y-5`} onSubmit={(e) => e.preventDefault()} aria-label="Datos del alojamiento">
      <div>
        <h2 className="font-display text-xl">Tu alojamiento</h2>
        <p className="mt-1 text-xs text-muted">Cuéntanos cómo es. Con esto armamos el plan; no hace falta que sea perfecto.</p>
      </div>

      <label className="block">
        <span className={labelClass}>Nombre</span>
        <input className={inputClass} value={p.name} onChange={(e) => set({ name: e.target.value })} placeholder="Ej.: Cabaña Los Álamos" maxLength={60} />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className={labelClass}>Tipo</span>
          <select className={inputClass} value={p.type} onChange={(e) => set({ type: e.target.value as LodgingProfile["type"] })}>
            {LODGING_TYPES.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={labelClass}>Personas (máx.)</span>
          <input className={inputClass} type="number" min={1} max={30} value={p.capacity} onChange={(e) => set({ capacity: Math.max(1, Math.min(30, Number(e.target.value) || 1)) })} />
        </label>
      </div>

      <label className="block">
        <span className={labelClass}>Ciudad o zona</span>
        <input className={inputClass} value={p.city} onChange={(e) => set({ city: e.target.value })} placeholder="Ej.: Villa La Angostura" maxLength={60} />
      </label>

      <label className="block">
        <span className={labelClass}>¿Qué lo hace especial? (con tus palabras)</span>
        <textarea className={inputClass + " min-h-[72px] resize-y"} value={p.highlight} onChange={(e) => set({ highlight: e.target.value })} placeholder="Ej.: una cabaña de madera frente al lago, con desayuno incluido" maxLength={160} />
      </label>

      <fieldset>
        <legend className={labelClass}>Lo que tiene</legend>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {AMENITIES.map((a) => (
            <Chip key={a.key} on={p.amenities.includes(a.key)} onClick={() => set({ amenities: toggle<AmenityKey>(p.amenities, a.key) })}>
              {a.label}
            </Chip>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className={labelClass}>¿Para quién es? (el primero manda)</legend>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {AUDIENCES.map((a) => (
            <Chip key={a.key} on={p.audiences.includes(a.key)} onClick={() => set({ audiences: toggle<AudienceKey>(p.audiences, a.key) })}>
              {a.label}
            </Chip>
          ))}
        </div>
      </fieldset>

      <div>
        <span className={labelClass}>Tono</span>
        <Segmented value={p.tone} label="Tono" options={TONES.map((t) => ({ key: t.key, label: t.label }))} onChange={(tone) => set({ tone })} />
        <p className="mt-1 text-[11px] text-muted">{TONES.find((t) => t.key === p.tone)?.hint}</p>
      </div>

      <fieldset>
        <legend className={labelClass}>Dónde publicas</legend>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {PLATFORMS.map((pl) => (
            <Chip key={pl.key} on={p.platforms.includes(pl.key)} onClick={() => set({ platforms: toggle<Platform>(p.platforms, pl.key) })}>
              {pl.label}
            </Chip>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className={labelClass}>Publicaciones por semana</span>
          <Segmented value={p.postsPerWeek} label="Publicaciones por semana" options={POSTS_PER_WEEK.map((n) => ({ key: n, label: String(n) }))} onChange={(postsPerWeek) => set({ postsPerWeek })} />
        </div>
        <label className="block">
          <span className={labelClass}>Empieza el</span>
          <input className={inputClass} type="date" value={p.startDate} onChange={(e) => set({ startDate: e.target.value })} />
        </label>
      </div>

      <label className="block">
        <span className={labelClass}>¿Cómo te reservan?</span>
        <input className={inputClass} value={p.cta} onChange={(e) => set({ cta: e.target.value })} placeholder="Ej.: Reserva por WhatsApp al +54…" maxLength={120} />
        <span className="mt-1 block text-[11px] text-muted">Se agrega al final de los textos.</span>
      </label>
    </form>
  );
}

// ---------------------------------------------------------------------------------------------------- results

function Day({ item, platforms, open, onToggle }: { item: PlanItem; platforms: Platform[]; open: boolean; onToggle: () => void }) {
  const pillar = PILLARS.find((x) => x.key === item.pillar);
  return (
    <li className="fx-card rounded-2xl">
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-center gap-3 px-4 py-3 text-left">
        <span className="flex w-14 shrink-0 flex-col items-center rounded-xl bg-accent/10 py-1.5 text-accent">
          <span className="text-[10px] uppercase tracking-wide">{item.weekday.slice(0, 3)}</span>
          <span className="font-display text-base leading-none">{shortDate(item.date)}</span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{item.title}</span>
          <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
            <Pill tone={PILLAR_TONE[item.pillar]}>{pillar?.label}</Pill>
            {platforms.map((pl) => (
              <span key={pl} className="text-[11px] text-muted">
                {PLATFORM_LABEL[pl]}
              </span>
            ))}
          </span>
        </span>
        <Icon name="chevron" className={`h-4 w-4 shrink-0 text-muted transition ${open ? "" : "-rotate-90"}`} />
      </button>

      {/* Closed days stay in the page so the PDF prints the whole plan. */}
      {(
        <div className={`space-y-4 border-t border-line px-4 pb-4 pt-3 text-sm ${open ? "" : "hidden print:block"}`}>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Gancho (primeros segundos)</p>
            <p className="mt-1">{item.hook}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Cómo grabarlo</p>
            <ol className="mt-1 list-decimal space-y-1 pl-5 text-muted">
              {item.steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          </div>
          <p className="text-xs text-muted">
            Texto en pantalla: <span className="text-fg">{item.onScreenText}</span>
          </p>
          <div className="space-y-3">
            {platforms.map((pl) => {
              const post = item.posts[pl];
              if (!post) return null;
              return (
                <div key={pl} className="rounded-xl border border-line bg-bg/40 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{PLATFORM_LABEL[pl]}</p>
                      <p className="text-[11px] text-muted">{post.format}</p>
                    </div>
                    <CopyButton text={postToText(item, pl)} label="Copiar texto" />
                  </div>
                  <p className="mt-2 whitespace-pre-line">{post.caption}</p>
                  <p className="mt-2 break-words text-xs text-accent">{post.hashtags.join(" ")}</p>
                  <p className="mt-2 text-[11px] text-muted">Consejo: {post.tip}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </li>
  );
}

function Calendar({ plan, platforms }: { plan: Plan; platforms: Platform[] }) {
  const [openId, setOpenId] = useState<string | null>(plan.items[0] ? plan.items[0].date : null);
  const weeks = useMemo(() => {
    const out: PlanItem[][] = [];
    for (const it of plan.items) {
      const w = Math.floor((it.day - 1) / 7);
      (out[w] ??= []).push(it);
    }
    return out.filter(Boolean);
  }, [plan]);

  return (
    <div className="space-y-6">
      {weeks.map((items, i) => (
        <section key={i} aria-label={`Semana ${i + 1}`}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Semana {i + 1}</h3>
          <ul className="space-y-2">
            {items.map((it) => (
              <Day key={it.date} item={it} platforms={platforms} open={openId === it.date} onToggle={() => setOpenId(openId === it.date ? null : it.date)} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function Ads({ plan }: { plan: Plan }) {
  return (
    <div className="space-y-4">
      <p className="rounded-xl border border-line bg-bg/40 p-3 text-xs text-muted">
        Son estructuras para armar tus anuncios en el administrador de anuncios de Meta (Instagram y Facebook) o en TikTok Ads. Los montos y públicos son un punto de partida: ajústalos con tus propios resultados. Nadie puede asegurarte cuántas reservas traerán.
      </p>
      {plan.ads.map((ad, i) => (
        <article key={ad.id} className={cardClass + " space-y-3 text-sm"}>
          <header className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Anuncio {i + 1}</p>
              <h3 className="font-display text-lg">{ad.name}</h3>
              <p className="text-xs text-muted">{ad.goal}</p>
            </div>
            <Pill tone="accent">{ad.objective}</Pill>
          </header>
          <dl className="space-y-2">
            {[
              ["Público", ad.audience],
              ["Formato", ad.format],
              ["Qué mostrar", ad.creative],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">{k}</dt>
                <dd className="mt-0.5">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="rounded-xl border border-line bg-bg/40 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Texto del anuncio</p>
              <CopyButton text={`${ad.primaryText}\n\nTítulo: ${ad.headline}\nBotón: ${ad.button}`} />
            </div>
            <p className="mt-1.5">{ad.primaryText}</p>
            <p className="mt-2 text-xs text-muted">
              Título: <span className="text-fg">{ad.headline}</span> · Botón: <span className="text-fg">{ad.button}</span>
            </p>
          </div>
          <p className="text-xs text-muted">{ad.note}</p>
        </article>
      ))}
    </div>
  );
}

function Checklist({ plan }: { plan: Plan }) {
  return (
    <ul className={cardClass + " space-y-3 text-sm"}>
      {plan.checklist.map((c, i) => (
        <li key={i} className="flex gap-3">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
            <Icon name="check" className="h-3 w-3" />
          </span>
          {c}
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------------------------------- page

type Tab = "calendar" | "ads" | "checklist";

export function Studio({ onSignOut }: { onSignOut?: () => void }) {
  const [profile, setProfile] = useState<LodgingProfile>(() => defaultProfile());
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>("calendar");
  const resultsRef = useRef<HTMLDivElement>(null);

  // Read the saved answers after mount, so the server and first client render match.
  useEffect(() => {
    setProfile(load());
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {
      /* The plan still works without saving. */
    }
  }, [profile, ready]);

  const set = (patch: Partial<LodgingProfile>) => setProfile((p) => ({ ...p, ...patch, variant: patch.variant ?? p.variant }));
  const issues = profileIssues(profile);
  const plan = useMemo(() => (issues.length === 0 ? generatePlan(profile) : null), [profile, issues.length]);
  const brand = PRODUCT_BRAND.marketing;

  return (
    <main className="mx-auto max-w-6xl px-4 pb-20 pt-6 sm:px-6">
      <header className="no-print mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-accent">{STUDIO_BRAND.name}</p>
          <h1 className="font-display text-3xl sm:text-4xl">{brand.name}</h1>
          <p className="mt-1 max-w-xl text-sm text-muted">{brand.tagline} Cuéntanos cómo es tu alojamiento y te armamos 30 días de contenido y tres anuncios para empezar.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" className={ghostButtonClass} onClick={() => setProfile(defaultProfile())}>
            Empezar de nuevo
          </button>
          {onSignOut && (
            <button type="button" className={ghostButtonClass} onClick={onSignOut} title="Quita el acceso de este dispositivo">
              Salir
            </button>
          )}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <div className="no-print lg:sticky lg:top-4 lg:self-start">
          <Form p={profile} set={set} />
        </div>

        <div ref={resultsRef} className="min-w-0">
          {!plan ? (
            <div className={cardClass + " text-center"}>
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <Icon name="sparkles" className="h-6 w-6" />
              </span>
              <h2 className="font-display mt-4 text-xl">Aquí aparecerá tu plan</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted">Escribe el nombre y la ciudad de tu alojamiento, y elige dónde publicas. El plan se arma solo.</p>
              <ul className="mx-auto mt-5 max-w-xs space-y-2 text-left text-sm text-muted">
                <li>· Qué publicar cada día, con el gancho y cómo grabarlo</li>
                <li>· Textos y hashtags para cada red</li>
                <li>· Tres anuncios listos para armar</li>
              </ul>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="no-print flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Pill tone="success">{plan.items.length} publicaciones</Pill>
                  <Pill tone="muted">30 días</Pill>
                  {profile.platforms.map((pl) => (
                    <Pill key={pl} tone="muted">
                      {PLATFORM_LABEL[pl]}
                    </Pill>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={ghostButtonClass + " gap-1.5"} onClick={() => setProfile((p) => ({ ...p, variant: p.variant + 1 }))}>
                    <Icon name="refresh" className="h-4 w-4" />
                    Otra versión
                  </button>
                  <CopyButton text={planToText(plan, profile)} label="Copiar todo" />
                  <button type="button" className={ghostButtonClass} onClick={() => download(`plan-contenido-${profile.startDate}.csv`, planToCsv(plan, profile), "text/csv;charset=utf-8")}>
                    Descargar Excel
                  </button>
                  <button type="button" className={buttonClass} onClick={() => window.print()}>
                    Guardar PDF
                  </button>
                </div>
              </div>

              <div role="tablist" aria-label="Secciones del plan" className="no-print inline-flex gap-1 rounded-xl border border-line bg-bg/60 p-1">
                {(
                  [
                    ["calendar", "Calendario"],
                    ["ads", "Anuncios"],
                    ["checklist", "Antes de publicar"],
                  ] as [Tab, string][]
                ).map(([k, label]) => (
                  <button key={k} role="tab" aria-selected={tab === k} type="button" onClick={() => setTab(k)} className={`rounded-lg px-3.5 py-2 text-sm font-medium transition ${tab === k ? activeTabClass : idleTabClass}`}>
                    {label}
                  </button>
                ))}
              </div>

              {/* On paper (PDF) everything is printed, whichever tab is open. */}
              <div className="print-area space-y-8">
                <section className={tab === "calendar" ? "" : "hidden print:block"}>
                  <Calendar plan={plan} platforms={profile.platforms} />
                </section>
                <section className={tab === "ads" ? "" : "hidden print:block"}>
                  <Ads plan={plan} />
                </section>
                <section className={tab === "checklist" ? "" : "hidden print:block"}>
                  <Checklist plan={plan} />
                </section>
              </div>
            </div>
          )}
        </div>
      </div>

      {plan && (
        <button
          type="button"
          onClick={() => resultsRef.current?.scrollIntoView({ block: "start" })}
          className={buttonClass + " no-print fixed bottom-4 left-1/2 z-20 -translate-x-1/2 gap-2 shadow-xl lg:hidden"}
        >
          <Icon name="calendar" className="h-4 w-4" />
          Ver mi plan
        </button>
      )}

      <footer className="no-print mt-12 text-center text-xs text-muted">
        Un producto de {STUDIO_BRAND.name}. Los planes son sugerencias: revisa cada texto, usa solo contenido real de tu alojamiento y no prometas lo que no tienes.
      </footer>
    </main>
  );
}
