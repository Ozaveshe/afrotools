# AfroTools Blog Strategy 2026

Updated: 2026-08-02

This strategy covers the static, repo-backed main blog under `/blog/`. AfroStream creator news is a separate live Supabase-backed publishing surface and should not be mixed into this plan.

## Current Snapshot

Latest local checks on 2026-08-02:

- `npm run blog:editorial:audit`: 225 blog routes, 223 articles, 2 redirects, 0 errors, 0 warnings, and 63 source-review notes.
- `npm run blog:feed:check`: RSS current, 40 items, latest `ghana-motor-insurance-claim-checklist-2026`.
- `npm run blog:verify`: 223 publishable articles, 213 English hub cards, and 40 RSS items.
- `node scripts/audit-blog-content.js`: 223 publishable posts, 0 default article images, 0 fact-heavy posts without outbound sources, 0 articles under 800 body words, and an average article-body length of 2,107 words.
- Shared article navigation is centralized through `blog/assets/js/blog-reading.js`, with an automatic table of contents, reading progress, and an accessible copy-link action on all 213 English articles.

The dedicated-image backlog remains at 0. The main unresolved queue is freshness proof: 114 articles have sources but no explicit source-review date, 115 likely require official-source review, and 76 need a stronger direct tool handoff. The content audit now recognizes 86 articles with explicit source-review dates without treating a generic publication date as review evidence.

The blog is structurally healthy. The strategy gap is no longer "publish enough." It is:

1. Keep source-sensitive pages fresh enough to deserve their traffic.
2. Build clusters around under-served tool categories.
3. Turn blog traffic into tool use, newsletter leads, business enquiries, and Pro discovery.
4. Stop adding weak posts that create future freshness debt.

## Strategic Positioning

AfroTools articles should be practical decision guides for African work, money, business, documents, study, mobility, home, and local-life workflows. The strongest article does three jobs:

- Explains the decision in local terms.
- Shows the current rule, rate, checklist, or calculation boundary with source notes where needed.
- Moves the reader into an AfroTools calculator, checker, template, country hub, or workflow.

The blog should not compete as a generic finance blog. It should become the editorial layer around the tool graph.

## Content Pillars

### 1. Tax, Payroll, And Compliance

Rationale: This is the strongest existing cluster and maps directly to high-intent tools, Pro payroll surfaces, source-ledger work, and business enquiries.

Subclusters:

- PAYE and salary after tax by country.
- VAT registration, invoices, filing, and digital-services rules.
- Employer payroll compliance.
- Withholding tax and filing calendars.
- Small-business tax checklists.

Product connection:

- PAYE calculators, VAT tools, invoice generator, salary-tax category, Pro payroll, business enquiry.

Operating rule:

- These posts require official-source refresh before factual changes. Prefer a smaller number of properly refreshed posts over daily additions.

### 2. Trade, Vehicles, Logistics, And Import Costs

Rationale: Import duty and vehicle-cost content is high-intent, tool-led, and commercially useful for calculators, widgets, and custom workflow leads.

Subclusters:

- Car import cost by route and country.
- Customs valuation, inspection, and port-cost checklists.
- AfCFTA, regional trade rules, and landed-cost planning.
- Delivery, last-mile, and corridor-cost explainers.

Product connection:

- Import duty tools, car import calculators, trade tools, widgets, sponsored tools, custom calculators.

Operating rule:

- Separate evergreen process explainers from volatile rate pages. Volatile pages need source dates, assumptions, and clear calculator handoff.

### 3. Everyday Money And Market Prices

Rationale: Currency, remittance, savings, rent, mortgage, insurance, and cost-of-living posts are search-friendly, but they can decay quickly if treated as static rate pages.

Subclusters:

- Remittance and mobile-money fee comparisons.
- Cost-of-living and salary comparison guides.
- Savings, emergency funds, pension, and debt planning.
- Insurance and housing affordability guides.
- Currency "today" pages that route into live or refreshed tools instead of hard-coding rates.

Product connection:

- Currency converter, mobile-money fee tools, budgeting tools, mortgage tools, insurance tools, country hubs.

Operating rule:

- "Today" and price-sensitive articles should explain how to check the current number and route to the live tool. Do not hard-code rates unless the source date is explicit.

### 4. Documents, Career, Education, And Local Admin

Rationale: The registry has meaningful coverage in document-PDF, career, education, government, language, and local admin workflows, while the blog is still weighted toward tax and business.

Subclusters:

- CV, cover letter, ATS, interview, and salary negotiation guides.
- PDF workflows for school, work, visa, HR, and business documents.
- WAEC, JAMB, scholarships, study abroad, and exam planning.
- Passport, ID, marriage certificate, land registry, and public-service checklists.
- Language and local-literacy guides where they connect to actual tools.

Product connection:

- CV builder, cover letter generator, PDF workspace, scholarship finder, study tools, government tools, country hubs.

Operating rule:

- Sensitive career and document content must stay local-first in product claims. Blog CTAs should not imply uploads or AI review unless that exact flow exists with consent.

### 5. Agriculture, Energy, Health, And Household Operations

Rationale: These categories are large in the tool registry and under-represented in the blog. They can also become strong Africa-first utility clusters if written as practical field guides rather than generic wellness or climate content.

Subclusters:

- Seed rate, crop yield, irrigation, feed cost, fish farming, and commodity planning.
- Solar ROI, electricity tariffs, generator-vs-solar, fuel and backup power.
- BMI, genotype, sickle-cell, hospital cost, clinic admin, and health insurance explainers.
- Wedding, funeral, tithe, cultural calendars, and household cost planning.

Product connection:

- Agriculture tools, energy calculators, health tools, local-life tools, country hubs, Pro shell apps where honest.

Operating rule:

- Health posts must avoid medical-advice claims. Energy and agriculture pages need source/freshness labels when rates, yields, tariffs, or prices change.

## Priority Backlog

Use this backlog for the next 8 to 12 weeks. A topic can ship only after duplicate-slug review, source review where needed, and tool-handoff mapping.

| Priority | Candidate topic | Pillar | Intent | Tool handoff | Source requirement |
| --- | --- | --- | --- | --- | --- |
| P0 | Refresh Kenya PAYE and salary-tax guide cluster for 2026 | Tax, payroll, compliance | Searchable | Kenya PAYE, salary-tax hub | KRA, NSSF, SHA/AHL official pages |
| P0 | Refresh Nigeria Tax Act 2026 changes into a substantial guide | Tax, payroll, compliance | Searchable | Nigeria PAYE, business tax tools | FIRS and official gazette/source notes |
| P1 | Refresh the salary-after-tax country cluster and maintain dedicated imagery | Tax, payroll, compliance | Searchable | Country salary calculators | Country tax authority pages |
| P0 | Mobile money fees in Africa: tool-led update | Everyday money | Searchable and shareable | Mobile money fees tool | Operator fee pages where available |
| P1 | Agriculture calculator guide hub: seed, feed, yield, irrigation | Agriculture and household ops | Searchable | Agriculture tools | Source notes for changing prices/yields |
| P1 | Solar ROI country guides: Nigeria, Kenya, South Africa, Ghana | Energy and household ops | Searchable | Solar ROI and electricity tariff tools | Regulator/tariff source ledgers |
| P1 | PDF workflow guides for job applications, school forms, and business documents | Documents and career | Searchable | PDF workspace, CV builder, cover letter | Product behavior verification |
| P1 | Government admin checklist cluster: passport, ID, land registry, marriage certificate | Documents and local admin | Searchable | Government tools, country hubs | Official agency pages |
| P1 | Import duty and car import country comparison refresh | Trade and vehicles | Searchable | Import duty and car import tools | Customs and port authority pages |
| P2 | Insurance guide cluster: motor, travel, crop, health, business cover | Everyday money | Searchable | Insurance tools | Regulator/provider source notes |
| P2 | Education planning guides: JAMB, WAEC, scholarship reminders, GPA | Documents and education | Searchable | Education tools | Official exam/scholarship pages |
| P2 | Household cost planning guides: weddings, funerals, rent, generator backup | Household ops | Shareable and searchable | Budgeting, event, energy tools | Market assumptions with date labels |

## Refresh Queue

The editorial audit marked 201 time-sensitive articles, including 96 that likely need official-source review. Treat that as a maintenance queue, not a failure.

Weekly refresh rhythm:

1. Pick 10 high-intent source-sensitive posts.
2. Confirm official source pages before editing factual claims.
3. Update the article date and source notes only when the page materially changes.
4. Re-run `npm run blog:editorial:audit`, `npm run blog:feed:check`, and `npm run blog:verify`.
5. If links, hub cards, or new slugs changed, add `npm run check-links`.

P0 refresh families:

- Kenya PAYE, VAT, withholding, eTIMS, NSSF, SHIF, income tax deadline.
- Nigeria PAYE, withholding, VAT registration, e-invoicing, Tax Act, CAC registration.
- South Africa filing season, EMP501, VAT invoice requirements, provisional tax, turnover tax.
- Salary-after-tax country cluster.
- Mobile money, remittance, FX "today", mortgage, rent, and other price-sensitive pages.

## Publishing Mix

Default weekly mix for the static blog:

- 2 source-refresh updates to existing high-intent articles.
- 1 new article in an under-served tool category.
- 1 image/internal-link improvement pass on existing articles.

The AM and PM content automations must run the editorial, content, and feed audits before choosing the static item. A substantive source, freshness, metadata, depth, internal-link, or tool-handoff refresh counts as the batch's static item. Create a new article only when no higher-impact gap fits that automation lane.

Daily cadence can still be used during campaigns, but only after the source and quality bar is met. The blog is large enough that maintenance and cluster depth now matter more than raw post count.

## Ruthless SEO Operating System

The blog should optimize for useful search ownership and completed tool workflows, not article count. Apply these rules every week:

1. Refresh or consolidate before creating. If AfroTools already has a page serving the same intent, improve that page and preserve its URL.
2. Publish only when the query has a distinct job, a credible source path, and a live AfroTools handoff.
3. Give every source-sensitive article an explicit source-review date. A publication date is not evidence that its sources were checked.
4. Put the primary tool link in the first practical section, then add at least two useful guide links.
5. Score opportunities with real Search Console or Bing query exports when available. Do not invent search volume or keyword difficulty.
6. Review performance after 90 days. Improve pages with impressions but weak clicks, consolidate overlapping pages, and retire pages that have neither demand nor product value.
7. Build one cluster at a time. Ship the hub or strongest guide first, then narrowly differentiated country or task spokes.

The current opportunity briefs are in `data/content/blog-seo-opportunity-briefs-2026-08.json`, with a human-readable execution queue in `reports/blog-seo-opportunities-2026-08.md`. Their rank is a qualitative opportunity score based on SERP crowding, product fit, sourceability, cannibalization risk, and maintenance cost. It is not a claim of measured search volume or guaranteed ranking difficulty.

### August 2026 content explosion wave

The first intensive wave is implemented as 20 differentiated search jobs, not 20 country-name swaps. Its source of truth is `data/content/blog-content-explosion-2026-08.json`; `scripts/build-blog-content-explosion.js` owns the article pages, hub cards, and manifest records.

The wave covers five connected clusters:

- Property and tenancy: Kenya land transfer, Nigeria title verification, and Kenya/Ghana tenancy checks.
- Getting paid: Nigeria invoice reminders, WhatsApp reminders, overdue email sequences, and a final reminder letter.
- Employee payroll literacy: Tanzania, Uganda, Rwanda, and Zambia payslip deductions.
- Passport administration: Nigeria, Kenya, Ghana, and Uganda renewal packets.
- Household energy and family planning: Ghana/Kenya funeral budgets, Nigeria generator fuel cost, and Kenya battery sizing.

Each page must remain at or above the dedicated quality contract: 1,100 article-body words, a unique keyword, a direct tool handoff, two useful article links, three source links, dated source review, Article schema, FAQ schema, and no em dashes. Run `npm run test:blog-explosion` and `npm run blog:explosion:check` before feed or manifest checks.

### August 2026 content explosion wave two

The second intensive wave adds 30 more articles across six distinct task clusters: business records, agriculture inputs, construction and energy, trade and logistics, events, and government records. It deliberately excludes a proposed Kenya maize seed-rate article because that job would compete with the existing seed-rate guide.

The source of truth is `data/content/blog-content-explosion-wave2-2026-08.json`. It records the primary keyword, intent, qualitative opportunity score, cannibalisation note, live tool handoff, article-specific method, stress test, internal links and primary sources. `scripts/build-blog-content-explosion-wave2.js` owns the 30 pages, blog-hub cards, article-manifest records and `reports/blog-seo-opportunities-wave2-2026-08.md`.

Wave-two scores are prioritisation evidence, not paid keyword difficulty or volume. No sanitised Search Console export or paid volume dataset was available, so the method uses sampled result crowding, existing-library overlap, tool fit, source quality and freshness burden. Replace qualitative scores with real query data when a safe export becomes available.

The wave-two quality contract is stricter than wave one: exactly 30 unique jobs, five per cluster, at least 1,400 article-body words, titles no longer than 60 characters, meta descriptions between 120 and 160 characters, at least three named sources, two to four related links, dated source review, Article/Breadcrumb/FAQ schema, a registry-backed tool link, a real WebP image and no em dashes or mojibake. Run `npm run test:blog-explosion-wave2` and `npm run blog:explosion:wave2:check` before the shared platform, feed, sitemap and editorial gates.

## Article Brief Template

Use this before drafting any new post:

- Slug:
- Target reader:
- Search intent:
- Existing duplicate/cannibalization check:
- Primary AfroTools handoff:
- Secondary internal links:
- Source requirement:
- Source date:
- Freshness label needed:
- CTA:
- Image path:
- Validation commands:

## Internal Linking Rules

- Every new article should link to one primary tool or hub above the fold or in the first practical section.
- Every new article should link to at least two related internal guides when they genuinely help the reader.
- Use tool-led anchor text, not vague "click here" copy.
- Do not add links to Pro shell features unless the copy matches the verified readiness status.
- Avoid circular clusters where articles only link to each other and never to a usable workflow.

## Image Strategy

The 2026-07-10 content audit found 0 posts using default article images. Keep image cleanup as a regression queue rather than manufacturing replacement work. Do not generate images inside the blog publishing task unless the user explicitly asks for image generation.

Image cleanup order:

1. High-intent default-image posts with tool handoffs.
2. Salary-after-tax, PAYE, VAT, import duty, remittance, and mobile-money clusters.
3. Under-served categories that need a stronger first impression: agriculture, energy, education, documents, health, and insurance.

Prefer WebP assets and keep alt text descriptive, not decorative.

## Measurement

Track strategy progress with repo-native evidence:

- `npm run blog:editorial:audit`: errors, warnings, official-source review queue.
- `npm run blog:feed:check`: RSS freshness and latest item.
- `npm run blog:verify`: hub cards, article count, canonical routes, feed coverage.
- `node scripts/audit-blog-content.js`: image and content-quality triage.
- `npm run seo:priority:report`: Search Console or Bing opportunity report when sanitized exports are available.

Content success should be judged by:

- Tool clicks from articles.
- Newsletter signups from article and hub routes.
- Business enquiry clicks from commercial-intent clusters.
- Search impressions and clicks for cluster pages.
- Reduction in stale/source-review debt on high-intent pages.

## Stop Rules

Do not publish or refresh a post when:

- The article depends on current official rules and no reliable source is available.
- The new topic duplicates an existing slug or keyword target without a distinct intent.
- The post has no clear AfroTools tool, hub, template, or workflow handoff.
- The article would claim AI, filing, account sync, official submission, medical advice, legal advice, or financial advice beyond verified product behavior.
- The only reason to publish is hitting a cadence target.
