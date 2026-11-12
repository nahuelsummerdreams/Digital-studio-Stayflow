---
tipo: operaciones
actualizado: 2026-11-12
---
# Infraestructura (sin secretos)

**Código:** monorepo pnpm, Next.js 15 + React 19 + TypeScript + Tailwind, Supabase (Postgres, Auth, Storage, RLS), Vercel (un proyecto por app). Ramas: despliegue automático al subir.

| Pieza | Dirección |
|---|---|
| Landing | https://stayflow-web-livid.vercel.app |
| Host | https://stayflow-host.vercel.app |
| Guest | https://stayflow-guest-eight.vercel.app |
| Business | https://stayflow-profit.vercel.app |
| Operations | https://stayflow-operations.vercel.app |

**Base de datos:** un solo proyecto para todos los clientes y apps (cada negocio separado por RLS). Migraciones `0001…0018`; pruebas SQL en `supabase/tests`.
**Variables de entorno (solo nombres):** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_META_PIXEL_ID`, `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_PROMO_ENDS_AT`, `ANTHROPIC_API_KEY`, `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `DIGEST_FROM`.
**Plan de Supabase:** comprobar que sea de pago antes de vender (el gratuito pausa proyectos inactivos y no da respaldos diarios) `[VERIFICAR]`.
**Costo:** crece con usuarios activos, fotos y uso de IA; no hay que "ampliar la base" cada vez.
Dossier técnico completo: `docs/AUDITORIA-CHATGPT.md` en el repositorio.
