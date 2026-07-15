# Land Title Verification Checklist — Audit

- URL: https://afrotools.com/tools/land-title-check/
- File: `tools/land-title-check/index.html`
- Reviewed: 2026-07-14

## What it does
Interactive, country-specific due-diligence checklist for verifying land/property title before purchase across 16 African countries (Nigeria C of O, Kenya Title Deed, SA Deeds Office, Ghana Lands Commission, Rwanda LAIS, etc.). Select a country → get ordered verification steps (with priority, timeline, fee), a live progress bar, a cost estimate keyed to property value, a fraud-red-flags panel, a title-document-strength chart, and AI observations. Includes localStorage persistence and a print/PDF export.

## H1 finding (audit flagged "missing or duplicate h1")
FALSE POSITIVE. There is exactly **one** visible page H1 at line 240:
`<h1>Land Title <span>Verification</span> Checklist</h1>` — keyword-rich, unique. The only other `<h1` in the file (line 1054) is inside a JavaScript string used to build the print/export popup document, so it is never in this page's DOM. All other section headings on the page are correctly `<h2>`/`<h3>`. No change required to the H1; the flag does not reflect the live DOM.

## "Weak title length"
Confirmed as a length problem — but the title is **too long**, not short. Current `<title>` is ~83 chars ("Land Title Verification Checklist for Africa 2026 — Avoid Property Fraud | AfroTools"), which truncates in SERPs. Target ~50–60 chars with keyword + African intent.

## SEO
- Title: too long (see above) → shortened.
- Meta description: ~197 chars → over the 120–160 window; trimmed.
- H1: single, keyword-rich (good).
- JSON-LD present: `WebApplication` + `BreadcrumbList` (both valid). Missing a `HowTo` for the checklist steps → added.
- No visible FAQ section on the page → **no FAQPage** added (would be schema/content mismatch).
- Content depth for crawlers is weak: the 16-country checklists live entirely in a JS `COUNTRIES` object, so the rich per-country steps/fees/frauds are not in the initial HTML. Only generic copy (hero, tips, evidence-pack df blocks) is crawlable. Server-rendering a default country's steps would be the biggest organic upside (deferred — out of surgical scope).
- Canonical + hreflang (en/fr/sw/x-default) present and correct.

## Analogues (real) + gaps
1. Kenya guides — Havenkenya, Paam Real Estate, Nyota Njema (Ardhisasa/Land Registry title-deed verification): article-form, single-country, no interactivity.
2. Nigeria checklist — RealtorKingsley "Verify Land Documents in Nigeria (2025 Guide & Checklist)": static article + list, Nigeria-only.
3. Official portals — Kenya Ardhisasa, Ghana Lands Commission, SA Deeds Office / WinDeed: the actual search services, not buyer checklists.
4. Fortitude Living Homes "Title Deeds Demystified": generic step-by-step, no country logic or fraud flags.

Gap AfroTools fills: it is the only interactive **multi-country** checklist with progress tracking, cost estimate, fraud-flag panel and title-strength scoring — competitors are single-country blog posts or bare registry portals. Gaps in AfroTools vs competitors: (a) no FAQ block (competitors capture "how to verify title deed" long-tail via Q&A), (b) checklist depth invisible to crawlers (JS-only), (c) no HowTo schema (now fixed).

## UX / a11y / trust
- Checklist usability: good — click-to-toggle rows, line-through on completion, critical-step left accent, badges for priority/time/fee, progress bar. Reset + Export PDF actions.
- Print/save: dedicated `exportPDF()` opens a clean printable window with steps + fraud risks + disclaimer. Solid.
- Mobile 375px: grid collapses to single column at 900px; `.actions-row` and `.check-meta` stack at 480px. Inputs are 44px. Reads fine.
- a11y: inputs have `aria-label`s; select has a `<label>`. Toggle rows use `<label onclick>` — keyboard focus on the visual checkbox is limited (checkbox is a styled `<div>`, not a real input) — minor, deferred.
- Trust: page carried "not legal advice" only inside the generated LEGAL-* df blocks and the print export. Added a clean visible disclaimer in the main tool region (own content).

## Changes applied (Step 2)
See "Fixes applied" section below.

## Fixes applied 2026-07-14
- **Title** shortened from ~83 → 55 chars: `Land Title Verification Checklist for Africa | AfroTools` (keyword + African intent, no truncation).
- **Meta description** trimmed from ~197 → ~157 chars (within 120–160): "Free checklist to verify land titles before buying property in Africa — country-specific steps, costs and fraud red flags for Nigeria, Kenya, Ghana and more."
- **HowTo JSON-LD** added (5 steps: registry search → survey/boundaries → acquisition & encumbrances → physical inspection with surveyor → own independent lawyer). Steps mirror visible on-page guidance (evidence pack + General Tips). All 3 JSON-LD blocks (WebApplication, BreadcrumbList, HowTo) validated with `node` — all parse.
- **FAQPage** NOT added — page has no visible FAQ; adding one would be a content/schema mismatch. Deferred.
- **Disclaimer** added to the main tool region (own content, below the checklist card): "Informational only — not legal advice… always engage a licensed lawyer and surveyor before you pay a deposit or sign a transfer." Uses a full border (no top/left accent bar).
- **H1** left unchanged — already exactly one visible keyword H1; the audit's "missing/duplicate h1" flag is a false positive.
- Edits confined to `tools/land-title-check/index.html`. df blocks (LEGAL-* generated sections, related-tools SSR) untouched.

### Deferred (not in surgical scope)
- Server-render a default country's checklist so the 16-country depth is crawlable (currently JS-only `COUNTRIES` object → thin HTML for bots). Largest organic upside.
- Add a real visible FAQ block, then a matching FAQPage.
- Make checklist rows keyboard-focusable (styled `<div>` checkbox is not a native input).
- `twitter:title` still uses the older long title (kept for social; not flagged).
