-- 1) An inquiry is a question, not a reservation: it holds no dates, creates no cleaning and is not published to other platforms.
--    A pending booking holds its dates until it is confirmed or canceled.
alter table public.bookings drop constraint bookings_no_overlap;
alter table public.bookings add constraint bookings_no_overlap exclude using gist (
  property_id with =,
  daterange(check_in, check_out) with &&
) where (status not in ('canceled', 'inquiry'));

create or replace function public.ical_feed(p_token uuid)
returns table (uid text, check_in date, check_out date, is_block boolean)
language sql stable security definer set search_path = public
as $$
  select b.id::text, b.check_in, b.check_out, (b.kind = 'block')
  from public.bookings b
  join public.properties p on p.id = b.property_id
  where p.ical_token = p_token
    and p.archived_at is null
    and b.status not in ('canceled', 'inquiry')
    and b.check_out >= current_date - 30;
$$;
revoke execute on function public.ical_feed(uuid) from public;
grant  execute on function public.ical_feed(uuid) to anon, authenticated;

create or replace function public.sync_cleaning_task()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_title text := 'Limpieza tras la salida de ' || left(new.guest_name, 80);
  v_is_bed boolean := exists (select 1 from public.properties p where p.id = new.property_id and p.unit_kind = 'bed');
begin
  if new.kind <> 'stay' or new.status in ('canceled', 'inquiry') or v_is_bed then
    delete from public.host_tasks where booking_id = new.id and not done;
    return new;
  end if;
  update public.host_tasks
     set due_on = new.check_out, title = v_title, property_id = new.property_id
   where booking_id = new.id and not done;
  if not found and not exists (select 1 from public.host_tasks where booking_id = new.id) then
    insert into public.host_tasks (org_id, property_id, title, due_on, booking_id, created_by)
    values (new.org_id, new.property_id, v_title, new.check_out, new.id, new.created_by);
  end if;
  return new;
end;
$$;
revoke execute on function public.sync_cleaning_task() from public, anon, authenticated;

create or replace function public.ops_sync_bookings(p_org uuid)
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  v_added integer;
begin
  if not public.has_product_access(p_org, 'operations') then
    raise exception 'operations license required' using errcode = '42501';
  end if;

  insert into public.ops_jobs (org_id, property_id, kind, title, due_on, checklist, booking_id)
  select b.org_id, b.property_id, 'cleaning', 'Limpieza tras ' || left(b.guest_name, 100), b.check_out,
         public.ops_items_to_checklist(coalesce(
           (select c.items from public.ops_checklists c where c.org_id = b.org_id and c.kind = 'cleaning' and c.property_id = b.property_id order by c.created_at limit 1),
           (select c.items from public.ops_checklists c where c.org_id = b.org_id and c.kind = 'cleaning' and c.property_id is null order by c.created_at limit 1),
           public.ops_default_cleaning())),
         b.id
  from public.bookings b
  join public.properties pr on pr.id = b.property_id
  where b.org_id = p_org and b.kind = 'stay' and b.status not in ('canceled', 'inquiry')
    and pr.unit_kind is distinct from 'bed'
    and b.check_out between current_date - 1 and current_date + 90
  on conflict (booking_id, kind) do nothing;
  get diagnostics v_added = row_count;

  update public.ops_jobs j
     set due_on = b.check_out,
         title = 'Limpieza tras ' || left(b.guest_name, 100),
         next_checkin = (select min(n.check_in) from public.bookings n
                          where n.property_id = b.property_id and n.kind = 'stay' and n.status not in ('canceled', 'inquiry') and n.check_in >= b.check_out)
    from public.bookings b
   where j.booking_id = b.id and j.org_id = p_org and j.kind = 'cleaning' and j.status <> 'done' and b.status not in ('canceled', 'inquiry');

  delete from public.ops_jobs j
   using public.bookings b
   where j.booking_id = b.id and j.org_id = p_org and j.status <> 'done' and b.status in ('canceled', 'inquiry');

  return v_added;
end;
$$;
revoke execute on function public.ops_sync_bookings(uuid) from public, anon;
grant  execute on function public.ops_sync_bookings(uuid) to authenticated;

-- 2) History of every booking: who changed what, and when. Written by the database itself, so nothing can skip it.
create table public.booking_events (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations (id) on delete cascade,
  booking_id uuid not null references public.bookings (id) on delete cascade,
  kind       text not null check (kind in ('created', 'status', 'dates', 'amount', 'property')),
  from_value text,
  to_value   text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default clock_timestamp()
);
create index booking_events_booking_idx on public.booking_events (booking_id, created_at desc);
alter table public.booking_events enable row level security;
create policy booking_events_select on public.booking_events
  for select to authenticated using (public.has_product_access(org_id, 'host'));
-- no write policies: only the trigger writes

create or replace function public.log_booking_change()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.kind <> 'stay' then return new; end if;
  if tg_op = 'INSERT' then
    insert into public.booking_events (org_id, booking_id, kind, to_value, created_by) values (new.org_id, new.id, 'created', new.status::text, auth.uid());
    return new;
  end if;
  if new.status is distinct from old.status then
    insert into public.booking_events (org_id, booking_id, kind, from_value, to_value, created_by) values (new.org_id, new.id, 'status', old.status::text, new.status::text, auth.uid());
  end if;
  if new.check_in is distinct from old.check_in or new.check_out is distinct from old.check_out then
    insert into public.booking_events (org_id, booking_id, kind, from_value, to_value, created_by)
    values (new.org_id, new.id, 'dates', old.check_in::text || ' → ' || old.check_out::text, new.check_in::text || ' → ' || new.check_out::text, auth.uid());
  end if;
  if new.amount_minor is distinct from old.amount_minor then
    insert into public.booking_events (org_id, booking_id, kind, from_value, to_value, created_by) values (new.org_id, new.id, 'amount', old.amount_minor::text, new.amount_minor::text, auth.uid());
  end if;
  if new.property_id is distinct from old.property_id then
    insert into public.booking_events (org_id, booking_id, kind, from_value, to_value, created_by) values (new.org_id, new.id, 'property', old.property_id::text, new.property_id::text, auth.uid());
  end if;
  return new;
end;
$$;
revoke execute on function public.log_booking_change() from public, anon, authenticated;
create trigger bookings_history after insert or update on public.bookings
  for each row execute function public.log_booking_change();

-- Existing bookings start their history from when they were created.
insert into public.booking_events (org_id, booking_id, kind, to_value, created_by, created_at)
select org_id, id, 'created', status::text, created_by, created_at from public.bookings where kind = 'stay';
