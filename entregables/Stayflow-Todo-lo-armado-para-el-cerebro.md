# Stayflow · Todo lo armado (resumen para el cerebro)

Fecha: 2026-11-13. Documento único con las notas nuevas y actualizadas del cerebro. Las mismas notas ya están en la carpeta `cerebro/` del repositorio y en el zip. Sin contraseñas, claves, códigos de licencia ni correos.


---

<!-- 09 Diario/2026-11-13.md -->
# 2026-11-13 (resumen de la sesión larga 12–13 nov)

## Qué se construyó
- **Categorías**: selector de 4 tipos (primero en el alta y siempre arriba del panel), módulos por perfil, cambio controlado → [[Host - Categorías y módulos]].
- **Panel sectorizado**: hotel agrega habitaciones por tipo y tarifa; hostel dormitorios con camas; cabañas en cantidad; vocabulario por categoría; tarifa sugerida en reservas.
- **Núcleo compartido**: huéspedes, estados e historial, libro de cobros, equipo/roles/auditoría, tareas con responsable, registro de mensajes, fichas por unidad, mantenimiento con costo → [[Host - Núcleo compartido]], [[Base de datos - migraciones]] (0024–0033).
- **Landing**: selector por categoría, pantallas reales, USD, contacto opcional, FAQ, packs 69/89, sin renovación.
- **PDF** "Lo que construimos" con capturas (`entregables/`).

## Decisiones
- Se elimina la renovación de USD 10/año (12 meses de actualizaciones incluidos, sin cargos).
- Packs: Esencial 69, Megapack 89 (precio propio de pack).
- Host a **38** por noviembre: propuesto, **pendiente** de fecha, cupo y cobro.
- Objetivo: **vender a otros países** → plataforma comerciante de registro (Whop) vs Impultienda: [[Pasarela de pago - decisión]].

## Bloqueos
1. **Cobro** (abrir cuenta, confirmar que paga a Argentina, IVA antes del 30-nov si es Whop).
2. **Vercel** plan gratuito: despliegues limitados; el panel con lo último no está publicado hasta que se libere/pague.
3. Revisión legal; datos de prueba `e2e-*` por borrar (con visto bueno).

## Próximo paso recomendado
Elegir pasarela → pegar el link en `NEXT_PUBLIC_HOST_CHECKOUT_URL` → redesplegar → primer cliente piloto. En producto: superadmin mínimo y estados de habitación/cambio de habitación en Hotels.

## Para el Inbox
- ¿Whop o Impultienda? ¿Cupo de 30 clientes? ¿Qué WhatsApp/correo de contacto mostrar?


---

<!-- 02 Productos/Host - Categorías y módulos.md -->
# Host por categorías (un sistema para todo tipo de alojamiento)

**Idea:** un solo Host, cuatro perfiles. La categoría es un **perfil del negocio** (no apps nuevas). Guest, Business y Operations siguen siendo complementos. Decisión en [[Decisiones]].

## Las cuatro categorías
| Categoría | Estado | Qué se reserva | Cómo se agrega |
|---|---|---|---|
| **Stayflow Rentals** | Disponible | Propiedades | Nombre + ciudad + foto |
| **Stayflow Hotels** | En desarrollo | Habitaciones | **Agregar habitaciones** en cantidad: tipo (Simple, Doble, Suite…) + tarifa por noche |
| **Stayflow Cabins & Resorts** | Próximamente | Cabañas | **Agregar cabañas** en cantidad ("Cabaña 1…N") |
| **Stayflow Hostels** | En desarrollo | Camas (o habitación privada) | **Dormitorios compartidos con sus camas** o habitaciones privadas, tarifa por cama/habitación; agregar camas a un dormitorio |

Lo honesto: solo Rentals está listo para vender. Hotels y Hostels ya tienen lo básico (unidades, reservas, recepción del día, limpieza por habitación, ADR); falta lo propio de cada rubro (ver "Falta").

## Cómo se elige y se cambia
- **Alta del negocio, paso 1 de 2:** lo primero es elegir el tipo de alojamiento (4 tarjetas con foto, descripción y funciones). Paso 2: nombre y moneda.
- **Barra "Tipo de alojamiento" arriba del panel**, siempre visible. Tocar otra categoría muestra qué módulos se activan/ocultan y confirma. **Los datos no se tocan.** Se bloquea si hay unidades que la nueva categoría no admite (p. ej. camas → hotel).
- **Banda de categoría** en el panel: números del día (ocupadas hoy, ocupación, llegadas/salidas, tarifa promedio por noche y por unidad disponible) y el botón "Agregar propiedades/cabañas/habitaciones/camas".

## Lo que cambia según la categoría
- **Vocabulario** en todo el panel (propiedad / cabaña / habitación / cama): menú, títulos, vacíos, formularios de reservas, cronograma, mantenimiento.
- **Menú:** Hotels y Hostels suman **Recepción** (llegadas, salidas y ocupación del día) y ocultan "Importar y sincronizar".
- **Reservas:** hotel/hostel/cabañas parten de origen "directo"; la tarifa de la unidad se ofrece como importe sugerido (noches × tarifa).
- **Primeros pasos:** en Hotel/Hostel no piden "subir foto" a una unidad.
- **Datos de ejemplo:** solo Rentals y Cabins.

## Cómo está hecho (técnico)
`organizations.lodging_type` (rental, hotel, cabins, hostel) · `lodging_profiles` (módulos por tipo) · `org_modules` (módulos activos) · `lodging_type_changes` (registro) · jerarquía `properties` → habitaciones → camas (`parent_id`, `unit_kind`, `room_category`, `base_rate_minor`). Un hotel/hostel crea solo su "establecimiento" con el nombre del negocio; la persona piensa en habitaciones y camas.

## Falta (por categoría)
- **Hotels:** estado de habitación (limpia/ocupada/mantenimiento), cambio de habitación, folio con consumos, cierre de caja, RevPAR completo, grupos, objetos perdidos.
- **Hostels:** grupos y coordinadores, actividades, lavandería, caja, tipo de dormitorio (mixto/femenino), RevPAB completo.
- **Cabins & Resorts:** servicios y experiencias reservables con cupos y horarios, personal, finanzas por servicio.
Plan completo: `docs/AUDITORIA-CATEGORIAS.md` en el repositorio.


---

<!-- 02 Productos/Host - Núcleo compartido.md -->
# Host · Núcleo compartido

Lo que comparten todas las categorías. Todo con pruebas SQL en producción (ver [[Base de datos - migraciones]]).

## Reservas
- **Estados:** Consulta (no bloquea fechas ni genera limpieza ni sale por iCal), Pendiente (bloquea fechas), Confirmada, Alojado, Finalizada, Cancelada.
- **Historial de cada reserva** (escrito por la base de datos): creación, estado, fechas, monto, unidad.
- **Libro de cobros:** cada cobro con medio (efectivo, transferencia, tarjeta, plataforma, otro), fecha y nota; devoluciones como cobros negativos; el total cobrado sigue siendo la suma del libro. Cambios manuales dejan un "Ajuste".
- Importar CSV de Airbnb/Booking, sincronizar iCal, bloqueos, cronograma de dos cuadraditos por día, entrada y salida el mismo día.

## Huéspedes
Ficha persistente: documento, preferencias, notas, etiquetas, VIP, incidencias; segmentos (VIP, frecuentes, con saldo, con incidencias).

## Equipo, roles y auditoría
- **Equipo:** invitar por enlace o borrador de correo (**no se envía nada automáticamente**; la persona entra con el mismo correo). Roles: Propietario, Administrador, Operador, Solo lectura. Solo el propietario invita administradores y cambia roles; el propietario no se puede quitar.
- **Registro de actividad:** invitaciones, ingresos/bajas, cambios de rol, reservas eliminadas, devoluciones.
- La tabla de membresías ya no se escribe desde el navegador (se cerró un camino de escalada de privilegios).
- **Pendiente:** ocultar botones según el rol en pantalla (la base ya rechaza lo no permitido); matriz de permisos por módulo.

## Tareas y mensajes
Tareas con **responsable** (solo gente del equipo) y **prioridad**, filtro "solo mis tareas". Los mensajes preparados (WhatsApp/correo/copia) quedan **registrados** en el historial de la reserva (queda anotado que se preparó, no que se recibió).

## Rentals completo
- **Fichas por unidad:** capacidad, dormitorios, camas, baños, 12 comodidades, horarios, normas y **notas de acceso privadas** (tabla aparte; solo el equipo).
- **Mantenimiento:** incidencias con prioridad, responsable y costo; "Enviar a Profit/Business" crea el gasto de mantenimiento **una sola vez**.
- Falta: automatizaciones programadas reales.

## Relación con otras apps
[[Stayflow Guest]] (guía/QR/check-in, EN/PT) · [[Stayflow Business]] (ingresos automáticos al terminar la estadía; gastos desde mantenimiento) · [[Stayflow Operations]] (limpieza con checklist y foto).


---

<!-- 04 Marketing/Landing - cambios 2026-11-13.md -->
# Landing · cambios del 2026-11-13

- **Selector de categoría en el hero** (Rentals, Hotels, Cabins & Resorts, Hostels): cada una cambia titular, bajada y tres beneficios. Rentals mantiene el botón de compra; las otras muestran estado honesto ("En desarrollo"/"Próximamente") y **"Avísame cuando esté listo"** (guarda el correo con la categoría: así se mide qué construir primero).
- **Nueva sección "Lo que ordena cada día"** con capturas reales de Host: cobros e historial, fichas, mantenimiento (con envío a Business) y equipo con roles. Correos de prueba tapados.
- **Ejemplos en USD** (antes mostraba euros con precios en dólares).
- **Contacto opcional:** botón "Escríbenos" (header, hero de categorías no disponibles y cierre) que aparece solo si hay `NEXT_PUBLIC_WHATSAPP` o `NEXT_PUBLIC_CONTACT_EMAIL`. Sin datos, no se ve nada.
- **FAQ nueva:** "¿Sirve para hoteles, hostels o cabañas?" con la respuesta honesta.
- **Precios:** sin renovación; Pack Esencial **USD 69** y Megapack **USD 89** con precio propio (ahorras 35 y 44); otras combinaciones siguen con 30%.
- **Botón de compra de Host** puede ir directo a un checkout externo (`NEXT_PUBLIC_HOST_CHECKOUT_URL`) → [[Pasarela de pago - decisión]].

## Qué falta
Video de recorrido de 60–90 s (puedo preparar el guion), testimonios reales (no se inventan), versión en inglés/portugués, WhatsApp/correo reales, precio de lanzamiento de Host (38) en la página.
## Diagnóstico previo (para no olvidar)
Vendía solo "Airbnb"; no mostraba lo nuevo; moneda inconsistente; poca prueba social; un solo camino (comprar); contacto invisible.


---

<!-- 05 Ventas/Pasarela de pago - decisión.md -->
# Pasarela de pago · decisión

**Objetivo:** vender a **otros países** (España y Latinoamérica primero). Eso favorece una plataforma que actúe como **comerciante de registro** (cobra y resuelve el IVA/GST por país).

## Opciones evaluadas
| Opción | Qué hace bien | A verificar / riesgo |
|---|---|---|
| **Whop** | Comerciante de registro (impuestos por país del comprador), 100+ medios de pago, 195 países, claves de licencia, API y webhooks | Si **paga a Argentina**; comisiones exactas (los blogs no coinciden); responder la pregunta de IVA **antes del 30-nov-2026** o pueden pausar pagos desde el 1-dic |
| **Impultienda** (impultienda.ar, checkout "Multidivisa" base USD) | Argentina, rápido de armar, ARS (Mercado Pago) y USD (Stripe/PayPal) | Impuestos de ventas al exterior a tu cargo (probablemente no es comerciante de registro); entrega de productos digitales y webhook **no verificados** |
| Mercado Pago (Checkout Pro) | Mejor conversión en Argentina/Latinoamérica | Cobra en pesos para cuenta argentina; no cubre bien España |
| Lemon Squeezy / Paddle | Comerciante de registro | LS integrándose a Stripe; lista de países de Paddle no verificada |
| Stripe directo | — | No verificado para comercios argentinos |

## Cómo se conecta (sin programar)
1. En la plataforma: crear el producto **Stayflow Host**, pago único, USD (49 o 38 de lanzamiento), mensaje posterior a la compra, y copiar el **link del checkout**.
2. En Vercel → proyecto `stayflow-web` → Environment Variables: `NEXT_PUBLIC_HOST_CHECKOUT_URL` = ese link → redesplegar.
3. Los botones "Conseguir Host" de la landing (principal, cierre y flotante) van directo al checkout. Sin variable, siguen abriendo el carrito con captura de correo.
4. **Entrega:** por ahora **manual** (crear el código con `create_license_codes` y enviarlo con la plantilla [[Correo de entrega]]). Ver [[Entrega de licencias]].

## Etapa 2 (automática, 1–2 días)
Webhook de la plataforma → endpoint de la landing que valida la firma, evita procesar dos veces el mismo pago, crea el código y envía el correo; reembolso → revocar el código. Secretos solo como variables de entorno en Vercel; **nunca** en el chat ni en el repositorio.

## Pendiente del dueño
- Elegir plataforma y abrir la cuenta; confirmar que paga a Argentina; contestar la pregunta de IVA.
- Cómo facturar (con contador). Servicio de correo (p. ej. Resend) para la entrega automática.
Ver [[Cobro y licencias]] y [[Legal y cumplimiento]].


---

<!-- 06 Operaciones/Base de datos - migraciones.md -->
# Base de datos · migraciones y pruebas (sin secretos)

Proyecto Supabase único, región **us-east-1** `[VERIFICAR por privacidad en la UE/Brasil]`. Todas las tablas con RLS. Las pruebas SQL se corren dentro de una transacción que se revierte sola (`supabase/tests/*.sql`); éxito = mensaje "ALL n … PASSED".

| Migración | Qué hace |
|---|---|
| 0001–0023 | Núcleo, finanzas, licencias, Host, Guest, Operations, leads, cuenta, códigos de licencia (0022) y emisión/revocación (0023) |
| 0024–0025 | Tipos de alojamiento (hotel/hostel), jerarquía de unidades; sin limpieza por cama (rama integrada) |
| 0026 | Categoría `cabins` |
| 0027 | Módulos por organización (`org_modules`) y cambio controlado de categoría |
| 0028 | Ficha de huéspedes (`guest_profiles`, `guest_events`) |
| 0029–0030 | Estados Consulta/Pendiente; la consulta no bloquea fechas; historial de reservas (`booking_events`) |
| 0031 | Libro de cobros (`booking_payments`) |
| 0032 | Equipo (`team_invites`), registro (`audit_log`), tareas con responsable/prioridad, registro de mensajes (`booking_messages`); se cierra la escritura directa de `memberships` |
| 0033 | Ficha por unidad (`property_details`, privada) e incidencias con costo (`property_incidents`) |

**Pruebas SQL nuevas:** lodging 14 · org_modules 16 · guest_profiles 14 · booking_history 8 · booking_payments 7 · team 12 · property_incidents 8 (más las anteriores de licencias, aislamiento, etc.).
**Tests de código:** licencias 11, dinero 2, i18n 7, Guest 17, Operations 12, Host 85, Business 28, landing 25.

## Notas
- Datos de prueba `e2e-*` (cuentas, negocios y códigos usados) siguen en producción: **borrar con visto bueno** antes de clientes reales.
- Plan de Supabase: confirmar plan de pago y respaldos antes de vender `[VERIFICAR]`.


---

<!-- 01 Negocio/Precios y ofertas.md -->
# Precios y ofertas

| Producto | USD | Estado |
|---|---|---|
| [[Stayflow Host]] | 49 | A la venta |
| [[Stayflow Guest]] | 25 | A la venta |
| [[Stayflow Business]] | 30 | A la venta |
| [[Stayflow Operations]] | 29 | A la venta |
| AI / Listing / Academy / Experiences / Website | 29 / 19 / 19 / 29 / 39 (previstos) | [[Próximamente]] |
| Host Launch Kit | 159 (previsto) | No existe |

**Regla Multi-Pack:** desde la 2.ª app, 30% sobre el subtotal de apps.
**Packs:** Esencial (Host+Guest+Business) = **69**. Megapack Anfitrión Premium (todas las apps a la venta; hoy 4) = **89**.
**Soporte opcional (mensual, por herramienta):** Host 9 · Guest 9 · Business 5 · Operations 7 `[VERIFICAR]`.
**Actualizaciones:** 12 meses incluidos; **sin renovación** (decisión 2026-11-13). La app sigue funcionando igual después.

## Lanzamiento de Host (propuesto, pendiente)
Host **USD 38** por noviembre (precio de lanzamiento, 49 tachado), con cierre real el 30-nov 23:59 (hora Argentina) y, opcionalmente, cupo de 30 clientes. Solo Host; los packs no se rebajan más (no apilar descuentos). **No implementado en la landing todavía**: falta confirmar fecha, cupo y medio de cobro. Pasos: [[Pasarela de pago - decisión]].
**Criterios del test:** tratar a los primeros 10–30 compradores como piloto, pedir feedback y permiso para citarlos, preguntarles cuánto habrían pagado; volver a 49 el 1-dic.

## Promoción de packs (hecha, apagada)
Esencial 65 / Megapack 85 con **cierre real**. Se enciende con la variable `NEXT_PUBLIC_PROMO_ENDS_AT` (fecha con huso horario) y se apaga sola.
**Reglas:** una sola vez, sin reiniciar por visitante, sin "solo por hoy" repetido, no encenderla hasta que el cobro funcione, y validar el precio **en el servidor** cuando exista el cobro. Ver [[Cobro y licencias]].

## Preguntas abiertas
- ¿El Megapack incluye las apps futuras?
- ¿Qué cubre exactamente el soporte y en qué plazo responde?


---

<!-- 06 Operaciones/Roadmap.md -->
# Roadmap

## Ahora (para poder vender)
1. **Cobro + activación de licencias** + página de gracias + emails ([[Cobro y licencias]])
2. Datos para Meta: ID del Píxel, dominio, email de contacto
3. Borrar datos de prueba de producción

## Estado al 2026-11-13
Hecho: categorías, núcleo compartido, Rentals completo, landing por categoría. Bloqueo: **cobro** ([[Pasarela de pago - decisión]]) y **límite de despliegues de Vercel** ([[Infraestructura]]).

## Después (para convertir)
4. Landing de anuncio `/l/host` (una oferta) + video de Host
5. Prueba social real (primeros clientes con permiso)
6. Revisión legal; dominio propio

## Luego (para durar)
7. Instaladores firmados (Windows/Mac) · botón "Instalar en mi computadora" visible
8. Integración continua, monitoreo de errores, pruebas en celulares reales
9. (Eliminado) Renovación de actualizaciones: ya no existe
10. Idiomas EN/PT · equipo con varios usuarios · apps "Próximamente" según demanda

Detalle técnico en [[Backlog técnico]].

## Categorías (brief "Stayflow por categorías")
Plan completo y estado en `docs/AUDITORIA-CATEGORIAS.md`. Hechas: etapas 0, 2, 3 completa (huéspedes, estados e historial, cobros, equipo/roles/auditoría, tareas, mensajes) y 4 parcial (fichas e incidencias). Siguiente: superadmin mínimo, Hostels, Hotels (estado y cambio de habitación, folio), Cabins (servicios); luego endurecimiento multi-tenant y CI. Ver [[Host - Categorías y módulos]].


---

<!-- 06 Operaciones/Backlog técnico.md -->
# Backlog técnico

## Cobro y licencias
- [ ] Webhook de pago → crear licencia · [ ] Validar precio promo en servidor · [ ] `updates_until` separado del acceso (la app nunca se bloquea)

## Calidad
- [ ] CI que corra tests y pruebas de navegador (hoy los scripts e2e no están versionados)
- [ ] Monitoreo de errores · respaldos verificados · tipos de base generados
- [ ] Prueba en celulares reales, Safari y Firefox · accesibilidad · velocidad

## Hecho el 2026-11-12
- [x] Host: importar reservas desde CSV de Airbnb/Booking (nombres, importes, historial; no duplica)
- [x] Host → Business: la estadía terminada se vuelve ingreso sola (migración 0019)
- [x] Host: interruptor del resumen diario por email (el envío sigue necesitando Resend)
- [x] Operations: foto de evidencia desde el enlace del equipo (migración 0020, bucket privado)
- [x] Guest: guía en inglés y portugués (migración 0021)

## Producto
- Host: importar archivo de Airbnb/Booking · multiusuario con permisos · aviso diario por email (falta configurar claves)
- Operations: foto de evidencia · aviso al equipo · regenerar enlace del equipo
- Guest: guía en otros idiomas · avisar al anfitrión que abrieron la guía
- Business: ingresos automáticos desde cobros de Host
- Todas: idiomas EN/PT · instaladores

## Higiene
- [ ] Borrar usuarios y datos `e2e-*` de producción (con visto bueno)

## Hecho el 2026-11-12/13
- [x] Etapa 0–3 del plan de categorías: selector de 4 categorías, módulos por perfil, ficha de huéspedes, estados de reserva + historial, libro de cobros, equipo/roles/auditoría, tareas con responsable, registro de mensajes (migraciones 0024–0032)
- [x] Rentals: fichas por unidad e incidencias con costo (0033)
- [x] Panel sectorizado por categoría: hoteles agregan habitaciones por tipo y tarifa; hostels dormitorios con camas; cabañas en cantidad; vocabulario y tarifa sugerida
- [x] Barra de categorías arriba del panel y alta en dos pasos (categoría primero)
- [x] Landing: selector de categoría en el hero, sección con pantallas reales, ejemplos en USD, contacto opcional, FAQ por categoría, packs 69/89, sin renovación, link de checkout externo

## Siguiente
- [ ] Hotels: estado de habitación, cambio de habitación, folio con consumos, cierre de caja
- [ ] Hostels: grupos, actividades, lavandería, caja, tipo de dormitorio
- [ ] Cabins: servicios y experiencias reservables
- [ ] Ocultar botones según el rol; matriz de permisos por módulo; notificaciones de tareas
- [ ] Superadmin mínimo (clientes, códigos, métricas, auditoría de accesos)
- [ ] Landing en inglés y portugués (y panel de Host traducido) para vender fuera del mundo hispano
- [ ] Webhook de pago → licencia → correo (tras elegir plataforma)
- [ ] Automatizaciones programadas reales; CI y e2e versionados; captcha en el registro


---

<!-- 01 Negocio/Riesgos.md -->
# Registro de riesgos

| Riesgo | Gravedad | Mitigación | Dueño |
|---|---|---|---|
| No hay cobro ni activación de licencias | **Crítico** | [[Cobro y licencias]] | Dueño + Claude |
| Prueba de 14 días contradice "pago único" | Alto | Definir qué pasa al pagar | Dueño |
| Páginas legales sin revisión de abogado | Alto | [[Legal y cumplimiento]] | Dueño |
| Sin prueba social real | Alto | Primeros clientes con permiso; video de Host | Dueño |
| Datos de prueba (`e2e-*`) en producción | Medio | Borrarlos antes de clientes reales | Claude (con visto bueno) |
| Costo de IA sin tope por plan | Medio | Tope diario por negocio (ya existe) | Claude |
| Soporte sin proceso | Medio | [[Soporte - respuestas rápidas]] | Dueño |
| Sin monitoreo de errores ni respaldos verificados | Medio | [[Backlog técnico]] | Claude |
| Urgencia falsa en anuncios | Alto | Solo promociones con cierre real | Todos |
| Promesas ("de por vida", garantías) | Medio | Políticas ya cambiadas; revisar con abogado | Dueño |
| Vercel plan gratuito bloquea despliegues (100/día) | Alto | Plan de pago o esperar; desplegar menos veces | Dueño |
| Hotels/Hostels/Cabins comunicados como listos sin estarlo | Alto | Estados honestos en landing y panel; vender solo Rentals hoy | Todos |
| Venta internacional sin revisión legal (UE, Brasil; datos en us-east-1) | Alto | Revisión legal corta antes de pauta paga; comerciante de registro | Dueño |
| Pasarela que no paga a Argentina o sin entrega automática | Crítico | [[Pasarela de pago - decisión]] | Dueño |
| Roles sin ocultar botones en pantalla | Bajo | La base rechaza lo no permitido; ocultar en la interfaz | Claude |


---

<!-- 06 Operaciones/Infraestructura.md -->
# Infraestructura (sin secretos)

**Código:** monorepo pnpm, Next.js 15 + React 19 + TypeScript + Tailwind, Supabase (Postgres, Auth, Storage, RLS), Vercel (un proyecto por app). Ramas: despliegue automático al subir.

| Pieza | Dirección |
|---|---|
| Landing | https://stayflow-web-livid.vercel.app |
| Host | https://stayflow-host.vercel.app |
| Guest | https://stayflow-guest-eight.vercel.app |
| Business | https://stayflow-profit.vercel.app |
| Operations | https://stayflow-operations.vercel.app |

**Base de datos:** un solo proyecto para todos los clientes y apps (cada negocio separado por RLS). Migraciones `0001…0033` → [[Base de datos - migraciones]]; pruebas SQL en `supabase/tests`.
**Variables de entorno (solo nombres):** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_META_PIXEL_ID`, `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_WHATSAPP` (opcional: activa el botón "Escríbenos"), `NEXT_PUBLIC_HOST_CHECKOUT_URL` (link del checkout externo), `NEXT_PUBLIC_PROMO_ENDS_AT`, `ANTHROPIC_API_KEY`, `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `DIGEST_FROM`.
**Plan de Supabase:** comprobar que sea de pago antes de vender (el gratuito pausa proyectos inactivos y no da respaldos diarios) `[VERIFICAR]`.
**Costo:** crece con usuarios activos, fotos y uso de IA; no hay que "ampliar la base" cada vez.
Dossier técnico completo: `docs/AUDITORIA-CHATGPT.md` en el repositorio.

## Vercel: límite de despliegues
El plan gratuito permite ~100 despliegues por día. Se alcanzó el 2026-11-12: los commits nuevos del panel de Host quedaron sin publicar y la API devolvió "payment_required" (reintento a las 24 h). La landing sí se publicó. Opciones: esperar el reinicio o pasar a un plan de pago (recomendado antes de lanzar). Despliegue manual: redeploy del último despliegue de producción con "último commit".
Rama de producción: `claude/quirky-albattani-cthzld`.
