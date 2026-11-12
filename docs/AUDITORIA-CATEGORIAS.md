# Auditoría y plan técnico · Stayflow por categorías (Etapa 1)

Fecha: 12-nov-2026. Alcance: el proyecto "Stayflow Host: ecosistema integral de gestión para alojamientos" (4 categorías: Rentals, Hotels, Cabins & Resorts, Hostels).
Método: revisé la base de producción (tablas, políticas, tipos, historial de migraciones), el código de la rama `claude/quirky-albattani-cthzld` y la rama `feat/hotel-hostel`, y corrí las pruebas de ambas. No modifiqué nada.

## Avance (actualizado el 12-nov-2026)
| Etapa | Estado |
|---|---|
| 0 · Integrar `feat/hotel-hostel` | ✅ Integrada, con pruebas SQL de 0024 y 0025 (14 comprobaciones) |
| 1 · Auditoría | ✅ |
| 2 · Selector de 4 categorías | ✅ Tarjetas, módulos por perfil (`org_modules`), menú que sigue la categoría, cambio controlado con vista previa y registro (migraciones 0026, 0027; 16 comprobaciones SQL) |
| 3a · Huéspedes | ✅ Ficha persistente: documento, preferencias, notas, etiquetas, VIP, incidencias y segmentos (migración 0028; 14 comprobaciones SQL) |
| 3b · Estados de reserva e historial | ✅ Consulta/Pendiente/Confirmada, historial por reserva (migración 0030; 8 comprobaciones SQL) |
| 3c · Libro de pagos | ✅ Cobros con medio y fecha, devoluciones, total derivado (migración 0031; 7 comprobaciones SQL) |
| 3d · Equipo, roles y auditoría | ✅ Invitaciones, roles, bajas, registro de actividad (migración 0032; 12 comprobaciones SQL). Falta: ocultar botones según rol y matriz por módulo |
| 3e · Historial de comunicaciones | ✅ Mensajes preparados quedan en el historial de la reserva |
| 3f · Tareas con responsable y prioridad | ✅ (notificaciones pendientes) |
| 4 · Rentals | ✅ parcial: ficha por unidad (capacidad, comodidades, normas, accesos privados), incidencias con costo y envío a Profit (migración 0033; 8 comprobaciones SQL). Faltan automatizaciones programadas |

## 0. Resumen
- **Stayflow ya es multi-cliente y seguro por diseño** (21 tablas, todas con RLS; pruebas de aislamiento). Esa es la base más difícil y está hecha.
- **Rentals está cubierto en ~60–65 %.** Hotels ~25 %, Hostels ~30 %, Cabins & Resorts ~10 %, Superadmin 0 %. (Porcentajes sobre el listado de módulos del brief; ver §3.)
- **Hay una rama de hotel y hostel ya construida (`feat/hotel-hostel`)** y sus dos migraciones **ya están aplicadas en producción**, aunque el código no está integrado ni desplegado. Hay que cerrar ese desfase antes de seguir (Etapa 0).
- **Tres decisiones tuyas cambian el plan** (§8): modelo de cobro (recurrente vs pago único), arquitectura (categorías como perfiles dentro de Host vs apps nuevas) y orden de prioridades.
- El alcance completo del brief es de varios meses de trabajo. Se puede entregar valor por etapas, pero no en una sola pasada.

## 1. Estado real hoy
| Área | Estado |
|---|---|
| Stack | Next.js 15, React 19, TypeScript, Tailwind, Supabase (Postgres, Auth, Storage, RLS), Vercel. Monorepo pnpm. **Se conserva.** |
| Apps | `host`, `guest`, `profit` (Business), `operations`, `web` (landing). Una cuenta sirve para todas. |
| Base | 21 tablas, **todas con RLS**; funciones sensibles `security definer` con permisos revocados al público. |
| Roles | `owner`, `admin`, `member`, `viewer` por organización (sin permisos por módulo). |
| Acceso | Licencias por producto + código de activación (sin prueba gratis). Sin cobro automático. |
| Pruebas | Rama actual: 162 pruebas de unidad en verde + 13 pruebas SQL manuales. Rama `feat/hotel-hostel`: Host 75 y Guest 17, todo en verde, `tsc` limpio en las 5 apps. |
| Despliegue | Producción corre la rama `claude/quirky-albattani-cthzld`. `feat/hotel-hostel` no está desplegada. |

## 2. Hallazgo clave: ya existe trabajo de hotel y hostel
La rama `feat/hotel-hostel` (commits de nahuelsummerdreams, construida sobre mi último commit) ya incluye:
- `organizations.lodging_type` (`rental`, `hotel`, `hostel`) y selector en el alta de cuenta.
- Modelo **establecimiento → habitación → cama** usando `properties.parent_id`, `unit_kind`, `room_category`, `base_rate_minor`. Las hijas heredan RLS, calendario, anti-doble-reserva y limpieza sin reescribir nada. **Es una buena decisión de diseño y la voy a respetar.**
- Pantalla "Recepción de hoy" (llegadas, salidas, en casa, ocupación) y ADR.
- Limpieza por habitación (no por cama), plantillas de guía para hotel y hostel.

**Problemas a resolver (Etapa 0):**
1. **Desfase repo↔producción.** `0024_lodging_types` y `0025_no_cleaning_per_bed` están en la base de producción (aplicadas el 12-nov) pero el código que las usa no está en producción. Compatibilidad: son columnas opcionales y un trigger que solo cambia para camas, así que lo desplegado hoy no se rompe, pero hay que integrarlo.
2. El documento de diseño de la rama dice "nada de esto está migrado en producción", lo cual ya no es cierto. Confirmar que fue autorizado.
3. **Dos líneas de trabajo en paralelo** sobre archivos compartidos (`es.ts`, `PropertiesScreen`, `api.ts`, `CreateOrgScreen`): riesgo alto de conflictos. Conviene un único responsable de integrar.
4. Faltan en la rama las pruebas SQL de las migraciones 0024 y 0025 (el repo las exige para cada migración).

## 3. Requisitos del brief vs estado
Leyenda: ✅ existe · 🟡 parcial · ❌ falta.

### Núcleo compartido (§3 del brief)
| Módulo | Estado | Detalle |
|---|---|---|
| A. Dashboard | 🟡 | Panel con "Tu día", ocupación, reservas, llegadas, tareas, por cobrar, agenda y gráficos. Falta: ganancia estimada, alertas operativas, actividad reciente, y adaptación por categoría (la rama agrega Recepción). |
| B. Reservas | 🟡 | Crear, editar, cancelar, anticipos y saldo, calendario mensual (2 cuadritos por día), bloqueos, origen, **anti-superposición a nivel de base**. Falta: estados *consulta* y *pendiente* (hay 4 de 6), historial de cambios, lista de espera, reservas grupales, tarifa aplicada, calendario semanal. |
| C. Huéspedes | 🟡 | Hoy "Huéspedes" se deriva de las reservas: **no existe tabla `guests`**. Faltan ficha persistente, preferencias, documentación, segmentación, incidencias. Bloquea CRM y derecho de borrado por huésped. |
| D. Finanzas | 🟡 | Business: ingresos, gastos, fijos, margen por propiedad, CSV, ingresos automáticos desde Host. Pagos = un solo importe cobrado por reserva (**sin libro de pagos**). Falta: flujo de caja, reporte diario, separación formal confirmado / pendiente / estimado, cierre de caja. |
| E. Comunicación | 🟡 | 4 plantillas editables y envío por enlace a WhatsApp/correo. Falta: historial de comunicaciones, integraciones oficiales (el brief pide solo "preparar la arquitectura"). |
| F. Tareas y operaciones | 🟡 | Host: tareas simples. Operations: trabajos con responsable (enlace privado), checklist, estados, fotos, recurrencia. Falta: prioridades, notificaciones, historial. |
| G. Reportes | 🟡 | Reporte mensual, ocupación, estadía media, rentabilidad por propiedad, ADR (en rama). Falta: cancelaciones, comparación mensual en Host, RevPAR/RevPAB. |
| H. IA | 🟡 | Asistente de solo lectura sobre datos del negocio, con tope diario. **Inactivo** (falta `ANTHROPIC_API_KEY`). No respeta permisos por rol porque no existen. |

### Categorías
| Categoría | Cobertura | Lo que ya sirve | Lo que falta (resumen) |
|---|---|---|---|
| **Rentals** | ~60–65 % | Propiedades con foto, calendario, bloqueos, iCal entrada/salida, importar CSV Airbnb/Booking, check-in/out, limpieza automática con fotos, mantenimiento recurrente, finanzas, multipropiedad básica | Campos estructurados de propiedad (capacidad, camas, baños, servicios, normas, tarifas), códigos de acceso, **incidencias y costos de mantenimiento**, automatizaciones programadas reales, colaboradores con roles |
| **Hotels** | ~25 % (con la rama) | Habitaciones como unidades, reservas por habitación, recepción de hoy, limpieza por habitación, ADR | Estados de habitación, asignar/cambiar habitación, front desk con **cuenta del huésped (folio)**, servicios y consumos, inspecciones y objetos perdidos, cierre de caja, RevPAR, grupos, lista de espera, **personal y roles** |
| **Cabins & Resorts** | ~10 % | La misma jerarquía padre-hijo sirve para unidades | **Servicios y experiencias reservables** (cupos, horarios, precios), gestión de personal, finanzas por servicio, reservas familiares/grupales |
| **Hostels** | ~30 % (con la rama) | Disponibilidad por cama, recepción, limpieza por habitación | Grupos y coordinadores, actividades y eventos, lavandería, caja, RevPAB, lista de espera |

### Transversal
| Requisito | Estado | Detalle |
|---|---|---|
| Selector de categoría | 🟡 | La rama elige entre 3 tipos. Faltan: 4ª categoría, tarjetas con imagen/descripción/funciones, **cambio controlado de categoría** sin perder datos. |
| Navegación por categoría | 🟡 | Solo la página de Recepción. No hay perfiles de módulos. |
| Superadministrador | ❌ | No existe panel. Hay funciones SQL para emitir/revocar códigos de licencia (solo servicio). Faltan clientes, planes, suscripciones, métricas, soporte, **auditoría de accesos**. |
| Multi-tenant | ✅ | Organizaciones, membresías, RLS en las 21 tablas, almacenamiento por organización, pruebas de aislamiento. Falta: permisos por módulo y auditoría. |
| Permisos | ❌ | Roles de 4 niveles, sin matriz por módulo. El brief pide recepción, limpieza, mantenimiento, administración. |
| Diseño | ✅ | Sistema visual premium, responsive, instalable (PWA). |

## 4. Choques con decisiones ya tomadas (necesito que decidas)
1. **Modelo de cobro.** El brief dice "suscripción recurrente". Lo vigente es **pago único + 12 meses de actualizaciones + renovación opcional de USD 10/año**, y la landing lo promete. Además existen planes (`starter/pro/business`) que hoy no limitan nada.
2. **Arquitectura.** El brief pide "una arquitectura, cuatro aplicaciones por categoría". Hoy las apps son por **función** (Host, Guest, Business, Operations) y se venden por separado. Son dos ejes distintos. Propuesta: la categoría es un **perfil dentro de Host** (módulos y navegación activos según `lodging_type`); Guest, Business y Operations siguen siendo complementos y reciben el mismo perfil.
3. **"No vender lo que no existe".** Hotels, Hostels y Cabins no se pueden poner a la venta hasta que cada etapa esté probada. La landing seguirá mostrándolos como "Próximamente".
4. **Argentina.** Facturación fiscal (AFIP), medios de pago locales y moneda no están en el brief como entregables. Propongo dejarlos fuera de la v1 y no simular integraciones.

## 5. Errores y huecos detectados
1. Desfase repositorio ↔ producción (§2).
2. Sin tabla de huéspedes: los datos personales viven duplicados en cada reserva.
3. Sin libro de pagos ni historial de cambios de reservas.
4. Sin integración continua: las pruebas de navegador no están versionadas y las SQL se corren a mano.
5. Registro abierto sin captcha.
6. IA y correo diario sin credenciales; no hay cobro automático.
7. Cuentas de prueba `e2e-*` en producción.
8. Los planes de licencia no gobiernan módulos.

## 6. Arquitectura propuesta
- **Perfil de organización**: `lodging_type` (ya existe; se amplía a `cabins`) + tabla `org_modules` (módulos activos, con origen: perfil o manual). La navegación y el panel se construyen desde ahí. Cambiar de categoría = recalcular `org_modules`, **nunca borrar datos**.
- **Unidades**: se mantiene `properties` con `parent_id`/`unit_kind` (ampliando valores, p. ej. `cabin`, `suite`). Un servicio (spa, excursión) es otra entidad (`services` con cupos y horarios) que se cobra en una reserva o en la cuenta del huésped.
- **Huéspedes**: tabla `guests` por organización, con vínculo desde `bookings` y migración que unifica por correo/teléfono sin perder nada.
- **Pagos**: tabla `payments` (monto, fecha, medio, estado) por reserva; "cobrado" y "por cobrar" pasan a calcularse desde ahí.
- **Permisos y auditoría**: `staff_roles` (recepción, limpieza, mantenimiento, administración) con matriz rol→módulo, aplicada en RLS; tabla `audit_log` inmodificable para lecturas/cambios sensibles.
- **Superadmin**: aplicación separada con rol de plataforma (`platform_admins`), vistas **agregadas sin datos personales** de huéspedes, acciones con auditoría y "acceso de soporte" solo con permiso temporal del cliente.
- **Todo lo nuevo** lleva pruebas SQL de aislamiento entre organizaciones y de permisos.

## 7. Plan por etapas
Tamaño relativo: S (1–2 días de trabajo), M (3–5), L (1–2 semanas), XL (2–4 semanas). Son estimaciones gruesas con pruebas reales incluidas.

| Etapa | Qué | Tam. | Notas |
|---|---|---|---|
| **0 (nueva)** | Integrar `feat/hotel-hostel`: revisar, subir pruebas SQL de 0024/0025, cerrar desfase, un solo responsable de merges | S | Bloquea todo lo demás |
| 1 | Auditoría y plan | ✅ | Este documento |
| 2 | Selector de 4 categorías (tarjetas con imagen, descripción y funciones) + `org_modules` + cambio controlado de categoría | M | Reutiliza el selector de la rama |
| 3 | Núcleo compartido, en entregas: **3a** huéspedes · **3b** estados de reserva + historial · **3c** libro de pagos · **3d permisos por módulo + auditoría** · **3e** historial de comunicaciones · **3f** tareas con responsable, prioridad y notificaciones | XL | 3d debe ir antes de Hotels y Superadmin |
| 4 | Rentals: campos de propiedad, accesos, **incidencias y costos de mantenimiento**, automatizaciones programadas reales, colaboradores | L | Ya está ~60 % |
| 5 | Hostels (completar): grupos, actividades, lavandería, caja, RevPAB | L | Ya está ~30 % |
| 6 | Hotels: asignación/cambio de habitación, estados, **folio y consumos**, housekeeping, cierre de caja, RevPAR, personal | XL | Necesita 3d |
| 7 | Cabins & Resorts: unidades, **servicios y experiencias reservables**, personal, finanzas por servicio | XL | Dominio nuevo |
| 8 | Superadmin con auditoría, planes y métricas | L | Versión mínima antes de vender una categoría nueva a terceros |
| 9 | Endurecimiento multi-tenant: pruebas de aislamiento por tabla nueva en CI | M | Continuo |
| 10 | Pruebas integrales, CI, e2e versionados, captcha, landing por categoría | L | Cierra el ciclo |

**Orden recomendado:** 0 → 2 → 3 → 4 → 8 (mínimo) → 5 → 6 → 7 → 9/10. Motivo: Rentals ya vende hoy; Hostels está más avanzado que Hotels; Hotels necesita folio y permisos; Cabins es un dominio nuevo.
El brief completo equivale a **entre 3 y 5 meses** de trabajo continuo y probado. Cada etapa deja algo usable.

## 8. Decisiones necesarias
1. **Cobro:** ¿suscripción recurrente (como dice el brief) o pago único (lo vigente)? Mi recomendación: pago único para Rentals y Hostels; suscripción para Hotels y Resorts (múltiples usuarios, soporte y módulos).
2. **Arquitectura:** ¿categorías como perfiles dentro de Host (recomendado) o aplicaciones separadas?
3. **Rama `feat/hotel-hostel`:** ¿se integra tal cual? ¿Quién hace los merges? ¿Autorizaste aplicar 0024/0025 en producción?
4. **Prioridad comercial:** ¿qué categoría quieres vender primero en Argentina?
5. **Cobro en Argentina:** ¿qué pasarela usarás (Mercado Pago, otra) y en qué moneda (ARS/USD)? La facturación AFIP queda fuera de la v1 salvo que digas lo contrario.

## 9. Reglas que se mantienen
No eliminar funciones existentes · no botones decorativos · todo persiste y se valida · no inventar integraciones ni simular automatizaciones · una etapa por vez, con pruebas · no tocar otra categoría al trabajar en una · compatibilidad con los datos existentes.
