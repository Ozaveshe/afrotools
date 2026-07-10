# Hausa Visible Copy Leakage Ledger

Generated: 2026-07-10

This audit scans `ha/**/*.html` for visible English leakage only. It ignores scripts, styles, head metadata, JSON blobs, URLs, code/pre blocks, and accepted technical acronyms.

## Headline Metrics

- Hausa routes scanned: 92
- Clean routes: 43
- Routes with blockers: 0
- BLOCKER_VISIBLE_ENGLISH findings: 0
- POSSIBLE_FALSE_POSITIVE findings: 160
- ACCEPTED_TECH_TERM findings: 617

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
| `/ha/albashi-da-haraji/` | 573 | brand or platform name | Shafi na Turanci Lissafin kudin Paystack Kiyasta kudin hanyar karbar kudi don sayarwa ta yanar gizo da takardun kudi. Bude kayan aiki | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/albashi-da-haraji/` | 645 | brand or platform name | Yi takardar kudi, duba VAT, sannan ka kiyasta kudin banki ko Paystack idan ana biyan ka ta yanar gizo. | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/jamb/adabi/` | 101 | English route label marked as fallback | Jagorar Hausa don JAMB Adabi: wakoki, labari, wasan kwaikwayo, salo, jigo da fahimtar rubutu. Tambayoyin shekarun da suka gabata suna nan a shafin Turanci; wannan shafin yana taimaka maka fahimtar abin da za ka karant... | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/adabi/` | 126 | English route label marked as fallback | Darasi Jigo da salo Ka fara da maanar kalmomi, ka rubuta gajeren bayani, sannan ka yi atisaye daga tambayoyin da ke shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/adabi/` | 127 | English route label marked as fallback | Darasi Waka da karin magana Ka fara da maanar kalmomi, ka rubuta gajeren bayani, sannan ka yi atisaye daga tambayoyin da ke shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/adabi/` | 128 | English route label marked as fallback | Darasi Labari da halaye Ka fara da maanar kalmomi, ka rubuta gajeren bayani, sannan ka yi atisaye daga tambayoyin da ke shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/adabi/` | 129 | English route label marked as fallback | Darasi Wasan kwaikwayo da yanayi Ka fara da maanar kalmomi, ka rubuta gajeren bayani, sannan ka yi atisaye daga tambayoyin da ke shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/adabi/` | 135 | English route label marked as fallback | Karanta mahimman kalmomi a Hausa, sannan ka bude shafin Turanci domin tambayoyin asali. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/adabi/` | 137 | English route label marked as fallback | Kar ka dauka an kirkiri shafukan shekarun Hausa. Ajiyar shekaru tana kan asalin shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/cbt/` | 115 | English route label marked as fallback | Sakamako. Bayan mikawa, shafin Turanci zai nuna maki, bangarorin da aka fi bukatar bita da tarihin gwaji a na'urarka. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/crk/` | 101 | English route label marked as fallback | Jagorar Hausa don JAMB CRK: littafin Bible, rayuwar Yesu, annabawa, manzanni da dabiun Kirista. Tambayoyin shekarun da suka gabata suna nan a shafin Turanci; wannan shafin yana taimaka maka fahimtar abin da za ka kara... | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/crk/` | 126 | English route label marked as fallback | Darasi Tsohon Alkawari Ka fara da maanar kalmomi, ka rubuta gajeren bayani, sannan ka yi atisaye daga tambayoyin da ke shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/crk/` | 127 | English route label marked as fallback | Darasi Rayuwar Yesu Ka fara da maanar kalmomi, ka rubuta gajeren bayani, sannan ka yi atisaye daga tambayoyin da ke shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/crk/` | 128 | English route label marked as fallback | Darasi Manzanni da cocin farko Ka fara da maanar kalmomi, ka rubuta gajeren bayani, sannan ka yi atisaye daga tambayoyin da ke shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/crk/` | 129 | English route label marked as fallback | Darasi Dabiun Kirista Ka fara da maanar kalmomi, ka rubuta gajeren bayani, sannan ka yi atisaye daga tambayoyin da ke shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/crk/` | 135 | English route label marked as fallback | Karanta mahimman kalmomi a Hausa, sannan ka bude shafin Turanci domin tambayoyin asali. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/crk/` | 137 | English route label marked as fallback | Kar ka dauka an kirkiri shafukan shekarun Hausa. Ajiyar shekaru tana kan asalin shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/gwamnati/` | 101 | English route label marked as fallback | Jagorar Hausa don JAMB Gwamnati: kundin tsarin mulki, tarayya, jamiyyu, zabe da tarihin siyasar Najeriya. Tambayoyin shekarun da suka gabata suna nan a shafin Turanci; wannan shafin yana taimaka maka fahimtar abin da ... | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/gwamnati/` | 126 | English route label marked as fallback | Darasi Kundin tsarin mulki Ka fara da maanar kalmomi, ka rubuta gajeren bayani, sannan ka yi atisaye daga tambayoyin da ke shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/gwamnati/` | 127 | English route label marked as fallback | Darasi Tarayya da raba iko Ka fara da maanar kalmomi, ka rubuta gajeren bayani, sannan ka yi atisaye daga tambayoyin da ke shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/gwamnati/` | 128 | English route label marked as fallback | Darasi Jamiyyu da zabe Ka fara da maanar kalmomi, ka rubuta gajeren bayani, sannan ka yi atisaye daga tambayoyin da ke shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/gwamnati/` | 129 | English route label marked as fallback | Darasi Tarihin siyasar Najeriya Ka fara da maanar kalmomi, ka rubuta gajeren bayani, sannan ka yi atisaye daga tambayoyin da ke shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/gwamnati/` | 135 | English route label marked as fallback | Karanta mahimman kalmomi a Hausa, sannan ka bude shafin Turanci domin tambayoyin asali. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/gwamnati/` | 137 | English route label marked as fallback | Kar ka dauka an kirkiri shafukan shekarun Hausa. Ajiyar shekaru tana kan asalin shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/` | 469 | English route label marked as fallback | Karanta jagorar Hausa kan yadda za a tambayi mai taimakon AI, sannan bude shafin Turanci idan kana bukatar amsa. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/kasuwanci/` | 101 | English route label marked as fallback | Jagorar Hausa don JAMB Kasuwanci: ciniki, banki, inshora, sufuri, tallace-tallace da nauin kamfani. Tambayoyin shekarun da suka gabata suna nan a shafin Turanci; wannan shafin yana taimaka maka fahimtar abin da za ka ... | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/kasuwanci/` | 126 | English route label marked as fallback | Darasi Ciniki da kasuwa Ka fara da maanar kalmomi, ka rubuta gajeren bayani, sannan ka yi atisaye daga tambayoyin da ke shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/kasuwanci/` | 127 | English route label marked as fallback | Darasi Banki da inshora Ka fara da maanar kalmomi, ka rubuta gajeren bayani, sannan ka yi atisaye daga tambayoyin da ke shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/kasuwanci/` | 128 | English route label marked as fallback | Darasi Sufuri da sadarwa Ka fara da maanar kalmomi, ka rubuta gajeren bayani, sannan ka yi atisaye daga tambayoyin da ke shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/kasuwanci/` | 129 | English route label marked as fallback | Darasi Kamfani da takardun kasuwanci Ka fara da maanar kalmomi, ka rubuta gajeren bayani, sannan ka yi atisaye daga tambayoyin da ke shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/kasuwanci/` | 135 | English route label marked as fallback | Karanta mahimman kalmomi a Hausa, sannan ka bude shafin Turanci domin tambayoyin asali. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/kasuwanci/` | 137 | English route label marked as fallback | Kar ka dauka an kirkiri shafukan shekarun Hausa. Ajiyar shekaru tana kan asalin shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/kimiyya/` | 66 | English route label marked as fallback | Abubuwan atisaye Atom da jadawali Ka fahimci proton, neutron, electron da yanayin sinadari. Ma'auni Daidaita ma'aunin sinadarai kafin lissafi. Acid da alkali Rarrabe pH, daidaitawa da gishiri. Sinadaran carbon Ka gane... | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/lissafi/` | 54 | English route label marked as fallback | Hausa / JAMB / Lissafi JAMB Lissafi Shirya tambayoyin lamba, algebra, geometry, kididdiga da amfani da ka'idoji. Tsoffin tambayoyi suna kan shafin Turanci, amma wannan jagora yana bayyana yadda za a fara a Hausa. Akwa... | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/lissafi/` | 68 | English route label marked as fallback | Abubuwan da suka fi muhimmanci Algebra Warware ma'auni, jeri da sauya alama cikin natsuwa. Geometry Ka tuna kusurwa, siffa, yanki da girma. Kididdiga Ma'ana, matsakaici, yiwuwar faruwa da karatun jadawali. Dabara Fara... | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/tarihi/` | 101 | English route label marked as fallback | Jagorar Hausa don JAMB Tarihi: alummomi, mulkin mallaka, yanci, gwamnati da manyan sauye-sauye. Tambayoyin shekarun da suka gabata suna nan a shafin Turanci; wannan shafin yana taimaka maka fahimtar abin da za ka kara... | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/tarihi/` | 126 | English route label marked as fallback | Darasi Tarihin Afirka Ka fara da maanar kalmomi, ka rubuta gajeren bayani, sannan ka yi atisaye daga tambayoyin da ke shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/tarihi/` | 127 | English route label marked as fallback | Darasi Mulkin mallaka da yanci Ka fara da maanar kalmomi, ka rubuta gajeren bayani, sannan ka yi atisaye daga tambayoyin da ke shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/tarihi/` | 128 | English route label marked as fallback | Darasi Tarihin Najeriya Ka fara da maanar kalmomi, ka rubuta gajeren bayani, sannan ka yi atisaye daga tambayoyin da ke shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/tarihi/` | 129 | English route label marked as fallback | Darasi Kungiyoyi da manufofi Ka fara da maanar kalmomi, ka rubuta gajeren bayani, sannan ka yi atisaye daga tambayoyin da ke shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/tarihi/` | 135 | English route label marked as fallback | Karanta mahimman kalmomi a Hausa, sannan ka bude shafin Turanci domin tambayoyin asali. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/tarihi/` | 137 | English route label marked as fallback | Kar ka dauka an kirkiri shafukan shekarun Hausa. Ajiyar shekaru tana kan asalin shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/tattalin-arziki/` | 101 | English route label marked as fallback | Jagorar Hausa don JAMB Tattalin arziki: bukata da wadata, kasuwa, kudin kasa, kasuwanci da tattalin arzikin Najeriya. Tambayoyin shekarun da suka gabata suna nan a shafin Turanci; wannan shafin yana taimaka maka fahim... | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/tattalin-arziki/` | 126 | English route label marked as fallback | Darasi Bukatun kaya da wadata Ka fara da maanar kalmomi, ka rubuta gajeren bayani, sannan ka yi atisaye daga tambayoyin da ke shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/tattalin-arziki/` | 127 | English route label marked as fallback | Darasi Tsarin kasuwa da farashi Ka fara da maanar kalmomi, ka rubuta gajeren bayani, sannan ka yi atisaye daga tambayoyin da ke shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/tattalin-arziki/` | 128 | English route label marked as fallback | Darasi Kudi, banki da hauhawar farashi Ka fara da maanar kalmomi, ka rubuta gajeren bayani, sannan ka yi atisaye daga tambayoyin da ke shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/tattalin-arziki/` | 129 | English route label marked as fallback | Darasi Tattalin arzikin Najeriya Ka fara da maanar kalmomi, ka rubuta gajeren bayani, sannan ka yi atisaye daga tambayoyin da ke shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/tattalin-arziki/` | 135 | English route label marked as fallback | Karanta mahimman kalmomi a Hausa, sannan ka bude shafin Turanci domin tambayoyin asali. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/tattalin-arziki/` | 137 | English route label marked as fallback | Kar ka dauka an kirkiri shafukan shekarun Hausa. Ajiyar shekaru tana kan asalin shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/tutor/` | 134 | English route label marked as fallback | Ba mu canza aikin AI, iyakar amfani, hanyar aika tambaya ko sakamakon da tsarin yake bayarwa ba. Wannan shafin Hausa yana bayyana abin da zai faru kafin ka bude shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/kasuwanci-da-haraji/` | 147 | English route label marked as fallback | Karin hanyoyin kasuwanci Wadannan hanyoyin suna taimaka wa mai kasuwanci ya shirya takardu, rajista da bincike. Inda shafin Hausa bai fito ba tukuna, mun nuna shafin Turanci a fili. | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/kayan-aiki/abincin-dabbobi/` | 20 | English route label marked as fallback | Bayanan kiwo Yawan dabbobi Nauyin kowace dabba, kg Abinci bisa nauyi, kashi Farashin kg daya Lissafa abinci Abin da wannan kiyasi yake nufi Adadin abinci ya dogara da nauyi, shekarun dabba, yanayin kiwo, ciyawa da ake... | Batch 2 - Health and family visible-copy cleanup |
| `/ha/kayan-aiki/amfanin-bayanan-intanet/` | 19 | brand or platform name | Tsallake zuwa babban abun ciki Hausa / Sadarwa / Intanet Kiyasin amfani da intanet Kiyasta GB da kake bukata a wata daga lilo, bidiyo, sautin kira, karatu, aiki da WhatsApp. Sakamako kiyasi ne; tsare-tsaren kamfanin s... | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/amfanin-bayanan-intanet/` | 20 | English route label marked as fallback | Amfani na yau da kullum Lilo a rana, sa'o'i Bidiyo a rana, sa'o'i Kiran bidiyo a mako, sa'o'i Karatu ko aiki a rana, sa'o'i Lissafa GB Kwafi sakamako Sauke TXT Yadda aka yi kiyasi Kayan aikin yana amfani da matsakaici... | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/cgt-najeriya/` | 84 | English route label marked as fallback | Bude shafin Turanci | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/cgt-najeriya/` | 102 | English route label marked as fallback | Bude shafin Turanci mai aiki idan kana bukatar lissafi, fayil ko cikakken ma'amala. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/cgt-najeriya/` | 118 | English route label marked as fallback | Shafin Turanci Cikakken aikin da aka kiyaye daga asali. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/dawo-da-jari/` | 84 | English route label marked as fallback | Bude shafin Turanci | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/dawo-da-jari/` | 102 | English route label marked as fallback | Bude shafin Turanci mai aiki idan kana bukatar lissafi, fayil ko cikakken ma'amala. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/dawo-da-jari/` | 118 | English route label marked as fallback | Shafin Turanci Cikakken aikin da aka kiyaye daga asali. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/farashin-kayayyakin-gona/` | 20 | English route label marked as fallback | Kiyasin kudin shiga Adadi Farashi a kan daya Kudin sufuri da ajiya Ragin lalacewa, kashi Kiyasta kudin shiga Abin lura ga manomi da dan kasuwa Ka duba farashi fiye da kasuwa daya idan zai yiwu. Kudin sufuri, ajiya, na... | Batch 2 - Agriculture visible-copy cleanup |
| `/ha/kayan-aiki/gwajin-ussd/` | 99 | English route label marked as fallback | Bude shafin Turanci | Batch 2 - Telecom and USSD visible-copy cleanup |
| `/ha/kayan-aiki/gwajin-ussd/` | 117 | English route label marked as fallback | Bude shafin Turanci mai aiki idan kana bukatar lissafi, fayil ko cikakken ma'amala. | Batch 2 - Telecom and USSD visible-copy cleanup |
| `/ha/kayan-aiki/gwajin-ussd/` | 133 | English route label marked as fallback | Shafin Turanci Cikakken aikin da aka kiyaye daga asali. | Batch 2 - Telecom and USSD visible-copy cleanup |
| `/ha/kayan-aiki/gyara-pdf/` | 84 | English route label marked as fallback | Bude shafin Turanci | Batch 2 - Document, PDF, invoice, and Naira cleanup |
| `/ha/kayan-aiki/gyara-pdf/` | 102 | English route label marked as fallback | Bude shafin Turanci mai aiki idan kana bukatar lissafi, fayil ko cikakken ma'amala. | Batch 2 - Document, PDF, invoice, and Naira cleanup |
| `/ha/kayan-aiki/gyara-pdf/` | 118 | English route label marked as fallback | Shafin Turanci Cikakken aikin da aka kiyaye daga asali. | Batch 2 - Document, PDF, invoice, and Naira cleanup |
| `/ha/kayan-aiki/` | 542 | brand or platform name | Akwai da Hausa Matsa PDF Rage girman PDF don loda fayil, imel, tashar yanar gizo ko WhatsApp. Bude kayan aiki | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 545 | English route label marked as fallback | Akwai da Hausa Wurin aikin PDF Fara daga wuri daya: hada PDF, raba PDF, matsa PDF ko bude babban shafin Turanci idan ana bukata. Bude kayan aiki | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 578 | brand or platform name | Akwai da Hausa Link din WhatsApp Gina link din wa.me, sako, QR da tarin hanyoyi don kasuwanci. Bude kayan aiki | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 587 | brand or platform name | Akwai da Hausa Kiyasin amfani da intanet Kiyasta yawan bayanan intanet da lilo, bidiyo, WhatsApp da aiki ke bukata. Bude kayan aiki | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 608 | brand or platform name | Akwai da Hausa Kalkuletan Paystack Kiyasta caji da abin da zai shigo bayan cire kudin Paystack, sannan tabbatar da jadawalin kamfani. Bude jagora | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/kalkuletan-gpa-cgpa/` | 20 | English route label marked as fallback | Bayanan maki Jimillar maki na zango Jimillar raka'o'i na zango Jimillar maki na baya Raka'o'in baya Lissafa Abin lura Wasu jami'o'i suna amfani da 5.0, wasu 4.0. Wannan kayan aiki yana raba jimillar maki da jimillar r... | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kalkuletan-paystack/` | 79 | brand or platform name | AfroTools Hausa / Kayan aiki / Kalkuletan Paystack a Hausa breadcrumb | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kalkuletan-paystack/` | 81 | brand or platform name | Kiyasta abin da zai shigo bayan cajin Paystack. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kalkuletan-paystack/` | 82 | brand or platform name | Jagorar Hausa don kiyasta cajin Paystack, abin da zai shigo bayan cire caji, da bukatar tabbatar da jadawalin kamfanin kafin amfani. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kalkuletan-paystack/` | 84 | English route label marked as fallback | Bude shafin Turanci | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kalkuletan-paystack/` | 95 | brand or platform name | Abin lura Ka tabbatar da sabon jadawalin Paystack kafin saka farashi ko aika takardar kudi | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kalkuletan-paystack/` | 102 | English route label marked as fallback | Bude shafin Turanci mai aiki idan kana bukatar lissafi, fayil ko cikakken ma'amala. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kalkuletan-paystack/` | 111 | brand or platform name | Paystack na iya sauya caji, haraji ko sharuddan biya. Wannan jagora ba sanarwar hukuma ba ce. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kalkuletan-paystack/` | 118 | English route label marked as fallback | Shafin Turanci Cikakken aikin da aka kiyaye daga asali. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kalkuletan-paystack/` | 127 | brand or platform name | Shirya kudin Paystack da abin da abokin ciniki zai biya | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kalkuletan-paystack/` | 129 | brand or platform name | Tushen bayani: Tabbatar da sabon kudin gateway daga shafin Paystack ko yarjejeniyar kasuwancinka. Duba sabunta bayanai na 2026 kafin amfani. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kalkuletan-paystack/` | 131 | brand or platform name | Shirya kudin Paystack da abin da abokin ciniki zai biya | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kalkuletan-waec-neco/` | 166 | brand or platform name |  WhatsApp | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/kayan-aiki/karin-farashi/` | 99 | English route label marked as fallback | Bude shafin Turanci | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/karin-farashi/` | 117 | English route label marked as fallback | Bude shafin Turanci mai aiki idan kana bukatar lissafi, fayil ko cikakken ma'amala. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/karin-farashi/` | 133 | English route label marked as fallback | Shafin Turanci Cikakken aikin da aka kiyaye daga asali. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kasafin-dalibi/` | 37 | English route label marked as fallback | Bayanan kudi Kudin da zai shigo Kudin makaranta Haya ko masauki Abinci Sufuri Littattafai da yan bukatu Lissafa kasafi Kwafa brief din kasafi Yadda za a karanta sakamako Idan ragowar kudi ya yi kasa, fara rage abin da... | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kirkiro-invoice/` | 619 | brand or platform name | Kudin wayar hannu / WhatsApp | Batch 2 - Document, PDF, invoice, and Naira cleanup |
| `/ha/kayan-aiki/kirkiro-invoice/` | 620 | brand or platform name | M-Pesa, MoMo, Airtel Money, WhatsApp | Batch 2 - Document, PDF, invoice, and Naira cleanup |
| `/ha/kayan-aiki/kirkiro-invoice/` | 898 | brand or platform name | Eh. Saka hanyar biyan kudi, link din biya, kudin wayar hannu ko WhatsApp, da bayanan banki domin PDF ya nuna wa abokin ciniki yadda zai biya. | Batch 2 - Document, PDF, invoice, and Naira cleanup |
| `/ha/kayan-aiki/kudin-maikaci/` | 96 | English route label marked as fallback | Bude shafin Turanci | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kudin-maikaci/` | 119 | English route label marked as fallback | Wannan lissafi na Hausa yana amfani da abin da ka saka da kanka. Ya dace da kasafin daukar ma'aikaci kafin ka bude cikakken shafin Turanci ko ka tura bayanai ga HR. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kudin-maikaci/` | 148 | English route label marked as fallback | Bude shafin Turanci mai aiki idan kana bukatar lissafi, fayil ko cikakken ma'amala. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kudin-maikaci/` | 164 | English route label marked as fallback | Shafin Turanci Cikakken aikin da aka kiyaye daga asali. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kudin-tura-kudi-ta-waya/` | 19 | brand or platform name | Tsallake zuwa babban abun ciki Hausa / Sadarwa / Tura kudi Kudin tura kudi ta waya Kiyasta caji kafin aika kudi ta OPay, M-Pesa, Airtel ko makamantansu. Wannan ba jadawalin hukuma ba ne; tabbatar da manhaja ko wakili ... | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kudin-tura-kudi-ta-waya/` | 20 | English route label marked as fallback | Bayanan tura kudi Adadin da za a aika Hanyar biya Asusun waya zuwa asusun waya Wakili ko cire kudi Asusun banki Kiyasta caji Ka tabbatar kafin aika kudi Kudin caji na iya sauyawa bisa kasa, mai bayar da sabis, matsayi... | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kwatanta-aika-kudi/` | 101 | English route label marked as fallback | Bude shafin Turanci | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kwatanta-aika-kudi/` | 193 | English route label marked as fallback | Bude shafin Turanci mai aiki idan kana bukatar lissafi, fayil ko cikakken ma'amala. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kwatanta-aika-kudi/` | 217 | English route label marked as fallback | Shafin Turanci Cikakken aikin da aka kiyaye daga asali. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kwatanta-kunshin-intanet/` | 99 | brand or platform name | Kamfani MTN, Airtel, Glo, 9mobile ko wani kamfanin sadarwa. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kwatanta-kunshin-intanet/` | 117 | English route label marked as fallback | Lura: Wannan shafin Hausa yana shiryarwa ne. Cikakken teburin kwatantawa yana kan shafin Turanci yanzu, kuma duk farashi ya kamata a tabbatar daga kamfanin sadarwa kafin siye. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kwatanta-kunshin-intanet/` | 118 | brand or platform name | Hanyar tsara da tushe: Wannan shafi yana taimaka maka ka tsara abin da za ka kwatanta: kamfani, GB, farashi, tsawon aiki da tabbacin USSD ko app. Ba ya karbo farashi live daga MTN, Airtel, Glo ko 9mobile. Atunse: June... | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/lambar-shafi-pdf/` | 84 | English route label marked as fallback | Bude shafin Turanci | Batch 2 - Document, PDF, invoice, and Naira cleanup |
| `/ha/kayan-aiki/lambar-shafi-pdf/` | 102 | English route label marked as fallback | Bude shafin Turanci mai aiki idan kana bukatar lissafi, fayil ko cikakken ma'amala. | Batch 2 - Document, PDF, invoice, and Naira cleanup |
| `/ha/kayan-aiki/lambar-shafi-pdf/` | 111 | English route label marked as fallback | Cikakken aikin sanya lambobin shafi yana kan shafin Turanci yanzu, amma fayil yana aiki a burauza kamar sauran kayan PDF. | Batch 2 - Document, PDF, invoice, and Naira cleanup |
| `/ha/kayan-aiki/lambar-shafi-pdf/` | 118 | English route label marked as fallback | Shafin Turanci Cikakken aikin da aka kiyaye daga asali. | Batch 2 - Document, PDF, invoice, and Naira cleanup |
| `/ha/kayan-aiki/lambobin-ussd/` | 101 | brand or platform name | Duba lambar ragowar kudi, bayanan intanet, katin waya, tura kudi, bashi da taimakon kwastoma. Najeriya ta bude da MTN, Airtel, Glo da 9mobile, sannan za ka iya zabar wasu kasashe daga bayanan sadarwa. | Batch 2 - Telecom and USSD visible-copy cleanup |
| `/ha/kayan-aiki/lambobin-ussd/` | 111 | brand or platform name | misali ragowar kudi, tura kudi, MTN... | Batch 2 - Telecom and USSD visible-copy cleanup |
| `/ha/kayan-aiki/mai-fassara-hausa/` | 101 | English route label marked as fallback | Idan kana son cikakken kundin jimlolin Turanci zuwa Hausa, akwai shafin Turanci da ke da karin misalai. An nuna shi a fili domin kada a dauka dukkan tsohon shafin ya riga ya zama Hausa. | Batch 2 - Language and translation hub cleanup |
| `/ha/kayan-aiki/neman-tallafin-karatu/` | 51 | English route label marked as fallback | Tace bukata Matakin karatu Digiri na farko Digiri na biyu Horon sana'a Gajeren kwas Fanni Kimiyya da fasaha Lafiya Kasuwanci Noma Kowane fanni Inda kake nema Nigeria Afrika Waje Shirya jerin bukata Gaskiyar neman tall... | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/rajistar-layin-waya-nin/` | 95 | brand or platform name | MTN | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/rajistar-layin-waya-nin/` | 96 | brand or platform name | Airtel | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/rajistar-layin-waya-nin/` | 97 | brand or platform name | Glo | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/rajistar-layin-waya-nin/` | 98 | brand or platform name | 9mobile | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/rajistar-layin-waya-nin/` | 254 | brand or platform name | MTN Nigeria Misalin shafin kamfani don duba kunshin data da sabon farashi. Duba MTN | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/rajistar-layin-waya-nin/` | 255 | brand or platform name | Airtel Nigeria Misalin shafin kamfani don tabbatar da kunshi da farashi. Duba Airtel | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/ribar-kiwon-kifi/` | 20 | English route label marked as fallback | Bayanan kiwon kifi Yawan kifi Nauyin sayarwa, kg Farashi a kg Kifin da zai kai sayarwa, kashi Kudin abinci Sauran kudade Lissafa riba Abin da ke iya sauya riba Mutuwar kifi, tsadar abinci, yanayin ruwa, farashin kasuw... | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/rubuta-wasikar-aiki/` | 65 | English route label marked as fallback | Idan kana son samfurori da fitarwa zuwa PDF ko Word, bude shafin Turanci . | Batch 2 - General Hausa visible-copy cleanup |

## ACCEPTED_TECH_TERM

Accepted terms: `PDF`, `API`, `JSON`, `USSD`, `JAMB`, `WAEC`, `NECO`, `NYSC`, `VAT`, `PAYE`, `BVN`, `NIN`, `FIRS`, `HTML`, `CSV`, `ZIP`.

The JSON ledger contains line-level accepted-term examples. These are tracked so future cleanup prompts do not waste time translating normal acronyms.

## CLEAN

- `/ha/harshe-da-fassara/`
- `/ha/ilimi/`
- `/ha/`
- `/ha/jamb/fisiks/`
- `/ha/jamb/halittu/`
- `/ha/jamb/past-questions/`
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
