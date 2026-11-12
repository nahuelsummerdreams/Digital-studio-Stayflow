---
tipo: ventas
estado: vigente
actualizado: 2026-11-12
---
# Entrega de licencias (el cerebro lo hace)

> Cuando alguien compra, Claude **emite el código, arma el mensaje de entrega y deja registro**. Tú solo apruebas y envías.
> Detalle técnico y consultas SQL: `docs/LICENCIAS.md` del repositorio.

## Qué lleva cada compra
| Compra | Productos del código | Carpeta a adjuntar |
|---|---|---|
| Host | host | `Stayflow-Host` |
| Guest | guest | `Stayflow-Guest` |
| Business | profit | `Stayflow-Business` |
| Operations | operations | `Stayflow-Operations` |
| Pack Esencial | host, guest, profit | Host + Guest + Business |
| Megapack | las cuatro | las cuatro carpetas |

## Procedimiento (una compra)
1. **Confirma** qué compró y el número de orden. Si falta algo, pregunta.
2. **Emite el código** con la conexión de Supabase (`create_license_codes`, ver `docs/LICENCIAS.md`). Nota del código: solo `Orden NNNN`.
3. **Arma el mensaje** con la plantilla [[Correo de entrega]]: código, enlace de la app, accesos y la guía en PDF.
4. **Prepárale el borrador** (Gmail, si está conectado) **sin enviarlo**: lo revisas y lo envías tú.
5. **Registra** en el diario del día: "Entregada licencia <producto> · Orden NNNN". **Sin código, sin correo, sin nombre.**

## Otras situaciones
- **Lote para otra plataforma:** pide N códigos del producto y entrégalos en una hoja que se descarga, sin guardarlos en el vault.
- **El cliente no recibe el correo o perdió el código:** consulta `license_codes_overview` por la nota de la orden; si no se usó, reenvía el mismo código.
- **Reembolso (14 días):** `revoke_license_code`. Si se usó, cancela el acceso; el cliente conserva sus datos.
- **Cliente pregunta cuánto falta de actualizaciones:** son 12 meses desde la activación.

## Reglas que no se rompen
- El código es una credencial. Nunca va al vault, al repositorio ni a una captura.
- En el DB, la nota lleva solo el número de orden. Nunca datos personales del cliente.
- Claude no envía correos a clientes por su cuenta: deja el borrador.

Ver [[Cobro y licencias]] · [[Oferta y garantía]] · [[Biblioteca de prompts]]
