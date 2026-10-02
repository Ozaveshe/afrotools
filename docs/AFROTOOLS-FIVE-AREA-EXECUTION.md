# AfroTools completion execution: five requested areas

Decision date: 2026-10-02. Coordinator: `01a0f7ef-abd2-7d21-af40-dad6e872a32e`.
The existing completion goal remains active. AfroTools is not certified complete.

This is an execution supplement to `AFROTOOLS-COMPLETION-PROGRAM.md`, not a
replacement for the full backlog, Pro readiness obligations or production proof.
It answers the user's five explicit issue clusters with separate work packages.
The coordinator owns investigation, source repair and acceptance reconciliation;
the existing publisher owns source integration and deployment. Named generator
owners below are technical owners, not instructions sent to another chat.

## Progress checkpoint

Current baseline: `origin/main`, the public production marker and Netlify deploy
`6abf70c9d4b0db0008c641be` match `5ebe63a0110857ed6acd50ea6734d5fd2b755a1b`.
PR #179 and PR #183 source is included in that release. French Solar still has
a reproduced desktop initialization failure, so its own acceptance stays open.
The earlier `4f1eb4ec903ec5378561aa3106de6998fcfb9eef` snapshot is retained in
the execution register. The metadata and shared accessibility candidates are
being validated separately against the current main source.

| Area | Verified progress | Still required |
| --- | --- | --- |
| Languages | Source-integrated French Solar route/label repairs; PR #183 passes CI and local source/dist browser checks for root plus 54 country pickers. | Reference cohort still records FR 300 and SW 323 missing routes. FR/SW shells, results, errors, exports and editorial quality remain separate. Hausa: 23 native, 58 shells, 25 fallbacks; Yoruba: 10 native, 13 shells, 3 fallbacks, 20 unavailable in the recorded inventory. These labels are inventory declarations, not workflow certificates. |
| SEO/tags | Current committed snippet report records 654 review candidates across 7,778 EN/FR/SW indexable pages, zero error pages. A fresh all-language scan of 7,881 indexable routes reproduces 214 missing Twitter cards, 23 OG titles, 32 OG descriptions, 22 OG images and one OG URL. | The metadata source repair is a new candidate, not production acceptance. Snippet signals need individual editorial dispositions. The browser redirect at `/business/` remains misclassified as an indexable page and needs route-owner reconciliation. |
| Sources | Correct-project Supabase read: MTN Uganda now has 9 successful runs and 27 published records in seven days; latest success Oct 2. Public watchdog at 06:57 UTC records zero stale and five degraded sources. | Registry freshness recalculated as of Oct 2: 118 stale of 243 recorded entries. Official-source/formula gaps remain. MTN still has 75 failed historical runs in that window; do not erase history or replay jobs to manufacture success. Five degraded health lanes need investigation. |
| Accessibility | Focused anonymous production checks passed for Auth, CV Builder, English Solar and Pricing at three widths. The shared contrast/Payroll prompt candidate passed 27 optimized-artifact checks and 1,200 repository test files before its current-main refresh. | Payroll's paid region is correctly inert for guests, but its guest prompt links were also inert; the candidate fixes their placement. Paid workspace acceptance and assistive-technology proof remain open. The broader contrast survey still has findings in 44 of 54 observations. French country initialization has a separate candidate and original negative assertions remain intact. |
| Other workflows | Published CI recovery and car/image policy work; live profile privilege guard installed with a separately tested source candidate in PR #184. Some AfroStream scheduled scrapers show successful aggregate runs. | Car listing/price evidence, image rights, AfroStream profile/playback actions, API authorization/errors, widget embed actions, offline update recovery and sensitive export contents require their own acceptance. Successful scrape counts do not prove playback or user workflows. |

## Work packages and acceptance

The metadata batch now passes focused tests, the full deploy build, final artifact
audit, lint/type checks, i18n/hreflang and the ordinary SEO report. The security
scan is recorded with the candidate's final validation results. Chromium parsed
all 222 repaired source/dist heads and found matching metadata and canonicals.
All 98 distinct social-image URLs checked returned successful image responses.
The owner-generated repair preserves all 222 page bodies and canonical tags.
Local missing counts are now zero for Twitter cards, OG titles/descriptions/images;
the one `/business/` OG URL omission remains open. Explicit Twitter title and
description omissions are still reported separately (1,520 and 1,521); this batch
does not certify all social semantics or any social network's final rendering.
Source integration, hosted CI and production acceptance remain pending.

Priority is based on harm and user blockage. P0 protects access and sensitive data;
P1 fixes wrong results, broken actions, inaccessible journeys, misleading language
availability and source truth; P2 finishes metadata and editorial quality. A small
systemic P2 fix can run while a P0/P1 candidate awaits its release owner.

| Key | Priority | Concrete next work | Source owner / acceptance |
| --- | --- | --- | --- |
| ACCESS-01 | P0 | Reconcile PR #184 with the already installed profile guard; prove legitimate profile save, subscription activation/cancellation and tenant isolation. | Supabase migration, profile API, entitlements; synthetic/test-mode actions and exact migration history. No real charge or existing-role changes as a shortcut. |
| PRIVACY-01 | P1 | Execute sensitive tool upload, local generation, export-content and backup/reload flows, including denied network consent. | Document/CV owners and privacy helpers; parsable PDF/DOCX/TXT/JSON, local-only default, zero sensitive analytics/network sends without consent. |
| A11Y-01 | P1 | Verify deployed Auth mode history, keyboard flow and status/focus behavior. | `auth/index.html`, shared Auth runtime; keyboard/history/axe plus mobile action proof on deployed SHA. |
| A11Y-02 | P1 | Verify deployed CV labels, tracker states, keyboard scroll, local saved drafts and CSV contents. | CV source/runtime and French generator; synthetic fixtures at desktop, 390 and 320 pixels; no sensitive sends. |
| A11Y-03 | P1 | Verify Pricing switch/contrast and Payroll recent-runs keyboard access; reconcile the existing UI owner's candidate first. | Pricing and Payroll owners; named controls, stable focus, contrast and no small-width overflow. |
| A11Y-04 | P1 | Reproduce French Solar early-input and transition errors; verify PR #183 after integration. | Solar generators/shared navigation; both early and fully ready interactions, correct country CTA, no console errors at three widths. |
| A11Y-05 | P1 | Separate shared-component defects from page-specific contrast/link flags and fix the shared source first. | Navbar/footer/design-system owners; keyboard, focus, contrast, dark mode and reduced-motion proof across affected families. |
| LANG-FR-01 | P1 | Close the French reference-route queue in bounded source-owned families, starting with missing product entries and category hubs. | `build-localized-non-app-parity.js` and family generators; FR task copy, navigation, sources and route equivalence; no English wrapper counted as finished. |
| LANG-SW-01 | P1 | Close the Swahili reference-route queue with the same family contract. | Swahili generators/catalog; real Swahili body/task copy, correct destinations and reciprocal hreflang. |
| LANG-FR-02 | P1 | Finish native French inputs, results, validation and exports in claimed app workflows, starting with Solar after its picker release. | French tool/runtime owners; language oracle covering initial, result, invalid and export states. |
| LANG-SW-02 | P1 | Audit and finish claimed Swahili workflows; shells and English-frame fallbacks retain explicit pending states. | Swahili tool/runtime owners; same native-language action/export gate as French. |
| LANG-HA-01 | P1 | Review 58 Hausa shells and 25 English fallbacks against actual promised workflows; complete approved source families. | Hausa manifests/catalogs/generators; native task language, exports and editorial review. |
| LANG-YO-01 | P1 | Review 13 Yoruba shells, 3 fallbacks and 20 unavailable routes; finish intended workflows and Unicode quality. | Yoruba manifests/catalogs/generators; diacritics, native task language, exports and editorial review. |
| DATA-01 | P1 | Triage all 118 stale entries by high-risk rules/fees/rates first; preserve observed review dates. | `build-source-registry.js`, formula registry and source ledgers; dated primary evidence, tested calculations and truthful stale states. |
| DATA-02 | P1 | Resolve government/transport and other sector official-source gaps by source family. | Existing government, transport, tax, fuel, mining, telecom, property and fintech ledgers; failed portals stay manual/blocked until reviewed. |
| DATA-03 | P1 | Investigate five degraded health rows: telecom-plans, agri-inputs, property-prices, insurance-premiums and bank-rates. | Scheduled function/health owners; natural scheduled invocations, truthful success/failure counters and fresh public status. |
| DATA-04 | P1 | Verify MTN merchant feed publication/read path and recurrence after recent recovery. | Existing merchant feed owner; read-back of published aggregate state and further natural success, without duplicate parser implementation. |
| OTHER-CARS | P1 | Complete accepted market/listing/price coverage and review image provenance without confusing private research with observations. | Car evidence/source/image owner; accepted dated observations, supported identity, rights and public price/freshness states. |
| OTHER-STREAM | P1 | Reproduce remaining AfroStream creator, media, playback and unavailable-source failures. | AfroStream app/provider/source owners; actual page and playback/failure actions, correct labels, no fabricated profiles or assets. |
| OTHER-API | P1 | Exercise public API route, input, quota, authorization and error boundaries. | Netlify functions/API plans; synthetic requests, cross-tenant denial and correct non-sensitive error responses. |
| OTHER-WIDGET | P1 | Exercise all declared widget families in host pages and small-width frames. | Widget sources and generated registry; calculation/prefill/export where promised, accessible labels, correct canonical/noindex handling. |
| OTHER-OFFLINE | P1 | Verify supported offline workflows, update from an older cache and draft backup/recovery. | Service worker/cache/workspace owners; no mixed-version code, lost drafts or stale-current data claims. |
| SEO-01 | P2 | Release and verify the shared metadata repair; resolve the `/business/` alias classification separately. | `apply-og-fallbacks.js`, route owners; current all-language source/dist audit, fetched images and production head checks. |
| SEO-02 | P2 | Disposition all 654 snippet review candidates by generator family and user intent. | Existing snippet owners; correct or explicitly accepted row-level findings, preserved route/claims and measured GSC evidence for performance statements. |
| CONCEPT-01 | P1 | Walk country-specific task discovery through result and next action; distinguish free, Pro and preview promises. | Registry, category/country hubs and app owners; observed successful journeys and accurate value/readiness labels. |

## Execution order and closure rules

1. Preserve and finish the already prepared security, French and report candidates
   through their existing release owner. Their pending release does not suspend
   independent safe source work.
2. Finish the metadata candidate already started in this checkout; validate the
   owning source and its generated output, then hand off a pinned candidate.
3. Run deployed accessibility/action acceptance and sensitive export checks; fix
   confirmed blockers without duplicating the existing UI owners.
4. Work native-language queues by product/category and app family, followed by
   source-trust and official-source queues. Within each queue handle higher-risk,
   higher-use workflows first. Keep per-route dispositions; no cohort is closed
   merely because a builder returns zero.
5. Complete cars, AfroStream, API, widget and offline acceptance; finish snippet
   editorial dispositions and product-concept journeys. Revisit any discovered
   P0/P1 immediately.

Every work package must identify the affected routes, source owner, baseline,
reproduction, source candidate, tests, limitations and remaining live acceptance.
Statuses progress through investigated, repaired locally, source integrated and
production verified. A package closes only when its applicable action, editorial,
privacy/accessibility and production gates pass. Retain failed attempts and dated
prior observations; refresh current counters without rewriting history.

The weekly-maintenance transition requires every completion blocker and required
unverified workflow to be disposed, the entire current product scope reconciled,
freshness/recovery ownership exercised and final production SHA verified. No route
retirement, removal of a locale offering or narrowing of promised Pro functionality
is implied by this plan. Ongoing time-sensitive feeds keep their required cadence.
