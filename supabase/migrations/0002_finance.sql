-- Stayflow Profit data. Money is stored as integer minor units (cents) to avoid float drift.

create type public.expense_category as enum (
  'platform_commission', 'cleaning', 'utilities', 'maintenance',
  'supplies', 'taxes', 'insurance', 'mortgage_rent', 'marketing', 'other'
);

create type public.income_source as enum ('airbnb', 'booking', 'vrbo', 'direct', 'other');

create table public.income_entries (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations (id) on delete cascade,
  property_id   uuid not null references public.properties (id) on delete cascade,
  source        public.income_source not null default 'other',
  amount_minor  bigint not null check (amount_minor >= 0),
  nights        integer not null default 0 check (nights >= 0),
  guest_name    text,
  check_in      date,
  check_out     date,
  received_on   date not null default current_date,
  notes         text,
  created_by    uuid references auth.users (id),
  created_at    timestamptz not null default now(),
  check (check_out is null or check_in is null or check_out >= check_in)
);
create index income_org_date_idx      on public.income_entries (org_id, received_on desc);
create index income_property_idx      on public.income_entries (property_id);

create table public.expense_entries (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations (id) on delete cascade,
  -- null property = shared cost across the whole organization
  property_id   uuid references public.properties (id) on delete cascade,
  category      public.expense_category not null default 'other',
  amount_minor  bigint not null check (amount_minor >= 0),
  recurring     boolean not null default false,
  incurred_on   date not null default current_date,
  description   text,
  created_by    uuid references auth.users (id),
  created_at    timestamptz not null default now()
);
create index expense_org_date_idx     on public.expense_entries (org_id, incurred_on desc);
create index expense_property_idx     on public.expense_entries (property_id);

-- A row can only point at a property of its own organization.
create or replace function public.assert_property_in_org()
returns trigger
language plpgsql
as $$
begin
  if new.property_id is not null and not exists (
    select 1 from public.properties p
    where p.id = new.property_id and p.org_id = new.org_id
  ) then
    raise exception 'property does not belong to organization';
  end if;
  return new;
end;
$$;

create trigger income_property_org
  before insert or update on public.income_entries
  for each row execute function public.assert_property_in_org();
create trigger expense_property_org
  before insert or update on public.expense_entries
  for each row execute function public.assert_property_in_org();

alter table public.income_entries  enable row level security;
alter table public.expense_entries enable row level security;

create policy income_select on public.income_entries
  for select using (public.is_org_member(org_id));
create policy income_write on public.income_entries
  for all using (public.has_org_role(org_id, array['owner','admin','member']::public.org_role[]))
  with check (public.has_org_role(org_id, array['owner','admin','member']::public.org_role[]));

create policy expense_select on public.expense_entries
  for select using (public.is_org_member(org_id));
create policy expense_write on public.expense_entries
  for all using (public.has_org_role(org_id, array['owner','admin','member']::public.org_role[]))
  with check (public.has_org_role(org_id, array['owner','admin','member']::public.org_role[]));
