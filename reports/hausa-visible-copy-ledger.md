# Hausa Visible Copy Leakage Ledger

Generated: 2026-07-14

This audit scans `ha/**/*.html` for visible English leakage only. It ignores scripts, styles, head metadata, JSON blobs, URLs, code/pre blocks, and accepted technical acronyms.

## Headline Metrics

- Hausa routes scanned: 105
- Clean routes: 43
- Routes with blockers: 0
- BLOCKER_VISIBLE_ENGLISH findings: 0
- POSSIBLE_FALSE_POSITIVE findings: 168
- ACCEPTED_TECH_TERM findings: 630

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
| `/ha/albashi-da-haraji/` | 575 | brand or platform name | Shafi na Turanci Lissafin kudin Paystack Kiyasta kudin hanyar karbar kudi don sayarwa ta yanar gizo da takardun kudi. Bude kayan aiki | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/albashi-da-haraji/` | 647 | brand or platform name | Yi takardar kudi, duba VAT, sannan ka kiyasta kudin banki ko Paystack idan ana biyan ka ta yanar gizo. | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/allon-aiki/` | 31 | English route label marked as fallback | Harshen shafi da ƙasar da bayanai suka shafa abubuwa ne daban. Ci gaba ba zai sauya ƙasar da ka zaɓa ba. Za mu aika da hanyar komawa idan shafin Turanci yana goyon bayansu. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/allon-aiki/` | 35 | English route label marked as fallback | Ci gaba zuwa shafin Turanci | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/farashi/` | 31 | English route label marked as fallback | Harshen shafi da ƙasar da bayanai suka shafa abubuwa ne daban. Ci gaba ba zai sauya ƙasar da ka zaɓa ba. Za mu aika da hanyar komawa idan shafin Turanci yana goyon bayansu. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/farashi/` | 35 | English route label marked as fallback | Ci gaba zuwa shafin Turanci | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/game-da-mu/` | 31 | English route label marked as fallback | Harshen shafi da ƙasar da bayanai suka shafa abubuwa ne daban. Ci gaba ba zai sauya ƙasar da ka zaɓa ba. Za mu aika da hanyar komawa idan shafin Turanci yana goyon bayansu. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/game-da-mu/` | 35 | English route label marked as fallback | Ci gaba zuwa shafin Turanci | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/inshora/` | 31 | English route label marked as fallback | Harshen shafi da ƙasar da bayanai suka shafa abubuwa ne daban. Ci gaba ba zai sauya ƙasar da ka zaɓa ba. Za mu aika da hanyar komawa idan shafin Turanci yana goyon bayansu. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/inshora/` | 35 | English route label marked as fallback | Ci gaba zuwa shafin Turanci | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/jamb/adabi/` | 101 | English route label marked as fallback | Jagorar Hausa don JAMB Adabi: wakoki, labari, wasan kwaikwayo, salo, jigo da fahimtar rubutu. Tambayoyin shekarun da suka gabata suna nan a shafin Turanci; wannan shafin yana taimaka maka fahimtar abin da za ka karant... | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/adabi/` | 126 | English route label marked as fallback | Darasi Jigo da salo Ka fara da maanar kalmomi, ka rubuta gajeren bayani, sannan ka yi atisaye daga tambayoyin da ke shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/adabi/` | 135 | English route label marked as fallback | Karanta mahimman kalmomi a Hausa, sannan ka bude shafin Turanci domin tambayoyin asali. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/adabi/` | 137 | English route label marked as fallback | Kar ka dauka an kirkiri shafukan shekarun Hausa. Ajiyar shekaru tana kan asalin shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/cbt/` | 114 | English route label marked as fallback | Sakamako. Bayan mikawa, shafin Turanci zai nuna maki, bangarorin da aka fi bukatar bita da tarihin gwaji a na'urarka. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/crk/` | 101 | English route label marked as fallback | Jagorar Hausa don JAMB CRK: littafin Bible, rayuwar Yesu, annabawa, manzanni da dabiun Kirista. Tambayoyin shekarun da suka gabata suna nan a shafin Turanci; wannan shafin yana taimaka maka fahimtar abin da za ka kara... | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/crk/` | 126 | English route label marked as fallback | Darasi Tsohon Alkawari Ka fara da maanar kalmomi, ka rubuta gajeren bayani, sannan ka yi atisaye daga tambayoyin da ke shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/crk/` | 135 | English route label marked as fallback | Karanta mahimman kalmomi a Hausa, sannan ka bude shafin Turanci domin tambayoyin asali. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/crk/` | 137 | English route label marked as fallback | Kar ka dauka an kirkiri shafukan shekarun Hausa. Ajiyar shekaru tana kan asalin shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/gwamnati/` | 101 | English route label marked as fallback | Jagorar Hausa don JAMB Gwamnati: kundin tsarin mulki, tarayya, jamiyyu, zabe da tarihin siyasar Najeriya. Tambayoyin shekarun da suka gabata suna nan a shafin Turanci; wannan shafin yana taimaka maka fahimtar abin da ... | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/gwamnati/` | 126 | English route label marked as fallback | Darasi Kundin tsarin mulki Ka fara da maanar kalmomi, ka rubuta gajeren bayani, sannan ka yi atisaye daga tambayoyin da ke shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/gwamnati/` | 135 | English route label marked as fallback | Karanta mahimman kalmomi a Hausa, sannan ka bude shafin Turanci domin tambayoyin asali. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/gwamnati/` | 137 | English route label marked as fallback | Kar ka dauka an kirkiri shafukan shekarun Hausa. Ajiyar shekaru tana kan asalin shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/` | 469 | English route label marked as fallback | Karanta jagorar Hausa kan yadda za a tambayi mai taimakon AI, sannan bude shafin Turanci idan kana bukatar amsa. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/kasuwanci/` | 101 | English route label marked as fallback | Jagorar Hausa don JAMB Kasuwanci: ciniki, banki, inshora, sufuri, tallace-tallace da nauin kamfani. Tambayoyin shekarun da suka gabata suna nan a shafin Turanci; wannan shafin yana taimaka maka fahimtar abin da za ka ... | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/kasuwanci/` | 126 | English route label marked as fallback | Darasi Ciniki da kasuwa Ka fara da maanar kalmomi, ka rubuta gajeren bayani, sannan ka yi atisaye daga tambayoyin da ke shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/kasuwanci/` | 135 | English route label marked as fallback | Karanta mahimman kalmomi a Hausa, sannan ka bude shafin Turanci domin tambayoyin asali. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/kasuwanci/` | 137 | English route label marked as fallback | Kar ka dauka an kirkiri shafukan shekarun Hausa. Ajiyar shekaru tana kan asalin shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/kimiyya/` | 68 | English route label marked as fallback | Abubuwan atisaye Atom da jadawali Ka fahimci proton, neutron, electron da yanayin sinadari. Ma'auni Daidaita ma'aunin sinadarai kafin lissafi. Acid da alkali Rarrabe pH, daidaitawa da gishiri. Sinadaran carbon Ka gane... | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/lissafi/` | 56 | English route label marked as fallback | Hausa / JAMB / Lissafi JAMB Lissafi Shirya tambayoyin lamba, algebra, geometry, kididdiga da amfani da ka'idoji. Tsoffin tambayoyi suna kan shafin Turanci, amma wannan jagora yana bayyana yadda za a fara a Hausa. Akwa... | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/lissafi/` | 70 | English route label marked as fallback | Abubuwan da suka fi muhimmanci Algebra Warware ma'auni, jeri da sauya alama cikin natsuwa. Geometry Ka tuna kusurwa, siffa, yanki da girma. Kididdiga Ma'ana, matsakaici, yiwuwar faruwa da karatun jadawali. Dabara Fara... | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/tarihi/` | 101 | English route label marked as fallback | Jagorar Hausa don JAMB Tarihi: alummomi, mulkin mallaka, yanci, gwamnati da manyan sauye-sauye. Tambayoyin shekarun da suka gabata suna nan a shafin Turanci; wannan shafin yana taimaka maka fahimtar abin da za ka kara... | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/tarihi/` | 126 | English route label marked as fallback | Darasi Tarihin Afirka Ka fara da maanar kalmomi, ka rubuta gajeren bayani, sannan ka yi atisaye daga tambayoyin da ke shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/tarihi/` | 135 | English route label marked as fallback | Karanta mahimman kalmomi a Hausa, sannan ka bude shafin Turanci domin tambayoyin asali. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/tarihi/` | 137 | English route label marked as fallback | Kar ka dauka an kirkiri shafukan shekarun Hausa. Ajiyar shekaru tana kan asalin shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/tattalin-arziki/` | 101 | English route label marked as fallback | Jagorar Hausa don JAMB Tattalin arziki: bukata da wadata, kasuwa, kudin kasa, kasuwanci da tattalin arzikin Najeriya. Tambayoyin shekarun da suka gabata suna nan a shafin Turanci; wannan shafin yana taimaka maka fahim... | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/tattalin-arziki/` | 126 | English route label marked as fallback | Darasi Bukatun kaya da wadata Ka fara da maanar kalmomi, ka rubuta gajeren bayani, sannan ka yi atisaye daga tambayoyin da ke shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/tattalin-arziki/` | 135 | English route label marked as fallback | Karanta mahimman kalmomi a Hausa, sannan ka bude shafin Turanci domin tambayoyin asali. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/tattalin-arziki/` | 137 | English route label marked as fallback | Kar ka dauka an kirkiri shafukan shekarun Hausa. Ajiyar shekaru tana kan asalin shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/tutor/` | 133 | English route label marked as fallback | Ba mu canza aikin AI, iyakar amfani, hanyar aika tambaya ko sakamakon da tsarin yake bayarwa ba. Wannan shafin Hausa yana bayyana abin da zai faru kafin ka bude shafin Turanci. | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/kasashe/` | 31 | English route label marked as fallback | Harshen shafi da ƙasar da bayanai suka shafa abubuwa ne daban. Ci gaba ba zai sauya ƙasar da ka zaɓa ba. Za mu aika da hanyar komawa idan shafin Turanci yana goyon bayansu. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kasashe/` | 35 | English route label marked as fallback | Ci gaba zuwa shafin Turanci | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kasuwanci-da-haraji/` | 149 | English route label marked as fallback | Karin hanyoyin kasuwanci Wadannan hanyoyin suna taimaka wa mai kasuwanci ya shirya takardu, rajista da bincike. Inda shafin Hausa bai fito ba tukuna, mun nuna shafin Turanci a fili. | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/kayan-aiki/abincin-dabbobi/` | 24 | English route label marked as fallback | Bayanan kiwo Yawan dabbobi Nauyin kowace dabba, kg Abinci bisa nauyi, kashi Farashin kg daya Lissafa abinci Abin da wannan kiyasi yake nufi Adadin abinci ya dogara da nauyi, shekarun dabba, yanayin kiwo, ciyawa da ake... | Batch 2 - Health and family visible-copy cleanup |
| `/ha/kayan-aiki/amfanin-bayanan-intanet/` | 24 | brand or platform name | Tsallake zuwa babban abun ciki Hausa / Sadarwa / Intanet Kiyasin amfani da intanet Kiyasta GB da kake bukata a wata daga lilo, bidiyo, sautin kira, karatu, aiki da WhatsApp. Sakamako kiyasi ne; tsare-tsaren kamfanin s... | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/amfanin-bayanan-intanet/` | 25 | English route label marked as fallback | Amfani na yau da kullum Lilo a rana, sa'o'i Bidiyo a rana, sa'o'i Kiran bidiyo a mako, sa'o'i Karatu ko aiki a rana, sa'o'i Lissafa GB Kwafi sakamako Sauke TXT Yadda aka yi kiyasi Kayan aikin yana amfani da matsakaici... | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/cgt-najeriya/` | 84 | English route label marked as fallback | Bude shafin Turanci | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/cgt-najeriya/` | 102 | English route label marked as fallback | Bude shafin Turanci mai aiki idan kana bukatar lissafi, fayil ko cikakken ma'amala. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/cgt-najeriya/` | 118 | English route label marked as fallback | Shafin Turanci Cikakken aikin da aka kiyaye daga asali. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/dawo-da-jari/` | 86 | English route label marked as fallback | Bude shafin Turanci | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/dawo-da-jari/` | 104 | English route label marked as fallback | Bude shafin Turanci mai aiki idan kana bukatar lissafi, fayil ko cikakken ma'amala. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/dawo-da-jari/` | 120 | English route label marked as fallback | Shafin Turanci Cikakken aikin da aka kiyaye daga asali. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/farashin-kayayyakin-gona/` | 24 | English route label marked as fallback | Kiyasin kudin shiga Adadi Farashi a kan daya Kudin sufuri da ajiya Ragin lalacewa, kashi Kiyasta kudin shiga Abin lura ga manomi da dan kasuwa Ka duba farashi fiye da kasuwa daya idan zai yiwu. Kudin sufuri, ajiya, na... | Batch 2 - Agriculture visible-copy cleanup |
| `/ha/kayan-aiki/gwajin-ussd/` | 101 | English route label marked as fallback | Bude shafin Turanci | Batch 2 - Telecom and USSD visible-copy cleanup |
| `/ha/kayan-aiki/gwajin-ussd/` | 119 | English route label marked as fallback | Bude shafin Turanci mai aiki idan kana bukatar lissafi, fayil ko cikakken ma'amala. | Batch 2 - Telecom and USSD visible-copy cleanup |
| `/ha/kayan-aiki/gwajin-ussd/` | 135 | English route label marked as fallback | Shafin Turanci Cikakken aikin da aka kiyaye daga asali. | Batch 2 - Telecom and USSD visible-copy cleanup |
| `/ha/kayan-aiki/gyara-pdf/` | 86 | English route label marked as fallback | Bude shafin Turanci | Batch 2 - Document, PDF, invoice, and Naira cleanup |
| `/ha/kayan-aiki/gyara-pdf/` | 104 | English route label marked as fallback | Bude shafin Turanci mai aiki idan kana bukatar lissafi, fayil ko cikakken ma'amala. | Batch 2 - Document, PDF, invoice, and Naira cleanup |
| `/ha/kayan-aiki/gyara-pdf/` | 120 | English route label marked as fallback | Shafin Turanci Cikakken aikin da aka kiyaye daga asali. | Batch 2 - Document, PDF, invoice, and Naira cleanup |
| `/ha/kayan-aiki/` | 544 | brand or platform name | Akwai da Hausa Matsa PDF Rage girman PDF don loda fayil, imel, tashar yanar gizo ko WhatsApp. Bude kayan aiki | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 547 | English route label marked as fallback | Akwai da Hausa Wurin aikin PDF Fara daga wuri daya: hada PDF, raba PDF, matsa PDF ko bude babban shafin Turanci idan ana bukata. Bude kayan aiki | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 580 | brand or platform name | Akwai da Hausa Link din WhatsApp Gina link din wa.me, sako, QR da tarin hanyoyi don kasuwanci. Bude kayan aiki | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 589 | brand or platform name | Akwai da Hausa Kiyasin amfani da intanet Kiyasta yawan bayanan intanet da lilo, bidiyo, WhatsApp da aiki ke bukata. Bude kayan aiki | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 610 | brand or platform name | Akwai da Hausa Kalkuletan Paystack Kiyasta caji da abin da zai shigo bayan cire kudin Paystack, sannan tabbatar da jadawalin kamfani. Bude jagora | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/kalkuletan-gpa-cgpa/` | 25 | English route label marked as fallback | Bayanan maki Jimillar maki na zango Jimillar raka'o'i na zango Jimillar maki na baya Raka'o'in baya Lissafa Abin lura Wasu jami'o'i suna amfani da 5.0, wasu 4.0. Wannan kayan aiki yana raba jimillar maki da jimillar r... | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kalkuletan-paystack/` | 80 | brand or platform name | AfroTools Hausa / Kayan aiki / Kalkuletan Paystack a Hausa breadcrumb | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kalkuletan-paystack/` | 82 | brand or platform name | Kiyasta abin da zai shigo bayan cajin Paystack. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kalkuletan-paystack/` | 83 | brand or platform name | Jagorar Hausa don kiyasta cajin Paystack, abin da zai shigo bayan cire caji, da bukatar tabbatar da jadawalin kamfanin kafin amfani. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kalkuletan-paystack/` | 85 | English route label marked as fallback | Bude shafin Turanci | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kalkuletan-paystack/` | 96 | brand or platform name | Abin lura Ka tabbatar da sabon jadawalin Paystack kafin saka farashi ko aika takardar kudi | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kalkuletan-paystack/` | 103 | English route label marked as fallback | Bude shafin Turanci mai aiki idan kana bukatar lissafi, fayil ko cikakken ma'amala. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kalkuletan-paystack/` | 112 | brand or platform name | Paystack na iya sauya caji, haraji ko sharuddan biya. Wannan jagora ba sanarwar hukuma ba ce. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kalkuletan-paystack/` | 119 | English route label marked as fallback | Shafin Turanci Cikakken aikin da aka kiyaye daga asali. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kalkuletan-paystack/` | 128 | brand or platform name | Shirya kudin Paystack da abin da abokin ciniki zai biya | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kalkuletan-paystack/` | 130 | brand or platform name | Tushen bayani: Tabbatar da sabon kudin gateway daga shafin Paystack ko yarjejeniyar kasuwancinka. Duba sabunta bayanai na 2026 kafin amfani. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kalkuletan-paystack/` | 132 | brand or platform name | Shirya kudin Paystack da abin da abokin ciniki zai biya | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kalkuletan-waec-neco/` | 168 | brand or platform name |  WhatsApp | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/kayan-aiki/karin-farashi/` | 101 | English route label marked as fallback | Bude shafin Turanci | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/karin-farashi/` | 119 | English route label marked as fallback | Bude shafin Turanci mai aiki idan kana bukatar lissafi, fayil ko cikakken ma'amala. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/karin-farashi/` | 135 | English route label marked as fallback | Shafin Turanci Cikakken aikin da aka kiyaye daga asali. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kasafin-dalibi/` | 41 | English route label marked as fallback | Bayanan kudi Kudin da zai shigo Kudin makaranta Haya ko masauki Abinci Sufuri Littattafai da yan bukatu Lissafa kasafi Kwafa brief din kasafi Yadda za a karanta sakamako Idan ragowar kudi ya yi kasa, fara rage abin da... | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kirkiro-invoice/` | 621 | brand or platform name | Kudin wayar hannu / WhatsApp | Batch 2 - Document, PDF, invoice, and Naira cleanup |
| `/ha/kayan-aiki/kirkiro-invoice/` | 622 | brand or platform name | M-Pesa, MoMo, Airtel Money, WhatsApp | Batch 2 - Document, PDF, invoice, and Naira cleanup |
| `/ha/kayan-aiki/kirkiro-invoice/` | 900 | brand or platform name | Eh. Saka hanyar biyan kudi, link din biya, kudin wayar hannu ko WhatsApp, da bayanan banki domin PDF ya nuna wa abokin ciniki yadda zai biya. | Batch 2 - Document, PDF, invoice, and Naira cleanup |
| `/ha/kayan-aiki/kudin-maikaci/` | 97 | English route label marked as fallback | Bude shafin Turanci | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kudin-maikaci/` | 120 | English route label marked as fallback | Wannan lissafi na Hausa yana amfani da abin da ka saka da kanka. Ya dace da kasafin daukar ma'aikaci kafin ka bude cikakken shafin Turanci ko ka tura bayanai ga HR. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kudin-maikaci/` | 149 | English route label marked as fallback | Bude shafin Turanci mai aiki idan kana bukatar lissafi, fayil ko cikakken ma'amala. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kudin-maikaci/` | 165 | English route label marked as fallback | Shafin Turanci Cikakken aikin da aka kiyaye daga asali. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kudin-tura-kudi-ta-waya/` | 24 | brand or platform name | Tsallake zuwa babban abun ciki Hausa / Sadarwa / Tura kudi Kudin tura kudi ta waya Kiyasta caji kafin aika kudi ta OPay, M-Pesa, Airtel ko makamantansu. Wannan ba jadawalin hukuma ba ne; tabbatar da manhaja ko wakili ... | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kudin-tura-kudi-ta-waya/` | 25 | English route label marked as fallback | Bayanan tura kudi Adadin da za a aika Hanyar biya Asusun waya zuwa asusun waya Wakili ko cire kudi Asusun banki Kiyasta caji Ka tabbatar kafin aika kudi Kudin caji na iya sauyawa bisa kasa, mai bayar da sabis, matsayi... | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kwatanta-aika-kudi/` | 103 | English route label marked as fallback | Bude shafin Turanci | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kwatanta-aika-kudi/` | 195 | English route label marked as fallback | Bude shafin Turanci mai aiki idan kana bukatar lissafi, fayil ko cikakken ma'amala. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kwatanta-aika-kudi/` | 219 | English route label marked as fallback | Shafin Turanci Cikakken aikin da aka kiyaye daga asali. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kwatanta-kunshin-intanet/` | 98 | brand or platform name | Kamfani MTN, Airtel, Glo, 9mobile ko wani kamfanin sadarwa. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kwatanta-kunshin-intanet/` | 116 | English route label marked as fallback | Lura: Wannan shafin Hausa yana shiryarwa ne. Cikakken teburin kwatantawa yana kan shafin Turanci yanzu, kuma duk farashi ya kamata a tabbatar daga kamfanin sadarwa kafin siye. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/kwatanta-kunshin-intanet/` | 117 | brand or platform name | Hanyar tsara da tushe: Wannan shafi yana taimaka maka ka tsara abin da za ka kwatanta: kamfani, GB, farashi, tsawon aiki da tabbacin USSD ko app. Ba ya karbo farashi live daga MTN, Airtel, Glo ko 9mobile. Atunse: June... | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/lambar-shafi-pdf/` | 86 | English route label marked as fallback | Bude shafin Turanci | Batch 2 - Document, PDF, invoice, and Naira cleanup |
| `/ha/kayan-aiki/lambar-shafi-pdf/` | 104 | English route label marked as fallback | Bude shafin Turanci mai aiki idan kana bukatar lissafi, fayil ko cikakken ma'amala. | Batch 2 - Document, PDF, invoice, and Naira cleanup |
| `/ha/kayan-aiki/lambar-shafi-pdf/` | 113 | English route label marked as fallback | Cikakken aikin sanya lambobin shafi yana kan shafin Turanci yanzu, amma fayil yana aiki a burauza kamar sauran kayan PDF. | Batch 2 - Document, PDF, invoice, and Naira cleanup |
| `/ha/kayan-aiki/lambar-shafi-pdf/` | 120 | English route label marked as fallback | Shafin Turanci Cikakken aikin da aka kiyaye daga asali. | Batch 2 - Document, PDF, invoice, and Naira cleanup |
| `/ha/kayan-aiki/lambobin-ussd/` | 102 | brand or platform name | Duba lambar ragowar kudi, bayanan intanet, katin waya, tura kudi, bashi da taimakon kwastoma. Najeriya ta bude da MTN, Airtel, Glo da 9mobile, sannan za ka iya zabar wasu kasashe daga bayanan sadarwa. | Batch 2 - Telecom and USSD visible-copy cleanup |
| `/ha/kayan-aiki/lambobin-ussd/` | 112 | brand or platform name | misali ragowar kudi, tura kudi, MTN... | Batch 2 - Telecom and USSD visible-copy cleanup |
| `/ha/kayan-aiki/mai-fassara-hausa/` | 100 | English route label marked as fallback | Idan kana son cikakken kundin jimlolin Turanci zuwa Hausa, akwai shafin Turanci da ke da karin misalai. An nuna shi a fili domin kada a dauka dukkan tsohon shafin ya riga ya zama Hausa. | Batch 2 - Language and translation hub cleanup |
| `/ha/kayan-aiki/neman-tallafin-karatu/` | 56 | English route label marked as fallback | Tace bukata Matakin karatu Digiri na farko Digiri na biyu Horon sana'a Gajeren kwas Fanni Kimiyya da fasaha Lafiya Kasuwanci Noma Kowane fanni Inda kake nema Nigeria Afrika Waje Shirya jerin bukata Gaskiyar neman tall... | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/rajistar-layin-waya-nin/` | 96 | brand or platform name | MTN | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/rajistar-layin-waya-nin/` | 97 | brand or platform name | Airtel | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/rajistar-layin-waya-nin/` | 98 | brand or platform name | Glo | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/rajistar-layin-waya-nin/` | 99 | brand or platform name | 9mobile | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/rajistar-layin-waya-nin/` | 255 | brand or platform name | MTN Nigeria Misalin shafin kamfani don duba kunshin data da sabon farashi. Duba MTN | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/rajistar-layin-waya-nin/` | 256 | brand or platform name | Airtel Nigeria Misalin shafin kamfani don tabbatar da kunshi da farashi. Duba Airtel | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/ribar-kiwon-kifi/` | 24 | English route label marked as fallback | Bayanan kiwon kifi Yawan kifi Nauyin sayarwa, kg Farashi a kg Kifin da zai kai sayarwa, kashi Kudin abinci Sauran kudade Lissafa riba Abin da ke iya sauya riba Mutuwar kifi, tsadar abinci, yanayin ruwa, farashin kasuw... | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/rubuta-wasikar-aiki/` | 70 | English route label marked as fallback | Idan kana son samfurori da fitarwa zuwa PDF ko Word, bude shafin Turanci . | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/takardar-albashi/` | 91 | English route label marked as fallback | Bude shafin Turanci | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/kayan-aiki/takardar-albashi/` | 121 | English route label marked as fallback | Bude shafin Turanci mai aiki idan kana bukatar lissafi, fayil ko cikakken ma'amala. | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/kayan-aiki/takardar-albashi/` | 137 | English route label marked as fallback | Shafin Turanci Cikakken aikin da aka kiyaye daga asali. | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/kayan-aiki/tazarar-riba/` | 104 | English route label marked as fallback | Bude shafin Turanci | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/tazarar-riba/` | 134 | English route label marked as fallback | Bude shafin Turanci mai aiki idan kana bukatar lissafi, fayil ko cikakken ma'amala. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/tazarar-riba/` | 161 | English route label marked as fallback | Shafin Turanci Cikakken aikin da aka kiyaye daga asali. | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/waya-ko-banki/` | 88 | English route label marked as fallback | Bude shafin Turanci | Batch 2 - General Hausa visible-copy cleanup |
| `/ha/kayan-aiki/waya-ko-banki/` | 118 | English route label marked as fallback | Bude shafin Turanci mai aiki idan kana bukatar lissafi, fayil ko cikakken ma'amala. | Batch 2 - General Hausa visible-copy cleanup |

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
