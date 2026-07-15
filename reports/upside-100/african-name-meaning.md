# African Name Meaning Finder — Audit

- Live: https://afrotools.com/tools/african-name-meaning/
- File: `tools/african-name-meaning/index.html`
- Traffic: ~18k. High-value informational intent ("[name] meaning / origin", "African baby names").

## What it does
Client-side name lookup over a 500+ name database (20 languages: Yoruba, Igbo, Hausa, Swahili, Akan, Zulu, Amharic, Shona, Xhosa, Kikuyu, Luo, Tswana, Oromo, Wolof, Fulani, Sesotho, Luganda, Somali, Tigrinya, Ewe). Two tabs: Search Names (text + language + gender filters, meaning-search fallback) and Baby Name Suggester (theme chips + language + gender + starting letter). A JS "Name of the Day" banner. All data lives in an inline `NAMES` array; there is also a generic `df-upgrade` "create summary" form + `df-faq`.

## Gaps found
- **Content depth / crawlability (biggest):** the entire 500+ name database rendered only via JS (`renderNames`). Server HTML shipped ZERO actual name/meaning content — poor for AI crawlers (ChatGPT/Perplexity) and passage-level citability on an informational query. No name-level structured data.
- **Meta description** was 164 chars (over the 120–160 window).
- **Title** was generic ("African Name Meaning Finder | AfroTools") — no long-tail language intent.
- Data source is an editorial in-file list (no per-name citation); acceptable for this tool type but worth noting for E-E-A-T.

## Non-issues
- One unique keyword H1 present. Search input + selects have aria-labels; tabs are real `<button>`s. Canonical, hreflang (en/sw/x-default), OG/Twitter, WebApplication + WebPage + BreadcrumbList JSON-LD all present and valid. FAQPage already mirrors the 7 visible FAQ (4 significance-section + 3 df-faq) — left untouched.

## Recommendations deferred
- Consider per-name deep pages / an ItemList index for top-searched names to capture "[name] meaning" long-tail (large build; out of surgical scope).
- Add a lightweight source/methodology note for E-E-A-T.

## Fixes applied 2026-07-14
- **Title** → `African Name Meaning Finder — Yoruba, Igbo & Swahili | AfroTools` (64 chars; keyword + African-language intent).
- **Meta description** → trimmed to 155 chars, keeps origin + baby-name intent.
- **Crawlable content depth:** added a server-rendered `<h2>Popular African Names and Their Meanings</h2>` glossary — a 60-name `<dl>` (3 common names × 20 languages, pulled verbatim from the in-file `NAMES` array so they stay consistent). Scoped `.name-gloss` CSS added to the existing `<style>`.
- **Structured data:** added a `DefinedTermSet` JSON-LD (60 `DefinedTerm`s) mirroring exactly the new visible glossary.
- **Validation:** all 5 `ld+json` blocks parse (`node`): WebApplication, WebPage, BreadcrumbList, DefinedTermSet (60), FAQPage (7, unchanged & mirrors visible FAQ).
- Did not touch `df-upgrade` / `df-faq` blocks or the JS engine. Name data is inline (not a shared file), so no `_shared-fixes.md` entry required.
