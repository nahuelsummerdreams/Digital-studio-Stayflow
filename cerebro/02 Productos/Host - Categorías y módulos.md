---
tipo: producto
estado: Rentals a la venta · Hotels y Hostels en desarrollo · Cabins próximamente
actualizado: 2026-11-13
---
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
