# Livestock Feed Calculator — Audit

URL: https://afrotools.com/agriculture/livestock-feed/
File: `agriculture/livestock-feed/index.html`

## What it does
Hub/landing page for a livestock feed tool. Two surfaces:
1. A 15-country grid (regionally grouped) linking to per-country pages.
2. An embedded interactive "Feed budget planner" (shared `df-upgrade` block): inputs = currency, number of animals, kg feed/animal/day, feed price/kg, planning days. Output = total feed budget with a note to adjust for breed/age/grazing/vet guidance. Formula: `animals × kgPerDay × feedPrice × days`.

## Math verification
- Handler in `assets/js/pages/english-df-app-upgrades.js`: `animals*kgPerDay*feedPrice*days`.
- Node check with defaults: 25 × 2.5 × 420 × 30 = **787,500 NGN** — matches. Correct.
- Note: copy in the df card promises a "ration warning" indicator, but the output string does not emit one. Minor UX/copy mismatch — deferred (df block is off-limits per task rules).

## Gaps / findings
- **Meta description was 206 chars** (over the 120–160 window). Fixed → 147.
- **FAQPage JSON-LD did not mirror the visible FAQ.** It carried a phantom "Which countries are supported?" question (shown nowhere), omitted two visible questions ("What is dry matter?", "Is the calculator free?"), and had wording drift ("local/free" vs the visible "local or free"). Rebuilt to mirror the 5 visible `.seo-content` FAQ items exactly.
- Title, H1, canonical, hreflang, breadcrumb JSON-LD, OG/Twitter tags: all sound; left as-is.
- Disclaimer already present in the df card ("planning estimate. Confirm ration with an extension officer or veterinarian…" + FAO source). Not duplicated.
- A11y: form inputs carry aria-labels; result has `aria-live="polite"`; links have text; breadcrumb labelled. No blockers.

## SEO
- Title: "Livestock Feed Calculator for Africa — 15 Countries | AfroTools" — keyword + African intent, kept.
- H1: "Livestock Feed Calculator for Africa" — unique, kept.
- JSON-LD: CollectionPage, FAQPage (5 Q, mirrors visible), BreadcrumbList — all parse.

## Deferred
- `df-upgrade`/`df-faq` blocks (shared component + minified JS) left untouched per task rules — includes the unimplemented "ration warning" copy and the separate 3-question df-faq.

## Fixes applied 2026-07-14
- Meta description trimmed 206 → 147 chars, keyword + African + local-currency intent.
- FAQPage JSON-LD rebuilt to mirror the 5 visible `.seo-content` FAQ questions (removed phantom "Which countries" Q, added dry-matter and free-to-use Qs, fixed local-feeds wording).
- Math re-verified via node (25×2.5×420×30 = 787,500). No code change needed.
- All 3 JSON-LD blocks re-validated with node — parse OK.
- No shared files edited; nothing appended to `_shared-fixes.md`.
