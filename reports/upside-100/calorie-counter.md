# Calorie Counter (African Foods) — Audit

- Live: https://afrotools.com/health/calorie-counter/
- File: `health/calorie-counter/index.html`
- Category: Health

## What it does

Client-side calorie/nutrition lookup for African foods. An inline `FOODS` array of ~90 dishes (per-100g values with a standard serving `sg`) drives a searchable, region-filterable grid (West/East/Southern/North/Pan-African). Tap a food to add it to "Today's Meal Log", adjust servings (0.25–10), and see a live daily total vs. an editable target (500–10000 kcal) with a progress bar and Protein/Carbs/Fat/Fibre macro bars. Fuzzy search, localStorage persistence, Reset Day, and Copy Summary. Pure HTML/CSS/JS, no framework.

## Data source & plausibility

- Cited sources: FAO/INFOODS Africa Food Composition Database, Nigeria Food Composition Table (2017), USDA FoodData Central, Kenya National Food Composition Tables.
- Values are per-100g and multiplied by serving grams. Spot-checks are plausible: Jollof 170 kcal/100g → 425 kcal/250g (matches FAQ 425, P8.8/C75/F10.5); Ugali 130 → 325/250g (matches FAQ). Palm oil 884 kcal/100g, groundnuts 567, white rice cooked 130 — all consistent with reference tables. No implausible outliers found.

## Gaps

- Original page-level JSON-LD was a broken `WebPage` block with `name`/`url`/`description` all set to `https://afrotools.com/` (placeholder garbage) — no valid tool schema.
- FAQPage schema mirrored the generic df-faq boilerplate ("How should I use this?"), NOT the real visible African-food FAQ — a schema/visible-content mismatch risking rich-result rejection.
- No explicit "estimates / not medical advice" disclaimer near the tool (only generic df planning boilerplate).
- No per-food macro breakdown shown in the grid (only calories); serving sizes are fixed (no gram-level custom entry). Not fixed (out of surgical scope).

## SEO / UX / trust

- Title, meta description (146 chars), single keyword H1 ("African Food Calorie Counter") all strong and African-intent — left as-is.
- Breadcrumb JSON-LD valid. Canonical + hreflang (en/fr/sw) present.
- UX flow (search → filter → add → total) is clean; mobile CSS collapses grid to 1 col at 640px, macros to 2-col. Keyboard: food items tabbable + Enter, FAQ role=button + aria-expanded, inputs aria-labelled. a11y is adequate.

## Fixes applied 2026-07-14

1. Replaced broken `WebPage` JSON-LD with valid `["WebApplication","HealthApplication"]` schema (correct name/url/description, applicationCategory HealthApplication, free Offer, isPartOf AfroTools).
2. Rewrote FAQPage JSON-LD to mirror the real visible FAQ exactly (jollof calories, ugali calories, data source, is-it-free).
3. Added a visible `role="note"` disclaimer in the meal-log card: values are estimates per serving, not medical/dietary advice, consult a doctor/dietitian, plus the four food-composition sources.
4. Verified all 3 ld+json blocks parse via node (WebApplication/HealthApplication, BreadcrumbList, FAQPage).

Deferred (not surgical): gram-level custom serving input, per-food macro display in grid, expanding the ~90-item DB toward the "200+" marketing claim.
