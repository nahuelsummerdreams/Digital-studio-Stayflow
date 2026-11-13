---
tipo: registro
actualizado: 2026-11-12
---
# Registro de decisiones

> Formato: **fecha · decisión** — por qué · alternativas · estado. No se borran; se marcan como reemplazadas.

- **2026-11 · Pago único, sin mensualidad** — encaja con el público y simplifica la venta. Alternativa: suscripción. Vigente.
- **2026-11 · Solo vender lo que existe; lo demás "Próximamente"** — evita reclamos y mide demanda con "Avísame". Alternativa: preventa (descartada por riesgo de reembolsos). Vigente.
- **2026-11 · Modelo en línea; instalador = envoltorio** — un solo código, sin migraciones. Alternativa: programa sin internet (descartada por ahora: sin celular, rompe guía/QR/equipo, más soporte). Vigente.
- **2026-11 · Profit se llama ahora Business** — nombre más amplio (ingresos, gastos, ganancia). Ids internos siguen `profit`. Vigente.
- **2026-11 · Packs: Esencial y Megapack (todas las apps a la venta)** — el "Profesional" duplicaba contenido. Vigente.
- **2026-11 · "De por vida" → 12 meses de actualizaciones + renovación opcional USD 10/año** — sostenibilidad. La app **nunca se bloquea** por no renovar. Vigente. Pendiente: mecanismo técnico.
- **2026-11 · Landing como embudo alrededor de Host** — una promesa, 6.500 px. Vigente. Ver [[Landing - estructura y copy]].
- **2026-11 · Promoción única solo con cierre real** — nada de urgencia falsa (Meta y ley). Vigente.
- **2026-11 · Garantía de 14 días** — supuesto propio. `[VERIFICAR con abogado]`.
- **2026-11-12 · Sin prueba gratis; acceso por código de licencia** — el producto se vende con pago único y garantía de 14 días, no con prueba. Cada compra entrega un código `SF-XXXX-XXXX-XXXX` (uno o varios productos) que el cliente pega al entrar; se activa al instante, no vence y registra 12 meses de actualizaciones (`updates_until`). Alternativas: prueba de 14 días (descartada), cuenta creada por webhook (queda para cuando exista el cobro). Vigente.
- **2026-11-12 · Registro sin confirmar el correo** — el cliente entra directo tras llenar el formulario (Confirm email apagado en Supabase); se pide el correo dos veces. Falta captcha antes de abrirlo al público. Vigente.
- **2026-11-12 · Categorías como perfiles dentro de Host** — Rentals, Hotels, Cabins & Resorts y Hostels son un perfil de la organización (`lodging_type` + `org_modules`), no apps nuevas; Guest, Business y Operations siguen siendo complementos. Aplicada por defecto como recomendación de la auditoría; **pendiente de confirmar**.
- **2026-11-12 · Rama hotel/hostel integrada** — `feat/hotel-hostel` se integró en la rama principal con pruebas SQL; las migraciones 0024 y 0025 ya estaban en producción. Pendiente de confirmar quién hace los merges.
- **2026-11-12 · Cambio de categoría sin perder datos** — solo adapta módulos del menú; reservas, huéspedes y pagos no se tocan; se bloquea si hay habitaciones o camas que la nueva categoría no admite.


- **2026-11-13 · Se elimina la renovación de USD 10/año** — pago único, 12 meses de actualizaciones incluidos y sin cargos después. Packs: Esencial 69 y Megapack 89 (antes 72,80 y 93,10). Host a 38 como precio de lanzamiento de noviembre: pendiente de confirmar fecha, cupo y medio de cobro.
- **2026-11-13 · Objetivo: vender a otros países** — se prefiere una plataforma que sea comerciante de registro (impuestos por país) → Whop vs Impultienda en [[Pasarela de pago - decisión]]. Pendiente de elegir.
- **2026-11-13 · Panel sectorizado por categoría** — cada categoría usa su vocabulario y su forma de agregar unidades (hotel: habitaciones por tipo y tarifa; hostel: dormitorios y camas; cabañas: en cantidad; rentals: propiedades). La categoría se elige primero (alta en dos pasos) y queda arriba del panel. Vigente.
- **2026-11-13 · Roles con registro** — invitaciones por enlace sin envío automático; solo el propietario cambia roles; auditoría de equipo, reservas eliminadas y devoluciones. Vigente.
