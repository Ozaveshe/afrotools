# Matchday OS Backend Contract

Matchday OS is a static-first sports product with server-backed account, prediction, leaderboard, referral, and anti-cheat paths.

## Canonical Static Data

- Public tournament fixture source: `data/matchday-os/tournament-full.json`
- Editorial/community source: `data/matchday-os/content.json`
- Legacy smaller fixture seed: `data/matchday-os/tournament.json`

New Matchday UI and validation should prefer `tournament-full.json` unless a route explicitly needs a small fallback.

## Public API Routes

Routes are exposed through `_redirects` and implemented in `netlify/functions/`.

- `GET /api/matchday/leaderboard`
  - Function: `netlify/functions/matchday-leaderboard.js`
  - Reads safe public rows from `public.matchday_public_leaderboard`
  - Response shape: `{ data: MatchdayPublicLeaderboardRow[], meta: {...} }`

- `GET /api/matchday/fixtures-sync-status`
  - Function: `netlify/functions/matchday-fixtures-sync-status.js`
  - Reads `tournament-full.json` metadata and returns fixture/source status

- `POST /api/matchday/submit-prediction`
  - Function: `netlify/functions/matchday-submit-prediction.js`
  - Requires an authenticated AfroTools/Supabase session.
  - Writes user profile, one active prediction entry, and unlocked fixture predictions through the server only.
  - Rejects or skips locked, placeholder, unknown, or invalid fixtures instead of faking a local write.
  - Response keeps leaderboard and prize eligibility provisional until scoring, anti-cheat, and manual review run.

- `GET /api/matchday/my-predictions`
  - Function: `netlify/functions/matchday-get-my-predictions.js`
  - Requires authentication.
  - Returns only the authenticated user's entries and fixture predictions with computed lock status.

- `POST /api/matchday/submit-referral`
  - Function shell exists.
  - Must reject self-referrals and award points only through the server ledger.
  - Referral rewards remain intentionally disabled until the server ledger and review rules are implemented.

- `POST /api/matchday/fan-action`
  - Function shell exists.
  - Must award Fan Points server-side only after dedupe and abuse checks.
  - Fan Point awards remain intentionally disabled for this backend slice.

- `POST /api/matchday/score-engine`
  - Function shell exists.
  - Admin-only before score recompute is enabled.
  - Scoring remains intentionally disabled until the operator job and review workflow are ready.

- `GET|POST /api/matchday/anti-cheat-review`
  - Function shell exists.
  - Admin-only before review queue actions are enabled.

## Supabase Tables

Baseline migration: `supabase/migrations/050-matchday-os-backend-baseline.sql`

Core public and user tables:

- `matchday_profiles`
- `matchday_prediction_entries`
- `matchday_fixture_predictions`
- `matchday_leaderboard_scores`
- `matchday_public_leaderboard`
- `matchday_referral_events`
- `matchday_fan_point_events`
- `matchday_growth_events`

Safety and operator tables:

- `matchday_anti_cheat_events`
- `matchday_prize_eligibility`
- `matchday_review_queue`
- `matchday_audit_logs`
- `matchday_admin_notes`
- `matchday_influencer_codes`
- `matchday_daily_marketing_rollups`

## RLS Rules

- Anonymous users may only read safe public leaderboard rows.
- Authenticated users may read and write their own profile, unlocked entries, unlocked fixture predictions, and non-award referral events.
- Users may not write leaderboard scores, public leaderboard rows, prize eligibility, anti-cheat reviews, audit logs, admin notes, or Fan Point awards.
- Admin policies use `private.matchday_is_admin()`.

## Prize Safety

- Public leaderboard rows are always provisional.
- Final winners require anti-cheat and eligibility review.
- Payout identity details must not be collected on public pages.
- Raw IP, user-agent, and device signals must not be stored in frontend code. Server functions may store hashed signals only.
