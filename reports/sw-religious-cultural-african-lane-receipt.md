# Swahili Religious, Cultural and African parity lane receipt

Baseline: `6edacda8437e1fa9b9e5a512138cbdd3169e38be`. Exact denominator: **33** (19 Religious & Cultural, 14 Uniquely African). Candidate accepted: **27**. Blocked: **6**. The coordinator acceptance ledger was not edited.

## Candidate accepted IDs

`tithe-offering`, `lobola-calculator`, `lobola-negotiation-checklist`, `lobola-gift-list`, `naira-to-words`, `amount-words-ke`, `amount-words-gh`, `susu-tracker`, `whatsapp-link`, `ajo-interest`, `market-days`, `ajo-chama-calc`, `african-proverbs`, `prayer-times`, `ramadan-timetable`, `islamic-finance`, `wedding-budget`, `naming-ceremony`, `funeral-cost`, `baby-name-generator`, `traditional-calendar`, `age-calculator-african`, `festival-calendar`, `aso-ebi-cost`, `traditional-attire`, `halal-compliance`, `islamic-calendar`

## Blocked IDs and exact reasons

- `japa-calculator`: The English owner embeds changing visa, travel and relocation price assumptions without a current reviewed source contract.
- `mobile-money-fees`: The result depends on provider fee tables whose freshness and authoritative source contract are not established in this lane.
- `burial-cost`: The owner combines country price assumptions with a route-specific runtime wrapper; no safe locale-neutral price source was proved.
- `remittance-compare`: Provider availability, fees and exchange-rate semantics are changeable and lack a reviewed current source contract.
- `remittance-v2`: Provider availability, fees and exchange-rate semantics are changeable and lack a reviewed current source contract.
- `brideprice-advisor`: The owner presents culturally sensitive price guidance without a defensible locale-neutral source or formula contract.

## Changed paths and source owners

- `assets/js/engines/religious-cultural-parity.js`
- `scripts/build-sw-religious-cultural-parity.js`
- `assets/js/pages/sw-religious-cultural-parity.js`
- `engines/src/uniquely-african-engine.js`
- `scripts/generate-sw-uniquely-african-parity.js`
- `assets/js/pages/sw-uniquely-african-parity.js`
- `assets/js/engines/prayer-times.js`
- `scripts/enhance-religious-cultural-section.js`
- `data/localization/prayer-times-source-fixtures.json`
- Native pages: the 19 accepted religious routes and eight accepted African routes listed in the machine receipt.
- Discovery: `sw/dini-na-utamaduni/index.html` and `sw/zana-za-kipekee-afrika/index.html`.
- English parity: `tools/prayer-times/index.html`, `tools/ramadan-timetable/index.html`, and the shared English runtime owner use the same date-aware engine. No other locale UI/copy changed.
- Proof: `tests/sw-religious-cultural-african-lane.test.js`, `tests/e2e/sw-religious-cultural-african-lane.spec.js`, the machine receipt and the artwork queue.

Religious and cultural copy states the authority boundary and avoids declaring obligations, authenticity, official dates or prices. Prayer results are offline astronomical planning estimates with local-mosque and moon-sighting boundaries. African number-word, group-contribution, WhatsApp, interest, market-day and Ajo/Chama workflows preserve their English calculations in the shared DOM-free engine. Changing provider, travel, remittance and cultural-price claims remain blocked.

## Browser, export, privacy and artwork proof

Chromium ran with one worker on an isolated port at 320px, 375px and emulated 200% reflow, plus light/dark themes, keyboard focus, invalid/reset clearing, page/console errors and request inspection. Every advertised downloadable JSON/TXT file was downloaded and parsed or reopened; copy payloads were read back and print actions were invoked. The synthetic privacy sentinel produced zero raw-input network leaks and no AI request. Dedicated artwork is present for all 33 assigned rows; the missing-artwork queue is empty.

## Evidence and commands

- PASS — focused Node suite (7/7 lane tests plus all 22 preserved French fixtures).
- PASS — Swahili and French generator check modes; date-aware source fixtures cover daily prayer and 30-day Ramadan outputs.
- PASS — focused Chromium lane spec on isolated ports, one worker (27-route matrix, invalid/reset, and English parity; 3/3).
- PASS — privacy/AI consent tests (3/3).
- PASS — `npm run validate:hreflang`, `npm run check-links`, `npm run audit`, `npm run type-check`, `npm run lint`, and `git diff --check`.
- FAIL-CLOSED AT PROHIBITED INTEGRATION BOUNDARY — `npm run build:i18n:validate` reports only the three coordinator-owned locale coverage artifacts as stale; this lane did not regenerate them.
- CARRIED BASELINE DEBT — `npm run audit` remains successful but reports the same two registry rows without pages.

The required reference `.claude/rules/i18n.md` was absent at the baseline; AGENTS.md, the Swahili strategy and coordinator skill governed the lane.
