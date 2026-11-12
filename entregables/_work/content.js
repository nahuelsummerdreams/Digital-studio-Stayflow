// Contenido de las guías de cliente. Todo lo que se afirma aquí existe hoy en la app.
// Tuteo neutro. Sin promesas de resultados económicos.

const COMMON_FAQ_TAIL = [
  ["¿Mis datos son privados?", "Sí. Cada negocio ve solamente lo suyo. Puedes eliminar tu cuenta y tus datos cuando quieras desde “Tu cuenta”, en el menú de tu nombre."],
  ["¿Hasta cuándo recibo mejoras?", "Tu compra incluye 12 meses de actualizaciones. Pasado ese tiempo la app sigue funcionando igual; renovar las mejoras es opcional."],
];

const guides = [
  // ------------------------------------------------------------------ HOST
  {
    id: "host",
    name: "Host",
    url: "https://stayflow-host.vercel.app",
    accent: ["#3B82F6", "#22D3EE"],
    tagline: "Todo tu alquiler, en un solo lugar.",
    welcome:
      "Gracias por elegir Stayflow Host. Lo diseñamos para que dejes de apagar incendios: reservas, fechas, limpiezas y cobros en un solo panel, sin planillas y sin depender de tu memoria. Esta guía te lleva de la mano durante tus primeros días.",
    benefits: [
      ["Un vistazo y listo", "Quién llega, quién sale, qué hay que limpiar y qué falta cobrar, todo en “Tu día”."],
      ["Cero dobles reservas", "Host no te deja reservar dos veces la misma fecha. Se acabó el susto."],
      ["La limpieza se programa sola", "Cargas la reserva y la tarea de limpieza aparece para el día de salida."],
    ],
    steps: [
      ["Crea tu cuenta y activa tu código", "Abre Host, pulsa “Crea tu cuenta”, ponle nombre a tu alojamiento y pega el código de licencia que recibiste con tu compra (SF-XXXX-XXXX-XXXX). Se activa al instante.", "2 min"],
      ["Agrega tu primera propiedad", "Nombre, ciudad y una foto. Con la foto, tu cronograma se ve mucho mejor.", "1 min"],
      ["Trae tus reservas", "En “Importar y sincronizar” sube el CSV de Airbnb o Booking y pega el enlace iCal. Si prefieres, carga una a mano con “Nueva reserva”.", "3 min"],
      ["Mira tu cronograma", "Abre “Cronograma” y comprueba que las fechas coinciden con lo que tienes en las plataformas.", "1 min"],
      ["Revisa “Tu día”", "Vuelve al Panel: ya muestra llegadas, salidas, tareas y cobros pendientes.", "1 min"],
      ["Deja listos tus mensajes", "En “Mensajes” revisa las 4 plantillas y ajusta el tono a tu estilo una sola vez.", "2 min"],
    ],
    stepsNote: "¿Quieres explorar antes de cargar lo tuyo? En “Primeros pasos” puedes cargar datos de ejemplo y quitarlos con un clic cuando termines.",
    screens: [
      {
        img: "host-panel",
        kicker: "Panel",
        title: "Tu día, de un vistazo",
        what: "Es la pantalla que abres cada mañana. Arriba, “Tu día” junta lo urgente: quién llega, quién sale, qué tareas hay y qué cobros faltan. Debajo, los números del mes y una agenda.",
        how: [
          "Toca cualquier tarjeta de “Tu día” para ir directo a esa pantalla.",
          "“Ocupación del mes” te dice cuántas noches tienes vendidas.",
          "“Por cobrar en total” suma lo que tus huéspedes todavía te deben.",
        ],
        tip: "Abre Host antes del primer café: con una mirada sabes si hoy es día de entradas, de salidas o de cobrar.",
      },
      {
        img: "host-calendario",
        kicker: "Cronograma",
        title: "Todas tus propiedades, todo el mes",
        what: "Cada día tiene dos cuadraditos: el de la izquierda es la mañana (salida) y el de la derecha es la tarde (entrada). Así ves de inmediato cuando un huésped se va y otro llega el mismo día.",
        how: [
          "Toca un día libre para crear una reserva allí mismo.",
          "Toca una barra para ver el detalle, editarla o registrar la llegada.",
          "Usa “Bloquear fechas” para mantenimiento o uso propio.",
        ],
        tip: "Cuando dos barras se tocan en un mismo día es un cambio de huéspedes: avisa a quien limpia que ese día hay poco margen.",
      },
      {
        img: "host-reservas",
        kicker: "Reservas",
        title: "Cada reserva, con su dinero",
        what: "La lista completa con huésped, fechas, origen e importe. Registra lo que ya cobraste y Host calcula cuánto falta.",
        how: [
          "“Nueva reserva” abre el formulario: propiedad, huésped, fechas, origen, importe y cobrado.",
          "Filtra por próximas, todas, pasadas o canceladas.",
          "Usa “Registrar llegada”, “Registrar salida” y “Registrar cobro” con un toque. Si Host rechaza una fecha, es porque ya está ocupada.",
        ],
        tip: "Si usas Stayflow Business en la misma cuenta, al registrar la salida el ingreso pasa solo a tus números (también existe el botón “Registrar en Business”).",
      },
      {
        img: "host-mensajes",
        kicker: "Mensajes",
        title: "Las respuestas que escribes todo el tiempo, ya escritas",
        what: "Cuatro mensajes listos —bienvenida, antes de llegar, recordatorio de salida y gracias con reseña— personalizados con el nombre y las fechas de cada huésped.",
        how: [
          "Elige una reserva y el mensaje que quieres enviar.",
          "“Editar plantilla” lo ajusta a tu estilo, y queda guardado.",
          "Pulsa “Copiar” y pégalo donde quieras; si la reserva tiene teléfono con código de país, también puedes abrirlo directo en WhatsApp.",
        ],
        tip: "Si publicas tu guía con Stayflow Guest, su enlace sale ya puesto en el mensaje: tus huéspedes dejan de preguntar por el Wi-Fi.",
      },
      {
        img: "host-reportes",
        kicker: "Reportes",
        title: "Tu mes en una sola hoja",
        what: "El cierre del mes por propiedad: reservas, noches, ocupación, facturado, cobrado y por cobrar. Listo para imprimir o guardar en PDF.",
        how: [
          "Cambia de mes con las flechas.",
          "Pulsa “Imprimir o guardar PDF” y elige “Guardar como PDF”.",
          "Compártelo con tu socio o con el dueño de la propiedad.",
        ],
        tip: "Si administras propiedades de terceros, este reporte es tu rendición de cuentas mensual, sin armar nada a mano.",
      },
      {
        img: "host-importar",
        kicker: "Importar y sincronizar",
        title: "Trae todo en minutos y mantenlo al día",
        what: "Dos caminos que se complementan: subir el archivo CSV de Airbnb o Booking (trae nombres, importes e historial) y conectar el calendario iCal (mantiene las fechas actualizadas). Además publicas tu propio calendario para que las plataformas bloqueen tus fechas.",
        how: [
          "Descarga tus reservas (Airbnb: Reservaciones → Exportar → CSV; Booking: Extranet → Reservas → Descargar), súbelas y elige la propiedad de cada una. Si repites la importación, no se duplica.",
          "Pega el enlace iCal de cada plataforma y pulsa “Sincronizar ahora”.",
          "Copia “Tu enlace para otras plataformas” en Airbnb o Booking para que se bloqueen entre sí.",
        ],
        tip: "El calendario iCal de Airbnb solo entrega fechas, no nombres ni importes. Por eso conviene importar el CSV una vez y dejar el iCal para mantenerlo al día.",
      },
      {
        img: "host-tareas",
        kicker: "Tareas",
        title: "Nada se te olvida",
        what: "Al cargar una reserva, Host crea la tarea de limpieza para el día de salida y la mueve si cambias las fechas. También puedes sumar tus propias tareas.",
        how: [
          "Marca una tarea como hecha con un toque.",
          "Las vencidas aparecen en rojo y también en “Tu día”.",
          "Si cancelas una reserva, su limpieza pendiente desaparece sola.",
        ],
        tip: "¿Tienes equipo de limpieza? Con Stayflow Operations cada persona ve y tilda sus trabajos desde el celular.",
      },
    ],
    routines: [
      ["Cada mañana (2 min)", ["Abre el Panel y lee “Tu día”.", "Responde las llegadas de hoy con el mensaje de bienvenida.", "Mira si hay cobros pendientes antes de una llegada."]],
      ["Cada vez que entra una reserva (1 min)", ["Cárgala (o deja que la sincronización la traiga).", "Envía el mensaje de bienvenida.", "Verifica que la limpieza aparece en Tareas."]],
      ["Cada semana (10 min)", ["Revisa “Por cobrar” y reclama lo pendiente.", "Mira el cronograma de las próximas dos semanas.", "Sincroniza si hiciste cambios en las plataformas."]],
      ["Cada mes (5 min)", ["Abre Reportes y guarda el PDF del mes.", "Compáralo con el mes anterior: noches, ocupación y cobrado."]],
    ],
    faq: [
      ["¿Se conecta con Airbnb y Booking?", "Por calendario (iCal) trae las fechas y las mantiene al día; con el CSV importas nombres, importes e historial. No es una conexión directa con sus sistemas, por eso Airbnb no entrega nombre ni importe por iCal."],
      ["¿Qué pasa si una plataforma cambia o cancela una reserva?", "Al sincronizar, Host actualiza o cancela solo las reservas que vinieron de un calendario. Las que cargaste tú nunca se modifican."],
      ["¿Puedo usarlo desde el celular?", "Sí. Funciona en el navegador y se instala como app en Android, iPhone, Windows y Mac (mira la página “Instálalo como app”)."],
      ["Me equivoqué al cargar una reserva, ¿qué hago?", "Toca “Editar” en la reserva y corrígela. También puedes cancelarla o eliminarla."],
      ...COMMON_FAQ_TAIL,
    ],
    crossSell: "Guest (menos mensajes repetidos) · Business (cuánto ganas de verdad) · Operations (tu equipo de limpieza)",
  },

  // ------------------------------------------------------------------ GUEST
  {
    id: "guest",
    name: "Guest",
    url: "https://stayflow-guest-eight.vercel.app",
    accent: ["#2DD4BF", "#34D399"],
    tagline: "Una bienvenida cálida, antes de que lleguen.",
    welcome:
      "Gracias por elegir Stayflow Guest. Con una guía digital por propiedad, tus huéspedes encuentran el Wi-Fi, cómo entrar, las reglas y tus lugares favoritos con solo escanear un código QR. Tú dejas de repetir las mismas respuestas y ellos llegan con todo claro.",
    benefits: [
      ["Menos mensajes repetidos", "Wi-Fi, check-in, reglas y cómo usar la casa, siempre a mano del huésped."],
      ["Una llegada sin dudas", "Instrucciones claras antes de que lleguen, en su propio idioma."],
      ["Imagen profesional", "Una guía propia y cuidada, con QR para imprimir. Sin descargar nada."],
    ],
    steps: [
      ["Crea tu cuenta y activa tu código", "Abre Guest e inicia sesión (si ya usas otra app Stayflow, es la misma cuenta) y pega el código de licencia que recibiste con tu compra.", "2 min"],
      ["Crea la guía de una propiedad", "En “Guías”, elige la propiedad y pulsa “Crear guía”.", "1 min"],
      ["Completa lo esencial", "Bienvenida, Wi-Fi, check-in y check-out. La barra de avance te muestra cuánto falta.", "5 min"],
      ["Suma tus lugares y consejos", "Agrega 3 sitios para comer o hacer, cómo usar los aparatos y las preguntas frecuentes.", "5 min"],
      ["Publica y comparte", "Pulsa “Publicar”, copia el enlace o descarga el QR. Pégalo en tu mensaje de llegada.", "1 min"],
      ["Imprime el QR", "Déjalo en la entrada, en la cocina o en la mesa de luz.", "2 min"],
    ],
    stepsNote: "Consejo: empieza por una sola propiedad. Cuando te guste el resultado, duplicar el esfuerzo en las demás es muy rápido.",
    screens: [
      {
        img: "guest-inicio",
        kicker: "Guías",
        title: "Una guía por propiedad",
        what: "Aquí ves todas tus propiedades y el estado de cada guía: sin guía, publicada, qué tan completa está. Un toque y entras a editarla.",
        how: [
          "“Crear guía” empieza la de esa propiedad.",
          "“Editar” abre el editor.",
          "La etiqueta indica si está publicada y cuánto le falta.",
        ],
        tip: "Una guía al 100% es una guía que se usa. Apunta a completar al menos bienvenida, Wi-Fi, check-in y tres recomendaciones.",
      },
      {
        img: "guest-editor",
        kicker: "Editor",
        title: "Todo lo que ve tu huésped, en un solo lugar",
        what: "Arriba, el avance y la publicación. Después, el enlace y el código QR para compartir. Más abajo editas bienvenida, Wi-Fi, check-in y check-out, reglas, seguridad, tus datos de contacto, lugares, aparatos y preguntas frecuentes.",
        how: [
          "“Copiar enlace” y “Descargar QR” (PNG o SVG) para compartir o imprimir.",
          "Elige el color de la guía y revisa la “Vista previa” antes de publicar.",
          "“Generar un enlace nuevo” invalida el anterior si alguna vez se filtra (recuerda reemplazar el QR impreso).",
        ],
        tip: "Escribe el check-in como se lo dirías a un amigo: “La caja de llaves está junto a la puerta; el código te llega el día anterior”.",
      },
      {
        imgs: ["guest-guia-es", "guest-guia-en"],
        layout: "phones",
        kicker: "Lo que ve tu huésped",
        title: "Tu guía, en el idioma de tu huésped",
        what: "El huésped abre el enlace o escanea el QR y ve tu guía en el celular, sin cuenta ni descargas. Puedes escribirla también en inglés y portugués: se elige sola según el idioma de su teléfono y hay un selector para cambiarlo.",
        how: [
          "En el editor, la sección “Tu guía en otros idiomas” tiene una pestaña por idioma.",
          "Si dejas un campo vacío en otro idioma, el huésped ve el texto en español: nunca queda en blanco.",
          "El botón de WhatsApp permite escribirte con un toque, si cargaste tu teléfono con código de país.",
        ],
        tip: "Traduce primero la bienvenida y el check-in: son las dos secciones que un huésped extranjero lee antes de llegar.",
      },
    ],
    routines: [
      ["Una vez por propiedad (20 min)", ["Completa la guía hasta el 100%.", "Publícala y prueba el enlace desde tu propio celular.", "Imprime el QR y déjalo a la vista."]],
      ["Con cada reserva (30 s)", ["Incluye el enlace de la guía en tu mensaje de llegada.", "Si el huésped es extranjero, comparte el enlace con el idioma elegido (?lang=en o ?lang=pt)."]],
      ["Cada vez que algo cambia", ["Cambió el Wi-Fi o una regla: actualiza la guía y todos ven la versión nueva al instante.", "Descubriste un lugar nuevo: súmalo a tus recomendaciones."]],
    ],
    faq: [
      ["¿Mi huésped necesita cuenta o descargar algo?", "No. Abre el enlace o escanea el QR y ve la guía en su navegador."],
      ["¿Cualquiera puede ver mi guía?", "Solo quien tenga el enlace. Los buscadores no la indexan. Si el enlace se filtra, genera uno nuevo y el anterior deja de funcionar."],
      ["¿Qué idiomas admite?", "Español como base, más inglés y portugués escritos por ti. Los textos fijos (Wi-Fi, check-in, etc.) se traducen solos."],
      ["¿Puedo pausar una guía?", "Sí. “Despublicar” la oculta al instante; vuelves a publicarla cuando quieras."],
      ["¿Puedo cambiar el color?", "Sí, hay tres colores de acento. Se ve en la guía del huésped y en la vista previa."],
      ...COMMON_FAQ_TAIL,
    ],
    crossSell: "Host (tus reservas y cobros) · Operations (limpieza y mantenimiento) · Business (cuánto ganas de verdad)",
  },

  // ------------------------------------------------------------------ BUSINESS
  {
    id: "business",
    name: "Business",
    url: "https://stayflow-profit.vercel.app",
    accent: ["#8B5CF6", "#C084FC"],
    tagline: "Descubre cuánto ganas de verdad.",
    welcome:
      "Gracias por elegir Stayflow Business. Sabes cuánto cobras, pero ¿sabes cuánto te queda? Business suma tus ingresos y tus gastos, los reparte por propiedad y te muestra tu ganancia real y tu margen, para que decidas con números y no con intuición.",
    benefits: [
      ["Tu ganancia real", "Ingresos menos gastos, con la comparación contra el período anterior."],
      ["Qué propiedad rinde", "Margen y noches vendidas de cada propiedad, una al lado de otra."],
      ["Una tarifa con sentido", "La calculadora te dice a cuánto alquilar para ganar lo que quieres."],
    ],
    steps: [
      ["Crea tu cuenta y activa tu código", "Abre Business e inicia sesión (si usas otras apps Stayflow, es la misma cuenta) y pega el código de licencia que recibiste con tu compra.", "2 min"],
      ["Carga tus propiedades", "Se comparten con las demás apps: si ya las tienes en Host, aparecen solas.", "1 min"],
      ["Registra tus ingresos", "En “Movimientos”, pestaña “Ingreso”: propiedad, importe, fecha, plataforma y noches. Si usas Host, los ingresos llegan solos cuando registras la salida.", "5 min"],
      ["Registra tus gastos", "Pestaña “Gasto”: limpieza, servicios, mantenimiento, suministros.", "5 min"],
      ["Carga tus costos fijos una vez", "En “Fijos”: internet, seguro, expensas, alquiler. Se registran solos cada mes.", "3 min"],
      ["Mira tu resumen", "Abre “Resumen” y cambia entre este mes, mes pasado, este año o todo.", "1 min"],
    ],
    stepsNote: "Consejo: dedica 10 minutos a la semana a cargar movimientos. Un hábito corto vale más que una sesión larga una vez al año.",
    screens: [
      {
        img: "profit-resumen",
        kicker: "Resumen",
        title: "Tu negocio, de un vistazo",
        what: "Ganancia neta, ingresos, gastos y noches vendidas, cada uno comparado con el período anterior. Debajo, el rendimiento de cada propiedad con su margen.",
        how: [
          "Cambia el período: este mes, mes pasado, este año o todo.",
          "Mira el porcentaje de comparación: verde mejora, rojo empeora.",
          "El margen de cada propiedad te dice cuál deja más por cada euro (o dólar) que entra.",
        ],
        tip: "Una propiedad llena pero con margen bajo suele tener gastos fijos o limpieza demasiado caros: ese es el primer lugar donde mirar.",
      },
      {
        img: "profit-movimientos",
        kicker: "Movimientos",
        title: "Todo lo que entró y todo lo que salió",
        what: "Un formulario simple para sumar ingresos y gastos, y a la derecha la lista de movimientos recientes. Si trabajas con un contador, exporta todo a Excel.",
        how: [
          "Elige “Ingreso” o “Gasto”, completa el formulario y pulsa “Agregar”.",
          "Corrige cualquier error con “Eliminar” y vuelve a cargarlo.",
          "“Descargar para Excel (CSV)” te da todo el detalle en una hoja.",
        ],
        tip: "Anota el gasto el mismo día, con la factura a la vista. Recordar de memoria a fin de mes es donde se pierde plata.",
      },
      {
        img: "profit-fijos",
        kicker: "Fijos",
        title: "Los costos que se repiten, cargados una vez",
        what: "Internet, seguro, expensas, alquiler: los cargas una sola vez y Business los registra solos cada mes, en el día que elijas. Un gasto compartido se reparte entre todas tus propiedades.",
        how: [
          "Elige la propiedad o “todas las propiedades (gasto compartido)”.",
          "Indica el importe mensual y el día del mes.",
          "Si el mes es más corto, se registra el último día.",
        ],
        tip: "Revisa tus fijos dos veces al año: es común seguir pagando servicios que ya no usas.",
      },
      {
        img: "profit-calculadora",
        kicker: "Tarifa",
        title: "Cuánto cobrar por noche",
        what: "Una calculadora que parte de tus costos fijos, tu costo por noche, la comisión de la plataforma, las noches que esperas ocupar y la ganancia que quieres, y te dice el precio mínimo por noche.",
        how: [
          "Completa costos fijos, costo por noche, comisión y noches ocupadas.",
          "Indica la ganancia que quieres al mes.",
          "Escribe tu precio actual para ver cuántas noches necesitas para no perder.",
        ],
        tip: "Usa el precio mínimo como piso, no como precio de venta: te dice dónde dejas de ganar, no cuánto vale tu casa.",
      },
    ],
    routines: [
      ["Cada semana (10 min)", ["Carga los ingresos y los gastos de la semana.", "Mira el Resumen del mes en curso."]],
      ["Cada mes (10 min)", ["Cambia a “Mes pasado” y revisa la ganancia y el margen por propiedad.", "Exporta el CSV si trabajas con un contador."]],
      ["Cada trimestre (20 min)", ["Revisa tus costos fijos.", "Vuelve a calcular tu tarifa mínima con los costos nuevos."]],
    ],
    faq: [
      ["¿Se conecta con Host?", "Sí, si usas las dos apps en la misma cuenta: al registrar la salida de una estadía en Host, su importe pasa solo como ingreso en Business, una sola vez."],
      ["¿Qué moneda usa?", "La de tu negocio, que eliges al crear la cuenta."],
      ["¿Puedo sacar mis datos a Excel?", "Sí. En “Movimientos”, “Descargar para Excel (CSV)”."],
      ["¿Reparte los gastos compartidos?", "Sí. Un gasto sin propiedad se reparte entre todas las que tienes."],
      ["¿Esto reemplaza a mi contador?", "No. Te da orden y números claros para decidir y para llevarle a tu contador; los impuestos siguen siendo cosa suya."],
      ...COMMON_FAQ_TAIL,
    ],
    crossSell: "Host (tus reservas y cobros) · Guest (guía para tus huéspedes) · Operations (limpieza y mantenimiento)",
  },

  // ------------------------------------------------------------------ OPERATIONS
  {
    id: "operations",
    name: "Operations",
    url: "https://stayflow-operations.vercel.app",
    accent: ["#F59E0B", "#FB7185"],
    tagline: "Cada propiedad, siempre lista.",
    welcome:
      "Gracias por elegir Stayflow Operations. Convierte tus reservas en trabajo organizado: la limpieza aparece sola, tu equipo la ve y la tilda desde el celular sin crear cuenta, y el mantenimiento que se repite deja de depender de tu memoria.",
    benefits: [
      ["La limpieza aparece sola", "Cada reserva de Host genera su trabajo, con aviso si entra otro huésped el mismo día."],
      ["Tu equipo, sin cuentas", "Cada persona abre su enlace privado en el celular, ve solo lo suyo y tilda los pasos."],
      ["Nada vence en silencio", "El mantenimiento recurrente aparece en tu día cuando se acerca la fecha."],
    ],
    steps: [
      ["Crea tu cuenta y activa tu código", "Abre Operations e inicia sesión y pega el código de licencia que recibiste con tu compra. Si usas Host, tus propiedades y reservas ya están.", "2 min"],
      ["Mira tu día", "En “Hoy” aparecen las limpiezas creadas desde tus reservas.", "1 min"],
      ["Ajusta tu lista de limpieza", "En “Listas” puedes dejar la lista estándar o crear la tuya (por tipo y por propiedad).", "5 min"],
      ["Suma a tu equipo", "En “Equipo”, agrega a cada persona y envíale su enlace privado por WhatsApp.", "2 min"],
      ["Asigna los trabajos", "Abre un trabajo y elige quién lo hace.", "1 min"],
      ["Programa el mantenimiento", "En “Mantenimiento”: filtros del aire cada 90 días, extintores, desagües…", "3 min"],
    ],
    stepsNote: "Consejo: prueba tú el enlace del equipo desde tu celular antes de enviarlo, para ver exactamente lo que verá tu equipo.",
    screens: [
      {
        img: "operations-hoy",
        kicker: "Hoy",
        title: "Lo que hay que hacer hoy, mañana y esta semana",
        what: "Cuatro números arriba (atrasados, para hoy, entrada el mismo día, hechos hoy) y debajo los trabajos agrupados por día. Las limpiezas se crean solas a partir de las reservas de Host.",
        how: [
          "“Entrada el mismo día” te avisa dónde hay poco margen entre una salida y la siguiente llegada.",
          "Abre un trabajo para ver su lista de pasos, asignarlo o marcarlo.",
          "“Nuevo trabajo” sirve para arreglos, check-ins o lo que se te ocurra.",
        ],
        tip: "Mira primero los trabajos con la etiqueta de entrada el mismo día: son los que no pueden fallar.",
      },
      {
        img: "operations-trabajos",
        kicker: "Trabajos",
        title: "Todo el trabajo en un solo lugar",
        what: "Crea trabajos con propiedad, tipo, fecha, responsable, lista de pasos y notas. Filtra por abiertos, hechos o todos, y por propiedad.",
        how: [
          "“Nuevo trabajo”: elige tipo (limpieza, mantenimiento, check-in u otro) y la fecha.",
          "La lista de pasos viene de tus “Listas”: una línea por paso.",
          "Asígnalo a alguien de tu equipo con un toque.",
        ],
        tip: "Pon una nota en los trabajos delicados (“el huésped dejó una maleta, guárdala”). Tu equipo la ve antes de empezar.",
      },
      {
        img: "operations-checklists",
        kicker: "Listas",
        title: "Las listas que sigue tu equipo",
        what: "Una lista por tipo de trabajo (limpieza, mantenimiento, check-in) y, si quieres, una distinta por propiedad. Los trabajos nuevos usan la lista automáticamente.",
        how: [
          "Escribe un paso por línea y elige para qué propiedades aplica.",
          "La lista de una propiedad gana sobre la general.",
          "Si no creas ninguna, se usa una lista de limpieza estándar de 9 pasos.",
        ],
        tip: "Escribe los pasos como instrucciones concretas (“cambiar sábanas y toallas”), no como ideas (“dejar lindo”).",
      },
      {
        img: "operations-equipo",
        kicker: "Equipo",
        title: "Cada persona, con su enlace privado",
        what: "Agrega a cada persona con su teléfono. Cada una recibe un enlace que abre desde el celular: ve solo sus trabajos y va tildando los pasos. No necesita crear cuenta ni instalar nada.",
        how: [
          "“Agregar persona” y listo: copia el enlace o envíalo por WhatsApp.",
          "“Desactivar” corta el acceso de inmediato, sin borrar el historial.",
          "Si cambia la persona, desactívala y agrega a la nueva.",
        ],
        tip: "Trata el enlace como una llave: quien lo tiene ve esos trabajos. Si se pierde un teléfono, desactiva a la persona.",
      },
      {
        imgs: ["operations-equipo-celular"],
        layout: "phone",
        kicker: "La vista de tu equipo",
        title: "Así lo ve quien limpia, desde su celular",
        what: "Una pantalla simple y grande para usar con una mano: el trabajo del día, la lista de pasos para tildar, el botón para empezar y terminar, y la opción de adjuntar fotos de evidencia.",
        how: [
          "Tilda cada paso; el avance se ve en la barra.",
          "“Agregar foto” abre la cámara: la foto queda guardada en el trabajo, hasta 8 por trabajo.",
          "“Terminé” marca el trabajo como hecho y tú lo ves al instante.",
        ],
        tip: "Pide una foto del estado final de cada propiedad. Resuelve discusiones sobre “estaba limpio” o “estaba roto” con un vistazo.",
      },
      {
        img: "operations-mantenimiento",
        kicker: "Mantenimiento",
        title: "Lo que se repite cada tanto",
        what: "Define tareas recurrentes (filtros del aire, extintores, desagües, fumigación) con cada cuántos días se repiten. Cuando se acerca la fecha, el trabajo aparece solo en tu día.",
        how: [
          "Elige la propiedad, qué hay que hacer y cada cuántos días.",
          "Indica la primera fecha.",
          "Agrega una lista de pasos si quieres que quede por escrito.",
        ],
        tip: "Programa primero lo que, si falla, cuesta caro: extintores, caldera y desagües.",
      },
    ],
    routines: [
      ["Cada mañana (3 min)", ["Abre “Hoy” y revisa atrasados y entradas el mismo día.", "Confirma que cada trabajo tiene responsable."]],
      ["Cada vez que entra una reserva (30 s)", ["El trabajo de limpieza ya está creado. Asígnalo a alguien."]],
      ["Cada semana (10 min)", ["Mira “Esta semana” y reparte el trabajo.", "Revisa las fotos de lo terminado."]],
      ["Cada mes (10 min)", ["Revisa el mantenimiento que se acerca.", "Actualiza tus listas con lo que aprendiste."]],
    ],
    faq: [
      ["¿Necesito Host para usar Operations?", "No es obligatorio, pero juntos funcionan mejor: con Host las limpiezas se crean solas desde las reservas. Sin Host puedes crear los trabajos a mano."],
      ["¿Mi equipo necesita cuenta o instalar algo?", "No. Abren su enlace privado en el celular."],
      ["¿Qué pasa si alguien pierde el celular?", "Desactívalo en “Equipo”: el enlace deja de funcionar al instante."],
      ["¿Cuántas fotos puede subir mi equipo?", "Hasta 8 por trabajo. Las ves en el trabajo, dentro de la app."],
      ["¿Qué pasa si una reserva cambia de fecha?", "La limpieza sigue a la reserva: cambia de fecha con ella."],
      ...COMMON_FAQ_TAIL,
    ],
    crossSell: "Host (tus reservas y cobros) · Guest (guía para tus huéspedes) · Business (cuánto ganas de verdad)",
  },
];

module.exports = { guides };
