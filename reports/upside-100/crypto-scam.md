# Crypto Scam Checker — Product / SEO / UX Audit

- **Live:** https://afrotools.com/crypto/scam-checker/
- **Source:** `crypto/scam-checker/index.html`
- **Backend:** `netlify/functions/crypto-scam.js` (Supabase `crypto_scam_reports` table)
- **Reviewed:** 2026-07-13

## What it does (verified from source)

It is a **community-report lookup**, not an analyzer. The "Check" tab runs a Supabase
`ilike` search on `address` and `platform` against **AfroTools' own verified reports only**
(`status=eq.verified`). There is **no on-chain analysis, no address-format validation, no
URL/domain reputation heuristics, and no cross-reference to external scam databases**. Three
tabs: Check, Report (writes via service-role function — good, no anon insert), Browse Database.
The static "10 red-flag signs" and long SEO copy are educational, not applied to the input.

## CRITICAL red flags (data-trust — tool can create false safety)

1. **Green "safe" styling on a null result.** In `index.html` (~line 934–936) a "No reports
   found" response is rendered with `class = 'check-result safe'` — the green success color used
   for genuinely-cleared results. Because the database is small and community-only, the *default*
   outcome for almost every real scam address is a reassuring green panel. The body text does say
   "This does not guarantee it is safe," but the **green visual overrides the caveat**. This is
   the single most dangerous issue: users will read green = safe and send funds.
   → Fix: render "no reports" in a **neutral/amber caution** style (new class, not `.safe`),
   lead with "Not enough data — no reports does NOT mean safe," and keep the DYOR line.

2. **Title/H1 overclaim "Verify".** `<title>Crypto Scam Checker — Verify Wallets & Report Scams`.
   The tool cannot *verify* a wallet; it only checks a limited community list. "Verify" implies an
   authoritative safety guarantee the backend does not provide. → Use "Check / Screen" not "Verify."

3. **Boilerplate "planning" panel mismatched to a safety tool.** The injected
   `section.df-upgrade[data-df-upgrade="crypto-scam"]` (~lines 821–840) and its FAQ call this a
   "planning summary… educational planning workflow, not a guaranteed outcome." That generic
   template is wrong and trust-eroding on a scam-safety page, and it feeds a **mismatched
   FAQPage schema** (see SEO #2). Likely generator-injected — see Watch-outs.

## Competitor gap features (vs Chainabuse, ScamSniffer, ScamAdviser, CryptoScamDB, Bitcoin Abuse)

1. **External DB cross-reference + report count / confidence.** Chainabuse and CryptoScamDB
   surface "reported N times" and a confidence score across chains; this tool sees only its own
   rows, producing very high false-negative rates. At minimum, cross-query Chainabuse's public API
   / CryptoScamDB and show "0 in our DB, but check X."
2. **Heuristic input analysis.** ScamAdviser scores domains (age, SSL, registration); ScamSniffer
   runs blocklists and address/URL checks. This tool applies none of its own "10 signs" to the
   query. Add address-format validation (EVM/BTC/TRON) and URL red-flag heuristics so a result is
   always more than an empty-DB miss.
3. **Verification panel + action links + business/API CTA.** No panel explaining *how* a result
   was derived, no "report to SEC Nigeria / FSCA / CMA" links, no blockchain-explorer deep link,
   and no API/partner CTA (Chainabuse monetises exactly this). All flagged missing.

## SEO audit

- **Title** 47 chars — OK length but generic; add African intent ("Africa"/"Nigeria") and drop
  "Verify." **Meta description** is solid and keyword-rich.
- **FAQPage JSON-LD is boilerplate and does NOT match visible content.** The schema (~lines
  515–547) contains generic "How should I use… planning summary" Q&As, while the *real* visible
  FAQ (5 genuine Q&As, ~lines 796–818) has **no** schema. Google requires schema to match visible
  copy — current setup risks a structured-data mismatch and wastes the rich-result opportunity.
  → Replace boilerplate FAQ schema with the 5 real Q&As.
- **Missing schema:** no `HowTo` (check an address in 3 steps) and no `ItemList`/`Dataset` for the
  browsable scam database. BreadcrumbList + WebApplication + WebPage are present and correct.
- Content depth is strong (~900 words, country regulators named). Internal linking via
  related-tools SSR is present but points only to PAYE tools — add crypto-category cross-links.

## UI/UX audit

- Input→result flow is clear; loading ("Checking…") and error states exist. Empty/short-query is
  silently ignored — add inline hint.
- **Disclaimer is only inside the result**, not persistent near the input. A trust tool needs a
  standing "heuristic, not a guarantee" notice before the user acts.
- Mobile 375px: form stacks correctly (`@media max-width:640px`), table scrolls. Good.
- Accessibility: inputs are labelled; the green/red result relies partly on colour — pair with an
  icon/text severity token.
- Trust signals thin: no "how we verify," no source attribution per report, no report count badge.

## Prioritised fixes (`file → change`)

1. `crypto/scam-checker/index.html` (~L934–936) → change the no-result branch off `.safe` green to
   a new neutral/amber `.caution` class; reword to "No reports found ≠ safe." **(CRITICAL)**
2. `crypto/scam-checker/index.html` (~L515–547) → replace generic FAQPage JSON-LD with schema
   mirroring the 5 real visible FAQs; add a `HowTo` block.
3. `crypto/scam-checker/index.html` (L8 `<title>`, L561 H1) → replace "Verify Wallets" with
   "Check / Screen Wallets," add African keyword to title.
4. `crypto/scam-checker/index.html` → add a persistent disclaimer + action links (SEC NG / FSCA /
   CMA report links, blockchain explorer) above the check input; add a business/API CTA block.
5. `netlify/functions/crypto-scam.js` (search branch) → add address-format validation and an
   external cross-reference (Chainabuse/CryptoScamDB) so a miss returns useful signal, not silence.

## Watch-outs (generated / shared files — do not hand-edit blindly)

- The `df-upgrade` panel + `df-faq` (~L821–844) and the boilerplate FAQPage JSON-LD are almost
  certainly emitted by a generator driving `assets/js/pages/english-df-app-upgrades.js` /
  `english-df-app-upgrades.css` across many tool pages. Fixing the HTML directly may be
  overwritten — locate and patch the generator/template, and per `.claude/rules/seo-pages.md`
  treat this class of injected block as generated output.
- Netlify function edits must fail closed on missing service key (already does) and be smoke-tested
  per `.claude/rules/netlify-functions.md`.

## Fixes applied 2026-07-14

- Title de-overclaimed: "Verify Wallets" → "Screen Wallets & Report Scams in Africa" (H1 already neutral "Reporter & Checker", left as-is). (SEO #Title, Critical #2)
- Persistent caution disclaimer added above the check input: "checks community-report database only; 'No result' is not a safety guarantee — always verify independently." (UI/UX)
- Action links block added below results: report-to-regulator links (SEC Nigeria, FSCA South Africa, CMA Kenya) + blockchain-explorer note (Etherscan/BscScan/Tronscan). Static links only. (Competitor gap #3)
- FAQPage JSON-LD replaced: boilerplate "planning summary" Q&As swapped for the 5 real visible FAQ items. (SEO #2)
- HowTo JSON-LD added, mirroring a new visible 3-step check guide in the Check panel. (SEO — missing HowTo)
- Note: the no-result green→amber `.caution` fix was already present (CSS + reworded JS) and left untouched. Head WebApplication/WebPage FinanceApplication schema preserved.
- Deferred (backend, logged in _shared-fixes.md): external scam-DB cross-reference + address-format validation in netlify/functions/crypto-scam.js.
