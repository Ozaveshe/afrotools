# Operator dashboard

The local operator entry point is `/mc-7a2f9x.html`. The Codex launcher links to it.
The previous console is preserved at `/admin/legacy-operations.html` for existing
50K, Matchday and page-review workflows. Its device storage keys are unchanged;
use the new dashboard for provenance-aware metrics.

Both HTML surfaces and all `admin/` assets are excluded by the existing
`scripts/build-dist.js` policy. Noindex and a hidden route provide no access
control. Do not add secrets, private account records or provider credentials to
these files. The new dashboard makes no live Supabase, billing or analytics calls.

## Refresh

Run the relevant source-owner commands displayed in the evidence table, review
their results, then run:

```powershell
node scripts/build-operator-dashboard.js
```

For a separate image-audit checkout awaiting integration:

```powershell
node scripts/build-operator-dashboard.js --image-root C:/path/to/image-audit/afrotools
```

The optional image root only supplies `data/image-generation/image-library.json`
and `data/image-generation/next-200.json`. The builder does not edit those owners.
The generated snapshot retains their hashes, source dates and available audit
commit. Asset and reference-image presence is checked against the dashboard
checkout. Missing assets are labeled absent rather than rendered as broken images.
After the image changes are integrated, rebuild without the option.

Serve the checkout with `node tests/support/static-server.js` and open
`http://127.0.0.1:4173/mc-7a2f9x.html`. Use the same origin to retain device state.

## Evidence contract

- Registry metrics keep canonical records, expanded English experiences, widgets
  and published locales distinct. They reflect the committed registry report.
- Quality grades and calculation fixtures retain their original audit dates.
  These snapshots do not establish browser health or current calculation truth.
- Locale rows distinguish native pages, shells, fallbacks and unavailable pages.
- Source review status uses `lastReviewedAt` and `reviewCadenceDays` at snapshot
  time. Recorded freshness labels do not override an overdue review date.
- Pro readiness values are authored product definitions. Recorded gate results
  retain their audit date. Neither proves current account backing or billing.
- Image placements are static reference evidence, including pipeline references.
  They do not establish visual quality or prove a browser displayed an image.
- Generation tasks follow the owner's `order`, then descending priority.
  Planned locale reuse requires review of the generated image before approval.
- Revenue, users, subscriptions, provider health and deployment state are
  unavailable. Snapshot generation is not a build/test/deploy pass.

Device task progress uses `afrotools-operator-image-progress-v1`. It is an
operator note, separate from canonical generation/audit status. Export filtered
CSV to retain those notes; CSV includes `device_task_progress`. It does not write
to the image ledger, Supabase or a generation service. Spreadsheet formula
prefixes are neutralized. Storage failures are visible and export still works.

## Validation

```powershell
node --test tests/operator-dashboard.test.js
npx playwright test tests/e2e/operator-dashboard.spec.js --project=chromium --workers=1
git diff --check
```

The browser tests cover desktop/390px overflow, keyboard flow, filtering,
download contents, local task progress, unsafe data and missing snapshots.
Existing legacy workflows are preserved, not re-certified by these tests.

## September 8 implementation evidence

Base: `9b29eab0408eedd9442c98c2cabf567098da80ab`, branch
`codex/operator-dashboard-20260908`. The parent image checkout is separately
based on preserved `ba111af2`; those histories diverge. No broad merge was made.
The parent image manifests were consumed read-only into the excluded admin
snapshot. Their image changes remain coordinator-owned integration work.

Passed: two Node contracts, four Playwright tests, focused repository lint and
type checks, and a desktop axe WCAG A/AA scan with zero reported violations.
Desktop/390px screenshots were inspected; console errors were absent in the
populated dashboard check. No live provider, database, revenue or deployment
verification was attempted. Full build/deploy/security gates were not run:
these changes are confined to existing excluded operator surfaces, with no
publish policy, public route, function or release change.
