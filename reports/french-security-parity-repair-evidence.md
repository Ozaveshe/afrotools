# French Security parity repair evidence

Date: 2026-07-29
Branch: `codex/fr-security-parity-7`
Repair baseline: `ae749439a1974aa7b39f6b813f9c6e98c1d430a2`
Independent-rejection repair baseline: `1c987b08c1489132505079f4d6fbffa75b481cf7`
Independent-verification repair baseline: `8b74cf25cfab96c4a0bab9cc5f09583bd6cb60de`
Disposition: independently repaired and accepted for the exact seven-route Security lane. Nothing was pushed, merged, or deployed.

## Accepted scope

- `/fr/tools/cout-cctv/`
- `/fr/tools/evaluation-risque-cybersecurite/`
- `/fr/tools/cout-violation-donnees/`
- `/fr/tools/checklist-securite-incendie/`
- `/fr/tools/cout-securite-maison/`
- `/fr/tools/force-mot-de-passe/`
- `/fr/tools/quiz-phishing/`

All seven routes are native French owners. A structured before/after audit found exactly seven changed localization-coverage records, each moving from `localized-shell` to `native`, with zero added or removed records.

## Product and engine repairs

- Extracted the English Fire Safety calculation into the DOM-free shared engine `assets/js/engines/security-fire-safety.js`.
- Wired both English and French Fire Safety pages to that engine. Three non-trivial checkbox subsets produce identical `41/100`, `51/100`, and `37/100` results in both locales.
- Removed unsupported numerical market assumptions from the French CCTV, Home Security, Data Breach, and Fire workflows. CCTV and Home now calculate only from visible user-entered quotes; Data Breach exposes every response budget and its USD conversion rate; Fire keeps the shared English scoring oracle but reports only user-entered remediation and maintenance budgets.
- Added country-specific authority context to Data Breach, Cybersecurity, and Fire Safety results while explicitly separating legal sources from user-entered costs.
- Added NIST Cybersecurity Framework guidance to Cybersecurity Assessment and NIST SP 800-63B guidance to Password Strength.
- Replaced the 29-word passphrase pool with a pinned, integrity-checked 2,048-word French BIP-39 vocabulary snapshot. Six independent Web Crypto selections provide 66 bits of selection entropy. The copy states that the vocabulary is used only as a word source and never as a recovery phrase.
- Added route-specific sources, freshness, limitations, and Africa GEO metadata to all seven pages.
- Declared exact generator, page, controller, and engine ownership in the locale coverage policy.

## Browser proof

`PLAYWRIGHT_BASE_URL=http://127.0.0.1:43220 PLAYWRIGHT_START_SERVER=1 node tests/french-security-browser-check.js`

Passed:

- Exact seven-card French Security hub.
- All seven apps at 320px and 375px, plus true 200% text resize at a fixed 320px viewport with an asserted root-font transition from 16px to 32px.
- Visible element and direct-text bounds were checked recursively through the document and open navbar/footer shadow roots. At a fixed 320px viewport and 16px→32px root text, no clipping or horizontal-scroll exemption is used; populated result tables stack into labelled rows.
- Light and dark themes with computed WCAG text-contrast checks before and after every result state, including metric tiles, password controls and suggestions, and phishing scenarios.
- Keyboard focus, accessible names, mobile overflow, canonical, OG, artwork, schema, GEO, and authoritative-source checks.
- Valid and invalid workflows for all seven apps.
- Fresh-browser-context JSON export/reopen with exact data fidelity for the five applicable calculators.
- Exact import schemas reject empty, partial, unknown-key, wrong-app, wrong-locale, and invalid-option files. Rejected imports, invalid recalculations, and reset actions clear stale results and copy/print state.
- Parsed PDF output with substantive calculated-result text for all printable workflows.
- Password secret sentinel absent from rendered output and every request; tested and generated credentials are also absent from browser-produced PDFs.
- No unexpected data requests, console errors, or page errors.
- No owned browser/server process remained listening after the run.

## Static and repository gates

Passed:

- `node tests/french-security-parity.test.js`
- `PLAYWRIGHT_START_SERVER=1 node tests/french-security-browser-check.js` — hub and 7/7 app workflows, including strict recursive fixed-320/200% reflow.
- `npx playwright test tests/e2e/french-security-parity.spec.js --workers=2 --grep "export JSON réel|aucun secret|10 scénarios"` — 7/7 focused export, privacy, and quiz tests.
- Exact seven-page owner equality: each committed HTML file is byte-equal to `scripts/lib/french-security-page.js` output.
- Localization coverage artifacts were regenerated through their owning script. The structured diff is limited to the exact seven Security routes moving from `localized-shell` to `native`: totals are 10,660 pages, 8,132 native, and 2,469 localized shells.
- `node scripts/build-localization-platform.js --check` — current branch check only.
- `npm run build:i18n:validate` — current branch check only.
- `npm run validate:hreflang` — 10,660 pages and 30,495 reciprocal relationships; current branch check only.
- `npm run ai:french-routes:check`
- `node tests/ai-french-discovery.test.js` — 5/5.
- `npm run lint`
- `npm run type-check`
- `npm run check-links` — 126,208 internal links across 10,837 HTML files on the repair baseline; no internal route was changed by the independent follow-up.
- `npm run security:scan` — repair baseline.
- `git diff --check`
- Deletion audit: zero deleted files.
- Locale-scope audit: zero Swahili, Hausa, or Yoruba paths.

Carried baseline failure:

- `node tests/french-discovery-foundation.test.js` remains red on an unrelated Legal inventory expectation (`161 !== 162`). This repair changes no Legal route, Legal registry row, or Legal discovery surface; it was not widened into the Security lane.

## Risk notes

- Privacy: calculations and credential generation remain local-first; no raw secret is exported, rendered, logged, sent, or printed.
- Accessibility: labels, focus, contrast, themes, keyboard flow, mobile widths, and reflow were browser-checked.
- SEO/GEO: reciprocal hreflang is green; canonicals, OG artwork, structured data, Africa service area, sources, and freshness are present.
- Analytics: no analytics event names or payloads changed.
- Generated output: the independent follow-up regenerates only the affected Fire page through the scoped seven-slug generator and the navbar/footer minified counterparts through `scripts/minify.js`. It does not regenerate sitemap, coverage, other-locale, or deployment outputs.
- Source state: the dead GNFS certification endpoint is explicitly disclosed and replaced by the live Ghana Ministry of the Interior GNFS agency page; the app does not claim that the replacement page is a certification procedure.
- Deployment: none performed.
