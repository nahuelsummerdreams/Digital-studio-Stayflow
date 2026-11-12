-- Host round 2: blocks hold dates, cleaning tasks follow bookings, payments, iCal feed, templates.
-- Rolls itself back. Success = "ALL 11 HOST PRO CHECKS PASSED". Any "FAIL n" is a real problem.
do $$
declare
  u1 uuid := gen_random_uuid(); o1 uuid; p1 uuid; tok uuid; b1 uuid; bb uuid; n int; v_due date; v_title text;
begin
  perform set_config('stayflow.allow_trials', 'on', true);
  insert into auth.users (id, instance_id, aud, role, email) values
    (u1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'hostpro-1@test.invalid');
  perform set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  set local role authenticated;
  o1 := public.create_organization('HostPro Org');
  perform public.start_trial(o1, 'host');
  insert into public.properties (org_id, name) values (o1, 'Loft') returning id, ical_token into p1, tok;

  -- 1) a stay creates its cleaning task for the check-out day
  insert into public.bookings (org_id, property_id, guest_name, check_in, check_out) values (o1, p1, 'Ana', date '2099-01-10', date '2099-01-15') returning id into b1;
  select due_on, title into v_due, v_title from public.host_tasks where booking_id = b1;
  if v_due is distinct from date '2099-01-15' then raise exception 'FAIL 1: no cleaning task on check-out (%)', v_due; end if;
  if v_title not like '%Ana%' then raise exception 'FAIL 2: task title (%)', v_title; end if;

  -- 3) moving the check-out moves the task
  update public.bookings set check_out = date '2099-01-16' where id = b1;
  select due_on into v_due from public.host_tasks where booking_id = b1;
  if v_due is distinct from date '2099-01-16' then raise exception 'FAIL 3: task did not follow check-out (%)', v_due; end if;

  -- 4) a block holds the dates (same as a stay) and creates no cleaning task
  begin
    insert into public.bookings (org_id, property_id, guest_name, kind, check_in, check_out) values (o1, p1, 'Pintura', 'block', date '2099-01-12', date '2099-01-14');
    raise exception 'FAIL 4: block over a stay accepted';
  exception when exclusion_violation then null; end;
  insert into public.bookings (org_id, property_id, guest_name, kind, check_in, check_out) values (o1, p1, 'Pintura', 'block', date '2099-02-01', date '2099-02-04') returning id into bb;
  select count(*) into n from public.host_tasks where booking_id = bb;
  if n <> 0 then raise exception 'FAIL 5: block created a cleaning task'; end if;

  -- 6) canceling removes the pending cleaning task
  update public.bookings set status = 'canceled' where id = b1;
  select count(*) into n from public.host_tasks where booking_id = b1;
  if n <> 0 then raise exception 'FAIL 6: canceled stay kept its task'; end if;

  -- 7) payments cannot be negative
  begin
    update public.bookings set paid_minor = -1 where id = b1;
    raise exception 'FAIL 7: negative payment accepted';
  exception when check_violation then null; end;

  -- 8) imported events are unique per property + uid
  insert into public.bookings (org_id, property_id, guest_name, check_in, check_out, external_uid) values (o1, p1, 'Reserva Airbnb', date '2099-03-01', date '2099-03-03', 'abc@airbnb.com');
  begin
    insert into public.bookings (org_id, property_id, guest_name, check_in, check_out, external_uid) values (o1, p1, 'Dup', date '2099-04-01', date '2099-04-03', 'abc@airbnb.com');
    raise exception 'FAIL 8: duplicate external uid accepted';
  exception when unique_violation then null; end;

  -- 9) the public feed works for anon with the token, shows dates only, and a wrong token shows nothing
  set local role anon;
  select count(*) into n from public.ical_feed(tok);
  if n <> 2 then raise exception 'FAIL 9: feed returned % rows (expected 2: block + imported)', n; end if;
  select count(*) into n from public.ical_feed(gen_random_uuid());
  if n <> 0 then raise exception 'FAIL 10: wrong token returned rows'; end if;
  select count(*) into n from public.bookings;
  if n <> 0 then raise exception 'FAIL 11: anon can see % bookings', n; end if;

  reset role;
  raise exception 'ALL 11 HOST PRO CHECKS PASSED - rolled back on purpose';
end $$;
