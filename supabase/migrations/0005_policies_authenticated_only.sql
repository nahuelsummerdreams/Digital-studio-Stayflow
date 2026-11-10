-- Policies apply to signed-in users only. Anonymous visitors match no policy,
-- so they get empty results instead of evaluating membership helpers.

alter policy profiles_self      on public.profiles        to authenticated;

alter policy orgs_select        on public.organizations   to authenticated;
alter policy orgs_update        on public.organizations   to authenticated;
alter policy orgs_delete        on public.organizations   to authenticated;

alter policy memberships_select on public.memberships     to authenticated;
alter policy memberships_manage on public.memberships     to authenticated;

alter policy properties_select  on public.properties      to authenticated;
alter policy properties_write   on public.properties      to authenticated;

alter policy income_select      on public.income_entries  to authenticated;
alter policy income_write       on public.income_entries  to authenticated;

alter policy expense_select     on public.expense_entries to authenticated;
alter policy expense_write      on public.expense_entries to authenticated;

alter policy licenses_select    on public.licenses        to authenticated;
