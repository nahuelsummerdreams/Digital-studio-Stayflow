-- The optional-support picker (per tool, monthly) tags its leads as 'support'. The old fixed plans are gone.
alter table public.leads drop constraint leads_source_check;
alter table public.leads add constraint leads_source_check
  check (source in ('checkout', 'support') or source ~ '^ad-[a-z]{2,20}$');
