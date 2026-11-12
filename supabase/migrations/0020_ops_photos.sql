-- Evidence photos: the team takes pictures from their private page (no login) and the owner sees them on the job.
-- Private bucket. A file can only be uploaded to "<team token>/<job id>/<file>" when that token is an active team
-- member assigned to that job, the account has a live Operations license, and the job has fewer than 8 photos.

create table public.ops_job_photos (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations (id) on delete cascade,
  job_id     uuid not null references public.ops_jobs (id) on delete cascade,
  path       text not null unique check (char_length(path) <= 300),
  created_at timestamptz not null default now()
);
create index ops_job_photos_job_idx on public.ops_job_photos (job_id);
alter table public.ops_job_photos enable row level security;
create policy ops_job_photos_select on public.ops_job_photos
  for select to authenticated using (public.has_product_access(org_id, 'operations'));
create policy ops_job_photos_delete on public.ops_job_photos
  for delete to authenticated
  using (public.has_product_access(org_id, 'operations') and public.has_org_role(org_id, array['owner','admin','member']::public.org_role[]));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ops-evidence', 'ops-evidence', false, 3145728, array['image/jpeg', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.ops_photo_path_ok(p_name text)
returns boolean
language plpgsql stable security definer set search_path = public
as $$
declare
  v_uuid constant text := '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
  v_token text := split_part(p_name, '/', 1);
  v_job   text := split_part(p_name, '/', 2);
begin
  if v_token !~ v_uuid or v_job !~ v_uuid or split_part(p_name, '/', 3) = '' or split_part(p_name, '/', 4) <> '' then
    return false;
  end if;
  return exists (
    select 1
    from public.ops_staff s
    join public.ops_jobs j on j.assignee_id = s.id
    where s.token = v_token::uuid and s.active and j.id = v_job::uuid and public.ops_license_ok(s.org_id)
      and (select count(*) from public.ops_job_photos x where x.job_id = j.id) < 8);
end;
$$;
revoke execute on function public.ops_photo_path_ok(text) from public;
grant  execute on function public.ops_photo_path_ok(text) to anon, authenticated;

create policy ops_evidence_upload on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'ops-evidence' and public.ops_photo_path_ok(name));

-- Owners read (and may delete) only files that are registered on a job of their organization.
create policy ops_evidence_read on storage.objects
  for select to authenticated
  using (bucket_id = 'ops-evidence' and exists (
    select 1 from public.ops_job_photos p where p.path = name and public.has_product_access(p.org_id, 'operations')));
create policy ops_evidence_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'ops-evidence' and exists (
    select 1 from public.ops_job_photos p where p.path = name and public.has_product_access(p.org_id, 'operations')
      and public.has_org_role(p.org_id, array['owner','admin','member']::public.org_role[])));

-- Registers an uploaded photo on the job. Returns how many photos the job has now.
create or replace function public.ops_staff_add_photo(p_token uuid, p_job uuid, p_path text)
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  v_org uuid;
  v_n integer;
begin
  select j.org_id into v_org
  from public.ops_jobs j join public.ops_staff s on s.id = j.assignee_id
  where j.id = p_job and s.token = p_token and s.active and public.ops_license_ok(s.org_id);
  if not found then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if p_path not like (p_token::text || '/' || p_job::text || '/%') then
    raise exception 'bad path' using errcode = '22023';
  end if;
  insert into public.ops_job_photos (org_id, job_id, path) values (v_org, p_job, p_path) on conflict (path) do nothing;
  select count(*) into v_n from public.ops_job_photos where job_id = p_job;
  return v_n;
end;
$$;
revoke execute on function public.ops_staff_add_photo(uuid, uuid, text) from public;
grant  execute on function public.ops_staff_add_photo(uuid, uuid, text) to anon, authenticated;

-- The team's list now says how many photos each job already has.
drop function public.ops_staff_jobs(uuid);
create or replace function public.ops_staff_jobs(p_token uuid)
returns table (id uuid, staff_name text, property_name text, kind text, title text, due_on date, status text, checklist jsonb, notes text, next_checkin date, photos integer)
language sql stable security definer set search_path = public
as $$
  select j.id, s.name, p.name, j.kind, j.title, j.due_on, j.status, j.checklist, j.notes, j.next_checkin,
         (select count(*)::int from public.ops_job_photos x where x.job_id = j.id)
  from public.ops_staff s
  join public.ops_jobs j on j.assignee_id = s.id
  join public.properties p on p.id = j.property_id
  where s.token = p_token and s.active and public.ops_license_ok(s.org_id)
    and (j.status <> 'done' or j.done_at > now() - interval '2 days')
    and j.due_on <= current_date + 14
  order by j.due_on, j.created_at;
$$;
revoke execute on function public.ops_staff_jobs(uuid) from public;
grant  execute on function public.ops_staff_jobs(uuid) to anon, authenticated;
