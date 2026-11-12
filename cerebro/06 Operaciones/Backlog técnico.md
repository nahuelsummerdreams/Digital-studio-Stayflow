---
tipo: operaciones
actualizado: 2026-11-12
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
