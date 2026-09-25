# Education upgrade: route disposition and release evidence

Scope: source changes prepared on 25 September 2026. **Fixed** means a behaviour or claim changed in this release. **Integrated** means the existing route now has a clearer path from Education or a handoff to related work. **Retained** means its established URL and function remain; route, canonical, and indexability were checked, but a full manual audit of every retained calculator was outside this release. No Education URL is redirected or noindexed by this change.

## Route disposition

| Route | Decision | Reason |
| --- | --- | --- |
| `/tools/university-admission/` | Integrated | Direct admissions directory link; existing official-owner checklist retained. |
| `/tools/waec-calculator/` | Fixed | Separate Nigeria WAEC/NECO and Ghana WASSCE context, checks, and continuations. |
| `/tools/jamb-aggregate/` | Fixed | Retired cutoffs/formulas and empty FAQ removed; entered weights made explicit. |
| `/tools/kcse-calculator/` | Retained | Distinct Kenya worksheet in the admissions directory. |
| `/tools/matric-points/` | Fixed | Language roles reject nonlanguage subjects before a result. |
| `/tools/gpa-calculator/` | Retained | Credit-weighted worksheet remains directly linked. |
| `/tools/school-fees/` | Fixed | Written-quote comparison works when the public feed has no data; empty and unavailable states differ. |
| `/tools/student-budget/` | Retained | Existing cost worksheet kept in the fees path. |
| `/tools/boarding-school/` | Retained | Existing boarding worksheet kept in the fees path. |
| `/tools/edu-savings/` | Retained | Existing savings worksheet kept in the fees path. |
| `/tools/student-loan-repay/` | Integrated | Direct loan path; national loan schemes remain distinct. |
| `/tools/ke-helb/` | Integrated | Kenya-specific route remains direct in the loan path. |
| `/tools/scholarship-finder/` | Fixed | Known citizenship exclusions, deadline status, and next-deadline summary. |
| `/tools/study-abroad-cost/` | Fixed | Missing core costs no longer look like confirmed zero. |
| `/tools/degree-checker/` | Retained | Existing degree comparison worksheet remains in study abroad. |
| `/tools/university-ranking/` | Integrated | Public description reflects a manual university comparison worksheet. |
| `/tools/ielts-calculator/` | Fixed | Input edits invalidate an old result. |
| `/tools/study-planner/` | Integrated | Existing saved-work continuity retained and path from hub improved. |
| `/tools/flashcard-maker/` | Integrated | Selected exam and country context is preserved from WAEC continuations. |
| `/tools/exam-countdown/` | Fixed | Past suggestions are collapsed and event-specific next actions replace generic revision. |
| `/tools/exam-timetable/` | Fixed | Confirmed dates and selected exam context are described accurately. |
| `/tools/course-load/` | Retained | Existing credit audit remains in coursework directory. |
| `/tools/citation-generator/` | Retained | Direct search alias and coursework link. |
| `/tools/word-counter/` | Retained | Existing local word and repetition metrics remain; no route merger. |
| `/tools/plagiarism-pct/` | Fixed | Discovery promise says local draft repetition, not plagiarism detection. |
| `/tools/periodic-table/` | Retained | Existing reference and quiz route preserved. |
| `/tools/algebra-solver/` | Retained | Existing algebra engine route preserved. |
| `/tools/statistics-calc/` | Retained | Existing descriptive statistics route preserved. |
| `/tools/fraction-calc/` | Retained | Existing exact fraction route preserved. |
| `/tools/percentage-calc/` | Retained | Existing percentage route preserved. |
| `/tools/scientific-calc/` | Retained | Existing scientific calculator route preserved. |
| `/tools/roman-numerals/` | Retained | Existing converter route preserved. |
| `/tools/binary-converter/` | Retained | Existing converter route preserved. |
| `/tools/teacher-salary/` | Integrated | Placed under Teaching and school operations. |
| `/tools/tutoring-rate/` | Fixed | Quote scope clarified and discount revenue shortfall shown. |
| `/tools/cert-roi/` | Integrated | Placed under After graduation. |
| `/tools/coding-bootcamp/` | Integrated | Placed under After graduation. |
| `/tools/interview-prep/` | Integrated | Placed under After graduation. |
| `/tools/nysc-allowance/` | Fixed | Incomplete expense budget no longer appears as available remainder. |
| `/tools/national-service-gh/` | Integrated | Distinct Ghana service route in After graduation. |
| `/tools/classroom-size/` | Integrated | Placed under Teaching and school operations. |
| `/tools/education-hub/` | Fixed | Public name is My Study Space at the existing saved-work URL. |
| `/tools/ssce-practice/` | Integrated | Previously missing from the Education directory; direct practice link added. |
| `/education/` | Fixed | Five task starts, one search, optional filters, compact registry-derived directory, saved-work return. |
| `/education/fees/` | Fixed | Static direct links and a fee-comparison first task. |
| `/education/loans/` | Fixed | Static direct links and a repayment first task. |
| `/education/scholarships/` | Fixed | Static direct links and a scholarship first task. |
| `/education/study-abroad/` | Fixed | Static direct links and a destination budget first task. |
| `/education/afrostudy/` | Fixed | Setup shows available practice counts before a session. |
| `/ai/education/` | Fixed | Claims now follow Education registry capabilities. |
| `/jamb/` | Fixed | Clearer Practice, Progress, My study plan, Admissions navigation. |
| `/jamb/cbt/` | Fixed | Practice count and route wording corrected. |
| `/jamb/tutor/` | Retained | Contextual question help remains at its established URL. |
| `/jamb/past-questions/` | Fixed | Available reviewed practice count and scope corrected. |
| `/jamb/patterns/` | Retained | Coverage/progress route remains direct. |
| `/jamb/flashcards/` | Fixed | Unavailable deck is no longer promoted as ready. |
| `/jamb/study-plan/` | Integrated | Existing study-plan URL remains direct. |
| `/jamb/score-predictor/` | Fixed | Public scope is Practice Check, not a score prediction. |
| `/jamb/universities/` | Retained | Admissions reference URL remains direct. |
| `/jamb/cram/` | Fixed | Exam-centre item guidance aligned with the exam-day kit. |
| `/jamb/exam-day-kit/` | Fixed | Candidate enters a confirmed appointment; no false zero countdown. |
| `/jamb/history/` | Retained | Existing local practice history URL remains direct. |
| `/jamb/daily/` | Retained | Existing daily practice URL remains direct. |

## Source and live-state boundaries

- ADB Japan Scholarship Program citizenship eligibility was reviewed against the [ADB programme page](https://www.adb.org/work-with-us/careers/japan-scholarship-program). African citizenship is a known exclusion for that specific award; unknown criteria remain unknown. Its public seed is archived in source. Any existing live row requires a separate seed/update before production reflects the correction.
- Chevening 2027–28 deadline and time were checked against the [official application timeline](https://www.chevening.org/scholarships/application-timeline/). Status logic uses the precise UTC cutoff and distinguishes deadline/cycle review from feed refresh. This is one award and cycle, not a blanket scholarship freshness claim.
- JAMB exam-centre guidance was checked against its [2026 prohibited-items bulletin](https://www.jamb.gov.ng/Bulletin/2026/JAMBulletin_27-04-2026.pdf). The kit separates travel preparation from exam-hall permissions.
- The AfroTools Supabase target was verified as `zpclagtgczsygrgztlts` before read-only inspection. The public School Fees query found zero rows at inspection time; the absent Netlify `/api/school-fees` route and a filter on a nonexistent `expires_at` column were repaired in source. Production feed behaviour still requires deploy and live smoke proof.
- Google Search Console data was not available in this environment. Established routes were therefore preserved. No URL migration is proposed.

## Validation and release boundary

The generator derives all Education directory entries and counts from `assets/js/components/tool-registry.js` through `assets/js/components/education-taxonomy.js`; `npm run education:check` rejects drift. Initial HTML and settled DOM checks cover the four focused routes, all registry links and the additional SSCE route. Browser checks cover 360px and keyboard flow, with before/after screenshots below. Representative calculator cases and saved-work continuity are in the targeted Node and Playwright tests.

| Journey | Before | After |
| --- | --- | --- |
| Education hub, desktop | [Before](../artifacts/education-upgrade-2026-09-25/review/before-hub-desktop.png) | [After](../artifacts/education-upgrade-2026-09-25/review/after-hub-desktop.png) |
| Education hub, 360px | [Before](../artifacts/education-upgrade-2026-09-25/review/before-hub-mobile-360.png) | [After](../artifacts/education-upgrade-2026-09-25/review/after-hub-mobile-360.png) |
| School Fees | [Before](../artifacts/education-upgrade-2026-09-25/review/before-school-fees.png) | [Manual comparison result](../artifacts/education-upgrade-2026-09-25/review/after-school-fees-manual-result.png) |
| Nigeria WAEC continuation | [Before](../artifacts/education-upgrade-2026-09-25/review/before-waec-results.png) | [Country-aware next actions](../artifacts/education-upgrade-2026-09-25/review/after-waec-nigeria-next-actions.png) |
| Study abroad blank inputs | [Before](../artifacts/education-upgrade-2026-09-25/review/before-study-abroad-budget.png) | [Incomplete result](../artifacts/education-upgrade-2026-09-25/review/after-study-abroad-incomplete.png) |

### Checks run

- `npm test`: **PASS**, 1,125 top-level test files and seven repository audits.
- `npm run build:deploy`, `npm run audit:dist`, `npm run security:scan`, `npm run education:check`, `npm run seo:report`, and `git diff --check`: **PASS**. The SEO report found no missing title, description, canonical, or hreflang metadata.
- Final local Chromium run of Education hub, saved work, School Fees, Scholarship Finder, and Study Planner: **36/36 passed**. Separate planner and study-day run: **13/13 passed**. Focused admissions, scholarship, calculator, privacy-state, and static-link tests also passed.
- Browser checks covered 320px/360px mobile layouts, 200% text reflow, keyboard labels, saved-session continuity, source-feed failure, manual fee comparison, scholarship cutoff boundaries, local exports, and incomplete financial inputs. These are local preview results, not production smoke.

### Review and rollout notes

- **Privacy and analytics:** Manual fee quotes and study plans remain local by default. The Education discovery page records only route choices and non-sensitive country/exam filter states through the existing consent-aware analytics API; it does not record search text or entered academic/financial values.
- **Accessibility:** The new task hub uses labelled controls and status text. The scoped mobile, keyboard and 200% reflow checks passed; this is not a claim of a sitewide accessibility audit.
- **SEO and routes:** Five Education pages have static links before JavaScript. Existing tool URLs and canonicals are retained; there are no route migrations, redirects, or new noindex rules. Search Console data was unavailable for consolidation decisions.
- **Generated output:** Education pages are owned by `scripts/build-education-discovery.js` and regenerated during the full build. Registry-derived indexes, related-tool data, and the AI Education page were updated; unrelated generated churn was removed from the branch diff.
- **Release boundary:** No feature flag or schema migration is required. Reverting this branch and rebuilding restores the prior source. Production deployment, live School Fees API smoke, and application of the scholarship data update belong to the release owner; neither is implied by local build proof.
