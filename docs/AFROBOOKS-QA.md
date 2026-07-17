# AfroBooks QA Fixture

Updated: 2026-05-10

## Purpose

`scripts/afrobooks-qa-fixture.js` creates a repeatable AfroBooks controller baseline before deeper finance workspace work. The default run is a dry-run plan. No account records are written unless a safe QA user, a fixture tag, and explicit confirmation are provided.

Use this for `/pro/apps/books/` validation while AfroBooks moves toward a serious Pro finance workspace.

## Safety Rules

- Default mode is dry-run.
- No live writes run unless `AFROBOOKS_QA_CONFIRM=1` and `--live` are both present.
- Live writes require `AFROBOOKS_QA_TAG` or `--tag` so cleanup can target only the fixture.
- Live writes require `AFROBOOKS_QA_EMAIL` with a clear QA, test, fixture, sandbox, or `example.com` identity.
- Live writes require `AFROBOOKS_QA_ACCESS_TOKEN` for the signed-in QA user.
- Live writes require a publishable key through `SUPABASE_AUTH_ANON_KEY`, `SUPABASE_ANON_KEY`, or `SUPABASE_PUBLISHABLE_KEY`.
- Cleanup refuses to run without an explicit fixture tag.
- Cleanup deletes only records whose fixture tag matches the requested tag.
- If AfroBooks account records are not available yet, the script reports the planned objects only.
- The fixture uses only fake business, customer, vendor, invoice, payment, expense, payroll, close pack, Accountant packet, and audit/export content.

## Product Truth Baseline

Works on this device:

- `/pro/apps/books/` exists and is Pro-gated.
- The workspace has a cashflow snapshot, invoice batch, expenses, payroll journal imports, Draft report labels, receivables/payables, Accountant packet manifests, currency view, CSV import, and local export behavior.
- The device save key is `afrobooks_finance_os_demo_v1`.
- The workspace reads saved payroll signals from `afropayroll_pro_saved_runs` and `afropayroll_pro_workspace_preview`.
- If the Seller app key `afroseller_social_commerce_os_v1` exists in the repo route, the fixture plans a Seller daily close journal as a draft finance handoff.

Save to account:

- The route includes Save to account, Pull from account, and Create account workspace controls.
- Live inspection on 2026-05-10 found Payroll and Seller account record sets, but no AfroBooks account record set yet.
- A live fixture should stay in planned-only mode until AfroBooks account records exist and a safe signed-in QA user is configured.

Not implemented:

- Bank sync.
- Live accounting integration.
- Tax filing.
- Tax remittance.
- Verified bank balance.
- Automatic payment settlement.
- Account-backed close history.
- Account-backed AfroBooks import/export history until the account record set exists and is tested.

Must not be claimed:

- Bank-connected balances.
- Submitted tax returns.
- Remitted tax.
- Verified payment settlement.
- Live accounting system posting.
- Account save success unless signed-in rows were inserted and verified.

## Planned Fixture Objects

The dry-run plan covers:

- Fake business/client.
- Fake business entity.
- Fake customer and vendor.
- Fake invoice.
- Fake invoice lines.
- Fake payment record.
- Fake expense record.
- Fake receipt note record.
- Fake payroll journal.
- Fake Seller daily close journal when the Seller device save key exists.
- Fake payroll import record.
- Fake Draft report.
- Fake close pack.
- Fake Accountant packet.
- Fake currency view record.
- Fake audit/export records.

## Commands

Dry-run plan:

```powershell
npm run afrobooks:qa -- --dry-run
```

Dry-run cleanup plan for a known tag:

```powershell
npm run afrobooks:qa -- --cleanup --tag=qa_books_YYYYMMDDHHMMSS_xxxxxx --dry-run
```

Live fixture smoke, only after a safe QA user is selected and the account record set exists:

```powershell
$env:AFROBOOKS_QA_CONFIRM = "1"
$env:AFROBOOKS_QA_TAG = "qa_books_20260510_safe_smoke"
$env:AFROBOOKS_QA_EMAIL = "qa.books+safe-smoke@example.com"
$env:AFROBOOKS_QA_USER_ID = "<safe QA auth user id>"
$env:AFROBOOKS_QA_ACCESS_TOKEN = "<signed-in QA user access token>"
$env:SUPABASE_AUTH_ANON_KEY = "<publishable anon key>"
npm run afrobooks:qa -- --live
```

Live cleanup for the exact fixture tag:

```powershell
$env:AFROBOOKS_QA_CONFIRM = "1"
$env:AFROBOOKS_QA_TAG = "qa_books_20260510_safe_smoke"
$env:AFROBOOKS_QA_EMAIL = "qa.books+safe-smoke@example.com"
$env:AFROBOOKS_QA_USER_ID = "<safe QA auth user id>"
$env:AFROBOOKS_QA_ACCESS_TOKEN = "<signed-in QA user access token>"
$env:SUPABASE_AUTH_ANON_KEY = "<publishable anon key>"
npm run afrobooks:qa -- --cleanup --live
```

## Validation

Run these checks after AfroBooks fixture or controller changes:

```powershell
node --check scripts/afrobooks-qa-fixture.js
node --check scripts/verify-afrobooks-pro.js
npm run pro:verify
npm run audit
npm run check-links
git diff --check -- scripts/afrobooks-qa-fixture.js scripts/verify-afrobooks-pro.js docs/AFROBOOKS-QA.md docs/AFROBOOKS-FINANCE-OS-BRIEF.md package.json
```

## Live Inspection Note

Live project inspection was used for this baseline. Keep live project facts separate from repo edits:

- Live fact on 2026-05-10: AfroBooks account records were not present.
- Repo change: the fixture and docs now plan safe AfroBooks records without claiming that account save exists.
- Live data inserted: none for this baseline.
