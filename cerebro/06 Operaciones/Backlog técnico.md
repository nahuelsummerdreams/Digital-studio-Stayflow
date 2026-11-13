---
tipo: operaciones
actualizado: 2026-11-13
---
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
