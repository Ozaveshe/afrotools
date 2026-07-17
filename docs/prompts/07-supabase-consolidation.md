# Prompt 07: Supabase Instance Consolidation

## Context

Read these files first:
- `assets/js/afro-auth.js` (AUTH Supabase instance: `zpclagtgczsygrgztlts.supabase.co`)
- `netlify/functions/api-history.js` (DATA Supabase instance: `jbmhfpkzbgyeodsqhprx.supabase.co`)
- `netlify/functions/capture-lead.js` (DATA instance)
- `supabase/migrations/` (all migration files)
- `netlify.toml` (environment variable references)
- Search the entire codebase for both Supabase URLs to find all references

Currently there are TWO Supabase instances:
1. **AUTH** (`zpclagtgczsygrgztlts`) — User authentication, profiles
2. **DATA** (`jbmhfpkzbgyeodsqhprx`) — Calculation history, email leads, salary benchmarks, etc.

This adds latency (cross-instance joins impossible), doubles cost, and complicates operations. Supabase's auth system lives inside every project, so both can be consolidated.

## Objective

Migrate all data tables into the AUTH Supabase instance so there is ONE single source of truth. Then remove all references to the DATA instance.

### Migration Plan

1. Create all DATA tables in the AUTH instance (via migrations)
2. Export data from DATA instance → import into AUTH instance
3. Update all Netlify function environment variables
4. Update all client-side Supabase references
5. Verify all RLS policies work with the unified instance
6. Decommission DATA instance

## Constraints

- This is a high-risk migration — document every step, create rollback plan
- Do NOT delete the DATA instance until AUTH instance is fully verified (keep for 30 days)
- All RLS policies must be recreated on the AUTH instance
- Environment variables: consolidate to single `SUPABASE_URL` and `SUPABASE_KEY` (remove `SUPABASE_DATA_URL` etc.)
- Foreign keys from `calculation_history.user_id` should now reference `auth.users(id)` directly (possible in same instance)
- Run this migration during low-traffic hours
- Test every Netlify function individually after migration
- The Supabase proxy in `_redirects` (`/supabase-proxy/*`) must be updated to point to single instance

## Implementation Steps

1. **Audit**: Search all files for both Supabase URLs. List every file that references each instance.
2. **Create migrations**: Write SQL migration files that recreate DATA tables in AUTH instance:
   - `calculation_history`
   - `email_leads`
   - `salary_benchmarks`
   - `search_queries` (if created by Prompt 03)
   - `user_workflows`
   - `user_vault`
   - Any other DATA-only tables
3. **Apply migrations** to AUTH instance via Supabase dashboard or CLI
4. **Data export/import**: Use `pg_dump` / Supabase CLI to export DATA tables → import into AUTH
5. **Update environment variables**:
   - In Netlify dashboard: set `SUPABASE_URL` to AUTH URL, remove DATA-specific vars
   - Update `netlify.toml` if any env vars are referenced there
6. **Update Netlify functions**: Change every function that uses DATA Supabase URL to use the unified URL
7. **Update client-side JS**: Change any hardcoded Supabase URLs to the single instance
8. **Update `_redirects`**: Single proxy entry for the AUTH instance
9. **Update RLS policies**: Ensure all tables have correct policies for the unified instance
10. **Test every endpoint** individually
11. **Monitor** for 7 days before decommissioning DATA instance

## Verification

- Every Netlify function should return correct data (test each endpoint)
- Login/signup should still work
- Calculation history should show existing records
- Email lead capture should save to unified instance
- Dashboard should load user data correctly
- Check Supabase dashboard → AUTH instance should show all tables with data
- `_redirects` proxy should work for auth calls
- No 500 errors in Netlify function logs for 24 hours
