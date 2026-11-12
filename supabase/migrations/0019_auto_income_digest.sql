-- Host -> Business without lifting a finger, and an off switch for the morning email.

-- 1) When a stay is checked out (or imported as already finished) and the account has Business,
--    its amount becomes income there. Runs as the caller: RLS and licenses decide. Once per booking.
create or replace function public.auto_income_on_checkout()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.kind = 'stay'
     and new.status = 'checked_out'
     and new.amount_minor > 0
     and (tg_op = 'INSERT' or old.status is distinct from 'checked_out')
     and public.has_product_access(new.org_id, 'profit') then
    perform public.record_booking_income(new.id);
  end if;
  return new;
end;
$$;
revoke execute on function public.auto_income_on_checkout() from public, anon, authenticated;

create trigger bookings_auto_income
  after insert or update of status on public.bookings
  for each row execute function public.auto_income_on_checkout();

-- 2) The morning email can be turned off per organization.
alter table public.organizations add column digest_enabled boolean not null default true;
