-- Categories drive modules (0026, 0027): new orgs get their profile, a change adapts modules without deleting data,
-- manual modules survive, the change is logged, units block incompatible changes, clients cannot write modules. Rolls itself back.
-- Success = "ALL 16 ORG MODULE CHECKS PASSED".
do $$
declare
  u1 uuid := gen_random_uuid(); u2 uuid := gen_random_uuid(); o1 uuid; o2 uuid; est uuid; room uuid; bed uuid; bk uuid;
  n int; r jsonb; mods text[]; src text;
begin
  perform set_config('stayflow.allow_trials', 'on', true);
  insert into auth.users (id, instance_id, aud, role, email) values
    (u1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'mods-1@test.invalid'),
    (u2, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'mods-2@test.invalid');
  perform set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  set local role authenticated;

  -- 1) a new organization is a rental and gets the rental modules, including calendar sync
  o1 := public.create_organization('Mods Org');
  select array_agg(module order by module) into mods from public.org_modules where org_id = o1 and enabled;
  if mods is distinct from array['bookings','calendar','channels','dashboard','guests','messages','properties','reports','tasks'] then
    raise exception 'FAIL 1: rental modules are %', mods; end if;

  -- 2) the profiles are readable, 4 categories
  select count(distinct lodging_type) into n from public.lodging_profiles;
  if n <> 4 then raise exception 'FAIL 2: % categories', n; end if;

  -- 3) clients cannot write modules or profiles
  begin insert into public.org_modules (org_id, module) values (o1, 'front_desk'); raise exception 'FAIL 3a: client wrote a module';
  exception when insufficient_privilege then null; end;
  begin update public.org_modules set enabled = false where org_id = o1; select count(*) into n from public.org_modules where org_id = o1 and not enabled;
    if n > 0 then raise exception 'FAIL 3b: client disabled a module'; end if; end;
  begin delete from public.lodging_profiles; select count(*) into n from public.lodging_profiles; if n = 0 then raise exception 'FAIL 3c: client emptied the profiles'; end if; end;

  -- 4) the preview says what a change to hotel would do
  r := public.lodging_change_preview(o1, 'hotel');
  if (r ->> 'allowed') <> 'true' or not (r -> 'enable') ? 'reception' or not (r -> 'disable') ? 'channels' then raise exception 'FAIL 4: preview %', r; end if;

  -- 5) switching to hotel adds reception, hides sync, keeps the data
  insert into public.properties (org_id, name) values (o1, 'Hotel Sol') returning id into est;
  perform public.start_trial(o1, 'host');
  insert into public.bookings (org_id, property_id, guest_name, check_in, check_out) values (o1, est, 'Ana', date '2099-07-01', date '2099-07-03') returning id into bk;
  update public.organizations set lodging_type = 'hotel' where id = o1;
  select array_agg(module order by module) into mods from public.org_modules where org_id = o1 and enabled;
  if not (mods @> array['reception']) or (mods @> array['channels']) then raise exception 'FAIL 5: hotel modules are %', mods; end if;
  select count(*) into n from public.bookings where id = bk;
  if n <> 1 then raise exception 'FAIL 6: the change touched bookings'; end if;

  -- 7) the change is logged with who and what
  select count(*) into n from public.lodging_type_changes where org_id = o1 and from_type = 'rental' and to_type = 'hotel' and changed_by = u1;
  if n <> 1 then raise exception 'FAIL 7: change not logged (%)', n; end if;

  -- 8) rooms are fine for a hotel and also for a hostel; beds are not for a hotel
  insert into public.properties (org_id, name, parent_id, unit_kind) values (o1, 'Hab 1', est, 'room') returning id into room;
  update public.organizations set lodging_type = 'hostel' where id = o1;
  insert into public.properties (org_id, name, parent_id, unit_kind) values (o1, 'Cama 1', room, 'bed') returning id into bed;
  r := public.lodging_change_preview(o1, 'hotel');
  if (r ->> 'allowed') <> 'false' or (r ->> 'reason') <> 'has_beds' then raise exception 'FAIL 8: preview hostel->hotel %', r; end if;
  begin update public.organizations set lodging_type = 'hotel' where id = o1; raise exception 'FAIL 9: hostel with beds became a hotel';
  exception when check_violation then null; end;

  -- 10) a category without units is refused while rooms or beds exist
  r := public.lodging_change_preview(o1, 'rental');
  if (r ->> 'reason') <> 'has_units' then raise exception 'FAIL 10: preview %', r; end if;
  begin update public.organizations set lodging_type = 'cabins' where id = o1; raise exception 'FAIL 11: cabins accepted with units';
  exception when check_violation then null; end;

  -- 12) manual modules survive a category change and profile ones follow the category
  reset role;
  insert into public.org_modules (org_id, module, source) values (o1, 'extra_report', 'manual');
  delete from public.properties where parent_id is not null;
  perform set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  set local role authenticated;
  update public.organizations set lodging_type = 'cabins' where id = o1;
  select source into src from public.org_modules where org_id = o1 and module = 'extra_report';
  if src is distinct from 'manual' then raise exception 'FAIL 12: manual module lost'; end if;
  select count(*) into n from public.org_modules where org_id = o1 and module = 'reception';
  if n <> 0 then raise exception 'FAIL 13: reception still on in cabins'; end if;
  select count(*) into n from public.org_modules where org_id = o1 and module = 'channels' and enabled;
  if n <> 1 then raise exception 'FAIL 14: cabins lost calendar sync'; end if;

  -- 15) cabins accept no rooms (they stay top-level properties for now)
  begin insert into public.properties (org_id, name, parent_id, unit_kind) values (o1, 'Hab', est, 'room'); raise exception 'FAIL 15: room accepted in cabins';
  exception when check_violation then null; end;

  -- 16) another organization sees none of this
  perform set_config('request.jwt.claims', json_build_object('sub', u2, 'role', 'authenticated')::text, true);
  o2 := public.create_organization('Mods Other');
  select count(*) into n from public.org_modules where org_id = o1;
  if n <> 0 then raise exception 'FAIL 16a: sees % foreign modules', n; end if;
  select count(*) into n from public.lodging_type_changes where org_id = o1;
  if n <> 0 then raise exception 'FAIL 16b: sees foreign category changes'; end if;
  begin perform public.lodging_change_preview(o1, 'hotel'); raise exception 'FAIL 16c: preview of a foreign org';
  exception when insufficient_privilege then null; end;

  raise exception 'ALL 16 ORG MODULE CHECKS PASSED';
end $$;
