-- Operations: jobs follow bookings, checklists, the team's private link, recurring maintenance, isolation.
-- Rolls itself back. Success = "ALL 14 OPERATIONS CHECKS PASSED". Any "FAIL n" is a real problem.
do $$
declare
  u1 uuid := gen_random_uuid(); u2 uuid := gen_random_uuid();
  o1 uuid; o2 uuid; p1 uuid; ba uuid; bb uuid; ja uuid; jb uuid; s1 uuid; tok uuid; n int; v_next date; v_due date; v_status text; v_done jsonb; v_at timestamptz;
begin
  insert into auth.users (id, instance_id, aud, role, email) values
    (u1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ops-1@test.invalid'),
    (u2, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ops-2@test.invalid');

  perform set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  set local role authenticated;
  o1 := public.create_organization('Ops Org 1');
  perform public.start_trial(o1, 'host');
  insert into public.properties (org_id, name) values (o1, 'Loft') returning id into p1;
  insert into public.bookings (org_id, property_id, guest_name, check_in, check_out) values (o1, p1, 'Ana', current_date - 2, current_date + 3) returning id into ba;
  insert into public.bookings (org_id, property_id, guest_name, check_in, check_out) values (o1, p1, 'Beto', current_date + 3, current_date + 6) returning id into bb;

  -- 1) no Operations license: sync refused
  begin
    perform public.ops_sync_bookings(o1);
    raise exception 'FAIL 1: sync worked without an Operations license';
  exception when insufficient_privilege then null; end;

  perform public.start_trial(o1, 'operations');
  -- 2) sync creates one cleaning job per stay, with the default checklist
  n := public.ops_sync_bookings(o1);
  if n <> 2 then raise exception 'FAIL 2: expected 2 jobs, got %', n; end if;
  select id, next_checkin, jsonb_array_length(checklist) into ja, v_next, n from public.ops_jobs where booking_id = ba;
  if n <> 9 then raise exception 'FAIL 3: default checklist has % items', n; end if;
  if v_next is distinct from current_date + 3 then raise exception 'FAIL 4: next_checkin of Ana job is %', v_next; end if;
  -- 5) idempotent
  if public.ops_sync_bookings(o1) <> 0 then raise exception 'FAIL 5: second sync added jobs'; end if;

  -- 6) a custom checklist for the property wins over the default (for new jobs)
  insert into public.ops_checklists (org_id, name, kind, property_id, items) values (o1, 'Loft', 'cleaning', p1, '["Solo esto"]');
  insert into public.bookings (org_id, property_id, guest_name, check_in, check_out) values (o1, p1, 'Carla', current_date + 6, current_date + 8);
  perform public.ops_sync_bookings(o1);
  select jsonb_array_length(checklist) into n from public.ops_jobs where title like '%Carla';
  if n <> 1 then raise exception 'FAIL 6: custom checklist ignored (% items)', n; end if;

  -- 7) the job follows a moved check-out; 8) canceling the stay removes its pending job
  update public.bookings set check_out = current_date + 5 where id = bb;
  perform public.ops_sync_bookings(o1);
  select due_on into v_due from public.ops_jobs where booking_id = bb;
  if v_due is distinct from current_date + 5 then raise exception 'FAIL 7: job did not follow check-out (%)', v_due; end if;
  update public.bookings set status = 'canceled' where id = bb;
  perform public.ops_sync_bookings(o1);
  select count(*) into n from public.ops_jobs where booking_id = bb;
  if n <> 0 then raise exception 'FAIL 8: canceled stay kept its job'; end if;

  -- 9) team: assign, then work from the private link as anon
  insert into public.ops_staff (org_id, name) values (o1, 'Rosa') returning id, token into s1, tok;
  update public.ops_jobs set assignee_id = s1 where id = ja;
  set local role anon;
  select count(*) into n from public.ops_staff_jobs(tok);
  if n <> 1 then raise exception 'FAIL 9: staff sees % jobs (expected 1)', n; end if;
  select count(*) into n from public.ops_staff_jobs(gen_random_uuid());
  if n <> 0 then raise exception 'FAIL 10: wrong token sees jobs'; end if;
  select count(*) into n from public.ops_staff_info(tok);
  if n <> 1 then raise exception 'FAIL 10b: valid token not recognised'; end if;
  select count(*) into n from public.ops_staff_info(gen_random_uuid());
  if n <> 0 then raise exception 'FAIL 10c: wrong token recognised'; end if;
  perform public.ops_staff_update(tok, ja, 'done', '[true,true,false,true,true,true,true,true,true]'::jsonb);
  set local role authenticated;
  select status, checklist, done_at into v_status, v_done, v_at from public.ops_jobs where id = ja;
  if v_status <> 'done' or v_at is null then raise exception 'FAIL 11: job not marked done'; end if;
  if (v_done -> 2 ->> 'done') <> 'false' or (v_done -> 0 ->> 'done') <> 'true' or (v_done -> 0 ->> 'text') <> 'Ventilar y abrir ventanas' then raise exception 'FAIL 11b: checklist flags wrong %', v_done; end if;
  -- the team cannot touch jobs that are not theirs, nor reach tables
  select id into jb from public.ops_jobs where booking_id is distinct from ba limit 1;
  set local role anon;
  begin
    perform public.ops_staff_update(tok, jb, 'done', null);
    raise exception 'FAIL 12: staff changed someone else''s job';
  exception when insufficient_privilege then null; end;
  select count(*) into n from public.ops_jobs;
  if n <> 0 then raise exception 'FAIL 13: anon can read ops_jobs'; end if;
  set local role authenticated;

  -- 14) recurring maintenance becomes a job once, then moves forward
  insert into public.ops_recurring (org_id, property_id, title, every_days, next_due, checklist) values (o1, p1, 'Filtros del aire', 30, current_date + 2, '[{"text":"Limpiar","done":false}]');
  if public.ops_generate_recurring(o1) <> 1 then raise exception 'FAIL 14: recurring did not create a job'; end if;
  if public.ops_generate_recurring(o1) <> 0 then raise exception 'FAIL 15: recurring created twice'; end if;

  -- 16) another business sees nothing and cannot sync ours
  perform set_config('request.jwt.claims', json_build_object('sub', u2, 'role', 'authenticated')::text, true);
  o2 := public.create_organization('Ops Org 2');
  select count(*) into n from public.ops_jobs;
  if n <> 0 then raise exception 'FAIL 16: other business sees % jobs', n; end if;
  begin
    perform public.ops_sync_bookings(o1);
    raise exception 'FAIL 17: synced another business';
  exception when insufficient_privilege then null; end;

  reset role;
  raise exception 'ALL 14 OPERATIONS CHECKS PASSED - rolled back on purpose';
end $$;
