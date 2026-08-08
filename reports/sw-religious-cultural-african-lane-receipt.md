# Swahili Religious, Cultural and African parity lane receipt

Baseline: `6edacda8437e1fa9b9e5a512138cbdd3169e38be`. Exact denominator: **33** (19 Religious & Cultural, 14 Uniquely African). Candidate accepted: **25**. Blocked: **8**. The coordinator acceptance ledger was not edited.

## Candidate accepted IDs

`tithe-offering`, `lobola-calculator`, `lobola-negotiation-checklist`, `lobola-gift-list`, `naira-to-words`, `amount-words-ke`, `amount-words-gh`, `susu-tracker`, `whatsapp-link`, `ajo-interest`, `market-days`, `ajo-chama-calc`, `african-proverbs`, `islamic-finance`, `wedding-budget`, `naming-ceremony`, `funeral-cost`, `baby-name-generator`, `traditional-calendar`, `age-calculator-african`, `festival-calendar`, `aso-ebi-cost`, `traditional-attire`, `halal-compliance`, `islamic-calendar`

## Blocked IDs and exact reasons

- `japa-calculator`: The English owner embeds changing visa, travel and relocation price assumptions without a current reviewed source contract.
- `mobile-money-fees`: The result depends on provider fee tables whose freshness and authoritative source contract are not established in this lane.
- `burial-cost`: The owner combines country price assumptions with a route-specific runtime wrapper; no safe locale-neutral price source was proved.
- `remittance-compare`: Provider availability, fees and exchange-rate semantics are changeable and lack a reviewed current source contract.
- `remittance-v2`: Provider availability, fees and exchange-rate semantics are changeable and lack a reviewed current source contract.
- `brideprice-advisor`: The owner presents culturally sensitive price guidance without a defensible locale-neutral source or formula contract.
- `prayer-times`: The shared city presets are fixed clock values and do not calculate the selected date; publishing them as date-aware prayer times would be unsafe.
- `ramadan-timetable`: The shared workflow repeats user-entered clock values rather than calculating each selected date; it cannot safely claim a Ramadan timetable.

## Changed paths and source owners

- `assets/js/engines/religious-cultural-parity.js`
- `scripts/build-sw-religious-cultural-parity.js`
- `assets/js/pages/sw-religious-cultural-parity.js`
- `engines/src/uniquely-african-engine.js`
- `scripts/generate-sw-uniquely-african-parity.js`
- `assets/js/pages/sw-uniquely-african-parity.js`
- Native pages: the 17 accepted religious routes and eight accepted African routes listed in the machine receipt.
- Discovery: `sw/dini-na-utamaduni/index.html` and `sw/zana-za-kipekee-afrika/index.html`.
- Reciprocal Swahili metadata only: three English religious owners, three English African owners, six French counterparts and two Hausa counterparts. No French or Hausa UI/copy changed.
- Proof: `tests/sw-religious-cultural-african-lane.test.js`, `tests/e2e/sw-religious-cultural-african-lane.spec.js`, the machine receipt and the artwork queue.

Religious and cultural copy states the authority boundary and avoids declaring obligations, authenticity, official dates or prices. African number-word, group-contribution, WhatsApp, interest, market-day and Ajo/Chama workflows preserve their English calculations in the shared DOM-free engine. Changing provider, travel, remittance and cultural-price claims remain blocked.

## Browser, export, privacy and artwork proof

Chromium ran with one worker on an isolated port at 320px, 375px and emulated 200% reflow, plus light/dark themes, keyboard focus, invalid/reset clearing, page/console errors and request inspection. Every advertised downloadable JSON/TXT file was downloaded and parsed or reopened; copy payloads were read back and print actions were invoked. The synthetic privacy sentinel produced zero raw-input network leaks and no AI request. Dedicated artwork is present for all 33 assigned rows; the missing-artwork queue is empty.

## Evidence and commands

- PASS — `node tests/sw-religious-cultural-african-lane.test.js` (6/6).
- PASS — `node tests/french-religious-cultural-parity.test.js` (22 shared-engine fixtures tied to the exact English registry owners).
- PASS — `node tests/sw-uniquely-african-parity.test.js`.
- PASS — both generator check modes and `node scripts/validate-sw-uniquely-african-parity.js`.
- PASS — focused Chromium lane spec, one worker on isolated port (2/2).
- PASS — privacy/AI consent tests, including a one-worker isolated-port rerun (3/3).
- PASS — `npm run validate:hreflang`, `npm run check-links`, `npm run audit`, `npm run type-check`, and `git diff --check`.
- FAIL-CLOSED AT PROHIBITED INTEGRATION BOUNDARY — `npm run build:i18n:validate` reports only the three coordinator-owned locale coverage artifacts as stale; this lane did not regenerate them.
- CARRIED BASELINE DEBT — `npm run lint` lists only unchanged AI/function/test/widget files; no lane file is in the failure list.
- CARRIED BASELINE DEBT — `npm run audit` remains successful but reports the same two registry rows without pages.

The required reference `.claude/rules/i18n.md` was absent at the baseline; AGENTS.md, the Swahili strategy and coordinator skill governed the lane.
