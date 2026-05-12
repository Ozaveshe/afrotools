# Supabase Security Advisor Follow-up - 2026-05-12

## Live Fix Applied

Migration applied through Supabase MCP:

- `security_definer_rpc_exposure_hardening`

It removed direct `anon` and `authenticated` RPC execution from these app-owned SECURITY DEFINER functions:

- `public.increment_view_count(text)`
- `public.seller_audit_row_change()`
- `public.seller_create_owner_membership()`
- `public.seller_validate_business_links()`
- `public.vote_community_idea(uuid, text)`
- `public.vote_community_price(uuid, text)`

Repo parity file:

- `supabase/migrations/048-security-definer-rpc-exposure-hardening.sql`

## Remaining Live Findings

### ERROR: `public.spatial_ref_sys` RLS Disabled

Supabase still reports:

- `rls_disabled_in_public`
- Table: `public.spatial_ref_sys`
- Remediation guide: `https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public`

Attempted safe remediation:

```sql
revoke insert, update, delete, truncate, references, trigger on table public.spatial_ref_sys from anon, authenticated;
alter table public.spatial_ref_sys enable row level security;
create policy spatial_ref_sys_read_only
  on public.spatial_ref_sys
  for select
  to anon, authenticated
  using (true);
```

Result:

```text
ERROR: must be owner of table spatial_ref_sys
```

Reason:

- `public.spatial_ref_sys` is owned by the non-relocatable PostGIS extension owner, not the migration role available through MCP.
- `postgis` is installed in `public` and `pg_extension.extrelocatable` is `false`, so it cannot be safely moved with `ALTER EXTENSION postgis SET SCHEMA extensions`.

Recommended owner-level action:

- Run the RLS/grant hardening above from the Supabase SQL editor or support path with the extension owner/admin context.
- Preserve read-only access if any PostGIS clients need SRID lookup.

### WARN: PostGIS Installed In `public`

Supabase still reports:

- `extension_in_public`
- Extension: `postgis`
- Remediation guide: `https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public`

Current live check:

- No `geometry`, `geography`, or `raster` columns were found in user tables.
- `postgis.extrelocatable = false`, so moving it is not a simple live migration.

Recommended action:

- Treat this as an extension-owner migration, not an app migration. Plan a maintenance window if the project decides to drop/recreate PostGIS in a dedicated schema.

### WARN: PostGIS `st_estimatedextent` RPC Exposure

Remaining SECURITY DEFINER warnings are PostGIS-owned overloads:

- `public.st_estimatedextent(text, text)`
- `public.st_estimatedextent(text, text, text)`
- `public.st_estimatedextent(text, text, text, boolean)`

Recommended action:

- Revoke direct `anon` and `authenticated` execute only from an owner/admin context, or fix as part of the PostGIS-in-public cleanup.

### WARN: Leaked Password Protection Disabled

Supabase still reports leaked-password protection disabled.

Recommended action:

- Enable it in Supabase Auth settings.
- Guide: `https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection`
