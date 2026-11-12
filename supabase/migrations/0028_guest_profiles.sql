-- Guest profiles ("ficha"): what the host knows about a person beyond their bookings.
-- A guest is still the person behind the bookings (same email, or same name when there is no email): the profile hangs from that
-- identity key, so nothing about bookings changes and nothing can be lost. Profiles are created the first time the host saves one.
-- Events are the guest's timeline: notes and incidents.

create or replace function public.tags_ok(p_tags text[])
returns boolean
language sql immutable
as $$
  select coalesce(bool_and(char_length(x) between 1 and 30), true) from unnest(p_tags) as x;
$$;

create table public.guest_profiles (
  org_id      uuid not null references public.organizations (id) on delete cascade,
  guest_key   text not null check (char_length(guest_key) between 1 and 200),
  document    text not null default '' check (char_length(document) <= 60),
  notes       text not null default '' check (char_length(notes) <= 2000),
  preferences text not null default '' check (char_length(preferences) <= 1000),
  vip         boolean not null default false,
  tags        text[] not null default '{}' check (cardinality(tags) <= 10 and public.tags_ok(tags)),
  updated_at  timestamptz not null default now(),
  primary key (org_id, guest_key)
);

create table public.guest_events (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations (id) on delete cascade,
  guest_key  text not null check (char_length(guest_key) between 1 and 200),
  kind       text not null check (kind in ('note', 'incident')),
  body       text not null check (char_length(body) between 1 and 1000),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index guest_events_guest_idx on public.guest_events (org_id, guest_key, created_at desc);

alter table public.guest_profiles enable row level security;
alter table public.guest_events   enable row level security;

create policy guest_profiles_select on public.guest_profiles
  for select to authenticated using (public.has_product_access(org_id, 'host'));
create policy guest_profiles_write on public.guest_profiles
  for all to authenticated
  using (public.has_product_access(org_id, 'host') and public.has_org_role(org_id, array['owner','admin','member']::public.org_role[]))
  with check (public.has_product_access(org_id, 'host') and public.has_org_role(org_id, array['owner','admin','member']::public.org_role[]));

create policy guest_events_select on public.guest_events
  for select to authenticated using (public.has_product_access(org_id, 'host'));
create policy guest_events_write on public.guest_events
  for all to authenticated
  using (public.has_product_access(org_id, 'host') and public.has_org_role(org_id, array['owner','admin','member']::public.org_role[]))
  with check (public.has_product_access(org_id, 'host') and public.has_org_role(org_id, array['owner','admin','member']::public.org_role[]));

-- who wrote an event, and keep updated_at honest
create or replace function public.guest_stamp()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_table_name = 'guest_events' then
    new.created_by := auth.uid();
  else
    new.updated_at := clock_timestamp();
  end if;
  return new;
end;
$$;
create trigger guest_profiles_stamp before insert or update on public.guest_profiles for each row execute function public.guest_stamp();
create trigger guest_events_stamp   before insert on public.guest_events   for each row execute function public.guest_stamp();
