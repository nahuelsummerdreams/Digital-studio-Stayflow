/** Options the owner picks from. Labels are in Spanish; keys are stable. */

export type Platform = "tiktok" | "instagram" | "facebook";
export const PLATFORMS: { key: Platform; label: string }[] = [
  { key: "tiktok", label: "TikTok" },
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
];

export type LodgingType = "cabana" | "departamento" | "casa" | "loft" | "habitacion" | "glamping";
/** `det` carries gender so generated sentences agree ("la cabaña", "este loft"). */
export const LODGING_TYPES: { key: LodgingType; label: string; bare: string; the: string; this: string; a: string; fem: boolean }[] = [
  { key: "cabana", label: "Cabaña", bare: "cabaña", the: "la cabaña", this: "esta cabaña", a: "una cabaña", fem: true },
  { key: "departamento", label: "Departamento", bare: "departamento", the: "el departamento", this: "este departamento", a: "un departamento", fem: false },
  { key: "casa", label: "Casa", bare: "casa", the: "la casa", this: "esta casa", a: "una casa", fem: true },
  { key: "loft", label: "Loft / Estudio", bare: "loft", the: "el loft", this: "este loft", a: "un loft", fem: false },
  { key: "habitacion", label: "Habitación", bare: "habitación", the: "la habitación", this: "esta habitación", a: "una habitación", fem: true },
  { key: "glamping", label: "Glamping / Domo", bare: "glamping", the: "el glamping", this: "este glamping", a: "un glamping", fem: false },
];

export type AmenityKey =
  | "pileta"
  | "jacuzzi"
  | "parrilla"
  | "vista"
  | "chimenea"
  | "cocina"
  | "wifi"
  | "estacionamiento"
  | "mascotas"
  | "aire"
  | "playa"
  | "centro"
  | "naturaleza"
  | "escritorio"
  | "jardin";

export interface Amenity {
  key: AmenityKey;
  label: string;
  /** Used inside sentences: "la pileta". */
  noun: string;
  /** What to point the camera at. */
  shot: string;
  /** Words that become hashtags. */
  tags: string[];
}

export const AMENITIES: Amenity[] = [
  { key: "pileta", label: "Pileta", noun: "la pileta", shot: "el agua con la luz de la tarde, y alguien entrando despacio", tags: ["pileta", "piscina"] },
  { key: "jacuzzi", label: "Jacuzzi", noun: "el jacuzzi", shot: "el vapor del agua caliente al atardecer", tags: ["jacuzzi", "spa"] },
  { key: "parrilla", label: "Parrilla / quincho", noun: "la parrilla", shot: "las brasas y la mesa puesta para compartir", tags: ["parrilla", "asado"] },
  { key: "vista", label: "Vista especial", noun: "la vista", shot: "un plano abierto de la vista, sin filtros que la cambien", tags: ["vista", "paisaje"] },
  { key: "chimenea", label: "Chimenea / estufa", noun: "la chimenea", shot: "el fuego encendido y una manta al lado", tags: ["chimenea", "acogedor"] },
  { key: "cocina", label: "Cocina equipada", noun: "la cocina", shot: "la cocina lista para usar, con todo a mano", tags: ["cocina", "cocinar"] },
  { key: "wifi", label: "Wifi rápido", noun: "el wifi", shot: "una prueba de velocidad real en pantalla", tags: ["wifi", "internetrapido"] },
  { key: "estacionamiento", label: "Estacionamiento", noun: "el estacionamiento", shot: "el auto estacionado en la entrada", tags: ["estacionamiento"] },
  { key: "mascotas", label: "Acepta mascotas", noun: "que aceptamos mascotas", shot: "una mascota explorando el lugar (con permiso de su dueño)", tags: ["petfriendly", "mascotas"] },
  { key: "aire", label: "Aire acondicionado", noun: "el aire acondicionado", shot: "el ambiente fresco después de un día de calor", tags: ["aireacondicionado"] },
  { key: "playa", label: "Cerca de la playa", noun: "la playa a pasos", shot: "el recorrido real a pie hasta la playa, con reloj en pantalla", tags: ["playa", "mar"] },
  { key: "centro", label: "Cerca del centro", noun: "el centro a pasos", shot: "el recorrido a pie hasta la plaza o la calle principal", tags: ["centro", "caminable"] },
  { key: "naturaleza", label: "Entorno natural", noun: "el entorno natural", shot: "los sonidos y colores de afuera, sin música", tags: ["naturaleza", "desconectar"] },
  { key: "escritorio", label: "Espacio de trabajo", noun: "el espacio de trabajo", shot: "el escritorio armado con laptop, silla cómoda y buena luz", tags: ["trabajoremoto", "nomadadigital"] },
  { key: "jardin", label: "Jardín / terraza", noun: "el jardín", shot: "el espacio exterior con luz natural y un mate o un café", tags: ["jardin", "terraza"] },
];

export type AudienceKey = "pareja" | "familia" | "amigos" | "nomada" | "solo";
export const AUDIENCES: { key: AudienceKey; label: string; plural: string; forAud: string; tags: string[] }[] = [
  { key: "pareja", label: "Parejas", plural: "las parejas", forAud: "para parejas", tags: ["escapadaenpareja", "parejas"] },
  { key: "familia", label: "Familias", plural: "las familias", forAud: "para familias", tags: ["viajarconniños", "familia"] },
  { key: "amigos", label: "Grupos de amigos", plural: "los grupos de amigos", forAud: "para ir con amigos", tags: ["escapadaconamigos", "amigos"] },
  { key: "nomada", label: "Trabajo remoto", plural: "quienes trabajan a distancia", forAud: "para trabajar a distancia", tags: ["nomadadigital", "trabajoremoto"] },
  { key: "solo", label: "Viajeros solos", plural: "quienes viajan solos", forAud: "para viajar solo/a", tags: ["viajarsolo", "soloviajero"] },
];

export type Tone = "warm" | "elegant" | "fun" | "adventure";
export const TONES: { key: Tone; label: string; hint: string }[] = [
  { key: "warm", label: "Cálido y cercano", hint: "Como te hablaría un anfitrión amigo" },
  { key: "elegant", label: "Elegante y sobrio", hint: "Pocas palabras, mucho cuidado" },
  { key: "fun", label: "Divertido", hint: "Humor, tendencias y ritmo" },
  { key: "adventure", label: "Aventurero", hint: "Para destinos de aire libre" },
];

export type Pillar = "show" | "experience" | "behind" | "trust" | "offer" | "fun";
export const PILLARS: { key: Pillar; label: string; purpose: string }[] = [
  { key: "show", label: "Mostrar el lugar", purpose: "Que se imaginen alojándose ahí." },
  { key: "experience", label: "El destino", purpose: "Que el viaje a la zona sea el motivo." },
  { key: "behind", label: "Detrás de escena", purpose: "Cercanía y cuidado visibles." },
  { key: "trust", label: "Confianza", purpose: "Quitar dudas antes de reservar." },
  { key: "offer", label: "Reservar", purpose: "Invitar a elegir fechas, sin presionar." },
  { key: "fun", label: "Entretenimiento", purpose: "Alcance: contenido que se comparte." },
];

export const POSTS_PER_WEEK = [3, 4, 5, 7] as const;
export type PostsPerWeek = (typeof POSTS_PER_WEEK)[number];
