# Hausa Visible Copy Leakage Ledger

Generated: 2026-05-16

This audit scans `ha/**/*.html` for visible English leakage only. It ignores scripts, styles, head metadata, JSON blobs, URLs, code/pre blocks, and accepted technical acronyms.

## Headline Metrics

- Hausa routes scanned: 67
- Clean routes: 37
- Routes with blockers: 0
- BLOCKER_VISIBLE_ENGLISH findings: 0
- POSSIBLE_FALSE_POSITIVE findings: 72
- ACCEPTED_TECH_TERM findings: 412

## Top 20 Blocker Routes

| Rank | Route | Blockers | Suggested owner batch |
|---:|---|---:|---|
| - | No blocker routes found | 0 | - |

## BLOCKER_VISIBLE_ENGLISH

| Route | Line | Reason | Snippet | Owner batch |
|---|---:|---|---|---|
| - | - | No blocker findings | - | - |

## POSSIBLE_FALSE_POSITIVE

| Route | Line | Reason | Snippet | Owner batch |
|---|---:|---|---|---|
| `/ha/albashi-da-haraji/` | 560 | English route label marked as fallback | Shafi na Turanci Canjin kudi Kwatanta Naira da sauran kudade a shafin AfroFX na Turanci yayin biyan kudi ko kasuwanci. Bude shafin Turanci | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/albashi-da-haraji/` | 569 | brand or platform name | Shafi na Turanci Lissafin kudin Paystack Kiyasta kudin hanyar karbar kudi don sayarwa ta yanar gizo da takardun kudi. Bude kayan aiki | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/albashi-da-haraji/` | 641 | brand or platform name | Yi takardar kudi, duba VAT, sannan ka kiyasta kudin banki ko Paystack idan ana biyan ka ta yanar gizo. | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/jamb/cbt/` | 65 | English route label marked as fallback | Sakamako. Bayan mikawa, shafin Turanci zai nuna maki, bangarorin da aka fi bukatar bita da tarihin gwaji a na'urarka. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/` | 466 | English route label marked as fallback | Karanta jagorar Hausa kan yadda za a tambayi mai taimakon AI, sannan bude shafin Turanci idan kana bukatar amsa. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/kimiyya/` | 14 | English route label marked as fallback | Abubuwan atisaye Atom da jadawali Ka fahimci proton, neutron, electron da yanayin sinadari. Ma'auni Daidaita ma'aunin sinadarai kafin lissafi. Acid da alkali Rarrabe pH, daidaitawa da gishiri. Sinadaran carbon Ka gane... | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/lissafi/` | 15 | English route label marked as fallback | Hausa / JAMB / Lissafi JAMB Lissafi Shirya tambayoyin lamba, algebra, geometry, kididdiga da amfani da ka'idoji. Tsoffin tambayoyi suna kan shafin Turanci, amma wannan jagora yana bayyana yadda za a fara a Hausa. Akwa... | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/lissafi/` | 16 | English route label marked as fallback | Abubuwan da suka fi muhimmanci Algebra Warware ma'auni, jeri da sauya alama cikin natsuwa. Geometry Ka tuna kusurwa, siffa, yanki da girma. Kididdiga Ma'ana, matsakaici, yiwuwar faruwa da karatun jadawali. Dabara Fara... | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/past-questions/` | 58 | English route label marked as fallback | Wadannan shafuka suna taimaka maka ka fahimci abin da za a karanta kafin ka bude tsoffin tambayoyi. Tambayoyin shekarun da suka gabata suna nan a shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/past-questions/` | 70 | English route label marked as fallback | Idan kana so ka bincika tambayoyi kai tsaye, wadannan hanyoyi suna kai ka zuwa shafin Turanci da tacewar darasi. Wannan shi ne tushen tambayoyi na yanzu. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/turanci/` | 18 | English route label marked as fallback | Hausa / JAMB / Turanci JAMB Turanci Shirya fahimtar karatu, kalmomi, jimla da amfani da harshe. Shafin nan yana ba da jagora a Hausa; tsoffin tambayoyi suna kan shafin Turanci da aka nuna a fili. Akwai da Hausa JAMB T... | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/turanci/` | 19 | English route label marked as fallback | Abin da za a maida hankali a kai Fahimtar karatu Karanta sako, gano ma'ana, sannan ka ware babban ra'ayi daga karin bayani. Kalmomi Duba ma'ana, kishiya, karin magana da yadda kalma take aiki a cikin jimla. Tsarin jim... | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/tutor/` | 84 | English route label marked as fallback | Ba mu canza aikin AI, iyakar amfani, hanyar aika tambaya ko sakamakon da tsarin yake bayarwa ba. Wannan shafin Hausa yana bayyana abin da zai faru kafin ka bude shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/kayan-aiki/abincin-dabbobi/` | 15 | English route label marked as fallback | Bayanan kiwo Yawan dabbobi Nauyin kowace dabba, kg Abinci bisa nauyi, kashi Farashin kg daya Lissafa abinci Abin da wannan kiyasi yake nufi Adadin abinci ya dogara da nauyi, shekarun dabba, yanayin kiwo, ciyawa da ake... | Batch 2 - Health and family visible-copy cleanup |
| `/ha/kayan-aiki/amfanin-bayanan-intanet/` | 14 | brand or platform name | Hausa / Sadarwa / Intanet Kiyasin amfani da intanet Kiyasta GB da kake bukata a wata daga lilo, bidiyo, sautin kira, karatu, aiki da WhatsApp. Sakamako kiyasi ne; tsare-tsaren kamfanin sadarwa na iya bambanta. Akwai d... | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/amfanin-bayanan-intanet/` | 15 | English route label marked as fallback | Amfani na yau da kullum Lilo a rana, sa'o'i Bidiyo a rana, sa'o'i Kiran bidiyo a mako, sa'o'i Karatu ko aiki a rana, sa'o'i Lissafa GB Yadda aka yi kiyasi Kayan aikin yana amfani da matsakaicin amfani: lilo ya fi sauk... | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/canza-pdf/` | 69 | English route label marked as fallback | Wannan shafin Hausa yana bayanin abin da za ka zaba kafin bude cikakken kayan aikin canja PDF. Cikakken sarrafa fayil yana kan shafin Turanci yanzu, yana aiki a cikin burauza, kuma zazzagewa yana bin tsarin asusun Afr... | Batch 2 - Document, PDF, invoice, and Naira cleanup |
| `/ha/kayan-aiki/canza-pdf/` | 71 | English route label marked as fallback | Bude cikakken shafin Turanci | Batch 2 - Document, PDF, invoice, and Naira cleanup |
| `/ha/kayan-aiki/canza-pdf/` | 91 | English route label marked as fallback | 4. Zazzage lafiya Cikakken shafin Turanci yana amfani da tsarin asusu kafin saukar da sakamakon. | Batch 2 - Document, PDF, invoice, and Naira cleanup |
| `/ha/kayan-aiki/canza-pdf/` | 95 | English route label marked as fallback | Shafin Turanci Gaskiyar hanya: wannan shafin Hausa ba ya sarrafa fayil kai tsaye. Ya kai ka zuwa cikakken kayan aikin Turanci domin kada mu karya tsarin PDF, kariyar zazzagewa, ko aikin fayil da yake nan a AfroTools. | Batch 2 - Document, PDF, invoice, and Naira cleanup |
| `/ha/kayan-aiki/farashin-kayayyakin-gona/` | 15 | English route label marked as fallback | Kiyasin kudin shiga Adadi Farashi a kan daya Kudin sufuri da ajiya Ragin lalacewa, kashi Kiyasta kudin shiga Abin lura ga manomi da dan kasuwa Ka duba farashi fiye da kasuwa daya idan zai yiwu. Kudin sufuri, ajiya, na... | Batch 2 - Agriculture visible-copy cleanup |
| `/ha/kayan-aiki/` | 533 | brand or platform name | Akwai da Hausa Matsa PDF Rage girman PDF don loda fayil, imel, tashar yanar gizo ko WhatsApp. Bude kayan aiki | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 536 | English route label marked as fallback | Akwai da Hausa Wurin aikin PDF Fara daga wuri daya: hada PDF, raba PDF, matsa PDF ko bude babban shafin Turanci idan ana bukata. Bude kayan aiki | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 560 | brand or platform name | Akwai da Hausa Link din WhatsApp Gina link din wa.me, sako, QR da tarin hanyoyi don kasuwanci. Bude kayan aiki | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 569 | brand or platform name | Akwai da Hausa Kiyasin amfani da intanet Kiyasta yawan bayanan intanet da lilo, bidiyo, WhatsApp da aiki ke bukata. Bude kayan aiki | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 578 | English route label marked as fallback | Shafi na Turanci Canjin kudi Canja kudi tsakanin Naira, USD da sauran kudaden Afirka a shafin AfroFX na Turanci. Bude shafin Turanci | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 581 | English route label marked as fallback | Shafi na Turanci Cajin banki Kwatanta kudin banki, caji da abin da aka cire a shafin Turanci. Bude shafin Turanci | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 590 | brand or platform name | Shafi na Turanci Kalkuletan Paystack Kiyasta kudin karbar biya da abin da zai shigo bayan cire caji. Bude kayan aiki | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/kalkuletan-gpa-cgpa/` | 15 | English route label marked as fallback | Bayanan maki Jimillar maki na zango Jimillar raka'o'i na zango Jimillar maki na baya Raka'o'in baya Lissafa Abin lura Wasu jami'o'i suna amfani da 5.0, wasu 4.0. Wannan kayan aiki yana raba jimillar maki da jimillar r... | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kalkuletan-waec-neco/` | 163 | brand or platform name |  WhatsApp | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/kayan-aiki/kasafin-dalibi/` | 15 | English route label marked as fallback | Bayanan kudi Kudin da zai shigo Kudin makaranta Haya ko masauki Abinci Sufuri Littattafai da yan bukatu Lissafa kasafi Yadda za a karanta sakamako Idan ragowar kudi ya yi kasa, fara rage abin da ba dole ba, sannan ka ... | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kirkiro-invoice/` | 617 | brand or platform name | Kudin wayar hannu / WhatsApp | Batch 2 - Document, PDF, invoice, and Naira cleanup |
| `/ha/kayan-aiki/kirkiro-invoice/` | 618 | brand or platform name | M-Pesa, MoMo, Airtel Money, WhatsApp | Batch 2 - Document, PDF, invoice, and Naira cleanup |
| `/ha/kayan-aiki/kirkiro-invoice/` | 896 | brand or platform name | Eh. Saka hanyar biyan kudi, link din biya, kudin wayar hannu ko WhatsApp, da bayanan banki domin PDF ya nuna wa abokin ciniki yadda zai biya. | Batch 2 - Document, PDF, invoice, and Naira cleanup |
| `/ha/kayan-aiki/kudin-tura-kudi-ta-waya/` | 14 | brand or platform name | Hausa / Sadarwa / Tura kudi Kudin tura kudi ta waya Kiyasta caji kafin aika kudi ta OPay, M-Pesa, Airtel ko makamantansu. Wannan ba jadawalin hukuma ba ne; tabbatar da app ko wakili kafin biya. Akwai da Hausa OPay M-Pesa | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kudin-tura-kudi-ta-waya/` | 15 | English route label marked as fallback | Bayanan tura kudi Adadin da za a aika Hanyar biya Asusun waya zuwa asusun waya Wakili ko cire kudi Asusun banki Kiyasta caji Ka tabbatar kafin aika kudi Kudin caji na iya sauyawa bisa kasa, mai bayar da sabis, matsayi... | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kwatanta-kunshin-intanet/` | 58 | brand or platform name | Kamfani MTN, Airtel, Glo, 9mobile ko wani kamfanin sadarwa. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kwatanta-kunshin-intanet/` | 76 | English route label marked as fallback | Lura: Wannan shafin Hausa yana shiryarwa ne. Cikakken teburin kwatantawa yana kan shafin Turanci yanzu, kuma duk farashi ya kamata a tabbatar daga kamfanin sadarwa kafin siye. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/lambobin-ussd/` | 80 | brand or platform name | Duba lambar ragowar kudi, bayanan intanet, katin waya, tura kudi, bashi da taimakon kwastoma. Najeriya ta bude da MTN, Airtel, Glo da 9mobile, sannan zaka iya zabar wasu kasashe daga bayanan sadarwa. | Batch 2 - Telecom and USSD visible-copy cleanup |
| `/ha/kayan-aiki/lambobin-ussd/` | 90 | brand or platform name | misali ragowar kudi, tura kudi, MTN... | Batch 2 - Telecom and USSD visible-copy cleanup |
| `/ha/kayan-aiki/mai-fassara-hausa/` | 64 | English route label marked as fallback | Idan kana son cikakken kundin jimlolin Turanci zuwa Hausa, akwai shafin Turanci da ke da karin misalai. An nuna shi a fili domin kada a dauka dukkan tsohon shafin ya riga ya zama Hausa. | Batch 2 - Language and translation hub cleanup |
| `/ha/kayan-aiki/neman-tallafin-karatu/` | 15 | English route label marked as fallback | Tace bukata Matakin karatu Digiri na farko Digiri na biyu Horon sana'a Gajeren kwas Fanni Kimiyya da fasaha Lafiya Kasuwanci Noma Kowane fanni Inda kake nema Nigeria Afrika Waje Shirya jerin bukata Gaskiyar neman tall... | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/rajistar-layin-waya-nin/` | 14 | brand or platform name | Hausa / Sadarwa / Rajistar layi Rajistar layin waya da NIN Shirya abin da zaka duba kafin zuwa ofishin MTN, Airtel, Glo ko 9mobile: NIN, shaidar mutum, lambar waya da sakon tabbatarwa. Wannan shafi ba ya duba bayanan ... | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/rajistar-layin-waya-nin/` | 15 | English route label marked as fallback | Jerin abin dubawa NIN Tabbatar cewa lambar ka tana nan kuma sunan ya yi daidai da shaidar ka. Shaida Dauki katin shaida, fasfo ko wata takarda da kamfanin sadarwa ya karba. Lambar waya Rubuta lambar da ake so a hada k... | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/ribar-kiwon-kifi/` | 15 | English route label marked as fallback | Bayanan kiwon kifi Yawan kifi Nauyin sayarwa, kg Farashi a kg Kifin da zai kai sayarwa, kashi Kudin abinci Sauran kudade Lissafa riba Abin da ke iya sauya riba Mutuwar kifi, tsadar abinci, yanayin ruwa, farashin kasuw... | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/rubuta-wasikar-aiki/` | 15 | English route label marked as fallback | Bayanan wasika Aikin da ake nema Sunan kamfani Kwarewar da tafi dacewa na iya kula da abokin ciniki, rubuta rahoto, da aiki cikin tsari Rubuta daftari Kafin aikawa Karanta wasikar da kanka, ka cire kalmomin da ba su d... | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/whatsapp-link/` | 100 | brand or platform name | AfroTools Hausa / Sadarwa / WhatsApp Link | Batch 2 - Telecom and USSD visible-copy cleanup |
| `/ha/kayan-aiki/whatsapp-link/` | 101 | brand or platform name | Mai Gina WhatsApp Link | Batch 2 - Telecom and USSD visible-copy cleanup |
| `/ha/kayan-aiki/whatsapp-link/` | 102 | brand or platform name | Gina hanyar wa.me da sakon farko domin a fara magana a WhatsApp. Yana da amfani ga masu sayarwa, isarwa, ajiyar lokaci da taimakon kwastoma. | Batch 2 - Telecom and USSD visible-copy cleanup |
| `/ha/kayan-aiki/whatsapp-link/` | 110 | brand or platform name | Gina WhatsApp link | Batch 2 - Telecom and USSD visible-copy cleanup |
| `/ha/kayan-aiki/whatsapp-link/` | 155 | brand or platform name | Shirin link Hanyar WhatsApp wa.me tana bukatar cikakkiyar lambar kasa ba tare da alamar +, baka ko tazara ba. | Batch 2 - Telecom and USSD visible-copy cleanup |
| `/ha/kayan-aiki/whatsapp-link/` | 180 | brand or platform name | WhatsApp link dinka | Batch 2 - Telecom and USSD visible-copy cleanup |
| `/ha/kayan-aiki/whatsapp-link/` | 187 | brand or platform name | Bude a WhatsApp | Batch 2 - Telecom and USSD visible-copy cleanup |
| `/ha/kayan-aiki/whatsapp-link/` | 196 | brand or platform name | Mai Gina WhatsApp Link yana gina hanyar da za ta bude tattaunawa kai tsaye ba tare da kwastoma ya fara ajiye lambar ba. Ka saka lambar waya da lambar kasa, ka kara sako idan kana so, sannan ka raba link din a bayanin ... | Batch 2 - Telecom and USSD visible-copy cleanup |
| `/ha/kayan-aiki/whatsapp-link/` | 202 | brand or platform name | Ta yaya zan kirkiro WhatsApp link ga kasuwanci? | Batch 2 - Telecom and USSD visible-copy cleanup |
| `/ha/kayan-aiki/whatsapp-link/` | 203 | brand or platform name | Zabi lambar kasa, saka lambar WhatsApp, kara sako idan kana so, sannan danna Gina link. Za ka samu wa.me link da zaka iya raba wa kwastomomi. | Batch 2 - Telecom and USSD visible-copy cleanup |
| `/ha/kayan-aiki/whatsapp-link/` | 211 | brand or platform name | Eh. Link din yana bude tattaunawa kai tsaye a WhatsApp, shi yasa yake da amfani ga taimakon kwastoma, sayarwa ta intanet, ajiyar lokaci da isarwa. | Batch 2 - Telecom and USSD visible-copy cleanup |
| `/ha/kayan-aiki/whatsapp-link/` | 215 | brand or platform name | Bayan ka gina link, sauke QR code sannan ka saka shi a takardar talla, katin kasuwanci, rasit ko kan teburin shago. Kwastoma zai iya duba QR ya bude tattaunawa a WhatsApp. | Batch 2 - Telecom and USSD visible-copy cleanup |
| `/ha/najeriya/harajin-albashi/` | 620 | brand or platform name | WhatsApp | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/najeriya/` | 542 | brand or platform name | Akwai da Hausa Link din WhatsApp Gina link da QR na WhatsApp domin abokan ciniki su fara magana da kai. Bude kayan aiki | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/najeriya/` | 548 | brand or platform name | Akwai da Hausa Kiyasin amfani da intanet Kiyasta yawan bayanan intanet da lilo, bidiyo, WhatsApp da aiki ke bukata. Bude kayan aiki | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/najeriya/` | 561 | English route label marked as fallback | Shafi na Turanci Canjin kudi Canja kudi tsakanin Naira, USD da sauran kudaden Afirka a shafin AfroFX na Turanci. Bude shafin Turanci | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/najeriya/` | 567 | English route label marked as fallback | Shafi na Turanci Cajin banki Kiyasta cajin banki da kudin tura kudi a shafin Turanci kafin aika kudi. Bude shafin Turanci | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/najeriya/` | 573 | brand or platform name | Shafi na Turanci Kalkuletan Paystack Kiyasta kudin karbar biya da abin da zai shigo bayan cire caji. Bude kayan aiki | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/sadarwa/` | 71 | brand or platform name | USSD, bayanan intanet, SIM da WhatsApp cikin Hausa mai sauki. | Batch 2 - Telecom and USSD visible-copy cleanup |
| `/ha/sadarwa/` | 72 | brand or platform name | Wannan shafi yana fara daga abin da masu amfani a Najeriya ke bukata: lambobin USSD na MTN, Airtel, Glo da 9mobile, link din WhatsApp don kasuwanci, kiyasin intanet, rajistar layi da kudin tura kudi ta waya. | Batch 2 - Telecom and USSD visible-copy cleanup |
| `/ha/sadarwa/` | 75 | brand or platform name | Gina link din WhatsApp | Batch 2 - Telecom and USSD visible-copy cleanup |
| `/ha/sadarwa/` | 96 | brand or platform name | Link din WhatsApp | Batch 2 - Telecom and USSD visible-copy cleanup |
| `/ha/sadarwa/` | 112 | brand or platform name | Akwai da Hausa Kwatanta kunshin intanet Fara da bayanin Hausa, sannan tabbatar da farashi daga manhaja ko USSD na MTN, Airtel, Glo ko 9mobile. | Batch 2 - Telecom and USSD visible-copy cleanup |
| `/ha/sadarwa/` | 123 | brand or platform name | 4. WhatsApp: Gwada link sau daya kafin ka saka shi a takardar talla, bayanin shafi ko rasit. | Batch 2 - Telecom and USSD visible-copy cleanup |
| `/ha/sadarwa/` | 131 | brand or platform name | Lura: Wannan shafi na taimakon bincike ne. Ba ya maye gurbin sanarwar NCC, NIMC, banki, kamfanin sadarwa ko WhatsApp Farashin intanet da kudin wayar hannu na iya canzawa. | Batch 2 - Telecom and USSD visible-copy cleanup |
| `/ha/takardu-da-pdf/` | 296 | English route label marked as fallback | Fara daga wuri daya: hada PDF, raba PDF, matsa PDF ko bude babban shafin Turanci idan ana bukata. | Batch 2 - Document, PDF, invoice, and Naira cleanup |

## ACCEPTED_TECH_TERM

Accepted terms: `PDF`, `API`, `JSON`, `USSD`, `JAMB`, `WAEC`, `NECO`, `NYSC`, `VAT`, `PAYE`, `BVN`, `NIN`, `FIRS`, `HTML`, `CSV`, `ZIP`.

The JSON ledger contains line-level accepted-term examples. These are tracked so future cleanup prompts do not waste time translating normal acronyms.

## CLEAN

- `/ha/harshe-da-fassara/`
- `/ha/ilimi/`
- `/ha/`
- `/ha/jamb/fisiks/`
- `/ha/jamb/halittu/`
- `/ha/kasuwanci-da-haraji/`
- `/ha/kayan-aiki/abincin-afirka/`
- `/ha/kayan-aiki/alawus-na-nysc/`
- `/ha/kayan-aiki/cit-najeriya/`
- `/ha/kayan-aiki/darajar-katin-waya/`
- `/ha/kayan-aiki/duba-genotype/`
- `/ha/kayan-aiki/fansho-najeriya/`
- `/ha/kayan-aiki/gina-cv/`
- `/ha/kayan-aiki/hada-da-raba-pdf/`
- `/ha/kayan-aiki/jagorar-tin-najeriya/`
- `/ha/kayan-aiki/kalkuletan-jamb/`
- `/ha/kayan-aiki/kalkuletan-vat/`
- `/ha/kayan-aiki/kirkiro-resit/`
- `/ha/kayan-aiki/kudin-asibiti/`
- `/ha/kayan-aiki/kudin-haihuwa/`
- `/ha/kayan-aiki/kwandon-kasuwa/`
- `/ha/kayan-aiki/kwatanta-farashin-magani/`
- `/ha/kayan-aiki/kwatanta-kudin-makaranta/`
- `/ha/kayan-aiki/matsa-pdf/`
- `/ha/kayan-aiki/naira-zuwa-kalmomi/`
- `/ha/kayan-aiki/nhf-najeriya/`
- `/ha/kayan-aiki/ribar-gona/`
- `/ha/kayan-aiki/sarrafa-rogo/`
- `/ha/kayan-aiki/sickle-cell/`
- `/ha/kayan-aiki/wht-najeriya/`
- `/ha/kayan-aiki/wurin-aikin-pdf/`
- `/ha/lafiya/`
- `/ha/noma/amfanin-gona-najeriya/`
- `/ha/noma/ban-ruwa-najeriya/`
- `/ha/noma/`
- `/ha/noma/taki-najeriya/`
- `/ha/noma/yawan-iri-najeriya/`

## Recommended Cleanup Order

1. No blocker cleanup needed from this audit.

## Notes

- `English fallback` labels are treated as possible false positives because some Hausa hubs intentionally disclose English fallback routes.
- Proper nouns, country names, brand names, and accepted technical acronyms are not blockers by themselves.
- This report does not edit Hausa page copy.
