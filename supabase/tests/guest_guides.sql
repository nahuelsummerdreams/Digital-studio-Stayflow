-- Stayflow Guest: license gate, public access through get_public_guide, isolation, limits.
-- Rolls itself back. Success = "ALL 16 GUEST CHECKS PASSED". Any "FAIL n" is a real problem.
do $$
declare
  u1 uuid := gen_random_uuid(); u2 uuid := gen_random_uuid();
  o1 uuid; o2 uuid; p1 uuid; p2 uuid; g1 uuid; g2 uuid;
  v_slug text; v_new text; j jsonb; n int;
begin
  insert into auth.users (id, instance_id, aud, role, email) values
    (u1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'guest-test-1@test.invalid'),
    (u2, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'guest-test-2@test.invalid');

  -- host 1
  perform set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  set local role authenticated;
  o1 := public.create_organization('Guest Org 1');
  insert into public.properties (org_id, name, city) values (o1, 'Loft', 'Malaga') returning id into p1;

  begin
    insert into public.guest_guides (org_id, property_id) values (o1, p1);
    raise exception 'FAIL 1: guide created without a Guest license';
  exception when insufficient_privilege then null; end;

  perform public.start_trial(o1, 'guest');
  insert into public.guest_guides (org_id, property_id, title, welcome, wifi_name, wifi_password, accent)
  values (o1, p1, 'Bienvenidos', 'Hola', 'LoftWifi', 's3cret-pass', 'green')
  returning id, slug into g1, v_slug;
  insert into public.guest_guide_items (guide_id, kind, category, title, body, sort) values
    (g1, 'place', 'restaurant', 'Bar Pepe', 'Tapas', 2),
    (g1, 'faq', '', 'Hay parking?', 'Si, en la calle', 1);

  -- 2: unpublished guide is invisible to the public
  reset role; set local role anon;
  if public.get_public_guide(v_slug) is not null then raise exception 'FAIL 2: unpublished guide is public'; end if;
  select count(*) into n from public.guest_guides;
  if n <> 0 then raise exception 'FAIL 3: anon can read the guides table'; end if;
  begin
    insert into public.guest_guides (org_id, property_id) values (o1, p1);
    raise exception 'FAIL 4: anon created a guide';
  -- the property-ownership trigger can reject before RLS does: either way the insert is denied
  exception when insufficient_privilege or raise_exception then
    if sqlerrm like 'FAIL%' then raise; end if;
  end;
  begin
    perform public.org_license_valid(o1, 'guest');
    raise exception 'FAIL 5: anon can call the internal license helper';
  exception when insufficient_privilege then null; end;
  reset role;

  -- 6: published guide is public, complete, ordered, and leaks no internal ids
  perform set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  set local role authenticated;
  update public.guest_guides set published = true where id = g1;
  reset role; set local role anon;
  j := public.get_public_guide(v_slug);
  if j is null or j ->> 'wifi_name' <> 'LoftWifi' or j ->> 'wifi_password' <> 's3cret-pass' or j ->> 'property_name' <> 'Loft'
    then raise exception 'FAIL 6: published guide not served correctly: %', j; end if;
  if j -> 'items' -> 0 ->> 'title' <> 'Hay parking?' or jsonb_array_length(j -> 'items') <> 2
    then raise exception 'FAIL 7: items missing or out of order'; end if;
  if j::text ~* '(org_id|property_id|"id"|guide_id)' then raise exception 'FAIL 8: internal ids leaked'; end if;
  if public.get_public_guide('nope') is not null or public.get_public_guide('') is not null
    then raise exception 'FAIL 9: unknown slug returned data'; end if;
  reset role;

  -- host 2 cannot touch host 1
  perform set_config('request.jwt.claims', json_build_object('sub', u2, 'role', 'authenticated')::text, true);
  set local role authenticated;
  o2 := public.create_organization('Guest Org 2');
  insert into public.properties (org_id, name) values (o2, 'Estudio') returning id into p2;
  perform public.start_trial(o2, 'guest');
  select count(*) into n from public.guest_guides;
  if n <> 0 then raise exception 'FAIL 10: host 2 sees host 1 guides'; end if;
  begin
    insert into public.guest_guide_items (guide_id, kind, title) values (g1, 'faq', 'Intruso');
    raise exception 'FAIL 11: host 2 added an item to host 1 guide';
  exception when insufficient_privilege then null; end;
  update public.guest_guides set title = 'Hacked' where id = g1;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL 12: host 2 edited host 1 guide'; end if;
  begin
    insert into public.guest_guides (org_id, property_id) values (o2, p1);
    raise exception 'FAIL 13: guide linked to a property of another organization';
  exception when others then
    if sqlerrm not like '%does not belong%' and sqlstate <> '42501' then raise; end if;
  end;
  begin
    perform public.rotate_guide_slug(g1);
    raise exception 'FAIL 14: host 2 rotated host 1 link';
  exception when insufficient_privilege then null; end;
  reset role;

  -- 15: rotating the link kills the old one
  perform set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  set local role authenticated;
  v_new := public.rotate_guide_slug(g1);
  reset role; set local role anon;
  if v_new = v_slug or public.get_public_guide(v_slug) is not null or public.get_public_guide(v_new) is null
    then raise exception 'FAIL 15: link rotation did not replace the old link'; end if;
  reset role;

  -- 16: validation + limits + license expiry + archived property
  perform set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    insert into public.guest_guide_items (guide_id, kind, title, url) values (g1, 'place', 'Bad', 'javascript:alert(1)');
    raise exception 'FAIL 16a: javascript: url accepted';
  exception when check_violation then null; end;
  for n in 1..98 loop
    insert into public.guest_guide_items (guide_id, kind, title) values (g1, 'faq', 'Q' || n);
  end loop;
  begin
    insert into public.guest_guide_items (guide_id, kind, title) values (g1, 'faq', 'One too many');
    raise exception 'FAIL 16b: more than 100 items accepted';
  exception when check_violation then null; end;

  reset role;
  update public.licenses set current_period_end = now() - interval '1 day' where org_id = o1;
  set local role anon;
  if public.get_public_guide(v_new) is not null then raise exception 'FAIL 16c: guide still public with an expired license'; end if;
  reset role;
  update public.licenses set current_period_end = now() + interval '5 days' where org_id = o1;
  update public.properties set archived_at = now() where id = p1;
  set local role anon;
  if public.get_public_guide(v_new) is not null then raise exception 'FAIL 16d: guide of an archived property still public'; end if;
  reset role;

  raise exception 'ALL 16 GUEST CHECKS PASSED - rolled back on purpose';
end $$;
