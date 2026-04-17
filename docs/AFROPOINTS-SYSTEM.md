# AfroPoints System Notes

## Current Product Shape

AfroPoints is a hybrid static-plus-serverless product:

- Static marketing and workflow pages live in `tools/afropoints/`
- Client runtime lives in `engines/afropoints-engine.js`
- Server state lives in Netlify functions:
  - `netlify/functions/afropoints-submit.js`
  - `netlify/functions/afropoints-profile.js`
  - `netlify/functions/afropoints-leaderboard.js`
  - `netlify/functions/afropoints-cashout.js`
  - `netlify/functions/afropoints-verify.js`
- Live data is stored in Supabase tables:
  - `contributions`
  - `points_profiles`
  - `points_ledger`
  - `cashout_requests`
  - `badges`

## Submission Quality Signals

AfroPoints submissions are more monetizable when they capture:

- country
- city
- neighborhood
- observed timestamp
- source type
- proof URL
- optional GPS pin
- structured category payload

These signals help with:

- advertiser-grade price intelligence
- retailer or remittance benchmark reports
- route or neighborhood pricing clusters
- trust and verification scoring
- fraud and low-quality submission filtering

## Payout Model

Supported payout paths now include:

- mobile money
- bank transfer
- crypto wallet
- AfroTools Pro credit

Notes:

- `pro_credit` is treated as an immediate redemption path
- fiat and crypto cashouts remain review-based queue items
- `cashout_requests.payout_details` is the flexible storage layer for method-specific data

## Monetization Data To Collect Next

Highest-value additional product data:

1. Contributor-side demand signals
   - whether the user is a shopper, merchant, recruiter, landlord, student, or operator
   - how often they can submit
   - which categories they can reliably cover
2. Buyer-side demand signals
   - which vertical wants alerts or reports: FMCG, fuel, fintech, education, salary intelligence, rent
   - preferred geography: country, city, neighborhood, route
   - preferred cadence: live feed, weekly digest, monthly benchmark
3. Quality and provenance signals
   - proof type
   - repeatability of source
   - confidence / verification count
   - outlier rate by contributor
4. Commercial packaging signals
   - which categories drive the most submissions
   - which locations have enough density for a sponsored report
   - which payout methods contributors actually prefer

## Reality Check

As of the latest live Supabase inspection:

- AfroPoints schema exists
- badges are seeded
- `contributions`, `points_profiles`, `points_ledger`, `cashout_requests`, and `leaderboard_cache` are empty

That means the product foundation exists, but growth loops and monetization still depend on getting real contribution volume.
