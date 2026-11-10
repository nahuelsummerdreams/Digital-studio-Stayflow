-- Hardening after the Supabase security advisor run.

-- Fixed search_path on the trigger function.
create or replace function public.assert_property_in_org()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.property_id is not null and not exists (
    select 1 from public.properties p
    where p.id = new.property_id and p.org_id = new.org_id
  ) then
    raise exception 'property does not belong to organization';
  end if;
  return new;
end;
$$;

-- Nothing here should be callable without signing in.
revoke execute on function public.is_org_member(uuid)                              from public, anon;
revoke execute on function public.has_org_role(uuid, public.org_role[])            from public, anon;
revoke execute on function public.has_product_access(uuid, public.product_key)     from public, anon;
revoke execute on function public.create_organization(text, char)                  from public, anon;

-- RLS policies call these as the signed-in user, so `authenticated` keeps EXECUTE.
-- They only ever answer about the caller's own membership.
grant execute on function public.is_org_member(uuid)                               to authenticated;
grant execute on function public.has_org_role(uuid, public.org_role[])             to authenticated;
grant execute on function public.has_product_access(uuid, public.product_key)      to authenticated;
grant execute on function public.create_organization(text, char)                   to authenticated;

-- Trigger-only functions: never callable through the API.
revoke execute on function public.handle_new_user()        from public, anon, authenticated;
revoke execute on function public.assert_property_in_org() from public, anon, authenticated;
