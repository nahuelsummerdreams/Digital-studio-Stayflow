-- Fixed monthly costs (internet, insurance, rent...). The host defines them once;
-- generate_recurring_expenses() turns them into real expense entries month by month.

create table public.recurring_expenses (
  id                 uuid primary key default gen_random_uuid(),
  org_id             uuid not null references public.organizations (id) on delete cascade,
  -- null property = shared cost across the whole organization
  property_id        uuid references public.properties (id) on delete cascade,
  category           public.expense_category not null default 'other',
  amount_minor       bigint not null check (amount_minor > 0),
  description        text,
  day_of_month       smallint not null default 1 check (day_of_month between 1 and 31),
  start_month        date not null default date_trunc('month', current_date)::date
                     check (start_month = date_trunc('month', start_month)::date),
  active             boolean not null default true,
  -- last month already turned into an entry; entries the host deletes are never recreated
  generated_through  date,
  created_by         uuid references auth.users (id),
  created_at         timestamptz not null default now()
);
create index recurring_org_idx on public.recurring_expenses (org_id);

alter table public.expense_entries
  add column recurring_id uuid references public.recurring_expenses (id) on delete set null;

create trigger recurring_property_org
  before insert or update on public.recurring_expenses
  for each row execute function public.assert_property_in_org();

alter table public.recurring_expenses enable row level security;

create policy recurring_select on public.recurring_expenses
  for select to authenticated
  using (public.has_product_access(org_id, 'profit'));
create policy recurring_write on public.recurring_expenses
  for all to authenticated
  using (
    public.has_product_access(org_id, 'profit')
    and public.has_org_role(org_id, array['owner','admin','member']::public.org_role[])
  )
  with check (
    public.has_product_access(org_id, 'profit')
    and public.has_org_role(org_id, array['owner','admin','member']::public.org_role[])
  );

-- Creates the entries that are due (date <= today) and not generated yet. Safe to call on every
-- app open: rows are locked, so two devices cannot generate the same month twice.
-- SECURITY INVOKER on purpose: RLS and the license gate apply to the caller.
create or replace function public.generate_recurring_expenses(p_org uuid)
returns integer
language plpgsql
set search_path = public
as $$
declare
  t         public.recurring_expenses%rowtype;
  v_month   date;
  v_due     date;
  v_last    date;
  v_created integer := 0;
  v_guard   integer;
begin
  for t in
    select * from public.recurring_expenses
    where org_id = p_org and active
    for update
  loop
    v_month := case
      when t.generated_through is null then t.start_month
      else greatest(t.start_month, (t.generated_through + interval '1 month')::date)
    end;
    v_last := null;
    v_guard := 0;
    loop
      -- clamp the day to the month length (31 -> 28/30)
      v_due := v_month + (least(t.day_of_month,
                 extract(day from (v_month + interval '1 month - 1 day'))::int) - 1);
      exit when v_due > current_date or v_guard >= 60;
      insert into public.expense_entries
        (org_id, property_id, category, amount_minor, recurring, incurred_on, description, created_by, recurring_id)
      values
        (t.org_id, t.property_id, t.category, t.amount_minor, true, v_due, t.description, auth.uid(), t.id);
      v_created := v_created + 1;
      v_last := v_month;
      v_month := (v_month + interval '1 month')::date;
      v_guard := v_guard + 1;
    end loop;
    if v_last is not null then
      update public.recurring_expenses set generated_through = v_last where id = t.id;
    end if;
  end loop;
  return v_created;
end;
$$;

revoke execute on function public.generate_recurring_expenses(uuid) from public, anon;
grant  execute on function public.generate_recurring_expenses(uuid) to authenticated;
