-- Stayflow core: multi-tenant model.
-- Every business row hangs off an organization. Access is decided by membership.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- enums
create type public.org_role as enum ('owner', 'admin', 'member', 'viewer');

-- ---------------------------------------------------------------- tables
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  locale      text not null default 'en',
  created_at  timestamptz not null default now()
);

create table public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 120),
  currency    char(3) not null default 'USD',
  created_by  uuid not null references auth.users (id),
  created_at  timestamptz not null default now()
);

create table public.memberships (
  org_id      uuid not null references public.organizations (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  role        public.org_role not null default 'member',
  created_at  timestamptz not null default now(),
  primary key (org_id, user_id)
);
create index memberships_user_idx on public.memberships (user_id);

create table public.properties (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 120),
  address     text,
  city        text,
  country     char(2),
  timezone    text not null default 'UTC',
  archived_at timestamptz,
  created_at  timestamptz not null default now()
);
create index properties_org_idx on public.properties (org_id);

-- ---------------------------------------------------------------- helpers
-- security definer so policies can read memberships without recursing into RLS.
create or replace function public.is_org_member(p_org uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.memberships m
    where m.org_id = p_org and m.user_id = auth.uid()
  );
$$;

create or replace function public.has_org_role(p_org uuid, p_roles public.org_role[])
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.memberships m
    where m.org_id = p_org and m.user_id = auth.uid() and m.role = any (p_roles)
  );
$$;

-- Creates an organization and makes the caller its owner, atomically.
create or replace function public.create_organization(p_name text, p_currency char(3) default 'USD')
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_org uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  insert into public.organizations (name, currency, created_by)
  values (p_name, upper(p_currency), auth.uid())
  returning id into v_org;
  insert into public.memberships (org_id, user_id, role) values (v_org, auth.uid(), 'owner');
  return v_org;
end;
$$;

-- Profile row on signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------- RLS
alter table public.profiles      enable row level security;
alter table public.organizations enable row level security;
alter table public.memberships   enable row level security;
alter table public.properties    enable row level security;

create policy profiles_self on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

-- Organizations are created only through create_organization().
create policy orgs_select on public.organizations
  for select using (public.is_org_member(id));
create policy orgs_update on public.organizations
  for update using (public.has_org_role(id, array['owner','admin']::public.org_role[]))
  with check (public.has_org_role(id, array['owner','admin']::public.org_role[]));
create policy orgs_delete on public.organizations
  for delete using (public.has_org_role(id, array['owner']::public.org_role[]));

create policy memberships_select on public.memberships
  for select using (public.is_org_member(org_id));
create policy memberships_manage on public.memberships
  for all using (public.has_org_role(org_id, array['owner','admin']::public.org_role[]))
  with check (public.has_org_role(org_id, array['owner','admin']::public.org_role[]));

create policy properties_select on public.properties
  for select using (public.is_org_member(org_id));
create policy properties_write on public.properties
  for all using (public.has_org_role(org_id, array['owner','admin','member']::public.org_role[]))
  with check (public.has_org_role(org_id, array['owner','admin','member']::public.org_role[]));
