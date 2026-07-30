# French HR & Payroll parity repair receipt

Status: `LOCAL CANDIDATE 6/6 — EXACT CONTROL-CONTRACT AND STRICT BROWSER PROOF COMPLETE`

Repair baseline: `540312ec252d4f5cd985747e631712521d913fd3`

Branch: `codex/fr-hr-payroll-parity`

Category denominator: six canonical `HR & Payroll` owners.

## Frozen English owners

The English files were read as the product/formula owners and were not edited.

| Canonical app | Native French owner | Frozen English blob |
| --- | --- | --- |
| `contractor-vs-employee` | `/fr/tools/contractant-vs-salarie/` | `41d4ff161b79cc258c4c077dca0364604364a1df` |
| `domestic-worker` | `/fr/tools/salaire-employe-maison/` | `55cbc3b734054a5349cd40542c724d731d80ed67` |
| `employee-cost` | `/fr/tools/cout-total-employe/` | `af27b47ff3fa4d630597d958a3d400fec6b71de2` |
| `gratuity-calculator` | `/fr/tools/calculateur-indemnite-depart/` | `51563e59a565b918c4ee334a5a98f3b9b6cf54aa` |
| `maternity-leave` | `/fr/tools/conge-maternite-paternite/` | `197f50ef308c1e4d8ced82e23eb39fad31f2a58d` |
| `retrenchment-calculator` | `/fr/tools/calculateur-d-indemnite-de-licenciement/` | `1856bfcb5343c4f62c39bf876b10cd1d6e9632e8` |

## Exact DOM control parity repaired

- `data/localization/fr-hr-payroll-field-contracts.json` maps 77 English owner controls to their French counterparts. Omitted attributes are contractual: the generator may not add default `required`, `min`, `step`, or other validation attributes.
- Generation now copies each owner's exact element/type, optional state, `min`, `max`, `step`, `maxlength`, `inputmode`, `autocomplete`, `pattern`, and `rows` contract. The dated source controls on the contractor workflow remain explicit French evidence extensions.
- Selector value order and initial selection are owner-bound. Domestic-worker selectors now use the English defaults and option order. Maternity and comparison countries use all 54 English route-valued options while retaining localized French labels.
- Maternity's local runtime preserves the route-valued country inputs and separately records the selected French labels for rendered and exported workflow context.
- Static and browser tests compare both English and French DOMs against the oracle, including visible label association and accessible native required semantics.

## Product parity repaired

- Domestic-worker now preserves the English country and role controls, pay and wage-floor period conversion, retention buffer, written-contract/payment-record/rest-day readiness, the English readiness score, checklist, two scenarios, and non-identifying notes.
- Parental leave now preserves country, leave type, comparison country, assumptions/HR notes, dated scenarios, and comparison context.
- Both expanded workflows render through the shared French engine/presentation layer and carry their context, scenarios, checklist, values, source, freshness, and confidence into JSON, TXT, and parsed PDF output.
- Gratuity rejects zero total service and zero eligible days. Retrenchment rejects zero total service. Domestic-worker enforces the English browser maxima of 160 overtime hours, 40% employer contribution, and 30% leave reserve.
- The English owner files remain unchanged. Static and browser tests read the English controls/invalid behavior instead of treating French-authored fixtures as the authority.

## Responsive and privacy repair

- At narrow widths, the redundant desktop search/theme buttons are hidden while the existing search/theme controls remain keyboard-operable in the drawer.
- Footer statistics and link groups collapse and wrap; direct text does not escape its visible container.
- HR hero copy, badges, cards, workflow details, and images have bounded widths and aggressive wrapping where required.
- Hub card images retain `height:auto`, render at 16:9, load a real `currentSrc`, expose non-zero natural dimensions, and have a successful image response matching the OG asset.
- These seven routes set the supported `window.AfroDisableAssistant` flag before the shared footer loads. Salary/payroll inputs therefore remain local-only, and no AI assistant appears without a future explicit-consent design.

## Strict browser proof

Final command:

```powershell
$env:PORT='43139'; $env:PLAYWRIGHT_BASE_URL='http://127.0.0.1:43139'; $env:NODE_PATH='C:\Users\Oza\Documents\afrotools\node_modules'; & 'C:\Users\Oza\Documents\afrotools\node_modules\.bin\playwright.cmd' test tests/e2e/fr-hr-payroll-parity.spec.js --project=chromium --workers=1
```

Result: `PASS — 15/15 in 5.8m`.

The first assertion verified the served generator marker and French route content without a machine-specific worktree path. The suite then proved:

- all 77 mapped French controls match their live English owner attributes, selector values, defaults, labels, and native required semantics;
- varied English/French domestic-worker and parental-leave product behavior;
- all six current calculations and owner-bound invalid states;
- invalid-result focus, reset, result invalidation, JSON download/reopen, exact TXT values, and exact parsed PDF values/sources/workflow context;
- request capture began before navigation or input; every observed method, GET URL, and body was free of the private synthetic sentinels, and no mutating request, `/api/`, Netlify Function, or AI-advisor call occurred;
- fixed 320px viewport with measured root font size `16px` then `32px`;
- recursive visible element and direct-text `Range` geometry in light DOM and every open shadow root;
- initial and rendered-result states for the hub plus all six apps;
- 375px initial/result reflow, light/dark contrast, visible keyboard focus, labels, landmarks, live status, drawer Enter/Escape focus return, and no console/page errors;
- canonical, reciprocal French/English/x-default hreflang, AI-consent mode, rendered artwork/currentSrc/natural dimensions/16:9 ratio, and successful local OG image responses.

Port/process release:

- isolated port: `43139`
- listener after the final run: `0`
- lingering server or Chromium process owned by this worktree: `0`

## Static, localization, SEO, and routing proof

| Check | Result |
| --- | --- |
| `node --test tests/fr-hr-payroll-parity.test.js` | PASS — 10/10, including 77-control source/generated oracle |
| `node scripts/build-french-hr-payroll-parity.js --check` | PASS — 6/6 plus hub current |
| `node scripts/build-localization-platform.js --check` | PASS — 10,661 pages; committed coverage artifacts current |
| `npm run build:i18n:validate` | PASS — localization platform and four translation catalogs valid |
| `node scripts/build-french-product-surface.js --check` | PASS |
| `node scripts/build-ai-french-route-map.js --check` | PASS |
| `node tests/ai-french-discovery.test.js` | PASS — 5/5 |
| `node tests/ai-intent-router.test.js` | PASS — 31 deterministic samples plus API guardrails |
| `node tests/ai-consent-server.test.js` | PASS |
| `npm run test:privacy-ai-consent -- --workers=1` on isolated port `43139` | PASS — server gate plus 3/3 Chromium |
| `node scripts/validate-hreflang.js` | PASS — 30,499 reciprocal relationships |
| `node scripts/build-i18n.js --validate` | PASS |
| `node scripts/check-links.js` | PASS — 126,169 internal links |
| `node scripts/validate-registry.js` | PASS — 0 errors; 3 pre-existing non-blocking warnings |
| `git diff --check` | PASS |

## Scope hygiene

- Physical deletions: `0`.
- English formula-owner changes: `0`.
- Other-locale changes: `0`.
- Sitemap, master ledger, localization coverage output, `dist`, deploy, merge, push, and PR changes: `0`.
- Shared generated changes: `0`; generated HTML changes are limited to the six French HR owners produced by their dedicated generator.
- The six artwork files were reused without modification; missing artwork: `0`.
