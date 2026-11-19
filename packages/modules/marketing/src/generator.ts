import { AMENITIES, AUDIENCES, LODGING_TYPES, PILLARS, TONES, type Amenity, type AmenityKey, type AudienceKey, type LodgingType, type Pillar, type Platform, type PostsPerWeek, type Tone } from "./catalog";
import { IDEAS, type Built, type Ctx, type Idea, type IdeaFormat } from "./ideas";

export interface LodgingProfile {
  name: string;
  type: LodgingType;
  city: string;
  capacity: number;
  amenities: AmenityKey[];
  audiences: AudienceKey[];
  tone: Tone;
  /** What makes it special, in the owner's words. */
  highlight: string;
  /** How a guest should reach the owner, e.g. "Escríbenos por mensaje directo". */
  cta: string;
  platforms: Platform[];
  postsPerWeek: PostsPerWeek;
  /** First day of the plan, YYYY-MM-DD. */
  startDate: string;
  /** Changes which ideas are picked; "Otra versión" bumps it. */
  variant: number;
}

export interface PlatformPost {
  format: string;
  caption: string;
  hashtags: string[];
  tip: string;
}

export interface PlanItem {
  day: number; // 1..30
  date: string; // YYYY-MM-DD
  weekday: string; // "lunes"
  pillar: Pillar;
  ideaId: string;
  /** True when the idea bank ran out and an earlier idea is reused with a new angle. */
  repeat: boolean;
  title: string;
  hook: string;
  steps: string[];
  onScreenText: string;
  posts: Partial<Record<Platform, PlatformPost>>;
}

export interface AdConcept {
  id: string;
  name: string;
  goal: string;
  objective: string;
  audience: string;
  format: string;
  creative: string;
  primaryText: string;
  headline: string;
  button: string;
  note: string;
}

export interface Plan {
  items: PlanItem[];
  ads: AdConcept[];
  checklist: string[];
  byPillar: Record<Pillar, number>;
}

export const PLAN_DAYS = 30;
const WEEKDAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
/** Weekdays (0 = Sunday) on which to post, by posts per week. */
const POST_DAYS: Record<PostsPerWeek, number[]> = {
  3: [2, 4, 6],
  4: [1, 3, 5, 0],
  5: [1, 2, 4, 5, 0],
  7: [0, 1, 2, 3, 4, 5, 6],
};
/** Order in which content types are served, so the feed always mixes showing, selling and entertaining. */
const PILLAR_CYCLE: Pillar[] = ["show", "experience", "fun", "trust", "show", "behind", "offer", "experience", "fun", "show", "trust", "offer"];

export function defaultProfile(today = new Date()): LodgingProfile {
  const d = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  return {
    name: "",
    type: "cabana",
    city: "",
    capacity: 4,
    amenities: [],
    audiences: ["pareja"],
    tone: "warm",
    highlight: "",
    cta: "Escríbenos por mensaje directo para reservar",
    platforms: ["instagram", "tiktok"],
    postsPerWeek: 4,
    startDate: d.toISOString().slice(0, 10),
    variant: 0,
  };
}

/** What the generator needs at minimum. */
export function profileIssues(p: LodgingProfile): string[] {
  const out: string[] = [];
  if (!p.name.trim()) out.push("name");
  if (!p.city.trim()) out.push("city");
  if (p.platforms.length === 0) out.push("platforms");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.startDate)) out.push("startDate");
  return out;
}

// ---------------------------------------------------------------------------------------------------- helpers

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(list: T[], rand: () => number): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j] as T, a[i] as T];
  }
  return a;
}

/** "Cabaña Los Álamos" → "cabanalosalamos" (hashtags have no spaces, accents or symbols). */
export function toTag(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/ñ/gi, "n")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function parseDay(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1));
}

function isoOf(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function typeOf(t: LodgingType) {
  return LODGING_TYPES.find((x) => x.key === t) ?? (LODGING_TYPES[0] as (typeof LODGING_TYPES)[number]);
}

function contextOf(p: LodgingProfile): Ctx {
  const kind = typeOf(p.type);
  const aud = AUDIENCES.find((a) => a.key === p.audiences[0]);
  return {
    name: p.name.trim() || "nuestro alojamiento",
    the: kind.the,
    thisKind: kind.this,
    aKind: kind.a,
    city: p.city.trim() || "la zona",
    cap: p.capacity <= 1 ? "1 persona" : `hasta ${p.capacity} personas`,
    aud: aud?.forAud ?? "para descansar",
    audPlural: aud?.plural ?? "quienes buscan descansar",
    hl: stripEnd(p.highlight.trim()) || "un lugar para desconectar y disfrutar",
    cta: stripEnd(p.cta.trim()) || "Escríbenos para reservar",
  };
}

function stripEnd(s: string): string {
  return s.replace(/[.\s]+$/g, "");
}

// ---------------------------------------------------------------------------------------------------- hashtags

const TAGS_GENERIC = ["viajes", "escapadas", "turismo", "alojamiento", "vacaciones", "viajar", "descanso"];
const TAGS_BY_TONE: Record<Tone, string[]> = {
  warm: ["hospitalidad", "sentirsecomoencasa"],
  elegant: ["diseno", "boutique"],
  fun: ["planazo", "viajerosfelices"],
  adventure: ["aventura", "aireLibre"],
};

export function hashtagsFor(p: LodgingProfile, platform: Platform, index: number): string[] {
  const city = toTag(p.city);
  const kind = toTag(typeOf(p.type).bare);
  const fixed = [city && `turismo${city}`, city, city && `${kind}${city}`, toTag(p.name)].filter(Boolean) as string[];
  const amenityTags = AMENITIES.filter((a) => p.amenities.includes(a.key)).flatMap((a) => a.tags);
  const audienceTags = AUDIENCES.filter((a) => p.audiences.includes(a.key)).flatMap((a) => a.tags);
  const pool = [...amenityTags, ...audienceTags, ...TAGS_BY_TONE[p.tone], ...TAGS_GENERIC].map(toTag).filter(Boolean);
  const uniquePool = [...new Set(pool)];
  const want = platform === "instagram" ? 10 : platform === "tiktok" ? 5 : 3;
  const head = fixed.slice(0, platform === "facebook" ? 2 : 3);
  // Rotate the rest so the same set is not repeated on every post.
  const rest = uniquePool.length ? uniquePool.map((_, i) => uniquePool[(i + index * 3) % uniquePool.length] as string) : [];
  return [...new Set([...head, ...rest])].slice(0, want).map((t) => `#${t}`);
}

// ---------------------------------------------------------------------------------------------------- captions

const EMOJI: Record<Tone, string> = { warm: "✨ ", elegant: "", fun: "😄 ", adventure: "🌲 " };

function firstSentence(text: string, max: number): string {
  const m = text.match(/^.*?[.!?](\s|$)/);
  const s = (m ? m[0] : text).trim();
  return s.length <= max ? s : s.slice(0, max - 1).trimEnd() + "…";
}

const FORMAT_LABEL: Record<Platform, Record<IdeaFormat, string>> = {
  tiktok: { video: "Video vertical de 15 a 30 segundos", carousel: "Carrusel de fotos (modo foto de TikTok)", photo: "Carrusel de 2 a 3 fotos (modo foto de TikTok)" },
  instagram: { video: "Reel vertical de 15 a 30 segundos", carousel: "Carrusel de 5 a 8 imágenes", photo: "Foto única, y compártela también en historias" },
  facebook: { video: "Reel o video corto", carousel: "Álbum de 4 a 6 fotos", photo: "Foto con texto" },
};

const TIP: Record<Platform, string> = {
  tiktok: "Lo más atractivo debe verse en los primeros 2 segundos. Usa audios de la biblioteca comercial de la plataforma.",
  instagram: "Elige una portada legible y escribe la primera línea pensando en que se corta en el feed.",
  facebook: "Aquí el texto largo funciona mejor y el enlace sí se puede usar. Compártelo en grupos de viajes de tu zona si sus reglas lo permiten.",
};

function postFor(platform: Platform, idea: Idea, built: Built, p: LodgingProfile, ctx: Ctx, index: number): PlatformPost {
  const lead = EMOJI[p.tone];
  const hashtags = hashtagsFor(p, platform, index);
  let caption: string;
  if (platform === "tiktok") caption = `${lead}${firstSentence(built.caption, 140)}`;
  else if (platform === "instagram") caption = `${lead}${built.caption}\n\n${ctx.cta}.`;
  else caption = `${lead}${built.caption}\n\n${ctx.cta}.`;
  return { format: FORMAT_LABEL[platform][idea.format], caption: caption.trim(), hashtags, tip: TIP[platform] };
}

// ---------------------------------------------------------------------------------------------------- plan

function eligible(idea: Idea, p: LodgingProfile): boolean {
  if (idea.needs && !p.amenities.includes(idea.needs)) return false;
  if (idea.audience && !p.audiences.includes(idea.audience)) return false;
  return true;
}

function amenityOf(key?: AmenityKey): Amenity | undefined {
  return key ? AMENITIES.find((a) => a.key === key) : undefined;
}

export function generatePlan(p: LodgingProfile): Plan {
  const rand = rng(hash(`${p.name}|${p.city}|${p.variant}`));
  const ctx = contextOf(p);

  // Per pillar: personalised ideas (they need an amenity or an audience) first, then the general ones; each group shuffled.
  const pools = new Map<Pillar, Idea[]>();
  for (const pillar of PILLARS.map((x) => x.key)) {
    const list = IDEAS.filter((i) => i.pillar === pillar && eligible(i, p));
    const special = shuffled(list.filter((i) => i.needs || i.audience), rand);
    const general = shuffled(list.filter((i) => !i.needs && !i.audience), rand);
    pools.set(pillar, [...special, ...general]);
  }

  const days = POST_DAYS[p.postsPerWeek];
  const start = parseDay(p.startDate);
  const used = new Set<string>();
  const items: PlanItem[] = [];
  let slot = 0;

  for (let day = 1; day <= PLAN_DAYS; day++) {
    const date = new Date(start.getTime() + (day - 1) * 86400000);
    if (!days.includes(date.getUTCDay())) continue;

    // Take the next pillar in the cycle that still has an unused idea; fall back to any unused idea; then reuse.
    let idea: Idea | undefined;
    let repeat = false;
    for (let k = 0; k < PILLAR_CYCLE.length && !idea; k++) {
      const pillar = PILLAR_CYCLE[(slot + k) % PILLAR_CYCLE.length] as Pillar;
      idea = pools.get(pillar)?.find((i) => !used.has(i.id));
    }
    if (!idea) {
      const all = IDEAS.filter((i) => eligible(i, p));
      idea = all.find((i) => !used.has(i.id));
    }
    if (!idea) {
      const all = IDEAS.filter((i) => eligible(i, p));
      idea = all[slot % all.length] as Idea;
      repeat = true;
    }
    used.add(idea.id);

    const built = idea.build({ ...ctx, amenity: amenityOf(idea.needs) });
    const posts: Partial<Record<Platform, PlatformPost>> = {};
    for (const pl of p.platforms) posts[pl] = postFor(pl, idea, built, p, ctx, slot);

    items.push({
      day,
      date: isoOf(date),
      weekday: WEEKDAYS[date.getUTCDay()] as string,
      pillar: idea.pillar,
      ideaId: idea.id,
      repeat,
      title: repeat ? `${built.title} (otra versión)` : built.title,
      hook: built.hook,
      steps: built.steps,
      onScreenText: built.text,
      posts,
    });
    slot++;
  }

  const byPillar = Object.fromEntries(PILLARS.map((x) => [x.key, 0])) as Record<Pillar, number>;
  for (const it of items) byPillar[it.pillar]++;

  return { items, ads: adsFor(p, ctx), checklist: checklistFor(p), byPillar };
}

// ---------------------------------------------------------------------------------------------------- ads

function trim(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 1).trimEnd() + "…";
}

function adsFor(p: LodgingProfile, c: Ctx): AdConcept[] {
  const interests = AUDIENCES.filter((a) => p.audiences.includes(a.key)).map((a) => a.label.toLowerCase());
  const who = interests.length ? interests.join(", ") : "viajeros";
  const bestAmenity = AMENITIES.find((a) => p.amenities.includes(a.key) && !a.noun.startsWith("que "));
  const feature = bestAmenity ? `con ${bestAmenity.noun}` : "para desconectar";
  const budget = "Punto de partida sugerido: 5 a 10 dólares por día durante 7 días, y decide con tus propios números. No es una promesa de resultados.";
  const geo = `Personas de las ciudades desde donde ya te escriben o te han reservado (míralo en tus reservas), más ${c.city} si hay turismo local.`;
  return [
    {
      id: "ad-discovery",
      name: "Que te conozcan",
      goal: "Que más personas vean cómo es el lugar.",
      objective: "Reproducciones de video o alcance",
      audience: `${geo} Intereses: viajes, escapadas, ${who}. Edad: empieza amplia (25 a 55) y ajústala con lo que veas.`,
      format: "Video vertical de 15 a 20 segundos: el recorrido o el plano más atractivo del lugar.",
      creative: "Usa tu mejor video del plan (el recorrido o el de la amenidad principal). Primer plano: lo más lindo. Sin música con derechos.",
      primaryText: `${c.name}: ${c.hl}. ${cap1(c.the)} en ${c.city}, ${c.cap}.`,
      headline: trim(`${c.name} en ${c.city}`, 40),
      button: "Más información",
      note: budget,
    },
    {
      id: "ad-book",
      name: "Que te escriban",
      goal: "Que consulten disponibilidad por mensaje.",
      objective: "Mensajes (WhatsApp o mensaje directo)",
      audience: `${geo} Intereses: ${who}. Excluye a quienes ya te escribieron.`,
      format: "Carrusel de 4 a 6 fotos: portada, ambiente principal, detalle, vista o amenidad, y la última con las fechas.",
      creative: "Foto 1 con una frase clara. Foto final con fechas libres reales y cómo escribirte. Todas las fotos deben ser del alojamiento real.",
      primaryText: `Escapada ${c.aud} en ${c.city}. ${cap1(c.the)} ${feature}, ${c.cap}. ${c.cta}.`,
      headline: trim(`Reserva en ${c.city}`, 40),
      button: "Enviar mensaje",
      note: "Responde cada mensaje en menos de una hora: los anuncios de mensajes dependen de eso.",
    },
    {
      id: "ad-retarget",
      name: "Recordar a quien ya te vio",
      goal: "Volver a mostrarle el lugar a quien ya miró tu video o tu perfil.",
      objective: "Mensajes",
      audience: "Personas que vieron al menos la mitad de tus videos o visitaron tu perfil en los últimos 30 días (necesitas una audiencia mínima; si todavía no la tienes, deja este anuncio para más adelante).",
      format: "Foto única o video corto con una reseña real (con permiso) y las fechas libres.",
      creative: "Una reseña real recortada sobre una foto del lugar, y una línea con las fechas disponibles. No inventes reseñas.",
      primaryText: `¿Todavía lo estás pensando? ${c.name} tiene fechas libres. ${c.cta}.`,
      headline: trim("Fechas disponibles", 40),
      button: "Enviar mensaje",
      note: "Hazlo solo cuando el anuncio de «Que te escriban» ya haya generado visitas.",
    },
  ];
}

function cap1(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function checklistFor(p: LodgingProfile): string[] {
  const list = [
    "Usa solo fotos y videos propios del alojamiento real. Nada de imágenes de internet.",
    "Las reseñas que muestres deben ser reales y con permiso de quien las escribió. Si no tienes, salta esas ideas.",
    "No prometas lo que no está: confirma horarios, servicios y fechas antes de publicar.",
    "Responde los mensajes el mismo día; una consulta sin respuesta es una reserva perdida.",
    "Pon en tu perfil cómo reservar (enlace o mensaje) y la ubicación de la zona.",
    "Revisa cada semana qué publicación tuvo más guardados y mensajes, y repite ese estilo.",
    "No compres seguidores ni «paquetes de visitas»: no traen reservas.",
  ];
  if (p.platforms.includes("tiktok")) list.push("En TikTok usa audios de la biblioteca comercial para evitar problemas de derechos de autor.");
  if (p.amenities.includes("mascotas")) list.push("Si muestras mascotas, que sea con permiso de sus dueños.");
  return list;
}

// ---------------------------------------------------------------------------------------------------- export

export function postToText(item: PlanItem, platform: Platform): string {
  const post = item.posts[platform];
  if (!post) return "";
  return `${post.caption}\n\n${post.hashtags.join(" ")}`;
}

export function planToText(plan: Plan, p: LodgingProfile): string {
  const tone = TONES.find((t) => t.key === p.tone)?.label ?? "";
  const lines: string[] = [`PLAN DE CONTENIDO · ${p.name.trim()} (${p.city.trim()})`, `Tono: ${tone} · ${plan.items.length} publicaciones en ${PLAN_DAYS} días`, ""];
  for (const it of plan.items) {
    lines.push(`DÍA ${it.day} · ${it.weekday} ${it.date} · ${PILLARS.find((x) => x.key === it.pillar)?.label ?? ""}`);
    lines.push(`Idea: ${it.title}`);
    lines.push(`Gancho (primeros segundos): ${it.hook}`);
    lines.push(`Texto en pantalla: ${it.onScreenText}`);
    lines.push("Cómo grabarlo:");
    it.steps.forEach((s, i) => lines.push(`  ${i + 1}. ${s}`));
    for (const pl of p.platforms) {
      const post = it.posts[pl];
      if (!post) continue;
      lines.push(`[${pl.toUpperCase()}] ${post.format}`);
      lines.push(post.caption);
      lines.push(post.hashtags.join(" "));
    }
    lines.push("");
  }
  lines.push("ANUNCIOS", "");
  for (const ad of plan.ads) {
    lines.push(`${ad.name} · objetivo: ${ad.objective}`, `Público: ${ad.audience}`, `Formato: ${ad.format}`, `Texto principal: ${ad.primaryText}`, `Título: ${ad.headline}`, `Botón: ${ad.button}`, `Nota: ${ad.note}`, "");
  }
  lines.push("ANTES DE PUBLICAR", ...plan.checklist.map((c) => `- ${c}`));
  return lines.join("\n");
}

function csvCell(s: string): string {
  return `"${s.replace(/"/g, '""').replace(/\r?\n/g, " / ")}"`;
}

export function planToCsv(plan: Plan, p: LodgingProfile): string {
  const rows = [["fecha", "dia", "tipo", "idea", "plataforma", "formato", "texto", "hashtags"].map(csvCell).join(",")];
  for (const it of plan.items) {
    for (const pl of p.platforms) {
      const post = it.posts[pl];
      if (!post) continue;
      rows.push([it.date, it.weekday, PILLARS.find((x) => x.key === it.pillar)?.label ?? "", it.title, pl, post.format, post.caption, post.hashtags.join(" ")].map(csvCell).join(","));
    }
  }
  // A BOM makes Excel read the accents correctly.
  return "﻿" + rows.join("\r\n");
}
