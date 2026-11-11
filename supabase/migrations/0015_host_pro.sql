-- Host, round 2: blocked dates, payments per booking, calendar sync (iCal in and out),
-- cleaning tasks that follow the bookings, and editable message templates.

-- ------------------------------------------------------------ bookings: blocks, payments, imported events
alter table public.bookings
  add column kind         text   not null default 'stay' check (kind in ('stay', 'block')),
  add column paid_minor   bigint not null default 0 check (paid_minor >= 0),
  add column external_uid text   check (external_uid is null or char_length(external_uid) <= 300),
  add constraint bookings_external_unique unique (property_id, external_uid);

-- ------------------------------------------------------------ properties: calendar sync
alter table public.properties
  add column ical_url       text check (ical_url is null or (char_length(ical_url) <= 600 and ical_url ~* '^https://')),
  add column ical_token     uuid not null default gen_random_uuid(),
  add column ical_synced_at timestamptz,
  add column ical_status    text check (ical_status is null or char_length(ical_status) <= 200);

-- Public feed for Airbnb / Booking / Google Calendar to read. Dates only, no guest data; the token is the key.
create or replace function public.ical_feed(p_token uuid)
returns table (uid text, check_in date, check_out date, is_block boolean)
language sql stable security definer set search_path = public
as $$
  select b.id::text, b.check_in, b.check_out, (b.kind = 'block')
  from public.bookings b
  join public.properties p on p.id = b.property_id
  where p.ical_token = p_token
    and p.archived_at is null
    and b.status <> 'canceled'
    and b.check_out >= current_date - 30;
$$;
revoke execute on function public.ical_feed(uuid) from public;
grant  execute on function public.ical_feed(uuid) to anon, authenticated;

-- ------------------------------------------------------------ cleaning tasks follow the bookings
alter table public.host_tasks
  add column booking_id uuid references public.bookings (id) on delete cascade;
create index host_tasks_booking_idx on public.host_tasks (booking_id);

create or replace function public.sync_cleaning_task()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_title text := 'Limpieza tras la salida de ' || left(new.guest_name, 80);
begin
  if new.kind <> 'stay' or new.status = 'canceled' then
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

create trigger bookings_cleaning
  after insert or update of check_out, status, guest_name, kind, property_id on public.bookings
  for each row execute function public.sync_cleaning_task();

-- ------------------------------------------------------------ message templates
create table public.host_templates (
  org_id     uuid not null references public.organizations (id) on delete cascade,
  kind       text not null check (kind in ('welcome', 'arrival', 'reminder', 'thanks')),
  body       text not null check (char_length(body) between 1 and 3000),
  updated_at timestamptz not null default now(),
  primary key (org_id, kind)
);
alter table public.host_templates enable row level security;
create policy host_templates_select on public.host_templates
  for select to authenticated using (public.has_product_access(org_id, 'host'));
create policy host_templates_write on public.host_templates
  for all to authenticated
  using (public.has_product_access(org_id, 'host') and public.has_org_role(org_id, array['owner','admin','member']::public.org_role[]))
  with check (public.has_product_access(org_id, 'host') and public.has_org_role(org_id, array['owner','admin','member']::public.org_role[]));
