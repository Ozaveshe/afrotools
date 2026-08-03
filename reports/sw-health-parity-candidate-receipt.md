# Swahili Health parity candidate receipt

Status: **ACCEPTED — BROWSER GREEN**

Programme base: `0f6990118d9ac8b9dcde446a6ede10a017b9a2db`

## Exact reconciliation

- English Health free-app denominator: **42**
- Previously accepted at the coordinator checkpoint: **1** (`waist-hip-ratio`)
- Remaining candidate apps: **41**
- Static/source-owner candidates green: **41/41**
- Static blockers: **0**
- Architecture/source-owner blockers: **0**
- Newly accepted by this lane: **41/41**
- Category total including the preserved baseline app: **42/42**
- Browser-blocked apps: **0**

The previously accepted route, `sw/zana/uwiano-wa-kiuno-na-nyonga/index.html`, is byte-identical to the pinned programme base. The generator explicitly excludes it.

## Implementation

- `scripts/build-swahili-health-parity.js` is the dedicated owner for the 41 candidates and `sw/afya/index.html`.
- The source owner uses the exact English Health controllers and deterministic engines. It does not translate or fork calculation logic.
- Twenty-eight former localized shells were rebuilt as native Swahili owners.
- Thirteen missing Swahili owners were created.
- Dynamic interface and result copy is owned by `assets/js/pages/swahili-health-parity-runtime.js` and a source cache containing 2,970 reviewed/normalized entries.
- The hub exposes all 42 apps exactly once.
- Reciprocal Health-only hreflang metadata was added to 13 English owners and 14 already-linked French/Hausa siblings.
- All 42 English OG artwork files resolve locally. See `reports/sw-health-parity-missing-artwork.json`.

## Safety and privacy contract

- The visible boundary is educational/planning only and explicitly non-diagnostic.
- The pages do not select medicines, prescribe doses, certify health, interpret a low-risk result as clearance, or delay urgent care.
- User-entered health data remains in the browser in the primary workflow.
- Local exports remain ungated. Any optional network/AI path still requires explicit reviewed-payload consent.
- Official and page-specific sources, freshness labels and confidence limits remain inherited from the verified English owners.

## Static evidence

- `node scripts/build-swahili-health-parity.js` — idempotent; 42 rows, 41 generated apps, 0 missing strings, 0 pending page drift.
- Focused Health formula, workflow, safety, privacy and source tests — **129/129 passed**.
- `node scripts/build-i18n.js --validate` — passed for French, Swahili, Yoruba and Hausa keys.
- `npm run validate:hreflang` — passed: 11,139 public pages, 32,540 relationships, 5,340 groups.
- `npm run check-links` — passed: 137,194 links across 11,358 HTML files.
- `npm run lint` — passed.
- `npm run type-check` — passed.
- `git diff --check` — passed.
- Deletion audit — **0 deleted files**.

`npm run build:i18n:validate` stops only because the central generated localization coverage artifacts are stale after adding 13 physical routes. This lane is forbidden to update those coordinator-owned artifacts; the direct locale-key validator and full hreflang validator are green.

## Browser acceptance

- Final one-worker Chromium confirmation: **44/44 passed** on isolated port 4451.
- Hub discovery: **1/1 passed**, exposing all 42 native Health apps exactly once.
- Route UI proof: **42/42 passed** at 320 px, 375 px, 200% root-text reflow, light and dark themes, keyboard focus, accessible names, console cleanliness and local-resource checks.
- Candidate workflow proof: **41/41 accepted**, including valid calculation/output, invalid or safety-state behavior, local export parsing and runtime Swahili checks.
- Parsed export proofs: **81**.
- Private-input network leaks: **0**.
- Machine-readable evidence: `reports/sw-health-parity-browser-evidence.json`.

### Browser-backed repairs

Six source-owned pages had genuine user-scrollable horizontal overflow at 200% text size and were repaired without changing their calculation logic:

- `calorie-counter`: 5 px
- `pharmacy-prices`: 18 px
- `due-date-tools`: 46 px
- `drug-price-compare`: 18 px
- `traditional-vs-western`: 18 px
- `gym-cost-compare`: 18 px

The final confirmation measured no user-scrollable horizontal overflow on any of the 42 routes.

Five remaining workflow blockers were untranslated dynamic output phrases. They were repaired in the Swahili Health presentation runtime only; English owners and calculation engines were not modified. The ovulation route's empty result was traced to a fixed test date whose cycle window had correctly expired. The English engine was independently exercised with a recent date and returned a valid window, so the fixture was made date-relative and no product formula changed.
