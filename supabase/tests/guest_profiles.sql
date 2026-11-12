-- Guest profiles and timeline (0028): upsert, validations, author stamped by the server, viewer is read-only,
-- other organizations see nothing, no Host license means no access, deleting the org removes everything. Rolls itself back.
-- Success = "ALL 14 GUEST PROFILE CHECKS PASSED".
do $$
declare
  u1 uuid := gen_random_uuid(); u2 uuid := gen_random_uuid(); u3 uuid := gen_random_uuid(); o1 uuid; o2 uuid; n int; who uuid; ts timestamptz; ts2 timestamptz;
begin
  perform set_config('stayflow.allow_trials', 'on', true);
  insert into auth.users (id, instance_id, aud, role, email) values
    (u1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'gp-1@test.invalid'),
    (u2, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'gp-2@test.invalid'),
    (u3, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'gp-3@test.invalid');
  perform set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  set local role authenticated;
  o1 := public.create_organization('GP Org 1');
  perform public.start_trial(o1, 'host');
  insert into public.guest_profiles (org_id, guest_key, document, notes, preferences, vip, tags) values (o1, 'ana@x.com', 'DNI 123', 'Prefiere piso alto', 'Sin gluten', true, array['familia','frecuente']);
  select updated_at into ts from public.guest_profiles where org_id = o1 and guest_key = 'ana@x.com';
  perform pg_sleep(0.02);
  insert into public.guest_profiles (org_id, guest_key, notes) values (o1, 'ana@x.com', 'Nueva nota') on conflict (org_id, guest_key) do update set notes = excluded.notes;
  select updated_at into ts2 from public.guest_profiles where org_id = o1 and guest_key = 'ana@x.com';
  if ts2 <= ts then raise exception 'FAIL 1: updated_at did not move'; end if;
  begin insert into public.guest_profiles (org_id, guest_key, tags) values (o1, 'k2', array(select 'x'||i from generate_series(1,11) i)); raise exception 'FAIL 2a: 11 tags accepted';
  exception when check_violation then null; end;
  begin insert into public.guest_profiles (org_id, guest_key, tags) values (o1, 'k3', array[repeat('a', 31)]); raise exception 'FAIL 2b: 31-char tag accepted';
  exception when check_violation then null; end;
  begin insert into public.guest_events (org_id, guest_key, kind, body) values (o1, 'ana@x.com', 'complaint', 'x'); raise exception 'FAIL 2c: bad kind accepted';
  exception when check_violation then null; end;
  begin insert into public.guest_events (org_id, guest_key, kind, body) values (o1, 'ana@x.com', 'note', ''); raise exception 'FAIL 2d: empty event accepted';
  exception when check_violation then null; end;
  insert into public.guest_events (org_id, guest_key, kind, body, created_by) values (o1, 'ana@x.com', 'incident', 'Rompió una lámpara', u2);
  select created_by into who from public.guest_events where org_id = o1 and body like 'Rompió%';
  if who is distinct from u1 then raise exception 'FAIL 3: author is %', who; end if;
  reset role;
  insert into public.memberships (org_id, user_id, role) values (o1, u3, 'viewer');
  perform set_config('request.jwt.claims', json_build_object('sub', u3, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.guest_profiles where org_id = o1;
  if n <> 1 then raise exception 'FAIL 4a: viewer sees % profiles', n; end if;
  begin insert into public.guest_events (org_id, guest_key, kind, body) values (o1, 'ana@x.com', 'note', 'intruso'); raise exception 'FAIL 4b: viewer wrote an event';
  exception when insufficient_privilege then null; end;
  update public.guest_profiles set vip = false where org_id = o1;
  reset role;
  select vip::int into n from public.guest_profiles where org_id = o1 and guest_key = 'ana@x.com';
  if n <> 1 then raise exception 'FAIL 4c: viewer changed a profile'; end if;
  perform set_config('request.jwt.claims', json_build_object('sub', u2, 'role', 'authenticated')::text, true);
  set local role authenticated;
  o2 := public.create_organization('GP Org 2');
  perform public.start_trial(o2, 'host');
  select count(*) into n from public.guest_profiles; if n <> 0 then raise exception 'FAIL 5a: sees % foreign profiles', n; end if;
  select count(*) into n from public.guest_events; if n <> 0 then raise exception 'FAIL 5b: sees % foreign events', n; end if;
  begin insert into public.guest_profiles (org_id, guest_key) values (o1, 'hack'); raise exception 'FAIL 5c: wrote into a foreign org';
  exception when insufficient_privilege then null; end;
  reset role;
  delete from public.licenses where org_id = o1 and product = 'host';
  perform set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.guest_profiles where org_id = o1; if n <> 0 then raise exception 'FAIL 6: read without license (%)', n; end if;
  reset role;
  delete from public.organizations where id = o1;
  select count(*) into n from public.guest_profiles where org_id = o1; if n <> 0 then raise exception 'FAIL 7a'; end if;
  select count(*) into n from public.guest_events where org_id = o1; if n <> 0 then raise exception 'FAIL 7b'; end if;
  raise exception 'ALL 14 GUEST PROFILE CHECKS PASSED';
end $$;
