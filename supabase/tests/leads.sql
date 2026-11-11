-- Leads: visitors can add one but never read, change or delete. Bad emails are rejected.
-- Rolls itself back. Success = "ALL 6 LEAD CHECKS PASSED". Any "FAIL n" is a real problem.
do $$
declare n int;
begin
  set local role anon;
  insert into public.leads (email, source, items) values ('ok@test.invalid', 'checkout', '{"apps":["guest"]}');

  begin
    select count(*) into n from public.leads;
    raise exception 'FAIL 1: anon can read leads (% rows)', n;
  exception when insufficient_privilege then null; end;
  begin
    update public.leads set email = 'x@test.invalid';
    raise exception 'FAIL 2: anon can update leads';
  exception when insufficient_privilege then null; end;
  begin
    delete from public.leads;
    raise exception 'FAIL 3: anon can delete leads';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.leads (email, source) values ('not-an-email', 'checkout');
    raise exception 'FAIL 4: bad email accepted';
  exception when check_violation then null; end;
  begin
    insert into public.leads (email, source) values ('ok2@test.invalid', 'hacked');
    raise exception 'FAIL 5: unknown source accepted';
  exception when check_violation then null; end;

  insert into public.leads (email, source) values ('ad@test.invalid', 'ad-guest');
  insert into public.leads (email, source) values ('sup@test.invalid', 'support');
  begin
    insert into public.leads (email, source) values ('ad2@test.invalid', 'ad-Guest; drop');
    raise exception 'FAIL 6: malformed ad source accepted';
  exception when check_violation then null; end;

  reset role;
  raise exception 'ALL 6 LEAD CHECKS PASSED - rolled back on purpose';
end $$;
