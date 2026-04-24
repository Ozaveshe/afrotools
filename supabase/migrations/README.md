# Supabase Migrations

Run these migrations manually in the Supabase SQL Editor. Each file targets a specific instance.

## Instance Mapping

| Migration | Table | Target Instance |
|-----------|-------|-----------------|
| 001-calculation-history.sql | `calculation_history` | **DATA** - jbmhfpkzbgyeodsqhprx.supabase.co |
| 002-salary-benchmarks.sql | `salary_benchmarks` | **DATA** - jbmhfpkzbgyeodsqhprx.supabase.co |
| 003-fx-snapshots.sql | `fx_snapshots` | **DATA** - jbmhfpkzbgyeodsqhprx.supabase.co |
| 004-user-workflows.sql | `user_workflows` | **DATA** - jbmhfpkzbgyeodsqhprx.supabase.co |
| 005-user-vault.sql | `vault_documents` | **DATA** - jbmhfpkzbgyeodsqhprx.supabase.co |
| 006-extend-profiles.sql | `profiles` (ALTER) | **AUTH** - zpclagtgczsygrgztlts.supabase.co |
| 007-calculation-count-trigger.sql | trigger + function | **DATA** - jbmhfpkzbgyeodsqhprx.supabase.co |
| 20260417005254_add_workspace_items_table.sql | `workspace_items` | **AUTH** - zpclagtgczsygrgztlts.supabase.co |
| 20260417010435_fix_workspace_items_trigger_search_path.sql | `workspace_items` trigger hardening | **AUTH** - zpclagtgczsygrgztlts.supabase.co |

## Run Order

Run in numerical order for legacy files (001 through 007), then run timestamped files in ascending timestamp order. Migration 007 depends on 001 (needs `calculation_history` table).

## Important Notes

- **007 cross-instance caveat**: The `increment_calculation_count` trigger updates `profiles.calculation_count`, but `profiles` lives on the AUTH instance while `calculation_history` lives on DATA. This trigger will not work across instances; increment the count via application code (Netlify function) unless tables are consolidated.
- All migrations use re-runnable guards where possible.
- Free tier save limit: 5/month (configurable in application code).
