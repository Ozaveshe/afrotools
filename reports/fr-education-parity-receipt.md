# French Education parity receipt

Baseline: `8ce5cac175e42201968b1f7540752d6acf92d4ca`

Scope: exact English free-app inventory where `categoryKey === "education"`

Acceptance: **42/42 accepted**

## Reconciliation

- Exact denominator: 42 English canonical apps.
- French physical routes: 42/42.
- Native French app owners: 41 generated owner adapters plus the retained native Education planner.
- English deterministic owners reused: 40 existing owners plus the scoped `education-route-engine` extracted for University Admission.
- Category hub links: 42/42, in manifest order.
- Registry routes: 42/42.
- AI route equivalents: 42/42.
- Reciprocal hreflang: 42/42 within the sitewide validator.
- Semantic artwork: 42/42; missing-artwork queue is empty.
- Remaining Education routes: 0.

## Product corrections

- Replaced English iframes, handoff-only shells and non-functional French controls with native French workflows.
- Repaired the French Scholarship Finder, whose controls previously called undefined functions. It now uses the shared scholarship matcher and feed, with a bounded curated fallback when the live feed is slow.
- Added the missing French Tutoring Rate app and reciprocal English/French ownership.
- Added exact local copy, JSON, CSV, TXT, parsed PDF, local save and print actions to the 41 shared-owner workflows.
- Corrected raw English result states in the French UI and fixed incomplete metric wiring for GPA, percentage, IELTS, algebra and Study Abroad Cost.
- Fixed the retained Education planner’s 320px table overflow without removing its horizontal table affordance.
- Rebuilt the French Education category hub around the exact 42-app programme, with crawlable links, French metadata and ItemList schema.

## Browser and owner proof

- `tests/e2e/fr-education-deficit-parity.spec.js`
  - 82/82 passed.
  - 41 valid owner workflows.
  - 41 invalid-input fail-closed workflows.
  - Every advertised JSON/CSV/TXT/PDF export was downloaded and reopened; PDFs were parsed with `pdf-parse`.
- `tests/e2e/fr-education-category-parity.spec.js`
  - 44/44 passed in the complete post-fix rerun.
  - Exact category hub, all 42 routes, 320px, 375px, 200% reflow equivalent, explicit light/dark, system dark, keyboard focus, canonical, OG, schema, console and document-routing checks.
  - Retained Education planner input-dependence, clipboard and reopened TXT export verified.
- Focused English owner/oracle suite
  - 112/112 passed across the English Education engines and the French owner-declaration contract.
- French AI discovery
  - 5/5 passed.
- Privacy and AI consent browser suite
  - 3/3 passed.

## Repository gates

- `npm run check-links`: passed; 126,028 internal links across 10,838 HTML files.
- `npm run audit`: passed; canonical English inventory remains 1,258 and expanded live experiences remain 2,612.
- `npm run lint`: passed.
- `npm run type-check`: passed.
- `npm run security:scan`: passed.
- `npm run validate:hreflang`: passed; 30,499 relationships and 5,147 equivalence groups.
- `npm run ai:french-routes:check`: passed.
- `node scripts/audit-fr-education-parity.js --write`: passed, 42/42 accepted with zero failures.
- `git diff --check`: passed.
- `git diff --diff-filter=D --summary`: empty; no deleted files.

## Carried sitewide state

- `node scripts/build-localization-platform.js --check` reports the pre-existing sitewide localization artifacts as stale. They were not regenerated because that would create prohibited broad locale churn.
- `npm run seo:report` reports zero missing canonicals, titles, descriptions, hreflang violations or `/fr/` broken links. It also reports broad pre-existing auto-fix opportunities for four OG URLs and 1,892 JSON-LD blocks; these were not applied in this scoped category lane.
- The reviewed Tutoring Rate AI equivalent is held in `data/ai/french-route-equivalents.json` until a future serialized localization-platform rebuild absorbs it.

No sitemap, master ledger, broad localization build, push, PR, merge, deployment or live Supabase action was performed.
