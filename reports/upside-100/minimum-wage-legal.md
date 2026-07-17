# Minimum Wage Reference — Audit & Fixes

Live: https://afrotools.com/tools/minimum-wage/
File: tools/minimum-wage/index.html
Engine (data): engines/minimum-wage-engine.js (shared — not edited)

## What it does
Interactive minimum-wage reference for all 54 African countries. Select a country to see
monthly/daily/hourly floor, USD equivalent, legal basis + effective date, sector-specific
rates, a three-tier living-wage gap (min vs individual vs family), historical rates chart,
inflation/purchasing-power erosion chart, and AI observations. Also: a salary compliance
checker, country-vs-country compare, a sortable/filterable/exportable 54-country table,
change-alert email subscription, anonymous wage-violation report (AfroPoints), and a legal
workflow copilot (matter note + gated PDF).

## Data source & freshness (key finding)
- Wage data is **client-side** in `engines/minimum-wage-engine.js` — the 54-country table
  ships as "Loading…" and is populated by JS. It is **not server-rendered**, so no
  crawlable table markup exists (SEO/GEO weakness) and Dataset/ItemList JSON-LD is not
  applicable per the server-render rule.
- Per-country `effectiveDate` + `law` are shown in the UI, which is good, but before this
  fix the page had **no visible overall data source, "as of" date, or ministry disclaimer**
  near the tool — sources/dates were buried only in the bottom legal blocks and in a
  meta `article:modified_time` (2026-04-03).
- **Staleness risk:** hero badges are hardcoded (`🇰🇪 KES 16,114`, `🇳🇬 ₦70,000`,
  `🇬🇭 GHS 18.15/day`) and a runtime script (lines ~1523-1531) patches `R27.58/hr → R30.23/hr`
  — evidence that hardcoded figures drift and are hand-patched. Kenya's 2024/25 gazetted
  increase means KES 16,114 is likely outdated. Underlying figures live in the shared engine
  (verify against official gazettes) — flagged to _shared-fixes.md, not changed here.

## SEO
- Title: strong (`Minimum Wage Checker for Africa 2026 — All 54 Countries | AfroTools`) — kept.
- Meta description: ~152 chars, keyword-rich — kept.
- H1 was generic "Minimum Wage Checker" (non-unique across many "…Checker" tools) → made unique/keyword-rich.
- JSON-LD: WebApplication + BreadcrumbList present and valid. No visible FAQ Q&A on page
  (only "Know Your Rights" and "What to do if paid below minimum" lists) → FAQPage **not**
  added (would be fabricated). Table not server-rendered → Dataset/ItemList **not** added.

## UX / a11y / trust
- Solid already: `aria-sort` on sortable headers, keyboard handlers, `sr-only` caption,
  `role=status`/`aria-live` on results, focus-visible rings, 44px touch targets,
  prefers-reduced-motion, mobile stacking at 640px, scrollable table wrap.
- Trust gap was the missing visible source/date/disclaimer — now fixed.

## Fixes applied 2026-07-14
1. H1 → `African Minimum Wage Checker & Rates by Country` (unique, keyword-rich; distinct
   from other "…Checker" H1s).
2. Added a visible **data source + "reviewed April 2026" + "verify with your national
   Ministry of Labour"** disclaimer note below the 54-country table (links to ILO NATLEX &
   ILOSTAT; "Informational only, not legal advice"). New `.mw-source-note` style
   (neutral slate, no accent border bar; brand-blue links).
3. Appended staleness concern (hardcoded/patched hero figures + engine data) to
   `reports/upside-100/_shared-fixes.md`.

## Deferred
- Server-render the 54-country table (or inject Dataset/ItemList JSON-LD once rendered)
  for crawlable data + rich results — needs the shared engine/build, out of scope here.
- Refresh hardcoded hero badge figures + Kenya (and any other stale) engine rates against
  official gazettes; remove the R27.58→R30.23 runtime patch hack.

## JSON-LD valid: YES (1 block, parses via node).
