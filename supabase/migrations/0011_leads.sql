-- Leads from the commercial site: an email, where it came from, and what was in the cart.
-- Visitors can only INSERT. Nobody can read the table from the browser; the owner reads it with the service role.

create table public.leads (
  id          uuid primary key default gen_random_uuid(),
  email       text not null check (char_length(email) between 5 and 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  source      text not null check (source in ('checkout', 'plan-starter', 'plan-pro', 'plan-business')),
  items       jsonb check (items is null or pg_column_size(items) <= 2000),
  created_at  timestamptz not null default now()
);
create index leads_created_idx on public.leads (created_at desc);

alter table public.leads enable row level security;

create policy leads_insert on public.leads for insert to anon, authenticated with check (true);
revoke all on public.leads from anon, authenticated;
grant insert on public.leads to anon, authenticated;
