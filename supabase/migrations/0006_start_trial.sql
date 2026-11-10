-- Free trial: lets an owner/admin try a product for 14 days, once per organization and product.
-- The billing webhook later upgrades the same row to 'active'.

create or replace function public.start_trial(p_org uuid, p_product public.product_key)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare
  v_rows int;
begin
  if not public.has_org_role(p_org, array['owner','admin']::public.org_role[]) then
    raise exception 'only owners and admins can start a trial' using errcode = '42501';
  end if;
  -- unique (org_id, product) guarantees one trial ever: an expired row blocks a second one.
  insert into public.licenses (org_id, product, plan, status, current_period_end)
  values (p_org, p_product, 'starter', 'trialing', now() + interval '14 days')
  on conflict (org_id, product) do nothing;
  get diagnostics v_rows = row_count;
  return v_rows = 1;
end;
$$;

revoke execute on function public.start_trial(uuid, public.product_key) from public, anon;
grant  execute on function public.start_trial(uuid, public.product_key) to authenticated;
