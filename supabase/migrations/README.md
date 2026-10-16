# Supabase Migrations

Run these migrations manually in the Supabase SQL Editor, or apply them through
the configured Supabase MCP when a live schema change is explicitly approved.
Historical files target the instance recorded below. Migration 053 completes
the consolidation onto the canonical AUTH project. The legacy DATA hostname is
retired and must not be used by deployable code or production environment
variables.

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
| 053-single-project-consolidation.sql | Missing education, CreatorMind, JAMB, search telemetry, and WhatsApp metadata tables | **AUTH** - zpclagtgczsygrgztlts.supabase.co |
| 054-consolidated-service-table-policies.sql | Explicit deny policies for service-only consolidation tables | **AUTH** - zpclagtgczsygrgztlts.supabase.co |

## Run Order

Run in numerical order. Migration 007 depends on 001 because it needs the
`calculation_history` table.

### Archived 019: do not replay

`019-afropayroll-os-workflows.sql` is historical source only, preserved byte-for-byte
at [`../migration-history/019-afropayroll-os-workflows.sql`](../migration-history/019-afropayroll-os-workflows.sql).
It is excluded from this executable migration directory and numerical run order.
Do not apply it to create or repair `public.apo_workflows`: it allows account writes
without the explicit Payroll field-consent metadata required by the current client.

Provenance: archived from commit `1b55262d3ab7419de43bd8065782a1ea2a7576e7`,
Git blob `7057452ebbfb1982453fe9bd3d13edf0b3f52cf1`, SHA256
`4132499e3b6d3fed8767b1fa976244839d9b881ffb03a5532172836664cce020` (1611 bytes).
Root's 16 October 2026 metadata snapshot found the table absent and no dedicated
019 history name; this does not establish why or when it became absent.

The replacement is [`20261016182715_apo_workflows_explicit_account_consent.sql`](20261016182715_apo_workflows_explicit_account_consent.sql),
applied once by Root to the verified AUTH project `zpclagtgczsygrgztlts` on
16 October 2026. Its actual recorded history is version `20261016182715`, name
`apo_workflows_explicit_account_consent`. The exact 8083-byte reviewed/applied body
has SHA256 `a06bbd192d9464c279251770d9072781d68f75ae4590b9df6a78583bae38d552`.
The preserved header's "DRAFT ONLY / NOT EXECUTED" comments describe the frozen
pre-execution artifact; they are retained byte-for-byte and do not describe this
recorded application. Do not replay either migration. Reconcile this actual history
before any later migration push.

The table requires `sync_consent_version='payroll-workflow-sync-v1'` and an explicit
Save-action `sync_consented_at`, both NOT NULL with no default. Root's post-apply
metadata verified 14 columns, 12 constraints, five policies and RLS enabled;
authenticated access is owner-isolated CRUD, anonymous privileges are absent,
and service maintenance retains CRUD/TRUNCATE without MAINTAIN. The exact body
passed 18 local role-test groups. Root read or wrote no user records during live
application/metadata verification. These are schema and local-role qualifications,
not deployed frontend, PostgREST account-save, cross-device recovery or complete
Payroll privacy proof. The six accepted account-consent runtime owners are unchanged.

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
- **053 Single-project consolidation**: Creates the last missing tables on AUTH with RLS enabled. Deployable code and Netlify variables must use the AUTH URL and keys after this migration. The old DATA project is retained only as historical documentation; its hostname is no longer an application dependency.
- **054 Consolidated service-table policies**: Adds explicit deny policies for anon/authenticated access while preserving service-role-only Netlify Function access.
- Some statements use `IF NOT EXISTS`; that does not make a whole migration safely re-runnable. Check actual applied history before execution. Archived 019 is excluded and must never be replayed.
- Free tier save limit: 5/month (configurable in application code).
