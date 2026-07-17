# Scholarship Deadline Trust PR Hygiene

Generated: 2026-05-21

## Verdict

Ready with minor non-blocking caveats.

The scholarship deadline trust test is now in the normal `npm test` protection path, `npm test` passes, `npm run build` passes, and the Scholarship Finder browser smoke still renders the deadline trust UI without console errors or horizontal overflow.

## Package.json Resolution

- `package.json` was already modified before this hygiene pass.
- The existing checkout change added `tests/study-abroad-conversion-layer.test.js` to the normal `npm test` chain.
- This pass preserved that existing change and added `tests/scholarship-deadline-trust.test.js` before `tests/tool-verification.test.js`.
- `package-lock.json` was not changed.
- No unrelated package metadata, dependency, or script changes were overwritten.

Current normal test tail:

```text
node tests/study-abroad-data-trust.test.js &&
node tests/study-abroad-fx-policy.test.js &&
node tests/study-abroad-confidence-gate.test.js &&
node tests/study-abroad-conversion-layer.test.js &&
node tests/scholarship-deadline-trust.test.js &&
node tests/tool-verification.test.js
```

## Generated Deadline Artifacts

Regenerated with:

```text
node scripts/generate-scholarship-deadline-enrichment-priority.js
```

Outputs:

- `audit-results/scholarship-deadline-quality-audit.md`
- `audit-results/scholarship-deadline-enrichment-priority.csv`
- `audit-results/scholarship-deadline-enrichment-priority.json`

Current generated counts:

- Active scholarships: 120
- Real structured `deadline_date`: 1
- Deadline unclear: 110
- Month-only / annual text only: 9
- Source URL present: 120
- Last checked date present: 120
- Verified deadline confidence: 1
- Inferred deadline confidence: 9
- Unclear deadline confidence: 110

These artifacts are safe to include in this product PR if audit artifacts are accepted for the branch. They do not invent deadlines.

## Validation Results

| Check | Result | Notes |
| --- | --- | --- |
| `node --check tools/scholarship-finder/scholarship-deadline-trust.js` | Pass | Syntax clean. |
| `node --check scripts/generate-scholarship-deadline-enrichment-priority.js` | Pass | Syntax clean. |
| `node --check tests/scholarship-deadline-trust.test.js` | Pass | Syntax clean. |
| `node tests/scholarship-deadline-trust.test.js` | Pass | `Scholarship deadline trust model verified.` |
| Scholarship API smoke | Pass | API returned 200, `mode: live`, `total: 120`. |
| `npm test` | Pass | Normal suite now runs the scholarship deadline trust test. |
| `npm run build` | Pass | Full static build completed. Existing automation-registry warnings remain unrelated. |
| Browser smoke, 390x844 | Pass | Context banner, apply checklist, deadline trust rows, report modal, no console errors, no horizontal overflow. |
| Browser smoke, 1365x900 | Pass | Same as mobile. |

Browser smoke screenshots:

- `audit-results/scholarship-deadline-trust-mobile.png`
- `audit-results/scholarship-deadline-trust-desktop.png`

Headless localhost reported blocked Google Analytics beacon requests. Those were external analytics transport failures only and did not create product console errors.

## Deadline Trust Checks

- Unclear deadlines still display as unclear.
- Unclear deadlines are not shown as urgent.
- Exact future `deadline_date` values can calculate urgency and days-left labels.
- Month-only / annual-cycle records do not calculate exact days left.
- Deadline report actions store locally and do not imply a live review queue.
- No scholarship deadline values were invented or updated in this hygiene pass.

## Supabase Advisory Handling

Unrelated advisory documented only:

```text
RLS disabled on public.spatial_ref_sys
```

This was not fixed in this PR because it is a PostGIS/system-table advisory, is unrelated to Scholarship Finder deadline trust, and there is no approved Supabase security policy for changing it as part of this product PR.

## Merge Recommendation

Mergeable after normal reviewer inspection of the scoped Scholarship Finder files and generated audit artifacts.

Residual caveats:

- Scholarship data remains deadline-weak for paid ads: 110 of 120 active records still have unclear deadline confidence.
- The Supabase `public.spatial_ref_sys` advisory should stay in the security backlog unless an approved PostGIS policy says otherwise.
