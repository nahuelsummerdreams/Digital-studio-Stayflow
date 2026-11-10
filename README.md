# Stayflow by Digital Studio

Modular tools for vacation rental hosts. Each app is sold on its own; the **Suite** bundles them all.

## Architecture

```
apps/
  profit/        Stayflow Profit (Next.js PWA)       <- first sellable app
  guest/ host/   next
  suite/         loads every module (built last)
packages/
  modules/       one package per product's logic (profit, guest, host...)
  licensing/     product + plan catalog, access rules (single source of truth)
  auth/          Supabase client, one account across all apps
  ui/            Tailwind preset + per-product brand
supabase/
  migrations/    multi-tenant schema with Row Level Security
```

**Rule:** features live in `packages/modules/*`. An app is a thin shell that loads the modules it sells.
Profit alone and Profit inside the Suite run the same code; the license decides what is unlocked
(a `suite` license unlocks every module).

## Run it

```bash
pnpm install
pnpm test          # logic + licensing tests
pnpm typecheck
pnpm dev:profit    # http://localhost:3001
```

Copy `.env.example` to `.env.local` and fill the Supabase values to connect real data.

## Data model (supabase/migrations)

- `organizations` / `memberships` / `properties`: tenant isolation. Every row belongs to an org.
- `income_entries` / `expense_entries`: money in integer cents.
- `licenses`: what each org bought. Writable only by the billing webhook (service role).
- RLS everywhere; Profit tables additionally require a valid license (`has_product_access`).

## Supabase project

- Project `stayflow` (ref `eigsajmshgrmnhascghr`, region `us-east-1`). One project for every customer; tenants are isolated by RLS.
- Migrations `0001`-`0005` are applied. Keep `supabase/migrations` in sync with the remote.
- `supabase/tests/rls_isolation.sql` checks tenant isolation and license gating (14 checks, rolls itself back). Run it after any policy change.
- Keys are not committed. Get the URL and publishable key from the Supabase dashboard (Settings > API) and put them in `apps/profit/.env.local`.

## Roadmap

1. Base + **Profit** (this commit) 
2. Auth screens, real data, billing webhook, landing + checkout
3. **Guest** (QR guides), then **Host**
4. AI, Listing, Operations
5. **Suite** + desktop installers (Tauri wrapper around the same web apps)
