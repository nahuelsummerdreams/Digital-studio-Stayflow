# Migraciones pendientes de aplicar

Aquí están las migraciones **escritas y revisadas pero todavía NO aplicadas** a producción. Las que ya están aplicadas viven en `supabase/migrations/`.

## 0030_booking_history.sql (Etapa 3b)
Estado: **pendiente de aprobación.** La conexión de Supabase pidió confirmación y no se respondió a tiempo; se comprobó después que no se aplicó nada.

Qué hace:
- Reemplaza la regla anti-doble-reserva para que una **consulta** no bloquee fechas (se borra y se recrea en la misma transacción, sin hueco).
- Hace que una consulta no genere limpiezas, ni se publique a otras plataformas (`ical_feed`), ni entre en Operations.
- Crea el **historial de cada reserva** (`booking_events`) escrito por la base, con relleno de las reservas existentes.

Cuando se aplique: moverla a `supabase/migrations/` y agregar su prueba SQL.
