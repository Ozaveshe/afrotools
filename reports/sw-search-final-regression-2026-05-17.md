# Swahili Search Final Regression QA - 2026-05-17

## Summary

- Viewports: desktop, mobile
- Query buckets: 25
- Surfaces: /sw/ hero; /sw/zana-zote/; /sw/tools/ desktop command palette; /sw/tools/ mobile drawer
- Issue rows after fix: 10
- Zero-result rows after fix: 2
- English-only rows after fix: 8
- Duplicate href rows after fix: 0
- Verdict: search works with carried hero-search weak rows

## Fixes Made

- Added Swahili toolsSw entries in assets/js/components/navbar.js for command-palette categories that were falling back to English-only results.
- Removed duplicate all-link entries from those Swahili command-palette buckets, added TIN country bridge entries, and synced assets/js/components/navbar.min.js with terser.

## Query Evidence

### PAYE

- /sw/zana-zote/ desktop: 8 results; top hrefs: /sw/mshahara-na-kodi/paye/, /sw/mshahara-na-kodi/, /sw/kenya/kikokotoo-kodi-mshahara
- Navbar desktop command palette: 4 results; top hrefs: /sw/kenya/kikokotoo-kodi-mshahara/, /sw/tanzania/kikokotoo-kodi-mshahara/, /sw/uganda/kikokotoo-kodi-mshahara/
- Navbar mobile drawer: 8 results; top hrefs: /sw/mshahara-na-kodi/, /sw/mshahara-na-kodi/paye/, /sw/kenya/kikokotoo-kodi-mshahara

### VAT

- /sw/zana-zote/ desktop: 8 results; top hrefs: /sw/zana/kikokotoo-vat/, /sw/vat-na-kodi/, /sw/biashara-na-uzingatiaji/
- Navbar desktop command palette: 8 results; top hrefs: /sw/zana/kikokotoo-vat/, /sw/zana/mwongozo-tin/, /sw/zana/mwongozo-tin/kenya/
- Navbar mobile drawer: 8 results; top hrefs: /sw/vat-na-kodi/, /sw/zana/kikokotoo-vat/, /sw/biashara-na-uzingatiaji/

### PDF

- /sw/zana-zote/ desktop: 8 results; top hrefs: /sw/hati-na-pdf/, /sw/zana-za-pdf/, /sw/zana/kituo-cha-pdf/
- Navbar desktop command palette: 8 results; top hrefs: /sw/zana/kituo-cha-pdf/, /sw/zana/hariri-pdf/, /sw/zana/unganisha-na-gawanya-pdf/
- Navbar mobile drawer: 8 results; top hrefs: /sw/hati-na-pdf/, /sw/zana-za-pdf/, /sw/zana/kituo-cha-pdf/

### mshahara

- /sw/zana-zote/ desktop: 8 results; top hrefs: /sw/mshahara-na-kodi/, /sw/mshahara-na-kodi/paye/, /sw/zana/kikokotoo-kima-cha-chini-cha-mshahara/
- Navbar desktop command palette: 8 results; top hrefs: /sw/kenya/kikokotoo-kodi-mshahara/, /sw/tanzania/kikokotoo-kodi-mshahara/, /sw/uganda/kikokotoo-kodi-mshahara/
- Navbar mobile drawer: 8 results; top hrefs: /sw/mshahara-na-kodi/, /sw/mshahara-na-kodi/paye/, /sw/zana/kikokotoo-kima-cha-chini-cha-mshahara/

### kazi

- /sw/zana-zote/ desktop: 8 results; top hrefs: /sw/kazi-na-ajira/, /sw/kazi-na-nyaraka/, /sw/mshahara-na-kodi/
- Navbar desktop command palette: 5 results; top hrefs: /sw/kazi-na-ajira/, /sw/kazi-na-nyaraka/, /sw/zana/maandalizi-ya-mahojiano/
- Navbar mobile drawer: 8 results; top hrefs: /sw/kazi-na-ajira/, /sw/kazi-na-nyaraka/, /sw/mshahara-na-kodi/

### CV

- /sw/zana-zote/ desktop: 6 results; top hrefs: /sw/zana/mjenzi-cv/, /sw/kazi-na-nyaraka/, /sw/hati-na-pdf/
- Navbar desktop command palette: 1 results; top hrefs: /sw/zana/mjenzi-cv/
- Navbar mobile drawer: 4 results; top hrefs: /sw/zana/mjenzi-cv/, /sw/kazi-na-nyaraka/, /sw/hati-na-pdf/

### TIN

- /sw/zana-zote/ desktop: 8 results; top hrefs: /sw/zana/mwongozo-tin/, /sw/biashara-na-uzingatiaji/, /sw/vat-na-kodi/
- Navbar desktop command palette: 8 results; top hrefs: /sw/zana/mwongozo-tin/, /sw/zana/mwongozo-tin/kenya/, /sw/zana/mwongozo-tin/nigeria/
- Navbar mobile drawer: 8 results; top hrefs: /sw/zana/mwongozo-tin/, /sw/biashara-na-uzingatiaji/, /sw/vat-na-kodi/

### zakat

- /sw/zana-zote/ desktop: 1 results; top hrefs: /sw/zana/kikokotoo-zakat/
- Navbar desktop command palette: 1 results; top hrefs: /sw/zana/kikokotoo-zakat/
- Navbar mobile drawer: 1 results; top hrefs: /sw/zana/kikokotoo-zakat/

### forodha

- /sw/zana-zote/ desktop: 8 results; top hrefs: /sw/biashara-ya-nje/, /sw/zana/ushuru-forodha/, /sw/zana/muda-wa-kupitisha-forodha/
- Navbar desktop command palette: 1 results; top hrefs: /sw/zana/ushuru-forodha/
- Navbar mobile drawer: 8 results; top hrefs: /sw/biashara-ya-nje/, /sw/zana/ushuru-forodha/, /sw/zana/muda-wa-kupitisha-forodha/

### ujenzi

- /sw/zana-zote/ desktop: 8 results; top hrefs: /sw/ujenzi-na-uhandisi/, /sw/zana/kikokotoo-gharama-za-ujenzi/, /sw/zana/gharama-vifaa-vya-ujenzi/
- Navbar desktop command palette: 7 results; top hrefs: /sw/ujenzi-na-uhandisi/, /sw/zana/kikokotoo-gharama-za-ujenzi/, /sw/zana/mjenzi-boq/
- Navbar mobile drawer: 8 results; top hrefs: /sw/ujenzi-na-uhandisi/, /sw/zana/kikokotoo-gharama-za-ujenzi/, /sw/zana/mjenzi-boq/

### internet

- /sw/zana-zote/ desktop: 2 results; top hrefs: /sw/zana/kilinganisha-intaneti/, /sw/mawasiliano-na-mtandao/
- Navbar desktop command palette: 1 results; top hrefs: /sw/zana/kilinganisha-intaneti/
- Navbar mobile drawer: 3 results; top hrefs: /sw/mawasiliano-na-mtandao/, /sw/zana/kilinganisha-intaneti/, /sw/zana/kikokotoo-intaneti-ya-biashara/

### tafsiri

- /sw/zana-zote/ desktop: 8 results; top hrefs: /sw/lugha-na-tafsiri/, /sw/zana/mtafsiri-wa-kiswahili/, /sw/zana/kutafsiri-pdf/
- Navbar desktop command palette: 5 results; top hrefs: /sw/lugha-na-tafsiri/, /sw/zana/transliteration-ya-maandishi/, /sw/zana/mtafsiri-wa-kiswahili/
- Navbar mobile drawer: 8 results; top hrefs: /sw/lugha-na-tafsiri/, /sw/zana/mtafsiri-wa-kiswahili/, /sw/zana/kutafsiri-pdf/

### blogu

- /sw/zana-zote/ desktop: 1 results; top hrefs: /sw/blogu/
- Navbar desktop command palette: 1 results; top hrefs: /sw/blogu/
- Navbar mobile drawer: 1 results; top hrefs: /sw/blogu/

### API

- /sw/zana-zote/ desktop: 8 results; top hrefs: /sw/api/, /sw/zana/saraka-ya-api-afrika/, /sw/zana-za-developer/
- Navbar desktop command palette: 3 results; top hrefs: /sw/api/, /sw/zana/kijaribu-api/, /sw/zana/saraka-ya-api-afrika/
- Navbar mobile drawer: 8 results; top hrefs: /sw/api/, /sw/zana/saraka-ya-api-afrika/, /sw/zana/kituo-cha-developer/

### bima

- /sw/zana-zote/ desktop: 8 results; top hrefs: /sw/bima/, /sw/afya-na-bima/, /sw/zana/kilinganisha-bima-ya-afya/
- Navbar desktop command palette: 5 results; top hrefs: /sw/bima/, /sw/afya-na-bima/, /sw/zana/kilinganisha-bima-ya-afya/
- Navbar mobile drawer: 8 results; top hrefs: /sw/bima/, /sw/afya-na-bima/, /sw/zana/kikokotoo-bima-ya-biashara/

### afya

- /sw/zana-zote/ desktop: 8 results; top hrefs: /sw/afya/, /sw/afya-na-bima/, /sw/zana/kilinganisha-bima-ya-afya/
- Navbar desktop command palette: 7 results; top hrefs: /sw/afya/, /sw/zana/kikokotoo-bmi/, /sw/zana/shinikizo-la-damu/
- Navbar mobile drawer: 8 results; top hrefs: /sw/afya/, /sw/afya-na-bima/, /sw/zana/kilinganisha-bima-ya-afya/

### mkopo

- /sw/zana-zote/ desktop: 8 results; top hrefs: /sw/mali-na-mikopo/, /sw/zana/kikokotoo-mkopo-wa-nyumba/, /sw/zana/mkopo-wa-gari/
- Navbar desktop command palette: 2 results; top hrefs: /sw/zana/kikokotoo-mkopo-wa-nyumba/, /sw/zana/mkopo-wa-gari/
- Navbar mobile drawer: 8 results; top hrefs: /sw/mali-na-mikopo/, /sw/zana/kikokotoo-mkopo-wa-nyumba/, /sw/zana/mkopo-wa-gari/

### sarafu

- /sw/zana-zote/ desktop: 8 results; top hrefs: /sw/sarafu/, /sw/mshahara-na-kodi/fx/, /sw/zana/kibadilishaji-sarafu/
- Navbar desktop command palette: 2 results; top hrefs: /sw/sarafu/, /sw/zana/kibadilishaji-sarafu/
- Navbar mobile drawer: 8 results; top hrefs: /sw/sarafu/, /sw/mshahara-na-kodi/fx/, /sw/zana/kibadilishaji-sarafu/

### biashara

- /sw/zana-zote/ desktop: 8 results; top hrefs: /sw/mshahara-na-kodi/business-tax/, /sw/biashara-na-faida/, /sw/biashara-na-uzingatiaji/
- Navbar desktop command palette: 8 results; top hrefs: /sw/zana/kikokotoo-bima-ya-biashara/, /sw/zana/usajili-biashara/, /sw/biashara-na-uzingatiaji/
- Navbar mobile drawer: 8 results; top hrefs: /sw/biashara-na-faida/, /sw/biashara-na-uzingatiaji/, /sw/biashara-ndogo/

### kilimo

- /sw/zana-zote/ desktop: 8 results; top hrefs: /sw/kilimo/, /sw/zana/gharama-za-greenhouse/, /sw/zana/kikokotoo-chakula-cha-mifugo/
- Navbar desktop command palette: 7 results; top hrefs: /sw/kilimo/, /sw/zana/makisio-ya-mavuno/, /sw/zana/kikokotoo-mbolea/
- Navbar mobile drawer: 8 results; top hrefs: /sw/kilimo/, /sw/kilimo/mavuno/burundi/, /sw/kilimo/mavuno/kenya/

### serikali

- /sw/zana-zote/ desktop: 8 results; top hrefs: /sw/serikali-na-nyaraka/, /sw/zana/kikokotoo-mfuko-wa-nyumba/, /sw/zana/ukaguzi-wa-visa/
- Navbar desktop command palette: 4 results; top hrefs: /sw/serikali-na-nyaraka/, /sw/zana/usajili-biashara/, /sw/zana/ada-usajili-wa-ardhi/
- Navbar mobile drawer: 3 results; top hrefs: /sw/serikali-na-nyaraka/, /sw/zana/kikokotoo-mfuko-wa-nyumba/, /sw/zana/tamko-la-kisheria/

### developer

- /sw/zana-zote/ desktop: 8 results; top hrefs: /sw/zana/kulinganisha-hosting/, /sw/zana/kijaribu-api/, /sw/zana/kizalishaji-docker-compose/
- Navbar desktop command palette: 2 results; top hrefs: /sw/zana-za-developer/, /sw/zana/kituo-cha-developer/
- Navbar mobile drawer: 8 results; top hrefs: /sw/zana/kulinganisha-hosting/, /sw/zana/kijaribu-api/, /sw/zana/kizalishaji-docker-compose/

### Hajj

- /sw/zana-zote/ desktop: 1 results; top hrefs: /sw/zana/bajeti-ya-hajj-na-umrah/
- Navbar desktop command palette: 1 results; top hrefs: /sw/zana/bajeti-ya-hajj-na-umrah/
- Navbar mobile drawer: 1 results; top hrefs: /sw/zana/bajeti-ya-hajj-na-umrah/

### harusi

- /sw/zana-zote/ desktop: 2 results; top hrefs: /sw/zana/bajeti-ya-harusi/, /sw/zana/hesabu-siku-za-tukio/
- Navbar desktop command palette: 1 results; top hrefs: /sw/zana/bajeti-ya-harusi/
- Navbar mobile drawer: 2 results; top hrefs: /sw/zana/bajeti-ya-harusi/, /sw/zana/hesabu-siku-za-tukio/

### nondo

- /sw/zana-zote/ desktop: 1 results; top hrefs: /sw/zana/kikokotoo-nondo/
- Navbar desktop command palette: 1 results; top hrefs: /sw/zana/kikokotoo-nondo/
- Navbar mobile drawer: 1 results; top hrefs: /sw/zana/kikokotoo-nondo/

## Carried Weak Rows

- desktop /sw/ hero query "CV": count 7, has Swahili result true, duplicate hrefs none, English-only results /tools/cv-builder/
- desktop /sw/ hero query "zakat": count 1, has Swahili result false, duplicate hrefs none, English-only results /tools/zakat-calculator/
- desktop /sw/ hero query "internet": count 4, has Swahili result false, duplicate hrefs none, English-only results /telecom/internet-compare/, /telecom/business-internet/, /telecom/starlink-compare/, /telecom/fiber-lte-5g/
- desktop /sw/ hero query "blogu": count 0, has Swahili result false, duplicate hrefs none, English-only results none
- desktop /sw/ hero query "Hajj": count 2, has Swahili result true, duplicate hrefs none, English-only results /tools/hajj-budget/
- mobile /sw/ hero query "CV": count 7, has Swahili result true, duplicate hrefs none, English-only results /tools/cv-builder/
- mobile /sw/ hero query "zakat": count 1, has Swahili result false, duplicate hrefs none, English-only results /tools/zakat-calculator/
- mobile /sw/ hero query "internet": count 4, has Swahili result false, duplicate hrefs none, English-only results /telecom/internet-compare/, /telecom/business-internet/, /telecom/starlink-compare/, /telecom/fiber-lte-5g/
- mobile /sw/ hero query "blogu": count 0, has Swahili result false, duplicate hrefs none, English-only results none
- mobile /sw/ hero query "Hajj": count 2, has Swahili result true, duplicate hrefs none, English-only results /tools/hajj-budget/
