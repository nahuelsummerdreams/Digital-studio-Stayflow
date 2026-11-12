-- Hotel / hostel structure (0024, 0025): rooms and beds are child properties; rules of the tree; no cleaning per bed. Rolls itself back.
-- Success = "ALL 14 LODGING CHECKS PASSED".
do $$
declare
  u1 uuid := gen_random_uuid(); u2 uuid := gen_random_uuid();
  oh uuid; oz uuid; or_ uuid; o2 uuid;
  est uuid; room uuid; room2 uuid; bed uuid; est_r uuid; est_other uuid; b_room uuid; b_bed uuid; n int;
begin
  perform set_config('stayflow.allow_trials', 'on', true);
  insert into auth.users (id, instance_id, aud, role, email) values
    (u1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'lodg-1@test.invalid'),
    (u2, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'lodg-2@test.invalid');
  perform set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  set local role authenticated;

  -- a rental organization (the default) cannot have rooms or beds
  or_ := public.create_organization('Lodging Rental');
  perform public.start_trial(or_, 'host');
  insert into public.properties (org_id, name) values (or_, 'Depto') returning id into est_r;
  begin
    insert into public.properties (org_id, name, parent_id, unit_kind) values (or_, 'Hab', est_r, 'room');
    raise exception 'FAIL 1: room accepted in a rental organization';
  exception when check_violation then null; end;

  -- hotel: rooms yes, beds no
  oh := public.create_organization('Lodging Hotel');
  update public.organizations set lodging_type = 'hotel' where id = oh;
  perform public.start_trial(oh, 'host');
  insert into public.properties (org_id, name) values (oh, 'Hotel Sol') returning id into est;
  insert into public.properties (org_id, name, parent_id, unit_kind, room_category, base_rate_minor) values (oh, 'Hab 101', est, 'room', 'doble', 5000000) returning id into room;
  begin
    insert into public.properties (org_id, name, parent_id, unit_kind) values (oh, 'Cama', room, 'bed');
    raise exception 'FAIL 2: bed accepted in a hotel';
  exception when check_violation then null; end;
  -- a unit needs a parent and a parent needs a kind
  begin
    insert into public.properties (org_id, name, unit_kind) values (oh, 'Suelta', 'room');
    raise exception 'FAIL 3: unit without parent accepted';
  exception when check_violation then null; end;
  -- a room cannot hang from another room
  begin
    insert into public.properties (org_id, name, parent_id, unit_kind) values (oh, 'Hab 102', room, 'room');
    raise exception 'FAIL 4: room inside a room accepted';
  exception when check_violation then null; end;
  -- the lodging type cannot change while there are units
  begin
    update public.organizations set lodging_type = 'rental' where id = oh;
    raise exception 'FAIL 5: type changed with rooms present';
  exception when check_violation then null; end;

  -- a hotel room is reserved like an apartment and checkout creates its cleaning task
  insert into public.bookings (org_id, property_id, guest_name, check_in, check_out) values (oh, room, 'Ana', date '2099-05-01', date '2099-05-03') returning id into b_room;
  select count(*) into n from public.host_tasks where booking_id = b_room;
  if n <> 1 then raise exception 'FAIL 6: hotel room checkout made % cleaning tasks', n; end if;
  begin
    insert into public.bookings (org_id, property_id, guest_name, check_in, check_out) values (oh, room, 'Luis', date '2099-05-02', date '2099-05-04');
    raise exception 'FAIL 7: double booking of a room accepted';
  exception when exclusion_violation then null; end;

  -- hostel: dorm room with beds
  oz := public.create_organization('Lodging Hostel');
  update public.organizations set lodging_type = 'hostel' where id = oz;
  perform public.start_trial(oz, 'host');
  insert into public.properties (org_id, name) values (oz, 'Hostel Mar') returning id into est_r;
  insert into public.properties (org_id, name, parent_id, unit_kind, room_category) values (oz, 'Dorm 6', est_r, 'room', 'dormitorio') returning id into room2;
  insert into public.properties (org_id, name, parent_id, unit_kind) values (oz, 'Cama 1', room2, 'bed') returning id into bed;
  -- a bed hangs from a room, not from the establishment
  begin
    insert into public.properties (org_id, name, parent_id, unit_kind) values (oz, 'Cama mala', est_r, 'bed');
    raise exception 'FAIL 8: bed hanging from the establishment accepted';
  exception when check_violation then null; end;
  -- the same bed cannot be sold twice, but two beds of one room can
  insert into public.bookings (org_id, property_id, guest_name, check_in, check_out) values (oz, bed, 'Beto', date '2099-06-01', date '2099-06-04') returning id into b_bed;
  begin
    insert into public.bookings (org_id, property_id, guest_name, check_in, check_out) values (oz, bed, 'Carla', date '2099-06-02', date '2099-06-03');
    raise exception 'FAIL 9: same bed sold twice';
  exception when exclusion_violation then null; end;
  -- 0025: a bed checkout creates no cleaning task
  select count(*) into n from public.host_tasks where booking_id = b_bed;
  if n <> 0 then raise exception 'FAIL 10: bed checkout made % cleaning tasks', n; end if;

  -- another organization cannot hang units under this establishment
  perform set_config('request.jwt.claims', json_build_object('sub', u2, 'role', 'authenticated')::text, true);
  o2 := public.create_organization('Lodging Other');
  update public.organizations set lodging_type = 'hotel' where id = o2;
  begin
    insert into public.properties (org_id, name, parent_id, unit_kind) values (o2, 'Hab intrusa', est, 'room');
    raise exception 'FAIL 11: unit under another organization''s establishment accepted';
  exception when check_violation then null; end;
  -- and it cannot see the first organization's units
  select count(*) into n from public.properties where parent_id is not null;
  if n <> 0 then raise exception 'FAIL 12: sees % foreign units', n; end if;

  -- deleting the establishment removes its rooms and beds
  perform set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  delete from public.properties where id = est_r;
  select count(*) into n from public.properties where id in (room2, bed);
  if n <> 0 then raise exception 'FAIL 13: children survived their parent'; end if;
  select count(*) into n from public.properties where id = est;
  if n <> 1 then raise exception 'FAIL 14: deleted the wrong establishment'; end if;

  raise exception 'ALL 14 LODGING CHECKS PASSED';
end $$;
