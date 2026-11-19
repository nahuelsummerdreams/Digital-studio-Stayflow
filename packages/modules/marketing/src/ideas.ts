import type { Amenity, AmenityKey, AudienceKey, Pillar } from "./catalog";

/** What an idea template can use to write itself. Everything comes from the owner's own answers. */
export interface Ctx {
  name: string;
  the: string; // "la cabaña"
  thisKind: string; // "esta cabaña"
  aKind: string; // "una cabaña"
  city: string;
  cap: string; // "hasta 4 personas"
  aud: string; // "para parejas"
  audPlural: string; // "las parejas"
  hl: string; // what makes it special, in the owner's words
  cta: string;
  /** The amenity this idea is about (only set for ideas that need one). */
  amenity?: Amenity;
}

export interface Built {
  title: string;
  hook: string;
  steps: string[];
  text: string; // text shown on screen
  caption: string;
}

export type IdeaFormat = "video" | "carousel" | "photo";

export interface Idea {
  id: string;
  pillar: Pillar;
  format: IdeaFormat;
  needs?: AmenityKey;
  audience?: AudienceKey;
  build: (c: Ctx) => Built;
}

const up = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const am = (c: Ctx) => c.amenity ?? { noun: "el lugar", shot: "el detalle que más te gusta", label: "", key: "vista" as AmenityKey, tags: [] };

export const IDEAS: Idea[] = [
  // ---------------------------------------------------------------- MOSTRAR EL LUGAR
  {
    id: "tour-30",
    pillar: "show",
    format: "video",
    build: (c) => ({
      title: `Recorrido de 30 segundos por ${c.the}`,
      hook: `Te muestro ${c.thisKind} en 30 segundos.`,
      steps: ["Entrada: abre la puerta en cámara.", "Zona principal: un paneo lento, sin cortes bruscos.", "Cocina o rincón de comer.", "Dormitorio con la cama hecha.", `Tu rincón favorito de ${c.name}.`, `Cierre: ${c.city} en una palabra y el llamado a reservar.`],
      text: `${c.name} · ${c.cap}`,
      caption: `Así es ${c.name}: ${c.hl}. Capacidad ${c.cap}.`,
    }),
  },
  {
    id: "best-corner",
    pillar: "show",
    format: "photo",
    build: (c) => ({
      title: "El rincón favorito de los huéspedes",
      hook: "Si tuviera que elegir un lugar, sería este.",
      steps: ["Foto con luz natural, sin flash.", "Que se vea algo humano: una taza, un libro, una manta.", "Una sola idea por foto."],
      text: "Aquí te vas a querer quedar",
      caption: `Cada persona que llega a ${c.name} termina eligiendo el mismo lugar. ¿Cuál sería el tuyo?`,
    }),
  },
  {
    id: "arrival-pov",
    pillar: "show",
    format: "video",
    build: (c) => ({
      title: "Lo primero que ves al llegar",
      hook: "Esto es lo primero que vas a ver al llegar.",
      steps: ["Cámara a la altura de los ojos, caminando desde la entrada.", "Abre la puerta, mira alrededor, sonríe.", "Mantén el plano sin cortes: da confianza.", "Último plano: la vista o el ambiente que más define el lugar."],
      text: "Llegada · punto de vista del huésped",
      caption: `Llegar a ${c.name} se siente así. ${up(c.hl)}.`,
    }),
  },
  {
    id: "details-carousel",
    pillar: "show",
    format: "carousel",
    build: (c) => ({
      title: "Los detalles que hacen la diferencia",
      hook: "Cosas pequeñas que se notan al llegar.",
      steps: ["Foto 1: portada con el detalle más lindo.", "Fotos 2 a 5: toallas, café o té de bienvenida, productos de baño, algo local.", "Foto 6: cierre con tu llamado a reservar."],
      text: "Los detalles cuentan",
      caption: `En ${c.name} cuidamos lo pequeño: lo que te espera cuando llegas y cuando te vas. ¿Cuál de estos detalles te gustó más?`,
    }),
  },
  {
    id: "golden-hour",
    pillar: "show",
    format: "photo",
    build: (c) => ({
      title: "La mejor hora del día",
      hook: "A esta hora, este lugar cambia.",
      steps: ["Elige la hora con mejor luz (suele ser la última del día).", "Una sola foto fuerte vale más que cinco regulares.", "No uses filtros que cambien los colores reales."],
      text: "Atardecer en " + c.name,
      caption: `La luz de la tarde en ${c.name}. Sin filtro, así se ve.`,
    }),
  },
  {
    id: "capacity-moment",
    pillar: "show",
    format: "video",
    build: (c) => ({
      title: `Cómo se vive ${c.the} cuando están todos`,
      hook: `${c.name} está pensado para ${c.cap}.`,
      steps: ["Muestra dónde duerme cada uno.", "Muestra la mesa o el sillón donde se juntan.", "Cierra con la cocina o el lugar de encuentro."],
      text: `Espacio para ${c.cap}`,
      caption: `Cómo se reparten los espacios en ${c.name} cuando vienen ${c.cap}. Todo pensado para que nadie se sienta apretado.`,
    }),
  },
  // amenity-specific (only when the owner has it)
  ...(
    [
      ["pileta", "La pileta, protagonista", "Esto es lo que te espera después de un día en %CITY%."],
      ["jacuzzi", "Jacuzzi al atardecer", "El plan más simple: agua caliente y nada más."],
      ["parrilla", "Una noche de parrilla", "La mejor mesa se arma al aire libre."],
      ["vista", "La vista, sin filtros", "Esta es la vista real. Sin edición."],
      ["chimenea", "Noche de chimenea", "Frío afuera, calor adentro."],
      ["cocina", "Cocinar durante tu estadía", "Todo lo que necesitas para cocinar como en casa."],
    ] as [AmenityKey, string, string][]
  ).map(
    ([key, title, hook]): Idea => ({
      id: `amenity-${key}`,
      pillar: "show",
      format: "video",
      needs: key,
      build: (c) => ({
        title,
        hook: hook.replace("%CITY%", c.city),
        steps: [`Grabar ${am(c).shot}.`, "Plano corto de 3 a 5 segundos, sin cortes bruscos.", "Agrega una persona usándolo para dar escala (con su permiso).", "Cierra con el nombre del alojamiento."],
        text: `${c.name} · ${am(c).noun}`,
        caption: `En ${c.name} puedes disfrutar de ${am(c).noun}. ${up(c.hl)}.`,
      }),
    }),
  ),

  // ---------------------------------------------------------------- EL DESTINO
  {
    id: "day-in-city",
    pillar: "experience",
    format: "carousel",
    build: (c) => ({
      title: `Un día perfecto en ${c.city}`,
      hook: `Si tuvieras un día en ${c.city}, haría esto.`,
      steps: ["Portada: foto del lugar más reconocible.", "Mañana: dónde desayunar.", "Mediodía: una actividad.", "Tarde: un paseo o un lugar con vista.", "Noche: dónde cenar.", "Cierre: dónde dormir (tu alojamiento)."],
      text: `1 día en ${c.city}`,
      caption: `Un día en ${c.city} que recomendamos a quienes se alojan en ${c.name}. Todo a poca distancia.`,
    }),
  },
  {
    id: "local-eats",
    pillar: "experience",
    format: "video",
    build: (c) => ({
      title: `3 lugares para comer cerca de ${c.name}`,
      hook: `Tres lugares donde comemos nosotros en ${c.city}.`,
      steps: ["Elige lugares que realmente recomiendas.", "Un plano de 5 segundos por lugar con su nombre en pantalla.", "Di qué pedir en cada uno.", "Pide permiso al local si grabas dentro."],
      text: `3 lugares para comer en ${c.city}`,
      caption: `Nuestros tres favoritos para comer cerca de ${c.name}. ¿Cuál te falta probar?`,
    }),
  },
  {
    id: "hidden-spot",
    pillar: "experience",
    format: "video",
    build: (c) => ({
      title: `Un rincón de ${c.city} que casi nadie conoce`,
      hook: `Esto no sale en las guías de ${c.city}.`,
      steps: ["Elige un lugar real y de acceso abierto.", "Muestra el camino para llegar, con el tiempo desde tu alojamiento.", "Di en qué horario conviene ir."],
      text: `Secreto de ${c.city}`,
      caption: `Un lugar de ${c.city} que recomendamos a quienes se hospedan en ${c.name}. Guárdalo para tu próximo viaje.`,
    }),
  },
  {
    id: "how-to-get",
    pillar: "experience",
    format: "video",
    build: (c) => ({
      title: "Cómo llegar y qué hay a minutos",
      hook: `Llegar a ${c.name} es más simple de lo que parece.`,
      steps: ["Muestra el mapa con el punto marcado.", "Di los tiempos reales a pie o en auto a 3 lugares clave.", "Menciona dónde estacionar o cómo moverse."],
      text: `${c.name}, ubicación`,
      caption: `Dónde queda ${c.name} y qué tienes cerca. Si dudas del camino, escríbenos y te lo explicamos.`,
    }),
  },
  {
    id: "this-month",
    pillar: "experience",
    format: "carousel",
    build: (c) => ({
      title: `Qué hacer en ${c.city} este mes`,
      hook: `Qué hacer en ${c.city} este mes.`,
      steps: ["Portada con el mes y el destino.", "3 a 5 actividades reales y vigentes (confirma fechas y horarios).", "Última diapositiva: tu alojamiento y cómo reservar."],
      text: `${c.city} este mes`,
      caption: `Ideas para este mes en ${c.city}. Verifica los horarios antes de ir. Y si necesitas dónde quedarte: ${c.name}.`,
    }),
  },
  {
    id: "aud-pareja",
    pillar: "experience",
    format: "carousel",
    audience: "pareja",
    build: (c) => ({
      title: `Fin de semana en pareja en ${c.city}`,
      hook: `Un fin de semana en pareja en ${c.city}, paso a paso.`,
      steps: ["Viernes: llegada y cena tranquila.", "Sábado: paseo, almuerzo y atardecer.", "Domingo: desayuno lento y salida sin apuro."],
      text: `Escapada en pareja · ${c.city}`,
      caption: `Un plan simple para dos en ${c.city}. El resto lo pone ${c.name}.`,
    }),
  },
  {
    id: "aud-familia",
    pillar: "experience",
    format: "carousel",
    audience: "familia",
    build: (c) => ({
      title: `Plan con niños en ${c.city}`,
      hook: `Qué hacer con niños en ${c.city}.`,
      steps: ["3 actividades para niños con precio y horario reales.", "Un lugar para descansar con adultos.", "Consejos prácticos: qué llevar, cuándo ir."],
      text: `${c.city} con niños`,
      caption: `Ideas para viajar en familia a ${c.city}. En ${c.name} hay lugar para ${c.cap}.`,
    }),
  },
  {
    id: "aud-amigos",
    pillar: "experience",
    format: "video",
    audience: "amigos",
    build: (c) => ({
      title: `Escapada con amigos a ${c.city}`,
      hook: `El plan para ir con amigos a ${c.city}.`,
      steps: ["Muestra dónde duerme cada uno.", "El plan de la noche en el alojamiento.", "Una actividad al aire libre cerca."],
      text: `Con amigos · ${c.city}`,
      caption: `Para ir con el grupo: ${c.name} entra ${c.cap}. Armen el plan y escríbannos para las fechas.`,
    }),
  },
  {
    id: "aud-nomada",
    pillar: "experience",
    format: "video",
    audience: "nomada",
    build: (c) => ({
      title: `Una semana trabajando desde ${c.city}`,
      hook: `Trabajar desde ${c.city} se ve así.`,
      steps: ["Muestra el espacio de trabajo y la conexión real.", "Una pausa de almuerzo en el barrio.", "Un atardecer después de la jornada."],
      text: `Trabajo remoto · ${c.city}`,
      caption: `¿Y si trabajas una semana desde ${c.city}? ${c.name} tiene lo que necesitas para hacerlo bien.`,
    }),
  },
  {
    id: "aud-solo",
    pillar: "experience",
    format: "carousel",
    audience: "solo",
    build: (c) => ({
      title: `Viajar solo a ${c.city}`,
      hook: `Cómo viajar solo a ${c.city} con tranquilidad.`,
      steps: ["Zonas seguras y caminables (tu conocimiento real).", "Dónde comer sin sentirte incómodo.", "El alojamiento como base tranquila."],
      text: `Viajar solo · ${c.city}`,
      caption: `Consejos para viajar solo a ${c.city}. En ${c.name} puedes descansar con calma.`,
    }),
  },

  // ---------------------------------------------------------------- DETRÁS DE ESCENA
  {
    id: "prep",
    pillar: "behind",
    format: "video",
    build: (c) => ({
      title: `Cómo preparamos ${c.the} para cada huésped`,
      hook: `Así dejamos ${c.the} antes de que llegues.`,
      steps: ["Sábanas limpias extendiéndose (plano rápido).", "Revisión de cada ambiente con lista.", "El detalle de bienvenida sobre la mesa.", "Cierre: puerta cerrada, todo listo."],
      text: "Listo para recibirte",
      caption: `Cada llegada a ${c.name} empieza horas antes. Este es el cuidado que ponemos.`,
    }),
  },
  {
    id: "welcome-kit",
    pillar: "behind",
    format: "photo",
    build: (c) => ({
      title: "Lo que encuentras al llegar",
      hook: "Esto te espera en la mesa.",
      steps: ["Arma la mesa de bienvenida con lo que realmente ofreces.", "Foto desde arriba, con luz natural."],
      text: "Bienvenida",
      caption: `Al llegar a ${c.name} te espera esto. Pequeño, pero pensado.`,
    }),
  },
  {
    id: "host-intro",
    pillar: "behind",
    format: "video",
    build: (c) => ({
      title: "Hola, soy tu anfitrión",
      hook: `Hola, soy quien cuida ${c.name}.`,
      steps: ["Habla a cámara, 20 a 30 segundos, sin guion leído.", "Di tu nombre, desde cuándo recibes huéspedes y qué te gusta de hacerlo.", "Termina diciendo cómo te pueden escribir."],
      text: `Tu anfitrión en ${c.city}`,
      caption: `Esta es la persona que te recibe en ${c.name}. Cualquier duda, escríbenos y respondemos nosotros.`,
    }),
  },
  {
    id: "story-place",
    pillar: "behind",
    format: "carousel",
    build: (c) => ({
      title: `La historia de ${c.name}`,
      hook: `Por qué existe ${c.name}.`,
      steps: ["Cómo era el lugar al principio (foto real si tienes).", "Qué decidiste cambiar y por qué.", "Cómo es hoy.", "Qué esperas que sienta quien lo visita."],
      text: `Nuestra historia`,
      caption: `${c.name} no apareció de un día para otro. Esta es su historia.`,
    }),
  },
  {
    id: "improvement",
    pillar: "behind",
    format: "photo",
    build: (c) => ({
      title: "Lo último que mejoramos",
      hook: "Lo último que mejoramos para ti.",
      steps: ["Muestra un antes y un después real.", "Explica en una frase por qué lo hiciste (por ejemplo, por una sugerencia de un huésped)."],
      text: "Mejoras recientes",
      caption: `Seguimos mejorando ${c.name}. Esta vez: lo que nos pidieron los huéspedes.`,
    }),
  },
  {
    id: "faq-video",
    pillar: "behind",
    format: "video",
    build: (c) => ({
      title: "Lo que más nos preguntan",
      hook: `Las 3 preguntas que más nos hacen sobre ${c.name}.`,
      steps: ["Anota las 3 preguntas reales que más recibes por mensaje.", "Responde cada una en 8 a 10 segundos.", "Cierra: cómo hacer otra pregunta."],
      text: "Preguntas frecuentes",
      caption: `Respondimos lo que más nos preguntan. Si te quedó otra duda sobre ${c.name}, escríbenos.`,
    }),
  },

  // ---------------------------------------------------------------- CONFIANZA
  {
    id: "real-review",
    pillar: "trust",
    format: "photo",
    build: (c) => ({
      title: "Lo que dijo un huésped",
      hook: "Esto escribió alguien que ya estuvo.",
      steps: ["Usa SOLO una reseña real y pide permiso al huésped para mostrarla (puede ir sin nombre).", "Captura de pantalla recortada sobre fondo de tu marca, sin cambiar el texto.", "Si todavía no tienes reseñas, salta esta idea: no inventes ninguna."],
      text: "[Pega aquí la reseña real, con permiso]",
      caption: `Palabras reales de quien se alojó en ${c.name}. Gracias por contarlo.`,
    }),
  },
  {
    id: "checkin-easy",
    pillar: "trust",
    format: "video",
    build: (c) => ({
      title: "Así de simple es el check-in",
      hook: "Llegar es fácil. Te muestro cómo.",
      steps: ["Muestra cómo se accede (llave, caja, cerradura).", "Muestra el mensaje que reciben antes de llegar.", "Di en qué horario pueden ingresar."],
      text: "Check-in simple",
      caption: `Cómo es el ingreso a ${c.name}: paso a paso, sin sorpresas.`,
    }),
  },
  {
    id: "rules-clear",
    pillar: "trust",
    format: "carousel",
    build: (c) => ({
      title: "Todo claro antes de reservar",
      hook: "Antes de reservar, esto es lo que debes saber.",
      steps: ["Horarios de ingreso y salida.", "Política de cancelación.", "Reglas de la casa (ruido, mascotas, fumar).", "Qué incluye y qué no.", "Cómo contactarnos."],
      text: "Claro desde el principio",
      caption: `Preferimos que todo esté claro desde el inicio: así ${c.name} se disfruta sin sorpresas.`,
    }),
  },
  {
    id: "included",
    pillar: "trust",
    format: "carousel",
    build: (c) => ({
      title: "Qué incluye tu estadía",
      hook: "Esto está incluido cuando reservas.",
      steps: ["Una foto por cada cosa incluida: ropa de cama, toallas, wifi, cocina equipada.", "Lo que NO está incluido, dicho con claridad.", "Cierra con el llamado a reservar."],
      text: "Incluido en tu estadía",
      caption: `Lo que encuentras incluido en ${c.name}. Si algo no está en la lista, pregúntanos.`,
    }),
  },
  {
    id: "guest-moment",
    pillar: "trust",
    format: "photo",
    build: (c) => ({
      title: "Huéspedes en el lugar (con permiso)",
      hook: `Así se ve ${c.name} cuando hay gente disfrutándolo.`,
      steps: ["Solo con permiso por escrito o por mensaje del huésped.", "Una foto natural, sin posar.", "Etiquétalos si aceptan."],
      text: "Momentos reales",
      caption: `Gracias a quienes eligen ${c.name} y nos dejan compartir su momento.`,
    }),
  },
  {
    id: "response-time",
    pillar: "trust",
    format: "video",
    build: (c) => ({
      title: "Cómo es hablar con nosotros",
      hook: "Qué pasa cuando nos escribes.",
      steps: ["Muestra el chat (con datos privados ocultos) y el tiempo real de respuesta.", "Di qué puedes resolver: horarios, recomendaciones, fechas."],
      text: "Te respondemos",
      caption: `Escribirnos es parte de la experiencia en ${c.name}. Respondemos tus dudas antes de que reserves.`,
    }),
  },

  // ---------------------------------------------------------------- RESERVAR
  {
    id: "open-dates",
    pillar: "offer",
    format: "photo",
    build: (c) => ({
      title: "Fechas disponibles",
      hook: "Estas fechas siguen libres.",
      steps: ["Revisa tu calendario real antes de publicar.", "Foto de portada + fechas en texto grande.", "Actualiza o elimina el post cuando se reserven."],
      text: "[Fechas libres reales]",
      caption: `Fechas libres en ${c.name}. ${c.cta}.`,
    }),
  },
  {
    id: "midweek",
    pillar: "offer",
    format: "video",
    build: (c) => ({
      title: "Escápate entre semana",
      hook: "No hace falta esperar al fin de semana.",
      steps: ["Muestra cómo se siente el lugar un día de semana: más tranquilo.", "Menciona la ventaja real (menos gente, más calma).", "Si tienes una tarifa distinta, dila con claridad."],
      text: "Escapada de semana",
      caption: `Entre semana, ${c.name} es otra experiencia. ${c.cta}.`,
    }),
  },
  {
    id: "longstay",
    pillar: "offer",
    format: "carousel",
    build: (c) => ({
      title: "Estadías largas",
      hook: "¿Y si te quedas más días?",
      steps: ["Muestra lo que lo hace cómodo para varios días: cocina, lavado, espacio de trabajo.", "Di desde cuántas noches haces condiciones especiales (solo si es cierto).", "Cierra con cómo consultar."],
      text: "Quédate más tiempo",
      caption: `Si quieres quedarte varios días en ${c.name}, consúltanos las condiciones. ${c.cta}.`,
    }),
  },
  {
    id: "book-3-steps",
    pillar: "offer",
    format: "carousel",
    build: (c) => ({
      title: "Cómo reservar en 3 pasos",
      hook: "Reservar es más simple de lo que crees.",
      steps: ["Paso 1: escríbenos con las fechas.", "Paso 2: te confirmamos disponibilidad y precio.", "Paso 3: reservas y te enviamos la guía de llegada."],
      text: "Reserva en 3 pasos",
      caption: `Reservar ${c.the} es simple. ${c.cta}.`,
    }),
  },
  {
    id: "gift",
    pillar: "offer",
    format: "photo",
    build: (c) => ({
      title: "Regala una escapada",
      hook: "El regalo que se recuerda.",
      steps: ["Foto cálida del alojamiento listo para recibir.", "Explica cómo se regala una estadía (solo si lo ofreces)."],
      text: "Regala una escapada",
      caption: `Una estadía en ${c.name} como regalo. Consúltanos cómo.`,
    }),
  },

  // ---------------------------------------------------------------- ENTRETENIMIENTO
  {
    id: "pov",
    pillar: "fun",
    format: "video",
    build: (c) => ({
      title: `POV: llegas a ${c.name}`,
      hook: `POV: llegas a ${c.name} después de una semana difícil.`,
      steps: ["Cámara subjetiva.", "Entras, dejas la mochila, respiras.", "Último plano: el lugar donde te sentarías primero."],
      text: `POV: llegas a ${c.name}`,
      caption: `Cuando por fin llegas. ${c.name}, ${c.city}.`,
    }),
  },
  {
    id: "this-or-that",
    pillar: "fun",
    format: "photo",
    build: (c) => ({
      title: "¿Mañana o noche?",
      hook: `¿${c.city} de día o de noche?`,
      steps: ["Dos fotos lado a lado: la misma escena de día y de noche.", "Pide que voten en comentarios o en una historia con encuesta."],
      text: "¿Día o noche?",
      caption: `¿Mañana o noche en ${c.name}? Cuéntanos en comentarios.`,
    }),
  },
  {
    id: "packing",
    pillar: "fun",
    format: "video",
    build: (c) => ({
      title: `Qué llevar a ${c.city}`,
      hook: `No viajes a ${c.city} sin esto.`,
      steps: ["Muestra 5 cosas sobre una mesa, de a una.", "Di por qué cada una (clima, actividades, comodidad).", "Última: «y lo demás ya está en el alojamiento»."],
      text: `Qué llevar a ${c.city}`,
      caption: `La lista de lo que llevaríamos a ${c.city}. ¿Qué agregarías?`,
    }),
  },
  {
    id: "expect-vs-reality",
    pillar: "fun",
    format: "video",
    build: (c) => ({
      title: "Lo que esperas vs. lo que encuentras",
      hook: `Lo que crees que es ${c.the} vs. lo que es.`,
      steps: ["Primero un cliché exagerado y gracioso.", "Corte seco a la realidad del alojamiento.", "Mantén el tono ligero, sin burlarte de nadie."],
      text: "Esperado vs. real",
      caption: `Lo que esperas y lo que encuentras en ${c.name}. Sin trucos.`,
    }),
  },
  {
    id: "asmr-prep",
    pillar: "fun",
    format: "video",
    build: (c) => ({
      title: "Preparar el alojamiento (satisfactorio)",
      hook: "Esto es lo más satisfactorio que vas a ver hoy.",
      steps: ["Planos cortos y cercanos de cada gesto: sábana, almohada, mesa.", "Sonido ambiente, sin música ni voz.", "Termina con el ambiente listo."],
      text: "Listo para ti",
      caption: `Dejando ${c.the} listo. Sin música, solo el sonido real.`,
    }),
  },
  {
    id: "who-with",
    pillar: "fun",
    format: "photo",
    build: (c) => ({
      title: "¿Con quién vendrías?",
      hook: `¿A quién traerías a ${c.name}?`,
      steps: ["Foto del lugar mejor logrado.", "Pide que etiqueten a la persona en comentarios."],
      text: "Etiqueta a tu persona",
      caption: `Etiqueta a quien vendrías a ${c.name}. ${c.cta}.`,
    }),
  },
  {
    id: "trend",
    pillar: "fun",
    format: "video",
    build: (c) => ({
      title: "Una tendencia del momento, adaptada",
      hook: "[Usa el formato del momento y adáptalo a tu alojamiento].",
      steps: ["Mira lo que se usa en la sección «Para ti» esta semana.", "Adapta el formato a tu alojamiento: mismo ritmo, tus imágenes.", "Usa audios de la biblioteca comercial de la plataforma para evitar problemas de derechos."],
      text: c.name,
      caption: `${c.name}, a nuestra manera.`,
    }),
  },
];
