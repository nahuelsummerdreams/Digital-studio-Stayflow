# Stayflow by Digital Studio

Modular tools for vacation rental hosts. Each app is sold on its own; the **Suite** bundles them all.

## Architecture

```
apps/
  web/           Landing page (static, Spanish)       http://localhost:3000
  profit/        Stayflow Profit (PWA)                http://localhost:3001
  guest/         Stayflow Guest (PWA + public /g/<link>)  http://localhost:3002
  guest/ host/   next
  suite/         loads every module (built last)
packages/
  modules/       one package per product's logic (profit, guest, host...)
  shell/         sign in -> business -> trial -> app frame + Digital Studio seal, shared by every app
  licensing/     product + plan catalog, access rules (single source of truth)
  auth/          Supabase client, one account across all apps
  ui/            Tailwind preset + per-product brand
supabase/
  migrations/    multi-tenant schema with Row Level Security
```

**Rule:** features live in `packages/modules/*`. An app is a thin shell that loads the modules it sells.
Profit alone and Profit inside the Suite run the same code; the license decides what is unlocked
(a `suite` license unlocks every module).

## Adding a new app

1. Migration with its tables (RLS requires `has_product_access(org_id, '<product>')`) and a SQL test.
2. `packages/modules/<name>`: data layer, screens, pure logic with tests.
3. `apps/<name>`: copy `apps/guest`, set `product="<name>"` in `AppShell`, list its nav items.
Sign-in, trial, license check, theme switcher and the Digital Studio seal come from `@stayflow/shell`.

## Guest guides (public access)

Guests are not signed in, so the guide tables are never public. The only public door is the SQL function
`get_public_guide(slug)`: published guide + valid Guest license, slug is random and can be rotated.
The Supabase advisor flags it as "anon can execute a SECURITY DEFINER function": that is intentional.

## Language

Everything is Spanish for now (neutral, "tú"). Texts live in `packages/i18n/src/es.ts`, never inside
components. To add English: create `en.ts` typed as `Messages` (a missing key will not compile), register
it in `CATALOG`, and add a language switch. Amounts, dates and percentages already follow the locale.

## Run it

```bash
pnpm install
pnpm test          # logic + licensing tests
pnpm typecheck
pnpm dev:profit    # http://localhost:3001
pnpm dev:web       # http://localhost:3000 (landing)
pnpm dev:guest     # http://localhost:3002
```

Copy `.env.example` to `.env.local` and fill the Supabase values to connect real data.
The landing reads `NEXT_PUBLIC_PROFIT_URL` (see `apps/web/.env.example`) to know where its buttons lead.

## Data model (supabase/migrations)

- `organizations` / `memberships` / `properties`: tenant isolation. Every row belongs to an org.
- `income_entries` / `expense_entries`: money in integer cents.
- `licenses`: what each org bought. Writable only by the billing webhook (service role).
- RLS everywhere; Profit tables additionally require a valid license (`has_product_access`).

## Supabase project

- Project `stayflow` (ref `eigsajmshgrmnhascghr`, region `us-east-1`). One project for every customer; tenants are isolated by RLS.
- Migrations `0001`-`0008` are applied. Keep `supabase/migrations` in sync with the remote.
- `supabase/tests/rls_isolation.sql` (14 checks) and `supabase/tests/recurring_expenses.sql` (9) and `supabase/tests/guest_guides.sql` (16) roll themselves back. Run them after any policy or function change.
- Keys are not committed. Get the URL and publishable key from the Supabase dashboard (Settings > API) and put them in `apps/profit/.env.local`.

## Roadmap

1. Base + **Profit** (this commit) 
2. Auth screens, real data, billing webhook, landing + checkout
3. **Guest** (QR guides), then **Host**
4. AI, Listing, Operations
5. **Suite** + desktop installers (Tauri wrapper around the same web apps)
