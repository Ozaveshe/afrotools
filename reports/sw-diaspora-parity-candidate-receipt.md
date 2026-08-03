# Swahili Diaspora Native-Parity Candidate Receipt

- Candidate verified: 2026-08-02
- Exact parent commit: `8354e321ff34caf60a33a3393cd0dcddfb00c023`
- Candidate family: Diaspora
- Repair supersedes blocked candidate: `c8524ac49766b21ffa2e7ab0b4429d2e74c844b4`
- Candidate app denominator: 2
- Local candidate result: 2 accepted, 0 product-blocked
- Candidate isolation: standalone direct child of the coordinator base; no Security, Career, Telecom, Trade, or crypto candidate is stacked
- Central acceptance result: pending coordinator review; the central Swahili acceptance ledger and generated AI route map were deliberately not edited
- Deleted paths: 0
- Push, merge, PR, and deploy: not attempted

## Diaspora Reconciliation

| Measure | Before | Candidate |
| --- | ---: | ---: |
| Exact English canonical owners | 2 | 2 |
| Exact Swahili registry rows | 0 | 2 |
| Swahili public routes | 0 | 2 |
| Native formula-parity apps | 0 | 2 |
| Translated/generic shells | 0 | 0 |
| Missing routes | 2 | 0 |
| Hub-linked routes | 0 | 2 |
| Available and rendered tool artwork | 2 | 2 |
| Full reciprocal English/French/Swahili hreflang | 0 | 2 |
| Central acceptance-ledger routes | 0 | 0 |
| Generated Swahili AI-map routes | 0 | 0 |

A shell, translated wrapper, iframe, English fallback, or unverified route was not counted as native or accepted.

## Local Candidate-Accepted Routes

| English owner | Native Swahili route | Supporting hub |
| --- | --- | --- |
| `/tools/immigration-points/` | `/sw/zana/kikokotoo-pointi-za-uhamiaji/` | `/sw/diaspora/` |
| `/tools/visa-tracker/` | `/sw/zana/kifuatiliaji-ombi-la-visa/` | `/sw/diaspora/` |

Both routes are hand-authored native Swahili HTML/CSS/JavaScript apps. Their new runtime and stylesheet are Swahili-scoped; they do not alter an English/French runtime or a cross-locale engine.

## Exact Formula And Product Oracles

### Immigration points

- Canada selected-factor fixture: `567` points.
- Australia selected-factor fixture: `120` points.
- UK verified salary-route fixture: `70` points.
- UK below-floor fixture: `50` points.
- The selected-factor arithmetic matches the exact English owner formulas for transferability caps, Australian employment cap, and UK mandatory/salary-route points.
- Invalid submission and every relevant input change clear prior output.
- Copy is reopened from the clipboard and TXT/JSON downloads are captured and parsed.
- JSON records the active route, every input (including selected indexes where option values repeat), the exact English-owner blob source version, and the result. Import validates the envelope, restores the inputs, and recomputes rather than trusting serialized output.
- Invalid or version-mismatched imports clear prior output. The English owner's Print / save PDF action is restored: it fails closed without a current result, opens the browser print workflow after calculation, and its A4 output is reopened with a PDF parser.

### Visa tracker

- The app accepts only a user-entered official minimum/maximum range; it does not invent processing times or claim access to a case file.
- The week fixture converts `2` and `4` weeks to `14` and `28` calendar days.
- Invalid jurisdiction, category, strict local-calendar date, unit, or range clears prior output. Impossible dates such as `2026-02-31` are rejected instead of being normalized by JavaScript.
- Elapsed-day and planning-window math uses the user's local calendar date while serializing stable `YYYY-MM-DD` values; a Honolulu UTC-rollover fixture proves the local-day boundary.
- All six advertised jurisdictions resolve to their exact official source: UK, Canada, Australia, United States, UAE, and Schengen.
- Copy is reopened from the clipboard; TXT and JSON downloads are parsed; exported JSON is imported and recalculated.
- Every invalid import path clears a visible prior result before parsing or validation. The English owner's Print / save PDF action is restored and its rendered timeline output is reopened with a PDF parser.
- Storage occurs only after the explicit local-save action; the saved record is reopened and can be deleted.

## Country, Source, Freshness, And Confidence

- Canada CRS: <https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/check-score.html>; official IRCC calculator, page dated 2026-06-22.
- Australia points: <https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-independent-189/points-table>; official Department of Home Affairs table.
- UK Skilled Worker: <https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-skilled-worker>; exact English-owner source URL.
- UK visa processing: <https://www.gov.uk/guidance/visa-processing-times-applications-outside-the-uk>; exact English-owner source URL replaces the prior non-owner URL.
- Visa sources: GOV.UK, Canada IRCC, Australia Home Affairs, US Department of State, UAE ICP, and the European Commission Schengen guidance.
- The visible source boundary says the links were reviewed on 2026-07-31. The immigration formula version now truthfully names the base English-owner blob `829a2b52c4d1`, not a false commit label.
- Confidence is high for selected-factor arithmetic, date conversion, source routing, and local export/reopen behavior.
- Confidence is deliberately limited for complete eligibility, invitation outcomes, official case status, or an individual processing date. Both apps label their output as planning guidance, not legal advice or a government decision.

## Privacy And AI Boundary

- Form values stay in the browser and are not logged, put in URLs, sent to analytics, or sent over the network.
- Browser observation, including the restored shared navbar/footer and their delayed runtime, recorded no unexpected external request, console error, page error, or failed resource. The locally vendored Supabase SDK satisfies the shared navbar's delayed auth bootstrap without a CDN request; no user data or auth request is made.
- Visa storage is explicit and local; immigration inputs are not stored.
- Each app warns against entering passport, file, contact, or other personal identifiers where they are not required.
- Any future AI send is described as requiring an exact content preview and explicit consent while retaining the local-only path. No AI or network send exists in this candidate.

## Browser, Accessibility, Theme, And SEO Evidence

- 16/16 focused Chromium tests passed.
- Both result screens fire the real browser `beforeprint` lifecycle from their visible `Chapisha / hifadhi PDF` controls. Chromium then renders an A4 `%PDF-` document larger than 5 KB; `pdf-parse` reopens it and finds route-specific calculated result content.
- The hub and both apps pass at 320px and 375px, at 200% reflow, in explicit light and dark themes.
- Computed assertions cover visible app-owned text, input/select text, primary and secondary actions, tabs, import labels, component/control boundaries, and focus indicators in initial and result states across explicit light, explicit dark, system-light, and system-dark variants.
- Measured minima: text `5.97:1`, component/control boundary `3.17:1`, focus indicator `6.61:1`, minimum focus-ring width `3px`.
- The shared navbar/footer render on the hub and both apps. App-owned theme transitions are disabled so controls and labels do not pass through a transient low-contrast state.
- Visible labels, accessible names, keyboard tabs and form submission, import focus proxy, live status/error regions, 44px controls, and reduced-motion behavior are covered.
- Each app is self-canonical, has route-specific Open Graph/tool artwork, and participates in a reciprocal English/French/Swahili hreflang group with `x-default`.

## Validation Receipt

| Command | Result |
| --- | --- |
| `node -c assets/js/pages/sw-diaspora-apps.js` | PASS |
| `node --test tests/swahili-diaspora-parity.test.js` | PASS, 6/6 |
| `node --test tests/fr-diaspora-parity.test.js` | PASS, 7/7 |
| `PORT=42942 AFROTOOLS_TEST_DISABLE_ANALYTICS=1 npx playwright test tests/e2e/swahili-diaspora-parity.spec.js --workers=2 --reporter=line` | PASS, 16/16 with two real print/PDF reopens; text `5.97:1`, boundary `3.17:1`, focus `6.61:1`, focus width `3px` |
| `npm run validate:hreflang` | PASS, 5,276 reciprocal equivalence groups |
| `npm run sw:ai-routes:check` | PASS, existing 199 accepted routes unchanged |
| `npm run test:privacy-ai-consent` | PASS, server check and 3/3 browser checks |
| `npm run check-links` | PASS, 133,210 internal links across 11,075 HTML files |
| `npm run lint` | PASS |
| `npm run type-check` | PASS |
| `npm run audit` | PASS; its two reported missing pages pre-existed and are outside this family |
| `git diff --check` | PASS |
| `npm run build:i18n:validate` | EXPECTED COORDINATOR BLOCKER: generated locale coverage JSON/Markdown is stale |

The i18n validation blocker is intentionally not repaired here. Regenerating `data/registry/locale-page-coverage.json` and `reports/localization-coverage.{json,md}` would broaden this candidate into coordinator-owned generated output. The coordinator must review the two source-owned apps, regenerate those artifacts, decide central acceptance-ledger entries, and then regenerate the AI route map.

No sitemap, deploy, master ledger, central Swahili acceptance ledger, generated AI route map, English/French visible copy, English/French runtime, shared cross-locale engine, Telecom, Career, Security, Trade, or crypto product runtime was changed.
