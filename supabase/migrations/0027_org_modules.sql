-- The category (lodging type) decides which modules an organization sees.
--  * lodging_profiles: which modules each category starts with (public, read-only for clients; managed by the seller).
--  * org_modules: the modules an organization actually has. 'profile' rows follow the category; 'manual' rows are set by the seller and survive a category change.
--  * Changing the category only adapts modules. It never deletes bookings, guests, finances or any other data.
--  * lodging_type_changes: who changed the category, from what, to what, when.
-- Only modules that exist in the product are listed. New modules are added by the migration that delivers them.

create table public.lodging_profiles (
  lodging_type public.lodging_type not null,
  module       text not null check (module ~ '^[a-z_]{2,40}$'),
  sort         integer not null default 0,
  primary key (lodging_type, module)
);
alter table public.lodging_profiles enable row level security;
create policy lodging_profiles_read on public.lodging_profiles for select to authenticated using (true);

create table public.org_modules (
  org_id     uuid not null references public.organizations (id) on delete cascade,
  module     text not null check (module ~ '^[a-z_]{2,40}$'),
  enabled    boolean not null default true,
  source     text not null default 'profile' check (source in ('profile', 'manual')),
  updated_at timestamptz not null default now(),
  primary key (org_id, module)
);
alter table public.org_modules enable row level security;
create policy org_modules_read on public.org_modules for select to authenticated using (public.is_org_member(org_id));
-- no write policies: only the category triggers and the seller (service role) write here

create table public.lodging_type_changes (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations (id) on delete cascade,
  from_type  public.lodging_type,
  to_type    public.lodging_type not null,
  changed_by uuid references auth.users (id) on delete set null,
  changed_at timestamptz not null default now()
);
alter table public.lodging_type_changes enable row level security;
create policy lodging_type_changes_read on public.lodging_type_changes
  for select to authenticated using (public.has_org_role(org_id, array['owner','admin']::public.org_role[]));

-- Starting modules per category. Rentals and cabins share today's tools; hotels and hostels add reception and drop calendar sync.
insert into public.lodging_profiles (lodging_type, module, sort)
select t::public.lodging_type, m, row_number() over (partition by t order by o)
from (values
  ('rental', 'dashboard', 1), ('rental', 'bookings', 2), ('rental', 'calendar', 3), ('rental', 'guests', 4), ('rental', 'tasks', 5),
  ('rental', 'messages', 6), ('rental', 'reports', 7), ('rental', 'channels', 8), ('rental', 'properties', 9),
  ('cabins', 'dashboard', 1), ('cabins', 'bookings', 2), ('cabins', 'calendar', 3), ('cabins', 'guests', 4), ('cabins', 'tasks', 5),
  ('cabins', 'messages', 6), ('cabins', 'reports', 7), ('cabins', 'channels', 8), ('cabins', 'properties', 9),
  ('hotel', 'dashboard', 1), ('hotel', 'bookings', 2), ('hotel', 'calendar', 3), ('hotel', 'reception', 4), ('hotel', 'guests', 5),
  ('hotel', 'tasks', 6), ('hotel', 'messages', 7), ('hotel', 'reports', 8), ('hotel', 'properties', 9),
  ('hostel', 'dashboard', 1), ('hostel', 'bookings', 2), ('hostel', 'calendar', 3), ('hostel', 'reception', 4), ('hostel', 'guests', 5),
  ('hostel', 'tasks', 6), ('hostel', 'messages', 7), ('hostel', 'reports', 8), ('hostel', 'properties', 9)
) as v(t, m, o);

-- Adapts an organization's modules to its category. Manual rows are left alone.
create or replace function public.apply_lodging_profile(p_org uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_type public.lodging_type;
begin
  select lodging_type into v_type from public.organizations where id = p_org;
  if not found then return; end if;
  delete from public.org_modules
   where org_id = p_org and source = 'profile'
     and module not in (select module from public.lodging_profiles where lodging_type = v_type);
  insert into public.org_modules (org_id, module, enabled, source)
  select p_org, module, true, 'profile' from public.lodging_profiles where lodging_type = v_type
  on conflict (org_id, module) do update
    set enabled = case when public.org_modules.source = 'profile' then true else public.org_modules.enabled end,
        updated_at = now();
end;
$$;
revoke execute on function public.apply_lodging_profile(uuid) from public, anon, authenticated;

-- A new organization, or a category change, adapts the modules and leaves a record of the change.
create or replace function public.on_lodging_type_set()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    insert into public.lodging_type_changes (org_id, from_type, to_type, changed_by) values (new.id, old.lodging_type, new.lodging_type, auth.uid());
  end if;
  perform public.apply_lodging_profile(new.id);
  return new;
end;
$$;
revoke execute on function public.on_lodging_type_set() from public, anon, authenticated;

create trigger organizations_apply_profile_ins after insert on public.organizations
  for each row execute function public.on_lodging_type_set();
create trigger organizations_apply_profile_upd after update of lodging_type on public.organizations
  for each row when (old.lodging_type is distinct from new.lodging_type) execute function public.on_lodging_type_set();

-- Existing organizations keep exactly what they have today: they get the modules of their category.
do $$
declare o record;
begin
  for o in select id from public.organizations loop
    perform public.apply_lodging_profile(o.id);
  end loop;
end $$;

-- A category change must not strand data: rooms are fine in a hotel or hostel, beds only in a hostel,
-- and a category without units (rentals, cabins) needs the units moved or removed first.
create or replace function public.assert_lodging_type_change()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_rooms integer;
  v_beds  integer;
begin
  if new.lodging_type is distinct from old.lodging_type then
    select count(*) filter (where unit_kind = 'room'), count(*) filter (where unit_kind = 'bed')
      into v_rooms, v_beds
      from public.properties where org_id = new.id and parent_id is not null;
    if new.lodging_type in ('rental', 'cabins') and v_rooms + v_beds > 0 then
      raise exception 'remove the rooms and beds before changing to this category' using errcode = '23514';
    end if;
    if new.lodging_type = 'hotel' and v_beds > 0 then
      raise exception 'remove the beds before changing to a hotel' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

-- What a change would do, before doing it: allowed or why not, and which modules turn on or off.
create or replace function public.lodging_change_preview(p_org uuid, p_type public.lodging_type)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_cur public.lodging_type;
  v_rooms integer;
  v_beds integer;
  v_reason text := null;
  v_on text[];
  v_off text[];
begin
  if not public.has_org_role(p_org, array['owner','admin']::public.org_role[]) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  select lodging_type into v_cur from public.organizations where id = p_org;
  select count(*) filter (where unit_kind = 'room'), count(*) filter (where unit_kind = 'bed')
    into v_rooms, v_beds from public.properties where org_id = p_org and parent_id is not null;
  if p_type in ('rental', 'cabins') and v_rooms + v_beds > 0 then v_reason := 'has_units';
  elsif p_type = 'hotel' and v_beds > 0 then v_reason := 'has_beds'; end if;
  select coalesce(array_agg(module order by sort), '{}') into v_on from public.lodging_profiles
    where lodging_type = p_type and module not in (select module from public.org_modules where org_id = p_org and enabled);
  select coalesce(array_agg(module), '{}') into v_off from public.org_modules m
    where m.org_id = p_org and m.enabled and m.source = 'profile'
      and m.module not in (select module from public.lodging_profiles where lodging_type = p_type);
  return jsonb_build_object('current', v_cur, 'target', p_type, 'allowed', v_reason is null, 'reason', v_reason,
                            'rooms', v_rooms, 'beds', v_beds, 'enable', v_on, 'disable', v_off);
end;
$$;
revoke execute on function public.lodging_change_preview(uuid, public.lodging_type) from public, anon;
grant  execute on function public.lodging_change_preview(uuid, public.lodging_type) to authenticated;

-- Rooms and beds exist only in hotels and hostels (cabins and rentals keep their units as top-level properties for now).
create or replace function public.assert_property_tree()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_parent public.properties;
  v_type   public.lodging_type;
begin
  if new.parent_id is null then
    return new;
  end if;

  select * into v_parent from public.properties where id = new.parent_id;
  if not found or v_parent.org_id <> new.org_id then
    raise exception 'parent does not belong to organization' using errcode = '23514';
  end if;

  select o.lodging_type into v_type from public.organizations o where o.id = new.org_id;

  if new.unit_kind = 'room' then
    if v_parent.parent_id is not null then
      raise exception 'a room hangs from an establishment, not from another unit' using errcode = '23514';
    end if;
    if v_type in ('rental', 'cabins') then
      raise exception 'rooms need a hotel or hostel organization' using errcode = '23514';
    end if;
  elsif new.unit_kind = 'bed' then
    if v_type <> 'hostel' then
      raise exception 'beds only exist in a hostel' using errcode = '23514';
    end if;
    if v_parent.unit_kind is distinct from 'room' then
      raise exception 'a bed hangs from a room' using errcode = '23514';
    end if;
  end if;

  -- changing the parent of a row that already has children could break the depth rule
  if tg_op = 'UPDATE' and (new.parent_id is distinct from old.parent_id or new.unit_kind is distinct from old.unit_kind)
     and exists (select 1 from public.properties c where c.parent_id = new.id) then
    raise exception 'move the children first' using errcode = '23514';
  end if;
  return new;
end;
$$;

