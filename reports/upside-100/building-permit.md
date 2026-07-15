# Building Permit Checklist — Audit

- URL: https://afrotools.com/tools/building-permit/
- File: `tools/building-permit/index.html`
- Reviewed: 2026-07-14

## What it does
Interactive, jurisdiction-specific building-permit checklist for 10 African regimes: Nigeria (Lagos LASPPPA + Abuja FCDA/AEPB), Kenya (NCA + County), South Africa (Municipality + NHBRC), Ghana (TCPD + Lands Commission), Egypt (GOPP + local Hai), Tanzania (Municipal Council + NHBRA), Rwanda (RHA + Irembo one-stop), Ethiopia (City Construction Bureau) and Uganda (Physical Planning Committee + KCCA). Select a country → authority card (name, note, est. cost, timeline), an ordered step list (each with fee, time, critical flag, detail), a live progress bar with critical-items-remaining counter, a penalty box, a country tip, and AI observations. Steps are click-to-toggle checkboxes.

## Content accuracy / freshness
- Country data is well-researched and largely accurate: correct professional bodies (ARCON/COREN, BORAQS/IEK, SACAP/NHBRC/SANS 10400, GIA/GhIE, Syndicate of Engineers, AQRB/ERB, IAR/IER, EAA, USA/UIPE), correct statutes (Kenya NCA Act 2011, SA National Building Regulations, Ghana TCPD Act 2016, Egypt Building Law 119/2008, Tanzania Urban Planning Act 2007, Rwanda Law N°10/2012, Ethiopia Proclamation 624/2009, Uganda Building Control Act 2013), and correct portals (Lagos e-Planning, Kenya Ardhisasa, Rwanda Irembo).
- Freshness signal: `article:modified_time` = 2026-03-28; generated LEGAL-* blocks say "Reviewed 28 April 2026". Fee ranges are in local currency and are directional (fine given the disclaimer).

## SEO
- Title: was ~135 chars (keyword-stuffed country list, truncates in SERP) → shortened to a clean keyword + African-intent title.
- Meta description: was ~228 chars → over the 120–160 window → trimmed to ~156.
- H1: single, but generic "Building Permit Checklist" → added "for Africa" for unique keyword + intent.
- JSON-LD: had `WebApplication` (applicationCategory `FinanceApplication`, wrong for a checklist) + `BreadcrumbList`. Missing HowTo and FAQ. → category corrected to `BusinessApplication`; added HowTo (7 generic pan-African steps) and FAQPage (4 Q&As mirroring a new visible FAQ).
- Crawlable content: the per-country steps/fees/timelines live entirely in a JS `PERMITS` object, so the rich depth is invisible to bots — only hero copy, info cards, the new FAQ and generated df blocks are in initial HTML. Server-rendering a default country's steps is the biggest organic upside (deferred).
- Canonical + hreflang (en/fr/sw/x-default) present and correct.

## Analogues (real) + gaps
1. BuildZoom (US) — permit lookup/contractor matching; single-market, no Africa coverage.
2. Country blog guides — e.g. Nigerian/Kenyan law-firm and developer articles on "how to get a building permit": static, single-country, no interactivity or progress tracking.
3. Official portals — Lagos e-Planning, Kenya Ardhisasa, Rwanda Irembo: the actual application services, not buyer-side checklists.

Gap AfroTools fills: the only interactive **multi-country** permit checklist with per-step fees/timelines, critical-step flags, progress tracking and demolition-penalty context. Gaps in AfroTools: (a) no visible FAQ (now added) to capture "do I need a building permit / how long does it take" long-tail; (b) checklist depth invisible to crawlers (JS-only); (c) no HowTo/FAQ schema (now fixed).

## UX / a11y / trust
- Checklist usability: good — click-to-toggle rows, checked (green) state, critical left-accent, fee/time chips, live progress + critical-remaining counter.
- Print/PDF: no dedicated print stylesheet or export in the tool region (the generated LEGAL-* copilot block offers an email-gated PDF, but that is df content). Browser print works but is unstyled. Deferred.
- Mobile 375px: step-meta/detail unindent under 600px; authority card scales; reads fine.
- a11y: select has a `<label>` (good). Step rows were clickable `<div>`s with `onclick` only (no keyboard access) → added `role="checkbox"`, `tabindex="0"`, `aria-checked`, `aria-label` and an Enter/Space keydown handler.
- Trust: "not legal advice" appeared only inside generated LEGAL-* df blocks → added a clean visible disclaimer in the main tool region.

## Fixes applied 2026-07-14
- **Title** shortened ~135 → 53 chars: `Building Permit Checklist for Africa 2026 | AfroTools`.
- **Meta description** trimmed ~228 → ~156 chars (within 120–160): "Free building permit checklist for Nigeria, Kenya, South Africa, Ghana, Egypt, Rwanda and more — required documents, fees, timelines and demolition penalties."
- **H1** → `Building Permit Checklist for Africa` (kept `tl-accent` span; one unique keyword H1).
- **JSON-LD**: `applicationCategory` `FinanceApplication` → `BusinessApplication`; added **HowTo** (7 pan-African steps: verify title → architect → structural cert → zoning consent → submit & pay → approval & display → inspections & completion cert) and **FAQPage** (4 Q&As). All 4 objects in the single `@graph` block validated with `node` — parses.
- **FAQPage mirrors visible content**: added a real visible "Building permit FAQs" `<section>` in the main column with the exact same 4 Q&As (no schema/content mismatch).
- **Disclaimer** added to the main tool region (own content, full border — no top/left accent bar): informational only; requirements/fees/timelines vary by authority — verify with your local planning office.
- **a11y**: checklist rows are now keyboard-operable (`role="checkbox"`, `tabindex`, `aria-checked`, `aria-label`, Enter/Space handler).
- Edits confined to `tools/building-permit/index.html`. df blocks (LEGAL-* generated sections, related-tools SSR, planning summary) untouched. No shared-data edits (nothing to append to `_shared-fixes.md`).

### Deferred (not in surgical scope)
- Server-render a default country's checklist so the 10-regime depth is crawlable (currently JS-only `PERMITS` object → thin HTML for bots). Largest organic upside.
- Add a styled print stylesheet / native export in the tool region (current print is unstyled; the email-gated PDF lives only in the generated copilot block).
- `twitter:title` / `og:title` still use the older long "10 Jurisdictions" wording (kept for social; not flagged).
