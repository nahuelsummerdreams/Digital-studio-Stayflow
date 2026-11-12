-- Team (invitations + roles), audit log, task assignment/priority and message log.

-- ------------------------------------------------------------------ audit log
create table public.audit_log (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations (id) on delete cascade,
  actor_id   uuid references auth.users (id) on delete set null,
  action     text not null check (char_length(action) <= 60),
  target     text not null default '' check (char_length(target) <= 200),
  detail     text not null default '' check (char_length(detail) <= 400),
  created_at timestamptz not null default clock_timestamp()
);
create index audit_log_org_idx on public.audit_log (org_id, created_at desc);
alter table public.audit_log enable row level security;
create policy audit_log_select on public.audit_log
  for select to authenticated using (public.has_org_role(org_id, array['owner','admin']::public.org_role[]));

create or replace function public.audit_write(p_org uuid, p_action text, p_target text default '', p_detail text default '')
returns void
language sql security definer set search_path = public
as $$
  insert into public.audit_log (org_id, actor_id, action, target, detail) values (p_org, auth.uid(), p_action, left(coalesce(p_target, ''), 200), left(coalesce(p_detail, ''), 400));
$$;
revoke execute on function public.audit_write(uuid, text, text, text) from public, anon, authenticated;

-- ------------------------------------------------------------------ invitations
create table public.team_invites (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations (id) on delete cascade,
  email       text not null check (email = lower(email) and char_length(email) between 5 and 200 and position('@' in email) > 1),
  role        public.org_role not null check (role in ('admin', 'member', 'viewer')),
  token       uuid not null unique default gen_random_uuid(),
  invited_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default now() + interval '14 days',
  accepted_at timestamptz,
  revoked_at  timestamptz
);
create unique index team_invites_open_idx on public.team_invites (org_id, email) where accepted_at is null and revoked_at is null;
alter table public.team_invites enable row level security;
create policy team_invites_select on public.team_invites
  for select to authenticated using (public.has_org_role(org_id, array['owner','admin']::public.org_role[]));
-- no write policies: only the functions below write

-- Only owners and admins manage people; memberships are no longer writable from the client (closes a privilege-escalation path).
drop policy memberships_manage on public.memberships;

create or replace function public.invite_team_member(p_org uuid, p_email text, p_role public.org_role)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_email text := lower(trim(p_email));
  v_token uuid;
begin
  if not public.has_org_role(p_org, array['owner','admin']::public.org_role[]) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if p_role not in ('admin', 'member', 'viewer') then raise exception 'invalid role' using errcode = '22023'; end if;
  if p_role = 'admin' and not public.has_org_role(p_org, array['owner']::public.org_role[]) then
    raise exception 'only the owner can invite admins' using errcode = '42501';
  end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'invalid email' using errcode = '22023'; end if;
  if exists (select 1 from public.memberships m join auth.users u on u.id = m.user_id where m.org_id = p_org and lower(u.email) = v_email) then
    raise exception 'already a member' using errcode = '23505';
  end if;
  update public.team_invites set revoked_at = now() where org_id = p_org and email = v_email and accepted_at is null and revoked_at is null;
  insert into public.team_invites (org_id, email, role, invited_by) values (p_org, v_email, p_role, auth.uid()) returning token into v_token;
  perform public.audit_write(p_org, 'team.invite', v_email, p_role::text);
  return v_token;
end;
$$;
revoke execute on function public.invite_team_member(uuid, text, public.org_role) from public, anon;
grant  execute on function public.invite_team_member(uuid, text, public.org_role) to authenticated;

create or replace function public.revoke_team_invite(p_invite uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v public.team_invites;
begin
  select * into v from public.team_invites where id = p_invite and accepted_at is null and revoked_at is null;
  if v.id is null or not public.has_org_role(v.org_id, array['owner','admin']::public.org_role[]) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  update public.team_invites set revoked_at = now() where id = p_invite;
  perform public.audit_write(v.org_id, 'team.invite_revoked', v.email, v.role::text);
end;
$$;
revoke execute on function public.revoke_team_invite(uuid) from public, anon;
grant  execute on function public.revoke_team_invite(uuid) to authenticated;

-- The invited person signs in with the invited email and pastes the code.
create or replace function public.accept_team_invite(p_token uuid)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v public.team_invites;
  v_email text;
begin
  select lower(email) into v_email from auth.users where id = auth.uid();
  select * into v from public.team_invites where token = p_token and accepted_at is null and revoked_at is null and expires_at > now();
  if v.id is null or v_email is null or v.email <> v_email then
    raise exception 'invalid invitation' using errcode = '22023';
  end if;
  insert into public.memberships (org_id, user_id, role) values (v.org_id, auth.uid(), v.role) on conflict (org_id, user_id) do nothing;
  update public.team_invites set accepted_at = now() where id = v.id;
  insert into public.audit_log (org_id, actor_id, action, target, detail) values (v.org_id, auth.uid(), 'team.joined', v.email, v.role::text);
  return v.org_id;
end;
$$;
revoke execute on function public.accept_team_invite(uuid) from public, anon;
grant  execute on function public.accept_team_invite(uuid) to authenticated;

create or replace function public.team_overview(p_org uuid)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
begin
  if not public.has_org_role(p_org, array['owner','admin']::public.org_role[]) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'members', coalesce((
      select jsonb_agg(jsonb_build_object('user_id', m.user_id, 'email', u.email, 'name', coalesce(nullif(p.full_name, ''), split_part(u.email, '@', 1)), 'role', m.role, 'since', m.created_at) order by m.created_at)
      from public.memberships m join auth.users u on u.id = m.user_id left join public.profiles p on p.id = m.user_id where m.org_id = p_org), '[]'::jsonb),
    'invites', coalesce((
      select jsonb_agg(jsonb_build_object('id', i.id, 'email', i.email, 'role', i.role, 'token', i.token, 'expires_at', i.expires_at) order by i.created_at desc)
      from public.team_invites i where i.org_id = p_org and i.accepted_at is null and i.revoked_at is null and i.expires_at > now()), '[]'::jsonb)
  );
end;
$$;
revoke execute on function public.team_overview(uuid) from public, anon;
grant  execute on function public.team_overview(uuid) to authenticated;

-- Names for assignment menus: any member may see who is on the team (no emails).
create or replace function public.org_people(p_org uuid)
returns table (user_id uuid, name text, role public.org_role)
language sql stable security definer set search_path = public
as $$
  select m.user_id, coalesce(nullif(p.full_name, ''), split_part(u.email, '@', 1)), m.role
  from public.memberships m join auth.users u on u.id = m.user_id left join public.profiles p on p.id = m.user_id
  where m.org_id = p_org and public.is_org_member(p_org)
  order by m.created_at;
$$;
revoke execute on function public.org_people(uuid) from public, anon;
grant  execute on function public.org_people(uuid) to authenticated;

create or replace function public.set_member_role(p_org uuid, p_user uuid, p_role public.org_role)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_old public.org_role;
begin
  if not public.has_org_role(p_org, array['owner']::public.org_role[]) then raise exception 'only the owner can change roles' using errcode = '42501'; end if;
  if p_role not in ('admin', 'member', 'viewer') then raise exception 'invalid role' using errcode = '22023'; end if;
  select role into v_old from public.memberships where org_id = p_org and user_id = p_user;
  if v_old is null then raise exception 'not a member' using errcode = '22023'; end if;
  if v_old = 'owner' then raise exception 'the owner keeps the owner role' using errcode = '22023'; end if;
  update public.memberships set role = p_role where org_id = p_org and user_id = p_user;
  perform public.audit_write(p_org, 'team.role', (select email from auth.users where id = p_user), v_old::text || ' → ' || p_role::text);
end;
$$;
revoke execute on function public.set_member_role(uuid, uuid, public.org_role) from public, anon;
grant  execute on function public.set_member_role(uuid, uuid, public.org_role) to authenticated;

create or replace function public.remove_team_member(p_org uuid, p_user uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_target public.org_role;
  v_me public.org_role;
begin
  select role into v_me from public.memberships where org_id = p_org and user_id = auth.uid();
  select role into v_target from public.memberships where org_id = p_org and user_id = p_user;
  if v_me is null or v_target is null then raise exception 'not allowed' using errcode = '42501'; end if;
  if v_target = 'owner' then raise exception 'the owner cannot be removed' using errcode = '22023'; end if;
  if p_user <> auth.uid() then
    if v_me not in ('owner', 'admin') or (v_me = 'admin' and v_target = 'admin') then raise exception 'not allowed' using errcode = '42501'; end if;
  end if;
  update public.host_tasks set assignee_id = null where org_id = p_org and assignee_id = p_user;
  delete from public.memberships where org_id = p_org and user_id = p_user;
  perform public.audit_write(p_org, case when p_user = auth.uid() then 'team.left' else 'team.removed' end, (select email from auth.users where id = p_user), v_target::text);
end;
$$;
revoke execute on function public.remove_team_member(uuid, uuid) from public, anon;
grant  execute on function public.remove_team_member(uuid, uuid) to authenticated;

create or replace function public.audit_overview(p_org uuid, p_limit integer default 100)
returns table (id uuid, actor text, action text, target text, detail text, created_at timestamptz)
language sql stable security definer set search_path = public
as $$
  select a.id, coalesce(nullif(p.full_name, ''), split_part(u.email, '@', 1), ''), a.action, a.target, a.detail, a.created_at
  from public.audit_log a left join auth.users u on u.id = a.actor_id left join public.profiles p on p.id = a.actor_id
  where a.org_id = p_org and public.has_org_role(p_org, array['owner','admin']::public.org_role[])
  order by a.created_at desc limit least(greatest(p_limit, 1), 300);
$$;
revoke execute on function public.audit_overview(uuid, integer) from public, anon;
grant  execute on function public.audit_overview(uuid, integer) to authenticated;

-- Deleting a booking leaves a trace.
create or replace function public.audit_booking_delete()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if old.kind = 'stay' then
    perform public.audit_write(old.org_id, 'booking.deleted', old.guest_name, old.check_in::text || ' → ' || old.check_out::text);
  end if;
  return old;
end;
$$;
revoke execute on function public.audit_booking_delete() from public, anon, authenticated;
create trigger bookings_audit_delete before delete on public.bookings
  for each row execute function public.audit_booking_delete();

-- ------------------------------------------------------------------ tasks: who and how urgent
alter table public.host_tasks
  add column assignee_id uuid references auth.users (id) on delete set null,
  add column priority    smallint not null default 1 check (priority between 0 and 2);

create or replace function public.assert_task_assignee()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.assignee_id is not null and not exists (select 1 from public.memberships m where m.org_id = new.org_id and m.user_id = new.assignee_id) then
    raise exception 'assignee must belong to the team' using errcode = '22023';
  end if;
  return new;
end;
$$;
revoke execute on function public.assert_task_assignee() from public, anon, authenticated;
create trigger host_tasks_assignee before insert or update of assignee_id on public.host_tasks
  for each row execute function public.assert_task_assignee();

-- ------------------------------------------------------------------ message log
create table public.booking_messages (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations (id) on delete cascade,
  booking_id uuid not null references public.bookings (id) on delete cascade,
  channel    text not null check (channel in ('whatsapp', 'email', 'copy')),
  template   text not null default '' check (char_length(template) <= 40),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default clock_timestamp()
);
create index booking_messages_booking_idx on public.booking_messages (booking_id, created_at desc);
alter table public.booking_messages enable row level security;
create policy booking_messages_select on public.booking_messages
  for select to authenticated using (public.has_product_access(org_id, 'host'));

create or replace function public.log_booking_message(p_booking uuid, p_channel text, p_template text default '')
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_org uuid;
begin
  select org_id into v_org from public.bookings where id = p_booking and kind = 'stay';
  if v_org is null or not public.has_product_access(v_org, 'host') or not public.has_org_role(v_org, array['owner','admin','member']::public.org_role[]) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  insert into public.booking_messages (org_id, booking_id, channel, template, created_by) values (v_org, p_booking, p_channel, left(coalesce(p_template, ''), 40), auth.uid());
end;
$$;
revoke execute on function public.log_booking_message(uuid, text, text) from public, anon;
grant  execute on function public.log_booking_message(uuid, text, text) to authenticated;

-- Readers (viewers) cannot register payments either.
create or replace function public.record_booking_payment(p_booking uuid, p_amount bigint, p_method text default 'cash', p_note text default '', p_paid_on date default current_date)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_org uuid;
  v_id uuid;
begin
  select org_id into v_org from public.bookings where id = p_booking and kind = 'stay';
  if v_org is null or not public.has_product_access(v_org, 'host') or not public.has_org_role(v_org, array['owner','admin','member']::public.org_role[]) then
    raise exception 'host license required' using errcode = '42501';
  end if;
  if p_amount is null or p_amount = 0 then raise exception 'amount required' using errcode = '22023'; end if;
  insert into public.booking_payments (org_id, booking_id, amount_minor, method, note, paid_on, created_by)
  values (v_org, p_booking, p_amount, p_method, left(coalesce(p_note, ''), 300), coalesce(p_paid_on, current_date), auth.uid())
  returning id into v_id;
  if p_amount < 0 then perform public.audit_write(v_org, 'payment.refund', p_booking::text, p_amount::text); end if;
  return v_id;
end;
$$;
