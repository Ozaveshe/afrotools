# AfroPoints System Notes

## Current Product Shape

AfroPoints is a hybrid static-plus-serverless product:

- Static contributor cockpit, workflow, payout, leaderboard, guide, and buyer pages live in `tools/afropoints/`
- Client runtime lives in `engines/afropoints-engine.js`
- Server state lives in Netlify functions:
  - `netlify/functions/afropoints-account.js`
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

As of the 2026-05-02 live Supabase inspection:

- AfroPoints schema exists
- badges are seeded
- RLS is enabled on account tables, including `points_profiles`, `points_ledger`, `contributions`, and `cashout_requests`
- live counts were small but no longer all empty: `points_profiles = 1`, `points_ledger = 2`, `contributions = 1`, `cashout_requests = 0`

That means the product foundation exists, but growth loops and monetization still depend on getting real contribution volume.

## Account Snapshot Contract

Use `/.netlify/functions/afropoints-account` as the preferred signed-in account snapshot endpoint when a page needs profile, recent activity, recent contributions, and cashout history together.

- It verifies the user with the shared browser-session auth helper so bearer tokens and secure session cookies follow the same path.
- It returns account data from Supabase in one backend round trip, reducing repeated `/auth/v1/user` checks and duplicate table reads.
- Dashboard and cockpit views should call this endpoint first, then fall back to narrower function calls only if the snapshot endpoint is unavailable.
- After contribution, profile setup, or cashout actions, pages should clear `ap_profile` and `afropoints_dashboard_lane_cache`, then dispatch `afropoints-account-change` so open account modules refresh quickly.

## Account Product Standard

AfroPoints should behave as an account lane, not as a disconnected marketing microsite.

- The AfroPoints homepage is the contributor cockpit: signed-out users see accepted data types, review expectations, payout thresholds, and first contribution paths; signed-in users see points, review status, profile readiness, trust score, cashout progress, recent submissions, and next action.
- `/dashboard/` surfaces AfroPoints beside saved tools, calculation history, and workspace items. Dashboard modules should fetch account-backed profile, ledger, contribution, and cashout data first, using localStorage only as an offline/cache mirror.
- AfroPoints pages share the same account navigation: Cockpit, Submit data, Cashout, Leaderboard, Review rules, Data buyers, and Account.
- Contribution category labels and routes must come from `AfroPointsEngine.CATEGORIES` so the UI stays aligned with the server taxonomy.
- Cashout copy must stay precise: 2,000 points minimum for mobile money, bank transfer, and reviewed crypto payout requests; 500-point blocks for AfroTools Pro credit; fiat and crypto payouts are pending review until approved.
- Leaderboard and buyer-facing copy must avoid implying live liquidity or proven payout volume unless live data verifies it.

When adding a new AfroPoints page, include `tools/afropoints/account-system.css`, use the shared account navigation, and route account actions back to the contributor cockpit, submit flow, cashout flow, verification guide, or main `/dashboard/` instead of creating a separate dashboard surface.
