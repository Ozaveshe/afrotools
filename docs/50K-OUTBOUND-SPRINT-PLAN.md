# AfroTools 50K Outbound Revenue Sprint Plan

Updated: 2026-05-05

## Purpose

This sprint turns the shipped AfroTools 50K foundation into a 14-day founder-led outbound motion.

The first goal is not a broad brand campaign. The goal is to source 300 relevant prospects, send 300 disciplined first touches across six batches, follow up on time, and move qualified replies into one of four live buyer paths:

- Widget demo or Widget Pro: `/widgets/`
- Sponsored tool or media placement: `/sponsored-tools/` and `/media-kit/`
- API pilot: `/api/` and `/api/pricing.html`
- Custom calculator: `/custom-calculators/`

Use `/business-enquiry/` for warm buyers who are ready to submit a brief. Keep the 50K Mission Control tracker local-only unless a separate CRM or backend path is approved.

## Operating Rules

- Do not invent customer claims, traffic claims, compliance claims, or revenue claims.
- Do not list fake real companies or fake contacts in prospect files.
- Every sourced prospect must have a visible reason to care about one AfroTools route.
- Every first message must ask for one practical next step, not a vague partnership.
- Every follow-up must be logged with first touch date, last touch date, next follow-up date, status, route, and notes.
- Do not send API or compliance-heavy claims without a narrow use case and a source/freshness review.
- Do not imply sponsors can change calculator formulas, source notes, or outputs.

## Source Assets

Use these internal routes during the sprint:

- `/widgets/`: free embeds, Widget Pro, white-label, setup, analytics, lead capture, and custom widget builds.
- `/widgets/demo/`: technical gallery to show a concrete widget.
- `/widgets/embed.js`: embed loader.
- `widgets/iframe/*.html`: iframe utility files used by the widget gallery and embed flow.
- `/sponsored-tools/`: sponsored tool, category, and country pilots.
- `/custom-calculators/`: scope sprint, MVP build, multi-country build, and maintenance.
- `/media-kit/`: inventory, offer ladder, pilot ranges, FAQ, and sponsorship path.
- `/api/`: API overview for African tax, VAT, FX, fuel, rates, and country data.
- `/api/pricing.html`: free API key, API Growth, API Pro, and Enterprise/custom pilot route.
- `/for-accountants/`: accounting and tax buyer page.
- `/for-hr-payroll/`: HR and payroll buyer page.
- `/for-fintechs/`: fintech buyer page.
- `/for-schools/`: school and education buyer page.
- `/business-enquiry/`: server-backed B2B enquiry path.

## 300-Prospect Sourcing Plan

This is a sourcing plan, not a list of real companies. Add real prospects only after manual research.

| Segment | Count | Countries to bias first | Best offer fit | What to look for | Primary source paths |
| --- | ---: | --- | --- | --- | --- |
| Accounting and tax firms | 60 | Nigeria, Kenya, Ghana, South Africa, Uganda, Tanzania | Widget, custom calculator, API pilot | Firms with tax guides, VAT pages, payroll explainers, SME resources, invoice templates, import duty content | Google search, LinkedIn company search, professional association member pages, tax blog directories, local business directories |
| HR and payroll providers | 55 | Nigeria, Kenya, South Africa, Ghana, Rwanda, Uganda | Widget Pro, API pilot, custom calculator | Payroll software, HR platforms, employer of record, payroll bureaus, payslip services, employer cost content | LinkedIn, G2-style directories where relevant, product comparison pages, payroll blogs, HR event exhibitor lists |
| Fintechs | 55 | Nigeria, Kenya, South Africa, Ghana, Egypt, Morocco, Francophone West Africa | API pilot, custom calculator, sponsored tool | Remittance, loans, savings, merchant services, FX, payroll wallets, SME finance, financial education pages | Startup directories, fintech association pages, accelerator portfolios, app store company pages, LinkedIn |
| Schools and edtechs | 50 | Nigeria, Kenya, Ghana, South Africa, Uganda, Tanzania | Custom calculator, education widget, sponsored tool | School fee pages, scholarship content, admissions resources, student budget content, edtech lead magnets | School directories, edtech lists, admissions blogs, scholarship portals, LinkedIn |
| Business media and publishers | 45 | Pan-Africa, Nigeria, Kenya, Ghana, South Africa, Francophone Africa | Free widget, sponsored tool, media kit | Resource pages, calculators, SME guides, personal finance pages, newsletter sponsorship pages | Publisher media kits, editorial resource hubs, business newsletters, founder newsletters, SEO search |
| Employer-service and trade targets | 35 | Nigeria, Kenya, Ghana, South Africa, Tanzania, Cote d'Ivoire | Sponsored tool, custom calculator, widget | Recruitment firms, immigration services, trade finance, customs brokers, chambers, SME service firms | Chamber directories, trade association member pages, LinkedIn, event sponsor lists, logistics and employer service directories |

Total: 300.

## Sourcing Workflow

1. Pick one segment and one country before searching.
2. Find prospects with an existing resource page, calculator gap, lead magnet gap, or data/API use case.
3. Save only public company information and public contact paths.
4. Prefer role-based contacts when the named person is unclear, such as partnerships, marketing, content, product, developer relations, sales, or founder LinkedIn.
5. Add one sentence in `notes` explaining why this prospect fits.
6. Add one `related_route` that the first message will link.
7. Set `priority` before sending:
   - High: clear resource page plus obvious buyer route plus reachable decision maker.
   - Medium: good segment fit but weak page or unclear owner.
   - Low: relevant audience but no direct offer fit yet.
8. Do not send until the row has `company`, `segment`, `country`, `contact_email_or_linkedin`, `offer_fit`, `priority`, `source`, `related_route`, and `notes`.

## Batch Plan

Use the full batch playbooks in `data/50k/outreach-batches.md`.

| Batch | Count | Primary goal | Primary route | Best prospects |
| --- | ---: | --- | --- | --- |
| Batch 1 | 50 | Free widget or Widget Pro backlink/distribution | `/widgets/` | Publishers, accounting firms, HR blogs, schools, media resource pages |
| Batch 2 | 50 | HR/payroll/API pilots | `/for-hr-payroll/`, `/api/pricing.html` | Payroll providers, HR platforms, employer of record, payroll bureaus |
| Batch 3 | 50 | Sponsored/media pilots | `/sponsored-tools/`, `/media-kit/` | Business media, fintech sponsors, employer services, education sponsors |
| Batch 4 | 50 | Custom calculator builds | `/custom-calculators/` | Fintechs, accounting firms, HR providers, schools, trade services |
| Batch 5 | 50 | Schools and education pilots | `/for-schools/` | Schools, admissions platforms, scholarship portals, edtechs |
| Batch 6 | 50 | Mixed follow-up and reserve | Match by use case | High-fit leftovers, referrals, warm replies, second contacts |

## 14-Day Founder Operating Checklist

Day 1:

- Source 30 prospects: 10 accounting, 10 HR/payroll, 5 media, 5 schools.
- Send 20 Batch 1 first emails.
- Log every row before sending.
- For each sent row, set `first_touch_date`, `last_touch_date`, `status=contacted`, and `next_follow_up_date` 3 business days later.
- Send `/widgets/` when the prospect has a live resource page.

Day 2:

- Source 30 prospects: 15 HR/payroll, 10 fintech, 5 employer-service.
- Send 30 first messages: finish Batch 1, start Batch 2.
- Use LinkedIn only after an email or contact form has been logged, unless LinkedIn is the only public contact path.
- Send `/for-hr-payroll/` when the buyer is HR/payroll and non-technical.
- Send `/api/pricing.html` only when the buyer has a product or developer use case.

Day 3:

- Source 25 prospects: 10 fintech, 10 media, 5 accounting.
- Send 25 Batch 2 first messages.
- Review Day 1 bounces and bad contacts.
- Replace bad rows from reserve sourcing.
- Qualified replies get status `replied` and a next action within 24 hours.

Day 4:

- Source 20 prospects: media and publishers.
- Send 25 Batch 3 first messages.
- Send follow-up 1 to Day 1 non-replies.
- Send `/media-kit/` when the buyer asks for inventory or sponsorship options.
- Send `/sponsored-tools/` when one calculator or category is clearly relevant.

Day 5:

- Source 20 prospects: custom calculator candidates.
- Send 25 Batch 3 first messages.
- Send follow-up 1 to Day 2 non-replies.
- Move any sponsor asking for a custom workflow to `/custom-calculators/`.

Day 6:

- Source 25 prospects: schools, edtechs, scholarship, admissions, and student finance.
- Send 25 Batch 4 first messages.
- Reply to every qualified response from Days 1 to 5.
- Book calls only after the buyer names a page, workflow, route, audience, or integration need.

Day 7:

- Source 20 prospects: schools and education publishers.
- Send 25 Batch 4 first messages.
- Send follow-up 1 to Day 3 non-replies.
- Audit tracker completeness: no blank `next_follow_up_date`, `status`, `offer_fit`, or `related_route` for contacted rows.

Day 8:

- Source 25 prospects: schools and edtechs.
- Send 30 Batch 5 first messages.
- Send follow-up 1 to Day 4 non-replies.
- Send follow-up 2 to Day 1 non-replies.
- Use `/for-schools/` for school and edtech buyers.

Day 9:

- Source 20 prospects: reserve list across all segments.
- Send 20 Batch 5 first messages.
- Send follow-up 1 to Day 5 non-replies.
- Send follow-up 2 to Day 2 non-replies.
- For every qualified reply, choose one link only: widget, sponsored, API, or custom calculator.

Day 10:

- Source 20 prospects: reserve and referral targets.
- Send 25 Batch 6 first messages.
- Send follow-up 1 to Day 6 non-replies.
- Send follow-up 2 to Day 3 non-replies.
- Prepare simple proposal notes for any call booked.

Day 11:

- Source 15 prospects: high-fit gaps only.
- Send 25 Batch 6 first messages.
- Send follow-up 1 to Day 7 non-replies.
- Send follow-up 2 to Day 4 non-replies.
- Send breakup email to Day 1 non-replies after two follow-ups.

Day 12:

- Source 15 prospects: replace bounces and weak rows.
- Send 20 reserve messages only if the follow-up queue is under control.
- Send follow-up 1 to Day 8 non-replies.
- Send follow-up 2 to Day 5 non-replies.
- Convert warm replies to `/business-enquiry/` only when they are ready to submit a brief.

Day 13:

- No new sourcing unless the tracker is below 300.
- Send follow-up 1 to Day 9 non-replies.
- Send follow-up 2 to Day 6 non-replies.
- Send breakup emails to Day 2 and Day 3 non-replies if follow-up 2 was already sent.
- Summarize replies by offer fit, not by vanity counts.

Day 14:

- Clean tracker statuses.
- Send follow-up 1 to Day 10 and Day 11 non-replies where appropriate.
- Send follow-up 2 to Day 7 non-replies.
- Export CSV from the local 50K OS and save a working copy outside browser storage.
- Pick the next 50 prospects only from the segment with the highest qualified reply rate.

## What To Log

Log these fields before first contact:

- `company`
- `segment`
- `country`
- `contact_name` if known
- `contact_email_or_linkedin`
- `offer_fit`
- `priority`
- `source`
- `related_route`
- `notes`

Log these fields during outreach:

- `first_touch_date`
- `last_touch_date`
- `next_follow_up_date`
- `status`
- `deal_value_estimate`
- latest reply summary in `notes`

## Qualified Reply Definition

A reply is qualified if it includes at least one of these:

- Asks about pricing, pilot scope, setup, or timeline.
- Shares a target page, workflow, country, tool, or API use case.
- Asks for widget code, demo link, media kit, API docs, or calculator examples.
- Introduces a decision maker or technical owner.
- Requests a call with a clear topic.
- Gives a concrete objection that can be answered, such as attribution, compliance, traffic proof, API coverage, or launch timing.

Do not count these as qualified:

- Auto replies.
- Bounces.
- Generic "thanks, will review" with no next step.
- Vendor pitches to AfroTools.
- Replies that ask for unsupported official compliance, filing, or guaranteed outcomes.

## Link Decision Rules

Send `/widgets/` when:

- The prospect has a public resource, blog, calculator, tool, or guide page.
- The fastest ask is a free embed, backlink, or Widget Pro pilot.
- The buyer cares about content utility, not API integration.

Send `/widgets/demo/` when:

- The prospect asks "what does it look like?"
- You are showing one concrete widget after they show interest.
- You need to prove embed feasibility before discussing paid setup.

Send `/sponsored-tools/` when:

- The buyer sells to one of AfroTools' tool audiences.
- A single calculator, category, country, or workflow placement is enough.
- The buyer is not asking for a custom product build.

Send `/media-kit/` when:

- The buyer asks for inventory, sponsorship options, pilot ranges, or package choices.
- The prospect is a publisher, sponsor, agency, or brand partner.
- You need a neutral overview before choosing a specific package.

Send `/api/pricing.html` when:

- The buyer has a product, developer, data, or server-side integration use case.
- They mention PAYE, VAT, FX, fuel, rates, country data, or internal calculators.
- They can start with one endpoint family and one country set.

Send `/custom-calculators/` when:

- The buyer has a proprietary workflow, lead magnet, quote tool, eligibility flow, cost model, or branded calculator idea.
- The prospect needs source notes, input/output design, launch support, or maintenance.
- The work cannot be handled by an existing free widget.

Send `/business-enquiry/` when:

- The prospect is ready to send a brief.
- You already know the offer fit, market, use case, and preferred next step.
- They need an official intake route rather than another cold message.

## Qualification Rubric

### Good Fit

- Has a visible resource page, calculator gap, buyer audience, or product integration need.
- Clear country or market focus.
- Public contact path or reachable decision maker.
- One AfroTools route is obvious.
- Notes can name the first pilot in one sentence.

Next action: send the matching batch first email within 24 hours. If they reply, offer one concrete next step and one link.

### Maybe Fit

- Relevant segment but the page, owner, or use case is unclear.
- Broad company with no obvious pilot page.
- Contact path is generic or indirect.
- Could fit after more research.

Next action: keep in reserve, send only after high-fit rows are exhausted, or use LinkedIn to ask who owns partnerships/content/product.

### Bad Fit

- No African market relevance.
- No public business, product, content, or buyer path.
- Only consumer support contacts with no B2B fit.
- Requires official compliance, regulated advice, bank approval, or guaranteed outcomes AfroTools cannot claim.
- Prospect is a competitor for whom outreach would create confusion or low trust.

Next action: do not send. Replace the row.

## Estimated Deal Value Bands

Use these as estimates in the tracker. Do not present them as negotiated prices.

| Band | Deal estimate | Typical offer |
| --- | --- | --- |
| Distribution only | $0 now, backlink or audience value | Free widget with attribution |
| Small recurring | $99 to $299 per month | Widget Pro setup, branding, analytics notes, or opt-in lead capture |
| Starter sponsorship | $150 to $500 per month | Single sponsored tool placement |
| Mid sponsorship | $500 to $2,000 per month | Category, country, workflow, or media package |
| API pilot | $149 to $499 per month | API Growth or API Pro pilot |
| Scope sprint | $300 to $750 one time | Custom calculator scoping sprint |
| MVP build | $1,500 to $4,000 one time | Branded calculator MVP |
| Larger build | $4,000 to $12,000 one time | Multi-country or complex workflow build |
| Maintenance | $250 to $1,500 per month | Updates, reporting, support, rule changes, and expansion |

## Sprint Files

- `data/50k/prospect-tracker-template.csv`: founder-facing CSV with the requested clean headers.
- `data/50k/prospect-tracker-mc-import-template.csv`: current Mission Control import-compatible headers.
- `data/50k/outreach-batches.md`: six 50-prospect batch briefs.
- `data/50k/outreach-templates.md`: founder-sendable first touch, LinkedIn, WhatsApp-style, follow-up, and breakup copy.
