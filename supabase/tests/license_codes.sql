-- License codes: no free trial; a code unlocks products once, only for an org you administer. Rolls itself back.
-- Success = "ALL 9 LICENSE CODE CHECKS PASSED".
do $$
declare
  u1 uuid := gen_random_uuid(); u2 uuid := gen_random_uuid(); o1 uuid; o2 uuid; r text[]; n int; upd timestamptz; per timestamptz;
begin
  insert into auth.users (id, instance_id, aud, role, email) values
    (u1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'lic-1@test.invalid'),
    (u2, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'lic-2@test.invalid');
  insert into public.license_codes (code, products, note) values
    ('SF-ABCD-EFGH-JKLM', '{host,guest}', 'test 1'), ('SF-PQRS-TUVW-XYZ2', '{profit}', 'test 2');
  perform set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  set local role authenticated;
  o1 := public.create_organization('Lic Org 1');
  begin perform public.start_trial(o1, 'host'); raise exception 'FAIL 1: trial still starts';
  exception when insufficient_privilege then null; end;
  if public.has_product_access(o1, 'host') then raise exception 'FAIL 1b: access without license'; end if;
  begin select count(*) into n from public.license_codes; raise exception 'FAIL 2: codes readable';
  exception when insufficient_privilege then null; end;
  begin perform public.redeem_license_code(o1, 'SF-AAAA-AAAA-AAAA'); raise exception 'FAIL 3: unknown code accepted';
  exception when sqlstate 'P0002' then null; end;
  r := public.redeem_license_code(o1, '  sf-abcd-efgh-jklm ');
  if array_length(r, 1) <> 2 then raise exception 'FAIL 4: unlocked %', r; end if;
  if not public.has_product_access(o1, 'host') or not public.has_product_access(o1, 'guest') then raise exception 'FAIL 4b: no access after redeem'; end if;
  if public.has_product_access(o1, 'profit') then raise exception 'FAIL 4c: unrelated product unlocked'; end if;
  select updates_until, current_period_end into upd, per from public.licenses where org_id = o1 and product = 'host';
  if per is not null then raise exception 'FAIL 5: license expires'; end if;
  if upd < now() + interval '364 days' or upd > now() + interval '367 days' then raise exception 'FAIL 6: updates_until %', upd; end if;
  begin perform public.redeem_license_code(o1, 'SF-ABCD-EFGH-JKLM'); raise exception 'FAIL 7: code reused';
  exception when sqlstate 'P0002' then null; end;
  perform set_config('request.jwt.claims', json_build_object('sub', u2, 'role', 'authenticated')::text, true);
  o2 := public.create_organization('Lic Org 2');
  begin perform public.redeem_license_code(o1, 'SF-PQRS-TUVW-XYZ2'); raise exception 'FAIL 8: redeemed into a foreign org';
  exception when insufficient_privilege then null; end;
  perform public.redeem_license_code(o2, 'SF-PQRS-TUVW-XYZ2');
  if not public.has_product_access(o2, 'profit') then raise exception 'FAIL 9: own redeem failed'; end if;
  raise exception 'ALL 9 LICENSE CODE CHECKS PASSED';
end $$;
