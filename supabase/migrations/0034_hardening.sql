-- 0034 · Hardening and performance, from the Supabase advisors (2026-11-15). No data is touched; every statement is idempotent.
--
-- 1. Four helper functions had a role-mutable search_path (WARN function_search_path_mutable). They only use pg_catalog functions,
--    so pinning the path changes nothing in behaviour and removes the warning.
alter function public.ops_default_cleaning() set search_path = pg_catalog, public;
alter function public.ops_items_to_checklist(jsonb) set search_path = pg_catalog, public;
alter function public.tags_ok(text[]) set search_path = pg_catalog, public;
alter function public.incident_stamp() set search_path = pg_catalog, public;

-- 2. profiles_self re-evaluated auth.uid() for every row (WARN auth_rls_initplan). Same rule, evaluated once per query.
drop policy if exists profiles_self on public.profiles;
create policy profiles_self on public.profiles for all
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- 3. Indexes for the foreign keys the app filters or joins on (INFO unindexed_foreign_keys). The "created_by" columns are left out on purpose:
--    nobody queries by them and every index slows writes.
create index if not exists booking_events_org_idx        on public.booking_events (org_id);
create index if not exists booking_messages_org_idx      on public.booking_messages (org_id);
create index if not exists booking_payments_org_idx      on public.booking_payments (org_id);
create index if not exists host_tasks_property_idx       on public.host_tasks (property_id);
create index if not exists host_tasks_assignee_idx       on public.host_tasks (assignee_id);
create index if not exists lodging_type_changes_org_idx  on public.lodging_type_changes (org_id);
create index if not exists ops_checklists_property_idx   on public.ops_checklists (property_id);
create index if not exists ops_job_photos_org_idx        on public.ops_job_photos (org_id);
create index if not exists ops_jobs_property_idx         on public.ops_jobs (property_id);
create index if not exists ops_recurring_property_idx    on public.ops_recurring (property_id);
create index if not exists property_details_org_idx      on public.property_details (org_id);
create index if not exists recurring_expenses_property_idx on public.recurring_expenses (property_id);
create index if not exists expense_entries_recurring_idx on public.expense_entries (recurring_id);

-- Reviewed and left as is, by design (documented in docs/SEGURIDAD-ADVISORS.md):
--  * assistant_usage and license_codes: RLS on with no policy = only the server-side functions can touch them.
--  * SECURITY DEFINER functions executable by anon (get_public_guide, ical_feed, ops_staff_*, ops_photo_path_ok): they are the token links
--    (public guide, calendar feed, cleaning team). Each one checks its token inside.
--  * SECURITY DEFINER functions executable by authenticated: the app's RPC API; each checks membership or role inside.
--  * start_trial is off unless the database setting stayflow.allow_trials = 'on' (decision: no free trial).
--  * Multiple permissive policies (select + write): a performance note, harmless at this size; revisit with real volume.
--  * Leaked-password protection: a switch in the Supabase dashboard (Auth), not SQL.
