-- Tenant isolation + license gating test. Run in the Supabase SQL editor (or via MCP execute_sql).
-- It always ends with an exception so the whole transaction rolls back and no test data stays behind.
-- Success = "ALL 14 RLS CHECKS PASSED". Any "FAIL n" message is a real problem.
do $$
declare
  u1 uuid := gen_random_uuid(); u2 uuid := gen_random_uuid();
  o1 uuid; o2 uuid; p1 uuid; n int;
begin
  insert into auth.users (id, instance_id, aud, role, email) values
    (u1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-test-1@test.invalid'),
    (u2, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-test-2@test.invalid');
  select count(*) into n from public.profiles where id in (u1, u2);
  if n <> 2 then raise exception 'FAIL 1: signup trigger did not create profiles (%)', n; end if;

  -- anonymous visitor
  set local role anon;
  select count(*) into n from public.organizations;
  if n <> 0 then raise exception 'FAIL 2: anon can read organizations'; end if;
  begin
    perform public.create_organization('Anon Org');
    raise exception 'FAIL 3: anon could create an organization';
  exception when insufficient_privilege then null; end;
  reset role;

  -- host 1
  perform set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  set local role authenticated;
  o1 := public.create_organization('Org One', 'usd');
  insert into public.properties (org_id, name) values (o1, 'Loft') returning id into p1;

  begin
    insert into public.income_entries (org_id, property_id, amount_minor) values (o1, p1, 1000);
    raise exception 'FAIL 4: income insert allowed without a license';
  exception when insufficient_privilege then null; end;

  begin
    insert into public.licenses (org_id, product, plan, status) values (o1, 'profit', 'starter', 'active');
    raise exception 'FAIL 5: host granted themself a license';
  exception when insufficient_privilege then null; end;

  -- billing webhook (service side) grants the license
  reset role;
  insert into public.licenses (org_id, product, plan, status) values (o1, 'profit', 'starter', 'active');
  set local role authenticated;

  insert into public.income_entries (org_id, property_id, amount_minor, nights) values (o1, p1, 150000, 5);
  insert into public.expense_entries (org_id, property_id, amount_minor) values (o1, p1, 20000);
  select count(*) into n from public.income_entries;
  if n <> 1 then raise exception 'FAIL 6: licensed host cannot read own income (%)', n; end if;

  -- host 2
  perform set_config('request.jwt.claims', json_build_object('sub', u2, 'role', 'authenticated')::text, true);
  o2 := public.create_organization('Org Two');
  select count(*) into n from public.organizations;
  if n <> 1 then raise exception 'FAIL 7: host 2 sees % organizations', n; end if;
  select count(*) into n from public.properties;
  if n <> 0 then raise exception 'FAIL 8: host 2 sees host 1 properties'; end if;
  select count(*) into n from public.income_entries;
  if n <> 0 then raise exception 'FAIL 9: host 2 sees host 1 income'; end if;
  select count(*) into n from public.licenses;
  if n <> 0 then raise exception 'FAIL 10: host 2 sees host 1 licenses'; end if;

  begin
    insert into public.properties (org_id, name) values (o1, 'Intruder');
    raise exception 'FAIL 11: host 2 inserted a property into org 1';
  exception when insufficient_privilege then null; end;

  update public.properties set name = 'Hacked' where id = p1;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL 12: host 2 updated host 1 property'; end if;

  delete from public.organizations where id = o1;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL 13: host 2 deleted org 1'; end if;

  -- expired license locks host 1 out again
  reset role;
  update public.licenses set current_period_end = now() - interval '1 day' where org_id = o1;
  perform set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.income_entries;
  if n <> 0 then raise exception 'FAIL 14: expired license still reads income'; end if;

  reset role;
  raise exception 'ALL 14 RLS CHECKS PASSED - transaction rolled back on purpose';
end $$;
