-- Stayflow Host: license gate, double-booking protection, isolation, bridge to Profit income.
-- Rolls itself back. Success = "ALL 17 HOST CHECKS PASSED". Any "FAIL n" is a real problem.
do $$
declare
  u1 uuid := gen_random_uuid(); u2 uuid := gen_random_uuid();
  o1 uuid; o2 uuid; p1 uuid; p1b uuid; p2 uuid; b1 uuid; b2 uuid; b3 uuid; bx uuid;
  v_income uuid; n int; v_nights int;
begin
  perform set_config('stayflow.allow_trials', 'on', true);
  insert into auth.users (id, instance_id, aud, role, email) values
    (u1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'host-test-1@test.invalid'),
    (u2, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'host-test-2@test.invalid');

  perform set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  set local role authenticated;
  o1 := public.create_organization('Host Org 1');
  insert into public.properties (org_id, name) values (o1, 'Loft') returning id into p1;
  insert into public.properties (org_id, name) values (o1, 'Estudio') returning id into p1b;

  begin
    insert into public.bookings (org_id, property_id, guest_name, check_in, check_out) values (o1, p1, 'Ana', '2026-12-01', '2026-12-05');
    raise exception 'FAIL 1: booking created without a Host license';
  exception when insufficient_privilege then null; end;

  perform public.start_trial(o1, 'host');
  insert into public.bookings (org_id, property_id, guest_name, check_in, check_out, amount_minor, source)
  values (o1, p1, 'Ana', '2026-12-01', '2026-12-05', 60000, 'airbnb') returning id, bookings.nights into b1, v_nights;
  if nights <> 4 then raise exception 'FAIL 2: nights not computed (%)', nights; end if;

  -- overlapping stay on the same property is rejected
  begin
    insert into public.bookings (org_id, property_id, guest_name, check_in, check_out) values (o1, p1, 'Beto', '2026-12-03', '2026-12-07');
    raise exception 'FAIL 3: overlapping booking accepted';
  exception when exclusion_violation then null; end;
  begin
    insert into public.bookings (org_id, property_id, guest_name, check_in, check_out) values (o1, p1, 'Beto', '2026-11-29', '2026-12-02');
    raise exception 'FAIL 4: partially overlapping (start) booking accepted';
  exception when exclusion_violation then null; end;
  begin
    insert into public.bookings (org_id, property_id, guest_name, check_in, check_out) values (o1, p1, 'Beto', '2026-12-02', '2026-12-04');
    raise exception 'FAIL 5: contained booking accepted';
  exception when exclusion_violation then null; end;

  -- back-to-back (checkout day = next check-in day) and other property are fine
  insert into public.bookings (org_id, property_id, guest_name, check_in, check_out) values (o1, p1, 'Carla', '2026-12-05', '2026-12-08') returning id into b2;
  insert into public.bookings (org_id, property_id, guest_name, check_in, check_out) values (o1, p1b, 'Diego', '2026-12-01', '2026-12-05');

  -- a canceled booking frees the dates, and canceling a stay really releases them
  update public.bookings set status = 'canceled' where id = b2;
  insert into public.bookings (org_id, property_id, guest_name, check_in, check_out) values (o1, p1, 'Elena', '2026-12-05', '2026-12-08') returning id into b3;

  begin
    insert into public.bookings (org_id, property_id, guest_name, check_in, check_out) values (o1, p1, 'Mal', '2026-12-10', '2026-12-10');
    raise exception 'FAIL 6: zero-night booking accepted';
  exception when check_violation then null; end;
  begin
    insert into public.bookings (org_id, property_id, guest_name, check_in, check_out) values (o1, p1, 'Mal', '2026-12-12', '2026-12-10');
    raise exception 'FAIL 7: check-out before check-in accepted';
  exception when check_violation then null; end;

  -- bridge to Profit: needs a Profit license
  begin
    perform public.record_booking_income(b1);
    raise exception 'FAIL 8: income recorded without a Profit license';
  exception when insufficient_privilege then null; end;
  perform public.start_trial(o1, 'profit');
  v_income := public.record_booking_income(b1);
  if v_income is null then raise exception 'FAIL 9: income not recorded'; end if;
  select count(*) into n from public.income_entries where booking_id = b1 and nights = 4 and amount_minor = 60000 and received_on = date '2026-12-01';
  if n <> 1 then raise exception 'FAIL 10: income entry has wrong data'; end if;
  if public.record_booking_income(b1) is not null then raise exception 'FAIL 11: income recorded twice'; end if;
  select count(*) into n from public.income_entries where booking_id = b1;
  if n <> 1 then raise exception 'FAIL 11b: duplicate income rows (%)', n; end if;
  begin
    perform public.record_booking_income(b3);
    raise exception 'FAIL 12: income recorded for a booking with no amount';
  exception when invalid_parameter_value then null; end;

  -- tasks
  insert into public.host_tasks (org_id, property_id, title, due_on) values (o1, p1, 'Cambiar sábanas', '2026-12-05');

  -- host 2 cannot see or touch host 1
  perform set_config('request.jwt.claims', json_build_object('sub', u2, 'role', 'authenticated')::text, true);
  o2 := public.create_organization('Host Org 2');
  insert into public.properties (org_id, name) values (o2, 'Casa') returning id into p2;
  perform public.start_trial(o2, 'host');
  select count(*) into n from public.bookings;
  if n <> 0 then raise exception 'FAIL 13: host 2 sees host 1 bookings'; end if;
  select count(*) into n from public.host_tasks;
  if n <> 0 then raise exception 'FAIL 14: host 2 sees host 1 tasks'; end if;
  begin
    insert into public.bookings (org_id, property_id, guest_name, check_in, check_out) values (o2, p1, 'X', '2027-01-01', '2027-01-03');
    raise exception 'FAIL 15: booking linked to a property of another organization';
  exception when others then
    if sqlerrm not like '%does not belong%' and sqlstate <> '42501' then raise; end if;
  end;
  begin
    perform public.record_booking_income(b1);
    raise exception 'FAIL 16: host 2 recorded income for host 1 booking';
  exception when insufficient_privilege then null; end;

  -- visitors without a session see nothing
  reset role; set local role anon;
  select count(*) into n from public.bookings;
  if n <> 0 then raise exception 'FAIL 17: anon can read bookings'; end if;
  reset role;

  raise exception 'ALL 17 HOST CHECKS PASSED - rolled back on purpose';
end $$;
