# French Orange Money context handoff — 2026-09-16

Companion to comparator candidate `b22b7ace`; no deployment or new GSC measurement.

## Changes
- Four country-section links in the hand-authored French Orange Money guide now open the French manual comparator with a public country code and withdrawal action. Cameroon maps to XAF; Senegal, Mali and Côte d’Ivoire map to XOF through existing country-registry metadata.
- The runtime accepts only a known country and supported action. It fills country/currency/action for the comparison rows. Amounts, fees, labels, observation and expiry dates remain for the user to enter. Unknown countries/actions are ignored; arbitrary URL fee, amount and currency parameters are not used.
- Native status explicitly says no Orange Money tariff is calculated automatically. The original generic CTA, country anchors, published fee examples and dated official-source caveats remain.
- The existing metadata resource `lang/pages/blog/frais-orange-money-guide-2026/fr.json` had obsolete exhaustive-fee/international-transfer claims; it now exactly matches the existing focused live-page title/description/H1. The search snippet itself was not rewritten. BlogPosting dateModified records this workflow edit; source verification dates remain unchanged.
- Scoped CSS repairs: country-help text had 4.39:1 light-mode contrast; primary mobile-money buttons had 2.37:1 dark-mode contrast. Existing theme tokens now provide appropriate foregrounds. The button selector is limited to `[data-mobile-money-parity]`, leaving other remittance apps outside this change.

## Verification
- Four complete mobile country journeys: all three manual quotes retain country/action/currency, calculate a synthetic comparison, export native JSON with exact country values and reset correctly. No synthetic quote content appeared in requests.
- Invalid/unsupported query tests show no fee/amount insertion and no change to the embedded tariff provider.
- Handoff/navigation/empty-form accessibility suite: 8 Chromium tests passed in 35.6 seconds.
- Strengthened full-main accessibility with calculated result cards: light and actual mobile-menu dark-mode workflows both passed axe WCAG A/AA checks for serious/critical violations at 320px (2 cases, 10.9 seconds).
- `node --test tests/french-orange-money-guide.test.js`: 6 passed, including old-source caveats, snippet/schema consistency, public context links and metadata-resource agreement.
- Generator check: 3 routes, 0 drift; no page regeneration required for this runtime-only follow-up.
- Syntax and diff checks passed. Hreflang validation passed: 11,560 public pages and 5,289 equivalence groups.

Evidence: `../orange-context-proof` preserves initial contrast failures and a test-only attempt to click the mobile theme control before opening its menu. `../orange-context-final-proof` and `../orange-context-results-a11y` contain passing evidence. The corrected dark test uses the actual menu and toggle; no theme-state injection substitutes for pointer interaction.

## Acceptance boundaries
This closes the prior report's blank country-context handoff and successful-three-way-comparison gaps. The fee finder still covers only its recorded Uganda/Tanzania tariffs. Orange Money calculations require user-entered checked quotes. No tariff, rule, amount, verification date or current-price claim was added or renewed, so no new official fee review is implied. PDF/CSV and saved-draft import are not present or claimed. Exhaustive country/band coverage, every device/theme combination, global navigation accessibility, live production and search uplift remain unverified. Root owns release integration and deployment.
