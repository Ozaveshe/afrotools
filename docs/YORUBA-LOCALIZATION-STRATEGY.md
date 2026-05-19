# AfroTools Yoruba Localization Strategy

## Purpose

This document is the operating strategy for the AfroTools Yoruba lane.

Yoruba should be treated as a Nigeria-first product surface, not as a bulk
translation layer. The first goal is to build a durable shell, route ownership
map, and visible-copy audit loop before translating tool pages or promoting
Yoruba routes in shared discovery.

For now, Yoruba remains a manual route-first lane:

- `scripts/build-i18n.js` supports `yo`.
- `lang/yo.json` provides shared and global strings.
- `lang/pages/**/yo.json` page packs are not present.
- The first public `/yo/` route surface exists as a hand-authored shell.
- The current generator would build English-shaped paths such as
  `/yo/all-tools/` or `/yo/tools/vat-calculator/`, so it must not be treated as
  the owner of the future Yoruba route tree.

Do not move Yoruba to generated page packs until a Yoruba source-to-route map
exists and a pilot proves that generated output preserves natural routes,
visible-copy quality, hreflang, registry discovery, and fallback honesty.

## Current Audit Snapshot

Snapshot date: 2026-05-16.

Current Yoruba readiness:

- Global language file: `lang/yo.json`.
- Page-specific Yoruba packs: `0`.
- Public Yoruba HTML routes under `/yo/`: `45`.
- Yoruba registry rows in `assets/js/components/tool-registry.js`: `45`.
- `node scripts/build-i18n.js --lang yo --dry-run` builds `0` pages.
- `npm run build:i18n:validate` passes key parity for `yo`.

This means Yoruba now has a small public shell plus the first Nigeria-first
education, telecom, health, agriculture, language, PDF, and business-tax tool surfaces, but it is not a full translation surface. Do not claim
page translation readiness because `lang/yo.json` exists or because the first
manual routes exist.

Current completion layer:

- `/yo/awon-ise/` now includes a registry-backed Yoruba catalog for the full
  English/Yoruba live tool surface.
- The catalog is documentation-first: it explains every registry tool in Yoruba
  terms, marks the 45 real Yoruba pages, and labels the remaining English tool
  routes as English fallbacks.
- This catalog does not make the remaining tools Yoruba-ready. A tool becomes a
  Yoruba tool only after a real `/yo/` route exists, visible copy is reviewed,
  registry discovery points to the real route, and the Yoruba visible-copy audit
  has no blockers.
- Keep the catalog source in `assets/js/yoruba-tool-catalog.js` and the host
  page in `yo/awon-ise/index.html`.

First public shell routes:

- `/yo/`
- `/yo/awon-ise/`
- `/yo/naijiria/`
- `/yo/owo-osu-ati-owo-ori/`
- `/yo/owo-ori-owo-ise/`
- `/yo/iwe-ati-pdf/`

First public education routes:

- `/yo/eko/`
- `/yo/awon-ise/kalkuletan-jamb/`
- `/yo/awon-ise/kalkuletan-waec-neco/`
- `/yo/awon-ise/alawus-na-nysc/`

First public telecom routes:

- `/yo/ibaraenisoro/`
- `/yo/awon-ise/lambobin-ussd/`
- `/yo/awon-ise/rajista-sim-nin/`
- `/yo/awon-ise/amulo-data/`
- `/yo/awon-ise/whatsapp-link/`

First public health routes:

- `/yo/ilera/`
- `/yo/awon-ise/duba-genotype/`
- `/yo/awon-ise/sickle-cell/`
- `/yo/awon-ise/kalkuletan-bmi/`
- `/yo/awon-ise/owo-ile-iwosan/`

First public agriculture routes:

- `/yo/ogbin/`
- `/yo/awon-ise/ere-ogbin/`
- `/yo/awon-ise/eso-irugbin/`
- `/yo/awon-ise/sise-rogo/`
- `/yo/awon-ise/iwon-ajile/`

Second public agriculture routes:

- `/yo/awon-ise/isuna-ogbin/`
- `/yo/awon-ise/agbon-oja/`
- `/yo/awon-ise/owo-oja-ogbin/`
- `/yo/awon-ise/ounje-eranko/`
- `/yo/awon-ise/ere-oko-eja/`

First public language and translation routes:

- `/yo/ede-ati-itumo/`
- `/yo/awon-ise/olufassara-yoruba/`

Second public PDF routes:

- `/yo/awon-ise/wurin-pdf/`
- `/yo/awon-ise/hada-ati-pin-pdf/`
- `/yo/awon-ise/din-iwon-pdf/`
- `/yo/awon-ise/tunto-pdf/`

Second public business-tax routes:

- `/yo/awon-ise/tin-naijiria/`
- `/yo/awon-ise/cit-naijiria/`
- `/yo/awon-ise/wht-naijiria/`
- `/yo/awon-ise/forukosile-owo-ise/`

Planned standard routes that are still not built:

- None in the original core standard-route list.

## Launch Posture

Yoruba launch posture is Nigeria-first, route-first, and manual-first.

- Nigeria-first: prioritize Yoruba-speaking Nigerian users, then expand later
  toward Benin, Togo, and diaspora use cases.
- Route-first: create and verify natural Yoruba route slugs before registry,
  search, hreflang, sitemap, or hub promotion.
- Manual-first: hand-author the first shell and hub routes before using
  `lang/pages/**/yo.json` or build generation.
- Visible-copy-first: route existence is not enough. Shared shell text, cards,
  labels, buttons, metadata-visible copy, and fallback labels must read cleanly.

## Standard Yoruba Route Slugs

Use ASCII route slugs. Visible copy should use proper Yoruba diacritics.

Core and category routes:

- `/yo/`
- `/yo/awon-ise/`
- `/yo/naijiria/`
- `/yo/owo-osu-ati-owo-ori/`
- `/yo/owo-ori-owo-ise/`
- `/yo/iwe-ati-pdf/`
- `/yo/eko/`
- `/yo/ede-ati-itumo/`
- `/yo/ilera/`
- `/yo/ogbin/`
- `/yo/ibaraenisoro/`

Do not add English-shaped Yoruba aliases such as `/yo/all-tools/`,
`/yo/nigeria/`, `/yo/salary-tax/`, or `/yo/tools/vat-calculator/` as a shortcut.
If a bridge is needed later, document the alias and canonical owner first.

## Current Source Ownership

After the first public shell, education, telecom, health, agriculture, and language batches:

- Treat `lang/yo.json` as the shared global copy source only.
- Treat navbar and footer Yoruba labels as shell copy, not full tool page
  readiness.
- Point shared Yoruba links only at existing Yoruba routes.
- Label English fallback links clearly as English pages in Yoruba-visible UI.
- Add `lang: 'yo'` registry rows only when the target route exists and has
  passed visible-copy audit.
- Keep first-batch Yoruba pages on self `hreflang="yo"` plus `x-default` until
  counterpart English, French, Swahili, and Hausa pages are explicitly in scope
  for reciprocal Yoruba alternates.
- Do not update sitemap files by hand.

Route ownership must stay documented per route:

- English source counterpart.
- Yoruba canonical route.
- Owning file or generator.
- Registry row status.
- Hreflang status.
- Fallback status.

## Accepted Technical Terms

These terms can remain in visible Yoruba copy when they are natural for Nigerian
users, product clarity, or search:

- `PDF`
- `VAT`
- `PAYE`
- `USSD`
- `JAMB`
- `WAEC`
- `NECO`
- `NYSC`
- `BVN`
- `NIN`
- `FIRS`
- `API`
- `JSON`
- `HTML`
- `CSV`
- `ZIP`
- `AfroTools`
- `Naira`
- `WhatsApp`

Accepted proper nouns and brand names include:

- `Nigeria`
- `Naijiria`
- `Yoruba`
- `Yorùbá`
- `Hausa`
- `Swahili`
- `Igbo`
- `Amharic`
- `MTN`
- `Airtel`
- `Glo`
- `9mobile`
- `Paystack`
- `Flutterwave`
- `OPay`
- `M-Pesa`

These terms are not permission to leave English sentence fragments. Surrounding
copy should be natural Yoruba.

## Fallback Policy

Fallbacks are good product behavior when they are honest.

Use Yoruba-first labels for fallback states:

- `ojú ìwé Gẹẹsi` for a route that works but is still English.
- `Ṣí ojú ìwé Gẹẹsi` for a button or call to action to an English page.
- `Ọpa yìí wà ní Gẹẹsi fún báyìí` for explanatory fallback copy.

Do not label a fallback route as Yoruba-ready.

Do not create fake Yoruba links to pages that do not exist. If a hub must link to
an English tool, keep the English href valid and disclose it in visible Yoruba
copy.

## Nigeria-First Priority Order

Yoruba should stay Nigeria-first until the first route surface remains
consistently shippable across repeated batches.

Priority order:

1. Shared shell and discovery labels: navbar, footer, language switcher, route
   fallback copy, and visible audit.
2. Core routes: `/yo/`, `/yo/awon-ise/`, `/yo/naijiria/`.
3. Money routes: `/yo/owo-osu-ati-owo-ori/` and
   `/yo/owo-ori-owo-ise/`, including TIN, CIT, WHT, VAT, PAYE, CAC-facing
   fallback guidance, and cautious FIRS/SIRS/JTB/CAC verification wording.
4. Education: `/yo/eko/`, JAMB, WAEC, NECO, NYSC, and school-fee tools.
5. Documents and PDF: `/yo/iwe-ati-pdf/`, invoice, receipt, Naira to words,
   PDF workspace shell, merge, split, compress, and reorder PDF. Browser-only
   privacy language and download gates must stay intact when the source tool
   uses them.
6. Everyday telecom: `/yo/ibaraenisoro/`, USSD, WhatsApp, SIM, NIN, BVN, and
   mobile-money fallback links.
7. Agriculture: `/yo/ogbin/`, farm profit, farm budget, cassava, crop yield,
   fertilizer, market basket, commodity price estimates, livestock feed, and
   fish profit for Nigerian farmers and traders.
8. Health and family: `/yo/ilera/`, genotype, sickle cell, BMI, blood group,
   kílíníkì, yàrá ìdánwò, and owó ilé ìwòsàn. These routes must stay
   information-only, with clear wording that they do not diagnose, prescribe,
   cure, replace emergency care, or replace qualified health professionals.
9. Language and translation: `/yo/ede-ati-itumo/`, Yoruba-first phrasebook,
   drafting, and review support with explicit certified-translation limits.
10. Benin, Togo, and diaspora expansion only after the Nigeria-first surface
    stays clean across visible-copy, links, hreflang, SEO, and registry
    discovery.

## Shared Shell Rules

The shared shell can reintroduce English even after individual pages are clean.

Rules:

- Audit `assets/js/components/navbar.js` and `assets/js/components/footer.js`
  directly when changing Yoruba discovery labels.
- Keep Yoruba navbar and footer links pointed at real Yoruba routes only after
  those routes exist.
- Keep English fallback links honest with Yoruba-visible fallback labels.
- Do not store an English fallback route as a Yoruba registry row.
- Do not hand-edit minified bundles. Run `npm run minify` if source component
  changes need bundle regeneration.

## Visible-Copy Audit

Use `scripts/audit-yoruba-visible-copy.js` as the first route-level readiness
gate. It writes:

- `reports/yoruba-visible-copy-ledger.json`
- `reports/yoruba-visible-copy-ledger.md`

`BLOCKER_VISIBLE_ENGLISH` means the route is not shippable.

Fix blockers in visible user-facing surfaces, including:

- Card names, descriptions, badges, status labels, and calls to action.
- Form labels, placeholders, helper text, buttons, and results.
- FAQ copy, advisory copy, and safety disclaimers.
- Hub intro copy and repeated card snippets.
- JSON-LD copy that can appear in search snippets.
- Navbar, footer, and registry labels that users can discover from Yoruba pages.

The audit should ignore scripts, styles, head metadata, JSON blobs, URLs, and
code examples. Accepted technical acronyms should be tracked, not treated as
blockers by themselves.

## Validation Commands

Run the narrowest proof that matches the change.

Required for most Yoruba shell, copy, hub, metadata, or strategy batches:

```bash
node scripts/audit-yoruba-visible-copy.js
npm run build:i18n:validate
```

Required when route links, alternates, canonicals, or source pairs change:

```bash
npm run validate:hreflang
npm run seo:report
```

Required when registry, navbar, footer, or discovery behavior changes:

```bash
npm run check-links
npm run audit
```

Use `npm run build:i18n:validate` to prove global translation key parity. Do not
use `npm run build:i18n -- --all` as a Yoruba generation step unless the batch is
explicitly about generation and has a route-map plan.

## Definition Of Done For A Yoruba Shell Batch

A Yoruba shell batch is done only when all of the following are true:

- `lang/yo.json` passes key parity.
- Shared labels use natural Yoruba with diacritics.
- English fallback routes are visibly labeled as English pages.
- No nonexistent `/yo/` route is linked from shared shell.
- The visible-copy audit writes both report files.
- `npm run check-links` and `npm run audit` do not introduce new blockers.
- The final report separates baseline dirty-tree debt from Yoruba changes.
