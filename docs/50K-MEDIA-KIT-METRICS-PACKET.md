# AfroTools 50K Private Media Kit Metrics Packet

Updated: 2026-05-15

## Purpose

This packet is the private sponsor-facing evidence pack for AfroTools media-kit conversations. It is designed for qualified buyers who request current audience details from `/media-kit/`, `/sponsored-tools/`, `/widgets/`, `/custom-calculators/`, or a segment route.

The public `/media-kit/` page must stay buyer-facing. It should explain the available sponsorship paths, pilot ranges, inventory, exclusions, and enquiry flow. It should not expose unverified traffic numbers, customer names, revenue, logos, or private analytics.

## Hard Rules

- Do not invent traffic, users, sessions, geography, revenue, customers, logos, conversion rates, or sponsor results.
- Use placeholders when analytics are not exported or connected.
- Label every metric with source, date range, export date, and owner.
- Separate verified analytics from estimates, projections, and founder notes.
- Remove any buyer-specific data before sharing the packet with another prospect.
- Do not imply sponsors can alter calculator formulas, source notes, methodology, disclaimers, or independent editorial output.
- Do not sell hidden widget usage data as sponsor leads. Lead sharing requires explicit user submission and consent.

## Packet Cover

Use this block at the top of every private packet.

```text
AfroTools Private Sponsor Metrics Packet
Prepared for: [BUYER_OR_SEGMENT]
Prepared by: [OWNER]
Prepared on: [YYYY-MM-DD]
Reporting period: [YYYY-MM-DD to YYYY-MM-DD]
Analytics status: [VERIFIED_EXPORT | PARTIAL_EXPORT | PLACEHOLDER_ONLY]
Primary request source: [media-kit | sponsored-tools | widgets | custom-calculators | api | segment-route]
Confidentiality note: Private planning packet. Do not publish or forward as public traffic proof.
```

## Verified Traffic

Use only exported analytics or server logs. If unavailable, leave the value blank and mark `NEEDS_EXPORT`.

| Metric | Value | Date range | Source | Export date | Status | Notes |
| --- | ---: | --- | --- | --- | --- | --- |
| Total sessions | [NEEDS_EXPORT] | [YYYY-MM-DD to YYYY-MM-DD] | [GA4/Search Console/Netlify/logs] | [YYYY-MM-DD] | NEEDS_EXPORT | Do not estimate. |
| Total users | [NEEDS_EXPORT] | [YYYY-MM-DD to YYYY-MM-DD] | [GA4] | [YYYY-MM-DD] | NEEDS_EXPORT | Do not estimate. |
| Organic clicks | [NEEDS_EXPORT] | [YYYY-MM-DD to YYYY-MM-DD] | [Search Console] | [YYYY-MM-DD] | NEEDS_EXPORT | Match property and date range. |
| Top country sessions | [NEEDS_EXPORT] | [YYYY-MM-DD to YYYY-MM-DD] | [GA4] | [YYYY-MM-DD] | NEEDS_EXPORT | Use country-level export. |
| Business enquiry submissions | [NEEDS_EXPORT] | [YYYY-MM-DD to YYYY-MM-DD] | [Supabase data_buyer_leads or Netlify logs] | [YYYY-MM-DD] | NEEDS_EXPORT | Count consented submissions only. |
| Widget or embed loads | [NEEDS_EXPORT] | [YYYY-MM-DD to YYYY-MM-DD] | [Analytics/logs] | [YYYY-MM-DD] | NEEDS_EXPORT | Only if instrumented. |

## Top Tools And Pages

Rank pages from exported analytics, not assumptions. Keep public route paths in the packet so sponsor options can map to exact pages.

| Rank | Route | Page type | Sessions | Users | Organic clicks | Buyer fit | Source | Status |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- | --- |
| 1 | [ROUTE] | [tool/category/country/blog/API/widget] | [NEEDS_EXPORT] | [NEEDS_EXPORT] | [NEEDS_EXPORT] | [SEGMENT_FIT] | [EXPORT_NAME] | NEEDS_EXPORT |
| 2 | [ROUTE] | [tool/category/country/blog/API/widget] | [NEEDS_EXPORT] | [NEEDS_EXPORT] | [NEEDS_EXPORT] | [SEGMENT_FIT] | [EXPORT_NAME] | NEEDS_EXPORT |
| 3 | [ROUTE] | [tool/category/country/blog/API/widget] | [NEEDS_EXPORT] | [NEEDS_EXPORT] | [NEEDS_EXPORT] | [SEGMENT_FIT] | [EXPORT_NAME] | NEEDS_EXPORT |

Suggested buyer-fit labels:

- accounting-tax
- hr-payroll
- fintech
- schools-edtech
- business-media
- trade-logistics
- developer-api
- general-sme

## Countries

Use country-level analytics, not country coverage in the repo. Repo coverage is inventory; analytics country data is audience proof.

| Rank | Country | Sessions | Users | Organic clicks | Top matching route | Sponsor relevance | Source | Status |
| ---: | --- | ---: | ---: | ---: | --- | --- | --- | --- |
| 1 | [COUNTRY] | [NEEDS_EXPORT] | [NEEDS_EXPORT] | [NEEDS_EXPORT] | [ROUTE] | [WHY_THIS_BUYER_CARES] | [EXPORT_NAME] | NEEDS_EXPORT |
| 2 | [COUNTRY] | [NEEDS_EXPORT] | [NEEDS_EXPORT] | [NEEDS_EXPORT] | [ROUTE] | [WHY_THIS_BUYER_CARES] | [EXPORT_NAME] | NEEDS_EXPORT |
| 3 | [COUNTRY] | [NEEDS_EXPORT] | [NEEDS_EXPORT] | [NEEDS_EXPORT] | [ROUTE] | [WHY_THIS_BUYER_CARES] | [EXPORT_NAME] | NEEDS_EXPORT |

## Audience Segments

This section maps verified route behavior to buyer segments. Do not turn this into demographic claims unless analytics or consented research proves them.

| Segment | Evidence routes | Verified signal | Sponsor fit | Missing proof | Status |
| --- | --- | --- | --- | --- | --- |
| Accounting and tax | [ROUTES] | [NEEDS_EXPORT] | VAT, PAYE, invoice, import duty, tax-calendar pilots | [GA4 routes, Search Console queries, enquiry data] | NEEDS_EXPORT |
| HR and payroll | [ROUTES] | [NEEDS_EXPORT] | PAYE, payslip, employer-cost, payroll widget, API pilot | [GA4 routes, Search Console queries, enquiry data] | NEEDS_EXPORT |
| Fintech | [ROUTES] | [NEEDS_EXPORT] | Remittance, fees, loans, savings, FX, API pilot | [GA4 routes, Search Console queries, enquiry data] | NEEDS_EXPORT |
| Schools and edtech | [ROUTES] | [NEEDS_EXPORT] | Admissions, fees, scholarships, grades, education sponsorship | [GA4 routes, Search Console queries, enquiry data] | NEEDS_EXPORT |
| Business media and publishers | [ROUTES] | [NEEDS_EXPORT] | Widgets, sponsored tools, media placement, newsletter fit | [GA4 routes, Search Console queries, enquiry data] | NEEDS_EXPORT |
| Developer/API buyers | [ROUTES] | [NEEDS_EXPORT] | API docs, API pricing, sandbox, paid pilot | [API logs, key signups, docs traffic] | NEEDS_EXPORT |

## Sponsorship Inventory

Inventory can be described from the repo. Performance claims still require exported analytics.

| Inventory | Public route | What buyer gets | Evidence needed before pricing as proven inventory | Exclusions |
| --- | --- | --- | --- | --- |
| Sponsored tool placement | `/sponsored-tools/` | Clearly labeled CTA on one tool or workflow page | Page traffic, audience country, query intent, conversion goal | No formula, source, or result manipulation. |
| Category or country bundle | `/media-kit/` | Bundle across relevant tool, category, country, and widget surfaces | Route list, traffic export, sponsor fit notes | No unverified reach claims. |
| Widget package | `/widgets/` | Free attributed embed or paid Widget Pro setup | Widget inventory, embed route, host page fit, optional analytics proof | No hidden lead resale. |
| Custom calculator | `/custom-calculators/` | Branded calculator, source model, embed option, lead path | Buyer workflow, source rules, launch scope | No official filing or guaranteed savings claims. |
| API/data pilot | `/api/`, `/api/pricing`, `/developers/` | Sandbox or paid pilot for data/calculation access | Endpoint fit, API usage needs, data freshness review | No overclaiming live paid tier readiness. |

## Pilot Options

Use these as conversation scaffolding. Final terms should reflect verified audience fit, target pages, reporting cadence, and implementation effort.

| Pilot | Public route | Typical scope | Public range reference | Private proof required |
| --- | --- | --- | --- | --- |
| Single sponsored tool | `/sponsored-tools/` | One page, one sponsor label, one CTA, short proof window | $150 to $500 per month | Page traffic and audience fit export. |
| Category or country sponsorship | `/media-kit/` | Several related surfaces around one market or workflow | $500 to $2,000 per month | Route bundle, country traffic, and buyer-fit notes. |
| Widget Pro | `/widgets/` | Curated widget pack, setup, branding, optional lead capture | $99 to $299 per month | Embed inventory and partner page fit. |
| Custom calculator | `/custom-calculators/` | Branded MVP calculator with source rules and CTA | $1,500+ build | Scoped workflow, source model, owner approval. |
| API pilot | `/api/pricing` | API Growth or API Pro evaluation | $149 to $499 per month | Endpoint fit, expected request volume, freshness needs. |

## Exclusions

Include this section in every private packet.

- No sponsor can change independent calculator formulas, methodology, source notes, warnings, or disclaimers.
- No public packet can include unverified traffic, revenue, customer, or logo claims.
- No guarantee of official tax, payroll, immigration, school, or financial compliance.
- No hidden sale of widget usage data as leads.
- No exclusivity unless it is written into a paid agreement and reviewed separately.
- No claims of guaranteed conversions, guaranteed savings, guaranteed ranking, or guaranteed audience volume.
- No buyer-specific metrics should be reused for another buyer without removing confidential context.

## Update Checklist

Before sending a private packet:

1. Export GA4 page and country traffic for the requested date range.
2. Export Search Console top pages and queries for the requested date range.
3. Export or count consented B2B enquiries from `public.data_buyer_leads` if live access is approved.
4. Confirm any widget/embed analytics source is actually instrumented before naming widget loads.
5. Fill `data/50k/media-kit-metrics-template.json` with the verified values.
6. Recheck the public route links in the packet.
7. Remove placeholders that are not relevant to the buyer, but do not replace them with guesses.
8. Set the packet status to `VERIFIED_EXPORT`, `PARTIAL_EXPORT`, or `PLACEHOLDER_ONLY`.

## Private Reply Snippet

Use this after a qualified buyer asks for numbers.

```text
Thanks. We share current audience and placement details privately so the numbers match the market, route, and timing you are evaluating.

I can prepare a packet for [COUNTRY_OR_SEGMENT] covering verified traffic, top matching pages, audience-fit notes, sponsor inventory, pilot options, exclusions, and the latest update date. I will leave any unavailable analytics blank instead of estimating.
```
