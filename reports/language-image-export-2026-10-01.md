# Free-app language parity: result image exports

## Changed Files

- `assets/js/share-image-inject.js`: English, French and Swahili controls, progress and feedback; native VAT/salary summaries with explicit amount periods and zero-value preservation.
- `assets/js/result-card.js`: native footer, default title and feedback; self-hosted renderer dependency; numeric zero and fixed card sizing.
- `benin/bj-vat.html`: shrinkable layout columns prevent overflow at 320px, including the result controls.
- `fr/benin/calculateur-tva.html`: calculate a real zero result; clear invalid or blank results and explain the error in French, preventing export of the previous calculation.
- `tests/e2e/result-image-language-parity.spec.js`: synthetic adapter cases, real PNGs, actual Benin VAT results, small-screen controls, errors and unsupported-tool exclusion.
- `tests/e2e/localization-platform.spec.js`: accept either the exact production hreflang URL or its normalized path for the same French destination. Both bootstrap and loaded resolver representations remain strictly checked.

## User-Facing Changes

French and Swahili image controls and exported image copy now use the page language. An annual salary or tax amount no longer receives a monthly label, and an effective rate of zero no longer falls through to another rate. VAT images use actual VAT result fields, including on French TVA pages. Full native page headings supply context without inventing a current tax year.

The French Benin calculator previously returned early for zero and negative input, leaving the previous result available. It now calculates zero and clears invalid results with an accessible French message. The English Benin layout also had overflow without the image control; shrinkable grid columns fix the underlying small-screen layout.

The tax adapter adds its control only to tax/salary routes or supported result objects, including legacy `.html` routes. Existing tool-specific export implementations continue to own other workflows. The renderer loads the existing local html2canvas asset, and its lazy module URL has an explicit revision for the immutable JavaScript cache policy. Image controls have a minimum 44px height, and the card fits its 1200×630 canvas without relying on host CSS.

## Tests Run

Local validation is complete. The final private receipt records terminal results and evidence paths; this source checkpoint does not prove publication.

- `node -c` for both changed browser sources: pass.
- `npm run test:localization`: pass.
- `npm run build:i18n:validate`: pass; all locale dictionary keys match English.
- `npm run validate:hreflang`: pass; 4,253 equivalence groups validated.
- Final artifact browser checks: 24/24 passed, one Chromium worker, no retries. This includes actual PNGs in three languages, 320px page/control layouts, native copy, zero rates, amount periods, error recovery, unsupported-tool exclusion, legacy routes, revised lazy loading and French result invalidation/recovery.
- Existing French Benin PDF regression: the download is parseable and ungated; passed against the optimized artifact.
- The initial broader browser run found a selector assertion that rejected a correct absolute production URL. The exact destination assertion was corrected and passed.
- `npm test`: initial run failed five of 1,178 test files while generation was in progress; all seven audits passed. All five failures passed a subsequent stable-source rerun: analytics-loader coverage, French transport, public claims, route contract and Swahili PAYE finder. The original aggregate exit remains recorded as failure, not relabelled as a clean aggregate run.
- `npm run build:deploy`, `npm run audit:dist`, `npm run security:scan`: pass.
- `node --test tests/engines/bj-vat.test.js`: all six tests pass; `npm run vat-business-tax:verify`: pass.
- Final targeted cache regeneration, deploy repack and `audit:dist`: pass. Dictionary/hreflang checks also passed after the final French page repair.

## Screenshots Needed

Actual synthetic PNG downloads are preserved privately for English, French and Swahili, including images from the Benin VAT calculators. No private user documents or records are used.

## Risk Notes

- Privacy: result content stays in the browser; no result upload, account gate or new analytics event is introduced.
- Accessibility: native accessible labels, disabled/busy state, recovery and small-screen button sizing are checked. Feedback uses the existing toast API.
- SEO/routes: no canonical, hreflang, URL or search-snippet source change. No search click or CTR improvement is claimed.
- Analytics: existing event names and consent remain unchanged.
- Source freshness/confidence: calculation engines, rates and source ledgers are unchanged. The image does not imply a new current-year rate review.
- Generated output: 65 HTML consumers receive cache-reference updates through `scripts/cachebust.js`; 63 contain only that reference update, while the two Benin pages also have the scoped source repairs above. Unrelated car/source-age and status-generation changes are excluded; their build diff is preserved privately. Optimized publish copies remain build-owned.

## Rollout Flag

- Flag/config: shared browser modules; no new feature flag.
- Renderer cache revision: `native-image-20261001`; advance the lazy module revision with future renderer changes because `/assets/js/*` has immutable caching.
- Rollback path: revert this source commit and regenerate the deploy artifact through the normal publisher.
- Publication: pending the current publisher's integration and exact-SHA production/live proof.

This closes a shared export defect, not app-by-app acceptance of the entire free catalogue. Remaining free-app parity and French SEO measurement remain open; Pro assessment follows the free-app programme.
