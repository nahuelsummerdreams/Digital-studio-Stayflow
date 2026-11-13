---
tipo: operaciones
actualizado: 2026-11-13
---
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
