-- Ad landing pages (Meta etc.) tag their leads as 'ad-<product>'.
alter table public.leads drop constraint leads_source_check;
alter table public.leads add constraint leads_source_check
  check (source in ('checkout', 'plan-starter', 'plan-pro', 'plan-business') or source ~ '^ad-[a-z]{2,20}$');
