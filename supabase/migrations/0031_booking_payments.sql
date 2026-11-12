-- Payments ledger: every collection (or correction) of a booking is a row, so "who paid what, when and how" is never lost.
-- bookings.paid_minor stays as the running total, so everything that reads it keeps working.
create table public.booking_payments (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organizations (id) on delete cascade,
  booking_id   uuid not null references public.bookings (id) on delete cascade,
  amount_minor bigint not null check (amount_minor <> 0),
  method       text not null default 'cash' check (method in ('cash', 'transfer', 'card', 'platform', 'other', 'adjust')),
  note         text not null default '' check (char_length(note) <= 300),
  paid_on      date not null default current_date,
  created_by   uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default clock_timestamp()
);
create index booking_payments_booking_idx on public.booking_payments (booking_id, created_at desc);
alter table public.booking_payments enable row level security;
create policy booking_payments_select on public.booking_payments
  for select to authenticated using (public.has_product_access(org_id, 'host'));
-- no write policies: payments are written through record_booking_payment() or by the triggers below

-- The running total follows the ledger.
create or replace function public.payments_sync_total()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_booking uuid := coalesce(new.booking_id, old.booking_id);
begin
  update public.bookings
     set paid_minor = greatest(0, coalesce((select sum(amount_minor) from public.booking_payments where booking_id = v_booking), 0))
   where id = v_booking;
  return null;
end;
$$;
revoke execute on function public.payments_sync_total() from public, anon, authenticated;
create trigger booking_payments_total after insert or delete on public.booking_payments
  for each row execute function public.payments_sync_total();

-- Anything that sets paid_minor directly (older screens, imports) leaves a ledger row instead of silently rewriting history.
create or replace function public.bookings_ledger_from_paid()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_delta bigint;
begin
  if pg_trigger_depth() > 1 or new.kind <> 'stay' then return null; end if;
  if tg_op = 'INSERT' then
    v_delta := new.paid_minor;
  else
    v_delta := new.paid_minor - old.paid_minor;
  end if;
  if v_delta <> 0 then
    insert into public.booking_payments (org_id, booking_id, amount_minor, method, note, created_by)
    values (new.org_id, new.id, v_delta, 'adjust', case when tg_op = 'INSERT' then 'Cobro inicial' else 'Ajuste manual' end, auth.uid());
  end if;
  return null;
end;
$$;
revoke execute on function public.bookings_ledger_from_paid() from public, anon, authenticated;
create trigger bookings_paid_ledger after insert or update of paid_minor on public.bookings
  for each row execute function public.bookings_ledger_from_paid();

-- Registers a collection (positive) or a refund/correction (negative).
create or replace function public.record_booking_payment(p_booking uuid, p_amount bigint, p_method text default 'cash', p_note text default '', p_paid_on date default current_date)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_org uuid;
  v_id uuid;
begin
  select org_id into v_org from public.bookings where id = p_booking and kind = 'stay';
  if v_org is null or not public.has_product_access(v_org, 'host') then
    raise exception 'host license required' using errcode = '42501';
  end if;
  if p_amount is null or p_amount = 0 then raise exception 'amount required' using errcode = '22023'; end if;
  insert into public.booking_payments (org_id, booking_id, amount_minor, method, note, paid_on, created_by)
  values (v_org, p_booking, p_amount, p_method, left(coalesce(p_note, ''), 300), coalesce(p_paid_on, current_date), auth.uid())
  returning id into v_id;
  return v_id;
end;
$$;
revoke execute on function public.record_booking_payment(uuid, bigint, text, text, date) from public, anon;
grant  execute on function public.record_booking_payment(uuid, bigint, text, text, date) to authenticated;

-- Existing collected amounts start the ledger as one opening row each.
insert into public.booking_payments (org_id, booking_id, amount_minor, method, note, paid_on, created_by, created_at)
select org_id, id, paid_minor, 'adjust', 'Cobro inicial', created_at::date, created_by, created_at
from public.bookings where kind = 'stay' and paid_minor > 0;
