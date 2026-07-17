# Swahili Search Ranking Final Tuning

Date: 2026-05-16

Prompt: 117 - Swahili Search Ranking Final Tuning

## Scope

Edited only:

- `assets/js/components/navbar.js`
- `assets/js/components/navbar.min.js`
- `sw/zana-zote/index.html`

No page body copy, registry rows, French, Hausa, cars, or generated `dist/` files were changed.

## Evidence

The source simulation used `assets/js/components/tool-registry.js`, the Swahili navbar search intent/direct-result maps, and the `/sw/zana-zote/` search mirror.

Weak ordering found before tuning:

- `mshahara`: returned specific salary tools before the salary/PAYE hub.
- `kazi`: returned document/work surfaces before the broader career hub.
- `ujenzi`: returned construction tools before `/sw/ujenzi-na-uhandisi/`.
- `internet`: omitted `/sw/mawasiliano-na-mtandao/` from navbar search results.
- `tafsiri`: returned medical/PDF translation tools before `/sw/lugha-na-tafsiri/`.
- `mkopo`: returned loan tools before `/sw/mali-na-mikopo/`.
- `API`: top results were good, but the developer hub was missing before unrelated OAPI/carousel matches.

Stable buckets that did not need tuning: `PAYE`, `VAT`, `PDF`, `CV`, `TIN`, `zakat`, `forodha`, `bima`, `afya`, `biashara`, `kilimo`, and `serikali`.

## Before And After Top Results

| Query | Before top results | After top results |
| --- | --- | --- |
| PAYE | `/sw/mshahara-na-kodi/`, `/sw/mshahara-na-kodi/paye/`, `/sw/kenya/kikokotoo-kodi-mshahara` | unchanged |
| VAT | `/sw/vat-na-kodi/`, `/sw/zana/kikokotoo-vat/`, `/sw/biashara-na-uzingatiaji/` | unchanged |
| PDF | `/sw/hati-na-pdf/`, `/sw/zana-za-pdf/`, `/sw/zana/kituo-cha-pdf/` | unchanged |
| mshahara | `/sw/zana/mshahara-wa-mfanyakazi-wa-nyumbani/`, `/sw/zana/mshahara-wa-mwalimu/`, `/sw/kenya/kikokotoo-kodi-mshahara` | `/sw/mshahara-na-kodi/`, `/sw/mshahara-na-kodi/paye/`, `/sw/zana/kikokotoo-kima-cha-chini-cha-mshahara/` |
| kazi | `/sw/kazi-na-nyaraka/`, `/sw/mshahara-na-kodi/`, `/sw/zana/mshahara-wa-mfanyakazi-wa-nyumbani/` | `/sw/kazi-na-ajira/`, `/sw/kazi-na-nyaraka/`, `/sw/mshahara-na-kodi/` |
| CV | `/sw/zana/mjenzi-cv/`, `/sw/kazi-na-nyaraka/`, `/sw/hati-na-pdf/` | unchanged |
| TIN | `/sw/zana/mwongozo-tin/`, `/sw/biashara-na-uzingatiaji/`, `/sw/vat-na-kodi/` | unchanged |
| zakat | `/sw/zana/kikokotoo-zakat/` | unchanged |
| forodha | `/sw/biashara-ya-nje/`, `/sw/zana/ushuru-forodha/`, `/sw/zana/muda-wa-kupitisha-forodha/` | unchanged |
| ujenzi | `/sw/zana/gharama-vifaa-vya-ujenzi/`, `/sw/zana/orodha-vifaa/`, `/sw/zana/kibali-cha-ujenzi/` | `/sw/ujenzi-na-uhandisi/`, `/sw/zana/kikokotoo-gharama-za-ujenzi/`, `/sw/zana/mjenzi-boq/` |
| internet | `/sw/zana/kilinganisha-intaneti/`, `/sw/zana/kikokotoo-intaneti-ya-biashara/` | `/sw/mawasiliano-na-mtandao/`, `/sw/zana/kilinganisha-intaneti/`, `/sw/zana/kikokotoo-intaneti-ya-biashara/` |
| tafsiri | `/sw/zana/tafsiri-ripoti-daktari/`, `/sw/zana/tafsiri-ya-ripoti-ya-matibabu/`, `/sw/zana/kutafsiri-pdf/` | `/sw/lugha-na-tafsiri/`, `/sw/zana/mtafsiri-wa-kiswahili/`, `/sw/zana/kutafsiri-pdf/` |
| blogu | `/sw/blogu/` | unchanged |
| API | `/sw/api/`, `/sw/zana/saraka-ya-api-afrika/`, `/sw/zana/kituo-cha-developer/` | `/sw/api/`, `/sw/zana/saraka-ya-api-afrika/`, `/sw/zana/kituo-cha-developer/`, `/sw/zana-za-developer/` |
| bima | `/sw/bima/`, `/sw/afya-na-bima/`, `/sw/zana/kikokotoo-bima-ya-biashara/` | unchanged |
| afya | `/sw/afya/`, `/sw/afya-na-bima/`, `/sw/zana/kilinganisha-bima-ya-afya/` | unchanged |
| mkopo | `/sw/zana/kikokotoo-mkopo-wa-nyumba/`, `/sw/zana/masharti-ya-mkopo-wa-biashara/`, `/sw/zana/ustahiki-wa-mkopo-wa-shamba/` | `/sw/mali-na-mikopo/`, `/sw/zana/kikokotoo-mkopo-wa-nyumba/`, `/sw/zana/mkopo-wa-gari/` |
| sarafu | `/sw/mshahara-na-kodi/fx/`, `/sw/sarafu/`, `/sw/mshahara-na-kodi/crypto/` | `/sw/sarafu/`, `/sw/mshahara-na-kodi/fx/`, `/sw/zana/kibadilishaji-sarafu/` |
| biashara | `/sw/biashara-na-faida/`, `/sw/biashara-na-uzingatiaji/`, `/sw/biashara-ndogo/` | unchanged |
| kilimo | `/sw/kilimo/`, `/sw/kilimo/mavuno/burundi/`, `/sw/kilimo/mavuno/kenya/` | unchanged |
| serikali | `/sw/serikali-na-nyaraka/`, `/sw/zana/kikokotoo-mfuko-wa-nyumba/`, `/sw/zana/tamko-la-kisheria/` | unchanged |

## Changes

- Added Swahili intent targets for `mshahara`, `kazi`, `ujenzi`, `tafsiri`, `mkopo`, and `sarafu` in shared navbar search and `/sw/zana-zote/`.
- Added direct Swahili search results for `mshahara`, `kazi`, `internet`, `tafsiri`, `ujenzi`, `mkopo`, and an extra developer hub result for `API`.
- Synced `assets/js/components/navbar.min.js` from `navbar.js` with a targeted Terser run.

## Validation

- `npm run audit`: passed, 2394 registry rows, 0 missing live/new pages.
- `npm run check-links`: passed, 8494 HTML files, 80958 internal links, 0 broken.
- `npm run build:i18n:validate`: passed for `fr`, `sw`, `yo`, and `ha`.
- `npm run validate:hreflang`: passed with 2 carried warnings:
  - `fr/tools/generateur-nom-entreprise/index.html -> tools/business-name-gen/index.html`
  - `sw/blogu/index.html -> fr/blog/index.html`

## Verdict

Prompt 117 is complete. Swahili search now prioritizes the intended hub or bridge surface for the widened query set without adding registry rows.
