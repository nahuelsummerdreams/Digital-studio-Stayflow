-- Property photos: members may write only inside their own organization's folder of the bucket.
-- Rolls itself back. Success = "ALL 3 PHOTO CHECKS PASSED". Any "FAIL n" is a real problem.
do $$
declare
  u1 uuid := gen_random_uuid(); u2 uuid := gen_random_uuid(); o1 uuid; o2 uuid;
begin
  insert into auth.users (id, instance_id, aud, role, email) values
    (u1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'photo-test-1@test.invalid'),
    (u2, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'photo-test-2@test.invalid');

  perform set_config('request.jwt.claims', json_build_object('sub', u2, 'role', 'authenticated')::text, true);
  set local role authenticated;
  o2 := public.create_organization('Photo Org 2');

  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  set local role authenticated;
  o1 := public.create_organization('Photo Org 1');

  insert into storage.objects (bucket_id, name, owner) values ('property-photos', o1::text || '/ok.jpg', u1);

  begin
    insert into storage.objects (bucket_id, name, owner) values ('property-photos', o2::text || '/evil.jpg', u1);
    raise exception 'FAIL 1: wrote into another organization folder';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
  end;
  begin
    insert into storage.objects (bucket_id, name, owner) values ('property-photos', 'loose/x.jpg', u1);
    raise exception 'FAIL 2: wrote outside any organization folder';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
  end;

  reset role; set local role anon;
  begin
    insert into storage.objects (bucket_id, name) values ('property-photos', o1::text || '/anon.jpg');
    raise exception 'FAIL 3: anon wrote a photo';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
  end;
  reset role;

  raise exception 'ALL 3 PHOTO CHECKS PASSED - rolled back on purpose';
end $$;
