---
tipo: negocio
estado: vigente
actualizado: 2026-11-13
---
# Precios y ofertas

| Producto | USD | Estado |
|---|---|---|
| [[Stayflow Host]] | 49 | A la venta |
| [[Stayflow Guest]] | 25 | A la venta |
| [[Stayflow Business]] | 30 | A la venta |
| [[Stayflow Operations]] | 29 | A la venta |
| AI / Listing / Academy / Experiences / Website | 29 / 19 / 19 / 29 / 39 (previstos) | [[Próximamente]] |
| Host Launch Kit | 159 (previsto) | No existe |

**Regla Multi-Pack:** desde la 2.ª app, 30% sobre el subtotal de apps.
**Packs:** Esencial (Host+Guest+Business) = **69**. Megapack Anfitrión Premium (todas las apps a la venta; hoy 4) = **89**.
**Soporte opcional (mensual, por herramienta):** Host 9 · Guest 9 · Business 5 · Operations 7 `[VERIFICAR]`.
**Actualizaciones:** 12 meses incluidos; **sin renovación** (decisión 2026-11-13). La app sigue funcionando igual después.

## Lanzamiento de Host (propuesto, pendiente)
Host **USD 38** por noviembre (precio de lanzamiento, 49 tachado), con cierre real el 30-nov 23:59 (hora Argentina) y, opcionalmente, cupo de 30 clientes. Solo Host; los packs no se rebajan más (no apilar descuentos). **No implementado en la landing todavía**: falta confirmar fecha, cupo y medio de cobro. Pasos: [[Pasarela de pago - decisión]].
**Criterios del test:** tratar a los primeros 10–30 compradores como piloto, pedir feedback y permiso para citarlos, preguntarles cuánto habrían pagado; volver a 49 el 1-dic.

## Promoción de packs (hecha, apagada)
Esencial 65 / Megapack 85 con **cierre real**. Se enciende con la variable `NEXT_PUBLIC_PROMO_ENDS_AT` (fecha con huso horario) y se apaga sola.
**Reglas:** una sola vez, sin reiniciar por visitante, sin "solo por hoy" repetido, no encenderla hasta que el cobro funcione, y validar el precio **en el servidor** cuando exista el cobro. Ver [[Cobro y licencias]].

## Preguntas abiertas
- ¿El Megapack incluye las apps futuras?
- ¿Qué cubre exactamente el soporte y en qué plazo responde?
