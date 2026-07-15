# Ovulation & Fertility Calculator — Audit

- Live: https://afrotools.com/tools/ovulation-calc/
- File: `tools/ovulation-calc/index.html`
- Category: Health (accuracy-critical)

## What it does
Client-side calculator. Inputs: first day of last period (LMP), average cycle length (21–35, default 28), period duration (3–7). Outputs: estimated ovulation date, fertile window, next period, and (if conceiving) due date, plus a 2-month color-coded fertility calendar (period / fertile / ovulation). Pure JS, no backend.

## Math verification
All core formulas are correct:
- **Ovulation** = LMP + (cycleLen − 14). This correctly anchors ovulation to the ~14-day luteal phase measured back from the *next* period, so it scales with cycle length rather than assuming 28.
  - 28-day cycle, LMP 2026-07-01 → ovulation **2026-07-14** (day 14); next period 2026-07-28; ovulation = next period − 14. ✓
  - 32-day cycle, LMP 2026-07-01 → ovulation **2026-07-18** (day 18); next period 2026-08-01; ovulation = next period − 14. ✓
- **Next period** = LMP + cycleLen. ✓
- **Due date** = LMP + 280 days (Naegele's rule, 40 weeks). ✓
- **Fertile window start** = ovulation − 5 days (sperm survival). ✓

### Bug found and fixed
`fertileEnd` was `ovulDate + 1 day`, producing a 7-day window ending the day *after* ovulation. This contradicted the page's own copy ("the 5 days before ovulation and on ovulation day itself" = 6 days) and the standard fertile-window definition. Both the result label and the calendar highlighting inherited the error. Corrected to end on ovulation day (6-day window: 5 days before + ovulation day).

## SEO
- Title improved with African intent keyword.
- Meta description already 120–160 chars, mentions Africa/family planning — kept.
- H1 "Ovulation & Fertility Calculator" — unique, keyword-bearing — kept.
- 4 JSON-LD blocks (WebApplication, WebPage, BreadcrumbList, FAQPage), all valid. WebApplication now typed as HealthApplication.
- FAQPage mirrors the 4 visible `<details>` FAQ items exactly (accurate calendar-method / contraception / when-to-see-doctor / luteal-phase copy). No mismatch.
- Good content depth: how-it-works, factors affecting ovulation, Africa family-planning context, sidebar cycle education.

## UX / a11y / trust
- Input → result flow clear; results scroll into view; save/share buttons injected.
- Inputs default LMP to today; date + selects have `aria-label`s.
- Responsive: grid collapses to single column at 768px (mobile safe at 375px).
- Trust: was previously weak — the "not for contraception" disclaimer lived *inside* the hidden results card, so a first-time visitor saw no warning before calculating. Now a prominent always-visible disclaimer sits under the Calculate button.

## Gaps / deferred (not fixed — out of surgical scope)
- No handling for irregular cycles (single cycle-length assumption) beyond copy caveats — acceptable for a calendar-method tool.
- No input validation on future-dated LMP (a future LMP still computes).
- Calendar assumes a single cycle; does not project forward multiple cycles.
- Due date shown even in "family planning / avoid pregnancy" framing — labeled "If Conceiving" which is adequate.

## Fixes applied 2026-07-14
1. **Math**: `fertileEnd` changed from `ovulDate + 1 day` to `ovulDate` — fertile window now correctly ends on ovulation day (6-day window), matching page copy and clinical definition. Fixes both the result label and calendar highlighting.
2. **Title**: `Ovulation Calculator — Fertility Window, Cycle & Due Date | Africa` (added African intent).
3. **JSON-LD**: `applicationCategory` "WebApplication" → "HealthApplication" (health-appropriate). All 4 blocks re-validated with node — all parse.
4. **Disclaimer**: added prominent always-visible "estimate for planning only, NOT contraception or medical advice — consult a doctor" note under the Calculate button (previous disclaimer was hidden until results rendered).
