-- Rentals completion: structured property sheet (capacity, amenities, rules, access) and incidents with maintenance cost.

-- Kept apart from `properties` on purpose: access notes (codes) must never travel with the public listing of a property.
create table public.property_details (
  property_id   uuid primary key references public.properties (id) on delete cascade,
  org_id        uuid not null references public.organizations (id) on delete cascade,
  capacity      smallint check (capacity between 1 and 500),
  bedrooms      smallint check (bedrooms between 0 and 100),
  beds          smallint check (beds between 0 and 500),
  bathrooms     numeric(3, 1) check (bathrooms between 0 and 50),
  amenities     text[] not null default '{}' check (cardinality(amenities) <= 40),
  house_rules   text not null default '' check (char_length(house_rules) <= 2000),
  checkin_time  text not null default '' check (char_length(checkin_time) <= 10),
  checkout_time text not null default '' check (char_length(checkout_time) <= 10),
  access_notes  text not null default '' check (char_length(access_notes) <= 1000),
  updated_at    timestamptz not null default now()
);
alter table public.property_details enable row level security;
create policy property_details_select on public.property_details
  for select to authenticated using (public.has_product_access(org_id, 'host'));
create policy property_details_write on public.property_details
  for all to authenticated
  using (public.has_product_access(org_id, 'host') and public.has_org_role(org_id, array['owner','admin','member']::public.org_role[]))
  with check (public.has_product_access(org_id, 'host') and public.has_org_role(org_id, array['owner','admin','member']::public.org_role[]));
create trigger property_details_property_org before insert or update on public.property_details
  for each row execute function public.assert_property_in_org();

create table public.property_incidents (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organizations (id) on delete cascade,
  property_id  uuid not null references public.properties (id) on delete cascade,
  title        text not null check (char_length(title) between 1 and 160),
  detail       text not null default '' check (char_length(detail) <= 2000),
  status       text not null default 'open' check (status in ('open', 'in_progress', 'resolved')),
  priority     smallint not null default 1 check (priority between 0 and 2),
  cost_minor   bigint not null default 0 check (cost_minor >= 0),
  assignee_id  uuid references auth.users (id) on delete set null,
  reported_by  uuid references auth.users (id) on delete set null default auth.uid(),
  created_at   timestamptz not null default now(),
  resolved_at  timestamptz
);
create index property_incidents_org_idx on public.property_incidents (org_id, status, created_at desc);
create index property_incidents_property_idx on public.property_incidents (property_id);
alter table public.property_incidents enable row level security;
create policy property_incidents_select on public.property_incidents
  for select to authenticated using (public.has_product_access(org_id, 'host'));
create policy property_incidents_write on public.property_incidents
  for all to authenticated
  using (public.has_product_access(org_id, 'host') and public.has_org_role(org_id, array['owner','admin','member']::public.org_role[]))
  with check (public.has_product_access(org_id, 'host') and public.has_org_role(org_id, array['owner','admin','member']::public.org_role[]));
create trigger property_incidents_property_org before insert or update on public.property_incidents
  for each row execute function public.assert_property_in_org();
create trigger property_incidents_assignee before insert or update of assignee_id on public.property_incidents
  for each row execute function public.assert_task_assignee();

create or replace function public.incident_stamp()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'resolved' and (tg_op = 'INSERT' or old.status is distinct from 'resolved') then
    new.resolved_at := clock_timestamp();
  elsif new.status <> 'resolved' then
    new.resolved_at := null;
  end if;
  return new;
end;
$$;
create trigger property_incidents_stamp before insert or update of status on public.property_incidents
  for each row execute function public.incident_stamp();

-- Sends the cost of an incident to Profit as a maintenance expense, once. Not security definer: Profit's own policies apply.
alter table public.expense_entries add column incident_id uuid references public.property_incidents (id) on delete set null;
create unique index expense_incident_uidx on public.expense_entries (incident_id) where incident_id is not null;

create or replace function public.incident_to_expense(p_incident uuid)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  i public.property_incidents%rowtype;
  v_id uuid;
begin
  select * into i from public.property_incidents where id = p_incident;
  if not found then raise exception 'incident not found' using errcode = '42501'; end if;
  if i.cost_minor <= 0 then raise exception 'incident has no cost' using errcode = '22023'; end if;
  insert into public.expense_entries (org_id, property_id, category, amount_minor, incurred_on, description, created_by, incident_id)
  values (i.org_id, i.property_id, 'maintenance', i.cost_minor, coalesce(i.resolved_at::date, current_date), left('Incidencia: ' || i.title, 200), auth.uid(), i.id)
  on conflict (incident_id) where incident_id is not null do nothing
  returning id into v_id;
  return v_id;
end;
$$;
revoke execute on function public.incident_to_expense(uuid) from public, anon;
grant  execute on function public.incident_to_expense(uuid) to authenticated;
