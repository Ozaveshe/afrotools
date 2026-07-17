# KRA iTax Guide — Audit

- URL: https://afrotools.com/tools/itax-guide/
- File: `tools/itax-guide/index.html`
- Reviewed: 2026-07-14

## What it is
A plain-English how-to / reference **guide** (not a calculator) for Kenya's KRA iTax portal: what you can do on iTax, how to log in, KRA PIN, key deadlines/facts table, filing an employment-income return with a P9, a NIL-return path, an interactive localStorage "filing readiness checklist" (8 items, progress bar), a 5-item FAQ, a methodology/limitations/sources panel, and SSR related-tools. Correctly positions AfroTools as independent and routes all official actions to itax.kra.go.ke. Deep, well-structured content that crawlers can read (all in static HTML, not JS-gated).

## Gaps
- **Schema/content mismatch (the real bug):** the `FAQPage` JSON-LD carried **6** questions (What is iTax / How do I log in / deadline in Kenya / What is a P9 / NIL return / part of KRA) while the **visible** FAQ shows a different **5** (What is iTax / NIL return / deadline / What if I don't have my P9 / part of KRA). Google requires FAQ markup to mirror on-page content — this risked a manual/structured-data action.
- No `HowTo` schema despite two clean step-by-step sections (login; P9 return).
- Meta description ~187 chars (over the 120–160 window).
- Title strong but "Kenya" only implied via "KRA".
- Progress bar had no accessible role/value.
- No FAQ item for "how do I log in" although login is a visible H2 (kept as-is — FAQ must mirror what's shown; login is covered by the new HowTo instead).

## Content accuracy / freshness
Figures are current and sourced: annual individual return due 30 June; PAYE remitted by the 9th; personal relief KES 2,400/mo (28,800/yr); PAYE 10%–35% five bands; P9 issued ~February. "Last reviewed July 2026" matches site convention. Links to kra.go.ke and itax.kra.go.ke resolve. No stale-figure defects found.

## SEO
- Title: keyword-rich, added explicit "Kenya" intent, ~62 chars (no truncation).
- Meta: trimmed into the 120–160 window.
- H1: single, unique, keyword-bearing ("KRA iTax Guide 2026 — Login, PIN, Returns & P9"). Left unchanged.
- JSON-LD: BreadcrumbList + WebPage (kept, valid), FAQPage (rewritten to mirror the 5 visible Q&As), HowTo (added for the P9 filing steps). All 4 validated with `node`.
- Internal links: strong — Kenya PAYE, KRA eTIMS guide, Kenya VAT, Payslip generator, plus in-body PAYE-calculator links. Related-tools SSR present.
- Canonical + hreflang (en/x-default) present.

## UX / a11y
- Scannable: quick-answer box, H2 sections, deadlines table (wrapped in `overflow-x:auto`), numbered steps, card grid, `<details>` FAQ. Mobile-safe at 375px (auto-fit minmax grids, scrollable table).
- Checklist checkboxes wrapped in `<label>` (implicit association — OK). Added `role="progressbar"` + `aria-valuenow` (updated live) to the readiness bar.
- Disclaimers already present in three places (hero, note, methodology panel) with real KRA links — left intact.

## Deferred / flagged
- "High-intent money tool lacks business CTA": the page already surfaces AfroTools Pro via related-tools SSR, but there is no in-body CTA for a paid/lead action (e.g. filing-help or Pro upsell) within the guide body. Adding one is a conversion opportunity but out of surgical scope. See _shared-fixes note.

## Fixes applied 2026-07-14
- **FAQPage JSON-LD rewritten** to exactly mirror the 5 visible on-page FAQ items (was 6 mismatched Q&As) — removes structured-data/content mismatch.
- **HowTo JSON-LD added** (4 steps mirroring "Filing your employment income return with a P9": get P9 → open return on iTax → complete Excel/ODS template → submit + save receipt).
- **Title** → `KRA iTax Guide Kenya 2026 — Login, PIN, Returns & P9 | AfroTools` (added explicit "Kenya").
- **Meta description** trimmed ~187 → ~150 chars, within 120–160.
- **a11y**: readiness progress bar now `role="progressbar"` with `aria-valuemin/max/now`; JS updates `aria-valuenow` on each change.
- **Disclaimer/links** already present and correct — left unchanged.
- All 4 JSON-LD blocks re-validated with `node` — all parse.
- Edits confined to `tools/itax-guide/index.html`. Methodology df/verification panel and related-tools SSR untouched.
