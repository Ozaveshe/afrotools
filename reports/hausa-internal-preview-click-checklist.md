# Hausa Internal Preview Click Checklist

Snapshot date: 2026-05-18

Audience: internal reviewers testing the Hausa lane without needing repo
context.

Preview verdict to prove: `INTERNAL_PREVIEW_READY`.

Current lane facts:

- Public Hausa routes: 72.
- Hausa registry rows: 67.
- Visible-copy blockers: 0.
- Missing Hausa registry targets: 0.
- Standard readiness label: `Akwai da Hausa`.
- Standard fallback label: `Shafi na Turanci`.

## How To Use This Checklist

Open each route in the preview environment, for example:

- Production-style path: `https://afrotools.com/ha/...`
- Local static preview: `http://localhost:<port>/ha/...`

For every page:

- Confirm the primary heading and main action are Hausa-first.
- Confirm fallback links say `Shafi na Turanci`, `Bude shafin Turanci`, or an
  equivalent Hausa phrase.
- Confirm no English fallback is presented as a complete Hausa page.
- Check one desktop width and one mobile width.
- Use test data only. Do not enter real tax, medical, bank, exam, or identity
  data.

## PAYE Flow

Route: `/ha/najeriya/harajin-albashi/`

Expected Hausa labels:

- Main heading: `PAYE na Najeriya` and `Kalkuleta Haraji`.
- Tabs: `Tsohon tsari - PITA` and `Sabon tsari - NTA 2026`.
- Mode buttons: `Gross -> albashin hannu` and `Albashin hannu -> Gross`.
- Inputs include `Albashin shekara kafin cire-cire`, `Lokacin shigarwa`,
  `Kason gudummawar NHIS (%)`, `Premium na inshorar rai a shekara`, `Hayar
  shekara da aka biya`, and related relief fields.

Click path:

1. Open `/ha/najeriya/harajin-albashi/`.
2. Leave the default salary or enter `3600000`.
3. Switch between PITA and NTA 2026.
4. Switch between annual and monthly input.
5. Click the calculate action if the result does not update automatically.
6. Try one preset such as `NGN 250k/mo`.

Expected result behavior:

- Result card should update without a page reload.
- Net salary, PAYE/tax, relief or taxable-income values should change when the
  regime, salary period, or salary amount changes.
- Numbers should remain formatted as money and should not show `NaN`,
  `undefined`, blank result cards, or JavaScript error text.
- Print/share/export controls, if visible, should not hide the result.

Fallback wording:

- Blog and non-Hausa salary links should disclose `shafi na Turanci`.
- The page may link to English salary/country pages, but the main PAYE
  calculator itself is a Hausa route.

Go/no-go:

- Go if the Hausa labels render, calculations update, and fallback links are
  clearly marked.
- No-go if the tax result is blank, script errors prevent calculation, English
  UI labels dominate the form, or a fallback route is labeled as Hausa.

## VAT Flow

Route: `/ha/kayan-aiki/kalkuletan-vat/`

Expected Hausa labels:

- Main heading: `Kalkuletan VAT na Afirka don masu kasuwanci da masu kula da
  kudi`.
- Primary country controls include `Kasa` and country buttons such as
  `Najeriya 7.5%`, `Kenya 16%`, `Afirka ta Kudu 15%`, and `Ghana 20%`.
- Main inputs include `Adadi (ba tare da VAT ba)`, `Adadi`, and `Yi amfani da
  adadin VAT na musamman`.
- Mode labels should describe invoice/line-item work in Hausa while keeping
  accepted terms such as VAT and B2B.

Click path:

1. Open `/ha/kayan-aiki/kalkuletan-vat/`.
2. Select `Najeriya 7.5%`.
3. Enter a taxable amount such as `100000`.
4. Switch to another country and confirm the rate changes.
5. Toggle the custom VAT rate and enter a small test value.
6. Open the invoice or line-item mode if present and add at least one line.

Expected result behavior:

- VAT added, VAT removed, total, or invoice values should update from the same
  amount and rate.
- Changing country or custom rate should change the computed VAT.
- Result labels should remain Hausa-first.
- No tax rate should appear updated beyond the page source truth.

Fallback wording:

- Official/tax advisory language should tell reviewers to confirm with FIRS,
  the official portal, or a qualified tax professional where appropriate.

Go/no-go:

- Go if VAT math updates, country rates display, and safety copy remains
  advisory.
- No-go if the page claims official filing, changes rates without source truth,
  displays raw English fragments such as `standard rate` or `exempt` without
  Hausa context, or breaks invoice/result wiring.

## JAMB Flow

Routes:

- `/ha/jamb/`
- `/ha/jamb/cbt/`
- `/ha/jamb/tutor/`
- `/ha/jamb/past-questions/`

### Main Hub

Expected Hausa labels:

- Main heading: `AfroJAMB a Hausa`.
- Cards: `Gwajin JAMB CBT`, `Mai taimakon AI na JAMB`, `Tsoffin Tambayoyi`,
  and `Kalkuletan jimillar JAMB`.
- Valid readiness badges: `Akwai da Hausa` for Hausa shells.
- Valid fallback badges: `Shafi na Turanci` for English-only tools or archives.

Click path:

1. Open `/ha/jamb/`.
2. Click `Jagorar CBT a Hausa`.
3. Return to the hub and click `Mai taimakon AI na JAMB`.
4. Return and click `Tsoffin Tambayoyi`.
5. Check subject guide links for Hausa subject pages and English archives.

Expected behavior:

- Hausa shell routes should open under `/ha/jamb/`.
- English-only archives should open English routes and be labeled as such.
- No fake Hausa yearly archive should exist.

### CBT Shell

Route: `/ha/jamb/cbt/`

Expected labels:

- Heading: `Shirya kafin bude gwajin JAMB CBT.`
- CTA: `Bude gwajin CBT na Turanci`.
- Boundary text: `Gwaji yana Turanci`.

Expected behavior:

- The CTA should go to `/jamb/cbt/`.
- The shell should not claim that CBT questions, timer, keyboard behavior, or
  results have been localized.
- The Hausa page should explain that the underlying CBT remains English.

### Tutor Shell

Route: `/ha/jamb/tutor/`

Expected labels:

- Heading: `Yi amfani da mai taimakon JAMB AI cikin gaskiya.`
- CTA: `Bude mai taimakon AI na Turanci`.

Expected behavior:

- CTA should go to `/jamb/tutor/`.
- The page should not promise Hausa AI answers.
- It should not claim to replace a teacher, JAMB, or official study material.

### Past Questions Fallback

Route: `/ha/jamb/past-questions/`

Expected labels:

- Heading: `Hanyar Hausa zuwa tsoffin tambayoyin JAMB.`
- CTA: `Bude ajiyar tambayoyi ta Turanci`.
- Subject cards should say `Akwai da Hausa` for Hausa subject guides.
- Archive cards should say `Shafi na Turanci`.

Expected behavior:

- Hausa subject guides should open `/ha/jamb/turanci/`,
  `/ha/jamb/lissafi/`, `/ha/jamb/fisiks/`, `/ha/jamb/kimiyya/`, or
  `/ha/jamb/halittu/`.
- English archive links may open `/jamb/past-questions/?subject=...`.
- No yearly archive should be invented under `/ha/`.

JAMB go/no-go:

- Go if Hausa shells are clear and all archives are honestly marked.
- No-go if the route implies official JAMB affiliation, promises Hausa AI
  output, changes CBT logic, or creates fake Hausa archive routes.

## PDF Flow

Routes:

- `/ha/kayan-aiki/hada-da-raba-pdf/`
- `/ha/kayan-aiki/matsa-pdf/`
- `/ha/kayan-aiki/canza-pdf/`
- `/ha/kayan-aiki/sanya-hannu-pdf/`

Use test PDF files only.

### Merge/Split

Route: `/ha/kayan-aiki/hada-da-raba-pdf/`

Expected labels:

- Heading: `Hada da Raba PDF`.
- Upload label starts with `Danna don kara PDFs`.
- Actions include `Hada PDFs`, `Raba PDF`, `Goge jerin`, `Range na musamman`,
  and `Ciro shafuka`.

Expected behavior:

- Adding PDFs should list the files.
- Merge should create a downloadable result.
- Split/range controls should not freeze the page.
- The local-file safety posture should remain visible.

### Compress

Route: `/ha/kayan-aiki/matsa-pdf/`

Expected labels:

- Heading: `Matsa PDF`.
- Upload label: `Danna ko ja PDFs zuwa nan`.
- Modes include `Tsabtacewa`, `Daidaito`, `Mai karfi`, `Inganci mai kyau`,
  and `Na musamman`.
- Result area includes `Sakamako`, `Asali`, `An matsa`, and `Zazzage`.

Expected behavior:

- Uploading a PDF enables `Matsa PDF`.
- Result should show original size, compressed size, and a download action.
- Multiple files may produce ZIP behavior.
- Do not treat a small compression gain as a bug if the PDF is already small.

### Convert

Route: `/ha/kayan-aiki/canza-pdf/`

Expected labels:

- Heading: `Canja PDF`.
- Upload label: `Ja fayil nan ko danna don zaba`.
- Controls include `Abin da kake so a yi`, `Sunan sakamako`, `Ingancin hoto ko
  shafi`, `Shafuka`, `Gudanar da aiki`, `Kwafi takaitawa`, `Sauke TXT`, and
  `Sauke rahoton JSON`.

Expected behavior:

- Uploading a supported file should enable processing.
- TXT or JSON download should be gated through the shared PDF/download flow.
- If OCR is not available for scanned PDFs, the page should say so instead of
  pretending text extraction will always work.

### Sign

Route: `/ha/kayan-aiki/sanya-hannu-pdf/`

Expected labels:

- Heading: `San abin da zai faru kafin ka sa hannu a PDF.`
- CTA: `Bude kayan aikin Turanci`.
- Return link: `Komawa cibiyar PDF`.

Expected behavior:

- The route is a Hausa guide shell, not the full signing app.
- CTA should open `/tools/pdf-sign/`.
- Copy should say the full signing workflow remains on the English tool to
  preserve PDF file handling and download behavior.

PDF go/no-go:

- Go if local-first file handling, downloads, and fallback shell labels are
  clear.
- No-go if upload/download controls break, sensitive-file safety copy
  disappears, or the PDF Sign guide claims full Hausa signing UI.

## Telecom Flow

Routes:

- `/ha/kayan-aiki/lambobin-ussd/`
- `/ha/kayan-aiki/kwatanta-kunshin-intanet/`
- `/ha/kayan-aiki/darajar-katin-waya/`

### USSD

Route: `/ha/kayan-aiki/lambobin-ussd/`

Expected labels:

- Heading: `Lambobin USSD na kamfanin sadarwa da banki`.
- Controls: `Kasa`, `Nemo lamba`.
- Empty state: asks the reviewer to choose a country.

Click path:

1. Select Nigeria if available.
2. Search for `MTN`, `ragowar kudi`, or `tura kudi`.
3. Try category tabs.
4. Copy a code if copy buttons are present.

Expected behavior:

- Results should appear from the telecom source data.
- Source note should say codes can change and should be confirmed from the
  operator app, website, or support.

### Data Plan

Route: `/ha/kayan-aiki/kwatanta-kunshin-intanet/`

Expected labels:

- Heading: `Kwatanta kunshin intanet kafin ka saya.`
- CTA: `Bude cikakken teburin Turanci`.
- Note says the full comparison table remains on the English page and prices
  should be confirmed from the operator before buying.

Expected behavior:

- CTA should go to `/telecom/data-plan-compare/`.
- The Hausa page should not claim live official data prices.

### Airtime Value

Route: `/ha/kayan-aiki/darajar-katin-waya/`

Expected labels:

- Heading: `Darajar katin waya zuwa kudi`.
- Controls: `Kasa`, `Kamfanin sadarwa`, `Adadin katin waya`.
- Action: `Kiyasta kudin da za a iya samu`.

Expected behavior:

- Entering an airtime amount should produce an estimated cash value.
- Page should remind users to confirm payment before sending airtime.
- MTN, Airtel, Glo, 9mobile, USSD, SIM, NIN, and BVN can remain as accepted
  terms where natural.

Telecom go/no-go:

- Go if source/estimate caveats are visible and no price is presented as
  official without proof.
- No-go if plans, codes, or airtime values look like guaranteed live prices or
  if operator-confirmation wording is missing.

## Agriculture Flow

Routes:

- `/ha/noma/amfanin-gona-najeriya/`
- `/ha/noma/taki-najeriya/`
- `/ha/noma/ban-ruwa-najeriya/`
- `/ha/noma/yawan-iri-najeriya/`

### Crop Yield

Route: `/ha/noma/amfanin-gona-najeriya/`

Expected labels:

- Heading: `Kiyasta amfanin gona kafin ka kashe kudi.`
- Controls: `Amfanin gona`, `Yanki`, `Girman gona (hekta)`, `Nau'in kasa`,
  `Ban ruwa`, `Amfani da taki`, `Nau'in iri`, `Lokacin shuka`.
- Action: `Kiyasta amfanin gona`.

Expected behavior:

- Result should show yield per hectare, total yield, farm size, revenue range,
  and recommendations where available.
- Values should change when crop, region, farm size, irrigation, fertilizer, or
  seed changes.

### Fertilizer

Route: `/ha/noma/taki-najeriya/`

Expected labels:

- Heading: `Kiyasta buhunan taki da kudin da za su shiga gona.`
- Controls include `Amfanin gona`, `Yanki`, `Girman gona (hekta)`, `Amfanin
  gona da ake so (tan/ha)`, `Nau'in kasa`, and `Amfanin gona da ya gabata`.
- Optional soil-test controls include `pH na kasa`, `Sinadarin halitta (%)`,
  `N da ke samuwa`, `Olsen P`, and `K da ke samuwa`.
- Action: `Kiyasta taki`.

Expected behavior:

- Result should show N, P2O5, K2O, bags, cost, and application schedule.
- NPK, Urea, kg, ha, and ppm are accepted technical terms.

### Irrigation

Route: `/ha/noma/ban-ruwa-najeriya/`

Expected labels:

- Heading: `Kiyasta ruwan da gonarka ke bukata.`
- Controls: `Amfanin gona`, `Yanki`, `Girman gona (hekta)`, `Matakin girma`,
  `Wata`, `Hanyar ban ruwa`.
- Action: `Kiyasta bukatar ruwa`.

Expected behavior:

- Result should show estimated water need, schedule, loss or efficiency notes,
  and cost where present.
- It should stay advisory and not promise exact water availability.

### Seed Rate

Route: `/ha/noma/yawan-iri-najeriya/`

Expected labels:

- Heading: `Kiyasta yawan iri kafin shuka.`
- Controls: `Amfanin gona`, `Hanyar shuka`, `Ingancin iri`, `Yanayin fili`,
  `Girman gona (hekta)`, `Tsarin shuka`, `Tazarar layi (cm)`, and `Tazarar
  shuka (cm)`.
- Action: `Kiyasta yawan iri`.

Expected behavior:

- Result should estimate seed quantity, spacing assumptions, and cost where
  available.
- Agronomy wording should stay advisory, not a guarantee of yield.

Agriculture go/no-go:

- Go if calculations update, labels remain Hausa-first, and data/source caveats
  stay advisory.
- No-go if formulas break, crop/fertilizer data disappears, or the page implies
  official agronomy advice.

## Language And Hausa Translator Flow

Route: `/ha/kayan-aiki/mai-fassara-hausa/`

Expected labels:

- Heading: `Mai fassara Hausa`.
- Search label: `Rubuta abin da kake nema`.
- Fallback link: `shafin Turanci`.

Click path:

1. Open `/ha/kayan-aiki/mai-fassara-hausa/`.
2. Search for a common phrase if the search box is present.
3. Try a phrase card or result action.
4. Open the English fallback link only after confirming it is clearly labeled.

Expected behavior:

- Hausa phrase results should appear or the page should tell the reviewer no
  match was found.
- Official, legal, certified, or medical translation copy should remain safe:
  AfroTools helps with understanding and drafting, but professional review may
  still be required.

Go/no-go:

- Go if the Hausa-first phrase flow is understandable and fallback is honest.
- No-go if it claims certified translation, legal approval, or medical review.

## Shared Navbar, Footer, And Search Checks

Open at least these pages:

- `/ha/`
- `/ha/kayan-aiki/`
- `/ha/najeriya/`
- `/ha/jamb/`
- `/ha/takardu-da-pdf/`
- `/ha/sadarwa/`
- `/ha/noma/`

Navbar checks:

- Main Hausa navigation should point to real Hausa hubs such as `/ha/`,
  `/ha/kayan-aiki/`, `/ha/najeriya/`, `/ha/jamb/`, `/ha/takardu-da-pdf/`,
  `/ha/sadarwa/`, `/ha/noma/`, and `/ha/lafiya/`.
- Tool discovery labels should be Hausa-first.
- Any English-only destination should include `shafi na Turanci` or equivalent.
- No link should point to stale routes such as `/ha/all-tools/`,
  `/ha/nigeria/`, `/ha/countries/`, or `/ha/language/`.

Footer checks:

- Hausa footer country/legal/company links should either go to real Hausa pages
  or disclose English fallback.
- Footer should not store an English route as a Hausa tool row.
- Social, API, widget, privacy, terms, and contact fallbacks may be English if
  labeled in Hausa.

Search checks:

- Search for these terms: `PAYE`, `VAT`, `JAMB`, `PDF`, `USSD`, `taki`,
  `fassara`, `CAC`, `canjin kudi`.
- Hausa registry results should point to `/ha/` routes when a Hausa route
  exists.
- English fallback search results should not appear as `lang: ha` registry
  rows.

Shared go/no-go:

- Go if discovery routes are valid, labels are consistent, and fallback is
  explicit.
- No-go if search or navigation sends Hausa users to an English page while
  labeling it as Hausa.

## Known Carried Debt That Is Not A Hausa Blocker

These are acceptable during internal preview, but should stay visible in gate
reports:

- `POSSIBLE_FALSE_POSITIVE` visible-copy findings caused by accepted brands,
  product names, acronyms, and honest fallback wording.
- Accepted technical terms such as PDF, VAT, PAYE, JAMB, WAEC, NECO, NYSC,
  USSD, API, JSON, CSV, BVN, NIN, FIRS, HTML, and ZIP.
- English fallback surfaces that are deliberately labeled in Hausa, especially
  JAMB archives, PDF full-workflow tools, Paystack/payment helpers, legal
  pages, country pages outside Nigeria, and advanced document tools.
- Non-Hausa/global SEO or hreflang warnings from previous gates should be
  separated from Hausa blockers unless a Hausa route caused them.
- Older shared mobile-audit debt should not block Hausa preview unless the
  current Hausa pages introduce a new layout or tap-target issue.

## Exact Commands Before Promotion

Run this stack before moving from internal preview to public promotion:

```bash
node scripts/audit-hausa-visible-copy.js
npm run build:i18n:validate
npm run validate:hreflang
npm run audit
npm run seo:report
npm run pdf:verify
npm run vat-business-tax:verify
npm run salary-tax:verify
npm run check-links
git diff --check
```

Promotion go/no-go:

- Go if Hausa visible-copy blockers remain 0, registry missing targets remain
  0, link checks pass, and any non-Hausa/global debt is clearly separated.
- No-go if any Hausa route has visible English blockers, missing links,
  misleading fallback labels, broken high-value flow behavior, or weakened
  tax/PDF/medical/source disclaimers.

## Manual Browser Review Gaps

These require a human click pass because static scripts cannot fully prove the
experience:

- File upload/download behavior for PDF merge, split, compress, convert, and
  English PDF Sign.
- CBT and tutor behavior after leaving the Hausa shell for English routes.
- Mobile menu, search, footer, and card wrapping on narrow screens.
- Telecom data freshness and operator confirmation wording.
- Agriculture result sanity across multiple crops, regions, and farm sizes.
- PAYE and VAT result sanity against expected source-truth examples.
