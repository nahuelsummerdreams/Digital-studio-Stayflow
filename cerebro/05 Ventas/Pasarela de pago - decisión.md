---
tipo: ventas
estado: EN DECISIÓN (bloqueo principal)
actualizado: 2026-11-13
---
# Pasarela de pago · decisión

**Objetivo:** vender a **otros países** (España y Latinoamérica primero). Eso favorece una plataforma que actúe como **comerciante de registro** (cobra y resuelve el IVA/GST por país).

## Opciones evaluadas
| Opción | Qué hace bien | A verificar / riesgo |
|---|---|---|
| **Whop** | Comerciante de registro (impuestos por país del comprador), 100+ medios de pago, 195 países, claves de licencia, API y webhooks | Si **paga a Argentina**; comisiones exactas (los blogs no coinciden); responder la pregunta de IVA **antes del 30-nov-2026** o pueden pausar pagos desde el 1-dic |
| **Impultienda** (impultienda.ar, checkout "Multidivisa" base USD) | Argentina, rápido de armar, ARS (Mercado Pago) y USD (Stripe/PayPal) | Impuestos de ventas al exterior a tu cargo (probablemente no es comerciante de registro); entrega de productos digitales y webhook **no verificados** |
| Mercado Pago (Checkout Pro) | Mejor conversión en Argentina/Latinoamérica | Cobra en pesos para cuenta argentina; no cubre bien España |
| Lemon Squeezy / Paddle | Comerciante de registro | LS integrándose a Stripe; lista de países de Paddle no verificada |
| Stripe directo | — | No verificado para comercios argentinos |

## Cómo se conecta (sin programar)
1. En la plataforma: crear el producto **Stayflow Host**, pago único, USD (49 o 38 de lanzamiento), mensaje posterior a la compra, y copiar el **link del checkout**.
2. En Vercel → proyecto `stayflow-web` → Environment Variables: `NEXT_PUBLIC_HOST_CHECKOUT_URL` = ese link → redesplegar.
3. Los botones "Conseguir Host" de la landing (principal, cierre y flotante) van directo al checkout. Sin variable, siguen abriendo el carrito con captura de correo.
4. **Entrega:** por ahora **manual** (crear el código con `create_license_codes` y enviarlo con la plantilla [[Correo de entrega]]). Ver [[Entrega de licencias]].

## Etapa 2 (automática, 1–2 días)
Webhook de la plataforma → endpoint de la landing que valida la firma, evita procesar dos veces el mismo pago, crea el código y envía el correo; reembolso → revocar el código. Secretos solo como variables de entorno en Vercel; **nunca** en el chat ni en el repositorio.

## Pendiente del dueño
- Elegir plataforma y abrir la cuenta; confirmar que paga a Argentina; contestar la pregunta de IVA.
- Cómo facturar (con contador). Servicio de correo (p. ej. Resend) para la entrega automática.
Ver [[Cobro y licencias]] y [[Legal y cumplimiento]].
