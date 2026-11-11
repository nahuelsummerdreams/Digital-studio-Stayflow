-- Stayflow Operations: cleaning, maintenance and check-in jobs per property, with checklists,
-- a team that works from a private link (no login), and jobs that follow the Host bookings.

create table public.ops_staff (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations (id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 80),
  phone      text not null default '' check (char_length(phone) <= 40),
  -- The key of their private page. Unguessable; rotate it by deleting and re-adding the person.
  token      uuid not null unique default gen_random_uuid(),
  active     boolean not null default true,
  created_at timestamptz not null default now()
);
create index ops_staff_org_idx on public.ops_staff (org_id);

create table public.ops_checklists (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 80),
  kind        text not null check (kind in ('cleaning', 'maintenance', 'checkin')),
  -- null = the default for every property of the business
  property_id uuid references public.properties (id) on delete cascade,
  items       jsonb not null default '[]' check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) <= 60),
  created_at  timestamptz not null default now()
);
create index ops_checklists_org_idx on public.ops_checklists (org_id, kind);

create table public.ops_recurring (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 160),
  every_days  integer not null check (every_days between 1 and 365),
  next_due    date not null,
  checklist   jsonb not null default '[]' check (jsonb_typeof(checklist) = 'array' and jsonb_array_length(checklist) <= 60),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
create index ops_recurring_org_idx on public.ops_recurring (org_id, next_due);

create table public.ops_jobs (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organizations (id) on delete cascade,
  property_id  uuid not null references public.properties (id) on delete cascade,
  kind         text not null default 'other' check (kind in ('cleaning', 'maintenance', 'checkin', 'other')),
  title        text not null check (char_length(title) between 1 and 160),
  due_on       date not null,
  status       text not null default 'pending' check (status in ('pending', 'in_progress', 'done')),
  assignee_id  uuid references public.ops_staff (id) on delete set null,
  -- [{ "text": "Cambiar sábanas", "done": false }, ...]
  checklist    jsonb not null default '[]' check (jsonb_typeof(checklist) = 'array' and jsonb_array_length(checklist) <= 60),
  notes        text not null default '' check (char_length(notes) <= 2000),
  booking_id   uuid references public.bookings (id) on delete cascade,
  recurring_id uuid references public.ops_recurring (id) on delete cascade,
  -- For a cleaning: the day the next guest arrives at that property (same day = tight turnover).
  next_checkin date,
  done_at      timestamptz,
  created_by   uuid references auth.users (id),
  created_at   timestamptz not null default now(),
  unique (booking_id, kind),
  unique (recurring_id, due_on)
);
create index ops_jobs_org_due_idx on public.ops_jobs (org_id, status, due_on);
create index ops_jobs_assignee_idx on public.ops_jobs (assignee_id);

-- ------------------------------------------------------------------ security
alter table public.ops_staff      enable row level security;
alter table public.ops_checklists enable row level security;
alter table public.ops_recurring  enable row level security;
alter table public.ops_jobs       enable row level security;

do $$
declare t text;
begin
  foreach t in array array['ops_staff', 'ops_checklists', 'ops_recurring', 'ops_jobs'] loop
    execute format('create policy %I on public.%I for select to authenticated using (public.has_product_access(org_id, ''operations''))', t || '_select', t);
    execute format($p$create policy %I on public.%I for all to authenticated
      using (public.has_product_access(org_id, 'operations') and public.has_org_role(org_id, array['owner','admin','member']::public.org_role[]))
      with check (public.has_product_access(org_id, 'operations') and public.has_org_role(org_id, array['owner','admin','member']::public.org_role[]))$p$, t || '_write', t);
  end loop;
end $$;

-- ------------------------------------------------------------------ jobs that follow the bookings
create or replace function public.ops_default_cleaning()
returns jsonb
language sql immutable
as $$
  select jsonb_build_array(
    'Ventilar y abrir ventanas', 'Cambiar sábanas y toallas', 'Limpiar baños', 'Limpiar cocina y electrodomésticos',
    'Barrer y fregar pisos', 'Vaciar la basura', 'Reponer amenities y papel', 'Revisar daños u objetos olvidados', 'Dejar todo listo para el huésped');
$$;

create or replace function public.ops_items_to_checklist(p_items jsonb)
returns jsonb
language sql immutable
as $$
  select coalesce(jsonb_agg(jsonb_build_object('text', left(t.v, 160), 'done', false) order by t.n), '[]'::jsonb)
  from jsonb_array_elements_text(p_items) with ordinality as t(v, n);
$$;

-- Creates, moves and removes the cleaning job of each Host stay. Safe to call every time the app opens.
-- Works even if the business has no Host license: it only needs Operations.
create or replace function public.ops_sync_bookings(p_org uuid)
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  v_added integer;
begin
  if not public.has_product_access(p_org, 'operations') then
    raise exception 'operations license required' using errcode = '42501';
  end if;

  insert into public.ops_jobs (org_id, property_id, kind, title, due_on, checklist, booking_id)
  select b.org_id, b.property_id, 'cleaning', 'Limpieza tras ' || left(b.guest_name, 100), b.check_out,
         public.ops_items_to_checklist(coalesce(
           (select c.items from public.ops_checklists c where c.org_id = b.org_id and c.kind = 'cleaning' and c.property_id = b.property_id order by c.created_at limit 1),
           (select c.items from public.ops_checklists c where c.org_id = b.org_id and c.kind = 'cleaning' and c.property_id is null order by c.created_at limit 1),
           public.ops_default_cleaning())),
         b.id
  from public.bookings b
  where b.org_id = p_org and b.kind = 'stay' and b.status <> 'canceled'
    and b.check_out between current_date - 1 and current_date + 90
  on conflict (booking_id, kind) do nothing;
  get diagnostics v_added = row_count;

  -- Follow changes: the day, the name, and who arrives next.
  update public.ops_jobs j
     set due_on = b.check_out,
         title = 'Limpieza tras ' || left(b.guest_name, 100),
         next_checkin = (select min(n.check_in) from public.bookings n
                          where n.property_id = b.property_id and n.kind = 'stay' and n.status <> 'canceled' and n.check_in >= b.check_out)
    from public.bookings b
   where j.booking_id = b.id and j.org_id = p_org and j.kind = 'cleaning' and j.status <> 'done' and b.status <> 'canceled';

  delete from public.ops_jobs j
   using public.bookings b
   where j.booking_id = b.id and j.org_id = p_org and j.status <> 'done' and b.status = 'canceled';

  return v_added;
end;
$$;
revoke execute on function public.ops_sync_bookings(uuid) from public, anon;
grant  execute on function public.ops_sync_bookings(uuid) to authenticated;

-- Turns each recurring maintenance into a job when its date is within the next 7 days, then moves it forward.
create or replace function public.ops_generate_recurring(p_org uuid)
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  r public.ops_recurring%rowtype;
  v_added integer := 0;
  v_n integer;
begin
  if not public.has_product_access(p_org, 'operations') then
    raise exception 'operations license required' using errcode = '42501';
  end if;
  for r in select * from public.ops_recurring where org_id = p_org and active and next_due <= current_date + 7 loop
    while r.next_due <= current_date + 7 loop
      insert into public.ops_jobs (org_id, property_id, kind, title, due_on, checklist, recurring_id)
      values (r.org_id, r.property_id, 'maintenance', r.title, r.next_due, r.checklist, r.id)
      on conflict (recurring_id, due_on) do nothing;
      get diagnostics v_n = row_count;
      v_added := v_added + v_n;
      r.next_due := r.next_due + r.every_days;
    end loop;
    update public.ops_recurring set next_due = r.next_due where id = r.id;
  end loop;
  return v_added;
end;
$$;
revoke execute on function public.ops_generate_recurring(uuid) from public, anon;
grant  execute on function public.ops_generate_recurring(uuid) to authenticated;

-- ------------------------------------------------------------------ the team's private page (no login)
create or replace function public.ops_license_ok(p_org uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.licenses l
    where l.org_id = p_org and l.product in ('operations', 'suite')
      and l.status in ('trialing', 'active', 'past_due')
      and (l.current_period_end is null or l.current_period_end > now()));
$$;
revoke execute on function public.ops_license_ok(uuid) from public, anon, authenticated;

create or replace function public.ops_staff_jobs(p_token uuid)
returns table (id uuid, staff_name text, property_name text, kind text, title text, due_on date, status text, checklist jsonb, notes text, next_checkin date)
language sql stable security definer set search_path = public
as $$
  select j.id, s.name, p.name, j.kind, j.title, j.due_on, j.status, j.checklist, j.notes, j.next_checkin
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

-- The team can only tick boxes and change the status of THEIR jobs. Text and structure are the owner's.
create or replace function public.ops_staff_update(p_token uuid, p_job uuid, p_status text, p_done jsonb)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_job public.ops_jobs%rowtype;
  v_checklist jsonb;
begin
  if p_status not in ('pending', 'in_progress', 'done') then
    raise exception 'bad status' using errcode = '22023';
  end if;
  select j.* into v_job
  from public.ops_jobs j join public.ops_staff s on s.id = j.assignee_id
  where j.id = p_job and s.token = p_token and s.active and public.ops_license_ok(s.org_id);
  if not found then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  -- p_done is an array of booleans, one per checklist line
  if p_done is not null and jsonb_typeof(p_done) = 'array' then
    select coalesce(jsonb_agg(jsonb_build_object('text', e.item ->> 'text', 'done', coalesce((p_done ->> (e.n - 1)::int)::boolean, false)) order by e.n), '[]'::jsonb)
      into v_checklist
      from jsonb_array_elements(v_job.checklist) with ordinality as e(item, n);
  else
    v_checklist := v_job.checklist;
  end if;
  update public.ops_jobs
     set status = p_status, checklist = v_checklist,
         done_at = case when p_status = 'done' then coalesce(done_at, now()) else null end
   where id = p_job;
end;
$$;
revoke execute on function public.ops_staff_update(uuid, uuid, text, jsonb) from public;
grant  execute on function public.ops_staff_update(uuid, uuid, text, jsonb) to anon, authenticated;

-- Is this link valid at all? (A valid link with no jobs and a wrong link both return no jobs, so the page asks this too.)
create or replace function public.ops_staff_info(p_token uuid)
returns table (staff_name text)
language sql stable security definer set search_path = public
as $$
  select s.name from public.ops_staff s
  where s.token = p_token and s.active and public.ops_license_ok(s.org_id);
$$;
revoke execute on function public.ops_staff_info(uuid) from public;
grant  execute on function public.ops_staff_info(uuid) to anon, authenticated;
