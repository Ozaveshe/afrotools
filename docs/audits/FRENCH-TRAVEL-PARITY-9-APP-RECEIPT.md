# French Travel parity — exact 9/9 receipt

Date: 2026-07-29
Branch: `codex/fr-travel-parity-9-apps`
Scope: local implementation and verification only. No push, PR, merge, deploy, sitemap, master ledger, other-locale page edit, or broad generated-output refresh.

## Exact canonical contracts

| English source contract | Native French route | Boundary |
| --- | --- | --- |
| `africa-flight` | `/fr/tools/prix-vols-afrique/` | User-entered quote range only; no live fare, schedule, or availability claim. |
| `airbnb-vs-hotel` | `/fr/tools/airbnb-vs-hotel/` | User-entered offers and fees only; no availability claim. |
| `airport-transfer` | `/fr/tools/transfert-aeroport/` | User-entered verified options only; no timetable or provider-status claim. |
| `beach-holiday-budget` | `/fr/tools/budget-vacances-plage/` | Editable planning assumptions only. |
| `festival-travel-budget` | `/fr/tools/budget-voyage-festival/` | Fails closed until the organizer source and date are confirmed. |
| `hotel-star-guide` | `/fr/tools/guide-prix-hotels/` | Compares user-entered offers; star labels are not a universal guarantee. |
| `safari-cost` | `/fr/tools/calculateur-du-cout-d-un-safari/` | Fails closed until official park fees are confirmed. |
| `travel-packing-list` | `/fr/tools/liste-bagages-voyage/` | Fails closed until document and carrier-rule checks are acknowledged. |
| `travel-vaccination-cost` | `/fr/tools/preparer-consultation-sante-voyage/` | Clinician-brief workflow only; no diagnosis, vaccine recommendation, price, or entry-rule claim. |

## Product proof

- All nine pages are rendered from `scripts/lib/french-travel-pages.js`; `scripts/generate-fr-tool-gap-pages.js` delegates these contracts to that native renderer so generic bridge generation cannot overwrite them.
- The exact French Travel hub contains nine artwork-backed cards, one for each canonical contract.
- Registry and French route-map ownership reconcile one French owner per English `sourceId`.
- Currency selection follows the destination where relevant; values, fees, schedules, offers, dates, and official-status confirmations remain user-entered.
- Every workflow has invalid-state handling, keyboard submission, live-region feedback, reset/focus recovery, local JSON export and reopen, and local PDF export.
- AI assistance is an optional locally prepared prompt behind explicit consent. It performs no request and retains a complete deterministic local fallback.
- The runtime does not use `fetch`, XHR, `localStorage`, or `sessionStorage`. Browser proof rejects sensitive writes to API, workspace, lead, AI, or Supabase endpoints.
- Canonical, French/English/x-default alternates, the four existing reciprocal Swahili alternates, Open Graph image metadata, and `WebApplication`/breadcrumb schema are source-owned.
- All nine `assets/img/tools/<english-source-id>.webp` files exist.

## Source and confidence boundary

Sources were checked on 2026-07-29 and are linked for user verification:

- IATA Travel Centre and IATA airport-code directory for passport, visa, health, and airport-code verification.
- WHO travel advice and vaccines-and-travel guidance for the clinician boundary.
- France Diplomatie travel advice for destination-specific official checks.
- TANAPA, Kenya Wildlife Service, Uganda Wildlife Authority, Rwanda Development Board booking portal, and SANParks for park-authority fee verification.

The pages do not copy changing eligibility, medical, fee, schedule, availability, or official-status facts into deterministic output. Those facts must be rechecked at the linked official source.

## Verification

- PASS — `npm run fr:travel:check`: 9 apps and 1 exact hub match source renderers.
- PASS — `npm run test:fr-travel`: 5/5 static parity, privacy, ownership, artwork, and boundary tests.
- PASS — English freeze: `node --test tests/day9-travel-apps.test.js tests/day9-category-hubs.test.js`: 9/9.
- PASS — direct Playwright, isolated port `42737`, Chromium, one worker: 12/12.
  - Each app: invalid and valid states, keyboard path, JSON export/reopen, PDF signature, AI consent/local prompt, visible labels, dark/light themes, 320px, 375px, 188px equivalent 200% reflow, reset/focus, console errors, and sensitive network writes.
  - Shared-overlap proof: English `/tools/age-calculator/` and French `/fr/` keep navbar/footer hosts reflowed at 320px and 188px; burger menu remains visible, opens, and closes with correct `aria-expanded`.
  - Durable result: `artifacts/fr-travel-playwright/final-results-2.json`.
- PASS — `npm run validate:hreflang`: 30,503 relationships; all native equivalents reciprocal, locale-correct, indexable, and self-canonical.
- PASS — `npm run ai:french-routes:check`.
- PASS — `npm run lint`; `npm run type-check`.
- PASS — `npm run check-links`: 126,188 internal links, no broken internal links.
- PASS — `npm run audit`: registry audit completed; its two pre-existing missing-page records are outside this scope.
- PASS — JavaScript syntax checks for all changed source, generator, and test files.
- PASS — `git diff --check`.
- PASS — `git diff --diff-filter=D --summary`: empty; zero files deleted.
- BASELINE/PROHIBITED REFRESH — `npm run fr:parity:check` reports `reports/french-free-app-parity-inventory.json` stale. This broad parity inventory was already stale at baseline and was not regenerated.
- BASELINE/PROHIBITED REFRESH — `npm run build:i18n:validate` stops at stale generated localization coverage artifacts (`data/registry/locale-page-coverage.json`, `reports/localization-coverage.json`, and `reports/localization-coverage.md`). This task did not regenerate or commit those broad reports.

## Shared-file coordinator overlap

The 200% gate exposed shared component reflow defects. The narrow fixes are intentionally included and must be checked for coordinator overlap:

- `assets/js/components/navbar.js` and `navbar.min.js`: at 220px and below, keep the 44px burger available while redundant header controls move behind the existing mobile drawer.
- `assets/js/components/footer.js` and `footer.min.js`: use one-column link/stat tracks and safe wrapping at 220px and below; no content or links are removed.

## Browser-slot release

The final isolated listener used port `42737`. Playwright exited normally after the 12/12 result; the listener PID had already exited before the ownership audit. Ports `42733` through `42737` were confirmed released, no matching server/Chromium process remained, and no shared or unidentified process was killed.
