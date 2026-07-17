# AfroTools Elevation Prompts — July 2026

Generated: 2026-07-12 from a six-track deep repo audit (architecture, SEO/localization, data infrastructure, CI/automation, monetization, frontend UX). Every claim below was pulled from the repo at commit `f94f546`; the highest-stakes ones were re-verified by hand.

**How to use:** each prompt is self-contained — paste it into a fresh Claude Code session in this repo. Tiers are ordered by leverage: Tier 0 protects money and trust already being lost today; Tier 1 deepens the data moat; Tier 2 grows revenue; Tier 3 grows traffic; Tier 4 pays down platform drag. Within a tier, order is by impact-to-effort.

**Audit digest (what the prompts are built on):**

| Track | Headline findings |
| --- | --- |
| Monetization | Paystack Pro checkout live ($5/mo, $30/yr); `ai-advisor.js:71` gates Pro on a `subscriptions` table while the rest of the platform uses `profiles.subscription_tier` — paying users likely metered as free. API paid tiers ($149/$499) are manual-sales only. SalaryPadi partner API shipped 2026-07-11. |
| Automation | `reports/live-automation-health-latest.json` (2026-07-05): 19 ok / 6 stale / 10 missing; the source-health watchdog itself stale 118h; broad scheduled-function outage ~2026-06-30. No error tracking anywhere. 57/116 automations run on the owner's local codex machine. |
| Data | Static fallbacks 3–4 months stale (`data/forex/latest.json` ~87 days past its own `next_update`). Flagship pages bypass live APIs (`tools/fuel-tracker` reads the April snapshot; `tools/electricity-estimator` hardcodes tariffs). `data/source-registry.json` covers 13 of 2,600+ tools, zero `official_verified`. 27/67 government sources blocked. Only 7/53 PAYE engines carry `lastUpdated`. |
| SEO | 9,093 unique indexable URLs. WebApplication schema missing on 865 tool pages, FAQPage on 1,192. ~1,560 EN tool pages with no FR route; SW missing 255; YO at 21 URLs. `llms.txt` says "1,110+ tools" vs 2,515 actual. Related-tools links are JS-only (invisible to crawlers). 1,714 pages share the generic OG image. |
| Architecture | `navbar.min.js` 285KB on all 10,406 pages (embeds theme CSS + 1,269 links). `engines/` = 128 minified files with **no source tree**. `ai-advisor.js` embeds ~1,068 lines of hardcoded rates (risk-register R3). Only 36/176 functions rate-limited; 30 lack try/catch. 41-step build chain, 75-step test chain. |
| Frontend | `related-tools-data.min.js` 477KB on 671 pages; some pages load *unminified* `navbar.js` (358KB); tool pages load 100KB unminified `design-system.css` render-blocking while a 75KB `.min` sits unused; 1.39MB search index fetched whole; dark-mode FOUC on tool pages; SW precaches `navbar.min.js?v=43e4d9b2` while pages use `?v=01cb0562` (dead precache); 50 unit tests + 31/32 Playwright specs never run in CI. |

Standing cautions baked into the prompts (from `AGENTS.md`, `.claude/rules/`, and project memory): prefer source files + generator scripts over hand-editing generated output; run the narrowest meaningful checks, plus `npm run security:scan && npm run build:deploy && npm run audit:dist` for publish-surface changes; Node `fs.writeFileSync` can fail with UNKNOWN on this OneDrive-synced path — write to a temp file then `renameSync`; never hardcode tool counts (use `scripts/update-counts.js`); brand is blue `#0062CC`; never author unaccented French copy; no colored top-border accent bars.

---

## Tier 0 — Stop the bleeding (revenue + trust being lost today)

### P01. Fix the Pro entitlement split that throttles paying AI users

**Why:** `netlify/functions/ai-advisor.js:69-74` has a comment saying "Check subscription tier from profiles table (source of truth)" but actually queries `rest/v1/subscriptions?user_id=…&status=eq.active` — a table with no migration in `supabase/`. Every other surface (`paystack-webhook.js`, `assets/js/pro-gate.js`, `api-profile`) uses `profiles.subscription_tier` + `subscription_expires_at`. Net effect: paying Pro users are likely metered at the free 3-calls/day AI cap — the loudest possible churn trigger. Separately, the client module `assets/js/ai/pro-monetization.js` says free = 2 briefs/day while the server says 3/day.

```text
In the AfroTools repo, fix a Pro-entitlement bug in the AI advisor.

Context: netlify/functions/ai-advisor.js line ~71 checks Pro status by querying a `subscriptions` table on the AUTH Supabase project (zpclagtgczsygrgztlts). The platform's actual entitlement source of truth is `profiles.subscription_tier` + `profiles.subscription_expires_at` (written by netlify/functions/paystack-webhook.js, read by assets/js/pro-gate.js and api-profile). The comment on line 69 even says "from profiles table" — the code contradicts it.

Steps:
1. Use the Supabase MCP (project ref zpclagtgczsygrgztlts) to check whether a `subscriptions` table exists and has live rows. Report what you find before changing code.
2. Create a shared entitlement helper in netlify/functions/_shared/ (e.g. entitlements.js) that resolves a user's tier from profiles.subscription_tier + subscription_expires_at, honoring the tier list in pro-gate (pro/premium/team/business/enterprise/admin/lifetime/trialing) and expiry.
3. Switch ai-advisor.js to that helper. Search netlify/functions/ for any OTHER function querying `rest/v1/subscriptions` and migrate those too.
4. Reconcile the AI usage caps into one shared config: server (ai-advisor.js free 3/day) vs client (assets/js/ai/pro-monetization.js free 2 briefs/day) currently disagree. One source of truth, both sides read it.
5. Add a regression test (extend tests/ai-pro-monetization.test.js or tests/ai-advisor-smart-routing.test.js) asserting that a fixture profile with subscription_tier=pro and future expiry is not rate-limited as free.

Validate: npm run test:ai, plus node tests/ai-pro-monetization.test.js. This touches a serverless function, so finish with npm run security:scan.
Acceptance: no function resolves entitlement from a `subscriptions` table; caps come from one config; new test passes; report exactly which functions changed.
```

### P02. Restore the scheduled-automation fleet and make outages page you

**Why:** `reports/live-automation-health-latest.json` (generated 2026-07-05) shows ok=19 / stale=6 / missing=10, with `scheduled-source-health-watchdog` itself stale 118h (SLA 4h) — the watchdog is down and nothing alerts. Dozens of functions last wrote 2026-06-30 (a ~12-day silent outage). `scripts/audit-automation-registry.js:10` hardcodes `C:/Users/Oza/.codex/automations`, so registry checks silently no-op in CI. There is no error tracking (no Sentry/equivalent) anywhere in `netlify/functions/`. The owner learns about breakage only by manually opening a dashboard.

```text
In the AfroTools repo, diagnose and repair the scheduled-function outage, then add always-on health alerting.

Context: reports/live-automation-health-latest.json (2026-07-05) shows 6 stale + 10 missing automations; scheduled-source-health-watchdog itself is stale 118h against a 4h SLA; many functions last wrote 2026-06-30. netlify.toml declares ~35 scheduled functions. scripts/audit-live-automation-health.js needs SUPABASE_SERVICE_ROLE_KEY and is only run manually (npm run automation:live-health:strict). scripts/audit-automation-registry.js line 10 hardcodes C:/Users/Oza/.codex/automations so its codex checks no-op in CI.

Steps:
1. Run npm run automation:live-health (ask me to export SUPABASE_SERVICE_ROLE_KEY locally if unset) to get the current stale/missing list. Compare against netlify.toml's [functions.*] schedule blocks.
2. For each stale/missing scheduled function, inspect the function source for obvious breakage (bad import, missing env var, removed shared module). The outage clustering at 2026-06-30 suggests one shared cause — find it (check _shared/ modules changed around then via git log).
3. Fix what is fixable in-repo. List anything that needs a Netlify dashboard action (env var, re-enable) for me to do manually.
4. Add .github/workflows/automation-health.yml: cron every 6 hours, runs npm run automation:live-health:strict with SUPABASE_SERVICE_ROLE_KEY from Actions secrets, and on failure opens/updates a GitHub issue titled "Automation health: N stale, M missing" (use a maintained action or gh CLI). Tell me which secret to add.
5. Fix scripts/audit-automation-registry.js to take the codex automations dir from an env var with the current path as default, and to report "codex definitions unavailable" as a visible warning instead of silently passing.

Validate: node -c on changed scripts; npm run automation:preflight; run the new workflow once via workflow_dispatch after I add the secret.
Acceptance: root cause of the June-30 outage identified and stated; every P1 automation either fixed or listed with the exact manual action needed; health check runs on a schedule off my machine and fails loudly.
```

### P03. Fix service-worker precache drift and slim the install payload

**Why:** `service-worker.js:18` precaches `navbar.min.js?v=43e4d9b2` but live pages reference `?v=01cb0562` — the cache key never matches, so the 285KB precache is dead weight and offline navigation misses its biggest asset. The precache also pins bundle hashes (`core.a7c76d68…`) independently of `scripts/cachebust.js` output, and pulls the 1.4MB `assets/js/components/tool-registry.js` at install — hostile on metered African data plans. Seven stale generations of `core.*.min.js` bundles have accumulated in `assets/js/bundles/`.

```text
In the AfroTools repo, fix service-worker precache drift and reduce install weight.

Context: service-worker.js PRECACHE hardcodes navbar.min.js?v=43e4d9b2 while pages ship ?v=01cb0562 (verify with grep on index.html) — key mismatch means the precached copy is never served. Bundle entries (core/tool-page/chat .min.js hashes) are also hardcoded and can drift from what scripts/bundle.js + scripts/cachebust.js currently emit. tool-registry.js (1.4MB) is precached at install. scripts/stamp-sw.js already rewrites CACHE_VERSION at build time.

Steps:
1. Make the precache list build-generated: extend scripts/stamp-sw.js (or a small new step in the build chain right after cachebust.js) to inject the CURRENT cachebusted URLs for navbar.min.js, footer.min.js, and the live bundle filenames from assets/js/bundles/manifest.json into service-worker.js. No more hand-pinned hashes.
2. Drop tool-registry.js from install-time precache; let it cache on first use via the existing stale-while-revalidate asset route.
3. Audit assets/js/bundles/: identify which core.*/tool-page.*/chat.* generations are still referenced by any HTML (grep) and which are orphans kept alive only by scripts/bundle.js LEGACY_BUNDLE_ALIASES (lines ~53-77). Propose (do not yet delete) a prune list.
4. Bump the SW version via the existing stamp mechanism so old caches purge.

Cautions: service-worker.js is a publish-surface file — after changes run npm run security:scan, npm run build:deploy, npm run audit:dist. Playwright blocks service workers (known repo trap), so verify manually: serve dist/ with node _serve.js, open Chrome DevTools > Application > Service Workers + Cache Storage, and confirm install succeeds and the precached navbar URL matches the page's script tag.
Acceptance: precache URLs are generated, not hand-pinned; install payload drops by >1.4MB; a screenshot or DevTools cache listing proves the navbar cache key matches.
```

---

## Tier 1 — Data trust (the moat: accurate African data)

### P04. Wire flagship tools to the live data they already pay for

**Why:** the scraper fleet works (fuel every 6h, FX every 15min, electricity daily into Supabase `live_data_store`), but `tools/fuel-tracker/index.html` reads only the static `/data/fuel/latest.json` snapshot (stamped 2026-04-15) and `tools/electricity-estimator/index.html` hardcodes a `COUNTRIES` tariff table at line ~468 (Nigeria Band A ₦225/kWh etc.). Users see April data while fresh data sits in Supabase. The cars vertical already does this right (live `/api/forex` with static fallback) — copy that pattern.

```text
In the AfroTools repo, connect flagship consumer tools to their live data APIs instead of stale static snapshots.

Context: netlify/functions/api-fuel.js and api-electricity.js serve live values from Supabase live_data_store (via _shared/data-store.js: Supabase → Netlify Blobs → static /data/*.json fallback). But tools/fuel-tracker/index.html only references /data/fuel/latest.json (April 2026 snapshot), and tools/electricity-estimator/index.html hardcodes a COUNTRIES tariff object around line 468. The cars directory (assets/js/cars-directory.js) already demonstrates the correct pattern: live /api/forex first, /data/forex/latest.json only as fallback.

Steps:
1. fuel-tracker: fetch /api/fuel on load, render from it, and fall back to the static JSON only on failure. Show the data's as-of date and source state using the existing source-confidence UI (assets/js/lib/source-confidence.js + <div class="afro-source-meta"> hooks) — the page already loads source-confidence.js.
2. electricity-estimator: move the hardcoded tariff table behind the same pattern — fetch /api/electricity, keep the current values as an inline fallback constant, and stamp the fallback with its as-of date so the UI can label it.
3. In both tools, when the fallback is used, show a visible "showing cached rates from <date> — live rates unavailable" note. No raw quality scores on public pages.
4. Sweep for the same anti-pattern: grep tools/ for other pages that reference /data/fuel/, /data/rates/, or hardcode tariff/rate tables where a live api-* function exists (check docs/API-INVENTORY.md for the function list). Fix the top 3 worst offenders; list the rest.

Validate: npm run test:live-data-status (Playwright live-data smoke), npm run check-links, and load both tools via node _serve.js checking mobile width 375px for layout overflow.
Acceptance: both tools render live values when APIs respond, degrade visibly (not silently) to the stamped fallback, and the sweep list of remaining offenders is reported.
```

### P05. Gate stale fallbacks in CI and label fallback-served data at runtime

**Why:** the committed static fallbacks ship months stale: `data/forex/latest.json` says `next_update: 2026-04-16` (~87 days overdue), `data/_meta.json` disagrees with it (`last_fetch 2026-03-15`), `data/fuel/latest.json` carries `official_verified_count: 0`. `_shared/data-store.js` knows when it served the fallback layer but never tells the client, so a Supabase+Blobs miss silently serves April rates as if current.

```text
In the AfroTools repo, make static data fallbacks impossible to ship stale silently.

Context: netlify/functions/_shared/data-store.js reads Supabase live_data_store → Netlify Blobs → committed /data/*.json fallback. Committed fallbacks are 3-4 months old: data/forex/latest.json (its own next_update is 2026-04-16), data/fuel/latest.json, data/rates/latest.json, and data/_meta.json contradicts them (last_fetch 2026-03-15). Freshness thresholds already exist in netlify/functions/api-data-freshness.js.

Steps:
1. Write scripts/refresh-static-fallbacks.js: pulls current snapshots for forex/fuel/rates/commodities from Supabase live_data_store (service key from env) and rewrites the /data/*/latest.json fallbacks plus the matching data/_meta.json entries. CRITICAL: this repo lives on an OneDrive-synced path where fs.writeFileSync can fail with UNKNOWN — write to a temp file in the same dir, then fs.renameSync over the target.
2. Write scripts/check-fallback-freshness.js: fails (exit 1) if any fallback's stamp exceeds the "stale" threshold that api-data-freshness.js defines for that dataset, and reconciles that latest.json stamps match data/_meta.json. Wire it into the ci.yml verify steps (NOT into the 41-step build chain).
3. Add a weekly GitHub Actions workflow (pattern: .github/workflows/source-ledger-refresh-pr.yml, which already opens PRs via peter-evans/create-pull-request) that runs the refresh script and opens a "refresh static data fallbacks" PR.
4. In data-store.js, include served_from: "live"|"blob"|"fallback" and as_of in what getData returns, and pass it through in api-forex.js, api-fuel.js, api-electricity.js responses so clients can label staleness (P04's banner consumes this).
5. Run the refresh once now so the committed fallbacks are current.

Validate: node tests/live-data-contracts.test.js, npm run fuel:sources:check, node -c on new scripts. Functions changed → npm run security:scan.
Acceptance: CI fails if a fallback goes stale; API responses expose served_from + as_of; committed fallbacks are fresh as of today; weekly PR automation exists.
```

### P06. Scale source-confidence from 13 tools to every money tool

**Why:** the confidence system is built and user-visible (`assets/js/lib/source-confidence.js`, 5 confidence levels, `afro-source-meta` hooks, `docs/source-confidence-model.md`) but `data/source-registry.json` has **13 entries** — for a 2,600-tool platform — with zero `official_verified`. Only 7 of 53 PAYE engines in `netlify/functions/_engines/` carry a `lastUpdated`. This is the cheapest available differentiation: competitors don't show provenance; AfroTools built the machinery and then didn't turn it on.

```text
In the AfroTools repo, scale the source-confidence registry from 13 entries to the full money-tool surface.

Context: data/source-registry.json currently has 13 entries (zero official_verified). The rendering layer exists (assets/js/lib/source-confidence.js, <div class="afro-source-meta"> hooks, docs/source-confidence-model.md's 5 levels). Source truth already exists elsewhere: data/government/official-sources.json (67 sources), data/transport/official-sources.json, data/calculation-quality/formula-registry.json, data/_meta.json. Only 7/53 netlify/functions/_engines/*-paye.js carry lastUpdated.

Steps:
1. Stamp all 53 PAYE engines: add lastUpdated, sourceCheckedOn, and nextReviewDate fields to each _engines/*-paye.js metadata block (follow the 7 that already have stamps). Derive dates from data/calculation-quality/golden-fixtures.json formulaVersion stamps and docs/AFROTAX-SOURCE-REVIEW.md; where unknown, use the formulaVersion date and flag it "needs-review" in a report, never invent a check date.
2. Write scripts/build-source-registry.js: generates data/source-registry.json entries for the top money tools by merging formula-registry.json (PAYE/VAT/social security), the fuel/forex/rates _meta, and the government/transport ledgers. Target ≥100 registered tools: all PAYE calculators, VAT tools, import-duty, fuel, electricity, remittance. Confidence level per docs/source-confidence-model.md; mark official_verified ONLY where the ledger shows an ok official source with a checked date — when in doubt use "reviewed".
3. Wire the afro-source-meta block into the tool page templates for those tools where it's missing (sample 5 first and show me the diff pattern before batch-applying; prefer a script for the batch edit).
4. Extend scripts/audit-public-claims.js (or a new audit) to WARN when a money-category tool has no source-registry entry, so coverage ratchets up instead of decaying.

Cautions: OneDrive path — temp-file + renameSync in any Node script that writes. No raw quality scores on public pages. Batch HTML edits: no tags inside template literals, test one page per category first.
Validate: node tests/source-confidence.test.js, npm run test:calculation-quality, npm run audit:public-claims, npm run check-links after batch edits.
Acceptance: 53/53 engines stamped; source-registry ≥100 entries with honest levels; audit warns on unregistered money tools; 5 representative pages render the meta block correctly on mobile.
```

### P07. Decouple the AI advisor's hardcoded rates from prompt text (risk R3)

**Why:** `docs/TECHNICAL-RISK-REGISTER.md` R3 (P1): `ai-advisor.js` embeds ~1,068 lines of `TOOL_CONTEXT` prompt strings (lines 212–1279) containing tax bands, remittance corridors, and property rates that are **not coupled** to `data/calculation-quality/formula-registry.json` or the source ledgers. The AI can confidently repeat a stale rate even after the calculator was corrected. This also makes the function 170KB and prompts unreviewable.

```text
In the AfroTools repo, externalize and source-couple the AI advisor's TOOL_CONTEXT (risk register R3).

Context: netlify/functions/ai-advisor.js lines ~212-1279 hardcode per-tool prompt context with domain rates (tax bands, corridors, tariffs) that drift from the versioned data in data/calculation-quality/formula-registry.json, data/_meta.json, and netlify/functions/_engines/*-paye.js. docs/TECHNICAL-RISK-REGISTER.md R3 rates this P1. AGENTS.md's AI rules: deterministic data, structured schemas, no invented claims.

Steps:
1. Move the static prose part of TOOL_CONTEXT into data/ai/tool-context/ as one JSON file per tool key (keep the exact current text as the starting content). ai-advisor.js loads them at cold start (bundled via require of a single generated index to avoid runtime fs reads in the function).
2. Write scripts/build-ai-tool-context.js: for tools whose facts exist in formula-registry.json / _engines metadata / data/_meta.json, inject the CURRENT values + a source label + as-of date into the per-tool context at build time, replacing the hand-typed numbers. Hand-typed numbers may remain only where no structured source exists — mark those blocks "unverified-static" in the JSON.
3. Add a drift test: for 5 representative tools (Nigeria PAYE, Kenya PAYE, a VAT tool, fuel, remittance), assert the numbers in the generated context match the engine/registry values, so a rate update that forgets the AI context fails CI.
4. Wire the build script into the build chain next to the other ai:* generators, and add it to the npm scripts (ai:tool-context).
5. ai-advisor.js should shrink dramatically — confirm the function still deploys under Netlify size limits and behaves identically for a sample prompt (tests/ai-advisor-smart-routing.test.js).

Validate: npm run test:ai (the full AI suite), node -c netlify/functions/ai-advisor.js, npm run security:scan.
Acceptance: no numeric domain facts live inline in ai-advisor.js; regenerating data regenerates AI context; drift test fails when an engine rate changes without a context rebuild; function size reported before/after.
```

---

## Tier 2 — Revenue (a solo builder's leverage order)

### P08. Ship self-serve API billing (Growth $149 / Pro $499)

**Why:** `api/pricing.html` advertises Free → Growth $149/mo → Pro $499/mo → Enterprise, but every paid tier routes to `/business-enquiry` (manual sales). The plumbing already exists: key issuance (`netlify/functions/afrowork-api-keygen.js`, SHA-256-hashed keys in Blobs), plan limits (`netlify/functions/_shared/api-plans.js`), usage metering (`afrowork-api-usage.js`), and live Paystack subscription machinery (`create-subscription.js`, `paystack-webhook.js`). Also: keygen returns `callsLimit:100` while pricing advertises "100/day + 3,000/mo" — an inconsistency that will surface in a paid context.

```text
In the AfroTools repo, wire self-serve billing for the paid API tiers.

Context: api/pricing.html sells Growth ($149/mo) and Pro ($499/mo) via manual /business-enquiry only. Existing plumbing: afrowork-api-keygen.js issues hashed keys with plan "free"; _shared/api-plans.js defines plan limits; afrowork-api-usage.js meters; create-subscription.js + paystack-webhook.js already run Pro subscriptions ($5/mo) end-to-end with HMAC-verified webhooks writing to Supabase profiles.

Steps:
1. Read docs/API-INVENTORY.md, api/pricing.html, _shared/api-plans.js, afrowork-api-keygen.js, create-subscription.js, paystack-webhook.js first and produce a short plan of the flow you'll build (checkout → webhook → key plan upgrade → limits). Show me the plan before implementing.
2. Implement: an authenticated "upgrade API plan" path that creates a Paystack subscription for the API plan (new plan codes — tell me exactly which plan codes/amounts to create in the Paystack dashboard), and on charge.success the webhook upgrades the caller's API key record to the purchased plan (and downgrades on cancellation/dispute, mirroring the existing Pro tier lifecycle).
3. Fix the limits inconsistency: keygen's callsLimit:100 vs pricing's "100/day + 3,000/mo". Make _shared/api-plans.js the single truth for per-plan daily+monthly limits and have keygen + usage + rate-limit read it.
4. Update api/pricing.html so Growth/Pro have a real purchase CTA (keep Enterprise as /business-enquiry). Label clearly; no fake claims.
5. Add tests following tests/api-tool-catalog.test.js patterns: plan resolution, limit enforcement per plan, webhook upgrade path with a fixture event.

Cautions: never log or echo full API keys or Paystack secrets; webhook must verify HMAC exactly like paystack-webhook.js does. This is a payment path — keep the diff reviewable and flag anything you're unsure about instead of guessing.
Validate: npm run test:api-catalog, new tests, npm run security:scan, npm run build:deploy + npm run audit:dist (publish surface changed).
Acceptance: a sandbox-mode end-to-end walkthrough documented step by step (what I click, what fires, what row changes), single source of plan limits, pricing page CTAs live.
```

### P09. Productize the SalaryPadi integration into a repeatable partner-API offer

**Why:** the SalaryPadi partnership shipped 2026-07-11 (`docs/SALARYPADI-INTEGRATION-CONTRACT.md` v1.0.0: scoped `x-api-key` service key, 10k req/day, scoped endpoints, ETag caching) — it's the first named B2B customer and a clean template. The 50K plan (`docs/50K-OUTBOUND-SPRINT-PLAN.md`) targets fintechs/HR/payroll segments that want exactly this. Each additional partner is high-ACV recurring revenue at near-zero marginal build cost.

```text
In the AfroTools repo, generalize the SalaryPadi partner integration into a repeatable "AfroTools Partner API" product.

Context: docs/SALARYPADI-INTEGRATION-CONTRACT.md v1.0.0 defines the shipped pattern: server-only scoped key (SALARYPADI_API_KEY), scopes (catalog:tools, tax:paye, tax:rates, fx:rates, countries, career:*), 10k/day limits, ETag/conditional caching, error envelope {error,code,docs}. Currently the key + scopes are bespoke (env var + hardcoded checks). docs/50K-OUTBOUND-SPRINT-PLAN.md lists the buyer segments this sells to.

Steps:
1. Refactor partner auth into _shared/partner-auth.js driven by a registry (data/partners/partner-registry.json or Supabase table — pick based on how SALARYPADI_API_KEY is checked today) where each partner has: id, hashed key env-var name, scopes, daily limit, contact. SalaryPadi becomes registry entry #1 with zero behavior change (existing contract tests must stay green).
2. Make the per-partner catalog endpoint generic: GET /api/v1/catalog/tools?product=<partnerId> serving each partner's scoped tool subset.
3. Write docs/PARTNER-API-PLAYBOOK.md: how to onboard a partner in <1 hour (registry entry, key generation, scope grant, contract doc template cloned from the SalaryPadi one, smoke checklist).
4. Create a public-facing /partners/ page (reuse the tool-landing.css shell + existing B2B page patterns like /for-fintechs/) describing the offer: what data (PAYE 53 countries, VAT, FX, fuel, catalog), SLAs honestly stated, pricing "from $X/mo — contact", CTA to /business-enquiry with a partner-api intent param. No invented claims (audit:public-claims must pass).
5. Keep the SalaryPadi PAYE contract tests green: node tests/api-tax-salarypadi.test.js, tests/api-tax-routing.test.js, tests/api-tool-catalog.test.js.

Validate: those three test files + npm run test:api-docs + npm run audit:public-claims + npm run security:scan.
Acceptance: adding a hypothetical second partner is a registry entry + env var (demonstrate with a "demo" partner in tests); SalaryPadi behavior byte-identical; playbook + public page shipped.
```

### P10. Pick ONE Pro app shell and take it to Active

**Why:** `docs/PRO-APP-READINESS.md`: Payroll is the only Active Pro app; ~20 others are waitlist shells (`data-pro-waitlist-host`). Seller is furthest along (Supabase migration 047 `afroseller-social-commerce-schema` applied; `scripts/verify-afroseller-pro.js` exists). Effort spread across 23 shells converts nowhere; one more Active app doubles the Pro catalog's real value. Waitlist counts + GA4 events (`pro_app_open`) tell you which app has demand.

```text
In the AfroTools repo, promote one Pro app from waitlist shell to Active, chosen by demand evidence.

Context: docs/PRO-APP-READINESS.md is the truth sheet — only Payroll is Active. Non-Payroll apps show waitlist capture (data-pro-waitlist-host) and must not claim account sync until real. AfroSeller has its schema applied (supabase migration 047); AfroTax/Books/HR schemas exist but are marked unapplied (supabase/next-*-schema.sql). Pro entitlements: profiles.subscription_tier; gating via assets/js/pro-gate.js; registries in assets/js/lib/pro-app-registry.js + pro-plan.js.

Steps:
1. Evidence first: query the waitlist storage (find where data-pro-waitlist-host submissions land — likely a Netlify function + Supabase table or Blobs) and count signups per app. Cross-check GA4 pro_app_open events if accessible from repo-side dashboards (data/ai/ traction reports). Report the ranking and recommend ONE app (bias to AfroSeller if demand is comparable, since migration 047 is already applied).
2. For the chosen app, write the gap list to "Active" per the Payroll bar: account-backed tables applied and RLS-verified (use Supabase MCP against the correct project — AUTH zpclagtgczsygrgztlts vs DATA jbmhfpkzbgyeodsqhprx per supabase/migrations/README.md), workspace sync wired (assets/js/lib/workspace-sync.js), honest copy (no filing/payment-execution claims), Pro gate on, docs/AFRO*-QA.md checklist runnable.
3. Implement the gaps. Keep localStorage mode working as the free preview; account sync becomes the Pro differentiator.
4. Update docs/PRO-APP-READINESS.md status row + docs/CHANGELOG-PRO.md, flip the app's card from waitlist to Active in pro/index.html + pro-app-registry.js, and swap the waitlist host for real onboarding.
5. Extend scripts/verify-<app>-pro.js from static checks to at least one runtime smoke (Playwright, pattern: tests/e2e/afropayroll-pro.spec.js).

Cautions: migrations must target the right Supabase project (README maps them); no invented compliance/filing claims (npm run audit:public-claims must stay green).
Validate: npm run pro:verify, the app's QA fixture script (e.g. npm run afroseller:qa), new Playwright smoke, npm run audit:public-claims.
Acceptance: readiness matrix shows a second Active app with account-backed data verified live; waitlist emails for that app get a "we're live" trigger listed for me to send via the lifecycle engine.
```

### P11. Wire the lifecycle-email engine to the conversion funnel (and surface AfroPoints → Pro)

**Why:** both halves exist but don't talk: a mature email fleet (`send-onboarding-nudges`, `send-lifecycle-email`, `_shared/lifecycle-email.js`, dedup + preference migrations 038/039/043/045) and a fully instrumented funnel (`ai_rate_limited`, `calculation_abandoned`, `pro_upsell`, `pro_view_pricing`, `pro_checkout_success` in `assets/js/lib/analytics.js`). Meanwhile the strongest retention loop — AfroPoints `pro_credit` (500 pts = 1 month Pro, instant, in `afropoints-cashout.js`) — is buried instead of being the headline path from free power-user to subscriber.

```text
In the AfroTools repo, connect conversion-funnel events to lifecycle emails and surface the AfroPoints-to-Pro path.

Context: email senders exist (netlify/functions/send-lifecycle-email.js, send-onboarding-nudges.js, _shared/lifecycle-email.js with dedup via migrations 038/039/043/045). GA4 events exist client-side (ai_rate_limited, calculation_abandoned, pro_upsell, pro_view_pricing) but GA4 can't trigger emails. AfroPoints pro_credit redemption (500 pts = 1 month Pro, instant, extends subscription_expires_at) lives in netlify/functions/afropoints-cashout.js. AGENTS.md monetization rules: opt-in only, no gates on primary export paths, metadata-only analytics.

Steps:
1. Server-side signal capture: for logged-in, email-opted-in users only, record high-intent moments where the SERVER already sees them — ai-advisor.js rate-limit rejections (ai_rate_limited) and pro-gate profile checks — into the existing behavior-automation state (migration 045 pattern). Do NOT start logging new PII; user id + event type + timestamp only.
2. Add two lifecycle sequences to the existing engine: (a) hit-the-AI-limit → next-day email "you hit the free AI limit — Pro is unlimited, or redeem 500 AfroPoints for a free month"; (b) pro_view_pricing without checkout within 3 days → one follow-up with the $30/yr annual framing. Respect existing preference/dedup tables; unsubscribe must work (email-unsubscribe.js).
3. Surface AfroPoints→Pro in product: on /dashboard/ and in the pro-gate upsell card, show current points balance with "N pts → free Pro month at 500" (read from the existing afropoints-account function). Keep it one quiet line, not a banner — design doctrine says calm, no decorative accents.
4. Add the send triggers to the scheduled lifecycle function's decision loop rather than creating new scheduled functions (netlify.toml already has ~35).

Cautions: consent + preference checks before ANY send; no sensitive content in emails; keep analytics event names stable.
Validate: node tests/scheduled-event-auth.test.js, tests/scheduled-proof.test.js, any lifecycle tests present; npm run security:scan. Show me the two email templates' copy for approval BEFORE enabling sends — do not enable them yourself.
Acceptance: sequences implemented behind a flag, templates presented for my approval, dashboard + upsell show the points path, zero new PII logged.
```

### P12. Monetize the distribution edges: widget CTA, AfroStream bridges, published sponsor rate card

**Why:** three built distribution channels currently convert nothing: (1) widgets (`widgets/embed.js` + iframe fleet, `widget-track.js` beacon already measures partner-site reach) carry no product CTA; (2) AfroStream (rankings, creator profiles, news — the designated "marketing flywheel") doesn't bridge to creator-suite tools or Pro; (3) `advertise/index.html` is a "contact us" pitch with no published rates or booking path, while `affiliate_click` is instrumented in analytics with zero affiliate links deployed.

```text
In the AfroTools repo, add conversion paths to the three distribution surfaces that currently have none.

Context: widgets/embed.js renders partner-site embeds (tracked by netlify/functions/widget-track.js); AfroStream pages (tools/afrostream/) rank African creators with big shareable pages; advertise/index.html + media-kit/ + sponsored-tools/ pitch sponsorships with no rates or booking form; assets/js/lib/analytics.js already has affiliate_click. AGENTS.md monetization rules: clear labeling, no sponsor influence on calculations, opt-in handoffs.

Steps:
1. Widgets: add a small "Powered by AfroTools" footer link in embed output with UTM params (utm_source=widget&utm_medium=embed&utm_campaign=<widget-id>) linking to the matching tool page. Make it tasteful, always-on for free tier. Note in /widgets/ marketing that Widget Pro removes it (matches the existing Widget Pro pitch). Rebuild with npm run widgets:build and npm run seo:widgets.
2. AfroStream bridges: on creator profile pages, add a labeled module "Tools for creators" linking creator-suite tools (invoice, pricing, split, kit) with UTMs; on ranking pages, one line linking the AfroStream University monetization content. Reuse related-tools/cross-tool-nav patterns; no new UI primitives.
3. Sponsorships: turn advertise/index.html into a real product page: published indicative rate ranges (mark "indicative — confirmed on enquiry"; get numbers from docs/50K-OUTBOUND-SPRINT-PLAN.md / media-kit if present, otherwise propose placeholders for me to confirm BEFORE publishing), inventory list (newsletter, sponsored tool, category pilots per the 50K plan), and a booking form posting to the existing business-enquiry function with a "sponsorship" intent.
4. Affiliates: propose (do not deploy) 3 candidate affiliate categories that fit AGENTS.md rules (e.g. VPN/hosting on developer tools; NOT loans/gambling), with exact target pages. I'll approve before any link ships.

Cautions: every sponsored/affiliate element visibly labeled; calculators' outputs untouched; npm run audit:public-claims must pass (no traffic/customer claims).
Validate: npm run widgets:build, npm run check-links, audit:public-claims, and a Playwright/manual check of one embed rendering the new footer.
Acceptance: embeds carry the CTA, AfroStream bridges live with UTMs, advertise page has rates + working booking form, affiliate proposal delivered as a list (nothing deployed).
```

---

## Tier 3 — Growth (traffic and AI-search)

### P13. Finish the structured-data sweep (865 + 1,192 pages) and fix schema bugs

**Why:** on 1,957 `tools/**/index.html` pages: WebApplication schema on only 1,092 (865 missing), FAQPage on 765 (1,192 missing), BreadcrumbList on 1,743 (214 missing). Bugs: `tools/gpa-calculator` carries **doubled** JSON-LD (2× each type); 1,883 orphan `HowToStep` nodes exist with only 21 `HowTo` wrappers. `scripts/add-webapplication-schema.js` already exists — it just stopped at 56%. This upgrades pages that already rank; it's the highest ratio of impact to effort in the growth tier.

```text
In the AfroTools repo, complete structured-data coverage across tool pages and fix the JSON-LD defects.

Context (measured): of 1,957 tools/**/index.html — WebApplication on 1,092, FAQPage on 765, BreadcrumbList on 1,743. tools/gpa-calculator/index.html has DUPLICATED JSON-LD blocks (2x WebApplication/FAQPage/BreadcrumbList). 1,883 HowToStep nodes exist but only 21 HowTo wrappers (orphans from an old template). scripts/add-webapplication-schema.js exists; SEO pipeline scripts live in scripts/build-seo-system.js and scripts/seo-daily-fix.js.

Steps:
1. First fix the injector bugs: find why gpa-calculator (and grep for others) got double-injected — the script must be idempotent (detect existing @type before inserting). Add a dedupe pass that removes exact-duplicate JSON-LD blocks site-wide.
2. Repair orphan HowToSteps: either wrap them in a valid HowTo (name + steps) where the page genuinely has how-to content, or strip them. Decide per template family, not per page — find the generator/template that emitted them.
3. Extend the WebApplication injector to the 865 uncovered tool pages: name/description from the page's existing title/meta, offers price 0, operatingSystem "Web". Idempotent, script-driven (never hand-edit 865 files).
4. FAQPage: cover the subset of the 1,192 that already have visible FAQ markup in HTML (grep for the FAQ section classes used by the covered 765) — schema must mirror on-page content, never invent Q&A. Report how many pages genuinely have FAQs vs not.
5. BreadcrumbList for the remaining 214.
6. Regenerate downstream: npm run seo (canonical/alias fixes) and npm run sitemap.

Cautions: batch HTML edits are dangerous here — run on 5 pages first, show me the diff, then batch. Localized mirrors (fr/sw/ha) get their schema from their own build pipeline — touch ONLY English tools/ pages in this pass and note what the i18n pipeline needs to inherit.
Validate: npm run check-links, spot-validate 5 pages' JSON-LD (parse each script tag with JSON.parse in a node one-liner), npm run seo:report.
Acceptance: coverage counts re-measured and reported (target: WebApplication ≥95%, BreadcrumbList ≥99%, FAQPage = every page with real FAQ content, zero duplicate blocks, zero orphan HowToSteps).
```

### P14. Close the French long-tail (~1,560 pages) and the Swahili 255

**Why:** `docs/french-localization-repair.md:67` — FR tool coverage ≈ 40%; ~1,560 English tool pages have no French route, in the largest addressable language market (~180M speakers). `docs/swahili-completeness-goal.md` lists exactly 255 missing SW tools (lines 89–344). The pipeline, validators, and route contracts all exist (`npm run build:i18n`, `fr:surface:build`, `sw:surface:build`, `validate-hreflang`, route-contract tests) — this is execution, not invention. `sitemap-fr.xml` is already the largest sitemap (3,172 URLs) proving the pattern indexes.

```text
In the AfroTools repo, run the next French + Swahili coverage waves using the existing localization pipeline.

Context: docs/french-localization-repair.md says ~1,560 EN tool pages lack FR routes (~40% coverage); docs/swahili-completeness-goal.md lists 255 missing SW tools explicitly (lines 89-344). Pipeline: scripts/build-i18n.js, npm run fr:surface:build / sw:surface:build, locale truth in data/registry/locale-manifest.json + locale-coverage-policy.json, validation via npm run validate:hreflang + tests/route-contract.test.js. Known traps: NEVER author unaccented French; SW tree has English-slug leak dirs (sw/tools/, sw/fintech/, sw/salary-tax/) and SW_SLUG_TO_EN collisions (see project memory + docs/swahili-completeness-goal.md); language-switcher must never prefix-swap URLs; _redirects catch-alls must stay LAST.

Steps:
1. Read docs/french-localization-repair.md end-to-end and report the intended wave mechanism (it defines the repair/expansion pipeline). Then generate the NEXT French wave — size it at roughly the top 300 unmapped EN tools by traffic value (use data/tool-directory.json priority + salary-tax/finance categories first), not all 1,560 at once.
2. Run the wave through the pipeline (build:i18n / fr:surface:build as the doc prescribes), then npm run route:sync so sitemaps + route contract + counts regenerate together.
3. For Swahili: take the first 100 tools from the missing list in docs/swahili-completeness-goal.md, same procedure via sw:surface:build. Fix nothing about the English-slug legacy dirs in this pass, but list them.
4. Validate hard: npm run validate:hreflang, node tests/route-contract.test.js, npm run test:fr-surface, npm run test:sw-surface, and spot-read 5 generated FR pages to confirm accented, elided copy (une accented-French sanity pass; flag any textMap-shim leakage per the swahili/french leak workflow docs).
5. Report new coverage: FR x/1957, SW x/671, sitemap URL deltas.

Cautions: generated pages are pipeline outputs — never hand-edit them; if copy quality is bad, fix the map/pipeline. Do not touch _redirects ordering. Never hardcode tool counts anywhere.
Acceptance: wave shipped through the pipeline with all validators green, coverage numbers reported before/after, and a wave-2 plan (next batch + estimated sessions to 100%) written at the end.
```

### P15. Refresh GEO/AI-search surfaces: auto-generate llms.txt from the registry

**Why:** the AI-crawler posture is already right (robots.txt allows GPTBot/OAI-SearchBot/ClaudeBot/PerplexityBot; blocks training-only bots; `llms.txt` + `llms-full.txt` exist; IndexNow auto-submits on deploy). But `llms.txt` is hand-written and stale: it advertises **"1,110+ tools"** against 2,515 sitemap tool URLs and lists only 10 tools. For AI-answer engines this file is the front door — it's underselling the catalog by 60%.

```text
In the AfroTools repo, make llms.txt and llms-full.txt generated artifacts that can't go stale.

Context: llms.txt (root, 2.2KB) says "1,110+ tools" and lists 10 tools; the site has 2,515 EN tool URLs and ~9,000 indexable URLs. llms-full.txt (63KB) is richer but also hand-maintained. Truth sources: data/tool-directory.json (1,248 entries), assets/js/components/tool-registry.js, data/registry/locale-manifest.json, scripts/update-counts.js (the ONLY legitimate source of public counts — never hardcode). robots.txt AI posture is correct; leave it alone.

Steps:
1. Write scripts/build-llms-txt.js generating both files from the registries: llms.txt = brand one-liner, dynamic counts via the update-counts source, top ~30 tools by priority across categories with one-line descriptions + absolute afrotools.com URLs, category hub list, API + docs pointers, languages line (EN/FR/SW/HA/YO from locale-manifest). llms-full.txt = the full tool directory grouped by category with descriptions.
2. Style constraints for the generator's copy: plain factual sentences (these files get quoted verbatim by AI engines), no marketing superlatives, and nothing that violates the public-claims registry (run npm run audit:public-claims after).
3. Wire into the build chain adjacent to scripts/generate-sitemaps.js and add npm script llms:build. OneDrive caution: temp-file + renameSync.
4. Regenerate now and diff against the old files; keep anything hand-authored that's still true and can't be derived (put it in a template header the generator preserves).
5. Bonus if quick: check whether the og-image edge function (netlify.toml) could serve per-tool OG images for the 1,714 pages currently on og-default.png — don't implement, just report feasibility and what it would take.

Validate: node scripts/build-llms-txt.js twice (idempotent output), npm run audit:public-claims, curl-check both files serve correctly after npm run build:deploy via audit:dist.
Acceptance: counts in llms.txt derive from the registry, tool list ≥30 with real URLs, both files regenerate in the build, OG feasibility note delivered.
```

### P16. Server-render the internal link graph + a no-JS all-tools directory (risk R4)

**Why:** two crawlability holes with one shape: (1) related-tool links come from `assets/js/components/related-tools-data.min.js` (477KB) rendered client-side — the horizontal link graph across 676 tools is invisible in static HTML, weakening PageRank flow to the long tail; (2) risk register R4 (P1): `/all-tools/` shows no useful directory without JavaScript, so the canonical catalog page is thin for crawlers and broken for no-JS users. `scripts/inject-internal-links.js` already server-renders hub→child links — extend the pattern.

```text
In the AfroTools repo, make internal linking crawlable: static related-tools links on tool pages and a real no-JS /all-tools/ directory (risk register R4).

Context: scripts/build-related-tools-data.js emits AFRO_RELATED_TOOLS consumed client-side by assets/js/components/related-tools.js — related links never appear in static HTML. scripts/inject-internal-links.js already injects static hub→child links at build time (safe pattern to extend). /all-tools/ renders its directory via JS only (docs/TECHNICAL-RISK-REGISTER.md R4, Impact 4 / Breadth 5). data/tool-directory.json (1,248 entries) and the progressive-directories system (scripts/build-progressive-directories.js + tests) are the data sources.

Steps:
1. Extend the internal-link injection: at build time, render each tool page's top 4-6 related tools as a static <nav> list (plain links, existing related-tools section styling) in the HTML, marked so the JS component ENHANCES rather than duplicates it (e.g. data-ssr="1" attribute the component checks). Idempotent, script-driven.
2. /all-tools/: server-render the full categorized directory as static HTML at build time from data/tool-directory.json (category-grouped lists of plain <a> links — cheap HTML, fine at 1,248 entries), keeping the existing JS search/filter as progressive enhancement on top. Follow how scripts/build-progressive-directories.js structures its output.
3. Re-check page weight: with links now in HTML, evaluate whether related-tools-data.min.js (477KB, loaded on 671 pages) can shrink to a small per-page slice or lazy-load on interaction — implement if straightforward, otherwise report the plan (ties into the payload-diet prompt P17).
4. Regenerate: the injection scripts run inside npm run build — run the relevant sub-steps (node scripts/build-related-tools-data.js && node scripts/inject-internal-links.js) plus npm run sitemap.

Cautions: canonical/SEO invariants must hold (npm run seo after); batch HTML mutation → sample 5 pages, show diff, then run the batch; localized trees get this from their own pipeline, English first.
Validate: node tests/progressive-directories.test.js, npm run check-links, npm run seo:report, view-source check (not DevTools) on 3 tool pages + /all-tools/ confirming links exist without JS.
Acceptance: related links + full directory visible in raw HTML with JS disabled; R4 can be marked mitigated in docs/TECHNICAL-RISK-REGISTER.md (update it); page-weight delta reported.
```

---

## Tier 4 — Performance & platform drag

### P17. The sitewide payload diet (navbar 285KB, related-tools 477KB, unminified CSS/JS refs)

**Why:** measured on-disk: `navbar.min.js` = 285KB **on every one of 10,406 pages**, embedding the full 1,269-link mega-menu plus a complete copy of the theme token CSS as JS strings (178 `--color-*` declarations vs 79 in `tokens.css`). `related-tools-data.min.js` = 477KB on 671 pages. `tools/currency-converter` loads the **unminified** `navbar.js` (358KB) + `footer.js`; tool pages load the 100KB unminified `design-system.css` render-blocking while `design-system.min.css` (75KB) sits unused; `/search/` fetches a 1.39MB index whole. On low-end Android (the core audience), parse cost scales with uncompressed bytes — this is the biggest UX lever on the whole site.

```text
In the AfroTools repo, execute a sitewide payload diet. Work in this order, verifying each stage before the next.

Stage 1 — fix wrong references (pure win, no refactor):
1. Find every page referencing unminified shared assets: grep for "components/navbar.js", "components/footer.js", "design-system.css" (non-.min), "global.css" (non-.min) across HTML. tools/currency-converter/index.html is a known offender (loads navbar.js 358KB unminified).
2. Point them at the .min equivalents via script (scripts/minify.js defines the source→min pairs; scripts/update-html-bundles.js shows the reference-rewrite pattern). Respect the cachebust ?v= scheme (scripts/cachebust.js).

Stage 2 — navbar diet (biggest lever):
3. assets/js/components/navbar.js embeds (a) theme CSS strings (~178 --color-* declarations) and (b) ~1,269 nav hrefs. Per project memory, dark-mode.js injects the AUTHORITATIVE theme CSS — navbar's embedded copy duplicates tokens.css/theme-dark.css. Extract: theme CSS moves to the existing CSS files (verify visual parity in BOTH themes before deleting the JS copy — dark-mode.js is authoritative, tokens.css/design-system load order matters); nav link data moves to a build-generated JSON (assets/js/components/navbar-data.json) fetched on first menu open, with the top-level categories inline so first paint is instant.
4. Target: navbar.min.js under 60KB. Measure and report before/after.

Stage 3 — related-tools + search index:
5. If P16 (static related links) has landed, shrink related-tools-data.min.js: per-page slice injected at build or lazy-fetch on scroll into view. If P16 hasn't landed, do the lazy-fetch only.
6. Split data/search-index.json (1.39MB): a slim first-load index (title/route/category, ~200KB) + full-text shard lazy-loaded after first keystroke. search/index.html fetch logic adapts.

Stage 4 — regenerate + prove:
7. npm run minify && npm run bundle && node scripts/update-html-bundles.js && node scripts/cachebust.js && node scripts/stamp-sw.js (or the equivalent build sub-chain — read package.json build order first). Note the .min EPERM workaround from memory: minify writes can hit EPERM on OneDrive — temp-file + rename.
8. Report a before/after table: bytes parsed on (a) homepage, (b) a tool page, (c) /search/, at 375px mobile. Verify no visual regressions in light AND dark mode on 3 sample pages, and npm run mobile:audit for overflow.

Cautions: navbar/footer are web components on all 10,406 pages — a break here breaks everything. Make stage 2 its own commit with a rollback note. Do not change brand colors (#0062CC family) while extracting theme CSS.
Validate: npm run check-links, npm run test:playwright:smoke, manual dual-theme check, mobile:audit.
Acceptance: zero unminified shared-asset references; navbar payload target hit or the blocker explained; search first-load under 300KB; before/after table delivered.
```

### P18. Restore `engines/` source and standardize function hardening

**Why:** all 128 `engines/*.js` files are single-line minified IIFEs with **no source tree anywhere in the repo** — the calculation cores of the product are unreviewable and undiffable (`afroatlas-engine.js` 86KB, `business-planner-engine.js` 67KB). Separately, in `netlify/functions/`: only 36/176 functions apply rate limiting despite `_shared/rate-limit.js` existing, 30 have no try/catch, and 103 read `process.env` ad hoc — a real abuse gap on public endpoints (and `api-afropayroll.js` is a 3,256-line monolith).

```text
In the AfroTools repo, two maintainability tracks. Do them as separate commits.

Track A — give engines/ a source of truth:
1. Confirm the situation: engines/*.js are 128 committed minified files; scripts/minify.js does not build them; no engines source exists (search for any engines-src, src/, or per-tool source candidates before proceeding — report what you find).
2. Recover readable source: un-minify each engine (js-beautify via npx, or node --experimental strip + terser's beautify) into engines/src/<name>.js. These stay functionally identical — verify by re-minifying with the repo's terser config and diffing semantics (byte-identity won't hold; instead run each pair through node -c and, for the 6 largest engines, execute a smoke that loads the module in a jsdom-free context and checks the window global it attaches).
3. Add engines to the minify pipeline: scripts/minify.js maps engines/src/*.js → engines/*.js. From now on engines/*.js are build outputs — document that in AGENTS.md's generated-files section (edit the "Sources Of Truth" list).
4. Do NOT reformat/refactor the recovered source in this pass — recovery only, so diffs stay reviewable.

Track B — standardize function hardening:
5. Create netlify/functions/_shared/with-api.js: wrapper(handler, {rateLimit, auth, name}) providing try/catch with the standard error envelope {error, code, docs}, rate limiting via _shared/rate-limit.js, and env access via one _shared/env.js accessor that validates required vars at cold start.
6. Roll it out to the 20 highest-traffic public api-* functions first (pick by netlify.toml redirects + docs/API-INVENTORY.md), preserving each function's current status codes and response shapes exactly — contract tests must stay green (tests/api-*.test.js).
7. Report the remaining unwrapped functions as a checklist for future waves. Do not touch paystack-webhook.js or auth-session.js in this pass (payment/auth surfaces need their own careful review).

Validate: Track A — node -c on all recovered+rebuilt engines, npm run check-links, load 3 tool pages exercising rebuilt engines via node _serve.js. Track B — npm run test:api-career, test:api-catalog, node tests/api-ai-route.test.js, npm run security:scan.
Acceptance: engines have committed readable source + build step + AGENTS.md updated; 20 functions wrapped with contracts green; wave checklist delivered.
```

### P19. Break the build/test monoliths, enroll the orphaned tests, wire e2e into CI

**Why:** `npm run build` is a 41-step `&&` chain and `npm test` a 75-step chain (package.json lines 110/126) — one hang blocks everything, with no `timeout-minutes` in `ci.yml` (GitHub default: 6 hours). 50 of 118 unit tests are orphaned (never run anywhere), including all solar-roi, matchday, and car-import suites; 31 of 32 Playwright specs have no CI trigger. `seo-daily-fix.js` runs inside `build`, injecting date-stamped output that the "git diff clean" CI step then checks — a known intermittent-red source. `verify-deploy-channel.js` (fail-closed release guard) is never invoked by CI. Plus ~800KB of tracked root junk (`SITE-AUDIT-REPORT.md` 248KB, `missing-entries*` 197KB, old `*_PROMPT.md` files, `afrotools-sentinel (1).tar.gz`, the nested sentinel project with its dead workflow).

```text
In the AfroTools repo, restructure the build/test pipeline and clean tracked junk. Four commits, in this order.

Commit 1 — test enrollment:
1. Replace the 75-step npm test chain: a small runner script (scripts/run-tests.js) that globs tests/*.test.js and executes them (node:test runner if the files are compatible — check 3 first; otherwise spawn node per file with a concurrency pool of 4 and a per-file timeout of 120s). KEEP the pretest content-integrity step and the non-test audits (check-links, audit-tools, audit-scholarship-truth, audit-public-claims, audit-automation-registry, verify-blog-backend, verify-cv-template-registry) as an explicit named list that runs after the glob.
2. This auto-enrolls the ~50 orphaned tests (solar-roi, matchday, car-import, auth-session-cookie, api-tax-*, etc.). Run it; some orphans may be broken from drift — fix trivial breaks, and quarantine genuinely broken ones in a tests/quarantine/ dir with a QUARANTINE.md explaining each (do not delete).

Commit 2 — build chain grouping:
3. Split package.json "build" (line ~110) into named stages: build:registry, build:surfaces (fr/sw/ha/country), build:assets (minify/bundle/html-bundles), build:seo (seo-system, og, canonical, internal links, sitemaps), build:checks — orchestrated sequentially by a scripts/run-build.js that prints stage timings and stops on first failure with a clear stage name. Behavior-identical output (diff dist/ before/after on a sample).
4. Move seo-daily-fix.js OUT of the build chain (it stays in .github/workflows/daily-seo.yml where it already runs) so builds are deterministic and the CI "git diff clean" gate stops flaking on date boundaries.

Commit 3 — CI wiring:
5. ci.yml: add timeout-minutes (30 for test job, 45 for build), split into two parallel jobs (verify: lint+type-check+tests; build: build:deploy+audit:dist+security:scan), add a third job running Playwright smoke (tests/e2e/automation-smoke.spec.js + tool-discovery.spec.js) with npx playwright install chromium --with-deps.
6. Align daily-seo.yml to Node 22 + actions@v5 (currently Node 20/@v4 — its committed output builds on a different Node than CI verifies).
7. Wire scripts/verify-deploy-channel.js into the Netlify build command chain in netlify.toml (before build:deploy) so wrong-channel deploys fail closed — read the script first to confirm it passes in Netlify CI context (it checks siteId/repo/branch; adjust its allowlist for deploy-preview contexts rather than weakening it).

Commit 4 — repo hygiene:
8. git rm --cached (keep local copies untracked): SITE-AUDIT-REPORT.md, missing-entries.json, missing-entries-formatted.txt, _audit_inventory.txt, "afrotools-sentinel (1).tar.gz", the nested afrotools-sentinel/ directory (contains a dead .github/workflows/sentinel.yml), AFROCONFLICT_BUILD_PROMPT.md, CONFLICT-DASHBOARD-PROMPT.md, AUDIT-FIX-PROMPT.md, AFROSTREAM-SESSION-PROMPT.md, CREATOR-SUITE-EXPANSION.md, AfroTools_Image_Checklist_Day*.pdf, audit-progress.json, .tmp-cashout-inline.js. FIRST verify none are referenced by any script/doc (grep each filename); skip any that are. Extend .gitignore with the matching patterns.
9. Note for me (do not run): .git/objects contains tmp_obj_* garbage from interrupted operations — I should run `git gc --prune=now` manually when no other git process is active (OneDrive sync can interrupt it).

Validate after each commit: commit 1 → the new runner completes with a pass/fail/quarantine summary; commit 2 → stage timings printed, dist/ spot-diff clean; commit 3 → push to a branch and confirm all three jobs green on the PR; commit 4 → npm test + npm run build still green, npm run audit:dist.
Acceptance: no test can be orphaned again (glob-based), build failures name their stage, CI has timeouts + e2e smoke + parallel jobs, deploy-channel guard active, ~800KB junk untracked.
```

---

## Suggested sequencing

- **Week 1:** P01 (an hour, protects revenue) → P02 (outage) → P03 (SW drift). These three are active bleeding.
- **Weeks 2–3:** P04 + P05 together (live data + freshness gates), then P13 (schema sweep — pure upside while data work settles).
- **Week 4:** P08 (API billing) or P10 (second Pro app) — pick by energy; both are revenue, P08 is more self-contained.
- **Ongoing background:** P14 localization waves (one per session), P06 confidence scale-out (batched).
- **When a quiet week appears:** P17 (payload diet) and P19 (pipeline restructure) — they make every later session faster and safer.

Cross-cutting rule of thumb: anything touching functions/publish surfaces ends with `npm run security:scan && npm run build:deploy && npm run audit:dist`; anything touching generated pages goes through its generator script, never hand edits.
