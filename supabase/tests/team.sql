-- Team: invitations, roles, removal, audit, task assignment, message log. Rolls itself back.
-- Success = "ALL 12 TEAM CHECKS PASSED".
do $$
declare
  u1 uuid := gen_random_uuid(); u2 uuid := gen_random_uuid(); u3 uuid := gen_random_uuid();
  o1 uuid; p1 uuid; b1 uuid; t1 uuid; tk uuid; n int; r text; j jsonb;
begin
  perform set_config('stayflow.allow_trials', 'on', true);
  insert into auth.users (id, instance_id, aud, role, email) values
    (u1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'team-owner@test.invalid'),
    (u2, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'team-member@test.invalid'),
    (u3, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'team-viewer@test.invalid');
  perform set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  set local role authenticated;
  o1 := public.create_organization('Team Org');
  perform public.start_trial(o1, 'host');
  insert into public.properties (org_id, name) values (o1, 'Loft') returning id into p1;
  insert into public.bookings (org_id, property_id, guest_name, check_in, check_out) values (o1, p1, 'Ana', '2027-03-01', '2027-03-03') returning id into b1;

  -- 1-2: invite and accept
  t1 := public.invite_team_member(o1, 'Team-Member@test.invalid', 'member');
  j := public.team_overview(o1);
  if jsonb_array_length(j->'invites') <> 1 then raise exception 'FAIL 1: invite not listed'; end if;
  perform set_config('request.jwt.claims', json_build_object('sub', u3, 'role', 'authenticated')::text, true);
  begin perform public.accept_team_invite(t1); raise exception 'FAIL 2: another email accepted the invite';
  exception when invalid_parameter_value then null; end;

  perform set_config('request.jwt.claims', json_build_object('sub', u2, 'role', 'authenticated')::text, true);
  perform public.accept_team_invite(t1);
  select role::text into r from public.memberships where org_id = o1 and user_id = u2;
  if r <> 'member' then raise exception 'FAIL 3: member role not granted (%)', r; end if;
  begin perform public.accept_team_invite(t1); raise exception 'FAIL 4: invite reused';
  exception when invalid_parameter_value then null; end;

  -- 5: a member cannot manage the team or read the audit
  begin perform public.invite_team_member(o1, 'x@test.invalid', 'viewer'); raise exception 'FAIL 5: member invited someone';
  exception when insufficient_privilege then null; end;
  begin perform public.audit_overview(o1); select count(*) into n from public.audit_overview(o1); if n > 0 then raise exception 'FAIL 6: member read the audit log'; end if; end;

  -- 7: a member cannot make himself owner through the table
  update public.memberships set role = 'owner' where org_id = o1 and user_id = u2;
  select role::text into r from public.memberships where org_id = o1 and user_id = u2;
  if r <> 'member' then raise exception 'FAIL 7: member escalated to owner'; end if;

  -- 8-9: assignment only inside the team, member sees names
  insert into public.host_tasks (org_id, title, assignee_id, priority) values (o1, 'Revisar', u2, 2) returning id into tk;
  begin insert into public.host_tasks (org_id, title, assignee_id) values (o1, 'X', u3); raise exception 'FAIL 8: assigned to a stranger';
  exception when invalid_parameter_value then null; end;
  select count(*) into n from public.org_people(o1);
  if n <> 2 then raise exception 'FAIL 9: org_people returned %', n; end if;

  -- 10: message log
  perform public.log_booking_message(b1, 'whatsapp', 'welcome');
  select count(*) into n from public.booking_messages where booking_id = b1;
  if n <> 1 then raise exception 'FAIL 10: message not logged'; end if;

  -- 11: owner changes role, removes member; task is unassigned; audit has entries
  perform set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  perform public.set_member_role(o1, u2, 'viewer');
  begin perform public.log_booking_message(b1, 'email'); exception when insufficient_privilege then null; end;
  perform set_config('request.jwt.claims', json_build_object('sub', u2, 'role', 'authenticated')::text, true);
  begin perform public.log_booking_message(b1, 'email', ''); raise exception 'FAIL 11: viewer logged a message';
  exception when insufficient_privilege then null; end;
  perform set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  perform public.remove_team_member(o1, u2);
  select count(*) into n from public.host_tasks where id = tk and assignee_id is null;
  if n <> 1 then raise exception 'FAIL 11b: task kept a removed assignee'; end if;
  begin perform public.remove_team_member(o1, u1); raise exception 'FAIL 12: owner removed';
  exception when invalid_parameter_value then null; end;
  delete from public.bookings where id = b1;
  select count(*) into n from public.audit_overview(o1) where action in ('team.invite', 'team.joined', 'team.role', 'team.removed', 'booking.deleted');
  if n <> 5 then raise exception 'FAIL 12b: expected 5 audit rows, got %', n; end if;

  raise exception 'ALL 12 TEAM CHECKS PASSED';
end $$;
