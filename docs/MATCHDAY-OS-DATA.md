# Matchday OS Data Layer

Updated: 2026-05-21

Matchday OS uses a static-first tournament model at `data/matchday-os/tournament.json`. The browser route loads this file directly, so the page can render without Supabase or any unofficial live API.

## Source Rules

- This is an independent AfroTools product, not an official tournament property.
- Do not add official logos, protected marks, trophy likenesses, or partnership language.
- Only update fixtures, groups, stadiums, scores, or kickoff times from verified official tournament, confederation, federation, or host-city sources.
- If a fact is not verified, keep the record as `status: "placeholder"` and `isPlaceholder: true`.
- Do not put scores on placeholder records. Keep `homeScore`, `awayScore`, and knockout advancement values as `null` until verified.

## Data Files

- `data/matchday-os/tournament.json`: teams, fixtures, groups, table rows, time zones, statuses, phases, share cards, prediction-game config, and content modules.
- `data/matchday-os/content.json`: static editorial slots, poll shells, strategy prompts, post-match templates, result-meaning templates, share-card template metadata, and country-room seed data.
- `matchday-os/share-cards/index.html` and `assets/js/matchday-share-cards.js`: local browser canvas generator for square and story-format football cards.
- `matchday-os/sponsors/index.html`: buyer-facing Matchday OS sponsor one-pager with existing AfroTools B2B enquiry routing.
- `scripts/validate-matchday-os-data.js`: schema and integrity validation for the static data model.
- `assets/js/lib/matchday-prediction-engine.js`: config-driven prediction scoring helpers for browser rendering and Node tests.
- `assets/js/lib/matchday-fan-points.js`: referral and Fan Points helpers that keep non-cash recognition separate from Prediction Points.
- `assets/js/lib/matchday-contest-safety.js`: frontend-safe contest-safety helpers for lock checks, hashed-signal validation, duplicate-signal clustering, and launch-gate status.
- `docs/MATCHDAY-OS-CONTEST-SAFETY.md`: rules checklist, admin review workflow, and backend blockers for any prize campaign launch.

## Update Flow

1. Edit `data/matchday-os/tournament.json`.
2. For new teams, add `teamId`, `name`, `countryCode`, `confederation`, `isAfricanTeam`, `group`, `primaryColor`, `secondaryColor`, `fanRoomSlug`, and `shortLabel`.
3. For verified fixtures, set `matchId`, `stage`, `group`, `homeTeamId`, `awayTeamId`, `kickoffUtc`, `venue`, `status`, `homeScore`, `awayScore`, `resultFinal`, `isAfricaFocus`, `featuredMarkets`, and `contentSlug`.
4. For verified group tables, update `groups[].teamIds` and `groups[].tableRows`.
5. Add venue records under `stadiums` before referencing them from fixtures.
6. For editorial slots, update `data/matchday-os/content.json`. Use `status: "seed_prompt"`, `status: "poll_shell"`, or `status: "template_only"` when there is no verified post, vote total, or result.
7. Run `node scripts/validate-matchday-os-data.js`.
8. Run `node --check assets/js/matchday-os.js`, `node --check assets/js/matchday-rooms.js`, and `node --check assets/js/matchday-share-cards.js`.
9. Run `node tests/matchday-standings-engine.test.js` after changing fixture scoring, standings, groups, or bracket slots.
10. Run `node tests/matchday-prediction-engine.test.js` after changing prediction scoring, lock logic, or user-pick shape.
11. Run `node tests/matchday-fan-points.test.js` after changing referral scoring, Fan Points, Top Fans, or referral-abuse rules.
12. Run `node tests/matchday-contest-safety.test.js` after changing anti-cheat config, safety schemas, lock checks, or admin review shell behavior.
13. Browser-smoke `/matchday-os/` and `/matchday-os/rooms/?team=morocco`, then confirm there are no console errors, no horizontal overflow, and placeholder records are still labeled honestly.

## Standings And Bracket Logic

The standings engine lives at `assets/js/lib/matchday-standings-engine.js` and is usable in both the browser and Node tests. It only counts fixtures where `status` is `full_time`, `resultFinal` is `true`, and both scores are numeric.

Sort order is:

1. Points
2. Goal difference
3. Goals scored
4. Head-to-head placeholder
5. Stable team name/order fallback

Official head-to-head, fair-play, drawing-of-lots, and other tournament-specific tie-break rules are not implemented yet. Page copy should say "provisional" or "pending" unless the official rule set and complete verified results are represented in the data.

## Prediction MVP

The prediction game is currently `frontend-local-only`. Picks are stored in browser `localStorage` under `matchday_os_prediction_game`; there is no account-backed persistence, no live leaderboard, and no server-side lock enforcement yet.

The static config in `predictionGame` defines:

- Supported prediction types: match winner, exact score, draw prediction, group qualifiers, best-performing African team, semi-finalists, finalists, and champion.
- Scoring: correct winner 3, correct draw 4, exact score 8, correct group qualifier 10, correct champion 25, African team bonus 2.
- Data schemas for prediction entries, user predictions, score calculations, leaderboard rows, and lock deadlines.
- An empty leaderboard shell. Do not add fake users to production data.

Backend requirements before accepting live entries:

- Auth or signed guest identity.
- Server-side prediction entry storage with immutable submitted-at timestamps.
- Server-side lock enforcement from verified kickoff/campaign cutoff data.
- Verified result source and repeatable scoring job.
- Leaderboard materialization with abuse checks, audit logs, and dispute/recalculation handling.
- Published final rules, eligibility, sponsor terms, privacy copy, and moderation process.

The campaign must remain free-to-enter and skill-based. Do not add odds, staking, paid-entry flows, sportsbook-style copy, or instant prize logic.

## Referral And Fan Points

Matchday OS uses two separate score lanes:

- `Prediction Points`: earned only from football predictions. This is the only score type that can decide the $1,200 prize leaderboard after backend scoring, verified results, legal review, and anti-cheat gates are complete.
- `Fan Points`: earned from predictions, sharing actions, badges, community activity, and verified referrals. This lane is for Top Fans, badges, shoutouts, sponsor perks, and other non-cash recognition.

The cash prize page lives at `/matchday-os/prizes/`. It explains the Top 10 verified-player prize split, payout options, tie-break rules, Fan Points separation, and legal/compliance blockers in public user-facing language. The public prize pool is `$1,200`; first place receives `$500`. The public tracker may show Top 20 players for excitement and sharing, but only the final verified Top 10 receive cash prizes. Do not publish any internal payout cushion or operational fee buffer as prize money.

Referral rules are defined under `predictionGame.fanPoints`:

- Copying a referral link is tracked as an event and earns no points.
- Friend visits through a referral link are tracked as events and earn no points.
- A verified referred session is worth 2 Fan Points, but the reward remains pending until the referred user submits a first locked prediction.
- A referred user's first locked prediction adds 3 Fan Points and releases the pending verified-session reward after backend checks.
- Referral rewards are capped at 25 Fan Points per referrer.
- Self-referrals are not allowed.
- One referral reward is allowed per referred user.
- Referral points never count toward cash-prize ranking.

The current public route is local/demo only. It can generate a local referral link, record local share/referral events, show a local Fan Points display, and render a Top Fans shell. Real referral eligibility requires backend accounts or verified sessions, server-side referral events, hashed `ipHash`, `deviceSignalHash`, and `userAgentHash` review signals, plus admin review for self-referrals, same-device referrals, repeated IP clusters, and rapid signup patterns.

## Anti-Cheat Foundation

The `predictionGame.antiCheat` config is intentionally marked `design-only-backend-required`. It defines required controls but does not claim production enforcement:

- Server-side prediction locks before kickoff.
- No edits after lock.
- One account per person.
- Email verification before leaderboard eligibility.
- Hashed IP, user agent, and device/session signals.
- Timestamped prediction, lock, review, and terms-acceptance records.
- Duplicate account, IP cluster, identical-prediction, and late-entry detection rules.
- Referral abuse detection for self-referrals, same-device referrals, repeated IP clusters, and suspicious rapid signups.
- Admin review queue schema and admin override audit-log schema.
- Manual winner verification before payout.

The public route may show the trust copy and operator shell, but prize launch remains blocked until server-side enforcement and legal review exist.

## Content And Country Rooms

The Matchday OS content layer is static-first and editorially seeded. It is not a live comment system.

- Daily match previews, African team watch cards, strategy prompts, fan polls, post-match reactions, result-meaning templates, tomorrow slots, match-of-the-day, player-to-watch, and group-pressure modules come from `data/matchday-os/content.json`.
- Fan polls are UI shells only. Do not show vote totals until a backend exists.
- Country rooms use `/matchday-os/rooms/?team=<teamId>` and render team identity, fixtures, group position, prediction CTA, latest posts, poll shell, share card, sponsor slot, and discussion prompt from the static data files.
- Do not create fake comments, fake users, fake live discussions, or fake post-match reactions. Use editorial prompts and template states until verified content exists.
- Keep toxic, political, and inflammatory discussion areas out of Matchday OS.

## Share Cards

The public card studio lives at `/matchday-os/share-cards/`. It renders PNG cards locally with browser canvas and does not embed remote artwork. Supported templates are listed in `content.shareCardTemplates` and include today's African matches, local prediction summaries, leaderboard shell, country-room support, viewing-center flyer, group snapshot, knockout path, post-match reaction template, prize challenge invite, and sponsor-safe daily card.

Cards support `1080 x 1080` square and `1080 x 1920` story output. They may use static teams, fixtures, group tables, time zones, and local prediction state, but must keep placeholder fixtures, pending leaderboard ranks, sponsor badges, and post-match reactions clearly labeled. Do not add official tournament logos, trophy likenesses, remote images, or sponsor names that have not been approved.

## Commercial Layer

Matchday OS commercial inventory is defined in `content.commercialInventory` and presented on `/matchday-os/` plus `/matchday-os/sponsors/`. The sponsor one-pager uses the existing AfroTools B2B capture pattern:

- Public sponsor CTAs route to `/business-enquiry/` with `offer`, `prospect`, `prospect_segment`, `source_route`, `tool`, and `cta_type` context.
- The embedded sponsor form on `/matchday-os/sponsors/` posts to `/api/b2b-enquiry` through `assets/js/components/b2b-enquiry-form.js`.
- Public copy must stay buyer-facing and honest: say current analytics and audience data are shared privately during sponsorship conversations instead of publishing invented reach claims.

Supported commercial placements are Matchday OS main sponsor, prediction challenge sponsor, leaderboard sponsor, African teams tracker sponsor, country room sponsor, daily match card sponsor, viewing-center flyer sponsor, newsletter/update sponsor, and blog/strategy post sponsor.

Fan-safe sponsor rules:

- Sponsor placements must be clearly labeled.
- Sponsors cannot impersonate editorial content or claim official tournament, FIFA, federation, team, or broadcast affiliation.
- Sponsors cannot change fixture data, standings, predictions, scoring, winner verification, legal rules, or editorial conclusions.
- Sponsor assets must not block core fan utility or slow the mobile page with heavy creative.
- Prize challenge and leaderboard sponsorships remain blocked until backend persistence, anti-cheat, rules, and legal review gates are complete.

## Time Zones

The required city selector currently covers Lagos, Abuja, Accra, Abidjan, Dakar, Casablanca, Cairo, Johannesburg, Nairobi, Addis Ababa, Kampala, Dar es Salaam, Kigali, Kinshasa, Lusaka, and Harare.
