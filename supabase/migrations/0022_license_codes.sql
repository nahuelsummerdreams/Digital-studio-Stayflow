-- No free trial. Access starts with a license code, which is what a purchase delivers.
-- A code unlocks one or more products for an organization, once. Codes are created by the seller (service role / SQL)
-- and, later, by the payment webhook. Nobody can read or list codes from the browser.

alter table public.licenses add column updates_until timestamptz;

create table public.license_codes (
  code         text primary key check (code ~ '^SF-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$'),
  products     public.product_key[] not null check (cardinality(products) between 1 and 9),
  plan         public.plan_key not null default 'starter',
  note         text not null default '' check (char_length(note) <= 200),
  created_at   timestamptz not null default now(),
  redeemed_at  timestamptz,
  redeemed_org uuid references public.organizations (id) on delete set null,
  redeemed_by  uuid references auth.users (id) on delete set null
);
alter table public.license_codes enable row level security; -- no policies on purpose
revoke all on public.license_codes from anon, authenticated;

-- Redeems a code for an organization the caller owns or administers. Returns the products unlocked.
-- Atomic: two people pasting the same code at once cannot both win. One purchase = lifetime access + 12 months of updates.
create or replace function public.redeem_license_code(p_org uuid, p_code text)
returns text[]
language plpgsql security definer set search_path = public
as $$
declare
  v public.license_codes%rowtype;
  p public.product_key;
  unlocked text[] := '{}';
begin
  if auth.uid() is null or not public.has_org_role(p_org, array['owner','admin']::public.org_role[]) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  update public.license_codes
     set redeemed_at = now(), redeemed_org = p_org, redeemed_by = auth.uid()
   where code = upper(btrim(p_code)) and redeemed_at is null
   returning * into v;
  if not found then
    raise exception 'invalid code' using errcode = 'P0002';
  end if;
  foreach p in array v.products loop
    insert into public.licenses (org_id, product, plan, status, current_period_end, billing_provider, updates_until)
    values (p_org, p, v.plan, 'active', null, 'code', now() + interval '12 months')
    on conflict (org_id, product) do update
      set status = 'active', plan = excluded.plan, current_period_end = null, billing_provider = 'code', updated_at = now(),
          updates_until = greatest(coalesce(public.licenses.updates_until, now()), now()) + interval '12 months';
    unlocked := unlocked || p::text;
  end loop;
  return unlocked;
end;
$$;
revoke execute on function public.redeem_license_code(uuid, text) from public, anon;
grant  execute on function public.redeem_license_code(uuid, text) to authenticated;

-- The free trial is closed. (Tests switch it on for themselves with `stayflow.allow_trials`.)
create or replace function public.start_trial(p_org uuid, p_product public.product_key)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare
  v_rows int;
begin
  if coalesce(current_setting('stayflow.allow_trials', true), 'off') <> 'on' then
    raise exception 'trials are disabled' using errcode = '42501';
  end if;
  if not public.has_org_role(p_org, array['owner','admin']::public.org_role[]) then
    raise exception 'only owners and admins can start a trial' using errcode = '42501';
  end if;
  insert into public.licenses (org_id, product, plan, status, current_period_end)
  values (p_org, p_product, 'starter', 'trialing', now() + interval '14 days')
  on conflict (org_id, product) do nothing;
  get diagnostics v_rows = row_count;
  return v_rows = 1;
end;
$$;
