# Day 10 Religious & Cultural final addendum

Date: 2026-07-27

Base: `305705374837b707557a15cad133063283c0dc0b`

Scope: the 22 canonical English Religious & Cultural routes only

Release state: **22/22 accepted on this branch; not merged or deployed**

This addendum supersedes only the Religious & Cultural `0/22` line in
`DAY10-AFRICAN-RELIGIOUS-DATA-PRODUCTIVITY-VIP-RECEIPT.md`. It does not change
the African or Data & Productivity accounting and does not edit the master
free-app ledger.

## Acceptance matrix

| # | Route | Independent product oracle | Authority or claim boundary | Export/reopen | Status |
| ---: | --- | --- | --- | --- | --- |
| 1 | `/tools/tithe-calculator/` | User-selected percentage, offering, pledge and remainder arithmetic | No prescribed rate, doctrine, prosperity or tax claim | PDF downloaded and parsed; JSON path remains local | Accepted |
| 2 | `/tools/lobola-calculator/` | Family expectation, gifts, ceremony and buffer fixture | Editable planning envelope; not a tariff or bride price | No file export offered | Accepted |
| 3 | `/tools/lobola-negotiation-checklist/` | Synthetic family brief, pending item and reset | Family process checklist; no universal custom asserted | Copy/print only | Accepted |
| 4 | `/tools/lobola-gift-list/` | Editable row total | User list; not an official cultural requirement | Copy/print only | Accepted |
| 5 | `/tools/african-proverbs/` | Local culture filter and non-empty reference result | Curated reference, not authenticated quotation evidence | PDF downloaded and parsed | Accepted |
| 6 | `/tools/zakat-calculator/` | Silver nisab and 2.5% fixture | Planning arithmetic; scholar review retained for edge cases | CSV downloaded and reopened | Accepted |
| 7 | `/tools/prayer-times/` | City/method fixture and Qibla output | Presets are samples, not an official mosque timetable | PDF downloaded and parsed | Accepted |
| 8 | `/tools/ramadan-timetable/` | Suhoor buffer fixture | Working draft; local moon sighting and mosque times control | PDF downloaded and parsed | Accepted |
| 9 | `/tools/faraid-inheritance/` | Wife, son and daughter limited-case shares | Limited model; qualified scholar and legal review required | CSV downloaded and reopened | Accepted |
| 10 | `/tools/hajj-budget/` | Package, local spend and contingency fixture | Placeholder savings arithmetic; no operator quote, visa or booking | PDF downloaded and parsed | Accepted |
| 11 | `/tools/islamic-finance/` | Asset, deposit, margin, term and total-payable fixture | Comparison only; no fatwa or Sharia approval | CSV downloaded and reopened | Accepted |
| 12 | `/tools/wedding-budget/` | Guest-linked food cost and reset | User/vendor quotes; no universal ceremony assumptions | TXT downloaded and reopened | Accepted |
| 13 | `/tools/naming-ceremony/` | Guest and food quote fixture plus reset | Editable household plan; tradition and quotes confirmed locally | CSV downloaded and reopened | Accepted |
| 14 | `/tools/funeral-cost/` | Attendee-food arithmetic separated from fixed costs | Planning only; no legal, religious or cultural ruling | TXT downloaded and reopened | Accepted |
| 15 | `/tools/baby-name-generator/` | Family-review state | Does not invent or authenticate names; spelling and meaning need fluent review | PDF downloaded and parsed | Accepted |
| 16 | `/tools/traditional-calendar/` | Fixed-date estimate | Not an official civil, church, palace or market-day date | PDF downloaded and parsed | Accepted |
| 17 | `/tools/age-calculator-african/` | 2000-01-01 weekday and Akan day-name fixture | Day name is a cultural suggestion, never official identity advice | PDF downloaded and parsed | Accepted |
| 18 | `/tools/festival-calendar/` | Reference-list and respect-note fixture | Dates and access must be confirmed with the organiser or authority | PDF downloaded and parsed | Accepted |
| 19 | `/tools/aso-ebi-cost/` | Fabric, tailoring, accessories and discount fixture | User-entered quotes; no live price or delivery guarantee | PDF downloaded and parsed | Accepted |
| 20 | `/tools/traditional-attire/` | Quantity, fabric and tailoring fixture plus reset | User-entered quotes; no live price or universal attire rule | CSV downloaded and reopened | Accepted |
| 21 | `/tools/halal-compliance/` | Flagged-answer readiness outcome | Checklist never certifies, issues a fatwa, predicts a timeline or selects a certifier | PDF downloaded and parsed | Accepted |
| 22 | `/tools/islamic-calendar/` | Fixed Gregorian-to-Hijri conversion | Tabular estimate; no astronomical or official moon-sighting claim | PDF downloaded and parsed | Accepted |

## Repairs made in the final lane

- Replaced copied generic “all 54 countries” and “mosque, church or community
  timetable” blocks on prayer, Ramadan, Hajj, baby-name, traditional-calendar,
  age/name-day, festival and Aso-Ebi pages with route-specific instructions.
- Removed the remaining “accurate astronomical” Islamic-calendar claims and
  fixed-date observance assertions. The page now states a tabular estimate and
  local moon-sighting boundary in visible copy and structured data.
- Reframed the halal page as documentation readiness. It no longer names
  unrelated regulators, invents fees or timelines, or turns its score into a
  certification or religious ruling.
- Reframed proverb records as a curated reference set rather than authenticated
  quotations and made the shared baby-name layer a verification planner rather
  than a proverb fallback.
- Added stale-result clearing, non-negative validation, reset behavior, an exact
  22-app hub count, dated source-review notes, and a narrow-screen halal heading
  repair to the category-owned workflow layer.

## Evidence

- `node tests/day10-category-contract.test.js` — pass
- `node tests/day10-shared-export-privacy.test.js` — pass
- `tests/e2e/day10-religious-cultural-contracts.spec.js`
  - 23/23 route-oracle and shared invalid/reset contracts — pass
  - 11/11 shared PDF downloads parsed with `pdf-parse` — pass
  - 1/1 native giving PDF download parsed with `pdf-parse` — pass
  - 7/7 CSV/TXT downloads reopened and content-checked — pass
- `tests/e2e/day10-category-workflows.spec.js`
  - Religious & Cultural hub and 22/22 routes — pass
  - Covers 375px dark mode, adaptive interaction, status/labels, keyboard
    focus, unexpected runtime errors and horizontal overflow
- `node --check assets/js/religious-cultural-apps.js` — pass
- `git diff --check` — pass

No production, Supabase, deployment, registry, localization, sitemap,
service-worker, redirect, Netlify or shared sitewide design-system action was
performed.

## Artwork

The separate report
`reports/day10-african-religious-data-productivity-missing-artwork.md` records
all 22 Religious & Cultural routes as having resolvable committed artwork.
Missing artwork for this category: **0**. No artwork was generated or replaced.
