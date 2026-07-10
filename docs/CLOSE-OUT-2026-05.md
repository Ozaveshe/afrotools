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
- i18n validation now passes cleanly: `npm run build:i18n:full` rebuilds i18n, repairs reciprocal hreflang groups, and validates with 0 errors and 0 warnings.
- 2026-05-14 gap check confirmed `npm test`, `npm run pro:verify`, `npm run build:deploy`, `npm run audit:dist`, `npm run security:scan`, `npm run check-links`, and `npm run seo:report` all pass after the i18n/redirect close-out.
- 2026-05-15 free-tools debug check confirmed the public tool surface remains close-out ready: `npm run audit`, `npm run check-links`, `npm run seo:report`, `npm run build:i18n:validate`, `npm run validate:hreflang`, `npm run pdf:verify`, `npm run salary-tax:verify`, `npm run vat-business-tax:verify`, `npm run legal-workflow:verify`, `npm run category-workflow:verify`, `npm test`, `npm run pro:verify`, `npm run security:scan`, `npm run build:deploy`, `npm run audit:dist`, and `git diff --check` all passed.
- 2026-06-04 return pass archived Matchday OS from public deployment without deleting the work: removed the registry row, sports page CTA, navbar link, `/api/matchday` redirects, and deployable Matchday function endpoints; `scripts/build-dist.js` and `scripts/generate-sitemaps.js` now keep the route and assets out of `dist` and public sitemaps. Proof: `npm run audit`, `npm run build:deploy`, `npm run check-links`, `npm run security:scan`, `npm run audit:dist`, and `git diff --check` passed. Direct checks found no Matchday route, API, nav, sitemap, search, asset, or data references in the public deploy artifact.
- CI now includes `npm run pro:verify`.
- Source-ledger GitHub Actions now split daily check mode from weekly refresh PR mode.
- Daily maintenance workflow has `AFROTOOLS_DAILY_MAINTENANCE_PAUSED` as a pause switch.
- 2026-06-04 shipping pass removes Matchday OS from public discovery, API redirects, sitemap output, and deploy artifacts while archiving its Netlify endpoint files under `ops/archived-matchday-os/` for later reuse.
- 2026-07-10 website, content, AI-catalog, and automation improvement pass upgraded all 73 active Codex automations from `gpt-5.5` to `gpt-5.6` through the Codex automation API and changed the AM/PM content batches to choose evidence-backed refreshes before new posts. Repo work cleared all 8 blog editorial warnings, localized generated source/method/limitations/test panels across 108 French PAYE/VAT pages, made tool-quality scoring hydration- and app-route-aware, and synchronized the 1,247-tool AI catalog plus its 159-record synthetic corpus and 100/29/30 model splits. Proof: `npm test`, `npm run check-links`, `npm run tools:quality`, `npm run blog:editorial:audit`, `npm run blog:feed:check`, `npm run blog:verify`, `npm run build:i18n:validate`, `npm run validate:hreflang`, `npm run salary-tax:verify`, `npm run vat-business-tax:verify`, and targeted browser smoke passed. The final static tool-quality distribution was 3,244 A, 14 B, and 0 C/D/F rows. No deploy or live-production verification was performed.

## Sunset or Deferred

- No Pro app was deleted in this pass. Apps remain either Active, Shell, or Blocked in `docs/PRO-APP-READINESS.md`.
- Live Supabase security advisor warnings are recorded as live-project risk, not repo edits.
- No freeze tag was cut because this checkout still has unrelated pre-existing user edits plus broad generated churn.

## Maintenance Cadence

- Daily: SEO maintenance can run, unless paused with `AFROTOOLS_DAILY_MAINTENANCE_PAUSED=1`.
- Daily: government and transport ledgers run check mode through `.github/workflows/source-ledger-checks.yml`.
- Weekly: government and transport ledgers refresh through `.github/workflows/source-ledger-refresh-pr.yml` and open a manual-review PR on diffs.
- Before release: run `npm run build:deploy`, `npm test`, `npm run build:i18n:full`, `npm run audit`, `npm run seo:report`, `npm run pro:verify`, `npm run audit:dist`, and `npm run security:scan`.

## Active Pro Workstream

1. Make Paystack checkout live with a real QA paid account and webhook replay proof.
2. Keep AfroPayroll as the only Active Pro app until account-backed fixtures pass live.
3. Promote only the apps that pass real data-layer QA from Shell to Active.
4. Keep B2B revenue surfaces pointed to `/business-enquiry/` until metering, billing, or fulfillment is real.
