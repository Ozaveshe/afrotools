# Fraction Calculator — Audit

- Live: https://afrotools.com/tools/fraction-calc/
- File: `tools/fraction-calc/index.html`
- Category: Education

## What it does

Client-side (no backend) fraction calculator. Two operands, each with a Whole /
Numerator / Denominator field, plus an operation select (+ − × ÷). On Calculate it:
converts mixed numbers to improper fractions, finds the LCD for add/sub, performs
the op, and renders the answer five ways — raw fraction, simplified (GCD), mixed
number, decimal, and percentage — with a numbered step-by-step working panel.
Extras: copy solution, download TXT, in-page history (last 20), Enter-to-calculate.
Stacked-fraction HTML with `aria-label` on the fraction spans.

## Competitors & gaps

- **calculator.net/fraction-calculator** — 4 separate calculators (fractions,
  mixed numbers, simplify, decimal-to-fraction), big explanatory article. AfroTools
  matches the core arithmetic and adds mixed numbers + steps + history in one UI.
- **mathpapa.com** — free-form `1/2 + 1/3` text parsing and step display.
  AfroTools uses structured inputs (less error-prone, but no free-text entry).
- Coverage vs both is strong: mixed numbers ✔, auto-simplify ✔, step-by-step ✔,
  decimal/percentage ✔. Genuine gaps (deferred, not required): only two operands
  (no 3+ chain), no decimal→fraction or simplify-only mode, no negative-input
  helper beyond typing a minus.

## SEO

- Title was generic (`Fraction Calculator | AfroTools`) — no keyword differentiation.
- Meta description was **169 chars** (over the 120–160 target).
- H1 was bare "Fraction Calculator" (no unique keyword).
- JSON-LD present and healthy: WebApplication (applicationCategory
  `EducationalApplication`), WebPage, BreadcrumbList, FAQPage (5 Q&A that mirror the
  visible FAQ). **HowTo was missing** despite a clear how-to surface.
- Content depth is reasonable for a calculator: intro paragraph, How-It-Works
  formulas, Tips, visible FAQ, related tools. Not thin.

## UX / a11y

- Inputs carry `aria-label`; op-select labelled; status region is `aria-live`.
- Fraction result spans use `role="text"` + `aria-label` so screen readers read
  "5/6" not "5 bar 6". Good.
- Mobile: dedicated `@media(max-width:680px)` shrinks inputs and stacks the grid;
  verified layout intent at 375px (inputs 50px, single-column result grid).

## Correctness (node, 10 cases — all PASS)

Replicated `toImproper/simplify/lcm/gcd/calc`:
1/2+1/3=5/6 · 3/4−1/4=1/2 · 2/3×3/4=1/2 · (1/2)÷(1/4)=2 · improper 5/4+1/4=3/2 ·
mixed 2⅓+1⅙=7/2 (3½) · 1/3−1/2=−1/6 · whole 3×2/3=2 · improper 7/2÷1/2=7 ·
negative mixed −2⅓+1/3=−2. Simplification and decimal outputs all correct.

## Fixes applied 2026-07-14

- **Title** → `Fraction Calculator with Step-by-Step Solutions | AfroTools` (59 chars,
  keyword-differentiated). Updated matching `og:title`/`twitter:title`.
- **Meta description** → trimmed to 150 chars (was 169); still names all four
  operations + mixed numbers + decimal.
- **H1** → `Fraction Calculator with Steps` (keeps `<em>` brand styling; adds the
  differentiating "with Steps" keyword). Single H1 retained.
- **Added visible "How to calculate fractions" ordered-list section** (4 steps)
  and a matching **HowTo JSON-LD** block that mirrors that visible copy.
- Verified every `application/ld+json` block parses (node `JSON.parse`, all valid).
- Arithmetic verified correct — **no engine change needed**.

### Deferred (not in scope / would need shared or larger work)
- 3+ operand chaining, decimal→fraction mode, simplify-only mode, free-text
  expression parsing. None are shared-file; leave for a feature pass.
