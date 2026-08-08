# Swahili Religious, Cultural and African parity lane receipt

Baseline: `6edacda8437e1fa9b9e5a512138cbdd3169e38be`. Exact denominator: **33** (19 Religious & Cultural, 14 Uniquely African). Candidate accepted: **33**. Blocked: **0**. The coordinator acceptance ledger was not edited.

## Candidate accepted IDs

`japa-calculator`, `mobile-money-fees`, `tithe-offering`, `lobola-calculator`, `lobola-negotiation-checklist`, `lobola-gift-list`, `burial-cost`, `naira-to-words`, `amount-words-ke`, `amount-words-gh`, `susu-tracker`, `whatsapp-link`, `remittance-compare`, `remittance-v2`, `brideprice-advisor`, `ajo-interest`, `market-days`, `ajo-chama-calc`, `african-proverbs`, `prayer-times`, `ramadan-timetable`, `islamic-finance`, `wedding-budget`, `naming-ceremony`, `funeral-cost`, `baby-name-generator`, `traditional-calendar`, `age-calculator-african`, `festival-calendar`, `aso-ebi-cost`, `traditional-attire`, `halal-compliance`, `islamic-calendar`

## Blocked IDs and exact reasons

None.

## Changed paths and source owners

- `assets/js/engines/relocation-budget-engine.js`
- `scripts/build-relocation-budget-parity.js`
- `assets/js/pages/relocation-budget-parity.js`
- `assets/js/components/tool-registry.js`
- `assets/js/engines/mobile-money-quote-engine.js`
- `scripts/build-mobile-money-quote-parity.js`
- `assets/js/pages/mobile-money-quote-parity.js`
- `data/fintech/official-sources.json`
- `assets/js/engines/religious-cultural-parity.js`
- `scripts/build-sw-religious-cultural-parity.js`
- `assets/js/pages/sw-religious-cultural-parity.js`
- `assets/js/engines/funeral-budget-engine.js`
- `scripts/build-funeral-budget-parity.js`
- `assets/js/pages/funeral-budget-parity.js`
- `engines/src/uniquely-african-engine.js`
- `scripts/generate-sw-uniquely-african-parity.js`
- `assets/js/pages/sw-uniquely-african-parity.js`
- `engines/src/remittance-quote-comparator-engine.js`
- `scripts/build-remittance-quote-parity.js`
- `assets/js/pages/remittance-quote-parity.js`
- `assets/js/engines/marriage-conversation-engine.js`
- `scripts/build-marriage-conversation-parity.js`
- `assets/js/pages/marriage-conversation-parity.js`
- `assets/js/engines/prayer-times.js`
- `scripts/enhance-religious-cultural-section.js`
- `data/localization/prayer-times-source-fixtures.json`
- Native pages: all 19 assigned religious routes and all 14 assigned African routes listed in the machine receipt.
- Discovery: `sw/dini-na-utamaduni/index.html` and `sw/zana-za-kipekee-afrika/index.html`.
- English parity: prayer/Ramadan, remittance, mobile-money, funeral-budget, relocation-budget and marriage-conversation owners use the same DOM-free engines as their Swahili counterparts. No other locale UI/copy changed.
- Proof: `tests/sw-religious-cultural-african-lane.test.js`, `tests/e2e/sw-religious-cultural-african-lane.spec.js`, the machine receipt and the artwork queue.

Religious and cultural copy states the authority boundary and avoids declaring obligations, authenticity, official dates or prices. Prayer results are offline astronomical planning estimates with local-mosque and moon-sighting boundaries. Remittance and mobile-money compare only timestamped user-entered receipts; funeral and relocation planning use only user-confirmed values. The marriage-family workflow replaces unsourced cultural price averages with voluntary-consent boundaries and a user-agreed budget.

## Browser, export, privacy and artwork proof

Chromium ran with one worker on an isolated port at 320px, 375px and emulated 200% reflow, plus light/dark themes, keyboard focus, invalid/reset clearing, page/console errors and request inspection. Every advertised downloadable JSON/TXT file was downloaded and parsed or reopened; copy payloads were read back and print actions were invoked. The synthetic privacy sentinel produced zero raw-input network leaks and no AI request. Dedicated artwork is present for all 33 assigned rows; the missing-artwork queue is empty.

## Evidence and commands

- PASS — focused Node suite (7/7 lane tests plus remittance, mobile-money, funeral, relocation and marriage engine oracles, and all 22 preserved French fixtures).
- PASS — all focused source-owner generator check modes.
- PASS — focused Chromium lane spec on isolated port 4332, one worker (33-route matrix, invalid/reset, parsed exports and English shared-engine parity; 8/8).
- PASS — privacy/AI consent tests on isolated port 4328 (3/3); the first default-port attempt failed only with `ERR_CONNECTION_REFUSED`.
- PASS — `npm run validate:hreflang`, `npm run check-links`, `npm run audit`, `npm run type-check`, `npm run lint`, and `git diff --check`.
- FAIL-CLOSED AT PROHIBITED INTEGRATION BOUNDARY — `npm run build:i18n:validate` reports only the three coordinator-owned locale coverage artifacts as stale; this lane did not regenerate them.
- CARRIED BASELINE DEBT — `npm run audit` remains successful but reports the same two registry rows without pages.

The required reference `.claude/rules/i18n.md` was absent at the baseline; AGENTS.md, the Swahili strategy and coordinator skill governed the lane.
