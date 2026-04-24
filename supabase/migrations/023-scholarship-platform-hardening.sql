-- Hardens the scholarship platform layer so a fresh database replay matches
-- the live project assumptions and Supabase advisor recommendations.

create or replace function public.update_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create index if not exists idx_scholarships_last_source_id
on public.scholarships(last_source_id);

create index if not exists idx_user_saved_scholarships_scholarship_id
on public.user_saved_scholarships(scholarship_id);

create index if not exists idx_user_scholarship_reminders_scholarship_id
on public.user_scholarship_reminders(scholarship_id);

create index if not exists idx_scholarship_notification_jobs_scholarship_id
on public.scholarship_notification_jobs(scholarship_id);

create index if not exists idx_scholarship_notification_log_job_id
on public.scholarship_notification_log(job_id);

do $$
begin
  alter table if exists public.spatial_ref_sys enable row level security;
  drop policy if exists "Anyone can read spatial references" on public.spatial_ref_sys;
  create policy "Anyone can read spatial references"
  on public.spatial_ref_sys
  for select
  using (true);
exception
  when insufficient_privilege then
    raise notice 'Skipping spatial_ref_sys RLS hardening because the current role does not own the PostGIS table.';
end $$;

drop policy if exists "Service role manages scholarship sources" on public.scholarship_sources;
create policy "Service role manages scholarship sources"
on public.scholarship_sources
for all
to service_role
using ((select auth.role()) = 'service_role')
with check ((select auth.role()) = 'service_role');

drop policy if exists "Service role manages scholarship ingest runs" on public.scholarship_ingest_runs;
create policy "Service role manages scholarship ingest runs"
on public.scholarship_ingest_runs
for all
to service_role
using ((select auth.role()) = 'service_role')
with check ((select auth.role()) = 'service_role');

drop policy if exists "Service role manages scholarship raw items" on public.scholarship_raw_items;
create policy "Service role manages scholarship raw items"
on public.scholarship_raw_items
for all
to service_role
using ((select auth.role()) = 'service_role')
with check ((select auth.role()) = 'service_role');

drop policy if exists "Users can read own saved scholarships" on public.user_saved_scholarships;
create policy "Users can read own saved scholarships"
on public.user_saved_scholarships
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own saved scholarships" on public.user_saved_scholarships;
create policy "Users can insert own saved scholarships"
on public.user_saved_scholarships
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own saved scholarships" on public.user_saved_scholarships;
create policy "Users can update own saved scholarships"
on public.user_saved_scholarships
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own saved scholarships" on public.user_saved_scholarships;
create policy "Users can delete own saved scholarships"
on public.user_saved_scholarships
for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can read own scholarship reminders" on public.user_scholarship_reminders;
create policy "Users can read own scholarship reminders"
on public.user_scholarship_reminders
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own scholarship reminders" on public.user_scholarship_reminders;
create policy "Users can insert own scholarship reminders"
on public.user_scholarship_reminders
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own scholarship reminders" on public.user_scholarship_reminders;
create policy "Users can update own scholarship reminders"
on public.user_scholarship_reminders
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own scholarship reminders" on public.user_scholarship_reminders;
create policy "Users can delete own scholarship reminders"
on public.user_scholarship_reminders
for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can read own scholarship notification jobs" on public.scholarship_notification_jobs;
create policy "Users can read own scholarship notification jobs"
on public.scholarship_notification_jobs
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can read own scholarship notification log" on public.scholarship_notification_log;
create policy "Users can read own scholarship notification log"
on public.scholarship_notification_log
for select
to authenticated
using (
  exists (
    select 1
    from public.scholarship_notification_jobs jobs
    where jobs.id = scholarship_notification_log.job_id
      and jobs.user_id = (select auth.uid())
  )
);
