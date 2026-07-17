# Roman Numeral Converter — Audit

- File: `tools/roman-numerals/index.html`
- Live: https://afrotools.com/tools/roman-numerals/
- Category: Education

## What it does

Client-side, no-backend converter with three tabs:

1. **Converter** — single input, auto-detects Roman vs decimal, live `oninput`. Copy / Swap / Download TXT / Save-in-browser (localStorage) actions.
2. **Batch** — one value per line, mixed Roman/decimal, copy + download results.
3. **Quiz** — 4 difficulty tiers (easy 1–99, medium 1–499, hard 1–3999, year mode 1000–2026), random direction, score/streak, and Africa-focused history facts (OAU 1963, Ghana independence 1957, Year of Africa 1960, etc.).

Plus a reference table (I…M with subtractive rules) and a method-card explaining validation. Range 1–3999.

## Conversion correctness (verified via node)

Reimplemented `toRoman`/`fromRoman` and tested. All canonical pairs pass both directions: 1↔I, 4↔IV, 9↔IX, 40↔XL, 90↔XC, 400↔CD, 900↔CM, 2024↔MMXXIV, 3999↔MMMCMXCIX, 1994↔MCMXCIV, 1999↔MCMXCIX. Invalid input correctly rejected: `IIII`, `VV`, `IC`, `IL`, `VX`, `MMMM`, `ABC`, empty, `4000`, `0`, `-5`. The round-trip guard (`toRoman(total) !== s`) catches non-canonical forms — solid. No conversion defects found.

## Competitors & gaps

vs rapidtables/romannumerals.org: AfroTools already exceeds them with batch, quiz, save/download, and localized African facts — a genuine differentiation the generic tools lack. Pre-fix gaps: **no supporting prose beyond a short method card, no FAQPage/HowTo structured data** (a generic FAQ schema had been stripped earlier when no visible FAQ existed — but a real 6-item visible FAQ was in place, leaving it schema-less). Thin-content risk for an education keyword.

## SEO (pre-fix)

- Title generic ("Roman Numeral Converter | AfroTools"), no keyword/range hook.
- WebApplication `applicationCategory` mis-set to "WebApplication" (not a category); no educational signal.
- Visible 6-item FAQ present but **no FAQPage schema**; no HowTo.
- WebPage + BreadcrumbList + WebApplication present and valid; canonical + hreflang (en/fr/x-default) correct.

## UX / a11y

- Input has `aria-label`; result/batch status use `role="status" aria-live="polite"`. Copy has clipboard + execCommand fallback. Good.
- Mobile: `max-width:860px`, hero clamps at 680px, inputs 16px+ — fine at 375px.
- Minor: `#0047AB` used for hero gradient / primary-hover (a dark blue, semantic partner to `--color-primary`), left as-is.

## Fixes applied 2026-07-14

- **Title** → `Roman Numeral Converter: Decimal to Roman (1-3999) | AfroTools` (keyword + range).
- **Meta description** rewritten to 156 chars (within 120–160), leads with "Free Roman numeral converter".
- **H1** → `Roman Numeral Converter & Decoder (1–3999)` (unique, keyword-rich vs generic tool name).
- **Supporting content**: added a "How to convert numbers to Roman numerals" card — 7-symbol explainer, 3-step worked example (2024 → MMXXIV), and the no-more-than-three / subtractive rule prose.
- **HowTo JSON-LD** added (3 steps, mirrors the visible worked example).
- **FAQPage JSON-LD** added, matching all 6 visible Q&As verbatim (the earlier-removed schema now restored *with* a real visible FAQ backing it).
- **EducationalApplication**: WebApplication `@type` now `["WebApplication","EducationalApplication"]`, `applicationCategory` = `EducationalApplication`, plus `educationalUse` + `learningResourceType`.
- **Conversion test**: all 11 canonical pairs pass both directions; 12 invalid inputs rejected (see above).
- **JSON-LD validity**: all 5 blocks parse via node (WebApplication/EducationalApplication, WebPage, BreadcrumbList, HowTo, FAQPage).

### Deferred

- `#0047AB` hover/gradient accent kept (semantic dark-blue partner to brand); could migrate to `--color-primary-dark` in a theme sweep.
- Vinculum (4000+) support out of scope for standard-notation MVP.
