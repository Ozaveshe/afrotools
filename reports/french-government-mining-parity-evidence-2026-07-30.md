# French Government and Mining parity evidence

Date: 2026-07-30
Combined release HEAD at closeout: `3f69dc10985acdc703e8b361f157cccd473d1170`

## Acceptance

- Government & Civic: **15/15 applications accepted**, plus the French hub.
- Mining & Extractives: **6/6 applications accepted**, plus the French hub.
- Remaining routes in this evidence scope: **0/21**.

Route presence alone was not used as acceptance. The focused contracts verify
native French ownership, frozen/shared calculation behavior, invalid-state
handling, local exports and reopen behavior, privacy boundaries, reciprocal
locale metadata, artwork, mobile reflow, themes, keyboard behavior, and console
health.

## Government proof

- `node tests/government-parity-engine.test.js` — PASS.
- `node tests/fr-government-parity.test.js` — PASS, exact 15/15 contract.
- Isolated Chromium on port `43341`, one worker:
  `npx playwright test tests/e2e/fr-government-parity.spec.js --project=chromium --workers=1`
  — PASS, **16/16**.

The first browser run passed all 15 application workflows but exposed white
Government cards under manual dark mode. The scoped
`assets/css/fr-government-parity.css` correction now gives cards and muted card
copy explicit accessible dark surfaces in both manual and system dark modes.
The complete 16-test suite then passed.

## Mining proof

- `node --test tests/fr-mining-parity.test.js` — PASS, **4/4** static suites
  across all six applications.
- Isolated Chromium on port `43342`, one worker:
  `npx playwright test tests/e2e/fr-mining-parity.spec.js --project=chromium --workers=1`
  — PASS, **7/7**.

The Mining browser suite compared every English/French calculation oracle,
tested invalid clearing, reopened local exports including parsed PDFs, checked
320px and 375px layouts and 200% reflow, exercised light/manual/system dark
modes, and verified the exact six-app hub.

## Process and scope hygiene

- No listener remained on ports `43341` or `43342` after the runs.
- No tracked file was deleted.
- No registry, acceptance ledger, sitemap, other locale, deployment, or live
  backend change is included.
