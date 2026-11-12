-- Payments ledger: collections add up, direct paid_minor writes leave a ledger row, clients cannot write the ledger.
-- Rolls itself back. Success = "ALL 7 PAYMENT CHECKS PASSED".
do $$
declare
  u1 uuid := gen_random_uuid(); u2 uuid := gen_random_uuid();
  o1 uuid; p1 uuid; b1 uuid; b2 uuid; n int; v bigint;
begin
  perform set_config('stayflow.allow_trials', 'on', true);
  insert into auth.users (id, instance_id, aud, role, email) values
    (u1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'pay-test-1@test.invalid'),
    (u2, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'pay-test-2@test.invalid');
  perform set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  set local role authenticated;
  o1 := public.create_organization('Pay Org');
  perform public.start_trial(o1, 'host');
  insert into public.properties (org_id, name) values (o1, 'Loft') returning id into p1;
  insert into public.bookings (org_id, property_id, guest_name, check_in, check_out, amount_minor, paid_minor) values (o1, p1, 'Ana', '2027-02-01', '2027-02-05', 100000, 20000) returning id into b1;

  select count(*) into n from public.booking_payments where booking_id = b1;
  if n <> 1 then raise exception 'FAIL 1: initial paid amount should start the ledger (%)', n; end if;

  perform public.record_booking_payment(b1, 30000, 'transfer', 'seña');
  select paid_minor into v from public.bookings where id = b1;
  if v <> 50000 then raise exception 'FAIL 2: total should be 50000, got %', v; end if;

  perform public.record_booking_payment(b1, -10000, 'cash', 'devolución');
  select paid_minor into v from public.bookings where id = b1;
  if v <> 40000 then raise exception 'FAIL 3: refund not applied (%)', v; end if;

  update public.bookings set paid_minor = 100000 where id = b1;
  select count(*) into n from public.booking_payments where booking_id = b1 and method = 'adjust' and amount_minor = 60000;
  if n <> 1 then raise exception 'FAIL 4: direct paid_minor change left no ledger row'; end if;
  select paid_minor into v from public.bookings where id = b1;
  if v <> 100000 then raise exception 'FAIL 5: total drifted (%)', v; end if;

  begin
    insert into public.booking_payments (org_id, booking_id, amount_minor) values (o1, b1, 5);
    raise exception 'FAIL 6: client wrote the ledger directly';
  exception when insufficient_privilege then null; end;

  perform set_config('request.jwt.claims', json_build_object('sub', u2, 'role', 'authenticated')::text, true);
  begin
    perform public.record_booking_payment(b1, 100, 'cash');
    raise exception 'FAIL 7: another organization recorded a payment';
  exception when insufficient_privilege then null; end;

  raise exception 'ALL 7 PAYMENT CHECKS PASSED';
end $$;
