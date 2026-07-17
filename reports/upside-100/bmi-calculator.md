# BMI Calculator for Africans — Audit

- Live: https://afrotools.com/health/bmi-calculator/
- Source: `health/bmi-calculator/index.html`
- Category: Health

## What it does
Computes BMI from height + weight (metric kg/cm or imperial lbs/ft-in), assigns a WHO
category, and renders a colour gauge, category table, health tips, and optional
waist-to-height ratio (WHtR) plus ethnicity-adjusted context (West/East/Southern/North
African, African-Caribbean). Calculation is client-side; results persist to localStorage
and feed the shared Health workflow snapshot. Includes copy/print and a FAQ accordion.

## BMI math verification
- Formula in code: `bmi = weightKg / (heightM * heightM)` — correct (kg / m²).
- Imperial conversion: `lbs * 0.453592`, `(ft*12 + in) * 0.0254` — correct.
- Node cases: 70kg/1.75m = **22.9 Normal**; 70kg/1.70m = 24.2 Normal; 95kg/1.70m = 32.9
  Obese; 154lbs/5ft7 = 24.1 Normal. All match expected.
- Categories match WHO: Underweight <18.5, Normal 18.5–24.9, Overweight 25–29.9,
  Obese ≥30 (further split into Class I/II/III). Boundary logic uses `< max` so a value
  of exactly 25.0 correctly reads Overweight.

## Gaps found
1. **Broken WebPage JSON-LD** — name/url/description were all literally
   `"https://afrotools.com/"`; no WebApplication schema present.
2. **No FAQPage schema** despite 5 visible FAQ items.
3. **Meta description too long** (~175 chars) and led with marketing "only calculator" claim.
4. **Top disclaimer** was generic; did not state BMI is a screening estimate or that BMI
   has limitations (buried lower in deep-review section only).
5. Minor (not changed): imperial inputs skip the 50–300cm sanity check that metric has;
   ethnicity context is population-level (already disclaimed inline).

## SEO/UX/trust notes
- Title already keyword + intent aligned ("Free BMI Calculator for Africans | AfroTools").
- Single unique H1 ("BMI Calculator for Africans"). Breadcrumb schema valid.
- FAQ copy now mirrored 1:1 in FAQPage schema. Unit toggle, aria-live result, radiogroup
  roles, keyboard Enter-to-calc, and 640px responsive stack all present and sound.

## Fixes applied 2026-07-14
- Replaced broken WebPage JSON-LD with valid **WebApplication / HealthApplication** schema
  (correct name, url, description, free Offer).
- Added **FAQPage** JSON-LD mirroring exactly the 5 visible FAQ Q&As.
- Tightened meta description to **159 chars** with African intent + "screening estimate,
  not medical advice".
- Strengthened top disclaimer: BMI is a screening estimate, not medical advice; states BMI
  limitations (doesn't measure body fat, misjudges muscular/lean builds); consult a doctor.
- Verified all 3 ld+json blocks parse (node). No shared files touched.
