-- Guides in more than one language. The host's text stays the base; translations are optional overrides per language
-- ({"en": {"welcome": "...", ...}, "pt": {...}}). A missing translation falls back to the base text.
alter table public.guest_guides
  add column translations jsonb not null default '{}'::jsonb
    check (jsonb_typeof(translations) = 'object' and char_length(translations::text) <= 24000);
alter table public.guest_guide_items
  add column translations jsonb not null default '{}'::jsonb
    check (jsonb_typeof(translations) = 'object' and char_length(translations::text) <= 5000);

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
    'translations',  g.translations,
    'items', coalesce((
      select jsonb_agg(
        jsonb_build_object('kind', i.kind, 'category', i.category, 'title', i.title, 'body', i.body, 'url', i.url, 'translations', i.translations)
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
