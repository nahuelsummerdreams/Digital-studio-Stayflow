-- Stayflow Host: bookings, tasks, and the bridge to Stayflow Profit.

create extension if not exists btree_gist with schema extensions;

create type public.booking_status as enum ('confirmed', 'checked_in', 'checked_out', 'canceled');

create table public.bookings (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations (id) on delete cascade,
  property_id   uuid not null references public.properties (id) on delete cascade,
  guest_name    text not null check (char_length(guest_name) between 1 and 120),
  guest_email   text not null default '' check (char_length(guest_email) <= 200),
  guest_phone   text not null default '' check (char_length(guest_phone) <= 40),
  guests_count  integer not null default 1 check (guests_count between 1 and 50),
  check_in      date not null,
  check_out     date not null,
  nights        integer generated always as (check_out - check_in) stored,
  source        public.income_source not null default 'other',
  status        public.booking_status not null default 'confirmed',
  amount_minor  bigint not null default 0 check (amount_minor >= 0),
  notes         text not null default '' check (char_length(notes) <= 2000),
  created_by    uuid references auth.users (id),
  created_at    timestamptz not null default now(),
  check (check_out > check_in),
  check (check_out - check_in <= 366),
  -- A property cannot be double-booked. Check-out day and next check-in day may coincide ([) ranges).
  constraint bookings_no_overlap exclude using gist (
    property_id with =,
    daterange(check_in, check_out) with &&
  ) where (status <> 'canceled')
);
create index bookings_org_checkin_idx on public.bookings (org_id, check_in);
create index bookings_property_idx    on public.bookings (property_id);

create table public.host_tasks (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organizations (id) on delete cascade,
  -- null = applies to the whole business
  property_id  uuid references public.properties (id) on delete cascade,
  title        text not null check (char_length(title) between 1 and 160),
  due_on       date,
  done         boolean not null default false,
  done_at      timestamptz,
  created_by   uuid references auth.users (id),
  created_at   timestamptz not null default now()
);
create index host_tasks_org_idx on public.host_tasks (org_id, done, due_on);

create trigger bookings_property_org
  before insert or update on public.bookings
  for each row execute function public.assert_property_in_org();
create trigger host_tasks_property_org
  before insert or update on public.host_tasks
  for each row execute function public.assert_property_in_org();

alter table public.bookings   enable row level security;
alter table public.host_tasks enable row level security;

create policy bookings_select on public.bookings
  for select to authenticated using (public.has_product_access(org_id, 'host'));
create policy bookings_write on public.bookings
  for all to authenticated
  using (public.has_product_access(org_id, 'host') and public.has_org_role(org_id, array['owner','admin','member']::public.org_role[]))
  with check (public.has_product_access(org_id, 'host') and public.has_org_role(org_id, array['owner','admin','member']::public.org_role[]));

create policy host_tasks_select on public.host_tasks
  for select to authenticated using (public.has_product_access(org_id, 'host'));
create policy host_tasks_write on public.host_tasks
  for all to authenticated
  using (public.has_product_access(org_id, 'host') and public.has_org_role(org_id, array['owner','admin','member']::public.org_role[]))
  with check (public.has_product_access(org_id, 'host') and public.has_org_role(org_id, array['owner','admin','member']::public.org_role[]));

-- ---------------------------------------------------------------- bridge to Profit
alter table public.income_entries
  add column booking_id uuid references public.bookings (id) on delete set null;
create unique index income_booking_unique on public.income_entries (booking_id) where booking_id is not null;

-- Records a booking as income in Profit, once. Runs as the caller: it needs Host access to read the
-- booking AND Profit access to write the income (RLS decides both). Returns null if already recorded.
create or replace function public.record_booking_income(p_booking uuid)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  b    public.bookings%rowtype;
  v_id uuid;
begin
  select * into b from public.bookings where id = p_booking;
  if not found then
    raise exception 'booking not found' using errcode = '42501';
  end if;
  if b.amount_minor <= 0 then
    raise exception 'booking has no amount' using errcode = '22023';
  end if;
  insert into public.income_entries
    (org_id, property_id, source, amount_minor, nights, guest_name, check_in, check_out, received_on, booking_id, created_by)
  values
    (b.org_id, b.property_id, b.source, b.amount_minor, b.nights, b.guest_name, b.check_in, b.check_out, b.check_in, b.id, auth.uid())
  on conflict (booking_id) where booking_id is not null do nothing
  returning id into v_id;
  return v_id;
end;
$$;
revoke execute on function public.record_booking_income(uuid) from public, anon;
grant  execute on function public.record_booking_income(uuid) to authenticated;
