# Swahili Telecom native parity candidate receipt

## Candidate boundary

- Parent: `8354e321ff34caf60a33a3393cd0dcddfb00c023`
- Candidate: the single commit containing this receipt
- Scope: the 14 Swahili Telecom owners, hub, source-owner generator, route registry/coverage rows, native runtime/CSS, the narrowly guarded navbar source/minified runtime, and focused evidence only
- Excluded: Career, Diaspora, Security, Trade, Crypto, central acceptance and master ledgers, generated AI route maps, sitemaps, `dist`, deploy, push, PR, and merge
- Deletions: 0

## Local ACCEPT routes (14/14)

| Tool ID | Swahili route | Exact English behavior owner |
| --- | --- | --- |
| `telecom-data-plan` | `/sw/zana/kilinganisha-vifurushi-vya-data/` | `/telecom/data-plan-compare/` |
| `telecom-ussd` | `/sw/zana/saraka-ya-misimbo-ussd/` | `/telecom/ussd-directory/` |
| `telecom-roaming` | `/sw/zana/kikokotoo-gharama-za-roaming/` | `/telecom/roaming-cost/` |
| `telecom-starlink` | `/sw/zana/starlink-dhidi-ya-isp-za-ndani/` | `/telecom/starlink-compare/` |
| `telecom-tv` | `/sw/zana/kilinganisha-tv-na-streaming/` | `/telecom/tv-compare/` |
| `telecom-data-usage` | `/sw/zana/kikokotoo-matumizi-ya-data/` | `/telecom/data-usage-calc/` |
| `telecom-airtime` | `/sw/zana/thamani-ya-vocha-ya-simu/` | `/telecom/airtime-value/` |
| `telecom-portability` | `/sw/zana/mwongozo-kuhamisha-namba/` | `/telecom/number-portability/` |
| `telecom-sim-reg` | `/sw/zana/ukaguzi-usajili-wa-sim/` | `/telecom/sim-registration/` |
| `telecom-internet` | `/sw/zana/kilinganisha-intaneti/` | `/telecom/internet-compare/` |
| `telecom-fiber-lte-5g` | `/sw/zana/fiber-dhidi-ya-lte-na-5g/` | `/telecom/fiber-lte-5g/` |
| `telecom-business-internet` | `/sw/zana/kikokotoo-intaneti-ya-biashara/` | `/telecom/business-internet/` |
| `telecom-bulk-sms` | `/sw/zana/kikokotoo-bei-ya-sms-nyingi/` | `/telecom/bulk-sms-pricing/` |
| `telecom-whatsapp-vs-sms` | `/sw/zana/whatsapp-business-dhidi-ya-sms/` | `/telecom/whatsapp-vs-sms/` |

Local BLOCK routes: none.

## Product and boundary proof

- All routes call the same locale-neutral English `telecom-planning-engine.js`; 14 exact formula/output oracles and invalid-input oracles passed.
- Data is the archived `2026-03-01` Telecom snapshot. Every route visibly marks it stale and low-confidence, preserves known source gaps, and tells users to verify prices, coverage, availability, codes, and regulation with official providers/regulators.
- Form edits, invalid calculation, reset, and invalid/wrong-tool JSON import clear the prior result and revoke copy/TXT/JSON actions.
- JSON is parsed, schema/tool checked, and reopened in a genuinely fresh browser context; the result is recalculated locally. TXT is downloaded, parsed, and reproduced exactly after reopen.
- The generator emits an explicit `<meta name="afrotools-network-policy" content="local-only">` contract with its source owner on all 14 apps and the hub. Those pages no longer preload the Supabase SDK.
- Both delayed shared-navbar auth schedules honor that explicit policy in maintained `navbar.js` and `navbar.min.js`; normal pages without the policy retain their auth bootstrap.
- A deterministic production-like `telecom.africa-tools.test` replay opened all 14 routes and the hub concurrently, waited 17 seconds, and recorded zero `/api`, Netlify Function, Supabase, AI, auth-bootstrap, unexpected external, console, or page-error events. A normal homepage control on the same hostname issued `/api/auth/session` and initialized `AfroAuthSessionBridge` after its own 17-second observation.
- Sensitive and account data are not requested or stored. Calculation, copy, export, and reopen are local-only. No AI call exists; visible copy requires explicit consent for any future optional AI send.
- Canonical, OG/Twitter artwork, physical artwork load, `lang=sw`, source-owner mapping, and reciprocal hreflang passed. The Swahili navbar, `/sw/auth/` login, `/sw/nchi/` country route, footer, and assistant render through shared runtime.
- Fixed 320px and 375px viewports at 16px and 32px root font passed initial, result, edit-cleared, reset, and fresh-reopened states. Keyboard submit, labels/names, 44px targets, live regions, and light/dark/system variants passed.
- Computed minima across app-owned controls/actions and all theme variants: text `6.41:1`, component boundary `4.15:1`, focus `7.31:1`.

## Commands and results

- PASS `node scripts/build-swahili-telecom-parity.js --check` — 14 maintained pages match their owner.
- PASS `node tests/swahili-telecom-parity.test.js` — 14/14 structural, route, formula, source-gap, invalid, localization, export, source-owned network-policy, and maintained navbar-runtime contracts.
- PASS `PORT=42944 AFROTOOLS_TEST_DISABLE_ANALYTICS=1 npx playwright test tests/e2e/swahili-telecom-parity.spec.js --workers=2 --reporter=line` — 17/17 Chromium tests, including the production-hostname 17-second all-route/hub deny proof and normal-page auth control.
- PASS `PORT=42945 AFROTOOLS_TEST_DISABLE_ANALYTICS=1 npx playwright test tests/e2e/auth-nav-state.spec.js tests/e2e/auth-login-session-bridge.spec.js --workers=2 --reporter=line` — 8/8 shared auth regressions; signed-out, stale, free, Pro, password bridge, timeout, and failure states remain operational on normal pages.
- PASS `npm run validate:hreflang` — all native equivalents reciprocal and self-canonical.
- PASS `npm run test:privacy-ai-consent` — server test plus 3/3 browser consent tests.
- PASS `npm run audit` — registry audit completed; two carried unrelated missing-page rows were reported.
- PASS `npm run check-links` — 133,128 internal links, no broken links.
- PASS `npm run lint`; PASS `npm run type-check`; PASS `git diff --check`.
- BOUNDED repository condition: `npm run localization:check` reports only stale generated `data/registry/locale-page-coverage.json` and `reports/localization-coverage.{json,md}`. This candidate does not regenerate or edit those prohibited shared artifacts; the targeted source-owner and reciprocal hreflang gates are green.

## Release status

This is a local coordinator-review candidate, not central acceptance or release proof. No push, PR, merge, deploy, sitemap generation, or `dist` build was performed.
