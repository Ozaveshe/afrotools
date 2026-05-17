# AfroTools Hausa Localization Strategy

## Purpose

This document is the operating strategy for the AfroTools Hausa lane.

Hausa should be treated as a Nigeria-first product surface, not as a bulk
translation layer. The first goal is to make the existing public `/ha/` route
surface shippable, useful, and honest before expanding to wider West African
coverage or introducing page-pack generation.

For now, Hausa remains a manual route-first lane:

- `scripts/build-i18n.js` supports `ha`.
- `lang/ha.json` provides shared/global strings.
- `lang/pages/**/ha.json` page packs are not present.
- Existing Hausa pages use natural Hausa route slugs such as `/ha/kayan-aiki/`
  and `/ha/kayan-aiki/kalkuletan-vat/`.
- The current generator would build English-shaped paths such as
  `/ha/all-tools/` or `/ha/tools/vat-calculator/`, so it must not be treated as
  the owner of the current route tree.

Do not move Hausa to generated page packs until a Hausa source-to-route map
exists and a pilot proves that generated output preserves natural routes,
visible-copy quality, hreflang, registry discovery, and fallback honesty.

## Current Audit Snapshot

Snapshot date: 2026-05-16.

Source artifact: `reports/hausa-visible-copy-ledger.md`.

Current visible-copy readiness:

- Hausa routes scanned: `67`.
- Clean routes: `37`.
- Routes with blockers: `0`.
- `BLOCKER_VISIBLE_ENGLISH` findings: `0`.
- `POSSIBLE_FALSE_POSITIVE` findings: `67`.
- `ACCEPTED_TECH_TERM` findings: `412`.

The visible-copy audit is the main readiness gate for Hausa route quality. A
route can exist, validate structurally, and still be unshippable if visible
English leakage remains in cards, buttons, labels, FAQs, schema-visible copy, or
fallback messaging.

## Route Inventory Summary

Current public Hausa route count: `67` HTML routes under `/ha/`.

Core and category hubs:

- `/ha/`
- `/ha/kayan-aiki/`
- `/ha/najeriya/`
- `/ha/albashi-da-haraji/`
- `/ha/kasuwanci-da-haraji/`
- `/ha/ilimi/`
- `/ha/jamb/`
- `/ha/takardu-da-pdf/`
- `/ha/harshe-da-fassara/`
- `/ha/sadarwa/`
- `/ha/noma/`
- `/ha/lafiya/`

Tool and detail routes:

- `/ha/najeriya/harajin-albashi/`
- `/ha/jamb/cbt/`
- `/ha/jamb/tutor/`
- `/ha/jamb/past-questions/`
- `/ha/jamb/turanci/`
- `/ha/jamb/lissafi/`
- `/ha/jamb/fisiks/`
- `/ha/jamb/kimiyya/`
- `/ha/jamb/halittu/`
- `/ha/noma/amfanin-gona-najeriya/`
- `/ha/noma/ban-ruwa-najeriya/`
- `/ha/noma/taki-najeriya/`
- `/ha/noma/yawan-iri-najeriya/`
- `/ha/kayan-aiki/abincin-afirka/`
- `/ha/kayan-aiki/abincin-dabbobi/`
- `/ha/kayan-aiki/alawus-na-nysc/`
- `/ha/kayan-aiki/amfanin-bayanan-intanet/`
- `/ha/kayan-aiki/canza-pdf/`
- `/ha/kayan-aiki/cit-najeriya/`
- `/ha/kayan-aiki/duba-genotype/`
- `/ha/kayan-aiki/darajar-katin-waya/`
- `/ha/kayan-aiki/fansho-najeriya/`
- `/ha/kayan-aiki/farashin-kayayyakin-gona/`
- `/ha/kayan-aiki/gina-cv/`
- `/ha/kayan-aiki/hada-da-raba-pdf/`
- `/ha/kayan-aiki/jagorar-tin-najeriya/`
- `/ha/kayan-aiki/kalkuletan-gpa-cgpa/`
- `/ha/kayan-aiki/kalkuletan-jamb/`
- `/ha/kayan-aiki/kalkuletan-vat/`
- `/ha/kayan-aiki/kalkuletan-waec-neco/`
- `/ha/kayan-aiki/kasafin-dalibi/`
- `/ha/kayan-aiki/kirkiro-invoice/`
- `/ha/kayan-aiki/kirkiro-resit/`
- `/ha/kayan-aiki/kudin-asibiti/`
- `/ha/kayan-aiki/kudin-haihuwa/`
- `/ha/kayan-aiki/kudin-tura-kudi-ta-waya/`
- `/ha/kayan-aiki/kwandon-kasuwa/`
- `/ha/kayan-aiki/kwatanta-farashin-magani/`
- `/ha/kayan-aiki/kwatanta-kudin-makaranta/`
- `/ha/kayan-aiki/kwatanta-kunshin-intanet/`
- `/ha/kayan-aiki/lambobin-ussd/`
- `/ha/kayan-aiki/mai-fassara-hausa/`
- `/ha/kayan-aiki/matsa-pdf/`
- `/ha/kayan-aiki/naira-zuwa-kalmomi/`
- `/ha/kayan-aiki/neman-tallafin-karatu/`
- `/ha/kayan-aiki/nhf-najeriya/`
- `/ha/kayan-aiki/rajistar-layin-waya-nin/`
- `/ha/kayan-aiki/ribar-gona/`
- `/ha/kayan-aiki/ribar-kiwon-kifi/`
- `/ha/kayan-aiki/rubuta-wasikar-aiki/`
- `/ha/kayan-aiki/sarrafa-rogo/`
- `/ha/kayan-aiki/sickle-cell/`
- `/ha/kayan-aiki/wht-najeriya/`
- `/ha/kayan-aiki/whatsapp-link/`
- `/ha/kayan-aiki/wurin-aikin-pdf/`

Current source ownership:

- Treat all 67 current routes as hand-authored or manually adapted Hausa pages.
- Each current route has an English source pair or counterpart, but the Hausa
  page is the route-visible source for Hausa copy.
- Do not generate over these routes from English source unless a batch
  explicitly scopes that route and proves the output path first.
- Do not add `/ha/all-tools/`, `/ha/tools/...`, `/ha/nigeria/`, or other
  English-shaped Hausa aliases as a shortcut.

## Validation Commands

Run the narrowest proof that matches the change.

Required for most Hausa copy, hub, metadata, or strategy batches:

```bash
node scripts/audit-hausa-visible-copy.js
npm run build:i18n:validate
```

Required when route links, alternates, canonicals, or source pairs change:

```bash
npm run validate:hreflang
npm run seo:report
```

Required when registry, navbar, footer, or discovery behavior changes:

```bash
npm run audit
npm run check-links
```

Required when salary, PAYE, VAT, or tax workflow pages are touched:

```bash
npm run salary-tax:verify
npm run vat-business-tax:verify
```

Use `npm run build:i18n:validate` to prove global translation key parity. Do not
use `npm run build:i18n -- --all` as a Hausa generation step unless the batch is
explicitly about generation and has a route-map plan.

## Visible-Copy Blocker Policy

`BLOCKER_VISIBLE_ENGLISH` means the route is not shippable.

Fix blockers in visible user-facing surfaces, including:

- Card names, descriptions, badges, status labels, and calls to action.
- Form labels, placeholders, helper text, buttons, and results.
- FAQ copy, advisory copy, and safety disclaimers.
- Hub intro copy and repeated card snippets.
- JSON-LD copy that can appear in search snippets.
- Navbar, footer, and registry labels that users can discover from Hausa pages.

Do not weaken safety or product honesty to clear the audit. Translate the
message into natural Hausa instead of hiding it or replacing it with vague copy.

Examples of standard visible-copy wording:

- Use `Akwai da Hausa` only for real Hausa routes.
- Use `Shafi na Turanci` for working English fallback routes.
- Use Hausa phrases for readiness, fallback, professional review, medical
  safety, and tax verification.
- Do not use raw labels such as `Hausa-ready`, `English fallback`,
  `Directory`, `fallback tools`, `clean`, `balanced`, or `custom` in Hausa UI.

## Accepted Technical Terms

The audit currently accepts these technical acronyms:

- `PDF`
- `API`
- `JSON`
- `USSD`
- `JAMB`
- `WAEC`
- `NECO`
- `NYSC`
- `VAT`
- `PAYE`
- `BVN`
- `NIN`
- `FIRS`
- `HTML`
- `CSV`
- `ZIP`

These terms can stay when they are natural for Nigerian users or necessary for
search clarity. They are not permission to keep English sentence fragments.

Accepted proper nouns and product names include:

- `AfroTools`
- `Nigeria`
- `Najeriya`
- `Naira`
- `WhatsApp`
- `MTN`
- `Airtel`
- `Glo`
- `9mobile`
- `Paystack`
- `Flutterwave`
- `OPay`
- `M-Pesa`

Brand or platform names can remain, but surrounding copy should be Hausa.

## Fallback Policy

Fallbacks are good product behavior when they are honest.

Use Hausa-first labels for fallback states:

- `Shafi na Turanci` for a route that works but is still English.
- `Bude shafin Turanci` for a button or CTA to an English page.
- `Ana iya amfani da shafin Turanci` for explanatory fallback copy.

Do not label a fallback route as `Akwai da Hausa`.

Do not create fake Hausa links to pages that do not exist. If a hub must link to
an English tool, keep the English href valid and disclose it in Hausa.

Fallback policy text should explain the state, not apologize for it. The user
should understand whether the next page is Hausa, English, or an intentionally
mixed technical tool.

## Nigeria-First Priority Order

Hausa should stay Nigeria-first until the first route surface is shippable.

Priority order:

1. Shared shell and discovery: `/ha/`, navbar, footer, search labels, registry
   rows, and route-visible cards.
2. Nigeria hub and all-tools: `/ha/najeriya/` and `/ha/kayan-aiki/`.
3. Salary, PAYE, VAT, business tax, invoice, receipt, and Naira workflows.
4. Education and exams: JAMB, WAEC, NECO, NYSC, and school-fee tools.
5. Documents and PDF: merge, split, compress, invoice, receipt, and Naira to
   words.
6. Telecom and everyday business: USSD, WhatsApp, data-use tools,
   mobile-money fee tools, and honest fallback links for pages not yet Hausa.
7. Agriculture: farm profit, cassava, crop yield, fertilizer, and market basket
   for Nigerian farmers and traders.
8. Health and family: informational-only pages with safe language for doctors,
   pharmacists, hospitals, labs, and qualified health professionals.
9. Language and translation: Hausa-first drafting and review support with
   explicit certified-translation and professional-review limits.
10. Wider Africa expansion only after the Nigeria-first surface stays clean
    across visible-copy, links, hreflang, SEO, and registry discovery.

## Shared Shell Rules

The shared shell can reintroduce English even after individual pages are clean.

Rules:

- Audit `assets/js/components/navbar.js` and `assets/js/components/footer.js`
  directly when changing Hausa discovery labels.
- Keep Hausa navbar and footer links pointed at real Hausa routes where they
  exist.
- Keep English fallback links honest with Hausa labels.
- Do not store an English fallback route as a Hausa registry row unless the href
  points to a real Hausa page.
- Keep labels short enough for mobile cards and menu items.
- If minified bundles are needed, use the repo minify workflow. Do not
  hand-edit minified files first.
- Do not broaden Hausa shell work into French, Swahili, Yoruba, or unrelated
  global shell cleanup.

Standard shell labels:

- Tools hub: `Kayan aiki`.
- Nigeria hub: `Najeriya`.
- Salary and tax hub: `Albashi da haraji`.
- VAT and business tax hub: `Kasuwanci da haraji`.
- Document and PDF hub: `Takardu da PDF`.
- Language and translation hub: `Harshe da Fassara`.
- Health hub: `Lafiya`.
- Agriculture hub: `Noma`.

## Hreflang And Registry Rules

Hreflang rules:

- Preserve canonical tags and existing valid alternates.
- Add Hausa reciprocals only when the Hausa route exists and is the correct
  counterpart.
- If a Hausa page points to an English or French counterpart, that counterpart
  must point back only when the relationship is real.
- Do not add hreflang for missing routes.
- Do not clean unrelated French or Swahili warnings in a Hausa-only batch.
- Run `npm run validate:hreflang` after any route, canonical, or alternate
  change.

Registry rules:

- `assets/js/components/tool-registry.js` is discovery source of truth for
  shared search, tool cards, and counts.
- Hausa registry rows must point to existing route-visible Hausa pages.
- Registry `lang: 'ha'` rows should use Hausa-first names and descriptions.
- Do not promote a blocked, fallback, or unreviewed page as complete Hausa.
- Keep accepted acronyms and product names when natural, but keep descriptions
  in Hausa.
- Run `npm run audit` after registry edits.

## Do-Not-Touch Boundaries

Unless a batch explicitly says otherwise:

- Do not touch `dist/`.
- Do not hand-edit minified files.
- Do not add new Hausa routes.
- Do not edit unrelated French, Swahili, Yoruba, or English pages.
- Do not change tax rates, data tables, formulas, or tool logic while doing
  visible-copy cleanup.
- Do not restamp sitemap dates by hand.
- Do not run broad generation over `/ha/` pages.
- Do not replace honest fallback language with false readiness claims.
- Do not treat `lang/ha.json` as proof that route-level Hausa pages are
  generated or complete.

## Next Batch Recommendations

Recommended next batches:

1. Keep the zero-blocker gate stable. Run the visible-copy audit before and
   after any Hausa copy batch.
2. Reduce possible false positives only where they confuse users. Brand names,
   platform names, and accepted acronyms can remain.
3. Review mobile layout on the five highest-risk hubs:
   `/ha/kayan-aiki/`, `/ha/najeriya/`, `/ha/lafiya/`,
   `/ha/albashi-da-haraji/`, and `/ha/kasuwanci-da-haraji/`.
4. Keep metadata and JSON-LD review in the gate for all 59 routes so
   search-visible copy stays Hausa where the page is Hausa.
5. Audit registry, navbar, and footer after each copy wave to make sure shared
   discovery does not regress.
6. Keep the agriculture cluster coherent and reciprocal:
   `/ha/noma/`, `/ha/kayan-aiki/ribar-gona/`,
   `/ha/kayan-aiki/sarrafa-rogo/`, `/ha/noma/amfanin-gona-najeriya/`,
   `/ha/noma/taki-najeriya/`, `/ha/kayan-aiki/kwandon-kasuwa/`,
   `/ha/kayan-aiki/farashin-kayayyakin-gona/`,
   `/ha/kayan-aiki/abincin-dabbobi/`, and
   `/ha/kayan-aiki/ribar-kiwon-kifi/`.
7. Keep the next expansion Nigeria-first: JAMB CBT/tutor shells, remaining
   telecom comparison helpers, deeper document/PDF helpers, and business tax
   follow-ons only when the English source route is mature.
8. Defer page-pack generation until there is an explicit Hausa route map and a
   small hub-only pilot.

Current strategic verdict: `KEEP_MANUAL_ROUTE_LANE`.
