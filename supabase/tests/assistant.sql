-- Assistant usage cap: counts per organization, stops at the cap, needs a Host licence, no direct table access.
-- Rolls itself back. Success = "ALL 6 ASSISTANT CHECKS PASSED". Any "FAIL n" is a real problem.
do $$
declare
  u1 uuid := gen_random_uuid(); u2 uuid := gen_random_uuid(); o1 uuid; o2 uuid; left_ int; n int;
begin
  perform set_config('stayflow.allow_trials', 'on', true);
  insert into auth.users (id, instance_id, aud, role, email) values
    (u1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'assistant-test-1@test.invalid'),
    (u2, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'assistant-test-2@test.invalid');

  perform set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  set local role authenticated;
  o1 := public.create_organization('Assistant Org 1');

  begin
    perform public.assistant_consume(o1, 5);
    raise exception 'FAIL 1: used the assistant without a Host licence';
  exception when insufficient_privilege then null; end;

  perform public.start_trial(o1, 'host');
  left_ := public.assistant_consume(o1, 2);
  if left_ <> 1 then raise exception 'FAIL 2: expected 1 left, got %', left_; end if;
  left_ := public.assistant_consume(o1, 2);
  if left_ <> 0 then raise exception 'FAIL 3: expected 0 left, got %', left_; end if;
  begin
    perform public.assistant_consume(o1, 2);
    raise exception 'FAIL 4: went over the daily cap';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'assistant_limit' then raise; end if;
  end;

  -- another organization cannot spend this one's quota
  perform set_config('request.jwt.claims', json_build_object('sub', u2, 'role', 'authenticated')::text, true);
  o2 := public.create_organization('Assistant Org 2');
  perform public.start_trial(o2, 'host');
  begin
    perform public.assistant_consume(o1, 99);
    raise exception 'FAIL 5: used another organization quota';
  exception when insufficient_privilege then null; end;

  begin
    select count(*) into n from public.assistant_usage;
    raise exception 'FAIL 6: members can read the usage table directly';
  exception when insufficient_privilege then null; end;

  reset role;
  raise exception 'ALL 6 ASSISTANT CHECKS PASSED - rolled back on purpose';
end $$;
