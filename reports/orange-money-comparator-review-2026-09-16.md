# Orange Money journey and comparator review — 2026-09-16

## Scope and baseline
Fetched origin/main `9a792f300b07352a878e1503f66123e6942666b2` before creating isolated `codex/fr-orange-money-20260916`. Previous invoice worktree and candidates preserved.

The GSC entry is an editorial guide, `/fr/blog/frais-orange-money-guide-2026/`, with historical 26 clicks / 10,056 impressions / 0.3% CTR in the 17 August–13 September review. This is not a new measurement or uplift claim. Its workflow links `/fr/tools/frais-mobile-money/#mm-form`; registry sourceId `mobile-money-fees` maps to English `/tools/mobile-money-fees/`. The guide correctly discloses that embedded tariff coverage is MTN Uganda and Airtel Tanzania, not Orange Money.

## Confirmed defects and correction
Synthetic browser proof in `../orange-workflow-before.json`:
- English ranked Senegal against Mali with XOF 10,000 and selected 10 XOF as the cheapest quote. Shared engine grouping omitted market; French's UI guard blocked this, but the engine contract remained unsafe across locales.
- At 12:00, both EN/FR accepted quotes expiring at 12:01. JSON downloaded after advancing to 12:02 still reported `not-expired`, eligible comparison and the old 12:00 calculation time. Exports reused cached results.

Shared engine now includes market in the comparison key. Runtime resolves country aliases through existing registry metadata, so `SN` and `Sénégal` compare without changing the exact entered market strings in results/JSON. Free-text markets without registry matches use normalized matching; no country is inferred from currency. Copy and JSON calculate again at the time of export, validating changed input and current expiry. No fees or tariff dates changed.

## Generator ownership
`build-mobile-money-fee-finder.js` remains the full template/configuration owner. Ordinary full generation semantics are unchanged. New explicit `--sync-runtime-config` mode changes only the unique `window.MobileMoneyTariffCopy` JSON block, sourcing it from that same configuration; it fails on missing, duplicate or invalid blocks. Tests prove every other byte is preserved and repeated sync is idempotent.

This avoids removing existing release-owned content during a configuration-only update. Those additions include analytics hooks (`scripts/inject-analytics-loader.js`), SEO clusters (`scripts/build-seo-system.js`), related-tools SSR (`scripts/inject-internal-links.js`), tool JSON-LD (`scripts/add-webapplication-schema.js`), cache-busted/minified asset references and the English priority title from `data/seo/priority-pages.json`. The normal pipeline still composes these after full generation. No arbitrary HTML-normalization preservation heuristic was retained.

## Validation
- Final combined browser run: 20 Chromium cases passed in 59.4 seconds (`../orange-market-final-proof`). Includes all three locales' expiry-on-export, canonical/native market equivalence with exact raw-value retention, cross-market exclusion, stale-input validation, native FR copy/JSON, refused clipboard, reset/third-quote controls, source/error/unavailable states, no-JavaScript fallback, mobile discovery from three guides and 375px layout.
- `node --test tests/mobile-money-runtime-config-sync.test.js`: 4 passed, including missing/duplicate/invalid configuration failures and byte preservation.
- `node tests/mobile-money-quote-engine.test.js`: passed, including different-market/same-currency exclusion, canonical aliases, and expiry at the exact boundary.
- `node tests/mobile-money-fee-finder.test.js`: passed.
- Explicit sync from original committed pages produced byte-identical SHA-256 hashes to the browser-tested pages. Normal owner check reports 0 drift for all three routes.
- Syntax and diff checks passed.

## Remaining acceptance gaps
- Guide links currently reach a blank manual comparator, without retaining selected country/currency/operation context; a separate handoff improvement is under review.
- Built-in finder has two recorded tariff providers only. Orange Money fees require user-entered checked quotes; no Orange fee/rule was added or freshly certified.
- The manual comparator exposes copy and JSON, not PDF/CSV or saved-draft import. This review does not claim those capabilities.
- Full-page dark-mode/accessibility, successful three-way comparison, every country/action/band, source freshness, all SEO rebuilds, production behavior and new GSC outcomes are not certified by this candidate. Existing tests cover a narrower useful workflow and hero contrast.
- No push, deploy, acceptance ledger or financial-source freshness edits.
