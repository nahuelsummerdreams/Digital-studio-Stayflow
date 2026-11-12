-- Hostel beds: a checkout on a bed must not create a cleaning task or job per bed.
-- A dormitory is cleaned as a whole, so hostels use a recurring cleaning job per room (Operations > Recurring).
-- Hotel rooms, rooms of a hostel without beds and rental properties keep one cleaning per checkout, as before.

create or replace function public.sync_cleaning_task()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_title text := 'Limpieza tras la salida de ' || left(new.guest_name, 80);
  v_is_bed boolean := exists (select 1 from public.properties p where p.id = new.property_id and p.unit_kind = 'bed');
begin
  if new.kind <> 'stay' or new.status = 'canceled' or v_is_bed then
    delete from public.host_tasks where booking_id = new.id and not done;
    return new;
  end if;
  update public.host_tasks
     set due_on = new.check_out, title = v_title, property_id = new.property_id
   where booking_id = new.id and not done;
  if not found and not exists (select 1 from public.host_tasks where booking_id = new.id) then
    insert into public.host_tasks (org_id, property_id, title, due_on, booking_id, created_by)
    values (new.org_id, new.property_id, v_title, new.check_out, new.id, new.created_by);
  end if;
  return new;
end;
$$;
revoke execute on function public.sync_cleaning_task() from public, anon, authenticated;

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
  join public.properties pr on pr.id = b.property_id
  where b.org_id = p_org and b.kind = 'stay' and b.status <> 'canceled'
    and pr.unit_kind is distinct from 'bed'
    and b.check_out between current_date - 1 and current_date + 90
  on conflict (booking_id, kind) do nothing;
  get diagnostics v_added = row_count;

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
