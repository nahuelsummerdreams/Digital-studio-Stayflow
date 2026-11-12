# STAYFLOW · Dossier para auditoría externa

> Pegar todo este documento en ChatGPT. Está escrito para que alguien que no vio el proyecto pueda auditarlo.
> Estado al: noviembre de 2026. Todo lo que dice "verificado" lo comprobé ejecutándolo; lo que dice "NO verificado" no se probó con servicios reales.

---

## 0. Instrucciones para ChatGPT (léelas primero)

Actúa como un panel de auditores independientes, honesto y sin complacencia:

1. **Auditor de producto y estrategia** (¿se puede vender esto? ¿a quién? ¿con qué precio?).
2. **Auditor de conversión y marketing digital** (landing, embudo, anuncios en Meta).
3. **Ingeniero senior full-stack** (arquitectura, calidad de código, mantenibilidad).
4. **Auditor de seguridad y privacidad** (Postgres/RLS, auth, endpoints, datos personales, RGPD/LATAM).
5. **Auditor legal/comercial** (términos, reembolsos, impuestos de venta digital, garantías prometidas).

Reglas:
- No me halagues. Si algo está mal o es riesgoso, dilo y explica por qué.
- Separa **hechos** (lo que dice este documento) de **suposiciones tuyas**. Si no tienes datos para opinar, pídelos en vez de inventar.
- No puedes ver el código a menos que yo lo pegue. Cuando necesites un archivo, dime exactamente cuál (la sección 13 lista los clave).
- Prioriza: qué debo arreglar **antes de cobrar el primer dólar**, qué **antes de invertir en anuncios**, y qué puede esperar.

**Formato de respuesta que quiero:**
1. Veredicto en 5 líneas: ¿está listo para vender? ¿qué lo impide?
2. Tabla de hallazgos: `Severidad (Crítico/Alto/Medio/Bajo) | Área | Hallazgo | Por qué importa | Cómo arreglarlo | Esfuerzo (S/M/L)`.
3. Lo que está bien hecho (para no tocarlo).
4. Las 10 acciones más importantes, en orden.
5. Preguntas que necesitas que yo responda.

---

## 1. Qué es Stayflow

**Stayflow** es un ecosistema de aplicaciones web (PWA instalables) para **anfitriones de alquiler temporal** (Airbnb, Booking, VRBO, directo). Lo produce **Digital Studio** (el sello de la productora aparece junto a la marca en todas partes). Idioma principal: **español** (tuteo neutro; algunos textos pegados por el dueño usan voseo, hay una mezcla que hay que unificar).

**Modelo comercial decidido:**
- Cada app se vende **por separado, con pago único** (no suscripción), con **12 meses de actualizaciones incluidas**; después la app sigue funcionando igual y se puede **renovar cuando el cliente quiera por USD 10 al año** (opcional). *El mecanismo técnico que distingue "con actualizaciones" de "sin actualizaciones" aún NO está construido.*
- **Multi-Pack:** 30% de descuento sobre el subtotal de apps cuando el carrito tiene 2 o más apps.
- **Soporte mensual opcional**, elegido por herramienta (precios provisionales).
- Se vende **solo lo que ya existe**. Lo que no existe se muestra como "Próximamente" con un formulario "Avísame cuando salga" (también sirve para medir demanda).
- Pensado para venderse con **anuncios de Meta (Facebook/Instagram)** y, más adelante, con instaladores de escritorio (Windows/Mac).
- El cobro **todavía no está conectado** (ver sección 10). Hoy el botón de compra termina en un formulario de email.

Público: anfitriones individuales o pequeños administradores. Dolor central de la landing: "¿Tu Airbnb te está consumiendo más tiempo del que debería?" (mensajes, instrucciones repetidas, limpieza, gastos, información repartida).

---

## 2. Estado del ecosistema

| Producto | Estado | Precio (USD, pago único) |
|---|---|---|
| **Stayflow Host** | Construido y desplegado | 49 |
| **Stayflow Guest** | Construido y desplegado | 25 |
| **Stayflow Business** (antes "Profit") | Construido y desplegado | 30 |
| **Stayflow Operations** | Construido y desplegado (el más reciente) | 29 |
| Stayflow AI | No existe → "Próximamente" | (29 previsto) |
| Stayflow Listing | No existe → "Próximamente" | (19 previsto) |
| Stayflow Academy | No existe → "Próximamente" | (19 previsto) |
| Stayflow Experiences | No existe → "Próximamente" | (29 previsto) |
| Stayflow Website | No existe → "Próximamente" | (39 previsto) |
| Host Launch Kit (recursos descargables) | No existe → retirado de la venta | (159 previsto) |

**Packs en venta:**
- **Pack Esencial** = Host + Guest + Business → 104 sumado → **USD 72,80** con el 30%.
- **Megapack Anfitrión Premium** = *todas las apps a la venta* (hoy 4: Host, Guest, Business, Operations) → 133 → **USD 93,10**. La definición es dinámica: cuando salga una app nueva entra sola al pack (decisión de negocio **pendiente**: ¿quien lo compra hoy recibe las futuras apps?).
- Existe además un asistente de IA **dentro de Host** (ver 4.1), que no es el producto "Stayflow AI".

---

## 3. La landing comercial (apps/web)

Sitio estático/SSR en Next.js. Tema oscuro con acentos neón, efectos (aurora, grano, tilt 3D, cursor glow, barra de progreso, confeti al desbloquear el descuento), respeta `prefers-reduced-motion`.

**Estructura de la home (en orden):**
1. Portada: titular de dolor, chips de dolores, pantalla animada de ejemplo (panel "Buenos días Lucía" con notificaciones), botón principal **"Conseguirlo por USD 49"** (agrega Host al carrito y abre el carrito) y botón secundario "Ver todas las herramientas".
2. Franja de 4 tarjetas con números (0 dobles reservas · 1 panel para todo · USD 49 y Host es tuyo · −30% al combinar) + sellos (12 meses de actualizaciones · Se instala como app · Garantía de 14 días · Soporte opcional).
3. Ticker, sección "El problema" (antes/después) y bloques de funciones con mockups de las pantallas reales.
4. **Las 4 herramientas a la venta**: cada una con caja 3D, pregunta de dolor, "Para qué sirve", 3 beneficios, precio, botón "Agregar al carrito", enlace "Ver más".
5. **Packs** (Esencial y Megapack).
6. **La repisa**: las cajas de las 4 apps en una repisa; se arrastran (o se tocan) hasta "Tu pack"; un "ticket" calcula en vivo subtotal, descuento del 30% y total; sugerencias upsell/downsell.
7. **Soporte opcional** (selector por herramienta, total mensual; hoy termina en "Avísame").
8. **Próximamente**: 5 tarjetas (AI, Listing, Academy, Experiences, Website) con "Avísame cuando salga".
9. Cómo empieza, preguntas frecuentes, llamada final, pie con enlaces legales y botón de cookies.

**Otras páginas:** `/products/[slug]` (ficha de cada producto; las de "Próximamente" no muestran precio ni carrito), `/checkout` (resumen + formulario de email), `/l/host`, `/l/guest`, `/l/profit` (landings para anuncios, más cortas, `noindex`), `/privacidad`, `/terminos`, `/reembolsos`, `sitemap.xml`, `robots.txt`.

**Carrito:** vive en `localStorage` (sin cuenta). Se limpia solo de productos que ya no se venden. Toda la matemática de precios está en un único módulo puro (`lib/pricing.ts`) con tests.

**Medición (preparada, apagada):**
- Píxel de Meta: **solo se carga si** existe `NEXT_PUBLIC_META_PIXEL_ID` **y** el visitante acepta cookies (banner de consentimiento).
- Eventos mapeados: ver producto → ViewContent, agregar → AddToCart, iniciar pedido → InitiateCheckout, dejar email → Lead (con `eventID` para deduplicar con la API de Conversiones a futuro; esa API **no está implementada**).
- Atribución: primera visita guarda `utm_*` y `fbclid` en `localStorage` y se adjunta a cada email capturado.
- Falta: el ID real del Píxel, verificación de dominio en Meta, API de Conversiones.

**Leads:** tabla `leads` en Postgres; el navegador solo puede insertar (anon), nunca leer. Orígenes permitidos por una restricción: `checkout`, `support`, `ad-<producto>`, `notify-<producto>`. Hay un campo trampa anti-bots.

**Afirmaciones públicas que hay que auditar** (las puse yo, sin confirmar con un abogado): "Garantía de 14 días", "12 meses de actualizaciones, renovación opcional por USD 10/año", "Se instala como app", "0 dobles reservas" (cierto en Host a nivel base de datos), "Pago único", precios en USD "impuestos aparte".

---

## 4. Las aplicaciones (qué hace cada una)

### 4.1 Stayflow Host — reservas y operación diaria
- **Reservas:** alta/edición/cancelación/borrado; flujo llegada → salida; fuente (Airbnb, Booking, VRBO, directo, otro); importe; **cobrado** (seña/pago completo) con estado "falta X"; notas; huésped (email/teléfono).
- **Cronograma** (la pantalla estrella): mes completo, una fila por propiedad con foto y barra de ocupación, **dos "cuadraditos" por día** (entrada = segunda mitad, después del mediodía; salida = primera mitad). Una estadía 9→15 ocupa la 2ª mitad del 9 hasta la 1ª mitad del 15, y la 2ª mitad del 15 queda libre para el siguiente (cambio de huéspedes marcado con ⇄). Barras en diagonal, hoy marcado, fines de semana sombreados, columna de nombres fija, 4 tarjetas resumen. Clic en un día libre → nueva reserva o **bloquear fechas**.
- **Bloqueos** (mantenimiento/uso propio): ocupan fechas pero no cuentan en ocupación ni ingresos; la base de datos impide reservar encima.
- **Panel "Tu día":** llegan hoy, salen hoy, llegan mañana, tareas de hoy y vencidas, "por cobrar antes de la llegada", total por cobrar; KPIs (ocupación, ingresos por mes de llegada, llegadas a 7 días, tareas), gráficos por mes y canal, agenda.
- **Tareas:** manuales y **automáticas**: al crear una reserva se crea la tarea "Limpieza tras la salida de X" (trigger SQL), que sigue los cambios de fecha y desaparece si se cancela.
- **Huéspedes:** directorio derivado de las reservas.
- **Mensajes:** 4 plantillas editables (bienvenida, antes de llegar, recordatorio de salida, gracias/reseña) con variables ({nombre}, {propiedad}, {entrada}, {salida}, {noches}, {huespedes}, {guia}); copiar, abrir WhatsApp o email; el enlace de la guía sale del producto Guest si está publicada.
- **Reportes:** resumen mensual por propiedad (reservas, noches, ocupación, facturado, cobrado, por cobrar, precio medio por noche, estadía media); botón "imprimir / guardar PDF" (CSS de impresión).
- **Sincronizar calendarios (iCal):** por propiedad se pega la URL iCal de Airbnb/Booking/VRBO → importa reservas y bloqueos (solo toca lo importado; cancela lo que desaparece del feed y no empezó; las que cruzan con reservas propias se omiten y se avisa). Además publica **un feed iCal propio** (`/api/ical/<token>.ics`, solo fechas, sin nombres ni importes) para pegarlo en las otras plataformas. Se sincroniza al abrir la app (si pasaron >30 min) y con un botón. *Limitación de Airbnb: el iCal no trae nombre del huésped ni importe.*
- **Aviso diario por email** ("tu día"): endpoint cron implementado, **apagado** hasta configurar claves.
- **Primeros pasos** (4 pasos que se marcan solos) y **datos de ejemplo** (2 propiedades de muestra, se borran con un clic).
- **Fotos de propiedades** (subida, reducción a 1600 px JPEG, bucket público).
- **Asistente de IA (chat flotante):** solo lectura; consulta sus datos con herramientas (propiedades, reservas, fechas libres, llegadas/salidas, tareas, resumen del mes); consume un **tope diario por organización** (40 por defecto); la clave del modelo vive solo en el servidor; consulta a Postgres **con el token del propio usuario** (RLS decide qué ve).
- Puente con Business: "Registrar como ingreso" una reserva (una sola vez).

### 4.2 Stayflow Guest — guía digital para huéspedes
Guías por propiedad (bienvenida, Wi-Fi, check-in/out, reglas, seguridad, contacto del anfitrión, ítems de recomendaciones por categoría), con **enlace público y QR** (`/g/<slug>`, slug aleatorio de 12 caracteres, rotable). El huésped no necesita cuenta ni app. Función SQL pública `get_public_guide(slug)` devuelve solo guías publicadas.

### 4.3 Stayflow Business (antes Profit) — rentabilidad
Ingresos y gastos por propiedad, categorías, **costos fijos recurrentes** (se cargan solos cada mes), gastos compartidos repartidos por partes iguales, resumen mensual con comparación contra el mes anterior, rentabilidad por propiedad, **calculadora de tarifa por noche** (costos fijos + ganancia deseada + comisión de plataforma), y **exportación a CSV para Excel** (separador `;`, coma decimal, BOM UTF-8, gastos en negativo, protección contra inyección de fórmulas).

### 4.4 Stayflow Operations — limpieza, mantenimiento, equipo
- **Trabajos** (limpieza, mantenimiento, check-in, otros) por propiedad con fecha, estado (pendiente → en curso → hecho), responsable, **checklist** con avance, notas.
- **Limpiezas automáticas** desde las reservas de Host (función SQL `ops_sync_bookings`, idempotente, funciona aunque el negocio no tenga licencia de Host): siguen cambios de fecha y cancelaciones; guardan **cuándo entra el siguiente huésped**; "entra otro huésped hoy" se marca ámbar y va primero.
- **Listas (checklists):** estándar de 9 pasos; editables por negocio o por propiedad.
- **Equipo sin cuentas:** cada persona tiene un **enlace privado** `/t/<token>` (compartible por WhatsApp); desde el celular ve solo sus trabajos, tilda pasos y toca "Terminé". La base de datos solo permite a ese token leer/actualizar **sus** trabajos (funciones `ops_staff_jobs`, `ops_staff_update`, `ops_staff_info`; solo puede cambiar estado y casillas, no textos).
- **Mantenimiento recurrente** ("filtros del aire cada 90 días"): una semana antes se convierte en trabajo.
- Pantalla "Hoy" (atrasados, hoy, mañana, semana).

### 4.5 Funciones transversales (todas las apps)
- **Una sola cuenta** (Supabase Auth, email + contraseña) para todas las apps. Registro, inicio de sesión, **recuperar contraseña** (flujo por email), **cambiar contraseña** y **eliminar cuenta** (RPC `delete_my_account`: borra la cuenta y los negocios que son solo suyos; si comparte negocio, se niega con mensaje).
- Onboarding: crear negocio (nombre, moneda) → **prueba gratis de 14 días por app** (sin tarjeta) → app.
- Menú lateral en escritorio, pestañas en móvil, buscador ⌘/Ctrl+K, campana de alertas, selector de tema (3 acentos), PWA con service worker.

---

## 5. Arquitectura técnica

**Monorepo pnpm** (36 commits, ~16.000 líneas TS/TSX sin contar SQL):
```
apps/
  web/         landing comercial (puerto 3000)
  profit/      Stayflow Business (3001)  ← el nombre de carpeta/ids internos sigue siendo "profit"
  guest/       Stayflow Guest (3002) + página pública /g/<slug>
  host/        Stayflow Host (3003) + rutas API
  operations/  Stayflow Operations (3004) + página pública /t/<token>
packages/
  ui/ shell/ auth/ i18n/ licensing/ money/
  modules/ host/ profit/ guest/ operations/   ← la lógica y las pantallas de cada producto
supabase/migrations/0001…0018   supabase/tests/*.sql (9 archivos)
```
**Stack:** Next.js 15, React 19, TypeScript 5.6, Tailwind 3, Supabase (Postgres + Auth + Storage + RLS), Vitest, Playwright (pruebas manuales/e2e en scripts locales, no versionados). Hosting en **Vercel**: un proyecto por app, enlazados a Git; cada push a la rama principal de despliegue publica las 5 apps. Sin dominio propio todavía (`*.vercel.app`).

**Patrón:** cada producto = paquete `modules/<x>` (lógica pura testeable + pantallas React) + app Next delgada que lo monta dentro del `AppShell` compartido (login → crear negocio → licencia/prueba → app).

**Rutas API del servidor (Host):**
- `POST /api/assistant` — chat de IA (requiere `ANTHROPIC_API_KEY`; usa el JWT del usuario; tope diario vía RPC).
- `GET /api/ical/[token]` — feed iCal público (solo fechas).
- `POST /api/ical/sync` — descarga calendarios (con defensa SSRF: solo https, sin puerto, resuelve DNS y rechaza IPs privadas/loopback/link-local/metadata, máx. 3 redirecciones manuales, 8 s, 1 MB).
- `GET /api/cron/digest` — email diario (requiere `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `DIGEST_FROM`); `vercel.json` programa una vez al día.

**Variables de entorno:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (públicas), `NEXT_PUBLIC_META_PIXEL_ID`, `NEXT_PUBLIC_CONTACT_EMAIL`, URLs de las apps, y las del servidor listadas arriba. Hoy **solo están puestas** las de Supabase en cada proyecto.

---

## 6. Base de datos y seguridad (Postgres + RLS)

**Modelo:** `organizations` (negocio, moneda) ← `memberships` (owner/admin/member) ← todo lo demás cuelga de `org_id`. Tablas principales: `properties` (+fotos, +iCal), `bookings` (+kind stay/block, +paid, +external_uid), `host_tasks`, `host_templates`, `income_entries`, `expense_entries`, recurrentes, `guest_guides` (+items), `licenses`, `leads`, `assistant_usage`, `ops_staff`, `ops_checklists`, `ops_recurring`, `ops_jobs`.

**Decisiones de seguridad (lo que quiero que critiques):**
1. **RLS en todas las tablas**, políticas solo para `authenticated`; el rol `anon` solo puede **insertar leads** y ejecutar funciones públicas específicas.
2. **Licencias:** `licenses` solo la escribe el webhook de facturación (service role) — **ese webhook aún no existe**. `has_product_access(org, producto)` exige membresía + licencia vigente (un `suite` desbloquea todo). Los datos "de pago" dejan de leerse si la licencia vence.
3. **Dobles reservas:** restricción de exclusión GiST sobre `daterange(check_in, check_out)` por propiedad (el día de salida puede coincidir con la entrada siguiente).
4. **Funciones `SECURITY DEFINER`** (sync de operaciones, feed iCal, enlaces del equipo, `delete_my_account`, trigger de limpieza, `start_trial`, `create_organization`): con `search_path` fijo y `REVOKE EXECUTE` a `public`/`anon` salvo las que deben ser públicas.
5. **Enlaces con token** (guía de huésped, feed iCal, página del equipo): la seguridad es "quien tiene el enlace" (UUID/slug aleatorio). El feed iCal solo expone fechas.
6. **Cuenta de prueba gratis de 14 días** por producto vía RPC `start_trial`.
7. **Claves:** la `service role` no se usa en el navegador; la clave de IA solo en servidor.

**Pruebas SQL** (cada una corre en una transacción que se revierte al final): aislamiento entre organizaciones, finanzas recurrentes, guías, reservas (licencia, solapes, puente a ingresos), fotos, leads, asistente, Host "pro" (11 comprobaciones), Operations (14 comprobaciones). (La función de eliminar cuenta se probó aparte, a mano, en una transacción revertida.)

**Higiene pendiente:** hay **usuarios y datos de prueba (`e2e-*`)** en la base de producción; hay que borrarlos antes de recibir clientes reales.

---

## 7. Pruebas y calidad

- **Verificado (ejecutado):** 135 tests unitarios en Vitest (lógica de precios, Host 49, Operations 12, Business 28, Guest 10, i18n 7, licencias 6, dinero 2, web 21); typecheck limpio en todo el monorepo; build de las 5 apps; pruebas end-to-end en navegador (Playwright, Chromium) de: landing completa y carrito, repisa con arrastre, Host (cronograma, bloqueos, cobros, mensajes, reportes, feed iCal, cuenta), Operations (flujo completo incluida la página del equipo en móvil), todas contra la base real; revisión de capturas.
- **NO verificado:** dispositivos táctiles reales (solo emulación), Safari/Firefox, sincronización con un calendario real de Airbnb/Booking (se probó el lector, el plan de altas/bajas y el rechazo de IPs internas, no una descarga real), el asistente con el modelo real, el envío real de emails (recuperar contraseña, aviso diario), carga/rendimiento, accesibilidad con lector de pantalla, instalación PWA en móviles.
- **Las pruebas e2e no están versionadas** en el repositorio (scripts locales). No hay CI configurado.

---

## 8. Hallazgos que ya sé que existen (no los redescubras, pero valida mi severidad)

1. **No hay cobro ni activación automática de licencias.** Es el bloqueo principal.
2. **Contradicción comercial:** se vende "pago único" pero las apps dan "14 días de prueba" y luego bloquean; falta definir qué pasa al pagar y cómo se concede la licencia.
3. **Sin emails del sistema** (bienvenida, confirmación de compra). El email de recuperar contraseña usa el servicio integrado de Supabase (límites bajos) y requiere configurar las URLs permitidas.
4. **Landing larga** (~14.000 px escritorio, ~24.000 px móvil), portada con mucho texto antes del primer botón, mezcla de "vos"/"tú".
5. **No hay prueba social** (reseñas, demo, números de clientes). A propósito no se inventaron.
6. Datos de prueba en producción; sin monitoreo de errores; sin plan de respaldo verificado.
7. Páginas legales redactadas por mí, **sin revisión legal**; email de contacto aún no configurado.
8. Un solo idioma (español).
9. Asistente de IA: costo variable por uso frente a precio de pago único (riesgo de margen si se vende como app aparte).
10. Los nombres internos siguen siendo `profit` (rename de marca a "Business" solo visual).

---

## 9. Supuestos míos que necesitan confirmación

- Precios de soporte mensual (por herramienta): Host 9, Guest 9, Business 5, Operations 7 (y 7/5/5/7/9 previstos para AI/Listing/Academy/Experiences/Website).
- "Garantía de 14 días" y reembolso total antes de la entrega.
- Qué incluye el soporte (respuesta por email, ayuda de configuración, prioridad) y su plazo.
- Si el Megapack incluye las apps futuras.
- Que 12 meses de actualizaciones + renovación opcional de USD 10/año es sostenible y que la app nunca se bloquea por no renovar.
- Que el 30% de descuento solo aplica a apps (no a soporte).
- País/mercado inicial y moneda (no definidos); impuestos de venta digital según país.
- Plataforma de cobro (en evaluación: una tienda local argentina "Impultienda", cuya funcionalidad no pude verificar; alternativas: Lemon Squeezy o Paddle como comerciante de registro).

---

## 10. Lo que falta construir

Cobro + webhook de licencias · página de gracias · emails de bienvenida · instaladores de escritorio (plan: envoltorio que abre la app en línea; firma de código: Apple Developer ~USD 99/año y certificado Windows; no hay modo sin internet) · reconstrucción de `/l/host` como landing de anuncio de una sola oferta (con demo/garantía/FAQ) · API de Conversiones de Meta · multiusuario con permisos · idiomas EN/PT · importar archivo de Airbnb/Booking · fotos de evidencia y avisos al equipo en Operations · las 5 apps "Próximamente".

---

## 11. Preguntas concretas para la auditoría

**Producto y negocio**
1. ¿Tiene sentido vender pago único con 12 meses de actualizaciones + renovación opcional de USD 10/año + soporte mensual opcional? ¿Qué riesgos de caja/soporte ves? ¿Qué modelo recomiendas?
2. ¿Los precios (49/25/30/29, packs 72,80 y 93,10) son coherentes con el valor y con competidores (PMS/channel managers, hojas de cálculo)? ¿Qué pasa si el cliente solo usa Host?
3. ¿La separación en 4 apps con packs es buena o conviene un producto único con planes? ¿La app "Business" y "Operations" justifican producto aparte?
4. ¿Qué validaría antes de construir las 5 apps restantes?

**Conversión y Meta Ads**
5. Critica la estructura de la landing. ¿Qué quitarías, moverías o añadirías? ¿La portada comunica la promesa en 5 segundos?
6. ¿Es riesgoso para la aprobación de anuncios algún texto ("0 dobles reservas", "garantía", "ganancia real")? Revisa contra las políticas de Meta (afirmaciones, atributos personales, resultados).
7. ¿La repisa de arrastrar convierte más que un carrito clásico o es un adorno que añade fricción/peso? ¿Qué medirías (A/B)?
8. Propón la estructura de la landing de anuncio `/l/host` (una oferta) y el embudo completo hasta que el cliente **usa** el producto (activación, primeros 7 días, retención, upsell de Guest/Operations, soporte).
9. ¿Qué campaña inicial sugieres (objetivo, audiencia, presupuesto, creativos) dado que aún no hay cobro?

**Ingeniería**
10. Revisa la arquitectura (monorepo, módulos, `AppShell`, trigger vs. RPC vs. cliente) y dime deuda técnica y riesgos de escalado.
11. El sync de operaciones/iCal y los triggers SQL con `SECURITY DEFINER`: ¿hay condiciones de carrera, abusos o fallos silenciosos?
12. ¿Falta CI, tipado de la base de datos generado, tests e2e versionados, observabilidad?
13. Rendimiento: la carga de ~2000 reservas por organización, el cronograma de mes completo, las imágenes 3D de las cajas en móvil.

**Seguridad y privacidad**
14. Audita el modelo de RLS y las funciones públicas con token (guía, iCal, equipo): ¿fuga posible, enumeración, fuerza bruta de tokens, falta de rate limit?
15. `delete_my_account` (borra `auth.users` desde una función `SECURITY DEFINER`): ¿riesgos?
16. La defensa SSRF del sync iCal: ¿suficiente? (DNS rebinding entre la comprobación y la conexión es un caso a evaluar).
17. Privacidad: consentimiento del Píxel, retención de leads, transferencias a proveedores (Supabase, Vercel, Meta, proveedor de IA, correo), derechos ARCO/RGPD. ¿Qué falta en las páginas legales?
18. El asistente de IA recibe datos de huéspedes (nombres, emails, teléfonos): ¿riesgos de privacidad y de prompt injection desde notas o nombres de reservas?

**Legal y comercial**
19. Impuestos de venta digital (IVA/ventas) según país del comprador; ¿conviene un comerciante de registro (Lemon Squeezy/Paddle) frente a una pasarela local?
20. Revisa términos/reembolsos/privacidad: huecos, promesas arriesgadas ("12 meses de actualizaciones", "no se bloquea si no renuevas", "garantía 14 días"), requisitos para anuncios de Meta y tiendas de apps (si algún día se empaqueta como app).

---

## 12. Despliegues públicos (para que mires la interfaz)

- Landing: https://stayflow-web-livid.vercel.app
- Host: https://stayflow-host.vercel.app · Guest: https://stayflow-guest-eight.vercel.app · Business: https://stayflow-profit.vercel.app · Operations: https://stayflow-operations.vercel.app
- Las apps piden iniciar sesión; se puede crear una cuenta y usar los **datos de ejemplo** de Host. (Cuidado: es producción real; no cargar datos sensibles.)

---

## 13. Archivos clave por si necesitas leer código (pídeme el que quieras)

- Precios y catálogo: `apps/web/src/lib/catalog.ts`, `apps/web/src/lib/pricing.ts`, `apps/web/src/lib/pricing.test.ts`
- Landing: `apps/web/src/app/page.tsx`, `components/sections.tsx`, `components/precios.tsx`, `components/shelf.tsx`, `components/soon.tsx`, `components/cart.tsx`, `lib/meta.ts`, `lib/attribution.ts`, `components/consent.tsx`
- Seguridad/DB: `supabase/migrations/0001_core.sql`, `0003_licensing.sql`, `0004_harden_functions.sql`, `0005_policies_authenticated_only.sql`, `0009_host.sql`, `0015_host_pro.sql`, `0016_account_and_demo.sql`, `0017_operations.sql` y `supabase/tests/*.sql`
- Rutas API: `apps/host/src/app/api/assistant/route.ts`, `api/ical/sync/route.ts`, `api/ical/[token]/route.ts`, `api/cron/digest/route.ts`
- Lógica: `packages/modules/host/src/logic.ts`, `ical.ts`, `assistant.ts`, `packages/modules/operations/src/logic.ts`, `data.ts`
- Auth/cuenta: `packages/auth/src/account.tsx`, `screens/AuthScreen.tsx`, `screens/AccountPanels.tsx`, `packages/shell/src/index.tsx`
- Pantalla estrella: `packages/modules/host/src/screens/HostCalendar.tsx`

---

**Cierre:** quiero tu auditoría más dura posible. Si tienes que elegir, dime qué tres cosas me harían perder dinero o clientes si las ignoro.
