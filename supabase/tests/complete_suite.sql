-- STAYflow Complete: the whole business under ONE `suite` license, end to end.
-- It covers the flow of the product (property > booking > payments > cleaning > finances > guest guide), the license gate
-- and the isolation between accounts. Rolls itself back. Success = "ALL 21 COMPLETE CHECKS PASSED". Any "FAIL n" is a real problem.
--
-- Not covered on purpose: plan limits (starter 2 / pro 10 properties). They are NOT enforced anywhere today, so there is nothing to assert yet.
do $$
declare
  u1 uuid := gen_random_uuid(); u2 uuid := gen_random_uuid();
  o1 uuid; o2 uuid; p1 uuid; p2 uuid;
  ba uuid; bc uuid; bd uuid; bx uuid; g1 uuid;
  base date := current_date + 10;
  n bigint; s bigint; d date; v_slug text; j jsonb;
begin
  perform set_config('stayflow.allow_trials', 'on', true);
  insert into auth.users (id, instance_id, aud, role, email) values
    (u1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'complete-1@test.invalid'),
    (u2, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'complete-2@test.invalid');

  -- account 1 buys Complete (suite); account 2 only has Host
  perform set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  set local role authenticated;
  o1 := public.create_organization('Complete Org 1');
  reset role;
  insert into public.licenses (org_id, product, plan, status, current_period_end) values (o1, 'suite', 'pro', 'active', null);

  perform set_config('request.jwt.claims', json_build_object('sub', u2, 'role', 'authenticated')::text, true);
  set local role authenticated;
  o2 := public.create_organization('Complete Org 2');
  perform public.start_trial(o2, 'host');
  insert into public.properties (org_id, name) values (o2, 'Otra') returning id into p2;

  -- 1) the license gate: Host alone does not open Operations, Business or Guest
  begin
    insert into public.ops_jobs (org_id, property_id, kind, title, due_on) values (o2, p2, 'cleaning', 'x', current_date);
    raise exception 'FAIL 1: Operations job created with a Host-only license';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.income_entries (org_id, property_id, source, amount_minor, nights, received_on) values (o2, p2, 'direct', 1000, 1, current_date);
    raise exception 'FAIL 2: Business income created with a Host-only license';
  exception when insufficient_privilege then null; end;
  reset role;

  -- 2) suite opens everything
  perform set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  set local role authenticated;
  if not (public.has_product_access(o1, 'host') and public.has_product_access(o1, 'profit') and public.has_product_access(o1, 'operations') and public.has_product_access(o1, 'guest')) then
    raise exception 'FAIL 3: suite does not unlock every product';
  end if;

  -- 3) property and bookings: no overlap, same-day turnover allowed, an inquiry holds no dates
  insert into public.properties (org_id, name) values (o1, 'Depto') returning id into p1;
  insert into public.bookings (org_id, property_id, guest_name, guest_email, check_in, check_out, amount_minor, status)
    values (o1, p1, 'Ana', 'ana@test.invalid', base, base + 3, 100000, 'confirmed') returning id into ba;
  begin
    insert into public.bookings (org_id, property_id, guest_name, check_in, check_out, status) values (o1, p1, 'Solapada', base + 2, base + 5, 'confirmed');
    raise exception 'FAIL 4: overlapping booking accepted';
  exception when exclusion_violation then null; end;
  insert into public.bookings (org_id, property_id, guest_name, check_in, check_out, amount_minor, status)
    values (o1, p1, 'Beto', base + 3, base + 6, 60000, 'confirmed') returning id into bc;
  insert into public.bookings (org_id, property_id, guest_name, check_in, check_out, status) values (o1, p1, 'Consulta', base, base + 1, 'inquiry') returning id into bd;

  -- 4) payments: deposit, balance, refund, and a direct change that still leaves a ledger row
  perform public.record_booking_payment(ba, 40000, 'transfer', 'seña');
  select paid_minor into s from public.bookings where id = ba;
  if s <> 40000 then raise exception 'FAIL 5: deposit not reflected (%)', s; end if;
  perform public.record_booking_payment(ba, 60000, 'cash', 'saldo');
  perform public.record_booking_payment(ba, -20000, 'cash', 'devolución');
  select paid_minor into s from public.bookings where id = ba;
  if s <> 80000 then raise exception 'FAIL 6: balance/refund wrong (%)', s; end if;
  update public.bookings set paid_minor = 90000 where id = ba;
  select count(*), coalesce(sum(amount_minor), 0) into n, s from public.booking_payments where booking_id = ba;
  if n <> 4 or s <> 90000 then raise exception 'FAIL 7: direct change left no ledger row (% rows, sum %)', n, s; end if;

  -- 5) cleaning follows the departure: created once, moved, removed
  perform public.ops_sync_bookings(o1);
  perform public.ops_sync_bookings(o1);
  select count(*) into n from public.ops_jobs where booking_id in (ba, bc) and kind = 'cleaning';
  if n <> 2 then raise exception 'FAIL 8: expected 2 cleanings after two syncs, got %', n; end if;
  select count(*) into n from public.ops_jobs where booking_id = bd;
  if n <> 0 then raise exception 'FAIL 9: an inquiry generated a cleaning'; end if;
  update public.bookings set check_out = base + 7 where id = bc;
  perform public.ops_sync_bookings(o1);
  select due_on into d from public.ops_jobs where booking_id = bc and kind = 'cleaning';
  if d <> base + 7 then raise exception 'FAIL 10: cleaning did not follow the new departure (%)', d; end if;
  update public.bookings set status = 'canceled' where id = bc;
  perform public.ops_sync_bookings(o1);
  select count(*) into n from public.ops_jobs where booking_id = bc;
  if n <> 0 then raise exception 'FAIL 11: canceled booking kept its cleaning'; end if;

  -- 6) check-out creates one income row; an expense can be recorded
  update public.bookings set status = 'checked_out' where id = ba;
  update public.bookings set status = 'checked_out' where id = ba;
  select count(*) into n from public.income_entries where booking_id = ba;
  if n <> 1 then raise exception 'FAIL 12: expected one income row for the checked-out stay, got %', n; end if;
  insert into public.expense_entries (org_id, property_id, amount_minor, incurred_on, category) values (o1, p1, 12000, current_date, 'cleaning');

  -- 7) the public guide: visible with a license, hidden when unpublished or without a Guest/suite license, no internal ids
  insert into public.guest_guides (org_id, property_id, published, title, welcome) values (o1, p1, true, 'Guía', 'Hola') returning id, slug into g1, v_slug;
  reset role;
  set local role anon;
  j := public.get_public_guide(v_slug);
  if j is null or j->>'title' <> 'Guía' then raise exception 'FAIL 13: published guide not visible to a guest'; end if;
  if j::text ~* '(org_id|property_id|"id")' then raise exception 'FAIL 14: the public guide exposes internal ids'; end if;
  reset role;
  update public.guest_guides set published = false where id = g1;
  set local role anon;
  if public.get_public_guide(v_slug) is not null then raise exception 'FAIL 15: unpublished guide still visible'; end if;
  reset role;
  update public.guest_guides set published = true where id = g1;
  delete from public.licenses where org_id = o1 and product = 'suite';
  set local role anon;
  if public.get_public_guide(v_slug) is not null then raise exception 'FAIL 16: guide visible without a Guest/suite license'; end if;
  reset role;
  insert into public.licenses (org_id, product, plan, status, current_period_end) values (o1, 'suite', 'pro', 'active', null);

  -- 8) isolation: account 2 sees and touches nothing of account 1
  perform set_config('request.jwt.claims', json_build_object('sub', u2, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select (select count(*) from public.bookings where org_id = o1) + (select count(*) from public.booking_payments where org_id = o1)
       + (select count(*) from public.income_entries where org_id = o1) + (select count(*) from public.expense_entries where org_id = o1)
       + (select count(*) from public.ops_jobs where org_id = o1) + (select count(*) from public.guest_guides where org_id = o1) into n;
  if n <> 0 then raise exception 'FAIL 17: account 2 can read % rows of account 1', n; end if;
  begin
    perform public.record_booking_payment(ba, 1000, 'cash', 'x');
    raise exception 'FAIL 18: account 2 registered a payment on account 1 booking';
  exception when insufficient_privilege then null; end;
  update public.bookings set guest_name = 'X' where org_id = o1;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL 19: account 2 modified % bookings of account 1', n; end if;
  begin
    perform public.redeem_license_code(o1, 'SF-AAAA-BBBB-CCCC');
    raise exception 'FAIL 20: account 2 redeemed a code on account 1';
  exception when insufficient_privilege then null; end;
  reset role;

  -- 9) visitors without a session see nothing
  set local role anon;
  select count(*) into n from public.bookings;
  if n <> 0 then raise exception 'FAIL 21: anon can read bookings'; end if;
  reset role;

  raise exception 'ALL 21 COMPLETE CHECKS PASSED - rolled back on purpose';
end $$;
