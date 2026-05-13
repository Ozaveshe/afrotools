# AfroTools Close-Out - 2026-05-13

## Verdict

The free side is close-out ready for maintenance mode after this pass, with Pro now the main active workstream. Release proof is green across links, SEO fatal errors, Pro architecture, domain verifiers, source ledgers, and deploy-surface security.

## Fixed

- Paystack webhook now activates Pro against canonical `profiles` fields instead of stale `user_profiles` assumptions.
- `/api/v1/tax/*` routes reach `api-tax` and compute Nigeria PAYE locally.
- Service worker precache uses existing SVG icons and a bumped cache version.
- Pro plan strings are centralized in `assets/js/lib/pro-plan.js`.
- Pro upgrade, success, cancel, billing, gate coverage, waitlist, analytics, and workspace entry points were hardened.
- Non-active Pro apps now have shared waitlist plumbing and readiness documentation.
- Site audit fatal errors were removed, including JSON-LD failures and private template/body-fragment scan issues.
- SEO report mode now returns 0 missing canonical tags, 0 missing titles, 0 missing descriptions, 0 remaining hreflang violations, and 0 `/fr/` homepage broken-link warnings.
- Government and transport source ledgers now put broken official-source lookups into manual review where appropriate.
- Supabase target schema snapshot was captured under `supabase/snapshots/2026-05-13/` without exporting live user or lead rows.
- i18n validation now passes with warnings only.
- CI now includes `npm run pro:verify`.
- Monthly source-ledger refresh workflow was added.
- Daily maintenance workflow has `AFROTOOLS_DAILY_MAINTENANCE_PAUSED` as a pause switch.

## Sunset or Deferred

- No Pro app was deleted in this pass. Apps remain either Active, Shell, or Blocked in `docs/PRO-APP-READINESS.md`.
- Full FR/SW/HA reciprocal hreflang cleanup is deferred as carried localization debt.
- Live Supabase security advisor warnings are recorded as live-project risk, not repo edits.
- No freeze tag was cut because this checkout still has unrelated pre-existing user edits plus broad generated churn.

## Maintenance Cadence

- Daily: SEO maintenance can run, unless paused with `AFROTOOLS_DAILY_MAINTENANCE_PAUSED=1`.
- Monthly: government and transport ledgers refresh through `.github/workflows/monthly-source-ledgers.yml` and open a manual-review PR on diffs.
- Before release: run `npm run build:deploy`, `npm test`, `npm run audit`, `npm run seo:report`, `npm run pro:verify`, `npm run audit:dist`, and `npm run security:scan`.

## Active Pro Workstream

1. Make Paystack checkout live with a real QA paid account and webhook replay proof.
2. Keep AfroPayroll as the only Active Pro app until account-backed fixtures pass live.
3. Promote only the apps that pass real data-layer QA from Shell to Active.
4. Keep B2B revenue surfaces pointed to `/business-enquiry/` until metering, billing, or fulfillment is real.
