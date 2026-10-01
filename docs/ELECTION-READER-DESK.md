# Election reader desk and source monitor

Mission: make deep, source-linked election updates across Africa accessible every day.

## Current evidence and goals

The 27 September ledger has 12 records across 8 countries. The newsroom has 3 reviewed briefs.
The Nigeria candidate file is the Ekiti 2026 roster, with 15 contestants; it is not a 2027 presidential roster.
No polling or approval observations have been admitted. These counts are a baseline, not proof of full coverage.

The country shortcut bar and watchlist help returning readers reach the countries they follow. The watchlist stores only country names on the device, requires no account, and supports removal. If storage is blocked it remains usable for the current visit.

Acceptance goals:
- Readers can open a country from its flag/name or a calendar entry and inspect candidates, source-check dates, timelines and next-watch items.
- Every published survey includes original source, pollster, sponsor, population, exact question, fieldwork dates, sample size, method, sampling type, weighting, review date and limitations.
- No inferred winner, synthetic poll, modelled approval rating, interpolated trend or fabricated respondent enters the dataset.
- Source monitoring runs hourly, records failures and changes, and is visibly stale after two hours.
- Editorial research reviews active election sources daily; publication depends on verified developments.
- Expand to 54 countries with country-by-country evidence. Until then the interface reports actual partial coverage.
- Next content priorities: verify Nigeria's current national roster/timetable, build sourced candidate biographies and policy records, then admit eligible published surveys. Recheck every existing stale record.

## Survey admission

`data/government/election-surveys.json` is separate from the official electoral ledger and newsroom.
A pollster's report is survey evidence, not an electoral authority notice. Approval and voting intention are separate measures.
The browser fails closed on missing methodology, impossible dates, invalid percentages, unknown elections and unsupported uncertainty claims.
Percentages are copied from a reviewed original report; no normalisation, averaging or forecast is performed.
The question, denominator and all response options (including undecided) must be preserved. Partial tables must explicitly mark includesAllResponseOptions=false.
Margin of error is nullable and permitted only for probability samples. Non-probability or self-selected samples cannot borrow that label.

The original-source discovery list starts with NOI Polls and Afrobarometer.
A reachable homepage is not proof of a relevant current survey.
Do not publish a survey until the actual report and methodology are reviewed and the survey population matches the named jurisdiction.
Store aggregate evidence only. Do not store respondents' identifying details in this dataset.

A future AfroTools reader survey needs explicit informed consent, privacy retention rules, duplicate/abuse controls and auditable aggregate counts before launch.
Label it as self-selected, state recruitment/response limits, and keep it separate from representative polls.
No collection form is shipped in this pass.

## Monitor implementation and proof

`scheduled-election-monitor.mjs` uses the existing data-store write/read boundary and a code-owned bounded source list.
It runs at minute 23 each hour in UTC after a production deployment. It does not run in previews.
`/api/election-monitor` exposes persisted observations, including blocked/failed sources, last run time and review-needed signals.
A source hash change is an editorial queue signal, never an automatic article, candidate fact, poll result or official confirmation.
First observations require review too. Failed checks retain the earlier successful observation timestamp.
No new secrets or direct browser database writes are introduced.

Deployment, a scheduled invocation and successful persistence must all be verified before claiming the bot is on.
Read the public API after the next scheduled fire, confirm its timestamp advances, and inspect source failures.
An HTTP 503, missing timestamp, failed persistence or old record is unavailable/stale, not healthy.

## Validation and rollback

Run:
- node --test tests/election-reader-desk.test.js tests/election-monitor.test.js
- node tests/scheduled-event-auth.test.js
- npm run elections:validate
- npm run elections:calendar:check
- npm run elections:news:check
- npm run audit:automation-registry
- npm run audit:public-claims
- npm run check-links
- npx playwright test tests/e2e/election-reader-desk.spec.js --project=chromium --workers=1
- npm run build:deploy
- npm run audit:dist
- npm run security:scan

Regenerate the country index through generate-election-calendar-snapshot.js.
Do not hand-edit its output after ledger changes.
Rollback the scoped commit and redeploy; the earlier static calendar and newsroom remain the fallback.
