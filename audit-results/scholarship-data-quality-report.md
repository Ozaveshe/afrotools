# Scholarship Data Quality Improvement Plan

Generated: 2026-05-20
Live feed checked: 2026-05-20T00:34:46.281+00:00
API endpoint: https://afrotools.com/api/scholarships?limit=120&offset=0

## Verdict

The scholarship catalog is useful for discovery, but it is not deadline-ready at scale. Keep deadline display conservative until the manual review queue or source parsers verify current application cycles. Do not backfill or infer any `deadline_date` from month hints.

## Current Production Snapshot

- Active scholarships reviewed: 120
- Real dated deadlines: 1
- Annual cycle hints without dated deadlines: 9
- Deadline/source manual review needed: 110
- Deadline not published yet signals: 0
- Rolling admission signals: 0
- Currently closed signals: 0
- Official URLs present in feed summary: 120

## Classification Counts

| Classification | Rows |
| --- | --- |
| real_deadline_available | 1 |
| source_needs_manual_review | 110 |
| annual_cycle_expected | 9 |

## Official URL Quality

| URL quality | Rows |
| --- | --- |
| verified_official_page | 1 |
| valid_https_official_link | 107 |
| official_link_http_blocked | 12 |

## Source Reliability

Reliability here is based on production metadata only: source key, proof level, confidence mode, verified timestamps, URL quality, and whether a real `deadline_date` exists. It does not claim fresh manual verification of every provider page.

| Source key | Mode | Proof | Rows | Dated | HTTP review | Reliability note |
| --- | --- | --- | --- | --- | --- | --- |
| world-bank-jjwbgsp | live | official_page | 1 | 1 | 0 | high for deadline/status |
| afrotools-curated-backup | curated | official_link | 107 | 0 | 0 | medium for discovery, low for deadline/status |
| afrotools-curated-backup | curated | official_link_http_blocked | 12 | 0 | 12 | manual URL review needed |

Most reliable current source: `world-bank-jjwbgsp`, because it is live, official-page based, and has a dated 2026 deadline. The `afrotools-curated-backup` source is reliable enough for discovery links, but not for deadline/status claims until each row is manually verified or parsed.

## Official Domain Reliability Examples

| Domain | Rows | Dated | Cycle hints | HTTP review | Note |
| --- | --- | --- | --- | --- | --- |
| worldbank.org | 1 | 1 | 0 | 0 | highest current deadline evidence |
| ox.ac.uk | 3 | 0 | 0 | 3 | manual URL review needed |
| bristol.ac.uk | 2 | 0 | 0 | 0 | official link present, deadline needs verification |
| mcgill.ca | 2 | 0 | 0 | 0 | official link present, deadline needs verification |
| sciencespo.fr | 2 | 0 | 0 | 0 | official link present, deadline needs verification |
| ucl.ac.uk | 2 | 0 | 0 | 0 | official link present, deadline needs verification |
| aalto.fi | 1 | 0 | 0 | 0 | official link present, deadline needs verification |
| aauw.org | 1 | 0 | 0 | 0 | official link present, deadline needs verification |
| abdn.ac.uk | 1 | 0 | 0 | 0 | official link present, deadline needs verification |
| adb.org | 1 | 0 | 0 | 0 | official link present, deadline needs verification |
| afdb.org | 1 | 0 | 0 | 1 | manual URL review needed |
| anu.edu.au | 1 | 0 | 0 | 0 | official link present, deadline needs verification |
| au-pau.org | 1 | 0 | 0 | 0 | official link present, deadline needs verification |
| boell.de | 1 | 0 | 0 | 0 | official link present, deadline needs verification |
| brunel.ac.uk | 1 | 0 | 0 | 0 | official link present, deadline needs verification |
| cambridgetrust.org | 1 | 0 | 0 | 0 | official link present, deadline needs verification |
| campusbourses.campusfrance.org | 1 | 0 | 0 | 0 | official link present, deadline needs verification |
| campusfrance.org | 1 | 0 | 0 | 0 | official link present, deadline needs verification |
| carleton.ca | 1 | 0 | 0 | 0 | official link present, deadline needs verification |
| chalmers.se | 1 | 0 | 0 | 0 | official link present, deadline needs verification |

## Top 30 Manual Deadline Verification Queue

These rows should be verified first because they are flagship, likely high-demand, full-funding, government or multilateral, have annual-cycle hints, or have URL-quality risk. The queue does not invent dates.

| Rank | Scholarship | Provider | Classification | Current deadline text | URL quality | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | AfDB Japan Africa Dream Scholarship | African Development Bank | source_needs_manual_review | Check official page | official_link_http_blocked | official_link_http_blocked |
| 2 | Chevening Scholarship | UK Government (FCDO) | annual_cycle_expected | Nov (annual) | valid_https_official_link | deadline_text has a month or cycle hint but no year-specific deadline_date |
| 3 | Commonwealth Scholarship | Commonwealth Secretariat | annual_cycle_expected | Dec | valid_https_official_link | deadline_text has a month or cycle hint but no year-specific deadline_date |
| 4 | Erasmus Mundus Joint Masters | European Commission | annual_cycle_expected | Jan-Feb | valid_https_official_link | deadline_text has a month or cycle hint but no year-specific deadline_date |
| 5 | Fulbright Foreign Student Program | US Department of State | annual_cycle_expected | Feb-Oct | valid_https_official_link | deadline_text has a month or cycle hint but no year-specific deadline_date |
| 6 | Hungarian Government Scholarship | Tempus Public Foundation | annual_cycle_expected | Jan | valid_https_official_link | deadline_text has a month or cycle hint but no year-specific deadline_date |
| 7 | Turkish Government Scholarship | Republic of Turkey | annual_cycle_expected | Jan-Feb | valid_https_official_link | deadline_text has a month or cycle hint but no year-specific deadline_date |
| 8 | Clarendon Scholarships | University of Oxford | source_needs_manual_review | Check official page | official_link_http_blocked | official_link_http_blocked |
| 9 | DAAD Scholarship | German Academic Exchange Service | annual_cycle_expected | Oct-Nov | valid_https_official_link | deadline_text has a month or cycle hint but no year-specific deadline_date |
| 10 | Gates Cambridge Scholarship | Gates Foundation | annual_cycle_expected | Oct-Dec | valid_https_official_link | deadline_text has a month or cycle hint but no year-specific deadline_date |
| 11 | Rhodes Scholarship | Rhodes Trust | annual_cycle_expected | Jul-Oct | valid_https_official_link | deadline_text has a month or cycle hint but no year-specific deadline_date |
| 12 | University of Pretoria Mastercard Foundation Scholars Program | University of Pretoria | source_needs_manual_review | Check official page | official_link_http_blocked | official_link_http_blocked |
| 13 | ADB Japan Scholarship Program | Asian Development Bank | source_needs_manual_review | Check official page | valid_https_official_link | deadline_text=Check official page |
| 14 | Australia Awards Africa | Australian Government | source_needs_manual_review | Check official page | valid_https_official_link | deadline_text=Check official page |
| 15 | IsDB Scholarship Programmes | Islamic Development Bank | source_needs_manual_review | Check official page | valid_https_official_link | deadline_text=Check official page |
| 16 | Joint Japan/IMF Scholarship Program | International Monetary Fund | source_needs_manual_review | Check official page | valid_https_official_link | deadline_text=Check official page |
| 17 | Manaaki New Zealand Scholarships | New Zealand Ministry of Foreign Affairs and Trade | source_needs_manual_review | Check official page | valid_https_official_link | deadline_text=Check official page |
| 18 | MEXT Scholarships | Government of Japan | source_needs_manual_review | Check official page | valid_https_official_link | deadline_text=Check official page |
| 19 | Pan African University Scholarships | African Union | source_needs_manual_review | Check official page | valid_https_official_link | deadline_text=Check official page |
| 20 | Graduate Research Scholarships | University of Melbourne | source_needs_manual_review | Check official page | official_link_http_blocked | official_link_http_blocked |
| 21 | Reach Oxford Scholarship | University of Oxford | source_needs_manual_review | Check official page | official_link_http_blocked | official_link_http_blocked |
| 22 | Weidenfeld-Hoffmann Scholarships and Leadership Programme | University of Oxford | source_needs_manual_review | Check official page | official_link_http_blocked | official_link_http_blocked |
| 23 | Cambridge Mastercard Foundation Scholars Program | University of Cambridge | source_needs_manual_review | Check official page | valid_https_official_link | deadline_text=Check official page |
| 24 | Eiffel Excellence Scholarship Program | Campus France | source_needs_manual_review | Check official page | valid_https_official_link | deadline_text=Check official page |
| 25 | Knight-Hennessy Scholars | Stanford University | source_needs_manual_review | Check official page | valid_https_official_link | deadline_text=Check official page |
| 26 | Mandela Rhodes Scholarship | Mandela Rhodes Foundation | source_needs_manual_review | Check official page | valid_https_official_link | deadline_text=Check official page |
| 27 | McGill Mastercard Foundation Scholars Program | McGill University | source_needs_manual_review | Check official page | valid_https_official_link | deadline_text=Check official page |
| 28 | Mo Ibrahim Foundation Fellowships | Mo Ibrahim Foundation | source_needs_manual_review | Check official page | valid_https_official_link | deadline_text=Check official page |
| 29 | Rotary Peace Fellowships | Rotary International | source_needs_manual_review | Check official page | valid_https_official_link | deadline_text=Check official page |
| 30 | Sciences Po Mastercard Foundation Scholars Program | Sciences Po | source_needs_manual_review | Check official page | valid_https_official_link | deadline_text=Check official page |

## Manual Verification Workflow

1. Open `audit-results/scholarship-deadline-manual-verification.csv` and process rows by `priority_rank`.
2. Visit the `official_url` only. If the official page points to a separate application portal, record that as `application_url` but keep the provider page as evidence.
3. Classify the deadline as one of: `real_deadline_available`, `deadline_not_published_yet`, `annual_cycle_expected`, `rolling_admission`, `currently_closed`, or `source_needs_manual_review`.
4. Set `deadline_date` only when the official provider publishes a complete dated deadline with year, month, and day. Month-only windows stay in `deadline_text` and must not power days-left logic.
5. Update `status` from official evidence only: `open`, `upcoming`, `closed`, or `unclear`. Do not use `open` for rows that only have a generic scholarship page.
6. Record `deadline_verified_at`, `deadline_source_url`, `verification_method`, `reviewer`, and a short evidence note.
7. Re-run the scholarship API smoke and reminder reconciliation after dated deadlines are changed.

## Recommended Import/Admin Fields

- `deadline_classification`: enum matching the six safe categories.
- `deadline_source_url`: exact official page where deadline evidence was found.
- `deadline_verified_at`: timestamp of human or parser verification.
- `deadline_verified_by`: parser key or admin reviewer.
- `deadline_evidence_note`: short note such as application window, intake, or provider caveat.
- `application_status_reason`: why a row is open, upcoming, closed, or unclear.
- `official_url_status`: valid, redirected, blocked, broken, or needs manual review.
- `official_url_checked_at`: timestamp of link check.
- `application_url`: direct application portal when different from the info page.
- `cycle_year` and `intake_year`: optional, only when published by the provider.
- `source_confidence_score`: numeric score derived from proof level, URL health, dated evidence, and freshness.

## Safe Display Logic For Unclear Deadlines

- `real_deadline_available`: show the date and days left. Add a confirm-on-official-provider note.
- `deadline_not_published_yet`: show `Deadline not published yet` and no days-left badge.
- `annual_cycle_expected`: show `Annual cycle expected` plus any month hint as an estimate. Never calculate days left from month-only text.
- `rolling_admission`: show `Rolling admission` only when the official page says this. Add intake-window confirmation text.
- `currently_closed`: show `Currently closed` and no application CTA unless the provider has a next-cycle page.
- `source_needs_manual_review`: show `Deadline unclear` and `Always confirm on the official provider page before applying.`
- If `official_url_quality` is `official_link_http_blocked`, keep the official link visible but add `Source needs manual review` for admins.

## Files Created

- `audit-results/scholarship-data-quality-classification.csv`: all 120 active scholarships with row-level classification and safe display explanation.
- `audit-results/scholarship-deadline-manual-verification.csv`: 119 unclear/manual rows prioritized for verification, including the top 30.
- `audit-results/scholarship-source-reliability.csv`: source-level reliability summary.

## Immediate Recommendation

Keep the public finder honest: show the one real dated deadline, show month-only rows as annual-cycle hints, and show the remaining rows as deadline unclear until official-provider review is completed. The next data PR should enrich the top 30 rows through the admin/import workflow before touching lower-priority rows.
