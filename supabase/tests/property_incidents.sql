-- Property sheet and incidents: isolation, viewer is read-only, resolution is stamped, cost goes to Profit once.
-- Rolls itself back. Success = "ALL 8 INCIDENT CHECKS PASSED".
do $$
declare
  u1 uuid := gen_random_uuid(); u2 uuid := gen_random_uuid(); u3 uuid := gen_random_uuid();
  o1 uuid; p1 uuid; i1 uuid; n int; v timestamptz; e1 uuid; e2 uuid;
begin
  perform set_config('stayflow.allow_trials', 'on', true);
  insert into auth.users (id, instance_id, aud, role, email) values
    (u1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'inc-1@test.invalid'),
    (u2, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'inc-2@test.invalid'),
    (u3, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'inc-3@test.invalid');
  perform set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  set local role authenticated;
  o1 := public.create_organization('Inc Org');
  perform public.start_trial(o1, 'host');
  perform public.start_trial(o1, 'profit');
  insert into public.properties (org_id, name) values (o1, 'Loft') returning id into p1;

  insert into public.property_details (property_id, org_id, capacity, amenities, access_notes) values (p1, o1, 4, array['wifi','aire'], 'Caja 1234');
  select count(*) into n from public.property_details where property_id = p1;
  if n <> 1 then raise exception 'FAIL 1: details not saved'; end if;
  begin
    update public.property_details set capacity = 0 where property_id = p1;
    raise exception 'FAIL 2: capacity 0 accepted';
  exception when check_violation then null; end;

  insert into public.property_incidents (org_id, property_id, title, cost_minor, priority) values (o1, p1, 'Canilla gotea', 12000, 2) returning id into i1;
  update public.property_incidents set status = 'resolved' where id = i1;
  select resolved_at into v from public.property_incidents where id = i1;
  if v is null then raise exception 'FAIL 3: resolution not stamped'; end if;
  update public.property_incidents set status = 'open' where id = i1;
  select resolved_at into v from public.property_incidents where id = i1;
  if v is not null then raise exception 'FAIL 4: reopened incident kept resolved_at'; end if;

  e1 := public.incident_to_expense(i1);
  e2 := public.incident_to_expense(i1);
  select count(*) into n from public.expense_entries where incident_id = i1 and category = 'maintenance' and amount_minor = 12000;
  if e1 is null or e2 is not null or n <> 1 then raise exception 'FAIL 5: expense not created exactly once (% % %)', e1, e2, n; end if;

  -- another organization sees nothing and cannot write
  perform set_config('request.jwt.claims', json_build_object('sub', u2, 'role', 'authenticated')::text, true);
  select count(*) into n from public.property_incidents;
  if n <> 0 then raise exception 'FAIL 6: another organization reads incidents'; end if;
  select count(*) into n from public.property_details;
  if n <> 0 then raise exception 'FAIL 7: another organization reads property sheets (access codes)'; end if;

  -- a viewer reads but cannot write
  reset role;
  insert into public.memberships (org_id, user_id, role) values (o1, u3, 'viewer');
  perform set_config('request.jwt.claims', json_build_object('sub', u3, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    insert into public.property_incidents (org_id, property_id, title) values (o1, p1, 'X');
    raise exception 'FAIL 8: viewer reported an incident';
  exception when insufficient_privilege then null; end;

  raise exception 'ALL 8 INCIDENT CHECKS PASSED';
end $$;
