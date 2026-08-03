# Swahili PAYE 26-route completion evidence

Date: 2026-07-31

Branch: `codex/sw-paye-26-completion-20260731`

Baseline: `c2cc2dd9fae286f17289255a7ac0f0c5b0c3ba4d`

## Acceptance

- Accepted: 23/26
- Blocked: 3/26
- Deleted files: 0
- English calculation/formula owner changes: 0
- Master ledger, sitemap, `dist/`, merge and deployment changes: 0

Accepted IDs:

`ao-paye`, `bw-paye`, `bf-paye`, `cm-paye`, `cf-paye`, `td-paye`, `ci-paye`, `eg-paye`, `gq-paye`, `sz-paye`, `et-paye`, `ga-paye`, `gn-paye`, `ls-paye`, `mw-paye`, `ml-paye`, `mu-paye`, `ne-paye`, `sn-paye`, `sc-paye`, `tz-paye`, `zm-paye`, `zw-paye`

Blocked IDs:

`bi-paye`, `rw-paye`, `ug-paye`

## Completed product proof

- The 26 source-owned Swahili pages no longer declare English fallback metadata, notices or explicit fallback spans.
- Known residual English UI, help, source, validation, report, share and AI strings were translated through `scripts/finish-sw-paye-26-parity.js`.
- Exact English calculation-function hashes are frozen in `data/localization/sw-paye-26-parity.json`.
- Every route has a valid input oracle and an invalid zero-input oracle.
- Every advertised local report is reopened, rendered as a real PDF and parsed.
- AI consent remains fail closed: decline produces zero requests and acceptance produces one mocked request.
- Browser proof covers 320px, 375px, 200% reflow, light, dark and system preference, keyboard focus, accessible names, console errors, local resource failures, privacy and unexpected network writes.
- Canonical, artwork and reciprocal English/Swahili hreflang are verified.

## Honest blockers

The coordinator instruction prohibited calculation/formula changes. Three pre-existing Swahili engines do not reproduce their current English owners:

- `bi-paye`: The English owner uses separate capped pension and occupational-risk bases; the Swahili owner still uses the older uncapped 4% and 6% model.
- `rw-paye`: The English owner uses the current 2025/26 four-band table and 6% RSSB contribution; the Swahili owner still uses the older three-band table and 5% contribution.
- `ug-paye`: The Swahili owner deducts NSSF before PAYE and adds a generic LST amount; the English owner taxes gross pay and applies the district LST basis separately.

These three remain blocked in the acceptance ledger. Their current Swahili outputs are recorded in `reports/swahili-paye-26-blocked.json` so later engine migration cannot be accepted by implication.

## Source ownership

- `scripts/finish-sw-paye-26-parity.js` owns the exact 26-route language cleanup.
- `scripts/record-sw-paye-26-acceptance.js` owns the exact 23 accepted / 3 blocked ledger result and receipt.
- `tests/swahili-paye-26-parity.test.js` freezes English and Swahili calculation-function hashes, runtime-language boundaries and reciprocal metadata.
- `tests/e2e/swahili-paye-local-exports-vip.spec.js` owns route-specific browser, export, AI-consent, privacy, reflow and accessibility proof.

## Validation

- Final serial Chromium matrix: 26/26 passed with one worker.
- Three focused PAYE contract/export tests: 3/3 passed.
- `npm run lint`: passed, 47 JavaScript files checked.
- `npm run type-check`: passed.
- `npm run salary-tax:verify`: passed.
- `node tests/ai-intent-router.test.js`: passed, 31 deterministic samples plus API guardrails.
- `node tests/localization-platform.test.js`: passed.
- `node scripts/build-localization-platform.js --check`: passed, 10,803 public pages.
- `npm run build:i18n:validate`: passed for French, Swahili, Yoruba and Hausa catalogs.
- `npm run validate:hreflang`: passed for 10,803 pages, 30,768 relationships and 5,276 equivalence groups.
- `git diff --check`: passed.
