-- Seller tools: issue a batch of codes, customer redeems, refund cancels; the browser can do none of the admin parts. Rolls itself back.
-- Success = "ALL 11 LICENSE ADMIN CHECKS PASSED".
do $$
declare
  u1 uuid := gen_random_uuid(); o1 uuid; codes text[]; n int; r text; c1 text; bad int; st text;
begin
  insert into auth.users (id, instance_id, aud, role, email) values
    (u1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'lic-admin-1@test.invalid');
  select array_agg(x) into codes from public.create_license_codes(array['host','guest']::public.product_key[], 25, 'lote de prueba') x;
  if cardinality(codes) <> 25 then raise exception 'FAIL 1: made %', cardinality(codes); end if;
  select count(*) into bad from unnest(codes) c where c !~ '^SF-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$';
  if bad <> 0 then raise exception 'FAIL 2: % malformed codes', bad; end if;
  select count(distinct c) into n from unnest(codes) c;
  if n <> 25 then raise exception 'FAIL 3: duplicates'; end if;
  select count(*) into n from public.license_codes where code = any(codes) and products = array['host','guest']::public.product_key[] and note = 'lote de prueba';
  if n <> 25 then raise exception 'FAIL 4: stored wrong (%)', n; end if;
  begin perform public.create_license_codes(array['host']::public.product_key[], 0, ''); raise exception 'FAIL 5a';
  exception when sqlstate '22023' then null; end;
  begin perform public.create_license_codes(array[]::public.product_key[], 1, ''); raise exception 'FAIL 5b';
  exception when sqlstate '22023' then null; end;
  c1 := codes[1];
  perform set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  set local role authenticated;
  o1 := public.create_organization('Lic Admin Org');
  perform public.redeem_license_code(o1, c1);
  if not public.has_product_access(o1, 'host') then raise exception 'FAIL 6: not activated'; end if;
  begin perform public.create_license_codes(array['host']::public.product_key[], 1, ''); raise exception 'FAIL 7a: customer can issue codes';
  exception when insufficient_privilege then null; end;
  begin perform public.revoke_license_code(c1); raise exception 'FAIL 7b: customer can revoke';
  exception when insufficient_privilege then null; end;
  begin select count(*) into n from public.license_codes_overview; raise exception 'FAIL 7c: customer can read the overview';
  exception when insufficient_privilege then null; end;
  reset role;
  r := public.revoke_license_code(c1);
  if r not like 'revoked: 2%' then raise exception 'FAIL 8: %', r; end if;
  perform set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  set local role authenticated;
  if public.has_product_access(o1, 'host') or public.has_product_access(o1, 'guest') then raise exception 'FAIL 9: still has access after refund'; end if;
  reset role;
  r := public.revoke_license_code(codes[2]);
  if r not like 'deleted%' then raise exception 'FAIL 10: %', r; end if;
  select redeemed_by_business into st from public.license_codes_overview where code = c1;
  if st is distinct from 'Lic Admin Org' then raise exception 'FAIL 11: overview shows %', st; end if;
  raise exception 'ALL 11 LICENSE ADMIN CHECKS PASSED';
end $$;
