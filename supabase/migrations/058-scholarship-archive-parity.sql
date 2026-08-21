-- Reproduce the archive lifecycle field used by the scholarship mirror query.
-- The production project already has this field; IF NOT EXISTS keeps replay safe.

alter table public.scholarships
  add column if not exists is_archived boolean not null default false;

create index if not exists idx_scholarships_active_archive_deadline
  on public.scholarships(is_active, is_archived, deadline_date);
