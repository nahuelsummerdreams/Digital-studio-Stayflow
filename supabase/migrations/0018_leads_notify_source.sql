-- "Próximamente" products: the visitor leaves an email to be told when it is out. Source = 'notify-<product>'.
alter table public.leads drop constraint leads_source_check;
alter table public.leads add constraint leads_source_check
  check (source in ('checkout', 'support') or source ~ '^ad-[a-z]{2,20}$' or source ~ '^notify-[a-z]{2,20}$');
