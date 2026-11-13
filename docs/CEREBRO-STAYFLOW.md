# STAYFLOW · Memoria del proyecto (para cargar en el "cerebro")

> Documento corto y vivo. Pensado para que cualquier IA o persona entienda en 5 minutos qué es Stayflow, qué decidimos, qué está hecho y qué sigue.
> Actualizado: noviembre de 2026. El detalle técnico completo está en `docs/AUDITORIA-CHATGPT.md`.

## 1. Qué es
Ecosistema de apps web instalables para **anfitriones de alquiler temporal** (Airbnb, Booking, VRBO, directo). Lo produce **Digital Studio** (su logo va siempre junto a la marca). Español, tuteo neutro. Estética: oscura, premium, cinematográfica, con acentos neón. Se vende con **pago único** y, más adelante, con anuncios de Meta.

## 2. Estado hoy
| App | Estado | Precio (USD) |
|---|---|---|
| Host | **Hecha y en línea** (producto ganador, puerta de entrada) | 49 |
| Guest | Hecha | 25 |
| Business (antes "Profit") | Hecha | 30 |
| Operations | Hecha | 29 |
| AI, Listing, Academy, Experiences, Website | **No existen** → "Próximamente" con "Avísame" (sirve para medir demanda) | previstos 29/19/19/29/39 |
| Host Launch Kit | No existe, fuera de la venta | previsto 159 |

**Packs:** Esencial (Host+Guest+Business) = **69**; Megapack Anfitrión Premium (todas las apps a la venta, hoy 4) = **89**. Regla: desde la 2.ª app, **−30%** sobre el subtotal de apps.
**Promoción única** (hecha, APAGADA): Esencial 65 / Megapack 85 con **fecha de cierre real**; se enciende con `NEXT_PUBLIC_PROMO_ENDS_AT` y se apaga sola. Regla innegociable: **nunca urgencia falsa** (nada de "solo por hoy" que se repite).

## 3. Decisiones tomadas (no re-discutir sin motivo)
- Pago único, **sin mensualidad**. Incluye **12 meses de actualizaciones**; después la app sigue funcionando igual, **sin renovación ni cargos** (decisión 2026-11-13).
- **Garantía de 14 días** (reembolso). Supuesto mío: confirmar con abogado.
- **Soporte mensual opcional**, por herramienta (Host 9, Guest 9, Business 5, Operations 7). Precios provisionales.
- **Solo se vende lo que existe.** Lo demás: "Próximamente", sin precio ni carrito.
- Modelo **en línea** (nube). El instalador de escritorio será un envoltorio que abre la app en línea; **no** hay versión sin internet (decisión: primero nube, después edición local con sincronización si hiciera falta).
- Nombres: se renombró Profit → **Business** (solo visible; los ids internos siguen `profit`).

## 4. La landing (embudo)
Una sola promesa alrededor de **Host**. Orden: portada (titular de dolor + 3 beneficios + botón "Conseguirlo por USD 49" + confianza) → 4 datos → "Míralo por dentro" (5 pestañas con pantallas reales) → oferta de Host → repisa (arrastrar apps al pack, ticket en vivo) + 2 packs → soporte opcional (desplegable) → Próximamente → 6 preguntas → cierre. **6.500 px escritorio / 9.300 px móvil** (antes 14.000 / 24.000). Barra fija de compra en móvil.
**Titular:** "¿Tu Airbnb te está consumiendo más tiempo del que debería?"
**Voz:** emocional + elegante + cercana. Sin clichés, sin "somos los mejores", sin exceso de emojis, sin testimonios inventados.
**Promesas que SÍ podemos decir (son verdad):** calendario visual con entrada/salida el mismo día; limpieza que se crea sola; cobros pendientes visibles; sincroniza iCal con Airbnb/Booking; no se puede reservar dos veces la misma fecha.
**Promesas que NO:** ocupación, ingresos o resultados económicos garantizados.

## 5. Direcciones
- Landing: https://stayflow-web-livid.vercel.app (+ `/products/<app>`, `/l/host|guest|profit`, `/privacidad`, `/terminos`, `/reembolsos`)
- Apps: host `stayflow-host.vercel.app` · guest `stayflow-guest-eight.vercel.app` · business `stayflow-profit.vercel.app` · operations `stayflow-operations.vercel.app`
- Código: GitHub `nahuelsummerdreams/Digital-studio-Stayflow` (privado), rama `claude/quirky-albattani-cthzld`.

## 6. Lo que FALTA (en este orden)
1. **Cobro** (Impultienda sin verificar / Lemon Squeezy / Paddle) + **activación automática de licencias** + página de gracias + emails de bienvenida. **Es el bloqueo.**
2. Datos para Meta: ID del Píxel, verificación de dominio, email de contacto en las páginas legales, API de Conversiones.
3. Landing de anuncio `/l/host` de una sola oferta; video corto de Host funcionando; prueba social real.
4. Revisión legal; dominio propio; borrar datos de prueba (`e2e-*`) de producción.
5. Instaladores (Windows/Mac, firmados), integración continua, monitoreo, pruebas en celulares reales.
6. Idiomas (EN/PT); equipo con varios usuarios; las 5 apps "Próximamente" (orden sugerido: Listing, AI, resto según el "Avísame").

## 7. Preguntas abiertas
País/mercado inicial · plataforma de cobro · ¿el Megapack incluye apps futuras? · qué cubre exactamente el soporte · quién puede probar Host esta semana.

## 8. Reglas de trabajo con la IA
- No halagar: señalar riesgos y proponer algo mejor.
- Explicar el porqué de cada decisión creativa o comercial.
- Verificar antes de afirmar ("hecho" = lo ejecuté y lo vi; "no verificado" se dice).
- Nada de datos personales ni claves en documentos externos.
