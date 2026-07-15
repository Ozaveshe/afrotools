# Bride Price Advisor — Audit (upside-100)

- **Live:** https://afrotools.com/tools/brideprice-advisor/
- **Source:** `C:/Users/Oza/Documents/afrotools/tools/brideprice-advisor/index.html` (hand-authored, single file; no generator rule matches it)
- **French mirror:** `/fr/tools/conseiller-dot/` (hreflang declared — must be kept in sync)
- **Category:** African / cultural. High sensitivity.

## 1. What it does
Client-side cultural guide: pick a country + ethnic group (13 cultures, 8 countries) and it renders a marriage-gift item list, cost-range table, a horizontal bar chart, "fun comparisons", a "Did You Know" card, a cross-culture ranking bar, plus a "Respectful family plan" savings calculator and a 3-exchange AI advisor. All data is a hardcoded `DATA` object in-page.

## 2. Cultural / sensitivity RED FLAGS (most important)
The tool has a **split personality**: respectful copy fighting crass gamification.

- **"😂 Fun Comparisons" commodify the bride.** Every culture converts the bride price into consumer goods: *"In iPhones — Could buy ~4-6 iPhone 16 Pros"*, *"In Cows"*, *"Jollof Rice — feed 500 people"*, *"Rugby Tickets ~200"*, *"Braais — fund 200 legendary braais"*. Pricing a woman's marriage in iPhones/rice/rugby tickets is exactly the "price tag" framing the tool's own disclaimer disavows ("not a purchase"). **This is the tool's central risk: it reduces marriage to a transaction.**
- **Superlative "deal" language:** Ghana Akan/Ewe cards say *"The best deal in Africa"*, *"Budget King"*, *"Cheapest in Africa"* — frames women as bargains.
- **Pricing-by-attribute jokes:** *"having a degree can add 1-2 extra cows… Education literally pays… for the in-laws! 🎓🐄"* and *"Girl power! 💪"* on Sadaki trivialize.
- **Placement:** the good disclaimer (line 296) is hidden *inside* the results block (only appears after "Show Me the Guide" is clicked); the persistent framing above the fold is the jokey `💍`/badges hero, not the "not a purchase" message.
- The **respectful family-plan planner** (lines 226-254, 509-557) and info/FAQ copy are genuinely well done and should be the model for the rest of the page.

## 3. Online analogues — what respectful, high-value versions include
Guides like Harusi Hub ("African Dowry Traditions Compared"), Jana Tribe ("Average Cost of Lobola… Negotiation, Refunds, Legal Rules"), TribeGuess, FunTimes Magazine.
They add value this tool lacks:
- **Per-item cultural MEANING** (e.g. kola nuts = hospitality/peace/life; cattle = respect/status), not just a price.
- **Negotiation etiquette & roles** — male emissaries/uncles, the *ilobola list*, ritual back-and-forth, couple never negotiates directly.
- **Legal notes per country** — legal recognition of customary marriage, refund/divorce rules, anti-inflation caps.
- **The Yoruba nuance the tool omits:** the small cash bride price is customarily **returned to the groom** as a blessing ("we don't sell our daughters"). Tool lists ₦20k-50k cash with no "returned" note.

## 4. SEO audit
- **Title** — `Bride Price Advisor — African Marriage Cost Guide` (~48 chars). Good length; "Cost Guide" leans transactional but is keyword-valid.
- **Meta description (line 8)** — WEAK / STALE. Says *"11 African cultures"* but the tool now has **13 cultures / 8 countries** (hero + data). Also leads with "fun comparisons, charts" — off-brand for a sensitive topic. Fix count + reframe.
- **H1** — `Bride Price Advisor 💍` unique, single H1. Good.
- **JSON-LD** — WebApplication + WebPage + BreadcrumbList present. **FAQPage MISSING** despite 7 real on-page FAQs (biggest structured-data win available). No Article schema. `applicationCategory` is **`DeveloperApplication`** — wrong; should be `LifestyleApplication`.
- **Canonical + hreflang** (en/fr/x-default) present and correct.
- **Content depth** — decent (intro paragraph + FAQ + sidebar); would benefit from per-culture meaning/legal copy for E-E-A-T.
- Legacy `<meta name="keywords">` present (harmless, ignored by Google).

## 5. UI/UX audit
- **Brand color leak:** dropdown arrow SVG (line 58) hardcodes `stroke='%23007AFF'` — the deprecated blue; brand standard is `#0062CC`.
- **Disclaimer placement:** only rendered inside `#results`; should be a persistent banner near the hero so it shows before any numbers.
- **States:** family-plan has a sensible default/empty state; AI advisor has typing + error states. No explicit error/empty state for the guide itself (silently returns if no culture) — minor.
- **Hero badge "AI Advisor"** promises AI while the AI section footnote says "provider required" — manage expectation.
- **Mobile 375px:** grid collapses at 800px, plan grid at 520px, fun cards at 500px — layout is responsive; the wide items table sits in a card and should be checked for horizontal overflow at 375px.
- **Accessibility:** culture `<select>` has `aria-label`; AI input labelled. Fun-fact/DYK emoji are decorative and fine.

## 6. Prioritized fixes

### A. Quick wins (exact file + change)
1. `tools/brideprice-advisor/index.html` line 8 → **rewrite meta description**: correct "11" → "13 cultures across 8 countries", drop the "fun comparisons" lead, respectful + keyword-rich (lobola, Igba Nkwu, ruracio, mahr).
2. Head (near lines 28-30) → **add `FAQPage` JSON-LD** for the 7 existing FAQs. Highest SEO ROI.
3. Line 28 → change `"applicationCategory":"DeveloperApplication"` → `"LifestyleApplication"`.
4. "Fun Comparisons" (card head line 279, `funFacts` arrays throughout `DATA`, section lines 278-283) → **replace iPhone/jollof/rugby/"Budget King"/"cheapest in Africa" comparisons and the `😂` heading** with dignity-preserving context (e.g. share of typical annual income, realistic savings timeline). This resolves the transaction-framing risk.
5. Line 58 → fix arrow SVG `%23007AFF` → `%230062CC`; and surface the disclaimer (line 296) as a persistent banner above the tool.

### B. Feature upgrades
- Add a **"What each item means"** column/tooltip (cultural symbolism per line item).
- Add a **negotiation-etiquette & roles** block (emissaries, the list, who speaks) and a **legal note** per country (customary-marriage recognition, refund rules).
- Add the **Yoruba "returned to the groom"** nuance and similar per-culture context.
- Consider renaming section to "Cultural Context" and reframing hero sub away from "what's expected / cost".

### C. Watch-outs (generated / synced files)
- No AfroKitchen/cars/government generator rule covers this file → **direct edit is safe**, but it is **not** a generated page, so edits won't be overwritten.
- **French mirror** `/fr/tools/conseiller-dot/` must be updated via the French localization pipeline (`docs/french-localization-repair.md`) — never hand-author unaccented FR copy.
- Related-tools SSR block + hreflang are in-file; leave intact.
- After edits run the narrowest SEO validation (`npm run check-links`) and re-verify JSON-LD.

## Fixes applied 2026-07-14

Edited only `tools/brideprice-advisor/index.html` (+ report notes).

1. **Tone / commodification (central risk).** Deleted all 13 `funFacts` DATA arrays (iPhone/jollof/rugby/cows/"Budget King"/"cheapest/best deal in Africa" strings) and the `😂 Fun Comparisons` heading. Replaced with a **"🕊️ Putting It in Context"** section rendered by a new `renderContext(c,cu)` function that computes dignity-preserving framing from an `INCOME_AVG` per-country map: share of a typical year's income, a realistic savings horizon (~15%/mo, often shared across relatives), and an "essentials before display" note. No emoji-per-card, no shopping comparisons.
2. **Persistent disclaimer.** Added a `.bp-notice` banner (gold, styled) directly under the hero, above the tool: *"This is a cultural-education estimate, not a literal price or demand… not a purchase."* The buried in-results disclaimer remains too.
3. **Meta description (L8)** rewritten → "13 African cultures in 8 countries", dropped "fun comparisons" lead, kept keywords (lobola, ruracio, Igba Nkwu, mahr). OG + Twitter descriptions and both WebApplication/WebPage JSON-LD descriptions aligned to the same 13/8 respectful copy.
4. **FAQPage JSON-LD** added, mirroring the 7 visible on-page FAQs verbatim. `applicationCategory` `WebApplication` → `LifestyleApplication`.
5. Brand fix: dropdown-arrow SVG `%23007AFF` → `%230062CC`. Hero badge "Fun Comparisons" → "Cultural Context".

**Validation:** all 4 JSON-LD blocks parse (WebApplication, WebPage, BreadcrumbList, FAQPage). No leftover `funFacts`/`f.color` references in JS. Two jokey `dyk` "Did You Know" cards still carry a 😂 emoji but are logistical jokes (not commodifying) — left as out-of-scope.

**Deferred:** FR mirror `/fr/tools/conseiller-dot/` must inherit these strings via the French localization pipeline — noted in `_shared-fixes.md`, not hand-edited. Feature upgrades (per-item cultural meaning, negotiation-etiquette/legal blocks, Yoruba "returned to groom" nuance) not done this pass. Dead `.bp-fun-emoji` CSS rule left (harmless).
