-- Stayflow Guest: one digital guide per property, shown to guests through a private link / QR.
--
-- Guests are NOT signed in, so the tables are never opened to the public. The only public door is
-- get_public_guide(slug): it returns the published guide of an organization whose Guest license is valid.
-- (The Supabase advisor will flag it as "anon can execute a SECURITY DEFINER function": intentional.)

create type public.guide_accent as enum ('blue', 'green', 'coral');
create type public.guide_item_kind as enum ('place', 'appliance', 'faq');

create table public.guest_guides (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations (id) on delete cascade,
  property_id   uuid not null unique references public.properties (id) on delete cascade,
  -- unguessable (48 bits of randomness), rotatable if the link leaks
  slug          text not null unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 12),
  published     boolean not null default false,
  accent        public.guide_accent not null default 'blue',
  title         text not null default '' check (char_length(title) <= 120),
  welcome       text not null default '' check (char_length(welcome) <= 2000),
  wifi_name     text not null default '' check (char_length(wifi_name) <= 100),
  wifi_password text not null default '' check (char_length(wifi_password) <= 100),
  checkin       text not null default '' check (char_length(checkin) <= 3000),
  checkout      text not null default '' check (char_length(checkout) <= 3000),
  house_rules   text not null default '' check (char_length(house_rules) <= 3000),
  safety        text not null default '' check (char_length(safety) <= 3000),
  host_name     text not null default '' check (char_length(host_name) <= 100),
  host_phone    text not null default '' check (char_length(host_phone) <= 40),
  updated_at    timestamptz not null default now(),
  created_at    timestamptz not null default now()
);
create index guest_guides_org_idx on public.guest_guides (org_id);

create table public.guest_guide_items (
  id          uuid primary key default gen_random_uuid(),
  guide_id    uuid not null references public.guest_guides (id) on delete cascade,
  kind        public.guide_item_kind not null,
  category    text not null default '' check (char_length(category) <= 40),
  title       text not null check (char_length(title) between 1 and 120),
  body        text not null default '' check (char_length(body) <= 2000),
  url         text not null default '' check (char_length(url) <= 500 and (url = '' or url ~* '^https?://')),
  sort        integer not null default 0,
  created_at  timestamptz not null default now()
);
create index guest_guide_items_guide_idx on public.guest_guide_items (guide_id);

-- ------------------------------------------------------------------ triggers
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.limit_guide_items()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (select count(*) from public.guest_guide_items where guide_id = new.guide_id) >= 100 then
    raise exception 'a guide can have at most 100 items' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger guest_guides_property_org
  before insert or update on public.guest_guides
  for each row execute function public.assert_property_in_org();
create trigger guest_guides_touch
  before update on public.guest_guides
  for each row execute function public.touch_updated_at();
create trigger guest_guide_items_limit
  before insert on public.guest_guide_items
  for each row execute function public.limit_guide_items();

revoke execute on function public.touch_updated_at()  from public, anon, authenticated;
revoke execute on function public.limit_guide_items() from public, anon, authenticated;

-- ------------------------------------------------------------------ RLS
alter table public.guest_guides      enable row level security;
alter table public.guest_guide_items enable row level security;

create policy guides_select on public.guest_guides
  for select to authenticated
  using (public.has_product_access(org_id, 'guest'));
create policy guides_write on public.guest_guides
  for all to authenticated
  using (
    public.has_product_access(org_id, 'guest')
    and public.has_org_role(org_id, array['owner','admin','member']::public.org_role[])
  )
  with check (
    public.has_product_access(org_id, 'guest')
    and public.has_org_role(org_id, array['owner','admin','member']::public.org_role[])
  );

create policy guide_items_select on public.guest_guide_items
  for select to authenticated
  using (exists (
    select 1 from public.guest_guides g
    where g.id = guide_id and public.has_product_access(g.org_id, 'guest')
  ));
create policy guide_items_write on public.guest_guide_items
  for all to authenticated
  using (exists (
    select 1 from public.guest_guides g
    where g.id = guide_id
      and public.has_product_access(g.org_id, 'guest')
      and public.has_org_role(g.org_id, array['owner','admin','member']::public.org_role[])
  ))
  with check (exists (
    select 1 from public.guest_guides g
    where g.id = guide_id
      and public.has_product_access(g.org_id, 'guest')
      and public.has_org_role(g.org_id, array['owner','admin','member']::public.org_role[])
  ));

-- ------------------------------------------------------------------ public access
-- Same rule as has_product_access but without the membership check (the caller is not a member).
-- Internal helper: nobody can call it through the API.
create or replace function public.org_license_valid(p_org uuid, p_product public.product_key)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.licenses l
    where l.org_id = p_org
      and l.product in (p_product, 'suite')
      and l.status in ('trialing', 'active', 'past_due')
      and (l.current_period_end is null or l.current_period_end > now())
  );
$$;
revoke execute on function public.org_license_valid(uuid, public.product_key) from public, anon, authenticated;

-- What a guest sees. Returns null for unknown, unpublished, archived or unlicensed guides
-- (indistinguishable on purpose). Never exposes ids of the organization.
create or replace function public.get_public_guide(p_slug text)
returns jsonb
language sql stable security definer set search_path = public
as $$
  select jsonb_build_object(
    'title',         g.title,
    'welcome',       g.welcome,
    'accent',        g.accent,
    'property_name', p.name,
    'city',          p.city,
    'wifi_name',     g.wifi_name,
    'wifi_password', g.wifi_password,
    'checkin',       g.checkin,
    'checkout',      g.checkout,
    'house_rules',   g.house_rules,
    'safety',        g.safety,
    'host_name',     g.host_name,
    'host_phone',    g.host_phone,
    'items', coalesce((
      select jsonb_agg(
        jsonb_build_object('kind', i.kind, 'category', i.category, 'title', i.title, 'body', i.body, 'url', i.url)
        order by i.sort, i.created_at
      )
      from public.guest_guide_items i
      where i.guide_id = g.id
    ), '[]'::jsonb)
  )
  from public.guest_guides g
  join public.properties p on p.id = g.property_id
  where char_length(p_slug) between 6 and 64
    and g.slug = p_slug
    and g.published
    and p.archived_at is null
    and public.org_license_valid(g.org_id, 'guest');
$$;
revoke execute on function public.get_public_guide(text) from public;
grant  execute on function public.get_public_guide(text) to anon, authenticated;

-- New link if the old one leaks (the printed QR must then be replaced).
create or replace function public.rotate_guide_slug(p_guide uuid)
returns text
language plpgsql
set search_path = public
as $$
declare
  v_slug text;
begin
  update public.guest_guides
  set slug = substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)
  where id = p_guide
  returning slug into v_slug;
  if v_slug is null then
    raise exception 'guide not found' using errcode = '42501';
  end if;
  return v_slug;
end;
$$;
revoke execute on function public.rotate_guide_slug(uuid) from public, anon;
grant  execute on function public.rotate_guide_slug(uuid) to authenticated;
