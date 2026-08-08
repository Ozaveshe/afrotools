# HA-05 Hausa implementation handoff

## Identity and denominator

- Branch: `codex/ha-05-telecom-money-commerce`
- Frozen base: `6edacda8437e1fa9b9e5a512138cbdd3169e38be`
- Product implementation commit: `92cfd592c442c361c7438ff048dd2bdf8927dacc`
- Assigned denominator: 12 exact English source IDs and 12 exact Hausa routes.
- Fail-closed result: 4 accepted candidates; 8 remaining pending coordinator-owned registry/reciprocal-hreflang serialization.
- No PR, merge, deploy, Supabase/live mutation, sitemap, redirect, service-worker, minified bundle, or coordinator acceptance-registry change was performed.

## Implemented routes

1. `ussd-simulator` → `/ha/kayan-aiki/gwajin-ussd/`
2. `mobile-vs-bank` → `/ha/kayan-aiki/kwatanta-mobile-money-da-banki/`
3. `telecom-data-plan` → `/ha/kayan-aiki/tsarin-data/`
4. `telecom-ussd` → `/ha/kayan-aiki/lambobin-ussd/`
5. `telecom-data-usage` → `/ha/kayan-aiki/amfani-da-data/`
6. `telecom-airtime` → `/ha/kayan-aiki/kudin-airtime/`
7. `telecom-sim-reg` → `/ha/kayan-aiki/rajistar-sim/`
8. `mobile-money-fees` → `/ha/kayan-aiki/kudin-mobile-money/`
9. `staple-basket` → `/ha/kayan-aiki/kwandon-kayan-masarrafa/`
10. `naira-to-words` → `/ha/kayan-aiki/naira-zuwa-kalmomi/`
11. `whatsapp-link` → `/ha/kayan-aiki/mahada-whatsapp/`
12. `remittance-compare` → `/ha/kayan-aiki/kwatanta-aika-kudi/`

Each route is a native Hausa form/result app with route-local self canonical, OG/schema, source/freshness/confidence/assumptions/planning limits, local-only validation and result text, dedicated artwork, dark modes, mobile reflow, reset/focus behavior and lane-owned discovery from `ha/sadarwa/index.html`. The USSD simulator states and behaves as a simulation only. Telecom prices/codes/SIM information are visibly planning-grade; dynamic source values are localized. Naira output uses Hausa number words. WhatsApp performs no automatic navigation and advertises no download. Remittance uses the committed FX source and treats its base currency as rate 1.

## Changed product and test paths

- `ha/assets/ha-05-telecom-commerce.css`
- `ha/assets/ha-05-telecom-commerce.js`
- The 12 route `index.html` files listed above
- `ha/sadarwa/index.html`
- `scripts/build-ha-05-telecom-commerce.js`
- `tests/ha/ha-05/ha-05-engine.test.js`
- `tests/ha/ha-05/ha-05-static.test.js`
- `tests/ha/ha-05/ha-05-parity.spec.js`
- `tests/ha/ha-05/playwright.config.js`
- `reports/hausa-workers/ha-05/*`

`ha/kayan-aiki/index.html` was restored exactly to the frozen base after the director collision correction. The proposed 12 central cards are in `director-patch-proposals.json` and were not applied.

## Candidate decision

Accepted candidates (4):

- `ussd-simulator`
- `telecom-ussd`
- `naira-to-words`
- `remittance-compare`

These four already have exact protected-registry ownership and reciprocal English `hreflang=ha` for the assigned route.

Remaining pending coordinator serialization (8):

- `mobile-vs-bank`
- `telecom-data-plan`
- `telecom-data-usage`
- `telecom-airtime`
- `telecom-sim-reg`
- `mobile-money-fees`
- `staple-basket`
- `whatsapp-link`

Their route-local app, browser, language, engine, privacy, accessibility, export and artwork proofs pass, but the protected registry or English source owner still names an older Hausa slug (the data-plan English source has no Hausa alternate). `build:i18n:validate` and `validate:hreflang` therefore fail closed with `HREFLANG_EQUIVALENCE_AMBIGUOUS`. Exact replacements are in `director-patch-proposals.json`.

## Verification and debt separation

- Lane engine/static tests: 22/22 passed.
- Chromium: 12/12 passed with parsed downloads for all 11 advertised exports; WhatsApp correctly advertises none.
- Hausa visible-copy audit: 0 global blockers; 11 assigned routes clean and one WhatsApp brand false positive.
- Link check: 138,335 links, no broken internal links.
- No-deletion proof: empty `git diff --diff-filter=D --summary`.
- Dedicated artwork: 12/12; missing-artwork queue empty.
- `ha:surface:check` has pre-existing unrelated stale central pages; none is an HA-05 route.
- I18n/hreflang failures are net-new visibility of the eight intentionally unedited protected-owner collisions, not route-local defects.

Machine-readable detail: `candidate-acceptance.json`, `browser-receipts.json`, `test-receipts.json`, `missing-artwork.json`, and `director-patch-proposals.json`.
