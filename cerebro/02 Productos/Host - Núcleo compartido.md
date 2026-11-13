---
tipo: producto
estado: construido (Rentals) · compartido por las 4 categorías
actualizado: 2026-11-13
---
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
