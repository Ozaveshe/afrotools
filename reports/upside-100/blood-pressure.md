# Blood Pressure Checker & Tracker — Audit

- Live: https://afrotools.com/tools/blood-pressure/
- File: `tools/blood-pressure/index.html`
- Category: Health (accuracy critical)

## What it does
Client-side BP tool. User enters systolic / diastolic (+ optional pulse); `check()` categorises the reading (Normal / Elevated / Stage 1 / Stage 2 / Hypertensive Crisis, plus a Low/Hypotension band), shows tailored advice, a reference-range table, and an optional pulse band. Readings persist to `localStorage` (`bp_history`, capped at 30) with a rendered history list and a 3-reading systolic trend indicator. Integrates with `AfroHealthWorkflow.recordSnapshot`, save/share buttons.

## BP threshold verification (AHA 2017)
Checked `classify()` (evaluated top-down) against the American Heart Association 2017 categories:
- Crisis: `sys>180 || dia>120` — matches AHA "higher than 180 and/or higher than 120".
- Stage 2: `sys>=140 || dia>=90` — matches (OR logic correct).
- Stage 1: `sys>=130 || dia>=80` — matches (OR logic correct).
- Elevated: `sys>=120 && dia<80` — matches AHA "120-129 AND <80" (AND logic correct).
- Normal: `<120 AND <80` — matches.
The visible reference table mirrors these exactly. **Thresholds and boolean logic are correct — no category bug.** The extra Low/Hypotension band (`<90/60`) is a reasonable non-AHA addition and does not distort the AHA bands.

## Gaps found
- No explicit "educational only / not medical advice" disclaimer (only a generic "Deep Review" block). Health-critical omission.
- JSON-LD had only BreadcrumbList — no WebApplication/HealthApplication, no FAQPage for the 2 visible FAQs.
- Meta description was 162 chars (over the 160 target).
- `check()` silently did nothing on out-of-range input — no user feedback; also no systolic>diastolic sanity check.

## Fixes applied 2026-07-14
- Added prominent `.bp-disclaimer` banner at top of the tool: "Educational tool only, not medical advice… consult a doctor… seek urgent care if above 180/120 mmHg or severe symptoms" (`role="note"`).
- Added valid `WebApplication` (`applicationCategory: HealthApplication`, free offer) JSON-LD and a `FAQPage` JSON-LD mirroring only the 2 on-page FAQs.
- Trimmed meta description to 149 chars, added AHA + "not medical advice" framing.
- Replaced silent out-of-range `return` with an `role="alert"` message; added a systolic>diastolic sanity check with feedback.
- All 3 ld+json blocks validated with node (parse OK).

## Deferred / not touched
- Inline `--accent:#dc2626` red theme (semantic health/danger palette) left as-is — not a brand-blue violation.
- No chart.js visualization is rendered despite the CDN include; history is a text list only (potential enhancement, out of surgical scope).
- Africa prevalence stats in the sidebar (WHO ~46%, per-country figures) not re-verified this pass.
