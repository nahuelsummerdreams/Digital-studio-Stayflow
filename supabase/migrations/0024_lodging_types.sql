-- Hotel and hostel support (v1): lodging type per organization + units (rooms, beds) as child properties.
-- A room or a bed is a row of public.properties with a parent. Bookings, anti double-booking, cleaning
-- and finances keep working unchanged: a unit is reserved exactly like an apartment is today.
-- Existing organizations stay 'rental' and nothing about them changes.

create type public.lodging_type as enum ('rental', 'hotel', 'hostel');

alter table public.organizations
  add column lodging_type public.lodging_type not null default 'rental';

alter table public.properties
  add column parent_id     uuid references public.properties (id) on delete cascade,
  add column unit_kind     text check (unit_kind in ('room', 'bed')),
  add column room_category text check (char_length(room_category) <= 60),
  add column base_rate_minor bigint check (base_rate_minor is null or base_rate_minor >= 0),
  -- a unit has a parent, a top-level property does not
  add constraint properties_unit_shape check ((parent_id is null) = (unit_kind is null)),
  add constraint properties_not_own_parent check (parent_id is null or parent_id <> id);

create index properties_parent_idx on public.properties (parent_id) where parent_id is not null;

-- Rules for the tree: same organization, rooms hang from an establishment, beds hang from a room,
-- and beds only exist in a hostel. Hotels only have rooms.
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
    if v_type = 'rental' then
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

create trigger properties_tree
  before insert or update of parent_id, unit_kind, org_id on public.properties
  for each row execute function public.assert_property_tree();

-- Changing the lodging type is only allowed while the organization has no units.
create or replace function public.assert_lodging_type_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.lodging_type is distinct from old.lodging_type
     and exists (select 1 from public.properties p where p.org_id = new.id and p.parent_id is not null) then
    raise exception 'remove the rooms and beds before changing the lodging type' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger organizations_lodging_type
  before update of lodging_type on public.organizations
  for each row execute function public.assert_lodging_type_change();
