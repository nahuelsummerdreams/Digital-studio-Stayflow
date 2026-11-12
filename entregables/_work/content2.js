// Guías de cliente, estructura "Digital Studio": portada, así funciona, antes de empezar, pasos con capturas numeradas,
// celular, rutina diaria, así empezamos y licencia. Todo lo afirmado existe hoy en la app. Tuteo neutro.
// marks: en el mismo orden que SPECS de shots2.js (los que no se encuentren se descartan y se renumera).

const guides = [
  // =================================================================== HOST
  {
    id: "host", name: "Host", app: "host", url: "https://stayflow-host.vercel.app", accent: ["#3B82F6", "#22D3EE"],
    cover: { lines: ["GESTIÓN DE", "TUS", "RESERVAS"], sub: "De la reserva a la limpieza y al cobro. Todo tu alquiler en un solo lugar, sin planillas.", phones: ["m-host-panel", "m-host-reservas", "m-host-mensajes"] },
    flow: {
      lead: "Seis momentos que se encadenan solos. Tú solo tocas los botones del panel.",
      moments: [
        ["upload", "1 · ENTRA", "Cargas la reserva, la importas de Airbnb o Booking, o llega sola por calendario."],
        ["calendar", "2 · SE VE", "El cronograma muestra cada propiedad y cada día, con entradas y salidas."],
        ["message", "3 · SE AVISA", "Mensajes listos con el nombre y las fechas, a un toque de WhatsApp."],
        ["sparkles", "4 · SE LIMPIA", "La tarea de limpieza aparece sola para el día de salida."],
        ["wallet", "5 · SE COBRA", "Registras la seña y el saldo; Host te muestra lo que falta."],
        ["chart", "6 · SE MIDE", "El reporte del mes: noches, ocupación, facturado y cobrado."],
      ],
      cards: [
        ["host-calendario", "TU CRONOGRAMA", "Cada propiedad, cada día. La entrada y la salida del mismo día se ven al instante."],
        ["host-mensajes", "TUS MENSAJES", "Cuatro respuestas listas, personalizadas con los datos de cada huésped."],
        ["host-panel", "TÚ, EL DUEÑO", "Un panel para el día a día, los cobros y el cierre del mes."],
      ],
      important: "Host no te deja reservar dos veces la misma fecha, y nunca modifica las reservas que cargaste tú: solo toca las que vienen de un calendario externo.",
    },
    steps: [
      {
        img: "host-panel", kicker: "PASO 1", title: "ENTRAS A TU PANEL", lead: "Lo primero que ves cada mañana: lo urgente del día y los números del mes.",
        marks: [["TU DÍA", "Llegadas, salidas, tareas y cobros del día en una sola tarjeta."], ["OCUPACIÓN DEL MES", "Cuántas noches tienes vendidas."], ["POR COBRAR", "Suma lo que tus huéspedes todavía te deben."], ["AGENDA", "Los movimientos de la semana, día por día."], ["MENÚ LATERAL", "Cronograma, reservas, mensajes y más: todo a un toque."]],
        box: { type: "note", title: "Hábito de éxito:", text: "abre Host antes del primer café. Con una mirada sabes si hoy es día de entradas, de salidas o de cobrar." },
      },
      {
        img: "host-calendario", kicker: "PASO 2", title: "EL CRONOGRAMA", lead: "Todas tus propiedades en un solo mes. Cada día tiene dos cuadraditos: mañana y tarde.",
        marks: [["OCUPACIÓN", "El porcentaje de noches vendidas del mes."], ["EL MES", "Navega con las flechas o vuelve a hoy."], ["BLOQUEAR FECHAS", "Para mantenimiento o uso propio."], ["CAMBIO DE HUÉSPEDES", "Sale uno y entra otro el mismo día."], ["DÍA LIBRE", "Tócalo para crear una reserva ahí mismo."]],
        box: { type: "list", title: "CÓMO LEERLO", items: ["Cuadrito izquierdo: la mañana (salida)", "Cuadrito derecho: la tarde (entrada)", "Barra: una reserva. Barra rayada: un bloqueo", "Toca una barra para ver el detalle"] },
      },
      {
        img: "host-reservas", kicker: "PASO 3", title: "CARGA Y SIGUE TUS RESERVAS", lead: "Cada reserva con su huésped, sus fechas, su origen y su dinero.",
        marks: [["NUEVA RESERVA", "Propiedad, huésped, fechas, origen, importe y lo cobrado."], ["FILTROS", "Próximas, todas, pasadas o canceladas."], ["REGISTRAR LLEGADA", "Con un toque marcas que el huésped ya llegó."], ["REGISTRAR COBRO", "Anota la seña o el saldo y Host calcula lo que falta."], ["ESTADO DE COBRO", "“Sin cobrar” hasta que registres el pago."]],
        box: { type: "note", title: "Con Business:", text: "al registrar la salida, el importe pasa solo como ingreso a tus números (una sola vez)." },
      },
      {
        img: "host-mensajes", kicker: "PASO 4", title: "MENSAJES LISTOS", lead: "Las respuestas que escribes todo el tiempo, ya escritas y con los datos de cada huésped.",
        marks: [["ELIGE EL MENSAJE", "Bienvenida, antes de llegar, recordatorio de salida y gracias."], ["ASÍ LO RECIBE", "Lo ves completo antes de enviarlo."], ["COPIAR", "Pégalo donde quieras. Con teléfono y código de país, ábrelo en WhatsApp."], ["EDITAR PLANTILLA", "Ajusta el tono una vez y queda guardado."]],
        box: { type: "note", title: "Con Guest:", text: "si publicas tu guía, su enlace sale ya puesto en el mensaje y tus huéspedes dejan de preguntar por el Wi-Fi." },
      },
      {
        img: "host-reportes", kicker: "PASO 5", title: "TU MES EN UNA HOJA", lead: "El cierre por propiedad, listo para imprimir o guardar como PDF.",
        marks: [["REPORTE MENSUAL", "Cambia de mes con las flechas."], ["IMPRIMIR O GUARDAR PDF", "Elige “Guardar como PDF” y compártelo."], ["OCUPACIÓN", "Qué porcentaje de las noches vendiste."], ["POR COBRAR", "Lo que todavía falta recibir."], ["TOTAL", "La suma de todas tus propiedades."]],
        box: { type: "note", title: "Si administras propiedades de terceros:", text: "este reporte es tu rendición de cuentas mensual, sin armar nada a mano." },
      },
      {
        img: "host-importar", kicker: "PASO 6", title: "IMPORTA Y SINCRONIZA", lead: "Trae tu historial en minutos y mantén las fechas al día con Airbnb y Booking.",
        marks: [["ELEGIR ARCHIVO CSV", "El que descargas de Airbnb o Booking, con nombres e importes."], ["ENLACE DE CALENDARIO", "Pega el enlace iCal de cada plataforma."], ["SINCRONIZAR AHORA", "Trae las fechas nuevas y las que cambiaron."], ["TU ENLACE", "Pégalo en las otras plataformas para bloquear tus fechas."], ["COPIAR ENLACE", "Solo comparte fechas, nunca nombres ni importes."]],
        box: { type: "note", title: "Bueno saber:", text: "si repites la importación no se duplica. Airbnb no entrega nombre ni importe por calendario, por eso conviene importar el CSV una vez." },
      },
      {
        img: "host-tareas", kicker: "PASO 7", title: "NADA SE TE OLVIDA", lead: "Al cargar una reserva, la limpieza de salida se programa sola y sigue las fechas.",
        marks: [["NUEVA TAREA", "Suma las tuyas: comprar sábanas, revisar la caldera…"], ["PENDIENTES", "Lo que falta por hacer, con su fecha."], ["MARCAR COMO HECHA", "Un toque y se tacha."], ["VENCIDAS", "Aparecen en rojo y también en “Tu día”."], ["AGREGAR TAREA", "Con propiedad y fecha, si quieres."]],
        box: { type: "note", title: "Con Operations:", text: "tu equipo ve y tilda cada limpieza desde su celular, con foto de evidencia." },
      },
    ],
    phones: { kicker: "PASO 8", title: "TAMBIÉN EN TU CELULAR", lead: "La misma app, los mismos datos. Instálala y ábrela como cualquier aplicación.", imgs: ["m-host-panel", "m-host-reservas", "m-host-calendario"], captions: [["EL PANEL", "Tu día y los números del mes, a una mano."], ["TUS RESERVAS", "Carga una nueva o registra una llegada en segundos."], ["EL CRONOGRAMA", "Desliza y mira cualquier fecha."]] },
    routine: {
      cards: [["AL EMPEZAR EL DÍA", ["Abre el Panel y lee “Tu día”.", "Responde las llegadas de hoy.", "Mira los cobros pendientes."]], ["CUANDO ENTRA UNA RESERVA", ["Cárgala o deja que se sincronice.", "Envía el mensaje de bienvenida.", "Verifica la limpieza en Tareas."]], ["CADA SEMANA", ["Reclama lo que falta cobrar.", "Mira las próximas dos semanas.", "Sincroniza tus calendarios."]], ["AL CERRAR EL MES", ["Abre Reportes y guarda el PDF.", "Compara noches y cobrado.", "Ajusta tus precios si hace falta."]]],
      phone: "m-host-mensajes", phoneTitle: "TUS MENSAJES, SIEMPRE A MANO", phoneText: "Cuatro mensajes listos para enviar por WhatsApp o correo, con el nombre y las fechas de cada huésped.",
      included: ["Cronograma con entrada y salida del mismo día", "Reservas con cobros y saldo", "Importar CSV de Airbnb y Booking", "Calendario iCal (Airbnb, Booking, Vrbo)", "Mensajes listos para tus huéspedes", "Limpieza automática por reserva", "Reporte mensual en PDF", "Bloqueo de fechas", "Instalable en celular y computadora", "Datos de ejemplo para explorar"],
    },
    faq: null,
  },

  // =================================================================== GUEST
  {
    id: "guest", name: "Guest", app: "guest", url: "https://stayflow-guest-eight.vercel.app", accent: ["#2DD4BF", "#34D399"],
    cover: { lines: ["GUÍA DIGITAL", "PARA TUS", "HUÉSPEDES"], sub: "Wi-Fi, check-in, reglas y tus lugares favoritos en un código QR. Menos mensajes, mejor llegada.", phones: ["m-guest-guia-es", "m-guest-inicio", "m-guest-guia-en"] },
    flow: {
      lead: "Seis momentos que se encadenan solos. Tú escribes la guía una vez.",
      moments: [
        ["file", "1 · LA ESCRIBES", "Bienvenida, Wi-Fi, check-in, reglas y tus recomendaciones, en un editor simple."],
        ["globe", "2 · LA TRADUCES", "Opcionalmente en inglés y portugués, escrita por ti."],
        ["qr", "3 · LA COMPARTES", "Un enlace y un código QR para imprimir. Sin descargar nada."],
        ["phone", "4 · EL HUÉSPED LA ABRE", "En su celular, sin cuenta, y en el idioma de su teléfono."],
        ["key", "5 · LLEGA TRANQUILO", "Sabe cómo entrar, la clave del Wi-Fi y las reglas antes de tocar tu puerta."],
        ["check", "6 · TÚ TE RELAJAS", "Menos mensajes repetidos y una imagen profesional."],
      ],
      cards: [["m-guest-guia-es", "LO QUE VE TU HUÉSPED", "Una guía en su celular, con tu estilo y tu color."], ["guest-editor", "TU EDITOR", "Avance, publicación, enlace y QR en una sola pantalla."], ["guest-idiomas", "EN SU IDIOMA", "Español, inglés y portugués: elige solo según su teléfono."]],
      important: "La guía es privada: solo la ve quien tenga el enlace y los buscadores no la indexan. Si el enlace se filtra, generas uno nuevo y el anterior deja de funcionar.",
    },
    steps: [
      {
        img: "guest-inicio", kicker: "PASO 1", title: "TUS GUÍAS", lead: "Una guía por propiedad, con su estado a la vista.",
        marks: [["GUÍAS DIGITALES", "Cada propiedad tiene su guía; el huésped la abre con un QR."], ["CREAR GUÍA", "Empieza la guía de esa propiedad."], ["PUBLICADA", "Te dice si ya la ve tu huésped y cuánto le falta."], ["EDITAR", "Abre el editor de esa guía."]],
        box: { type: "note", title: "Consejo:", text: "empieza por una sola propiedad. Cuando te guste el resultado, las demás son muy rápidas." },
      },
      {
        img: "guest-editor", kicker: "PASO 2", title: "PUBLICA Y COMPARTE", lead: "Avance, publicación, enlace y código QR para imprimir.",
        marks: [["AVANCE", "Te muestra cuánto falta para una guía completa."], ["PUBLICACIÓN", "Publica o despublica con un toque."], ["ENLACE Y QR", "Lo compartes por mensaje o lo imprimes."], ["COPIAR ENLACE", "Pégalo en tu mensaje de llegada."], ["DESCARGAR QR", "En PNG o SVG, listo para imprimir."]],
        box: { type: "list", title: "DÓNDE PONER EL QR", items: ["En la entrada", "En la cocina", "En la mesa de luz", "En tu mensaje de llegada"] },
      },
      {
        img: "guest-contenido", kicker: "PASO 3", title: "ESCRIBE LO ESENCIAL", lead: "Bienvenida, Wi-Fi, check-in y check-out, reglas, seguridad y tu contacto.",
        marks: [],
        box: { type: "note", title: "Escríbelo como se lo dirías a un amigo:", text: "“La caja de llaves está junto a la puerta; el código te llega el día anterior”. Corto, claro y amable." },
        legend: [["BIENVENIDA", "El primer mensaje que lee tu huésped."], ["WI-FI", "Nombre y clave, con botón para copiar."], ["CHECK-IN Y CHECK-OUT", "Cómo entrar y cómo dejar la casa."], ["REGLAS Y SEGURIDAD", "Lo que tu huésped necesita saber."]],
      },
      {
        img: "guest-lugares", kicker: "PASO 4", title: "TUS LUGARES Y CONSEJOS", lead: "Dónde comer, qué hacer, cómo usar la casa y las preguntas frecuentes.",
        marks: [],
        box: { type: "list", title: "TAMBIÉN PUEDES", items: ["Agregar lugares por categoría", "Explicar cómo usar los aparatos", "Responder las preguntas frecuentes", "Sumar enlaces a mapas"] },
        legend: [["LUGARES", "Restaurantes, actividades, transporte y compras."], ["CÓMO USAR LA CASA", "El aire, la caldera, la TV: una vez y listo."], ["PREGUNTAS FRECUENTES", "Las que más te hacen, respondidas de antemano."]],
      },
      {
        img: "guest-idiomas", kicker: "PASO 5", title: "TU GUÍA EN OTROS IDIOMAS", lead: "Escribe tu guía también en inglés y portugués.",
        marks: [["INGLÉS", "Una pestaña por idioma, con el texto en español de referencia."], ["PORTUGUÉS", "Lo mismo para tus huéspedes de Brasil y Portugal."], ["TU TRADUCCIÓN", "Si dejas un campo vacío, se ve el español: nunca queda en blanco."], ["GUARDAR", "Los cambios se ven al instante en la guía."]],
        box: { type: "note", title: "Consejo:", text: "traduce primero la bienvenida y el check-in: son lo que un huésped extranjero lee antes de llegar." },
      },
    ],
    phones: { kicker: "PASO 6", title: "LO QUE VE TU HUÉSPED", lead: "Sin cuenta, sin descargas, y en su idioma.", imgs: ["m-guest-guia-es", "m-guest-guia-en", "m-guest-editor"], captions: [["EN ESPAÑOL", "Tu guía completa, con tu color y tu estilo."], ["IN ENGLISH", "El mismo contenido en el idioma de su teléfono."], ["TU EDITOR", "Cámbiala desde el celular cuando quieras."]] },
    routine: {
      cards: [["UNA VEZ POR PROPIEDAD", ["Completa la guía hasta el 100%.", "Publícala y pruébala en tu celular.", "Imprime el QR y déjalo a la vista."]], ["CON CADA RESERVA", ["Incluye el enlace en tu mensaje de llegada.", "Si es extranjero, comparte el idioma que usa.", "No repitas más el Wi-Fi."]], ["CUANDO ALGO CAMBIA", ["Cambió la clave o una regla: edítala.", "Todos ven la versión nueva al instante.", "No hay que reimprimir el QR."]], ["CADA TANTO", ["Suma un lugar nuevo que descubriste.", "Responde la pregunta que más te hacen.", "Revisa la guía desde el celular."]]],
      phone: "m-guest-guia-es", phoneTitle: "TU GUÍA, SIEMPRE ACTUALIZADA", phoneText: "El enlace y el QR no cambian: editas la guía y todos ven la versión nueva.",
      included: ["Una guía digital por propiedad", "Enlace y código QR (PNG y SVG)", "Wi-Fi con botón para copiar", "Lugares por categoría", "Cómo usar la casa y preguntas frecuentes", "Español, inglés y portugués", "Tres colores de acento", "Vista previa antes de publicar", "Botón de WhatsApp hacia ti", "Enlace nuevo si el anterior se filtra"],
    },
  },

  // =================================================================== BUSINESS
  {
    id: "business", name: "Business", app: "profit", url: "https://stayflow-profit.vercel.app", accent: ["#8B5CF6", "#C084FC"],
    cover: { lines: ["TUS NÚMEROS", "CLAROS POR", "PROPIEDAD"], sub: "Ingresos, gastos, ganancia y margen. Descubre cuánto ganas de verdad.", phones: ["m-profit-resumen", "m-profit-movimientos", "m-profit-calculadora"] },
    flow: {
      lead: "Seis momentos que te devuelven el control. Tú solo cargas los movimientos.",
      moments: [
        ["wallet", "1 · INGRESAN", "Registras cada ingreso: propiedad, plataforma, noches e importe."],
        ["clipboard", "2 · SALEN", "Registras cada gasto: limpieza, servicios, mantenimiento, suministros."],
        ["sync", "3 · SE REPITEN SOLOS", "Tus costos fijos se registran cada mes sin que lo pienses."],
        ["chart", "4 · VES TU GANANCIA", "Ingresos menos gastos, comparado con el período anterior."],
        ["home", "5 · COMPARAS", "El margen y las noches de cada propiedad, una al lado de otra."],
        ["calculator", "6 · DECIDES", "La calculadora te dice a cuánto alquilar para ganar lo que quieres."],
      ],
      cards: [["profit-resumen", "TU RESUMEN", "Ganancia, ingresos, gastos y noches, con comparación."], ["profit-movimientos", "TUS MOVIMIENTOS", "Todo lo que entró y salió, listo para Excel."], ["profit-calculadora", "TU TARIFA", "Cuánto cobrar por noche con tus números reales."]],
      important: "Con Host en la misma cuenta, los ingresos llegan solos: al registrar la salida de una estadía, su importe pasa a Business, una sola vez. Business no reemplaza a tu contador: te da orden y números claros.",
    },
    steps: [
      {
        img: "profit-resumen", kicker: "PASO 1", title: "TU RESUMEN", lead: "Tu negocio de un vistazo, comparado con el período anterior.",
        marks: [["PERÍODO", "Este mes, mes pasado, este año o todo."], ["GANANCIA NETA", "Lo que de verdad te queda."], ["COMPARACIÓN", "Verde mejora, rojo empeora, contra el período anterior."], ["RENDIMIENTO", "Cada propiedad con su margen y sus noches."]],
        box: { type: "note", title: "Dónde mirar primero:", text: "una propiedad llena pero con margen bajo suele tener gastos fijos o limpieza demasiado caros." },
      },
      {
        img: "profit-movimientos", kicker: "PASO 2", title: "CARGA INGRESOS Y GASTOS", lead: "Un formulario simple y la lista de lo reciente. Exporta todo a Excel.",
        marks: [["INGRESO O GASTO", "Elige el tipo de movimiento."], ["IMPORTE", "Con su moneda y su fecha."], ["AGREGAR", "Un clic y queda registrado."], ["RECIENTES", "Lo último que cargaste; corrige con “Eliminar”."], ["PARA EXCEL", "Descarga todo el detalle en un CSV."]],
        box: { type: "note", title: "Hábito de éxito:", text: "anota el gasto el mismo día. Recordar de memoria a fin de mes es donde se pierde plata." },
      },
      {
        img: "profit-fijos", kicker: "PASO 3", title: "LOS FIJOS, UNA SOLA VEZ", lead: "Internet, seguro, expensas, alquiler: se registran solos cada mes.",
        marks: [["GASTOS FIJOS", "Los cargas una vez."], ["PROPIEDAD", "De una propiedad o compartido entre todas."], ["DÍA DEL MES", "Si el mes es más corto, se usa el último día."], ["AGREGAR", "Desde ese momento se registra solo."], ["TUS FIJOS", "La lista de lo que ya tienes programado."]],
        box: { type: "note", title: "Dos veces al año:", text: "revisa tus fijos. Es común seguir pagando servicios que ya no usas." },
      },
      {
        img: "profit-calculadora", kicker: "PASO 4", title: "CUÁNTO COBRAR POR NOCHE", lead: "La calculadora de tarifa con tus propios números.",
        marks: [["COSTOS FIJOS", "Lo que gastas cada mes, ocupes o no."], ["COMISIÓN", "El porcentaje que cobra la plataforma."], ["GANANCIA DESEADA", "Lo que quieres ganar al mes."], ["PRECIO MÍNIMO", "La tarifa por debajo de la cual no ganas."], ["NOCHES PARA NO PERDER", "Cuántas noches necesitas con tu precio actual."]],
        box: { type: "note", title: "Úsalo como piso:", text: "el precio mínimo te dice dónde dejas de ganar, no cuánto vale tu casa." },
      },
    ],
    phones: { kicker: "PASO 5", title: "TAMBIÉN EN TU CELULAR", lead: "Anota un gasto en el momento, desde donde estés.", imgs: ["m-profit-resumen", "m-profit-movimientos", "m-profit-calculadora"], captions: [["EL RESUMEN", "Tu ganancia, a una mano."], ["UN MOVIMIENTO", "Anota el gasto cuando lo haces."], ["LA TARIFA", "Calcula en cualquier lugar."]] },
    routine: {
      cards: [["CADA SEMANA", ["Carga los ingresos y los gastos.", "Mira el Resumen del mes en curso.", "Anota los gastos con la factura a la vista."]], ["CADA MES", ["Cambia a “Mes pasado” y revisa la ganancia.", "Compara el margen de cada propiedad.", "Exporta el CSV si trabajas con contador."]], ["CADA TRIMESTRE", ["Revisa tus costos fijos.", "Recalcula tu tarifa mínima.", "Mira qué propiedad rinde menos."]], ["AL FIN DEL AÑO", ["Cambia a “Este año”.", "Descarga todo para tu contador.", "Decide tarifas del año que viene."]]],
      phone: "m-profit-resumen", phoneTitle: "TUS NÚMEROS, SIEMPRE A MANO", phoneText: "El resumen se actualiza con cada movimiento que cargas.",
      included: ["Ingresos y gastos por propiedad", "Costos fijos que se repiten solos", "Gastos compartidos repartidos", "Resumen con comparación", "Margen por propiedad", "Calculadora de tarifa por noche", "Exportación a Excel (CSV)", "Ingresos automáticos desde Host", "Instalable en celular y computadora", "Tus datos, solo tuyos"],
    },
  },

  // =================================================================== OPERATIONS
  {
    id: "operations", name: "Operations", app: "operations", url: "https://stayflow-operations.vercel.app", accent: ["#F59E0B", "#FB7185"],
    cover: { lines: ["LIMPIEZA Y", "MANTENIMIENTO", "ORDENADOS"], sub: "Cada propiedad, siempre lista. Tu equipo trabaja desde el celular y tú lo ves al instante.", phones: ["m-operations-hoy", "m-operations-equipo", "m-operations-trabajos"] },
    flow: {
      lead: "Seis momentos que se encadenan solos. Tú solo asignas.",
      moments: [
        ["calendar", "1 · ENTRA LA RESERVA", "Con Host, cada estadía ya está en tu cuenta."],
        ["clipboard", "2 · APARECE EL TRABAJO", "La limpieza se crea sola, con su lista de pasos."],
        ["users", "3 · LO ASIGNAS", "Eliges quién lo hace con un toque."],
        ["phone", "4 · TU EQUIPO LO HACE", "Abre su enlace privado en el celular y tilda los pasos."],
        ["camera", "5 · FOTO DE EVIDENCIA", "Sube fotos del estado final, hasta 8 por trabajo."],
        ["eye", "6 · TÚ LO VES", "El avance y las fotos, al instante, en tu panel."],
      ],
      cards: [["operations-hoy", "TU DÍA", "Atrasados, para hoy y entradas el mismo día."], ["operations-equipo", "TU EQUIPO", "Un enlace privado por persona, sin cuentas."], ["m-operations-equipo", "SU CELULAR", "Pasos para tildar, foto y un botón para terminar."]],
      important: "Cada persona del equipo solo ve sus trabajos y el enlace se puede desactivar al instante. No necesitan crear cuenta ni instalar nada.",
    },
    steps: [
      {
        img: "operations-hoy", kicker: "PASO 1", title: "LO QUE HAY QUE HACER HOY", lead: "Los trabajos de hoy, mañana y esta semana, creados a partir de tus reservas.",
        marks: [["ATRASADOS", "Lo que debió hacerse y no se hizo."], ["ENTRADA EL MISMO DÍA", "Dónde hay poco margen entre una salida y la siguiente llegada."], ["TRABAJO DE LIMPIEZA", "Creado solo desde la reserva de Host."], ["SIN ASIGNAR", "Toca para elegir quién lo hace."], ["NUEVO TRABAJO", "Para arreglos, check-ins o lo que se te ocurra."]],
        box: { type: "note", title: "Mira primero:", text: "los trabajos con entrada el mismo día. Son los que no pueden fallar." },
      },
      {
        img: "operations-trabajos", kicker: "PASO 2", title: "TODOS TUS TRABAJOS", lead: "Crea trabajos con propiedad, tipo, fecha, responsable y lista de pasos.",
        marks: [["NUEVO TRABAJO", "Elige propiedad, tipo y fecha."], ["LISTA DE PASOS", "Una línea por paso; viene de tus Listas."], ["ABIERTOS / HECHOS", "Filtra por estado y por propiedad."], ["EL TRABAJO", "Ábrelo para ver los pasos, las fotos y asignarlo."], ["ASIGNAR A", "Elige a alguien de tu equipo."]],
        box: { type: "note", title: "Notas:", text: "en los trabajos delicados escribe una nota (“el huésped dejó una maleta, guárdala”). Tu equipo la ve antes de empezar." },
      },
      {
        img: "operations-checklists", kicker: "PASO 3", title: "LAS LISTAS DE TU EQUIPO", lead: "Una lista por tipo de trabajo y, si quieres, una distinta por propiedad.",
        marks: [["NUEVA LISTA", "Dale un nombre y elige el tipo."], ["PASOS", "Uno por línea, como instrucciones concretas."], ["GUARDAR", "Los trabajos nuevos la usan automáticamente."], ["TU LISTA", "Editar o eliminar cuando quieras."], ["SE USA EN", "Todas las propiedades o una en particular."]],
        box: { type: "list", title: "BUENO SABER", items: ["La lista de una propiedad gana sobre la general", "Sin listas propias se usa una de limpieza de 9 pasos", "Escribe “cambiar sábanas”, no “dejar lindo”"] },
      },
      {
        img: "operations-equipo", kicker: "PASO 4", title: "TU EQUIPO, SIN CUENTAS", lead: "Cada persona recibe un enlace privado que abre desde el celular.",
        marks: [["SUMAR AL EQUIPO", "Nombre y teléfono de cada persona."], ["TELÉFONO", "Con código de país, para enviar por WhatsApp."], ["AGREGAR PERSONA", "Se crea su enlace privado."], ["COPIAR ENLACE", "O envíalo directo por WhatsApp."], ["DESACTIVAR", "Corta el acceso al instante, sin borrar el historial."]],
        box: { type: "note", title: "Trátalo como una llave:", text: "quien tiene el enlace ve esos trabajos. Si se pierde un teléfono, desactiva a la persona." },
      },
      {
        img: "operations-mantenimiento", kicker: "PASO 5", title: "LO QUE SE REPITE CADA TANTO", lead: "Filtros del aire, extintores, desagües: aparecen solos cuando se acerca la fecha.",
        marks: [["MANTENIMIENTO", "Define lo que se repite."], ["CADA CUÁNTOS DÍAS", "Por ejemplo, cada 90 días."], ["PRIMERA VEZ", "La fecha desde la que empieza a contar."], ["AGREGAR", "Desde ahí aparece en tu día."], ["LO PROGRAMADO", "La lista de lo que ya tienes en marcha."]],
        box: { type: "note", title: "Empieza por lo que cuesta caro:", text: "extintores, caldera y desagües. Si fallan, el arreglo sale mucho más caro que la revisión." },
      },
    ],
    phoneBig: { kicker: "PASO 6", title: "LA VISTA DE TU EQUIPO", lead: "Una pantalla simple y grande para usar con una mano.", img: "m-operations-equipo", legend: [["TILDA CADA PASO", "El avance se ve en la barra y en tu panel."], ["AGREGAR FOTO", "Abre la cámara; hasta 8 fotos por trabajo."], ["TERMINÉ", "Marca el trabajo como hecho y tú lo ves al instante."]], box: { type: "note", title: "Pide una foto del estado final:", text: "resuelve discusiones sobre “estaba limpio” o “estaba roto” con un vistazo." } },
    routine: {
      cards: [["CADA MAÑANA", ["Abre “Hoy” y revisa los atrasados.", "Mira las entradas del mismo día.", "Confirma que todo tiene responsable."]], ["CUANDO ENTRA UNA RESERVA", ["El trabajo ya está creado.", "Asígnalo a alguien.", "Agrega una nota si hace falta."]], ["CADA SEMANA", ["Reparte el trabajo de la semana.", "Revisa las fotos de lo terminado.", "Ajusta tus listas."]], ["CADA MES", ["Revisa el mantenimiento que se acerca.", "Actualiza tus listas con lo aprendido.", "Revisa quién está activo en el equipo."]]],
      phone: "m-operations-hoy", phoneTitle: "TU DÍA, EN EL BOLSILLO", phoneText: "Los trabajos de hoy y los atrasados, siempre a mano.",
      included: ["Limpieza automática desde Host", "Aviso de entrada el mismo día", "Listas por tipo y por propiedad", "Equipo con enlace privado", "Foto de evidencia (hasta 8 por trabajo)", "Mantenimiento recurrente", "Notas por trabajo", "Trabajos manuales sin Host", "Instalable en celular y computadora", "Enlace desactivable al instante"],
    },
  },
];

module.exports = { guides };
