-- Property photos: one cover image per property, stored in Supabase Storage.
-- The bucket is public-read (an image URL works in <img>), but nobody can list it, the paths are random,
-- and only members of the owning organization can upload, replace or delete files in their own folder.

alter table public.properties add column photo_path text check (photo_path is null or char_length(photo_path) <= 300);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('property-photos', 'property-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- First folder of the path is the organization id: "<org_id>/<file>".
create or replace function public.photo_org(p_name text)
returns uuid
language sql
immutable
set search_path = ''
as $$
  select case when split_part(p_name, '/', 1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
              then split_part(p_name, '/', 1)::uuid end
$$;

create policy property_photos_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'property-photos' and public.photo_org(name) is not null
              and public.has_org_role(public.photo_org(name), array['owner','admin','member']::public.org_role[]));
create policy property_photos_update on storage.objects
  for update to authenticated
  using (bucket_id = 'property-photos' and public.photo_org(name) is not null
         and public.has_org_role(public.photo_org(name), array['owner','admin','member']::public.org_role[]));
create policy property_photos_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'property-photos' and public.photo_org(name) is not null
         and public.has_org_role(public.photo_org(name), array['owner','admin','member']::public.org_role[]));
