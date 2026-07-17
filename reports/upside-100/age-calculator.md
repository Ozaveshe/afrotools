# Age Calculator — Audit & Fixes

- Live: https://afrotools.com/tools/age-calculator/
- File: `tools/age-calculator/index.html`

## What it does
Client-side age calculator. Enter DOB (and optional "Calculate At" date) → exact age in years/months/days, plus total months/weeks/days/hours/minutes, days-to-next-birthday, "Happy Birthday" banner, Western zodiac sign, generational cohort, and life milestones (days/weeks/hours reached or "soon"). Auto-calculates on load and on date change. Save/share result buttons, related tools, African-demographics sidebar.

## Competitors & gaps
- vs timeanddate / calculator.net: parity on Y/M/D breakdown and next-birthday. Differentiators already present: zodiac, generation, milestones, African median-age context.
- Gaps (deferred): no "age between two people" comparison; no day-of-week-born; no seconds ticker; total-seconds not shown despite SEO copy claiming "even seconds"; no copy-to-clipboard of a plain summary.

## CRITICAL — date math verification (node)
Tested the exact page algorithm across leap/boundary cases.
- **Bug found & fixed:** month-boundary borrow produced NEGATIVE days. e.g. DOB `1995-01-31`, at `2023-03-01` returned `28y 1m -2d`. Cause: borrow added days-in-previous-month (Feb=28) but DOB day (31) exceeded it. Fix: clamp `dim = max(daysInPrevMonth, dob.getDate())` so borrow never goes negative.
- Post-fix results (all non-negative, verified):
  - `1995-01-31 → 2023-03-01` = 28y 1m 1d
  - `2000-02-29 → 2001-02-28` = 0y 11m 30d
  - `2000-02-29 → 2001-03-01` = 1y 0m 1d (leap-day anniversary rolls to Mar 1)
  - `2004-02-29 → 2024-02-29` = 20y 0m 0d
  - `1990-12-31 → 2024-01-01` = 33y 0m 1d
  - `2023-02-28 → 2024-02-29` = 1y 0m 1d
- Next-birthday & zodiac wrap logic verified correct; leap years counted in totals via ms diff.

## SEO
- Title already keyword+intent good ("Age Calculator — Exact Years, Months & Days | AfroTools"). Kept.
- Meta description 155 chars (in 120–160 range). Kept.
- H1 "Age Calculator" — single, unique keyword. Kept.
- `applicationCategory` was invalid `"WebApplication"` (that is a @type, not a category) → changed to `"UtilitiesApplication"`.
- FAQPage JSON-LD mirrors visible FAQs; expanded from 3 → 5 Q&As (added Feb-29 handling + next-birthday counting), each visible in DOM and in JSON-LD.

## UX / a11y
- Inputs had non-descriptive `aria-label="Dob"/"AtDate"` and unlinked labels → added `for`/`id` association + descriptive aria-labels.
- Added `aria-live="polite"` to `#results` so screen readers announce the computed age.
- Mobile 375px: grid collapses to single column at 768px; result grid stays 3-col, detail grid 1-col <480px. No overflow.

## Deferred
Total-seconds display (SEO copy over-claims), age-between-two-people mode, day-of-week-born, live ticker.

## Fixes applied 2026-07-14
1. Date math: clamp borrow to eliminate negative days at month boundaries (Jan/Mar/etc. with 29–31 DOB).
2. JSON-LD `applicationCategory` → `UtilitiesApplication`.
3. FAQPage expanded to 5 mirrored Q&As.
4. a11y: label `for`/`id`, descriptive aria-labels, `aria-live` results region.
All 4 ld+json blocks re-validated with node (parse OK).
