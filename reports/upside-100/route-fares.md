# Route Fares — audit

Live: https://afrotools.com/tools/route-fares/
File: `tools/route-fares/index.html`

## What it does
A crowd-sourced transport-fare feed. Commuters browse a "Verified Route Feed" of recent
fare submissions filterable by country, city, and route (from/to), and submit their own
fares (mode, operator, currency, amount, observation date, source type, proof URL) that
earn AfroPoints. New routes and large fare jumps auto-enter review. Data is fetched from
the shared `/api/transport-fares` endpoint and rendered by `assets/js/market-data-app.js`.

## Data source & freshness
- Source: commuter/community fare reports (self-observed, receipt, operator quote,
  community check) surfaced through AfroPoints. Not an official tariff feed.
- Freshness: each submission carries an "Observed At" timestamp; the feed shows recent
  public rows. Fares are volatile (fuel, time of day, traffic, negotiation) so results
  are inherently indicative. Before this fix there was NO visible source/indicative
  disclaimer in the feed area — only the generic `df-upgrade` "planning estimate" note.

## Gaps found
- SEO: generic `<title>` and `<h1>` ("Route Fares") with no African/keyword intent.
- Structured data: only a `FAQPage` block existed; no `WebApplication` schema.
- Trust: no visible statement that fares are crowd-sourced indicative estimates, nor a
  pointer to the AfroPoints source, in the feed panel (the non-df, always-visible area).
- a11y: live-updating summary and results grid had no `aria-live`/region labelling.
- FAQ mismatch (NOT fixed — df block, out of scope): the visible `df-faq` and its mirrored
  FAQPage describe a calculator ("enter your amounts, rates and dates") rather than this
  crowd-sourced fare feed. Left as-is per instruction (FAQPage must mirror visible FAQ;
  df blocks are not to be touched). Flagged for the df-content owner.
- Data: fare rows come from the shared `/api/transport-fares` endpoint — not editable here.

## Fixes applied 2026-07-14
- `<title>` → "African Route Fares Tracker: Bus, Matatu & Danfo Prices | AfroTools"
  (keyword + African commuter intent); og:/twitter: titles aligned.
- Meta description rewritten to 156 chars with African modes/markets and the submit CTA;
  og/twitter descriptions aligned.
- `<h1>` → "African Route Fares Tracker" (unique, keyword-bearing; hero copy scoped to
  "African cities").
- Added valid `WebApplication` JSON-LD (TravelApplication, free Offer). Existing FAQPage
  left unchanged (it mirrors the visible df-faq).
- Added a visible source + indicative-fare disclaimer inside the Verified Route Feed panel:
  names AfroPoints as the source, states fares are indicative estimates (not official
  tariffs), and tells users to confirm with the operator.
- a11y: `aria-live="polite"` on `#mdSummary`; `role="region"` + `aria-label` +
  `aria-live` on the `#mdList` results grid.

## Deferred
- Shared data endpoint `/api/transport-fares` freshness/source metadata — see
  `_shared-fixes.md`.
- df-faq / df-upgrade calculator-style copy mismatch — owned by the df-content generator.

JSON-LD: both blocks parse (verified with node) — WebApplication + FAQPage.
