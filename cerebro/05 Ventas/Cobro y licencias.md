---
tipo: ventas
estado: BLOQUEO PRINCIPAL
actualizado: 2026-11-12
---
# Cobro y licencias

## Hoy
El botón de compra termina en un formulario de email. No hay pago automático. **No hay prueba gratis:** el acceso se activa con un **código de licencia** (`SF-XXXX-XXXX-XXXX`, migración 0022). Los códigos los crea el vendedor (SQL) y se entregan al cliente al comprar; mientras no exista el webhook de pago, se pueden vender por cualquier plataforma y enviar el código a mano.

## Qué necesita el cobro
1. **Proveedor** con enlace de pago o carrito y **aviso automático (webhook)** al pagar, moneda USD, y manejo de impuestos.
2. **Activación:** el aviso crea/renueva la licencia del negocio (tabla `licenses`) → el cliente entra sin prueba.
3. **Página de gracias** + **email de acceso/descarga**.
4. **Precio promocional validado en el servidor** (fecha del servidor, no del navegador).
5. Reembolsos: cómo se revoca la licencia.

## Opciones (a investigar)
| Opción | Ventaja | Riesgo |
|---|---|---|
| Lemon Squeezy / Paddle (comerciante de registro) | Impuestos globales resueltos | Comisión mayor; aprobación |
| Pasarela local (p. ej. de Impultienda) | Cobra bien en su país | Impuestos de otros países a tu cargo; **no verificado** que tenga API/webhook |

## Preguntas para el proveedor
¿API o webhook al pagar? ¿Enlace de pago por producto? ¿Dólares? ¿Comisión? ¿Facturación/impuestos?

## Pendiente de política
Qué pasa cuando alguien no renueva las actualizaciones (la app sigue funcionando) y cómo se registra la renovación de USD 10/año. Ver [[Decisiones]].
