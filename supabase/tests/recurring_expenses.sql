-- Fixed (recurring) expenses: license gate, generation, idempotency, month-end clamping, isolation.
-- Rolls itself back. Success = "ALL 9 RECURRING CHECKS PASSED". Any "FAIL n" is a real problem.
do $$
declare
  u1 uuid := gen_random_uuid(); u2 uuid := gen_random_uuid();
  o1 uuid; p1 uuid; r1 uuid; n int; d date;
  m0 date := date_trunc('month', current_date)::date;
begin
  perform set_config('stayflow.allow_trials', 'on', true);
  insert into auth.users (id, instance_id, aud, role, email) values
    (u1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rec-test-1@test.invalid'),
    (u2, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rec-test-2@test.invalid');
  perform set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  set local role authenticated;
  o1 := public.create_organization('Rec Org');
  insert into public.properties (org_id, name) values (o1, 'Loft') returning id into p1;

  begin
    insert into public.recurring_expenses (org_id, property_id, amount_minor) values (o1, p1, 5000);
    raise exception 'FAIL 1: fixed cost created without a license';
  exception when insufficient_privilege then null; end;

  perform public.start_trial(o1, 'profit');

  -- started 3 months ago, due on day 1: 3 past months + this month = 4 entries
  insert into public.recurring_expenses (org_id, property_id, category, amount_minor, description, day_of_month, start_month)
  values (o1, p1, 'utilities', 5000, 'Internet', 1, (m0 - interval '3 months')::date) returning id into r1;
  -- day 31 starting last month: must clamp to the month's last day, never overflow
  insert into public.recurring_expenses (org_id, property_id, category, amount_minor, description, day_of_month, start_month)
  values (o1, null, 'insurance', 9000, 'Insurance', 31, (m0 - interval '1 month')::date);

  n := public.generate_recurring_expenses(o1);
  select count(*) into n from public.expense_entries where recurring_id = r1;
  if n <> 4 then raise exception 'FAIL 2: expected 4 internet entries, got %', n; end if;

  select incurred_on into d from public.expense_entries where description = 'Insurance' order by incurred_on limit 1;
  if d <> (m0 - interval '1 day')::date then raise exception 'FAIL 3: day 31 not clamped to month end, got %', d; end if;
  select count(*) into n from public.expense_entries where description = 'Insurance' and incurred_on > current_date;
  if n <> 0 then raise exception 'FAIL 4: future-dated entry generated'; end if;

  n := public.generate_recurring_expenses(o1);
  if n <> 0 then raise exception 'FAIL 5: second call created % duplicates', n; end if;

  delete from public.expense_entries where recurring_id = r1 and incurred_on = m0;
  n := public.generate_recurring_expenses(o1);
  if n <> 0 then raise exception 'FAIL 6: deleted entry was recreated'; end if;

  update public.recurring_expenses set active = false where id = r1;
  update public.recurring_expenses set generated_through = (m0 - interval '2 months')::date where id = r1;
  n := public.generate_recurring_expenses(o1);
  if n <> 0 then raise exception 'FAIL 7: paused fixed cost still generated'; end if;

  -- another host cannot see or generate for this org
  perform set_config('request.jwt.claims', json_build_object('sub', u2, 'role', 'authenticated')::text, true);
  select count(*) into n from public.recurring_expenses;
  if n <> 0 then raise exception 'FAIL 8: other host sees fixed costs'; end if;
  n := public.generate_recurring_expenses(o1);
  if n <> 0 then raise exception 'FAIL 9: other host generated entries'; end if;

  reset role;
  raise exception 'ALL 9 RECURRING CHECKS PASSED - rolled back on purpose';
end $$;
