-- Owner-level Supabase security cleanup for PostGIS-owned public objects.
--
-- Run this from the Supabase SQL editor or an admin/support context that can
-- act as the owner of PostGIS extension objects. The normal MCP migration role
-- is current_user=postgres and is not a member of supabase_admin, while
-- public.spatial_ref_sys is owned by supabase_admin.
--
-- Live checks on 2026-05-13:
-- - public.spatial_ref_sys owner: supabase_admin
-- - postgis schema: public
-- - postgis extrelocatable: false
-- - user geometry/geography/raster columns: none

begin;

-- Keep SRID lookup readable, but remove direct public/client write access.
revoke insert, update, delete, truncate, references, trigger
  on table public.spatial_ref_sys
  from anon, authenticated;

alter table public.spatial_ref_sys enable row level security;

drop policy if exists spatial_ref_sys_read_only on public.spatial_ref_sys;
create policy spatial_ref_sys_read_only
  on public.spatial_ref_sys
  for select
  to anon, authenticated
  using (true);

-- These are PostGIS-owned SECURITY DEFINER overloads currently exposed through
-- /rest/v1/rpc/st_estimatedextent. Revoke direct API execution while preserving
-- owner, postgres, and service_role access.
revoke execute on function public.st_estimatedextent(text, text)
  from public, anon, authenticated;
revoke execute on function public.st_estimatedextent(text, text, text)
  from public, anon, authenticated;
revoke execute on function public.st_estimatedextent(text, text, text, boolean)
  from public, anon, authenticated;

commit;

-- Re-run Supabase security advisors after this. Expected remaining warning:
-- extension_in_public for postgis unless the project later drops/recreates
-- PostGIS in a non-public schema during a maintenance window.
