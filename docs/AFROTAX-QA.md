# AfroTax QA Fixture

Updated: 2026-05-10

## Purpose

`scripts/afrotax-qa-fixture.js` creates the first safe AfroTax Compliance OS controller baseline before deeper product work. The default run is a dry-run plan. No account records are written unless a safe QA user, a fixture tag, and explicit confirmation are provided.

Use this for `/pro/apps/tax-compliance/` validation while AfroTax moves toward a serious Pro tax calendar, Evidence pack, Source review, Review checklist, and Accountant handoff workspace.

## Safety Rules

- Default mode is dry-run.
- No live writes run unless `AFROTAX_QA_CONFIRM=1` and `--live` are both present.
- Live writes require `AFROTAX_QA_TAG` or `--tag` so cleanup can target only the fixture.
- Live writes require `AFROTAX_QA_EMAIL` with a clear QA, test, fixture, sandbox, or `example.com` identity.
- Live writes require `AFROTAX_QA_ACCESS_TOKEN` for the signed-in QA user.
- Live writes require a publishable key through `SUPABASE_AUTH_ANON_KEY`, `SUPABASE_ANON_KEY`, or `SUPABASE_PUBLISHABLE_KEY`.
- Cleanup refuses to run without an explicit fixture tag.
- Cleanup deletes only records whose fixture tag matches the requested tag.
- If AfroTax account records are not available yet, the script reports the planned objects only.
- The fixture uses only fake client, company, team member, country lane, obligation, deadline, workflow item, Evidence pack, evidence document metadata, Source review, Review checklist, review comment, cross-app import, export packet, and audit event content.

## Product Truth Baseline

Works on this device:

- `/pro/apps/tax-compliance/` exists and is Pro-gated.
- The workspace shows Tax calendar, country lanes, deadline queue, Evidence pack, Source review, Review checklist, and Accountant handoff areas.
- The device save key is `afrotax_compliance_os_demo_v1`.
- The workspace reads Payroll source signals from `afropayroll_pro_saved_runs` and `afropayroll_pro_workspace_preview`.
- Export packets are draft review packets only.

Reads from Payroll and Books today:

- Payroll saved runs and Payroll workspace preview are source signals only.
- AfroBooks close packs, tax review summaries, VAT or sales review rows, expense categories, payroll journal imports, Accountant packet manifests, and Seller daily close summaries through Books can be imported manually as review data when present.
- AfroSeller daily close summaries should reach AfroTax through AfroBooks, not through a direct Seller-to-Tax claim.

Not built:

- Account-backed AfroTax records.
- Verified live deadline or rate refresh.
- Live source review queue.
- Accountant team review.
- Filing workflow.
- Tax remittance workflow.
- Salary fund movement.
- Official compliance confirmation.

Must not be claimed:

- Filed returns.
- Remitted tax.
- Moved salary funds.
- Official compliance confirmation.
- Verified current rates.
- Production-ready source dates or sample deadlines without a fresh source review.

## Planned Fixture Objects

The dry-run plan covers:

- Fake client.
- Fake company profile.
- Fake country lanes for Nigeria, Kenya, South Africa, and Senegal.
- Fake obligations for PAYE, VAT, payroll tax, and contribution review.
- Fake deadlines with explicit verification notes.
- Fake Evidence packs.
- Fake Source reviews.
- Fake Review checklist items.
- Fake review comments.
- Fake Accountant handoff export packets.
- Fake audit events.

## Commands

Dry-run plan:

```powershell
npm run afrotax:qa -- --dry-run
```

Dry-run cleanup plan for a known tag:

```powershell
npm run afrotax:qa -- --cleanup --tag=qa_tax_YYYYMMDDHHMMSS_xxxxxx --dry-run
```

Live fixture smoke, only after a safe QA user is selected and account records exist:

```powershell
$env:AFROTAX_QA_CONFIRM = "1"
$env:AFROTAX_QA_TAG = "qa_tax_20260510_safe_smoke"
$env:AFROTAX_QA_EMAIL = "qa.tax+safe-smoke@example.com"
$env:AFROTAX_QA_USER_ID = "<safe QA auth user id>"
$env:AFROTAX_QA_ACCESS_TOKEN = "<signed-in QA user access token>"
$env:SUPABASE_AUTH_ANON_KEY = "<publishable anon key>"
npm run afrotax:qa -- --live
```

Live cleanup for the exact fixture tag:

```powershell
$env:AFROTAX_QA_CONFIRM = "1"
$env:AFROTAX_QA_TAG = "qa_tax_20260510_safe_smoke"
$env:AFROTAX_QA_EMAIL = "qa.tax+safe-smoke@example.com"
$env:AFROTAX_QA_USER_ID = "<safe QA auth user id>"
$env:AFROTAX_QA_ACCESS_TOKEN = "<signed-in QA user access token>"
$env:SUPABASE_AUTH_ANON_KEY = "<publishable anon key>"
npm run afrotax:qa -- --cleanup --live
```

## Validation

Run these checks after AfroTax fixture or controller changes:

```powershell
node --check scripts/afrotax-qa-fixture.js
node --check scripts/verify-afrotax-pro.js
npm run afrotax:verify
npm run pro:verify
npm run audit
npm run check-links
git diff --check -- scripts/afrotax-qa-fixture.js scripts/verify-afrotax-pro.js docs/AFROTAX-QA.md docs/AFROTAX-COMPLIANCE-OS-BRIEF.md package.json pro/apps/tax-compliance/index.html
```

## Live Inspection Note

Live project inspection was not used for this baseline. The fixture was built to remain dry-run by default and to stay planned-only when account records are unavailable.

- Live project inspected: no.
- Live data inserted: no.
- Repo change: the fixture and docs now describe safe planned AfroTax records without claiming account save exists.
