-- Licensing: which products each organization has bought.
-- Written ONLY by the billing webhook (service role). Clients can read, never write.

create type public.product_key as enum (
  'host', 'guest', 'profit', 'ai', 'operations', 'listing', 'experiences', 'website', 'suite'
);
create type public.plan_key as enum ('starter', 'pro', 'business');
create type public.license_status as enum ('trialing', 'active', 'past_due', 'canceled');

create table public.licenses (
  id                     uuid primary key default gen_random_uuid(),
  org_id                 uuid not null references public.organizations (id) on delete cascade,
  product                public.product_key not null,
  plan                   public.plan_key not null,
  status                 public.license_status not null default 'trialing',
  current_period_end     timestamptz,
  billing_provider       text,
  billing_subscription_id text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  unique (org_id, product)
);
create index licenses_org_idx on public.licenses (org_id);

alter table public.licenses enable row level security;

create policy licenses_select on public.licenses
  for select using (public.is_org_member(org_id));
-- No insert/update/delete policies on purpose: only the service role bypasses RLS.

-- True when the org may use `p_product`. A 'suite' license unlocks every product.
create or replace function public.has_product_access(p_org uuid, p_product public.product_key)
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.is_org_member(p_org) and exists (
    select 1 from public.licenses l
    where l.org_id = p_org
      and l.product in (p_product, 'suite')
      and l.status in ('trialing', 'active', 'past_due')
      and (l.current_period_end is null or l.current_period_end > now())
  );
$$;

-- Paid data stays readable only while the license is valid.
-- Profit tables: tighten reads to licensed organizations.
drop policy income_select on public.income_entries;
create policy income_select on public.income_entries
  for select using (public.has_product_access(org_id, 'profit'));
drop policy income_write on public.income_entries;
create policy income_write on public.income_entries
  for all using (
    public.has_product_access(org_id, 'profit')
    and public.has_org_role(org_id, array['owner','admin','member']::public.org_role[])
  )
  with check (
    public.has_product_access(org_id, 'profit')
    and public.has_org_role(org_id, array['owner','admin','member']::public.org_role[])
  );

drop policy expense_select on public.expense_entries;
create policy expense_select on public.expense_entries
  for select using (public.has_product_access(org_id, 'profit'));
drop policy expense_write on public.expense_entries;
create policy expense_write on public.expense_entries
  for all using (
    public.has_product_access(org_id, 'profit')
    and public.has_org_role(org_id, array['owner','admin','member']::public.org_role[])
  )
  with check (
    public.has_product_access(org_id, 'profit')
    and public.has_org_role(org_id, array['owner','admin','member']::public.org_role[])
  );
