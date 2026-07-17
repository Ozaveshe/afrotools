# Supabase Schema Snapshot - 2026-05-13

Project URL: `https://zpclagtgczsygrgztlts.supabase.co`

Captured through the configured Supabase MCP server on 2026-05-13. This snapshot is schema-only: no user rows, emails, payroll data, or lead payloads were exported into the repo.

## Target Scope

The close-out prompt requested the canonical schema for:

- `profiles`
- subscription / Paystack tables
- payroll tables
- HR / Books demo tables
- B2B lead capture tables

## Live Tables Found

| Table or view | Approx rows | Notes |
| --- | ---: | --- |
| `public.profiles` | 56 | Canonical account and Pro subscription truth. Includes `tier`, `subscription_tier`, `subscription_expires_at`, `paystack_customer_id`, and `paystack_subscription_code`. |
| `public.data_buyer_leads` | 0 | B2B/data-buyer lead table. |
| `public.email_leads` | 4 | Email/PDF-gate and conversion lead table. |
| `public.mw_alert_subscriptions` | 0 | Alert subscription table, not the Pro subscription system. |
| `public.payroll_approvals` | 0 | AfroPayroll workflow table. |
| `public.payroll_audit_events` | 0 | AfroPayroll audit trail. |
| `public.payroll_clients` | 0 | AfroPayroll client workspace root. |
| `public.payroll_companies` | 0 | AfroPayroll company table. |
| `public.payroll_country_pack_versions` | 0 | Payroll country-pack version metadata. |
| `public.payroll_employee_portal_invites` | 0 | Payroll employee portal invite table. |
| `public.payroll_employees` | 0 | Payroll employee table. |
| `public.payroll_exports` | 0 | Payroll export records. |
| `public.payroll_import_batches` | 0 | Payroll import batches. |
| `public.payroll_memberships` | 0 | Payroll membership and role table. |
| `public.payroll_payslips` | 0 | Payroll payslip records. |
| `public.payroll_role_permissions` | 6 | Static payroll role permission rows. |
| `public.payroll_run_dashboard` | n/a | View. RLS not applicable on the view itself in the MCP table summary. |
| `public.payroll_run_rows` | 0 | Payroll run row table. |
| `public.payroll_runs` | 0 | Payroll run header table. |
| `public.payroll_statutory_packs` | 0 | Payroll statutory pack table. |
| `public.payroll_workspace_comments` | 0 | Payroll workspace comments. |

## Tables Not Found

No live tables matched these families at snapshot time:

- `user_profiles`
- `paystack%`
- `%subscription%` for Pro billing, other than `mw_alert_subscriptions`
- `afrohr_%`
- `afrobooks_%`
- `books_%`
- `hr_%`

This means the close-out Pro activation path should continue to treat `public.profiles` as the account/subscription source of truth until dedicated billing tables are added.

## Live Advisor Note

The Supabase MCP `list_tables` response surfaced a carried live-project advisory: `public.spatial_ref_sys` has RLS disabled. This snapshot does not apply live DDL. If the owner wants to remediate, enable RLS only with an explicit policy decision because enabling RLS without policies can block existing access.

## Replay

Use `target-schema-snapshot.sql` in this folder to regenerate a compact schema snapshot from the live project.
