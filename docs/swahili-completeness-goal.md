# Swahili (sw/) Completeness Goal

Goal: bring the Swahili product to parity with English — full tool coverage,
zero visible English/admin leaks, and clean locale SEO. Set 2026-07-10.

## Current state (2026-07-10)

- 854 Swahili pages; English tools covered: ~420 of 671 (**255 tools missing**, list below).
- Visible-English density: 0 pages above 0.30 ratio (was 21 before repair);
  10 pages remain in the 0.15–0.29 band (tier-3 backlog below).
- `npm run validate:hreflang`: 0 errors, 0 warnings.
- `sitemap-sw.xml`: 851 URLs, all indexable sw pages included.

## Repair workflow (repeatable)

Swahili tool pages under `sw/zana/` were built from English templates with a
runtime `textMap` translation shim plus naive token swaps, so English leaks
into static HTML (what crawlers and no-JS users see). The repair pipeline:

1. Find leaky pages: rank visible-English density (en-stopword vs sw-stopword
   signal per page, scripts in session scratchpad or rewrite from this doc).
2. Extract exact English segments per page (text nodes + placeholder /
   aria-label / title / value / alt attributes).
3. Author Swahili for each segment in `lang/sw-visible-copy-repairs.json`
   (`{"<page path>": {"EN": "SW"}, "*": {…global strings…}}`).
4. Apply: `node scripts/bake-inline-textmap.js --map lang/sw-visible-copy-repairs.json`
   (exact-trimmed-match on text segments; raw-text elements are skipped;
   `--dry-run` first). The inline shim stays — it still translates
   runtime-generated strings.
5. Validate: `npm run build:i18n:validate && npm run validate:hreflang`,
   re-run the density ranking, spot-check in the browser.

Known trap: `_redirects` has forced (`301!`) rules that shadow static files —
always check it (whole file, not grep head) before "fixing" an orphaned page.
`/sw/salary-tax/` is intentionally shadowed → `/sw/mshahara-na-kodi/`; its
index.html on disk is unreachable dead weight (safe to delete when convenient).

## Backlog (priority order)

### 1. Tier-3 leak pages (~10 pages, 0.15–0.29 English ratio)

sw/zana/: kizalishaji-pwa-manifest, faida-ya-biogas, matumizi-ya-umeme-ya-vifaa,
kusimba-url, kizalishaji-meta-tags, kalenda-ya-kiislamu, ukaguzi-wa-nishati-nyumbani,
kalenda-likizo-za-umma, mapato-ya-recycling, faida-ya-kupanda-miti.
Use the repair workflow above.

### 2. Shared-component English on sw pages

- Footer newsletter input placeholder is "Email address" on Swahili pages
  (`assets/js/components/footer.js`) — needs locale-aware placeholder
  ("Barua pepe yako").

### 3. Missing tools (255) — generate in waves

Highest-value first: PDF/document, salary/tax/fintech, education, then misc.
Full list appended below (English slug under `tools/`). Follow existing
patterns: Swahili slug under `sw/zana/`, full hreflang cluster, entry in the
salary/category hubs where relevant, then `node scripts/generate-sitemaps.js`
and `node scripts/fix-hreflang-reciprocity.js`.

### 4. Editorial decisions

- `sw/afya-na-bima/` (8 inbound links) overlaps `sw/afya/` + `sw/bima/`;
  now correctly paired with EN `/health-insurance/`. Decide: keep as combined
  hub or consolidate.
- English-slug directories inside sw/ (`sw/tools/`, `sw/fintech/`,
  `sw/salary-tax/`) — cosmetic URL-language leak, low priority, renames need
  redirects + hreflang + sitemap updates.
- `sitemap-i18n.xml` duplicates 59 sw URLs also present in `sitemap-sw.xml`
  (harmless, tidy when touching the sitemap generator).

## Fixed on 2026-07-10

- 21 worst leak pages translated (tier 1+2, 252 segments baked via
  `lang/sw-visible-copy-repairs.json`), including `sw/gabon/kikokotoo-kodi-mshahara`
  tax copy and full hand-translation of `sw/zana/kilinganisha-maandishi`.
- Data bugs fixed in translation: solar payback "36 years" → "miaka 3 hadi 6";
  regex page JS method names "matchZote"/"utafutaji" → matchAll/search.
- "Payslip" card label → "Slipu ya Mshahara" on 7 hub/home pages.
- Hub mapping collisions resolved: EN `/mortgage-property/` now pairs with
  `sw/nyumba-na-ardhi/` (108 links) — `sw/mali-na-mikopo/` (2 links) converted
  to noindex legacy alias (SW_SLUG_TO_EN updated in `scripts/build-i18n.js`);
  `sw/afya-na-bima/` repaired to pair with `/health-insurance/` instead of
  claiming `/health/` (owned by `sw/afya/`).
- Removed bogus hreflang from shadowed `sw/salary-tax/` page.

## Missing tools list (English slugs under tools/ with no sw page)

- tools/50-30-20-budget
- tools/afcon-predictor
- tools/africa-conflict
- tools/africa-election-tracker
- tools/africa-flight
- tools/african-meal-plan
- tools/african-palette
- tools/afroatlas
- tools/afropayroll-os
- tools/afropoints
- tools/afroprices
- tools/afrostream
- tools/agent-commission
- tools/agric-profit
- tools/airbnb-vs-hotel
- tools/airport-transfer
- tools/album-budget
- tools/amount-words-gh
- tools/amount-words-ke
- tools/ankara-kente-cost
- tools/art-commission
- tools/asset-finance
- tools/athlete-earnings
- tools/b2b-payment
- tools/background-remover
- tools/backup-power-costs
- tools/beach-holiday-budget
- tools/betting-odds
- tools/betting-tax
- tools/bill-split
- tools/binary-converter
- tools/blood-group
- tools/bmi-calculator
- tools/bnpl-calc
- tools/boarding-school
- tools/bond-yield
- tools/book-publishing-cost
- tools/breastfeeding-tracker
- tools/brideprice-advisor
- tools/budget-comparator
- tools/burial-cost
- tools/business-continuity
- tools/business-name-gen
- tools/business-plan-builder
- tools/calorie-counter
- tools/cbk-rates
- tools/cctv-cost
- tools/cert-roi
- tools/certificate-maker
- tools/child-support
- tools/childbirth-cost
- tools/cholera-risk
- tools/claim-tracker
- tools/classroom-size
- tools/clinic-costs
- tools/cnps-guide
- tools/coding-bootcamp
- tools/color-picker
- tools/colour-palette
- tools/commodity-tracker
- tools/compound-interest
- tools/concert-budget
- tools/construction-budget
- tools/contractor-vs-employee
- tools/cost-of-living
- tools/course-load
- tools/creator-club
- tools/creator-course
- tools/creator-desk
- tools/creator-mail
- tools/creator-mind
- tools/creator-polish
- tools/creator-research
- tools/creator-schedule
- tools/creator-split
- tools/creator-team
- tools/credit-score
- tools/crop-yield
- tools/crypto-tax
- tools/csection-vs-natural
- tools/cybersecurity-assessment
- tools/data-breach-cost
- tools/dca-calc
- tools/debt-snowball
- tools/dental-cost
- tools/dev-feasibility
- tools/diaspora-guide
- tools/dividend-yield
- tools/divorce-settlement
- tools/dj-booking-rate
- tools/doc-generator
- tools/drug-price-compare
- tools/due-date
- tools/eac-cet
- tools/ebola-checklist
- tools/ecowas-levy
- tools/edu-savings
- tools/electricity-estimator
- tools/employee-cost
- tools/engagement-rate
- tools/etims-guide
- tools/event-decoration-cost
- tools/event-ticket-revenue
- tools/eye-care-cost
- tools/fabric-cost
- tools/factory-setup-cost
- tools/fantasy-football
- tools/fashion-brand-startup
- tools/favicon-generator
- tools/fertilizer-calc
- tools/festival-travel-budget
- tools/film-budget
- tools/fintech-fee-watch
- tools/fire-calc
- tools/fire-safety-checklist
- tools/foi-template
- tools/fraction-calc
- tools/gaming-pc-build
- tools/genotype-checker
- tools/gh-ssnit
- tools/gh-wht
- tools/gov-scholarship
- tools/graphic-design-pricing
- tools/gratuity-calculator
- tools/guard-service-cost
- tools/gym-cost-compare
- tools/gym-roi-business
- tools/hawala-tracker
- tools/hep-b-screening
- tools/hiv-treatment-cost
- tools/home-security-cost
- tools/home-workout
- tools/hotel-star-guide
- tools/idea-board
- tools/image-tools
- tools/immigration-points
- tools/inflation-calc
- tools/informal-fx-watch
- tools/inheritance-tax
- tools/insurance-fraud-checker
- tools/interest-rate-ref
- tools/investment-return
- tools/ip-protection
- tools/ip-rights-africa
- tools/itax-guide
- tools/ke-cgt
- tools/ke-nssf
- tools/ke-stamp-duty
- tools/ke-wht
- tools/labour-law-advisor
- tools/land-size
- tools/lease-risk-check
- tools/leave-days
- tools/lobola-gift-list
- tools/lobola-negotiation-checklist
- tools/marine-insurance
- tools/market-days
- tools/marriage-cert
- tools/match-tickets
- tools/maternal-mortality
- tools/maternity-leave
- tools/medical-tourism
- tools/meeting-minutes
- tools/meme-generator
- tools/mental-health-cost
- tools/meta-tag-gen
- tools/mobile-vs-bank
- tools/music-royalty-splitter
- tools/naira-to-words
- tools/national-pension
- tools/ng-cgt
- tools/ng-cit
- tools/ng-land-use
- tools/ng-nhf
- tools/ng-pension
- tools/ng-wht
- tools/nollywood-box-office
- tools/nollywood-pitch
- tools/oee-calculator
- tools/packaging-cost
- tools/password-strength
- tools/paye-calculator
- tools/payment-comparator
- tools/paystack-calculator
- tools/pension-proj
- tools/pension-projection
- tools/percentage-calc
- tools/pharmacy-prices
- tools/phishing-quiz
- tools/photo-video-pricing
- tools/photography-pricing
- tools/plagiarism-pct
- tools/plot-converter
- tools/plumbing-material
- tools/podcast-monetization
- tools/pregnancy-nutrition
- tools/production-cost
- tools/property-vs-stocks
- tools/qr-payment
- tools/quality-sampling
- tools/receipt-generator
- tools/regulatory-alerts
- tools/remittance-v2
- tools/rent-intelligence
- tools/rental-agreement
- tools/retirement-planner
- tools/retrenchment-calculator
- tools/road-construction-cost
- tools/roman-numerals
- tools/sadc-roo
- tools/safari-cost
- tools/salary-intelligence
- tools/sars-efiling
- tools/scaffolding-calc
- tools/scientific-calc
- tools/security-emergency-fund
- tools/self-publishing-royalty
- tools/side-hustle-tax
- tools/site-clearing
- tools/social-welfare
- tools/solar-calculator
- tools/sports-scholarship
- tools/staff-cost
- tools/stamp-duty
- tools/staple-basket
- tools/statistics-calc
- tools/stock-portfolio
- tools/streaming-royalties
- tools/student-loan
- tools/study-abroad-cost
- tools/survey-cost
- tools/tailoring-pricing
- tools/tb-tracker
- tools/thrift-calc
- tools/thumbnail-maker
- tools/tithe-offering-calculator
- tools/traditional-vs-western
- tools/transfer-pricing
- tools/travel-packing-list
- tools/travel-vaccination-cost
- tools/tutoring-rate
- tools/vehicle-import-duty
- tools/visa-tracker
- tools/wedding-photo-package
- tools/whatsapp-link
- tools/wholesale-retail-spread
- tools/window-door-sizing
- tools/word-counter
- tools/work-permit-cost
- tools/youtube-revenue
- tools/za-cgt
- tools/za-dividend-tax
- tools/za-gepf
- tools/za-transfer-duty
- tools/za-uif
