# Scholarship Deadline Quality Audit

Generated: 2026-05-21T08:41:23.499Z

## Verdict

**Not ready for heavy paid ads.** The UI is safe, but deadline quality remains weak because most active scholarships do not have exact source-backed dates.

## Current Counts

| Metric | Count |
| --- | ---: |
| Active scholarships in feed | 120 |
| Real structured deadline_date | 1 |
| Deadline unclear | 110 |
| Structured deadline_month only | 0 |
| Month-only / annual text only | 9 |
| Rolling deadline | 0 |
| Closed or past deadline | 0 |
| Source URL present | 120 |
| Last checked date present | 120 |
| Verified deadline confidence | 1 |
| Inferred deadline confidence | 9 |
| Unclear deadline confidence | 110 |

Feed mode: `live`.

## Safe Display Logic

- Future `deadline_date` values show days left only when the date parses as a real exact date.
- Rolling deadlines show `Rolling deadline` and do not calculate urgency.
- Month-only or annual cycle text shows `Deadline month only` or `Annual cycle expected`; it does not calculate days left.
- Unclear deadlines show `Deadline unclear` and force official-provider confirmation.
- Past dates show `Currently closed` or needs review language, not urgency.

## Source Reliability

| Source | Source key | Active | Real date | Unclear | Source URL | Last checked | Reliability |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| AfroTools curated scholarship backup | afrotools-curated-backup | 119 | 0 | 110 | 119 | 119 | source-linked_deadline-weak |
| World Bank Scholarships and JJ/WBGSP | world-bank-jjwbgsp | 1 | 1 | 0 | 1 | 1 | strong |

## Top 30 Manual Enrichment Priorities

| # | Scholarship | Provider | Destination | Deadline status | Current deadline | Priority | Suggested action |
| ---: | --- | --- | --- | --- | --- | ---: | --- |
| 1 | Clarendon Scholarships | University of Oxford | uk | unclear | Check official page | 125 | Open official/source URL and verify whether a 2026 deadline is published. |
| 2 | Graduate Research Scholarships | University of Melbourne | australia | unclear | Check official page | 125 | Open official/source URL and verify whether a 2026 deadline is published. |
| 3 | Reach Oxford Scholarship | University of Oxford | uk | unclear | Check official page | 125 | Open official/source URL and verify whether a 2026 deadline is published. |
| 4 | Weidenfeld-Hoffmann Scholarships and Leadership Programme | University of Oxford | uk | unclear | Check official page | 125 | Open official/source URL and verify whether a 2026 deadline is published. |
| 5 | Australia Awards Africa | Australian Government | australia | unclear | Check official page | 117 | Open official/source URL and verify whether a 2026 deadline is published. |
| 6 | Cambridge Mastercard Foundation Scholars Program | University of Cambridge | uk | unclear | Check official page | 117 | Open official/source URL and verify whether a 2026 deadline is published. |
| 7 | Chancellor's International Scholarship | University of Warwick | uk | unclear | Check official page | 117 | Open official/source URL and verify whether a 2026 deadline is published. |
| 8 | Knight-Hennessy Scholars | Stanford University | us | unclear | Check official page | 117 | Open official/source URL and verify whether a 2026 deadline is published. |
| 9 | Lester B. Pearson International Scholarship | University of Toronto | canada | unclear | Check official page | 117 | Open official/source URL and verify whether a 2026 deadline is published. |
| 10 | McGill Mastercard Foundation Scholars Program | McGill University | canada | unclear | Check official page | 117 | Open official/source URL and verify whether a 2026 deadline is published. |
| 11 | Sciences Po Mastercard Foundation Scholars Program | Sciences Po | eu | unclear | Check official page | 117 | Open official/source URL and verify whether a 2026 deadline is published. |
| 12 | Stanford Africa MBA Fellowship | Stanford Graduate School of Business | us | unclear | Check official page | 117 | Open official/source URL and verify whether a 2026 deadline is published. |
| 13 | UBC Mastercard Foundation Scholars Program | University of British Columbia | canada | unclear | Check official page | 117 | Open official/source URL and verify whether a 2026 deadline is published. |
| 14 | University of Sydney International Scholarship | University of Sydney | australia | unclear | Check official page | 117 | Open official/source URL and verify whether a 2026 deadline is published. |
| 15 | City St George's Scholarships | City St George's University of London | uk | unclear | Check official page | 110 | Open official/source URL and verify whether a 2026 deadline is published. |
| 16 | Monash International Merit Scholarship | Monash University | australia | unclear | Check official page | 110 | Open official/source URL and verify whether a 2026 deadline is published. |
| 17 | University of Pretoria Mastercard Foundation Scholars Program | University of Pretoria | africa | unclear | Check official page | 110 | Open official/source URL and verify whether a 2026 deadline is published. |
| 18 | Utrecht Excellence Scholarships | Utrecht University | eu | unclear | Check official page | 110 | Open official/source URL and verify whether a 2026 deadline is published. |
| 19 | Vice-Chancellor's International Scholarship | Deakin University | australia | unclear | Check official page | 110 | Open official/source URL and verify whether a 2026 deadline is published. |
| 20 | Vice-Chancellor's International Scholarship | Macquarie University | australia | unclear | Check official page | 110 | Open official/source URL and verify whether a 2026 deadline is published. |
| 21 | Eiffel Excellence Scholarship Program | Campus France | eu | unclear | Check official page | 105 | Open official/source URL and verify whether a 2026 deadline is published. |
| 22 | ENS International Selection | Ecole Normale Superieure | eu | unclear | Check official page | 105 | Open official/source URL and verify whether a 2026 deadline is published. |
| 23 | ETH Zurich Excellence Scholarship and Opportunity Programme | ETH Zurich | eu | unclear | Check official page | 105 | Open official/source URL and verify whether a 2026 deadline is published. |
| 24 | Ireland Fellows Programme | Irish Aid | eu | unclear | Check official page | 105 | Open official/source URL and verify whether a 2026 deadline is published. |
| 25 | Swedish Institute Scholarships | Swedish Institute | eu | unclear | Check official page | 105 | Open official/source URL and verify whether a 2026 deadline is published. |
| 26 | VLIR-UOS ICP Connect Scholarships | VLIR-UOS | eu | unclear | Check official page | 105 | Open official/source URL and verify whether a 2026 deadline is published. |
| 27 | Aalto Scholarships and Tuition Fees | Aalto University | eu | unclear | Check official page | 102 | Open official/source URL and verify whether a 2026 deadline is published. |
| 28 | ANU Chancellor's International Scholarship | Australian National University | australia | unclear | Check official page | 102 | Open official/source URL and verify whether a 2026 deadline is published. |
| 29 | Brunel University Scholarships | Brunel University London | uk | unclear | Check official page | 102 | Open official/source URL and verify whether a 2026 deadline is published. |
| 30 | Cambridge Trust Scholarships | Cambridge Trust | uk | unclear | Check official page | 102 | Open official/source URL and verify whether a 2026 deadline is published. |

## Backend/Admin Workflow Recommendation

Add nullable enrichment fields to `scholarships` when the backend migration window opens:

- `deadline_status`: open, closing_soon, urgent, closed, rolling, unclear, upcoming
- `deadline_confidence`: verified, inferred, unclear
- `deadline_source_url`: official provider or scholarship deadline page
- `deadline_last_checked`: date the exact deadline was manually or automatically checked
- `deadline_notes`: short explanation for rolling, month-only, closed, or source-gapped deadlines

Suggested admin/import workflow:

1. Start from `audit-results/scholarship-deadline-enrichment-priority.csv`.
2. Verify top-priority rows against official provider pages.
3. Update exact `deadline_date` only when the official source publishes a real date.
4. Use `deadline_text` plus `deadline_status=rolling` for rolling admissions.
5. Use `deadline_text` plus `deadline_status=upcoming` for month-only or annual-cycle notices.
6. Keep `deadline_status=unclear` when the source does not publish a reliable deadline.
7. Re-run this script after each enrichment batch and compare counts.

## Frontend Trust Workflow

- Scholarship cards use a deadline normalization layer that reads existing API fields first and future `deadline_*` fields when available.
- The card trust row shows deadline status, confidence, last checked, source link, and official provider link.
- Unclear, month-only, closed, or otherwise suspicious deadlines expose `Report deadline` and `Submit official deadline source` actions.
- Report actions are stored in localStorage under `afro-scholarship-deadline-reports-v1` unless a live review endpoint is added.

Analytics events added:

- `scholarship_deadline_source_opened`
- `scholarship_deadline_report_clicked`
- `scholarship_deadline_report_submitted`
- `scholarship_unclear_deadline_viewed`
- `scholarship_verified_deadline_viewed`

## Fields Needing Enrichment

- `deadline_date` for exact source-backed dates.
- `deadline_text` for source wording when exact dates are absent.
- `deadline_status` for rolling, upcoming, closed, and unclear states.
- `deadline_confidence` so UI can separate verified from inferred.
- `deadline_source_url` when the general scholarship page differs from the deadline page.
- `deadline_last_checked` for trust and stale-source review.
- `deadline_notes` for annual cycles, programme-specific dates, and manual review warnings.

## Guardrails

- Do not invent deadlines.
- Do not turn month-only text into an exact date.
- Do not show urgent or closing-soon badges for unclear deadlines.
- Keep official provider links prominent on every card.
- Treat user-submitted deadline reports as local feedback unless a live review endpoint is added.
