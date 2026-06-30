# Supabase Migrations

Run these migrations manually in the Supabase SQL Editor, or apply them through
the configured Supabase MCP when a live schema change is explicitly approved.
Each file targets a specific instance.

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
| 033-afropayroll-pro-schema.sql | `payroll_*` tables, policies, dashboard view | **AUTH** - zpclagtgczsygrgztlts.supabase.co |
| 034-afropayroll-pro-rls-helper-hardening.sql | private payroll RLS helpers | **AUTH** - zpclagtgczsygrgztlts.supabase.co |
| 035-afropayroll-pro-fk-indexes.sql | FK index completion for `payroll_*` tables | **AUTH** - zpclagtgczsygrgztlts.supabase.co |
| 038-email-marketing-engine.sql | `profiles` email fields, `email_leads` lifecycle state | **AUTH** - zpclagtgczsygrgztlts.supabase.co |
| 039-email-lifecycle-dedup.sql | `profiles.email_welcome_sent_at` | **AUTH** - zpclagtgczsygrgztlts.supabase.co |
| 043-email-automation-preferences.sql | weekly newsletter and sign-in reminder send state | **AUTH** - zpclagtgczsygrgztlts.supabase.co |
| 045-email-behavior-automation-state.sql | activation, first-activity, and PDF lead follow-up send state | **AUTH** - zpclagtgczsygrgztlts.supabase.co |
| 046-b2b-commercial-enquiry-fields.sql | B2B commercial lead enrichment on `data_buyer_leads` | **AUTH/marketing** - verify with Supabase MCP before applying |
| 052-function-search-path-hardening.sql | Pins security-advised public function search paths | **AUTH** - zpclagtgczsygrgztlts.supabase.co |

## Run Order

Run in numerical order. Migration 007 depends on 001 because it needs the
`calculation_history` table.

## Important Notes

- **007 cross-instance caveat**: The `increment_calculation_count` trigger updates `profiles.calculation_count`, but `profiles` lives on the AUTH instance while `calculation_history` lives on DATA. This trigger will not work across instances. Increment the count via application code, or only use the SQL if tables are consolidated to one instance.
- **033 AfroPayroll Pro**: Targets the AUTH instance because account access, client workspaces, roles, approvals, audit trails, and salary-sensitive payroll rows need the logged-in user identity and RLS policies in the same project.
- **034 AfroPayroll Pro hardening**: Moves internal RLS helper functions into the non-exposed `private` schema so they are not callable as public RPC endpoints.
- **035 AfroPayroll Pro indexes**: Adds direct FK indexes flagged by Supabase performance advisor after the first schema apply.
- **038 Email marketing engine**: Targets the AUTH instance because account profiles, PDF leads, unsubscribe tokens, and Resend lifecycle sends need one project contract.
- **039 Email lifecycle dedupe**: Lets signup welcome sends be idempotent instead of sending repeated welcomes for the same account.
- **043 Email automation preferences**: Adds weekly-newsletter and sign-in-reminder send-state columns so scheduled email automation is repeat-safe.
- **045 Email behavior automation state**: Adds send-state columns for activation nudges, first-activity milestones, and delayed PDF/report lead follow-ups.
- **046 B2B commercial enquiry fields**: Enriches the existing buyer-lead table for widget demos, sponsorships, custom calculators, API pilots, and media kit requests. Apply after live schema inspection and run Supabase advisors because it tightens anonymous insert policy.
- **052 Function search path hardening**: Pins `normalize_scholarship_source_defaults()` and `parse_afrostream_money_value(text)` to `public` search path to clear mutable-search-path security advisor findings after live schema inspection.
- All migrations use `IF NOT EXISTS` where possible to be safely re-runnable.
- Free tier save limit: 5/month (configurable in application code).
