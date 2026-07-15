# Tithe & Offering Calculator — Audit

Live: https://afrotools.com/tools/tithe-calculator/
File: `tools/tithe-calculator/index.html`

## What it does
Computes a monthly/annual tithe from income (gross or net basis), selectable
tithe percentage (5/10/15/20%), plus additional offerings, a special pledge
amortised over N months, and an affordability/stewardship guardrail panel
(giving share %, remaining margin, rhythm advice). Rotates an encouraging
Bible verse. Faith-sensitive, non-prescriptive framing.

## Math check (node, verified)
- 500,000 @ 10% → tithe 50,000/mo, annual 600,000, weekly 50,000/4.33 = 11,547 ✓
- (500,000 + 100,000 other) @ 10%, offering 50,000, pledge 600,000/6 → tithe 60,000,
  pledge 100,000/mo, total 210,000/mo, annual 2,520,000 ✓
- 300,000 @ 15% → 45,000/mo, annual 540,000 ✓
All percentage, annual (×12), weekly (÷4.33), and pledge amortisation logic correct.

## SEO
- Title was generic ("Calculate Your Giving"); now carries African intent.
- Meta description was 182 chars (over limit); trimmed to 159.
- H1 unique and keyword-bearing ("Tithe & Offering Calculator").
- 4 JSON-LD blocks (WebApplication, WebPage, FAQPage, BreadcrumbList) — all parse.
- FAQPage mirrors the 4 visible main FAQs + 3 visible df-block FAQs (all on-page).

## UX / a11y
- Inputs carry aria-labels; result region now announces via aria-live.
- Result card scrolls into view; copy-plan button with fallback; mobile grid
  collapses at 768/680px. Good.

## Tone / trust
- Already respectful (2 Cor 9:7 "cheerful giver", "personal conviction",
  "discuss with your pastor"). Added an explicit personal-guide disclaimer note.

## Gaps / deferred
- df-upgrade block + df-faq answers reference "location and dates" and "mosque,
  church or community timetable" — inaccurate for this tool (it takes income, not
  dates). Left untouched per rules (generated df block).
- Labels use aria-label rather than `for`/`id` association — acceptable, deferred.

## Fixes applied 2026-07-14
- `<title>` → "Tithe & Offering Calculator — Christian Giving in Africa" (adds African intent).
- Meta description trimmed 182→159 chars, retains "tithe (10%)" + "Christians across Africa".
- Added respectful personal-guide note under the Calculate button ("not religious
  instruction… follow your own conviction and the teaching of your faith community").
- Added `aria-live="polite"` to `#resultGrid` for screen-reader announcement.
- No shared files touched. All 4 ld+json blocks re-verified parsing.
