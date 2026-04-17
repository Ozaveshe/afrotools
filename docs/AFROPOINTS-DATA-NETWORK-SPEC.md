# AfroPoints Data Network Spec

## 1. Title and Metadata

- Title: AfroPoints Data Network and Gold-Data Apps
- Author: Codex
- Date: 2026-04-17
- Status: Approved for implementation
- Reviewers: AfroTools product owner, engineering

## 2. Context

AfroPoints already has a working rewards loop, contributor dashboard, cashout flow, and Supabase-backed contribution tables. It does not yet have the shared data-network model needed to support multiple market-intelligence verticals, buyer lead capture, or reviewer operations.

The next product phase turns AfroPoints into the intake and trust layer for ten gold-data verticals: informal FX and remittance spreads, fuel and transport fares, staple basket prices, rent intelligence, salary intelligence, fintech fees, backup power costs, school fees, clinic and pharmacy costs, and wholesale-to-retail spreads.

The system must stay static-first, Netlify-backed, and Supabase-backed. The contributor experience must remain simple for mobile users in Africa, while the backend grows into a B2B data product that can power benchmark dashboards, exports, and API access.

## 3. Functional Requirements

- FR-1: AfroPoints MUST support a standardized submission envelope with `vertical`, `subtype`, `country_code`, `city`, `neighborhood`, `observed_at`, `source_type`, `proof_url`, `photo_url`, `latitude`, `longitude`, `currency_code`, `unit`, `quantity`, `provider_name`, `merchant_name`, `route_name`, `business_context`, and `payload`.
- FR-2: AfroPoints MUST persist raw submissions in `contributions` while routing each supported subtype into the correct domain normalizer.
- FR-3: The contributor profile flow MUST collect contributor persona, regular locations and routes, category coverage, submission frequency, payout preference, and proof comfort level.
- FR-4: The system MUST support these `contributions.data_category` values: `informal_fx_rate`, `remittance_quote`, `fuel_price`, `transport_fare`, `staple_price`, `rent_listing`, `lease_risk_report`, `salary_report`, `fintech_fee`, `backup_power_cost`, `school_fee`, `clinic_cost`, `pharmacy_price`, and `wholesale_retail_spread`.
- FR-5: The system MUST compute an auto-confidence score from proof presence, source type, recency, geolocation precision, contributor trust, and similarity to recent nearby data.
- FR-6: The system MUST send rent or lease submissions, clinic or pharmacy submissions, new cities, new routes, and outliers above a 20 percent delta into `review_queue` before publication.
- FR-7: Verified submissions MUST update both the domain table and `data_confidence`.
- FR-8: Rejected or stale submissions MUST remain stored in raw form but MUST NOT become public buyer-facing data.
- FR-9: Crypto payouts MUST remain review-based and MUST NOT auto-send on-chain in v1.
- FR-10: The product MUST expose public read APIs for all launch verticals and filter them to verified or sufficiently corroborated records only.
- FR-11: The product MUST support buyer lead capture with company, use case, verticals, locations, cadence, delivery format, budget band, contact information, and consent.
- FR-12: The product MUST provide an internal reviewer surface for pending submissions, outliers, payout approvals, and buyer leads.
- FR-13: The product MUST provide public contributor docs and buyer-facing pages for onboarding, quality expectations, payouts, privacy, and B2B data access.
- FR-14: Nigeria MUST launch with a dedicated lease-risk flow built on the existing tenant-screening logic and adapted for lease-scam detection.

## 4. Non-Functional Requirements

- NFR-1: The backend MUST remain compatible with Netlify Functions and Supabase without requiring a framework rewrite.
- NFR-2: New APIs SHOULD return in under 700 ms for uncached filtered reads against a single vertical and country.
- NFR-3: Public GET APIs MUST be safe to cache and SHOULD emit cache-friendly headers.
- NFR-4: Reviewer and payout operations MUST require authenticated or admin-gated access paths.
- NFR-5: New pages MUST render on mobile and desktop without layout breakage.
- NFR-6: All new repo workflows MUST be documented in `docs/`.

## 5. Acceptance Criteria

- AC-1: Given a logged-in contributor submits any supported subtype, when the request is valid, then the system stores a normalized `contributions` row and a corresponding domain row or normalization target.
- AC-2: Given a contributor completes onboarding, when the profile is saved, then the new onboarding fields are available from the profile endpoint and prefill subsequent submission flows.
- AC-3: Given a submission has proof, precise location, and a trusted contributor source, when it is saved, then its computed confidence is higher than a proofless anonymous-style submission.
- AC-4: Given a rent, clinic, pharmacy, new-city, new-route, or 20 percent outlier submission, when it is saved, then a `review_queue` row is created and the record is not publicly visible.
- AC-5: Given a verified submission, when reviewer or consensus verification completes, then the domain row becomes public and `data_confidence` reflects the verified metric.
- AC-6: Given a rejected submission, when the decision is applied, then the raw record remains stored but public APIs do not return it.
- AC-7: Given a buyer submits the data buyer form, when consent is provided, then a `data_buyer_leads` row is created and the reviewer surface can list it.
- AC-8: Given an authenticated user requests a crypto payout, when the cashout is created, then it remains in pending review instead of triggering automatic payment.
- AC-9: Given a user visits any new gold-data tool page, when the page loads, then it can fetch its live API dataset and submit a report through AfroPoints.
- AC-10: Given a user opens the salary route, when the old broken page is replaced, then the new salary intelligence app renders instead of redirecting to an unrelated page.

## 6. Edge Cases

- EC-1: Invalid or partially supplied coordinates MUST be rejected.
- EC-2: Unsupported subtype values MUST be rejected with a 400 response.
- EC-3: Missing proof URLs MUST NOT block submission, but MUST lower confidence.
- EC-4: Duplicate same-day submissions from the same user and subtype SHOULD not create an infinite rewards exploit; daily caps still apply.
- EC-5: Empty public datasets MUST return structured empty-state responses instead of errors.
- EC-6: If a reused target table such as `p2p_rates`, `fuel_prices`, or `community_prices` cannot be safely updated at submission time, the raw contribution MUST still be stored and only verified output may write to downstream tables.
- EC-7: If the reviewer surface cannot determine a prior baseline for delta comparison, the record SHOULD default into review rather than auto-publishing.

## 7. API Contracts

```ts
type SubmissionSubtype =
  | 'informal_fx_rate'
  | 'remittance_quote'
  | 'fuel_price'
  | 'transport_fare'
  | 'staple_price'
  | 'rent_listing'
  | 'lease_risk_report'
  | 'salary_report'
  | 'fintech_fee'
  | 'backup_power_cost'
  | 'school_fee'
  | 'clinic_cost'
  | 'pharmacy_price'
  | 'wholesale_retail_spread';

interface AfroPointsSubmission {
  category?: string;
  vertical: string;
  subtype: SubmissionSubtype;
  country_code: string;
  city: string;
  neighborhood?: string | null;
  observed_at?: string | null;
  source_type?: string | null;
  proof_url?: string | null;
  photo_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  currency_code: string;
  unit?: string | null;
  quantity?: number | null;
  provider_name?: string | null;
  merchant_name?: string | null;
  route_name?: string | null;
  business_context?: string | null;
  payload: Record<string, unknown>;
}

interface AfroPointsProfileOnboarding {
  contributor_persona?: string | null;
  regular_countries?: string[];
  regular_cities?: string[];
  regular_neighborhoods?: string[];
  regular_routes?: string[];
  coverage_categories?: string[];
  submission_frequency?: string | null;
  payout_preference?: string | null;
  proof_comfort?: string | null;
}

interface BuyerLeadPayload {
  company: string;
  contact_name?: string | null;
  contact_email: string;
  contact_phone?: string | null;
  use_case: string;
  verticals: string[];
  countries?: string[];
  cities?: string[];
  cadence?: string | null;
  delivery_format?: string | null;
  budget_band?: string | null;
  consent: boolean;
}
```

## 8. Data Models

- `contributions`: raw intake plus standardized submission envelope fields.
- `points_profiles`: contributor onboarding and supply-side coverage fields.
- `data_buyer_leads`: buyer demand capture and review state.
- `remittance_quotes`: provider quotes and delivery-time comparisons.
- `transport_fares`: fare-by-route records and route metadata.
- `market_basket_templates`: named baskets by market and geography.
- `market_basket_snapshots`: time-stamped basket totals and item breakdowns.
- `rent_listings`: rent asks, lease terms, and vacancy metadata.
- `lease_risk_reports`: Nigeria-first lease scam scoring data.
- `salary_reports`: raw crowd salary submissions for aggregation.
- `fintech_fee_reports`: ATM, transfer, cash-out, POS, bank, and USSD fee reports.
- `backup_power_reports`: generator, diesel, LPG, inverter, and solar backup costs.
- `school_fee_reports`: tuition and extras by institution.
- `clinic_cost_reports`: facility or service treatment costs.
- `pharmacy_price_reports`: medicine prices by dosage, pack size, and city.
- `wholesale_retail_reports`: spread reports between wholesale and retail price points.

## 9. Out of Scope

- OS-1: Automatic crypto wallet disbursement is out of scope for v1.
- OS-2: French and Swahili localization are out of scope for the initial launch pass.
- OS-3: A framework migration or SPA rewrite is out of scope.
- OS-4: Paid ad optimization is out of scope relative to B2B data packaging and buyer conversion.
