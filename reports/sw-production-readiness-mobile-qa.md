# Swahili Production Readiness Mobile QA - 2026-05-16

Local server: http://127.0.0.1:4177

## Verdict

PASS: desktop and mobile route checks, Swahili shell labels, and search buckets passed with no blocking regression.

## Fixes Made During Prompt 99

- Localized the shared Swahili country selector placeholder and aria label that still showed English in browser QA.
- Added Swahili direct search results for blogu and API bridge queries.
- Added Swahili intent boosts for PDF, CV, TIN, bima, zakat, internet, API and related bridge queries in navbar search and /sw/zana-zote/ query search.
- Stopped /sw/zana-zote/ from showing English fallback routes underneath Swahili manual bridge results.

## Route Checks

| Viewport | Route | HTTP | Canonical | Meta | Page horizontal overflow | Overflow notes | Shell leakage |
|---|---:|---:|---:|---:|---:|---:|---|
| desktop | /sw/ | 200 | yes | yes | no | 3 | none |
| desktop | /sw/zana-zote/ | 200 | yes | yes | no | 1 | none |
| desktop | /sw/tools/ | 200 | yes | yes | no | 1 | none |
| desktop | /sw/mshahara-na-kodi/ | 200 | yes | yes | no | 1 | none |
| desktop | /sw/nchi/ | 200 | yes | yes | no | 8 | none |
| desktop | /sw/kilimo/ | 200 | yes | yes | no | 0 | none |
| desktop | /sw/biashara-ya-nje/ | 200 | yes | yes | no | 0 | none |
| desktop | /sw/ujenzi-na-uhandisi/ | 200 | yes | yes | no | 0 | none |
| desktop | /sw/kazi-na-ajira/ | 200 | yes | yes | no | 0 | none |
| desktop | /sw/serikali-na-nyaraka/ | 200 | yes | yes | no | 1 | none |
| desktop | /sw/lugha-na-tafsiri/ | 200 | yes | yes | no | 0 | none |
| desktop | /sw/blogu/ | 200 | yes | yes | no | 1 | none |
| desktop | /sw/api/ | 200 | yes | yes | no | 0 | none |
| desktop | /sw/zana-za-developer/ | 200 | yes | yes | no | 1 | none |
| mobile | /sw/ | 200 | yes | yes | no | 0 | none |
| mobile | /sw/zana-zote/ | 200 | yes | yes | no | 0 | none |
| mobile | /sw/tools/ | 200 | yes | yes | no | 0 | none |
| mobile | /sw/mshahara-na-kodi/ | 200 | yes | yes | no | 1 | none |
| mobile | /sw/nchi/ | 200 | yes | yes | no | 0 | none |
| mobile | /sw/kilimo/ | 200 | yes | yes | no | 0 | none |
| mobile | /sw/biashara-ya-nje/ | 200 | yes | yes | no | 0 | none |
| mobile | /sw/ujenzi-na-uhandisi/ | 200 | yes | yes | no | 0 | none |
| mobile | /sw/kazi-na-ajira/ | 200 | yes | yes | no | 0 | none |
| mobile | /sw/serikali-na-nyaraka/ | 200 | yes | yes | no | 0 | none |
| mobile | /sw/lugha-na-tafsiri/ | 200 | yes | yes | no | 0 | none |
| mobile | /sw/blogu/ | 200 | yes | yes | no | 1 | none |
| mobile | /sw/api/ | 200 | yes | yes | no | 2 | none |
| mobile | /sw/zana-za-developer/ | 200 | yes | yes | no | 0 | none |

## Navbar Search Buckets

| Query | Result count | Top hrefs | Duplicate top hrefs | English-only top hrefs |
|---|---:|---|---:|---|
| PAYE | 8 | /sw/mshahara-na-kodi/, /sw/mshahara-na-kodi/paye/, /sw/kenya/kikokotoo-kodi-mshahara, /sw/tanzania/kikokotoo-kodi-mshahara, /sw/uganda/kikokotoo-kodi-mshahara | 0 | none |
| VAT | 8 | /sw/vat-na-kodi/, /sw/zana/kikokotoo-vat/, /sw/biashara-na-uzingatiaji/, /sw/kenya/kikokotoo-vat/, /sw/tanzania/kikokotoo-vat/ | 0 | none |
| PDF | 8 | /sw/hati-na-pdf/, /sw/zana-za-pdf/, /sw/zana/kituo-cha-pdf/, /sw/zana/hariri-pdf/, /sw/zana/chat-na-pdf/ | 0 | none |
| mshahara | 8 | /sw/zana/mshahara-wa-mfanyakazi-wa-nyumbani/, /sw/zana/mshahara-wa-mwalimu/, /sw/kenya/kikokotoo-kodi-mshahara, /sw/tanzania/kikokotoo-kodi-mshahara, /sw/algeria/kikokotoo-kodi-mshahara/ | 0 | none |
| kazi | 8 | /sw/kazi-na-nyaraka/, /sw/mshahara-na-kodi/, /sw/zana/mshahara-wa-mfanyakazi-wa-nyumbani/, /sw/zana/barua-ombi/, /sw/zana/nafasi-pdf/ | 0 | none |
| CV | 4 | /sw/zana/mjenzi-cv/, /sw/kazi-na-nyaraka/, /sw/hati-na-pdf/, /sw/cape-verde/kikokotoo-vat/ | 0 | none |
| TIN | 8 | /sw/zana/mwongozo-tin/, /sw/biashara-na-uzingatiaji/, /sw/vat-na-kodi/, /sw/eswatini/kikokotoo-kodi-mshahara/, /sw/eswatini/kikokotoo-vat/ | 0 | none |
| zakat | 1 | /sw/zana/kikokotoo-zakat/ | 0 | none |
| forodha | 8 | /sw/biashara-ya-nje/, /sw/zana/ushuru-forodha/, /sw/zana/muda-wa-kupitisha-forodha/, /sw/zana/ushuru-kuagiza-gari/, /sw/zana/cheti-asili/ | 0 | none |
| ujenzi | 8 | /sw/zana/gharama-vifaa-vya-ujenzi/, /sw/zana/orodha-vifaa/, /sw/zana/kibali-cha-ujenzi/, /sw/zana/kikokotoo-miundo-ya-ujenzi/, /sw/zana/kikokotoo-gharama-za-ujenzi/ | 0 | none |
| internet | 2 | /sw/zana/kilinganisha-intaneti/, /sw/zana/kikokotoo-intaneti-ya-biashara/ | 0 | none |
| tafsiri | 8 | /sw/zana/tafsiri-ripoti-daktari/, /sw/zana/tafsiri-ya-ripoti-ya-matibabu/, /sw/zana/kutafsiri-pdf/, /sw/zana/mtafsiri-wa-kiamhari/, /sw/zana/mtafsiri-wa-kifaransa-afrika/ | 0 | none |
| blogu | 1 | /sw/blogu/ | 0 | none |
| API | 8 | /sw/api/, /sw/zana/saraka-ya-api-afrika/, /sw/zana/kituo-cha-developer/, /sw/zana/usajili-wa-alama-ya-biashara/, /sw/zana/carousel-ya-mitandao/ | 0 | none |
| bima | 8 | /sw/bima/, /sw/afya-na-bima/, /sw/zana/kikokotoo-bima-ya-biashara/, /sw/zana/kilinganisha-bima-ya-afya/, /sw/zana/kikokotoo-bima-ya-gari/ | 0 | none |

## /sw/zana-zote/ Query Buckets

| Query | Result count | Top hrefs | Duplicate top hrefs | English-only top hrefs |
|---|---:|---|---:|---|
| PAYE | 12 | /sw/mshahara-na-kodi/paye/, /sw/mshahara-na-kodi/, /sw/kenya/kikokotoo-kodi-mshahara, /sw/tanzania/kikokotoo-kodi-mshahara, /sw/uganda/kikokotoo-kodi-mshahara | 0 | none |
| VAT | 12 | /sw/zana/kikokotoo-vat/, /sw/vat-na-kodi/, /sw/biashara-na-uzingatiaji/, /sw/kenya/kikokotoo-vat/, /sw/tanzania/kikokotoo-vat/ | 0 | none |
| PDF | 12 | /sw/hati-na-pdf/, /sw/zana-za-pdf/, /sw/zana/kituo-cha-pdf/, /sw/zana/hariri-pdf/, /sw/zana/chat-na-pdf/ | 0 | none |
| mshahara | 12 | /sw/zana/kikokotoo-kima-cha-chini-cha-mshahara/, /sw/kenya/kikokotoo-kodi-mshahara, /sw/tanzania/kikokotoo-kodi-mshahara, /sw/algeria/kikokotoo-kodi-mshahara/, /sw/angola/kikokotoo-kodi-mshahara/ | 0 | none |
| kazi | 12 | /sw/mshahara-na-kodi/, /sw/zana/barua-ombi/, /sw/zana/nafasi-pdf/, /sw/zana/workflow-ya-pdf/, /sw/kazi-na-nyaraka/ | 0 | none |
| CV | 6 | /sw/zana/mjenzi-cv/, /sw/kazi-na-nyaraka/, /sw/hati-na-pdf/, /sw/cape-verde/kikokotoo-kodi-mshahara/, /sw/cape-verde/kikokotoo-vat/ | 0 | none |
| TIN | 12 | /sw/zana/mwongozo-tin/, /sw/biashara-na-uzingatiaji/, /sw/vat-na-kodi/, /sw/zana/mwongozo-tin/algeria/, /sw/zana/mwongozo-tin/angola/ | 0 | none |
| zakat | 1 | /sw/zana/kikokotoo-zakat/ | 0 | none |
| forodha | 8 | /sw/biashara-ya-nje/, /sw/zana/ushuru-forodha/, /sw/zana/muda-wa-kupitisha-forodha/, /sw/zana/ushuru-kuagiza-gari/, /sw/zana/cheti-asili/ | 0 | none |
| ujenzi | 8 | /sw/zana/gharama-vifaa-vya-ujenzi/, /sw/zana/orodha-vifaa/, /sw/zana/kibali-cha-ujenzi/, /sw/zana/kikokotoo-miundo-ya-ujenzi/, /sw/zana/kikokotoo-gharama-za-ujenzi/ | 0 | none |
| internet | 2 | /sw/zana/kilinganisha-intaneti/, /sw/mawasiliano-na-mtandao/ | 0 | none |
| tafsiri | 11 | /sw/zana/kutafsiri-pdf/, /sw/zana/tafsiri-ripoti-daktari/, /sw/zana/tafsiri-ya-ripoti-ya-matibabu/, /sw/zana/mtafsiri-wa-kiamhari/, /sw/zana/mtafsiri-wa-kifaransa-afrika/ | 0 | none |
| blogu | 1 | /sw/blogu/ | 0 | none |
| API | 12 | /sw/api/, /sw/zana/saraka-ya-api-afrika/, /sw/zana/usajili-wa-alama-ya-biashara/, /sw/zana/carousel-ya-mitandao/, /sw/zana/kizalishaji-ankara/ | 0 | none |
| bima | 12 | /sw/bima/, /sw/afya-na-bima/, /sw/zana/kilinganisha-bima-ya-afya/, /sw/zana/kikokotoo-bima-ya-gari/, /sw/zana/kikokotoo-bima-ya-biashara/ | 0 | none |

## Notes

- Screenshots were not saved because route and layout evidence is recorded in JSON and no visual blocker remained after the search-shell fixes.
- Overflow notes list elements with internal scrollWidth greater than clientWidth; none created page-level horizontal scrolling.
- English-only bridge routes are intentionally retained for /sw/blogu/ and /sw/api/ surfaces, but search now lands on Swahili bridge pages before users enter English content.
- Page errors captured by Playwright: 0.
