# Delivery Cost Estimator — Audit

- Live: https://afrotools.com/tools/delivery-cost/
- File: `tools/delivery-cost/index.html`

## What it does
Client-side estimator. User picks country (6 named markets + "Other"), vehicle (bike/car/van/truck), distance (km), weight (kg), and urgency (Normal/Express/Urgent). Returns per-provider price cards with a low–high range plus metrics (best price, cost/kg, distance, urgency). Rate cards (base + per-km, by provider) are inline in `DEL_DATA`. Formula: `(base + perKm*dist) * urgency`; range = `[round(x*0.9), round(x*1.15)]`.

## Gaps found
- **Bug (fixed):** "Estimated Cheapest" badge and "Est. Best Price"/cost-per-kg metric were hardcoded to `providers[0]` (first in array), not the actual minimum. E.g. Kenya bike badged Lalamove (KSh 850) as cheapest while Sendy (650) and Max (630) were cheaper. Math itself was correct; the *selection* was wrong.
- **Meta description** was 178 chars (over 160).
- **Trust:** hero + pill claimed "15 Countries" but only 6 named markets + a generic "Other" option exist.
- **No estimate/source disclaimer** inside the tool result area (only inside the shared df-upgrade block, which is off-limits).
- **a11y:** only the Country `<label>` had a `for`; Vehicle/Distance/Weight/Urgency labels were unassociated, and aria-labels used dev-jargon ("Del Vehicle").
- Freshness: rate cards are indicative and undated (acceptable for an estimator, now disclaimed).
- FAQPage schema (6 Q) fully mirrors visible FAQ (3 df-faq + 3 faq-section) — no orphan questions.

## Math check
Verified via node: Kenya bike, 10 km, Normal → Lalamove 850, Sendy 650, Max 630; range Max = 567–725; per-kg (630/5) = 126. Express (×1.3) Lalamove = 1105. Post-fix best selection returns Max (630). Correct.

## Fixes applied 2026-07-14
1. Badge/metric now compute `costs[]` and select `Math.min` index (`bestIdx`) instead of index 0.
2. Meta description trimmed to 157 chars (keyword + African intent retained).
3. Hero sub + pill corrected: "across major African markets" / "6 Markets + more".
4. Added estimate + source disclaimer paragraph inside `#delResults` ("actual rates vary by courier… confirm the live quote").
5. a11y: added `for` on all field labels (delVehicle/delDistance/delWeight/delUrgency) and replaced jargon aria-labels with human text.
6. Verified all 3 JSON-LD blocks (WebApplication, BreadcrumbList, FAQPage) parse; FAQPage mirrors only visible FAQ.

Deferred: title already keyword+intent-optimized (kept); rate-card refresh with dated sources; consider expanding named-country coverage to match marketing copy. df-upgrade/df-faq/planning-summary blocks left untouched per rules.
