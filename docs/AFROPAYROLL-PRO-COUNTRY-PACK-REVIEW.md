# AfroPayroll Pro Country Pack Review

This workflow keeps country-pack support operational without pretending AfroPayroll files returns, remits deductions, pays salaries, or certifies compliance.

## Source Rules

- Use official or primary sources only for laws, rates, ceilings, thresholds, filing dates, and contribution rules.
- Do not change statutory rates or effective dates without checking the official source in the same pass.
- Keep source URLs in `data/hr/afropayroll-country-packs.js`.
- Keep South Africa’s SARS engine-sync warning until the tax-year source set and local engine are reviewed together.
- Review packs are evidence and checklist outputs. They are not filing-ready compliance.

## Workflow States

- `current`: source review is inside the review window.
- `review_due_soon`: next source review is due within 45 days.
- `review_overdue`: next source review date has passed.
- `source_changed`: a reviewer has flagged source movement that needs official-source confirmation.
- `engine_sync_needed`: country-pack facts and local calculation engine need explicit sync review.
- `next_pack_candidate`: source and metadata coverage are promising, but the country is not a full pack.

## Reviewer Checklist

Before moving a country toward full-pack confidence or changing statutory facts, confirm:

- Official source checked.
- Rates reviewed.
- Deductions reviewed.
- Effective date confirmed.
- Warning text reviewed.
- Engine test needed or completed.

## How To Update A Pack

1. Open the Pro-gated support console at `/tools/afropayroll-os/support`.
2. Export `Country pack review CSV` and `Next review queue CSV`.
3. Identify countries in review due soon, review overdue, source changed, engine sync needed, or next pack candidate states.
4. Verify official sources before editing `data/hr/afropayroll-country-packs.js`.
5. Update only the canonical pack data. Do not create another country-pack file.
6. If engine behavior changes, test the matching local engine and keep warning text honest.
7. Run the AfroPayroll verifier and audit commands before handoff.

## Current Maintenance Notes

- Nigeria, Kenya, Ghana, and South Africa are full-pack launch countries with statutory calendar metadata and official source links.
- South Africa remains `engine_sync_needed` until SARS tax-year data and the local PAYE engine are reviewed together.
- Estimate and next-pack countries should stay out of filing-ready language until deductions, source coverage, engine behavior, and local payroll terminology are reviewed.

## Validation

```bash
node --check data/hr/afropayroll-country-packs.js
node --check assets/js/lib/afropayroll-country-packs.js
node --check scripts/verify-afropayroll-pro-architecture.js
npm run pro:verify
npm run audit
```
