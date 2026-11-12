-- Host -> Business: a finished stay becomes income by itself (only with Business), once. Rolls itself back.
-- Success = "ALL 4 AUTO INCOME CHECKS PASSED".
do $$
declare
  u1 uuid := gen_random_uuid(); o1 uuid; p1 uuid; b1 uuid; b2 uuid; b3 uuid; n int; amt bigint;
begin
  insert into auth.users (id, instance_id, aud, role, email) values
    (u1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'autoinc-1@test.invalid');
  perform set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  set local role authenticated;
  o1 := public.create_organization('AutoInc Org');
  perform public.start_trial(o1, 'host');
  insert into public.properties (org_id, name) values (o1, 'Loft') returning id into p1;

  -- 1) without Business nothing is recorded and nothing breaks
  insert into public.bookings (org_id, property_id, guest_name, check_in, check_out, amount_minor) values (o1, p1, 'Ana', date '2099-01-10', date '2099-01-12', 50000) returning id into b1;
  update public.bookings set status = 'checked_out' where id = b1;
  select count(*) into n from public.income_entries where booking_id = b1;
  if n <> 0 then raise exception 'FAIL 1: income recorded without Business'; end if;

  perform public.start_trial(o1, 'profit');

  -- 2) with Business, checking out records the income
  insert into public.bookings (org_id, property_id, guest_name, check_in, check_out, amount_minor) values (o1, p1, 'Luis', date '2099-02-10', date '2099-02-12', 70000) returning id into b2;
  update public.bookings set status = 'checked_in' where id = b2;
  select count(*) into n from public.income_entries where booking_id = b2;
  if n <> 0 then raise exception 'FAIL 2a: recorded before check-out'; end if;
  update public.bookings set status = 'checked_out' where id = b2;
  select count(*), max(amount_minor) into n, amt from public.income_entries where booking_id = b2;
  if n <> 1 or amt <> 70000 then raise exception 'FAIL 2: income missing (% / %)', n, amt; end if;

  -- 3) a stay imported as already finished is recorded too, and a manual record afterwards does not duplicate
  insert into public.bookings (org_id, property_id, guest_name, check_in, check_out, amount_minor, status) values (o1, p1, 'Marta', date '2098-03-01', date '2098-03-04', 90000, 'checked_out') returning id into b3;
  perform public.record_booking_income(b3);
  select count(*) into n from public.income_entries where booking_id = b3;
  if n <> 1 then raise exception 'FAIL 3: expected exactly one income (%)', n; end if;

  -- 4) zero-amount stays record nothing
  update public.bookings set amount_minor = 0 where id = b1;
  update public.bookings set status = 'confirmed' where id = b1;
  update public.bookings set status = 'checked_out' where id = b1;
  select count(*) into n from public.income_entries where booking_id = b1;
  if n <> 0 then raise exception 'FAIL 4: zero amount recorded'; end if;

  raise exception 'ALL 4 AUTO INCOME CHECKS PASSED';
end $$;
