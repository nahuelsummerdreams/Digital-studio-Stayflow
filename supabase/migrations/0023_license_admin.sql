-- Seller-side tools for license codes. Only the service role / SQL editor can run them: the browser never can.
-- Claude (through the Supabase connection) uses these to issue and revoke licenses.

-- Issues N codes for a set of products. Codes come from gen_random_uuid() (cryptographic randomness), 60 bits each.
create or replace function public.create_license_codes(p_products public.product_key[], p_count integer default 1, p_note text default '')
returns setof text
language plpgsql security definer set search_path = public
as $$
declare
  v_alpha constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_pos constant integer[] := array[0, 1, 2, 3, 4, 5, 9, 10, 11, 12, 13, 14]; -- uuid bytes that are fully random (v4 fixes bytes 6 and 8)
  v_made integer := 0;
  v_hex text;
  v_code text;
  i integer;
begin
  if p_count is null or p_count < 1 or p_count > 500 then
    raise exception 'count must be between 1 and 500' using errcode = '22023';
  end if;
  if p_products is null or cardinality(p_products) = 0 then
    raise exception 'at least one product is required' using errcode = '22023';
  end if;
  while v_made < p_count loop
    v_hex := replace(gen_random_uuid()::text, '-', '');
    v_code := 'SF';
    for i in 1 .. 12 loop
      if (i - 1) % 4 = 0 then v_code := v_code || '-'; end if;
      v_code := v_code || substr(v_alpha, 1 + (get_byte(decode(substr(v_hex, 2 * v_pos[i] + 1, 2), 'hex'), 0) % 32), 1);
    end loop;
    begin
      insert into public.license_codes (code, products, note) values (v_code, p_products, left(coalesce(p_note, ''), 200));
      v_made := v_made + 1;
      return next v_code;
    exception when unique_violation then
      null; -- astronomically rare: draw again
    end;
  end loop;
end;
$$;
revoke execute on function public.create_license_codes(public.product_key[], integer, text) from public, anon, authenticated;

-- Refund / cancellation. A code nobody used is deleted. A used one cancels the licenses it granted (the customer keeps their data).
create or replace function public.revoke_license_code(p_code text)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  v public.license_codes%rowtype;
  n integer;
begin
  select * into v from public.license_codes where code = upper(btrim(p_code));
  if not found then
    raise exception 'unknown code' using errcode = 'P0002';
  end if;
  if v.redeemed_at is null then
    delete from public.license_codes where code = v.code;
    return 'deleted: it had not been used';
  end if;
  update public.licenses
     set status = 'canceled', updated_at = now()
   where org_id = v.redeemed_org and product = any (v.products) and billing_provider = 'code';
  get diagnostics n = row_count;
  update public.license_codes set note = left(note || ' [revocado]', 200) where code = v.code;
  return format('revoked: %s license(s) canceled', n);
end;
$$;
revoke execute on function public.revoke_license_code(text) from public, anon, authenticated;

-- One look at every code: what it unlocks, whether it was used, by which business.
create or replace view public.license_codes_overview as
  select c.code, c.products, c.note, c.created_at, c.redeemed_at, o.name as redeemed_by_business
  from public.license_codes c
  left join public.organizations o on o.id = c.redeemed_org
  order by c.created_at desc;
revoke all on public.license_codes_overview from public, anon, authenticated;
