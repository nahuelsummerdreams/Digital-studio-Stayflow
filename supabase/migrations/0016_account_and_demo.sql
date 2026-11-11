-- Account deletion by the person themselves, and sample ("demo") properties that can be removed in one click.

alter table public.properties add column is_demo boolean not null default false;

-- Deletes the signed-in user. Businesses where they are the only member go with them (their data is theirs to erase).
-- If they share a business with other people, the account stays and the caller is told why.
create or replace function public.delete_my_account()
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  delete from public.organizations o
   where exists (select 1 from public.memberships m where m.org_id = o.id and m.user_id = v_uid and m.role = 'owner')
     and (select count(*) from public.memberships m2 where m2.org_id = o.id) = 1;
  begin
    delete from auth.users where id = v_uid;
  exception when foreign_key_violation then
    raise exception 'shared_business' using errcode = '23503';
  end;
end;
$$;
revoke execute on function public.delete_my_account() from public, anon;
grant  execute on function public.delete_my_account() to authenticated;
