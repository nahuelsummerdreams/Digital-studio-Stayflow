-- 0036 · Access codes for STAYflow Marketing (sold apart from COMPLETE).
-- The Marketing app has no accounts: a buyer pastes a code and the browser keeps a random device id. One code works on a few devices
-- (3 by default), so it can be used on a phone and a laptop but not passed around. Codes are created and revoked by the seller only.
-- Additive: new tables and functions, nothing existing is touched.

create table public.marketing_codes (
  code        text primary key check (code ~ '^MK-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$'),
  note        text not null default '' check (char_length(note) <= 200),
  max_devices integer not null default 3 check (max_devices between 1 and 10),
  revoked_at  timestamptz,
  created_at  timestamptz not null default now()
);
alter table public.marketing_codes enable row level security; -- no policies on purpose
revoke all on public.marketing_codes from anon, authenticated;

create table public.marketing_devices (
  code       text not null references public.marketing_codes (code) on delete cascade,
  device     uuid not null,
  first_seen timestamptz not null default now(),
  last_seen  timestamptz not null default now(),
  primary key (code, device)
);
alter table public.marketing_devices enable row level security; -- no policies on purpose
revoke all on public.marketing_devices from anon, authenticated;

-- Checks a code for one device and registers the device if there is room. Returns 'ok', 'invalid', 'revoked' or 'full'.
-- The only thing the browser can call. It never returns the list of codes or devices.
create or replace function public.marketing_access(p_code text, p_device uuid)
returns text
language plpgsql security definer set search_path = pg_catalog, public
as $$
declare
  v public.marketing_codes%rowtype;
  n integer;
begin
  if p_code is null or p_device is null then
    return 'invalid';
  end if;
  select * into v from public.marketing_codes where code = upper(btrim(p_code)) for update;
  if not found then
    return 'invalid';
  end if;
  if v.revoked_at is not null then
    return 'revoked';
  end if;
  update public.marketing_devices set last_seen = now() where code = v.code and device = p_device;
  if found then
    return 'ok';
  end if;
  select count(*) into n from public.marketing_devices where code = v.code;
  if n >= v.max_devices then
    return 'full';
  end if;
  insert into public.marketing_devices (code, device) values (v.code, p_device);
  return 'ok';
end;
$$;
revoke execute on function public.marketing_access(text, uuid) from public;
grant  execute on function public.marketing_access(text, uuid) to anon, authenticated;

-- Seller: issues N codes (same randomness as the license codes: 60 bits each).
create or replace function public.create_marketing_codes(p_count integer default 1, p_note text default '', p_max_devices integer default 3)
returns setof text
language plpgsql security definer set search_path = pg_catalog, public
as $$
declare
  v_alpha constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_pos constant integer[] := array[0, 1, 2, 3, 4, 5, 9, 10, 11, 12, 13, 14];
  v_made integer := 0;
  v_hex text;
  v_code text;
  i integer;
begin
  if p_count is null or p_count < 1 or p_count > 500 then
    raise exception 'count must be between 1 and 500' using errcode = '22023';
  end if;
  while v_made < p_count loop
    v_hex := replace(gen_random_uuid()::text, '-', '');
    v_code := 'MK';
    for i in 1 .. 12 loop
      if (i - 1) % 4 = 0 then v_code := v_code || '-'; end if;
      v_code := v_code || substr(v_alpha, 1 + (get_byte(decode(substr(v_hex, 2 * v_pos[i] + 1, 2), 'hex'), 0) % 32), 1);
    end loop;
    begin
      insert into public.marketing_codes (code, note, max_devices) values (v_code, left(coalesce(p_note, ''), 200), coalesce(p_max_devices, 3));
      v_made := v_made + 1;
      return next v_code;
    exception when unique_violation then
      null;
    end;
  end loop;
end;
$$;
revoke execute on function public.create_marketing_codes(integer, text, integer) from public, anon, authenticated;

-- Seller: refund or abuse. The code stops working at the next check.
create or replace function public.revoke_marketing_code(p_code text)
returns text
language plpgsql security definer set search_path = pg_catalog, public
as $$
begin
  update public.marketing_codes set revoked_at = coalesce(revoked_at, now()), note = left(note || ' [revocado]', 200) where code = upper(btrim(p_code));
  if not found then
    raise exception 'unknown code' using errcode = 'P0002';
  end if;
  return 'revoked';
end;
$$;
revoke execute on function public.revoke_marketing_code(text) from public, anon, authenticated;

-- Seller: one look at every code and how many devices use it.
create or replace view public.marketing_codes_overview with (security_invoker = true) as
  select c.code, c.note, c.max_devices, c.created_at, c.revoked_at, (select count(*) from public.marketing_devices d where d.code = c.code) as devices
  from public.marketing_codes c
  order by c.created_at desc;
revoke all on public.marketing_codes_overview from public, anon, authenticated;
