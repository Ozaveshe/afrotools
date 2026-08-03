# Swahili Uniquely African parity handoff

Status: **BROWSER VERIFIED — 20/34 accepted; 14/34 remain fail-closed**

## Exact scope

- Foundation: `0f6990118d9ac8b9dcde446a6ede10a017b9a2db`
- Coordinator snapshot: `20ad8fa8e76e98f3886f222bf3fc2c1ff463bcb9` (`708/1257` globally accepted; `0/34` in Uniquely African)
- Authoritative English denominator: **34 apps**
- Native Swahili implementations accepted with serialized browser proof: **20/34**
- Fail-closed native-owner backlog: **14/34**
- Artwork files present: **34/34**

The 20 candidates are full Swahili pages driven by the existing DOM-free `engines/src/uniquely-african-engine.js` contract. They include route-specific fields, calculations, invalid-state clearing, local-first result rendering, source/freshness/confidence/limitations, and only the export formats owned by the accepted English/French contract. No English engine was edited.

## Static proof completed

- `node scripts/generate-sw-uniquely-african-parity.js --check` — PASS; zero stale generated outputs.
- `node scripts/validate-sw-uniquely-african-parity.js` — PASS; 34 exact rows, 20 candidates, 14 blocked, 34 artwork files.
- `node tests/sw-uniquely-african-parity.test.js` — PASS; 20/20 English-owner fingerprints, exact output oracles and invalid-input fail-closed checks.
- `npm run lint` — PASS.
- `npm run type-check` — PASS.
- `npm run check-links` — PASS; 136,995 internal links across 11,354 HTML files.
- `npm run validate:hreflang` — completed; route-local English/Swahili reciprocity and x-default checks pass. The sitewide validator exits successfully but reports nine second-order French/Hausa-to-Swahili reciprocity warnings, carried for coordinator-owned localization integration rather than broadening this lane.
- `npm run build:i18n:validate` — command completed, with the known generated localization coverage artifacts reported stale because this lane may not regenerate central coverage files.
- `node tests/ai-consent-server.test.js` — PASS. The lane browser suite separately proved zero unexpected external/API/state-changing/raw-input-leak requests across all 20 accepted routes.
- `git diff --check` and `git diff --diff-filter=D --summary` — PASS; zero physical deletions.
- `tests/e2e/sw-uniquely-african-parity.spec.js` — PASS, 20/20 with one Chromium worker on the isolated hard-identified server.

## Why 14 routes remain blocked

- `japa-calculator` — the existing Swahili page hands calculation to the English route; it is not a native app owner.
- `burial-cost` — the existing page is a runtime-localized wrapper and contains malformed wrapper markup; it is not accepted as a native route.
- `mobile-money-fees`, `susu-tracker`, `remittance-compare`, `ajo-interest`, `ajo-chama-calc` — working-looking Swahili pages duplicate formulas whose maintained owners remain inline in English. They also lack complete route-owned export/reopen evidence, so they are not accepted by appearance.
- `amount-words-ke`, `amount-words-gh`, `brideprice-advisor` — explicitly labelled English fallback shells.
- `naira-to-words`, `whatsapp-link`, `remittance-v2`, `market-days` — no physical Swahili route exists.

These routes were not repaired in this lane because there is no maintained shared engine to reuse. They require English-owner extraction and parity fixtures before safe Swahili implementation.

## Serialized browser acceptance

- Hard identity: branch `codex/sw-african-remaining-20260803`, base `0f6990118d9ac8b9dcde446a6ede10a017b9a2db`, candidate `4ee83f2ce69d3dc442139c70a1754ea788ffb6d0`, verified product commit `47627348ce360c24e103b8097c1ee54b325b4f80`.
- Server proof: the served and local `data/localization/sw-uniquely-african-parity-manifest.json` SHA-256 values both equal `80bb529b86bf4d2275a94177f9ae85f36b476e213a0a1fe4637ca785e7bd616f`.
- One-worker Chromium on isolated port `4463`: **20/20 passed**.
- Every route proved exact English-owner oracle values, valid and invalid input, stale-result/export clearing, reset, visible Swahili result/error/export copy, 320px and 375px layouts, 200% reflow, light/manual/system dark modes, keyboard focus, visible labels, canonical/OG/schema/artwork, reciprocal hreflang, console and local-resource health.
- Every claimed output was exercised and reopened or parsed: **20 copy, 20 JSON, 4 TXT, 1 PDF, 2 print**.
- Privacy proof: **0** unexpected external requests, **0** unexpected API requests, **0** state-changing requests and **0** raw-input request leaks. The conflict reader used only its explicitly mocked, read-only first-party endpoint.
- Machine-readable route evidence: `reports/sw-uniquely-african-browser-evidence.json`.

Narrow repairs found by browser proof: eight missing English-to-Swahili reciprocal hreflang links are now generator-owned; virtual data errors focus the live status when no physical field exists; AfroPrices preserves per-listing country identity; and the PDF is reopened with the repository's local PDF.js parser and its title/source text is asserted.

Coordinator ledger and AI route inventory integration remain coordinator-owned and were not edited here.

## Guardrails

- No central ledger, AI map, sitemap, locale coverage, registry, French/Hausa page, `dist/`, redirect, deploy or live Supabase change. Eight English owners received only the reciprocal `hreflang="sw"` metadata required by the accepted Swahili routes.
- No broad build.
- No intentional physical deletion.
- Chromium was launched only on the isolated, hard-identified local server and was released after the final run.
