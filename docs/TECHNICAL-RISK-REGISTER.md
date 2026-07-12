# AfroTools Technical Risk Register

Last verified: 2026-07-11 at commit `18ce63a`.

This register ranks current architectural risks from code and runtime evidence.
It is not a list of hypothetical rewrites. Scores use 1 (low) to 5 (high):

- Impact: harm to users, data, compliance, or release safety.
- Breadth: number of routes/workflows affected.
- Reversibility: 1 is easy to roll back; 5 requires migration or coordinated
  compatibility work.

Priority is based on the three scores plus current exposure.

## Prioritized Register

| ID | Priority | Risk | Impact | Breadth | Reversibility |
| --- | --- | --- | ---: | ---: | ---: |
| R1 | P1 | Auth/session state is split across HttpOnly cookies, Bearer compatibility, direct Supabase browser auth, and legacy localStorage caches | 5 | 4 | 4 |
| R2 | P1 | Supabase migrations target both AUTH and legacy DATA projects, including a documented cross-instance trigger caveat | 5 | 4 | 5 |
| R3 | P1 | High-stakes AI advisor context contains hard-coded rates and domain facts outside the source-confidence ledgers | 5 | 3 | 3 |
| R4 | P1 | `/all-tools/` has no useful tool directory when JavaScript is disabled | 4 | 5 | 2 |
| R5 | P3 | Canonical public counters are enforced, but specialized feature registries still need explicit collection migration before they can publish totals | 2 | 2 | 2 |
| R6 | P1 | Consent-enabled analytics can send raw search fragments and error-message text | 4 | 3 | 2 |
| R7 | P2 | The build mutates committed source/output in place and spans thousands of generated files | 4 | 5 | 3 |
| R8 | P2 | Locale support, public language claims, and AI locale hints describe different scopes | 3 | 5 | 3 |
| R9 | P2 | Browser E2E blocks service workers and the local server mocks selected APIs, leaving production cache/function gaps | 4 | 4 | 3 |
| R10 | P2 | Dashboard and Pro state use many inline/localStorage contracts alongside account sync | 4 | 3 | 4 |
| R11 | P2 | Automation freshness warnings do not currently fail the broad test gate | 3 | 4 | 2 |

## R1: Fragmented Authentication and Session Compatibility

Evidence:

- `netlify/functions/auth-session.js` prefers HttpOnly access/refresh cookies
  but accepts Bearer tokens for compatibility.
- `auth/index.html` can load Supabase JS directly.
- `assets/js/lib/saved-tools.js` searches multiple browser/session fallbacks,
  including a Supabase localStorage token key.
- `dashboard/index.html` still reads and clears legacy auth/session caches.

User risk: an auth change can work on one surface and fail on another; expanding
browser token storage would increase XSS exposure. Account-backed favorites,
workspace, billing, and profile flows share this boundary.

Reproduce/inspect:

```bash
npm run test:auth-funnel
npm run test:auth-nav-state
npm run test:dashboard-auth-state
node tests/auth-session-cookie-set.test.js
node tests/auth-session-cookie-clear.test.js
rg -n "afro_session|afro_auth_v2|sb-zpclagtgczsygrgztlts-auth-token" assets auth dashboard netlify/functions
```

Representative routes: `/auth/`, `/dashboard/`, `/pro/`.

Smallest safe mitigation: make the cookie-backed session endpoint the written
canonical contract, inventory each compatibility reader, add a cross-surface
auth-state matrix, then retire browser token fallbacks one at a time.

## R2: Retired Dual Supabase Project References

Evidence:

- `supabase/migrations/README.md` preserves the historical DATA/AUTH mapping,
  while migration 053 and the deploy-channel checks make AUTH
  `zpclagtgczsygrgztlts` the only active application target.
- The same README states migration 007 cannot update an AUTH `profiles` table
  from a DATA `calculation_history` trigger.
- Migrations are applied manually or through the configured Supabase MCP;
  repository presence does not prove live application.

User risk: reintroducing the retired hostname or a key from another project can
break every affected API call or send a live schema action to the wrong product.

Reproduce/inspect:

```bash
Get-Content supabase/migrations/README.md
node tests/supabase-consolidation.test.js
rg -n "AUTH|DATA|jbmhfpkzbgyeodsqhprx|zpclagtgczsygrgztlts" supabase netlify/functions
```

Mitigation: `npm run deploy:channel:verify` rejects deployable legacy refs and a
wrong repo-local MCP target. Run `npm run supabase:consolidation:verify:live`
before production deploys to validate the linked Netlify variables without
printing secrets.

## R3: Hard-Coded High-Stakes AI Context

Evidence:

- `netlify/functions/ai-advisor.js` contains a large tool-context table with
  tax, property, remittance, medical, and other domain facts/rates.
- This context is separate from `data/_meta.json`, shared source-confidence
  registries, and the domain source ledgers.
- Provider output is guarded and consented, but source freshness of embedded
  facts is not automatically coupled to the data review cadence.

User risk: an AI explanation can repeat a stale rate even when the calculator
or data ledger has been updated.

Reproduce/inspect:

```bash
rg -n "Key rates:|Key corridors:|property taxation|medical lab report" netlify/functions/ai-advisor.js
npm run test:ai
npm run test:source-confidence
```

Representative route: any optional AI explanation on a tax, property,
remittance, or medical-report tool.

Smallest safe mitigation: replace numeric domain facts in prompts with
structured, source-labeled inputs from the same versioned engine/data contract
used by the result.

## R4: JavaScript-Only All-Tools Directory

Evidence: in a real Chromium context at 390x844 with JavaScript disabled,
`/all-tools/` rendered its title and explanatory shell but only one link and
zero tool cards. The homepage under the same conditions retained 175 links and
the `2,606+` count.

User risk: low-bandwidth users, failed bundles, restrictive browsers, and
crawlers that do not execute the directory script cannot browse tools from the
primary directory route.

Reproduce:

```bash
node tests/support/static-server.js
# Open http://127.0.0.1:4173/all-tools/ with JavaScript disabled.
```

Smallest safe mitigation: generate a compact initial list or category index
from `data/tool-directory.json`, then let JavaScript enhance filtering and
pagination.

## R5: Residual Specialized-Registry Drift

Evidence:

- The canonical report now distinguishes 3,263 raw tool rows, 3,259 canonical
  published tool records, 2,606 live tool experiences, and 1,252 crawlable
  canonical English records.
- Tool, widget, category, country, site-language, plan, and Pro-app headline
  counts are named selectors and build-checked.
- Four legacy duplicate routes are explicit redirect aliases and excluded from
  public/indexable semantic counts.
- Specialized feature registries and page-local curated collections still
  require an explicit `featureCollections` policy entry before publishing a
  total.

Residual user risk: a future specialized collection could publish an unowned
total if it bypasses the marker and policy checks.

Reproduce:

```bash
npm run registry:check
npm run test:registry
rg -n "data-registry-count|data-registry-plan" index.html widgets categories developer-tools pricing pro
```

Smallest safe mitigation: add any new public feature total to
`data/registry/catalog-policy.json`, generate a named selector, and bind its
initial HTML through a registry marker before publishing the claim.

## R6: Analytics Payload Privacy

Evidence:

- `assets/js/lib/analytics.js` sends the first 100 characters of search queries
  after cookie consent.
- `error-boundary.js` can send the first 100 characters of an exception message.
- AI-specific analytics are more conservative and use metadata/length buckets.

User risk: users may paste names, identifiers, salary, legal, health, or career
details into a general search field; exception messages can also contain
unexpected values.

Reproduce/inspect:

```bash
rg -n "trackSearch|trackError|substring\(0,100\)" assets/js/lib/analytics.js assets/js/lib/error-boundary.js
npm run test:privacy-ai-consent
```

Smallest safe mitigation: hash or classify general search terms locally and
send category/result-count metadata; replace free-form error messages with
stable error codes.

## R7: In-Place, High-Blast-Radius Build

Evidence: `npm run build:deploy` updated or inspected 236 HTML files, minified
inline CSS/JS across hundreds of files, created three bundles, regenerated
2,311 internal links, 2,567 canonical redirects, 12 sitemap groups, and copied
14,192 files to `dist/`. The first pre-edit run left Git clean. A later run in
the same session crossed the generator date boundary and restamped the tool
directory, tools index, and sitemap files even though product source was
unchanged. Those out-of-scope outputs were reversed after inspection.

User risk: a small source edit can cause broad generated churn, masking a
route, content, or source regression in review.

Reproduce:

```bash
git status --short
npm run build:deploy
git status --short
git diff --stat
npm run audit:dist
```

Smallest safe mitigation: keep source-to-output ownership documented, add
generator-specific check modes, and review source diffs separately from
generated diffs.

## R8: Locale Scope Mismatch

Evidence:

- `scripts/build-i18n.js` supports site locales `en`, `fr`, `sw`, `yo`, `ha`.
- `scripts/validate-hreflang.js` validates the same site-language set.
- Homepage copy highlights English, French, and Swahili.
- AI API docs and AI i18n contracts also accept hints such as Portuguese and
  Arabic, which are not site-generation locales.
- Page-specific translation coverage varies by language and route.

User risk: a language can appear supported in one layer but fall back to
English or have no equivalent route in another.

Reproduce:

```bash
npm run build:i18n:dry-run
npm run build:i18n:validate
npm run validate:hreflang
npm run test:ai-i18n
rg -n "SUPPORTED_LANGS|VALID_LANGS|English, French" scripts assets index.html docs/api
```

Smallest safe mitigation: publish separate machine-readable lists for site
locales, AI input locales, OCR languages, and route-level native translation
coverage.

## R9: Production Runtime Gaps in Browser Tests

Evidence:

- `playwright.config.js` sets `serviceWorkers: "block"`.
- `tests/support/static-server.js` stubs auth and selected routes and can invoke
  only a subset of Netlify Functions locally.
- Some missing Matchday functions receive explicit local placeholder JSON.

User risk: stale service-worker caches, Netlify redirect precedence,
environment variables, scheduled functions, and live Supabase behavior can
pass local E2E while failing in deployment.

Reproduce/inspect:

```bash
npm run test:playwright:smoke
rg -n "serviceWorkers|placeholder|apiFunctionAliases" playwright.config.js tests/support/static-server.js
npm run automation:live-health:strict
```

Representative routes: `/`, `/tools/fuel-tracker/`,
`/tools/scholarship-finder/`, `/api/data-freshness`.

Smallest safe mitigation: retain fast mocked tests, then add a small deployed
preview pack with service workers enabled and explicit Netlify/live-state
proof buckets.

## R10: Dashboard and Pro State Fragmentation

Evidence:

- `dashboard/index.html` contains many inline controllers and reads numerous
  domain-specific localStorage keys.
- The Pro registries explicitly distinguish account-backed Payroll from local,
  shell, review-packet, and limited-preview workspaces.
- General and domain-specific sync helpers coexist in `assets/js/lib/`.

User risk: save, delete, duplicate, logout, and cross-device behavior can differ
by workspace, and user-facing availability copy can outrun actual persistence.

Reproduce/inspect:

```bash
npm run pro:verify
npm run test:dashboard-auth-state
npm run test:pro-ux
rg -n "localStorage\.getItem|localStorage\.setItem" dashboard/index.html pro assets/js/lib
```

Representative routes: `/dashboard/`, `/pro/workspace/`, `/pro/vault/`.

Smallest safe mitigation: inventory storage keys and record types, require each
workspace to declare `device`, `account`, or `hybrid` persistence, then route
all account writes through one audited sync contract.

## R11: Non-Blocking Automation Freshness Warnings

Evidence: the verified `npm test` passed while reporting multiple Codex-owned
automations with no recent evidence or latest statuses such as `incomplete` or
`interrupted`. The registry audit confirms schedule ownership but does not make
all freshness warnings release-blocking.

User risk: repository CI can be green while an operational content, deploy,
source-refresh, reminder, or follow-up lane has not recently completed.

Reproduce:

```bash
npm test
npm run audit:automation-registry
npm run automation:live-health:strict
```

Smallest safe mitigation: classify production-required automations separately
from advisory jobs and fail only the former when their evidence exceeds the
declared freshness window.

## Review Cadence

Re-run this register after changes to auth, migrations, build generation,
localization, AI prompts/providers, public counters, Pro persistence, service
workers, Netlify configuration, or automation scheduling. Close a risk only
with code plus the listed reproduction command or a stronger replacement.
