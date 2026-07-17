# Matchday OS Contest Safety Checklist

Updated: 2026-05-21

Matchday OS prediction prizes are blocked from public launch until backend enforcement, admin review tooling, and legal review are complete. The current route is a frontend/local-demo MVP only.

## Prize Campaign Position

- The public prize pool is `$1,200`.
- First place receives `$500`.
- Top 10 verified players on the final Prediction Points leaderboard receive cash prizes.
- The public tracker may show Top 20 players for excitement and sharing, but only the final verified Top 10 receive cash prizes.
- The public leaderboard is provisional. Final winners are confirmed only after anti-cheat and eligibility review.
- Prediction Points come only from football picks and are the only score used for cash-prize ranking.
- Fan Points from referrals, sharing, badges, and community activity do not count toward cash prizes.
- `$1,200` is the public prize pool. Up to `$100` extra may be kept as an internal cushion for payout fees, FX changes, payment-method friction, or emergency rounding. Do not advertise the cushion as prize money.

## Current Enforcement

- The public route states that predictions lock before kickoff.
- Local picks can be saved only on the user's device.
- Fan Points and referral events are local/demo only and are separated from Prediction Points.
- Referral link copies and referral visits track events only and earn no points.
- Top Fans is a non-cash recognition shell until backend identity and abuse checks exist.
- The shared safety helper rejects raw sensitive signal fields such as raw IP address, raw user agent, and raw device fingerprint.
- The data model requires hashed server signals: `ipHash`, `userAgentHash`, and `deviceSignalHash`.
- The operator shell keeps leaderboard export disabled until authenticated admin tooling exists.
- The static validator keeps the prize campaign free-to-enter, skill-based, and blocked until server enforcement exists.

## Backend Requirements

- Server-side prediction lock before kickoff.
- No edits after lock, enforced by the backend, not just the browser.
- One account per person policy and duplicate account detection.
- Email verification before leaderboard eligibility.
- Device/session fingerprint signals stored only as hashes or derived risk scores.
- IP hash logging.
- User agent hash logging.
- Timestamped prediction records with immutable `submittedAt`, `lockedAt`, and `termsAcceptedAt`.
- Suspicious IP cluster detection.
- Suspicious identical-prediction pattern detection.
- Referral abuse detection for self-referrals, same-device referrals, repeated IP clusters, rapid signups, and duplicate referred users.
- Referral rewards released only after backend-confirmed first locked prediction by the referred user.
- Admin review queue for flagged entries.
- Audit log for admin overrides, disqualifications, winner verification, and leaderboard export.
- Manual winner verification before payout.

## Admin Review Workflow

1. Lock all entries server-side when fixture or campaign deadlines pass.
2. Score entries only from verified result data.
3. Generate risk flags for duplicate accounts, shared hashed IP clusters, repeated device signals, late attempts, and identical prediction patterns.
4. Generate referral risk flags for self-referrals, same-device referrals, repeated IP clusters, suspicious rapid signups, and duplicate referred users.
5. Route flagged entries and referral rewards to an admin review queue.
6. Require an audit-log reason for every override, disqualification, flag clearance, export, or winner verification.
7. Export leaderboard only after unresolved high-severity flags are cleared or escalated.
8. Verify provisional winners manually before prize communication or payout.

## Referral Safety

Referral activity must never change the cash-prize leaderboard. Prediction Points are earned only from football predictions. Fan Points can support Top Fans, badges, shoutouts, sponsor perks, and other non-cash recognition.

Backend referral rules before launch:

- Track `referrerId`, `referredUserId`, timestamp, referral source, and hashed review signals.
- Store only hashes or derived review signals for IP, device/session, and user-agent data.
- Award no points for copying a referral link.
- Award no points for a friend visit.
- Hold the verified-session referral reward as pending until the friend submits a first locked prediction.
- Cap referral rewards at 25 Fan Points.
- Allow only one reward per referred user.
- Flag self-referrals, same-device referrals, repeated IP clusters, and suspicious rapid signups.
- Do not use Fan Points for cash-prize ranking, tie-breaks, or winner selection.

## Legal Rules Checklist

- No purchase required.
- Eligibility countries listed.
- Age minimum stated.
- Contest opening and closing dates stated.
- Prize amount stated.
- Prize split states Top 10 verified players share the `$1,200` public prize pool and first place receives `$500`.
- Winner selection method explained.
- Tie-break rules explained.
- Verification process explained.
- Disqualification conditions explained.
- Data/privacy notice published.
- Void where restricted.
- Legal review completed before launch.

## Blocked Until

Prize launch remains blocked until a server-backed implementation can prove lock enforcement, verified identity, hashed risk-signal logging, referral-abuse review, review queues, audit logs, legal review, and manual winner verification. Do not advertise entries as leaderboard-eligible before those controls exist.
