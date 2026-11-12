-- Operations evidence photos: only an assigned, active team member with a live license can upload; owners see them. Rolls itself back.
-- Success = "ALL 7 OPS PHOTO CHECKS PASSED".
do $$
declare
  u1 uuid := gen_random_uuid(); o1 uuid; p1 uuid; bk uuid; j uuid; j2 uuid; tok uuid; tok2 uuid; s2 uuid; n int; ok boolean; cnt int;
begin
  insert into auth.users (id, instance_id, aud, role, email) values
    (u1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'opsph-1@test.invalid');
  perform set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  set local role authenticated;
  o1 := public.create_organization('Photos Org');
  perform public.start_trial(o1, 'host');
  perform public.start_trial(o1, 'operations');
  insert into public.properties (org_id, name) values (o1, 'Loft') returning id into p1;
  insert into public.ops_staff (org_id, name) values (o1, 'Rosa') returning token into tok;
  insert into public.ops_staff (org_id, name) values (o1, 'Otra') returning id, token into s2, tok2;
  insert into public.ops_jobs (org_id, property_id, kind, title, due_on, assignee_id)
    values (o1, p1, 'cleaning', 'Limpieza', current_date, (select id from public.ops_staff where token = tok)) returning id into j;
  insert into public.ops_jobs (org_id, property_id, kind, title, due_on, assignee_id)
    values (o1, p1, 'cleaning', 'Otra limpieza', current_date, s2) returning id into j2;

  -- the team member is anonymous
  set local role anon;
  -- 1) own job: path accepted
  ok := public.ops_photo_path_ok(tok || '/' || j || '/a.jpg');
  if not ok then raise exception 'FAIL 1: valid path refused'; end if;
  -- 2) somebody else's job: refused
  if public.ops_photo_path_ok(tok || '/' || j2 || '/a.jpg') then raise exception 'FAIL 2: path on another member''s job accepted'; end if;
  -- 3) junk paths refused
  if public.ops_photo_path_ok('x/y/z.jpg') or public.ops_photo_path_ok(tok || '/' || j || '/a/b.jpg') or public.ops_photo_path_ok(gen_random_uuid() || '/' || j || '/a.jpg') then
    raise exception 'FAIL 3: junk or wrong-token path accepted'; end if;
  -- 4) register the photos through the RPC; the 8th is the last
  for i in 1..8 loop
    cnt := public.ops_staff_add_photo(tok, j, tok || '/' || j || '/p' || i || '.jpg');
  end loop;
  if cnt <> 8 then raise exception 'FAIL 4: expected 8 photos, got %', cnt; end if;
  if public.ops_photo_path_ok(tok || '/' || j || '/p9.jpg') then raise exception 'FAIL 5: ninth upload allowed'; end if;
  -- 6) registering a path for someone else's job is refused
  begin
    perform public.ops_staff_add_photo(tok, j2, tok || '/' || j2 || '/x.jpg');
    raise exception 'FAIL 6: photo registered on another member''s job';
  exception when insufficient_privilege then null; end;
  -- anonymous cannot read the table
  select count(*) into n from public.ops_job_photos;
  if n <> 0 then raise exception 'FAIL 7a: anon reads photo rows'; end if;

  -- 7) the owner sees them
  set local role authenticated;
  select count(*) into n from public.ops_job_photos where job_id = j;
  if n <> 8 then raise exception 'FAIL 7: owner sees % photos', n; end if;
  raise exception 'ALL 7 OPS PHOTO CHECKS PASSED';
end $$;
