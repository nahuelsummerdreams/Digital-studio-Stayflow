-- Booking payment due dates (migration 0035). Run it AFTER applying 0035.
-- Rolls itself back. Success = "ALL 8 DUE-DATE CHECKS PASSED". Any "FAIL n" is a real problem.
do $$
declare
  u1 uuid := gen_random_uuid(); u2 uuid := gen_random_uuid();
  o1 uuid; o2 uuid; p1 uuid; p2 uuid; b1 uuid; b2 uuid; r record; n int;
begin
  if (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'bookings' and column_name in ('deposit_due_on', 'balance_due_on')) <> 2 then
    raise exception 'FAIL 0: apply migration 0035_booking_due_dates.sql first';
  end if;
  perform set_config('stayflow.allow_trials', 'on', true);
  insert into auth.users (id, instance_id, aud, role, email) values
    (u1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'due-1@test.invalid'),
    (u2, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'due-2@test.invalid');

  perform set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  set local role authenticated;
  o1 := public.create_organization('Due Org 1');
  perform public.start_trial(o1, 'host');
  insert into public.properties (org_id, name) values (o1, 'Loft') returning id into p1;
  insert into public.bookings (org_id, property_id, guest_name, check_in, check_out, amount_minor) values (o1, p1, 'Ana', current_date + 20, current_date + 23, 90000) returning id into b1;

  select deposit_due_on, balance_due_on into r from public.bookings where id = b1;
  if r.deposit_due_on is not null or r.balance_due_on is not null then raise exception 'FAIL 1: a new booking should have no due dates'; end if;

  update public.bookings set deposit_due_on = current_date + 1, balance_due_on = current_date + 15 where id = b1;
  select deposit_due_on, balance_due_on into r from public.bookings where id = b1;
  if r.deposit_due_on <> current_date + 1 or r.balance_due_on <> current_date + 15 then raise exception 'FAIL 2: due dates not saved'; end if;

  begin
    update public.bookings set deposit_due_on = current_date + 9, balance_due_on = current_date + 2 where id = b1;
    raise exception 'FAIL 3: a balance due before the deposit was accepted';
  exception when check_violation then null; end;

  update public.bookings set deposit_due_on = current_date + 3, balance_due_on = current_date + 3 where id = b1;
  update public.bookings set deposit_due_on = null where id = b1;
  update public.bookings set balance_due_on = null where id = b1;
  select count(*) into n from public.bookings where id = b1 and deposit_due_on is null and balance_due_on is null;
  if n <> 1 then raise exception 'FAIL 4: due dates could not be cleared'; end if;

  update public.bookings set balance_due_on = current_date + 10 where id = b1;
  perform public.record_booking_payment(b1, 30000, 'cash', 'seña');
  select balance_due_on into r from public.bookings where id = b1;
  if r.balance_due_on <> current_date + 10 then raise exception 'FAIL 5: a payment changed the due date'; end if;
  reset role;

  -- another account cannot read or set them
  perform set_config('request.jwt.claims', json_build_object('sub', u2, 'role', 'authenticated')::text, true);
  set local role authenticated;
  o2 := public.create_organization('Due Org 2');
  perform public.start_trial(o2, 'host');
  insert into public.properties (org_id, name) values (o2, 'Otra') returning id into p2;
  insert into public.bookings (org_id, property_id, guest_name, check_in, check_out) values (o2, p2, 'Beto', current_date + 20, current_date + 22) returning id into b2;
  update public.bookings set balance_due_on = current_date + 4 where id = b1;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL 6: account 2 set a due date on account 1 booking'; end if;
  select count(*) into n from public.bookings where id = b1;
  if n <> 0 then raise exception 'FAIL 7: account 2 can read account 1 booking'; end if;
  reset role;

  set local role anon;
  select count(*) into n from public.bookings;
  if n <> 0 then raise exception 'FAIL 8: anon can read bookings'; end if;
  reset role;

  raise exception 'ALL 8 DUE-DATE CHECKS PASSED - rolled back on purpose';
end $$;
