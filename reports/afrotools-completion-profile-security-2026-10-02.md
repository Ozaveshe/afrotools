# Profile access protection — 2026-10-02

Issue `COMP-PROFILE-ACCESS-PROTECTION` (P0): the live profile ownership policy permitted signed-in users to insert/update their own billing and admin-role fields. Server Pro/admin checks trust those fields. Metadata confirmed six writable access fields and no protecting profile trigger; an isolated PostgreSQL fixture independently reproduced own-row admin/Pro assignment.

The guard is now installed in the correct AfroTools database `zpclagtgczsygrgztlts`, under live migration `20261002071147_protect_profile_access_fields`. Its function body exactly matches the tested source. The enabled trigger rejects changed client billing/admin fields and forged privileged profile creation, while preserving default free profiles, ordinary edits and trusted server lifecycle writes. It also guards client calls nested inside a database-owner function. Existing rows, entitlements, policies and table grants were preserved.

## Validation and limits

- 21 PostgreSQL action checks pass using development-only PGlite with synthetic rows and request contexts. They cover the old defect, all six protected fields, normal profile edits, trusted service lifecycle writes, tenant/anonymous isolation, repeatability and definer/role bypass attempts.
- Full `npm test`: 1,201 files, 3,550 Node tests, six batches, seven audits passed, zero quarantined.
- Build/deploy-artifact, security, lint, type-check, locale, hreflang and SEO metadata checks pass. The source filename was aligned to actual live history after application; the function body is unchanged and focused tests pass after alignment.
- Live metadata verifies the exact function digest, enabled trigger, invoker security, empty search path and revoked direct execution. This proves installed configuration; actual signed-session/profile and billing-provider actions remain separate acceptance work.
- No real account, payment, message, user content or private row was used for tests. No existing user record was altered.

## Still pending

Publisher source integration and exact integrated CI/artifact acceptance remain required. Reconcile the already-applied migration history instead of blindly applying it again. Existing elevated role/subscription assignments need owner review; preserving them does not prove legitimacy. Dashboard leaked-password protection remains flagged. The 30 RLS/no-policy INFO findings require ownership review and include service-only/other-product tables.

AfroTools completion remains uncertified. This repair does not certify whole Pro, account, language, data, API, export or weekly-maintenance readiness. Detailed source hashes, live metadata, evidence paths and boundaries are in the matching JSON report.

The role-context check follows [PostgreSQL's execution-role semantics](https://www.postgresql.org/docs/17/functions-info.html): a definer changes `current_user`, so that value alone is insufficient to identify a trusted request. The regression suite runs SQL in the [PGlite PostgreSQL engine](https://pglite.dev/docs/).
