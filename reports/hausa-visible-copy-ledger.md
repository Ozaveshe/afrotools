# Hausa Visible Copy Leakage Ledger

Generated: 2026-05-18

This audit scans `ha/**/*.html` for visible English leakage only. It ignores scripts, styles, head metadata, JSON blobs, URLs, code/pre blocks, and accepted technical acronyms.

## Headline Metrics

- Hausa routes scanned: 92
- Clean routes: 43
- Routes with blockers: 0
- BLOCKER_VISIBLE_ENGLISH findings: 0
- POSSIBLE_FALSE_POSITIVE findings: 149
- ACCEPTED_TECH_TERM findings: 523

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
| `/ha/albashi-da-haraji/` | 569 | brand or platform name | Shafi na Turanci Lissafin kudin Paystack Kiyasta kudin hanyar karbar kudi don sayarwa ta yanar gizo da takardun kudi. Bude kayan aiki | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/albashi-da-haraji/` | 641 | brand or platform name | Yi takardar kudi, duba VAT, sannan ka kiyasta kudin banki ko Paystack idan ana biyan ka ta yanar gizo. | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/jamb/adabi/` | 80 | English route label marked as fallback | Jagorar Hausa don JAMB Adabi: wakoki, labari, wasan kwaikwayo, salo, jigo da fahimtar rubutu. Tambayoyin shekarun da suka gabata suna nan a shafin Turanci; wannan shafin yana taimaka maka fahimtar abin da za ka karant... | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/adabi/` | 92 | English route label marked as fallback | Darasi Jigo da salo Ka fara da maanar kalmomi, ka rubuta gajeren bayani, sannan ka yi atisaye daga tambayoyin da ke shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/adabi/` | 93 | English route label marked as fallback | Darasi Waka da karin magana Ka fara da maanar kalmomi, ka rubuta gajeren bayani, sannan ka yi atisaye daga tambayoyin da ke shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/adabi/` | 94 | English route label marked as fallback | Darasi Labari da halaye Ka fara da maanar kalmomi, ka rubuta gajeren bayani, sannan ka yi atisaye daga tambayoyin da ke shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/adabi/` | 95 | English route label marked as fallback | Darasi Wasan kwaikwayo da yanayi Ka fara da maanar kalmomi, ka rubuta gajeren bayani, sannan ka yi atisaye daga tambayoyin da ke shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/adabi/` | 101 | English route label marked as fallback | Karanta mahimman kalmomi a Hausa, sannan ka bude shafin Turanci domin tambayoyin asali. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/adabi/` | 103 | English route label marked as fallback | Kar ka dauka an kirkiri shafukan shekarun Hausa. Ajiyar shekaru tana kan asalin shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/cbt/` | 66 | English route label marked as fallback | Sakamako. Bayan mikawa, shafin Turanci zai nuna maki, bangarorin da aka fi bukatar bita da tarihin gwaji a na'urarka. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/crk/` | 80 | English route label marked as fallback | Jagorar Hausa don JAMB CRK: littafin Bible, rayuwar Yesu, annabawa, manzanni da dabiun Kirista. Tambayoyin shekarun da suka gabata suna nan a shafin Turanci; wannan shafin yana taimaka maka fahimtar abin da za ka kara... | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/crk/` | 92 | English route label marked as fallback | Darasi Tsohon Alkawari Ka fara da maanar kalmomi, ka rubuta gajeren bayani, sannan ka yi atisaye daga tambayoyin da ke shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/crk/` | 93 | English route label marked as fallback | Darasi Rayuwar Yesu Ka fara da maanar kalmomi, ka rubuta gajeren bayani, sannan ka yi atisaye daga tambayoyin da ke shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/crk/` | 94 | English route label marked as fallback | Darasi Manzanni da cocin farko Ka fara da maanar kalmomi, ka rubuta gajeren bayani, sannan ka yi atisaye daga tambayoyin da ke shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/crk/` | 95 | English route label marked as fallback | Darasi Dabiun Kirista Ka fara da maanar kalmomi, ka rubuta gajeren bayani, sannan ka yi atisaye daga tambayoyin da ke shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/crk/` | 101 | English route label marked as fallback | Karanta mahimman kalmomi a Hausa, sannan ka bude shafin Turanci domin tambayoyin asali. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/crk/` | 103 | English route label marked as fallback | Kar ka dauka an kirkiri shafukan shekarun Hausa. Ajiyar shekaru tana kan asalin shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/gwamnati/` | 80 | English route label marked as fallback | Jagorar Hausa don JAMB Gwamnati: kundin tsarin mulki, tarayya, jamiyyu, zabe da tarihin siyasar Najeriya. Tambayoyin shekarun da suka gabata suna nan a shafin Turanci; wannan shafin yana taimaka maka fahimtar abin da ... | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/gwamnati/` | 92 | English route label marked as fallback | Darasi Kundin tsarin mulki Ka fara da maanar kalmomi, ka rubuta gajeren bayani, sannan ka yi atisaye daga tambayoyin da ke shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/gwamnati/` | 93 | English route label marked as fallback | Darasi Tarayya da raba iko Ka fara da maanar kalmomi, ka rubuta gajeren bayani, sannan ka yi atisaye daga tambayoyin da ke shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/gwamnati/` | 94 | English route label marked as fallback | Darasi Jamiyyu da zabe Ka fara da maanar kalmomi, ka rubuta gajeren bayani, sannan ka yi atisaye daga tambayoyin da ke shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/gwamnati/` | 95 | English route label marked as fallback | Darasi Tarihin siyasar Najeriya Ka fara da maanar kalmomi, ka rubuta gajeren bayani, sannan ka yi atisaye daga tambayoyin da ke shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/gwamnati/` | 101 | English route label marked as fallback | Karanta mahimman kalmomi a Hausa, sannan ka bude shafin Turanci domin tambayoyin asali. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/gwamnati/` | 103 | English route label marked as fallback | Kar ka dauka an kirkiri shafukan shekarun Hausa. Ajiyar shekaru tana kan asalin shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/` | 466 | English route label marked as fallback | Karanta jagorar Hausa kan yadda za a tambayi mai taimakon AI, sannan bude shafin Turanci idan kana bukatar amsa. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/kasuwanci/` | 80 | English route label marked as fallback | Jagorar Hausa don JAMB Kasuwanci: ciniki, banki, inshora, sufuri, tallace-tallace da nauin kamfani. Tambayoyin shekarun da suka gabata suna nan a shafin Turanci; wannan shafin yana taimaka maka fahimtar abin da za ka ... | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/kasuwanci/` | 92 | English route label marked as fallback | Darasi Ciniki da kasuwa Ka fara da maanar kalmomi, ka rubuta gajeren bayani, sannan ka yi atisaye daga tambayoyin da ke shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/kasuwanci/` | 93 | English route label marked as fallback | Darasi Banki da inshora Ka fara da maanar kalmomi, ka rubuta gajeren bayani, sannan ka yi atisaye daga tambayoyin da ke shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/kasuwanci/` | 94 | English route label marked as fallback | Darasi Sufuri da sadarwa Ka fara da maanar kalmomi, ka rubuta gajeren bayani, sannan ka yi atisaye daga tambayoyin da ke shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/kasuwanci/` | 95 | English route label marked as fallback | Darasi Kamfani da takardun kasuwanci Ka fara da maanar kalmomi, ka rubuta gajeren bayani, sannan ka yi atisaye daga tambayoyin da ke shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/kasuwanci/` | 101 | English route label marked as fallback | Karanta mahimman kalmomi a Hausa, sannan ka bude shafin Turanci domin tambayoyin asali. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/kasuwanci/` | 103 | English route label marked as fallback | Kar ka dauka an kirkiri shafukan shekarun Hausa. Ajiyar shekaru tana kan asalin shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/kimiyya/` | 14 | English route label marked as fallback | Abubuwan atisaye Atom da jadawali Ka fahimci proton, neutron, electron da yanayin sinadari. Ma'auni Daidaita ma'aunin sinadarai kafin lissafi. Acid da alkali Rarrabe pH, daidaitawa da gishiri. Sinadaran carbon Ka gane... | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/lissafi/` | 15 | English route label marked as fallback | Hausa / JAMB / Lissafi JAMB Lissafi Shirya tambayoyin lamba, algebra, geometry, kididdiga da amfani da ka'idoji. Tsoffin tambayoyi suna kan shafin Turanci, amma wannan jagora yana bayyana yadda za a fara a Hausa. Akwa... | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/lissafi/` | 16 | English route label marked as fallback | Abubuwan da suka fi muhimmanci Algebra Warware ma'auni, jeri da sauya alama cikin natsuwa. Geometry Ka tuna kusurwa, siffa, yanki da girma. Kididdiga Ma'ana, matsakaici, yiwuwar faruwa da karatun jadawali. Dabara Fara... | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/past-questions/` | 59 | English route label marked as fallback | Wadannan shafuka suna taimaka maka ka fahimci abin da za a karanta kafin ka bude tsoffin tambayoyi. Tambayoyin shekarun da suka gabata suna nan a shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/past-questions/` | 71 | English route label marked as fallback | Idan kana so ka bincika tambayoyi kai tsaye, wadannan hanyoyi suna kai ka zuwa shafin Turanci da tacewar darasi. Wannan shi ne tushen tambayoyi na yanzu. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/tarihi/` | 80 | English route label marked as fallback | Jagorar Hausa don JAMB Tarihi: alummomi, mulkin mallaka, yanci, gwamnati da manyan sauye-sauye. Tambayoyin shekarun da suka gabata suna nan a shafin Turanci; wannan shafin yana taimaka maka fahimtar abin da za ka kara... | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/tarihi/` | 92 | English route label marked as fallback | Darasi Tarihin Afirka Ka fara da maanar kalmomi, ka rubuta gajeren bayani, sannan ka yi atisaye daga tambayoyin da ke shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/tarihi/` | 93 | English route label marked as fallback | Darasi Mulkin mallaka da yanci Ka fara da maanar kalmomi, ka rubuta gajeren bayani, sannan ka yi atisaye daga tambayoyin da ke shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/tarihi/` | 94 | English route label marked as fallback | Darasi Tarihin Najeriya Ka fara da maanar kalmomi, ka rubuta gajeren bayani, sannan ka yi atisaye daga tambayoyin da ke shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/tarihi/` | 95 | English route label marked as fallback | Darasi Kungiyoyi da manufofi Ka fara da maanar kalmomi, ka rubuta gajeren bayani, sannan ka yi atisaye daga tambayoyin da ke shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/tarihi/` | 101 | English route label marked as fallback | Karanta mahimman kalmomi a Hausa, sannan ka bude shafin Turanci domin tambayoyin asali. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/tarihi/` | 103 | English route label marked as fallback | Kar ka dauka an kirkiri shafukan shekarun Hausa. Ajiyar shekaru tana kan asalin shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/tattalin-arziki/` | 80 | English route label marked as fallback | Jagorar Hausa don JAMB Tattalin arziki: bukata da wadata, kasuwa, kudin kasa, kasuwanci da tattalin arzikin Najeriya. Tambayoyin shekarun da suka gabata suna nan a shafin Turanci; wannan shafin yana taimaka maka fahim... | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/tattalin-arziki/` | 92 | English route label marked as fallback | Darasi Bukatun kaya da wadata Ka fara da maanar kalmomi, ka rubuta gajeren bayani, sannan ka yi atisaye daga tambayoyin da ke shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/tattalin-arziki/` | 93 | English route label marked as fallback | Darasi Tsarin kasuwa da farashi Ka fara da maanar kalmomi, ka rubuta gajeren bayani, sannan ka yi atisaye daga tambayoyin da ke shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/tattalin-arziki/` | 94 | English route label marked as fallback | Darasi Kudi, banki da hauhawar farashi Ka fara da maanar kalmomi, ka rubuta gajeren bayani, sannan ka yi atisaye daga tambayoyin da ke shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/tattalin-arziki/` | 95 | English route label marked as fallback | Darasi Tattalin arzikin Najeriya Ka fara da maanar kalmomi, ka rubuta gajeren bayani, sannan ka yi atisaye daga tambayoyin da ke shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/tattalin-arziki/` | 101 | English route label marked as fallback | Karanta mahimman kalmomi a Hausa, sannan ka bude shafin Turanci domin tambayoyin asali. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/tattalin-arziki/` | 103 | English route label marked as fallback | Kar ka dauka an kirkiri shafukan shekarun Hausa. Ajiyar shekaru tana kan asalin shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/tutor/` | 85 | English route label marked as fallback | Ba mu canza aikin AI, iyakar amfani, hanyar aika tambaya ko sakamakon da tsarin yake bayarwa ba. Wannan shafin Hausa yana bayyana abin da zai faru kafin ka bude shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/kasuwanci-da-haraji/` | 114 | English route label marked as fallback | Karin hanyoyin kasuwanci Wadannan hanyoyin suna taimaka wa mai kasuwanci ya shirya takardu, rajista da bincike. Inda shafin Hausa bai fito ba tukuna, mun nuna shafin Turanci a fili. | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/kayan-aiki/abincin-dabbobi/` | 15 | English route label marked as fallback | Bayanan kiwo Yawan dabbobi Nauyin kowace dabba, kg Abinci bisa nauyi, kashi Farashin kg daya Lissafa abinci Abin da wannan kiyasi yake nufi Adadin abinci ya dogara da nauyi, shekarun dabba, yanayin kiwo, ciyawa da ake... | Batch 2 - Health and family visible-copy cleanup |
| `/ha/kayan-aiki/amfanin-bayanan-intanet/` | 14 | brand or platform name | Hausa / Sadarwa / Intanet Kiyasin amfani da intanet Kiyasta GB da kake bukata a wata daga lilo, bidiyo, sautin kira, karatu, aiki da WhatsApp. Sakamako kiyasi ne; tsare-tsaren kamfanin sadarwa na iya bambanta. Akwai d... | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/amfanin-bayanan-intanet/` | 15 | English route label marked as fallback | Amfani na yau da kullum Lilo a rana, sa'o'i Bidiyo a rana, sa'o'i Kiran bidiyo a mako, sa'o'i Karatu ko aiki a rana, sa'o'i Lissafa GB Yadda aka yi kiyasi Kayan aikin yana amfani da matsakaicin amfani: lilo ya fi sauk... | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/cgt-najeriya/` | 82 | English route label marked as fallback | Bude shafin Turanci | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/cgt-najeriya/` | 100 | English route label marked as fallback | Bude shafin Turanci mai aiki idan kana bukatar lissafi, fayil ko cikakken ma'amala. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/cgt-najeriya/` | 116 | English route label marked as fallback | Shafin Turanci Cikakken aikin da aka kiyaye daga asali. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/dawo-da-jari/` | 82 | English route label marked as fallback | Bude shafin Turanci | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/dawo-da-jari/` | 100 | English route label marked as fallback | Bude shafin Turanci mai aiki idan kana bukatar lissafi, fayil ko cikakken ma'amala. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/dawo-da-jari/` | 116 | English route label marked as fallback | Shafin Turanci Cikakken aikin da aka kiyaye daga asali. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/farashin-kayayyakin-gona/` | 15 | English route label marked as fallback | Kiyasin kudin shiga Adadi Farashi a kan daya Kudin sufuri da ajiya Ragin lalacewa, kashi Kiyasta kudin shiga Abin lura ga manomi da dan kasuwa Ka duba farashi fiye da kasuwa daya idan zai yiwu. Kudin sufuri, ajiya, na... | Batch 2 - Agriculture visible-copy cleanup |
| `/ha/kayan-aiki/gwajin-ussd/` | 82 | English route label marked as fallback | Bude shafin Turanci | Batch 2 - Telecom and USSD visible-copy cleanup |
| `/ha/kayan-aiki/gwajin-ussd/` | 100 | English route label marked as fallback | Bude shafin Turanci mai aiki idan kana bukatar lissafi, fayil ko cikakken ma'amala. | Batch 2 - Telecom and USSD visible-copy cleanup |
| `/ha/kayan-aiki/gwajin-ussd/` | 116 | English route label marked as fallback | Shafin Turanci Cikakken aikin da aka kiyaye daga asali. | Batch 2 - Telecom and USSD visible-copy cleanup |
| `/ha/kayan-aiki/gyara-pdf/` | 82 | English route label marked as fallback | Bude shafin Turanci | Batch 2 - Document, PDF, invoice, and Naira cleanup |
| `/ha/kayan-aiki/gyara-pdf/` | 100 | English route label marked as fallback | Bude shafin Turanci mai aiki idan kana bukatar lissafi, fayil ko cikakken ma'amala. | Batch 2 - Document, PDF, invoice, and Naira cleanup |
| `/ha/kayan-aiki/gyara-pdf/` | 116 | English route label marked as fallback | Shafin Turanci Cikakken aikin da aka kiyaye daga asali. | Batch 2 - Document, PDF, invoice, and Naira cleanup |
| `/ha/kayan-aiki/` | 539 | brand or platform name | Akwai da Hausa Matsa PDF Rage girman PDF don loda fayil, imel, tashar yanar gizo ko WhatsApp. Bude kayan aiki | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 542 | English route label marked as fallback | Akwai da Hausa Wurin aikin PDF Fara daga wuri daya: hada PDF, raba PDF, matsa PDF ko bude babban shafin Turanci idan ana bukata. Bude kayan aiki | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 575 | brand or platform name | Akwai da Hausa Link din WhatsApp Gina link din wa.me, sako, QR da tarin hanyoyi don kasuwanci. Bude kayan aiki | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 584 | brand or platform name | Akwai da Hausa Kiyasin amfani da intanet Kiyasta yawan bayanan intanet da lilo, bidiyo, WhatsApp da aiki ke bukata. Bude kayan aiki | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 605 | brand or platform name | Akwai da Hausa Kalkuletan Paystack Kiyasta caji da abin da zai shigo bayan cire kudin Paystack, sannan tabbatar da jadawalin kamfani. Bude jagora | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/kalkuletan-gpa-cgpa/` | 15 | English route label marked as fallback | Bayanan maki Jimillar maki na zango Jimillar raka'o'i na zango Jimillar maki na baya Raka'o'in baya Lissafa Abin lura Wasu jami'o'i suna amfani da 5.0, wasu 4.0. Wannan kayan aiki yana raba jimillar maki da jimillar r... | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kalkuletan-paystack/` | 77 | brand or platform name | AfroTools Hausa / Kayan aiki / Kalkuletan Paystack a Hausa breadcrumb | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kalkuletan-paystack/` | 79 | brand or platform name | Kiyasta abin da zai shigo bayan cajin Paystack. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kalkuletan-paystack/` | 80 | brand or platform name | Jagorar Hausa don kiyasta cajin Paystack, abin da zai shigo bayan cire caji, da bukatar tabbatar da jadawalin kamfanin kafin amfani. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kalkuletan-paystack/` | 82 | English route label marked as fallback | Bude shafin Turanci | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kalkuletan-paystack/` | 93 | brand or platform name | Abin lura Ka tabbatar da sabon jadawalin Paystack kafin saka farashi ko aika takardar kudi Ka tabbatar da sabon jadawalin Paystack kafin saka farashi ko aika takardar kudi. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kalkuletan-paystack/` | 100 | English route label marked as fallback | Bude shafin Turanci mai aiki idan kana bukatar lissafi, fayil ko cikakken ma'amala. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kalkuletan-paystack/` | 109 | brand or platform name | Paystack na iya sauya caji, haraji ko sharuddan biya. Wannan jagora ba sanarwar hukuma ba ce. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kalkuletan-paystack/` | 116 | English route label marked as fallback | Shafin Turanci Cikakken aikin da aka kiyaye daga asali. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kalkuletan-waec-neco/` | 163 | brand or platform name |  WhatsApp | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/kayan-aiki/karin-farashi/` | 82 | English route label marked as fallback | Bude shafin Turanci | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/karin-farashi/` | 100 | English route label marked as fallback | Bude shafin Turanci mai aiki idan kana bukatar lissafi, fayil ko cikakken ma'amala. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/karin-farashi/` | 116 | English route label marked as fallback | Shafin Turanci Cikakken aikin da aka kiyaye daga asali. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kasafin-dalibi/` | 15 | English route label marked as fallback | Bayanan kudi Kudin da zai shigo Kudin makaranta Haya ko masauki Abinci Sufuri Littattafai da yan bukatu Lissafa kasafi Yadda za a karanta sakamako Idan ragowar kudi ya yi kasa, fara rage abin da ba dole ba, sannan ka ... | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kirkiro-invoice/` | 617 | brand or platform name | Kudin wayar hannu / WhatsApp | Batch 2 - Document, PDF, invoice, and Naira cleanup |
| `/ha/kayan-aiki/kirkiro-invoice/` | 618 | brand or platform name | M-Pesa, MoMo, Airtel Money, WhatsApp | Batch 2 - Document, PDF, invoice, and Naira cleanup |
| `/ha/kayan-aiki/kirkiro-invoice/` | 896 | brand or platform name | Eh. Saka hanyar biyan kudi, link din biya, kudin wayar hannu ko WhatsApp, da bayanan banki domin PDF ya nuna wa abokin ciniki yadda zai biya. | Batch 2 - Document, PDF, invoice, and Naira cleanup |
| `/ha/kayan-aiki/kudin-maikaci/` | 82 | English route label marked as fallback | Bude shafin Turanci | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kudin-maikaci/` | 100 | English route label marked as fallback | Bude shafin Turanci mai aiki idan kana bukatar lissafi, fayil ko cikakken ma'amala. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kudin-maikaci/` | 116 | English route label marked as fallback | Shafin Turanci Cikakken aikin da aka kiyaye daga asali. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kudin-tura-kudi-ta-waya/` | 14 | brand or platform name | Hausa / Sadarwa / Tura kudi Kudin tura kudi ta waya Kiyasta caji kafin aika kudi ta OPay, M-Pesa, Airtel ko makamantansu. Wannan ba jadawalin hukuma ba ne; tabbatar da manhaja ko wakili kafin biya. Akwai da Hausa OPay... | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kudin-tura-kudi-ta-waya/` | 15 | English route label marked as fallback | Bayanan tura kudi Adadin da za a aika Hanyar biya Asusun waya zuwa asusun waya Wakili ko cire kudi Asusun banki Kiyasta caji Ka tabbatar kafin aika kudi Kudin caji na iya sauyawa bisa kasa, mai bayar da sabis, matsayi... | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kwatanta-aika-kudi/` | 82 | English route label marked as fallback | Bude shafin Turanci | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kwatanta-aika-kudi/` | 100 | English route label marked as fallback | Bude shafin Turanci mai aiki idan kana bukatar lissafi, fayil ko cikakken ma'amala. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kwatanta-aika-kudi/` | 116 | English route label marked as fallback | Shafin Turanci Cikakken aikin da aka kiyaye daga asali. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kwatanta-kunshin-intanet/` | 59 | brand or platform name | Kamfani MTN, Airtel, Glo, 9mobile ko wani kamfanin sadarwa. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kwatanta-kunshin-intanet/` | 77 | English route label marked as fallback | Lura: Wannan shafin Hausa yana shiryarwa ne. Cikakken teburin kwatantawa yana kan shafin Turanci yanzu, kuma duk farashi ya kamata a tabbatar daga kamfanin sadarwa kafin siye. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/lambar-shafi-pdf/` | 82 | English route label marked as fallback | Bude shafin Turanci | Batch 2 - Document, PDF, invoice, and Naira cleanup |
| `/ha/kayan-aiki/lambar-shafi-pdf/` | 100 | English route label marked as fallback | Bude shafin Turanci mai aiki idan kana bukatar lissafi, fayil ko cikakken ma'amala. | Batch 2 - Document, PDF, invoice, and Naira cleanup |
| `/ha/kayan-aiki/lambar-shafi-pdf/` | 109 | English route label marked as fallback | Cikakken aikin sanya lambobin shafi yana kan shafin Turanci yanzu, amma fayil yana aiki a burauza kamar sauran kayan PDF. | Batch 2 - Document, PDF, invoice, and Naira cleanup |
| `/ha/kayan-aiki/lambar-shafi-pdf/` | 116 | English route label marked as fallback | Shafin Turanci Cikakken aikin da aka kiyaye daga asali. | Batch 2 - Document, PDF, invoice, and Naira cleanup |
| `/ha/kayan-aiki/lambobin-ussd/` | 80 | brand or platform name | Duba lambar ragowar kudi, bayanan intanet, katin waya, tura kudi, bashi da taimakon kwastoma. Najeriya ta bude da MTN, Airtel, Glo da 9mobile, sannan za ka iya zabar wasu kasashe daga bayanan sadarwa. | Batch 2 - Telecom and USSD visible-copy cleanup |
| `/ha/kayan-aiki/lambobin-ussd/` | 90 | brand or platform name | misali ragowar kudi, tura kudi, MTN... | Batch 2 - Telecom and USSD visible-copy cleanup |
| `/ha/kayan-aiki/mai-fassara-hausa/` | 64 | English route label marked as fallback | Idan kana son cikakken kundin jimlolin Turanci zuwa Hausa, akwai shafin Turanci da ke da karin misalai. An nuna shi a fili domin kada a dauka dukkan tsohon shafin ya riga ya zama Hausa. | Batch 2 - Language and translation hub cleanup |
| `/ha/kayan-aiki/neman-tallafin-karatu/` | 15 | English route label marked as fallback | Tace bukata Matakin karatu Digiri na farko Digiri na biyu Horon sana'a Gajeren kwas Fanni Kimiyya da fasaha Lafiya Kasuwanci Noma Kowane fanni Inda kake nema Nigeria Afrika Waje Shirya jerin bukata Gaskiyar neman tall... | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/rajistar-layin-waya-nin/` | 15 | brand or platform name | Hausa / Sadarwa / Rajistar layi Rajistar layin waya da NIN Shirya abin da za ka duba kafin zuwa ofishin MTN, Airtel, Glo ko 9mobile: NIN, shaidar mutum, lambar waya da sakon tabbatarwa. Wannan shafi ba ya duba bayanan... | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/rajistar-layin-waya-nin/` | 16 | English route label marked as fallback | Jerin abin dubawa NIN Tabbatar cewa lambar ka tana nan kuma sunan ya yi daidai da shaidar ka. Shaida Dauki katin shaida, fasfo ko wata takarda da kamfanin sadarwa ya karba. Lambar waya Rubuta lambar da ake so a hada k... | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/ribar-kiwon-kifi/` | 15 | English route label marked as fallback | Bayanan kiwon kifi Yawan kifi Nauyin sayarwa, kg Farashi a kg Kifin da zai kai sayarwa, kashi Kudin abinci Sauran kudade Lissafa riba Abin da ke iya sauya riba Mutuwar kifi, tsadar abinci, yanayin ruwa, farashin kasuw... | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/rubuta-wasikar-aiki/` | 15 | English route label marked as fallback | Bayanan wasika Aikin da ake nema Sunan kamfani Kwarewar da tafi dacewa na iya kula da abokin ciniki, rubuta rahoto, da aiki cikin tsari Rubuta daftari Kafin aikawa Karanta wasikar da kanka, ka cire kalmomin da ba su d... | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/takardar-albashi/` | 82 | English route label marked as fallback | Bude shafin Turanci | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/kayan-aiki/takardar-albashi/` | 100 | English route label marked as fallback | Bude shafin Turanci mai aiki idan kana bukatar lissafi, fayil ko cikakken ma'amala. | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/kayan-aiki/takardar-albashi/` | 116 | English route label marked as fallback | Shafin Turanci Cikakken aikin da aka kiyaye daga asali. | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/kayan-aiki/tazarar-riba/` | 82 | English route label marked as fallback | Bude shafin Turanci | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/tazarar-riba/` | 100 | English route label marked as fallback | Bude shafin Turanci mai aiki idan kana bukatar lissafi, fayil ko cikakken ma'amala. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/tazarar-riba/` | 116 | English route label marked as fallback | Shafin Turanci Cikakken aikin da aka kiyaye daga asali. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/waya-ko-banki/` | 82 | English route label marked as fallback | Bude shafin Turanci | Batch 2 - General Hausa visible-copy cleanup |

## ACCEPTED_TECH_TERM

Accepted terms: `PDF`, `API`, `JSON`, `USSD`, `JAMB`, `WAEC`, `NECO`, `NYSC`, `VAT`, `PAYE`, `BVN`, `NIN`, `FIRS`, `HTML`, `CSV`, `ZIP`.

The JSON ledger contains line-level accepted-term examples. These are tracked so future cleanup prompts do not waste time translating normal acronyms.

## CLEAN

- `/ha/harshe-da-fassara/`
- `/ha/ilimi/`
- `/ha/`
- `/ha/jamb/fisiks/`
- `/ha/jamb/halittu/`
- `/ha/jamb/turanci/`
- `/ha/kayan-aiki/abincin-afirka/`
- `/ha/kayan-aiki/alawus-na-nysc/`
- `/ha/kayan-aiki/cajin-banki/`
- `/ha/kayan-aiki/canja-kudi/`
- `/ha/kayan-aiki/canza-pdf/`
- `/ha/kayan-aiki/cit-najeriya/`
- `/ha/kayan-aiki/darajar-katin-waya/`
- `/ha/kayan-aiki/duba-cac/`
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
- `/ha/kayan-aiki/rajistar-kasuwanci/`
- `/ha/kayan-aiki/ribar-gona/`
- `/ha/kayan-aiki/sanya-hannu-pdf/`
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
