# Supabase Migrations

Run these migrations manually in the Supabase SQL Editor. Each file targets a specific instance.

## Instance Mapping

| Migration | Table | Target Instance |
|-----------|-------|-----------------|
| 001-calculation-history.sql | `calculation_history` | **DATA** — jbmhfpkzbgyeodsqhprx.supabase.co |
| 002-salary-benchmarks.sql | `salary_benchmarks` | **DATA** — jbmhfpkzbgyeodsqhprx.supabase.co |
| 003-fx-snapshots.sql | `fx_snapshots` | **DATA** — jbmhfpkzbgyeodsqhprx.supabase.co |
| 004-user-workflows.sql | `user_workflows` | **DATA** — jbmhfpkzbgyeodsqhprx.supabase.co |
| 005-user-vault.sql | `vault_documents` | **DATA** — jbmhfpkzbgyeodsqhprx.supabase.co |
| 006-extend-profiles.sql | `profiles` (ALTER) | **AUTH** — zpclagtgczsygrgztlts.supabase.co |
| 007-calculation-count-trigger.sql | trigger + function | **DATA** — jbmhfpkzbgyeodsqhprx.supabase.co |

## Run Order

Run in numerical order (001 through 007). Migration 007 depends on 001 (needs `calculation_history` table).

## Important Notes

- **007 cross-instance caveat**: The `increment_calculation_count` trigger updates `profiles.calculation_count`, but `profiles` lives on the AUTH instance while `calculation_history` lives on DATA. This trigger won't work across instances — you'll need to increment the count via application code (Netlify function) instead. The SQL is provided for reference or if tables are consolidated to one instance.
- All migrations use `IF NOT EXISTS` / `IF NOT EXISTS` where possible to be safely re-runnable.
- Free tier save limit: 5/month (configurable in application code).
