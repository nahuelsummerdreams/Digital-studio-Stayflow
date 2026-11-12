-- Booking states and history: an inquiry holds no dates, a pending booking does, and every change is logged by the database.
-- Rolls itself back. Success = "ALL 8 BOOKING HISTORY CHECKS PASSED".
do $$
declare
  u1 uuid := gen_random_uuid();
  o1 uuid; p1 uuid; b1 uuid; b2 uuid; n int; v text;
begin
  perform set_config('stayflow.allow_trials', 'on', true);
  insert into auth.users (id, instance_id, aud, role, email) values (u1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'hist-test@test.invalid');
  perform set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  set local role authenticated;
  o1 := public.create_organization('Hist Org');
  perform public.start_trial(o1, 'host');
  insert into public.properties (org_id, name) values (o1, 'Loft') returning id into p1;

  insert into public.bookings (org_id, property_id, guest_name, check_in, check_out, status) values (o1, p1, 'Consulta', '2027-01-10', '2027-01-14', 'inquiry') returning id into b1;
  select count(*) into n from public.host_tasks where booking_id = b1;
  if n <> 0 then raise exception 'FAIL 1: inquiry created a cleaning task'; end if;
  if exists (select 1 from public.ical_feed((select ical_token from public.properties where id = p1))) then raise exception 'FAIL 2: inquiry published in the calendar feed'; end if;

  insert into public.bookings (org_id, property_id, guest_name, check_in, check_out, status) values (o1, p1, 'Pendiente', '2027-01-11', '2027-01-13', 'pending') returning id into b2;
  begin
    insert into public.bookings (org_id, property_id, guest_name, check_in, check_out) values (o1, p1, 'Otra', '2027-01-12', '2027-01-15');
    raise exception 'FAIL 3: pending booking did not hold its dates';
  exception when exclusion_violation then null; end;

  select count(*) into n from public.host_tasks where booking_id = b2;
  if n <> 1 then raise exception 'FAIL 4: pending booking should create a cleaning task (%)', n; end if;

  update public.bookings set status = 'confirmed' where id = b2;
  update public.bookings set amount_minor = 50000, check_out = '2027-01-14' where id = b2;
  select count(*) into n from public.booking_events where booking_id = b2;
  if n <> 4 then raise exception 'FAIL 5: expected created+status+dates+amount events, got %', n; end if;
  select to_value into v from public.booking_events where booking_id = b2 and kind = 'status';
  if v <> 'confirmed' then raise exception 'FAIL 6: status event wrong (%)', v; end if;

  begin
    insert into public.booking_events (org_id, booking_id, kind) values (o1, b2, 'created');
    raise exception 'FAIL 7: client wrote to booking_events';
  exception when insufficient_privilege then null; end;

  update public.bookings set status = 'canceled' where id = b2;
  select count(*) into n from public.host_tasks where booking_id = b2 and not done;
  if n <> 0 then raise exception 'FAIL 8: canceled booking kept its cleaning task'; end if;

  raise exception 'ALL 8 BOOKING HISTORY CHECKS PASSED';
end $$;
