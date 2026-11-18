-- Payment due dates on a booking: when the deposit and the balance should be paid.
-- Both are optional. Nothing is rewritten or removed: existing bookings simply have no due date,
-- and every screen falls back to the check-in date for them.
--
--  * deposit_due_on: when the deposit (the first payment) should arrive. Only matters while nothing has been paid yet.
--  * balance_due_on: when the rest should arrive. Usually on or before check-in.
--
-- Row level security is unchanged: the existing policies on public.bookings apply to the new columns too.
-- Deploy order: apply this migration BEFORE deploying the app version that reads these columns.
-- (The app also tolerates the columns being absent, so an early deploy does not break the booking list.)

alter table public.bookings
  add column deposit_due_on date,
  add column balance_due_on date;

-- A balance cannot be due before the deposit.
alter table public.bookings
  add constraint bookings_due_order
  check (deposit_due_on is null or balance_due_on is null or balance_due_on >= deposit_due_on);

comment on column public.bookings.deposit_due_on is 'Optional date the deposit should be paid by. Informational: the system records collections, it does not process payments.';
comment on column public.bookings.balance_due_on is 'Optional date the remaining balance should be paid by. Informational: the system records collections, it does not process payments.';
