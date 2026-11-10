-- Stayflow Assistant: a per-organization daily usage counter, so the cost of the AI chat is capped.
-- The app calls assistant_consume() before every question. Nobody can read or write the table directly.

create table public.assistant_usage (
  org_id  uuid not null references public.organizations (id) on delete cascade,
  day     date not null default current_date,
  uses    integer not null default 0,
  primary key (org_id, day)
);
alter table public.assistant_usage enable row level security;
revoke all on public.assistant_usage from anon, authenticated;

-- Counts one use and returns how many are left today. Needs a Host licence and membership.
-- Raises 'assistant_limit' (and does not count) when the daily cap is exceeded.
create or replace function public.assistant_consume(p_org uuid, p_cap integer default 40)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v integer;
begin
  if not public.has_product_access(p_org, 'host') or not public.has_org_role(p_org, array['owner','admin','member']::public.org_role[]) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  insert into public.assistant_usage (org_id, day, uses) values (p_org, current_date, 1)
  on conflict (org_id, day) do update set uses = public.assistant_usage.uses + 1
  returning uses into v;
  if v > p_cap then
    raise exception 'assistant_limit' using errcode = 'P0001';
  end if;
  return p_cap - v;
end;
$$;
revoke execute on function public.assistant_consume(uuid, integer) from public, anon;
grant  execute on function public.assistant_consume(uuid, integer) to authenticated;
