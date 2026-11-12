# Diseño: Stayflow para hoteles y hostels (v1)

Estado: borrador de diseño. Nada de esto está publicado ni migrado en producción.

## Idea central
Hoy cada **propiedad** (`properties`) es lo que se reserva: tiene su calendario, sus reservas (`bookings`, con bloqueo de superposición por `property_id`), su limpieza (Operations) y su guía (Guest).

Para hotel y hostel NO se reescribe nada de eso. Se agrega:
1. **Tipo de alojamiento** en la organización: `rental` (hoy), `hotel`, `hostel`.
2. **Unidades hijas**: una propiedad puede tener `parent_id`. El establecimiento es la propiedad "madre"; sus habitaciones (hotel) o camas (hostel) son propiedades hijas con `unit_kind` = `room` | `bed`.

Así el calendario, las reservas, el anti-doble-reserva, la limpieza por habitación, las finanzas y los permisos funcionan sin cambiar su lógica: una habitación o una cama se reserva igual que un departamento.

## Qué cambia por tipo
| | rental (hoy) | hotel | hostel |
|---|---|---|---|
| Se reserva | propiedad | habitación | cama (dentro de una habitación compartida) |
| Madre | no tiene | el hotel | el hostel |
| Hijas | no tiene | habitaciones | habitaciones → camas |

Hostel: una habitación compartida es una propiedad hija (`room`) con camas como hijas (`bed`). Se reservan las camas. Una reserva de habitación privada de hostel usa la `room` directamente.

## Modelo de datos (migración 0024)
- `public.lodging_type` enum: `rental`, `hotel`, `hostel`.
- `organizations.lodging_type` (default `rental`): no cambia nada a quien ya existe.
- `properties.parent_id uuid references properties(id) on delete cascade`.
- `properties.unit_kind text check in ('room','bed')`, null para propiedades de nivel superior.
- `properties.room_category text` (opcional: "doble", "familiar", "dormitorio 6").
- `properties.base_rate_minor bigint` (opcional, tarifa por noche sugerida).
- Reglas por trigger: el padre debe ser de la misma organización; una `bed` solo cuelga de una `room`; una `room` solo cuelga de un establecimiento; no hay más de 3 niveles.
- RLS: sin políticas nuevas. Las hijas son filas de `properties` y heredan las políticas existentes.

## Pantallas por app (v1)
- **Host**: al crear la cuenta se elige el tipo; alta de habitaciones y camas en bloque; "Recepción de hoy" (llegadas, salidas, ocupación); calendario agrupado por establecimiento.
- **Guest**: plantillas de guía para hotel y hostel (horarios, desayuno, normas de dormitorio compartido). La guía vive en el establecimiento madre.
- **Business**: ocupación (%) y tarifa media por habitación o cama; ingresos agrupados por establecimiento.
- **Operations**: limpieza por habitación o cama con estado; las tareas siguen a las reservas como hoy.

## Etapas
1. Núcleo: migración 0024 + tipos + lógica pura de ocupación (con pruebas). *(esta rama, primer paso)*
2. Host: alta de unidades y recepción de hoy.
3. Operations y Business: agrupación y métricas.
4. Guest: plantillas.
5. Landing: estados "disponible / en desarrollo / lista de espera" (solo cuando 1–4 estén probadas).

## Lo que NO hace la v1
Tarifas por temporada, channel manager con Booking/Expedia para hoteles, facturación fiscal, motor de reservas público. Cabañas/resorts quedan para después.

## Reglas de trabajo
- Rama propia `feat/hotel-hostel`, cortada de la rama remota más nueva. No se hace push ni se aplica la migración en producción sin autorización de Nahuel.
- La landing no promete hotel/hostel hasta que exista y esté probado.
