# Yoruba Visible Copy Leakage Ledger

Generated: 2026-05-16

This audit scans `yo/**/*.html` for visible English leakage only. It ignores scripts, styles, head metadata, JSON blobs, URLs, code/pre blocks, and accepted technical acronyms.

## Headline Metrics

- Yoruba route tree exists: yes
- Yoruba routes scanned: 45
- Clean routes: 20
- Routes with blockers: 0
- BLOCKER_VISIBLE_ENGLISH findings: 0
- POSSIBLE_FALSE_POSITIVE findings: 67
- ACCEPTED_TECH_TERM findings: 228

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
| `/yo/awon-ise/agbon-oja/` | 69 | English route label marked as fallback | Ṣí ojú ìwé Gẹẹsi fun ìkójọpọ̀ ọja | Batch 1 - General Yoruba shell |
| `/yo/awon-ise/amulo-data/` | 39 | brand or platform name | Ṣe àfiyèsí iye GB ti o yẹ kí o ra fun ìwádìí wẹẹbu, fidio, ìpè fidio, iṣẹ́ ilé-ẹ̀kọ́ ati iṣẹ́ ọfiisi. Abajade jẹ́ ìtọ́nisọ́nà, kii ṣe iye osise MTN, Airtel, Glo tabi 9mobile. | Batch 1 - General Yoruba shell |
| `/yo/awon-ise/amulo-data/` | 55 | brand or platform name | WhatsApp ati àwùjọ wẹẹbu fun ọjọ́ kan, wákàtí | Batch 1 - General Yoruba shell |
| `/yo/awon-ise/amulo-data/` | 64 | English route label marked as fallback | Ṣí ojú ìwé Gẹẹsi | Batch 1 - General Yoruba shell |
| `/yo/awon-ise/duba-genotype/` | 78 | English route label marked as fallback | Ṣí ojú ìwé Gẹẹsi fun ẹya kikun to ṣi wà ní Gẹẹsi. | Batch 1 - Health and family shell |
| `/yo/awon-ise/ere-oko-eja/` | 65 | English route label marked as fallback | Ṣí ojú ìwé Gẹẹsi | Batch 1 - Agriculture shell |
| `/yo/awon-ise/` | 66 | English route label marked as fallback | Ọna tí a fẹ́ kí o bẹ̀rẹ̀ Àwọn kaadi tó ní “ojú ìwé Gẹẹsi” ṣi lọ sí irinṣẹ Gẹẹsi. Àwọn tó lọ sí ` ` ni oju Yorùbá gangan. | Batch 1 - Yoruba shell hubs |
| `/yo/awon-ise/` | 68 | brand or platform name | Naijiria Hubu Yorùbá fún PAYE, VAT, Naira, JAMB, WAEC, NYSC, BVN, NIN, USSD ati WhatsApp. Ṣí Naijiria | Batch 1 - Yoruba shell hubs |
| `/yo/awon-ise/` | 72 | English route label marked as fallback | JAMB aggregate - ojú ìwé Gẹẹsi Ṣi wà ní Gẹẹsi, ṣùgbọ́n o wulo fún ọmọ ile-ẹ̀kọ́ tí n ṣàyẹ̀wò UTME ati Post-UTME. Ṣí ojú Gẹẹsi | Batch 1 - Yoruba shell hubs |
| `/yo/awon-ise/` | 73 | English route label marked as fallback | USSD directory - ojú ìwé Gẹẹsi Awọn koodu fun ìpèsè intanẹẹti, kirẹditi foonu, banki ati owo alagbeka ṣi wà ní ojú ìwé Gẹẹsi fún báyìí. Ṣí ojú Gẹẹsi | Batch 1 - Yoruba shell hubs |
| `/yo/awon-ise/` | 80 | English route label marked as fallback | Nigbati a ba kọ oju irinṣẹ Yorùbá gidi, a o gbe kaadi rẹ̀ kuro ninu àmì ojú ìwé Gẹẹsi, a o fi àmì ede kun, a o si tun ṣe àyẹ̀wò ẹ̀dá oju-ìwé. | Batch 1 - Yoruba shell hubs |
| `/yo/awon-ise/isuna-ogbin/` | 68 | English route label marked as fallback | Ṣí ojú ìwé Gẹẹsi | Batch 1 - Agriculture shell |
| `/yo/awon-ise/kalkuletan-bmi/` | 67 | English route label marked as fallback | Ṣí ojú ìwé Gẹẹsi fun ẹya kikun to ṣi wà ní Gẹẹsi. | Batch 1 - General Yoruba shell |
| `/yo/awon-ise/lambobin-ussd/` | 39 | brand or platform name | Yan orílẹ̀-èdè, wa iṣẹ́ kan, ki o daakọ lambar fún ìyókù, káríìdì, GB, fífi owó ránṣẹ́, yíyá káríìdì tabi ìrànwọ́ alabara. Naijiria wa ni iwaju pẹlu MTN, Airtel, Glo ati 9mobile. | Batch 1 - Telecom, USSD, and WhatsApp shell |
| `/yo/awon-ise/lambobin-ussd/` | 51 | brand or platform name | àpẹẹrẹ: MTN, ìyókù, káríìdì | Batch 1 - Telecom, USSD, and WhatsApp shell |
| `/yo/awon-ise/lambobin-ussd/` | 59 | brand or platform name | Ṣe gbogbo lambar ṣiṣẹ fun gbogbo SIM? Rara. Lambar kan le jẹ́ ti MTN, Airtel, Glo, 9mobile tabi banki kan pato. Yan orílẹ̀-èdè ati olùpèsè to ba SIM rẹ mu. | Batch 1 - Telecom, USSD, and WhatsApp shell |
| `/yo/awon-ise/olufassara-yoruba/` | 73 | English route label marked as fallback | Ojú ìwé Gẹẹsi Yorùbá phrasebook tó gbooro Ojú Gẹẹsi naa ni akojọ gbolohun diẹ sii. | Batch 1 - General Yoruba shell |
| `/yo/awon-ise/olufassara-yoruba/` | 74 | English route label marked as fallback | Ojú ìwé Gẹẹsi Ìtumọ̀ PDF Lo fun ìmúrasílẹ̀ nikan, kii ṣe ìtumọ̀ tí a fọwọ́sí. | Batch 1 - General Yoruba shell |
| `/yo/awon-ise/olufassara-yoruba/` | 75 | English route label marked as fallback | Ojú ìwé Gẹẹsi Hausa translator Phrasebook Hausa fun ìkíni ati ọrọ ojoojumọ. | Batch 1 - General Yoruba shell |
| `/yo/awon-ise/ounje-eranko/` | 63 | English route label marked as fallback | Ṣí ojú ìwé Gẹẹsi | Batch 1 - General Yoruba shell |
| `/yo/awon-ise/owo-ile-iwosan/` | 64 | English route label marked as fallback | Ṣí ojú ìwé Gẹẹsi fun ẹya kikun to ṣi wà ní Gẹẹsi. | Batch 1 - Health and family shell |
| `/yo/awon-ise/owo-oja-ogbin/` | 63 | English route label marked as fallback | Ṣí ojú ìwé Gẹẹsi | Batch 1 - Agriculture shell |
| `/yo/awon-ise/rajista-sim-nin/` | 39 | brand or platform name | Ṣètò ohun ti o yẹ ki o gbe lọ ati ohun ti o yẹ ki o beere ṣaaju lilọ sí MTN, Airtel, Glo, 9mobile, banki tabi ikanni NIMC to jẹ́ osise. Oju yii ko ṣe ìjẹ́risi ijọba. | Batch 1 - General Yoruba shell |
| `/yo/awon-ise/rajista-sim-nin/` | 61 | English route label marked as fallback | Ṣí ojú ìwé Gẹẹsi | Batch 1 - General Yoruba shell |
| `/yo/awon-ise/sickle-cell/` | 65 | English route label marked as fallback | Ṣí ojú ìwé Gẹẹsi fun ẹya kikun to ṣi wà ní Gẹẹsi. | Batch 1 - Health and family shell |
| `/yo/awon-ise/whatsapp-link/` | 37 | brand or platform name | AfroTools Yorùbá / Ìbáraẹnisọrọ / WhatsApp | Batch 1 - Telecom, USSD, and WhatsApp shell |
| `/yo/awon-ise/whatsapp-link/` | 38 | brand or platform name | Ṣẹda ìjápọ̀ WhatsApp | Batch 1 - Telecom, USSD, and WhatsApp shell |
| `/yo/awon-ise/whatsapp-link/` | 39 | brand or platform name | Fun alabara ọna taara si WhatsApp rẹ. Yan koodu orilẹ-ede, tẹ nọ́ńbà, kọ ọrọ ifiranṣẹ, ki o gba wa.me link ti o mọ. | Batch 1 - Telecom, USSD, and WhatsApp shell |
| `/yo/awon-ise/whatsapp-link/` | 64 | brand or platform name | Ìjápọ̀ WhatsApp wa.me | Batch 1 - Telecom, USSD, and WhatsApp shell |
| `/yo/awon-ise/whatsapp-link/` | 71 | brand or platform name | Ṣí ninu WhatsApp | Batch 1 - Telecom, USSD, and WhatsApp shell |
| `/yo/awon-ise/whatsapp-link/` | 76 | English route label marked as fallback | Ṣàyẹ̀wò nọ́ńbà ṣaaju fifiranṣẹ. Ma fi ọrọ aṣiri, BVN, NIN, PIN tabi alaye kaadi sinu ọrọ ti a ti pese tẹlẹ. Fun QR ati iṣẹ́ ọ̀pọ̀ ìjápọ̀, ṣí ojú ìwé Gẹẹsi . | Batch 1 - Telecom, USSD, and WhatsApp shell |
| `/yo/awon-ise/whatsapp-link/` | 78 | brand or platform name | Ṣe ìjápọ̀ yii ṣiṣẹ lori foonu ati kọ̀ǹpútà? Bẹẹni. wa.me link maa ṣí WhatsApp tabi WhatsApp Web, da lori ẹrọ alabara. | Batch 1 - Telecom, USSD, and WhatsApp shell |
| `/yo/awon-ise/wurin-pdf/` | 79 | brand or platform name | Dín ìwọ̀n PDF Dín fáìlì PDF ku fun imeeli, WhatsApp, portal ilé-ẹ̀kọ́, tàbí fífi ránṣẹ́ sí oníbàárà. Ṣí ojú Yorùbá | Batch 1 - Document, PDF, invoice, and Naira shell |
| `/yo/awon-ise/wurin-pdf/` | 81 | English route label marked as fallback | Ibi iṣẹ́ PDF kikun - ojú ìwé Gẹẹsi Ojú Gẹẹsi yìí ní àwọn iṣẹ́ afikun bí watermark, sign, crop, protect ati àwọn ètò PDF tó jinlẹ̀. Ṣí ojú Gẹẹsi | Batch 1 - Document, PDF, invoice, and Naira shell |
| `/yo/ede-ati-itumo/` | 72 | English route label marked as fallback | Ojú ìwé Gẹẹsi Yorùbá phrasebook tó gbooro Ojú Gẹẹsi pẹlu akojọ gbolohun pupọ. Lo o bi orisun, ṣugbọn ṣayẹwo tone ati ìtumọ̀ pẹlu ẹni tó mọ Yorùbá. | Batch 1 - Language and translation shell |
| `/yo/ede-ati-itumo/` | 73 | English route label marked as fallback | Ojú ìwé Gẹẹsi Hausa translator Phrasebook Hausa ni Gẹẹsi fun ìkíni, ọja, ìrìnàjò ati ọrọ ojoojumọ. | Batch 1 - Language and translation shell |
| `/yo/ede-ati-itumo/` | 74 | English route label marked as fallback | Ojú ìwé Gẹẹsi Igbo translator Ìrànwọ́ Igbo ni Gẹẹsi fun gbolohun ipilẹ ati ọrọ lilo ojoojumọ. | Batch 1 - Language and translation shell |
| `/yo/ede-ati-itumo/` | 75 | English route label marked as fallback | Ojú ìwé Gẹẹsi Swahili translator Ìrànwọ́ Swahili fun irin-ajo, iṣẹ́ ati ìbáraẹnisọrọ ni ila-oorun Afirika. | Batch 1 - Language and translation shell |
| `/yo/ede-ati-itumo/` | 76 | English route label marked as fallback | Ojú ìwé Gẹẹsi Pidgin translator Ìrànwọ́ Pidgin Naijiria fun gbolohun lasan, awada ati ìbáraẹnisọrọ. | Batch 1 - Language and translation shell |
| `/yo/ede-ati-itumo/` | 77 | English route label marked as fallback | Ojú ìwé Gẹẹsi Ìtumọ̀ PDF Ojú Gẹẹsi fun PDF. Ma lo fun ìwé òfin, ìlera, ile-ẹ̀kọ́ tabi ijọba lai jẹ́risi pẹlu olùtumọ̀ ọjọ́gbọn. | Batch 1 - Language and translation shell |
| `/yo/ibaraenisoro/` | 38 | brand or platform name | USSD, SIM, NIN, BVN ati WhatsApp ni Yorùbá. | Batch 1 - Telecom, USSD, and WhatsApp shell |
| `/yo/ibaraenisoro/` | 39 | brand or platform name | Ilẹ̀kùn yìí jẹ́ fún àwọn ohun ìbáraẹnisọrọ tí ara Naijiria máa n lo lojoojúmọ́: MTN, Airtel, Glo, 9mobile, ìjápọ̀ WhatsApp, ìforúkọsílẹ̀ SIM, ati iye GB tí o yẹ kí o ra. | Batch 1 - Telecom, USSD, and WhatsApp shell |
| `/yo/ibaraenisoro/` | 42 | brand or platform name | Ṣẹda ìjápọ̀ WhatsApp | Batch 1 - Telecom, USSD, and WhatsApp shell |
| `/yo/ibaraenisoro/` | 60 | brand or platform name | Ṣètò ohun tí o gbọdọ̀ ṣàyẹ̀wò kí o tó lọ sí MTN, Airtel, Glo tabi 9mobile. | Batch 1 - Telecom, USSD, and WhatsApp shell |
| `/yo/ibaraenisoro/` | 69 | brand or platform name | Ìjápọ̀ WhatsApp | Batch 1 - Telecom, USSD, and WhatsApp shell |
| `/yo/ibaraenisoro/` | 82 | English route label marked as fallback | Ojú ìwé Gẹẹsi Ìfiwéra pákẹ́ẹ̀jì GB Lo fun ìfiwéra iye, ọjọ́ ipari ati iye fún GB, ki o jẹ́risi ninu app tabi USSD olùpèsè. | Batch 1 - Telecom, USSD, and WhatsApp shell |
| `/yo/ibaraenisoro/` | 83 | English route label marked as fallback | Ojú ìwé Gẹẹsi Ìdánwò ìtòlẹ́sẹẹsẹ USSD Ṣayẹwo ìrìnàjò menu USSD ṣaaju lilo rẹ fun ìrànwọ́ alabara tabi iṣẹ́ ẹgbẹ́. | Batch 1 - Telecom, USSD, and WhatsApp shell |
| `/yo/ibaraenisoro/` | 84 | English route label marked as fallback | Ojú ìwé Gẹẹsi Ìyípadà nẹ́tíwọ́ọ̀kì Ka ohun tí o yẹ kí o mura ṣaaju gbigbe nọ́ńbà lọ sí olùpèsè mìíràn. | Batch 1 - Telecom, USSD, and WhatsApp shell |
| `/yo/ibaraenisoro/` | 91 | brand or platform name | 2. Ma fi PIN, BVN, NIN tabi alaye kaadi ranṣẹ́ ninu WhatsApp. | Batch 1 - Telecom, USSD, and WhatsApp shell |
| `/yo/ibaraenisoro/` | 101 | brand or platform name | Ìkìlọ̀: AfroTools ko ṣe ìjẹ́risi ijọba fun SIM, NIN tabi BVN. Oju yii jẹ́ iranlọwọ ìmúrasílẹ̀ nikan, ko sì rọ́pò NCC, NIMC, banki, MTN, Airtel, Glo, 9mobile tabi WhatsApp | Batch 1 - Telecom, USSD, and WhatsApp shell |
| `/yo/ilera/` | 67 | English route label marked as fallback | Ojú ìwé Gẹẹsi Ìtumọ̀ ìwé yàrá Fun alaye gbogbogbo lori ìwé yàrá, pẹlu ìkìlọ̀ lati jẹ́risi pẹlu ọjọgbọn. | Batch 1 - Health and family shell |
| `/yo/ilera/` | 68 | English route label marked as fallback | Ojú ìwé Gẹẹsi Blood group jinlẹ̀ Oju afikun fun blood group ati Rh, ṣi wà ní Gẹẹsi. | Batch 1 - Health and family shell |
| `/yo/ilera/` | 69 | English route label marked as fallback | Ojú ìwé Gẹẹsi Ìfiwéra owó oogun Ṣe ìfiwéra owó, ṣugbọn ma yi oogun pada lai ba onímọ̀ oogun tabi oníṣègùn sọrọ. | Batch 1 - Health and family shell |
| `/yo/` | 54 | English route label marked as fallback | Ojú-ọna yìí ni ìbẹ̀rẹ̀ ilẹ̀ Yorùbá fún AfroTools. A ti dá àwọn ojú-ìwé pàtàkì sílẹ̀, a sì ń fi ìkìlọ̀ hàn kedere níbi tí irinṣẹ ṣi wà ní ojú ìwé Gẹẹsi. | Batch 1 - Yoruba shell hubs |
| `/yo/` | 86 | English route label marked as fallback | VAT Naijiria - ojú ìwé Gẹẹsi Owó-orí iṣẹ́ | Batch 1 - Yoruba shell hubs |
| `/yo/` | 87 | English route label marked as fallback | PDF Workspace - ojú ìwé Gẹẹsi Ìwé àti PDF | Batch 1 - Yoruba shell hubs |
| `/yo/` | 88 | English route label marked as fallback | JAMB aggregate - ojú ìwé Gẹẹsi Ẹ̀kọ́ | Batch 1 - Yoruba shell hubs |
| `/yo/iwe-ati-pdf/` | 69 | brand or platform name | Dín ìwọ̀n PDF Dín ìwọ̀n PDF ku ṣaaju fifiranṣẹ si WhatsApp, imeeli, ọna ikojọpọ tabi alabara. Ṣí oju Yorùbá | Batch 1 - Document, PDF, invoice, and Naira shell |
| `/yo/naijiria/` | 55 | brand or platform name | Ojú-ọna yìí kojọ PAYE, VAT, Naira, ẹ̀kọ́, ìwé, USSD, BVN, NIN ati WhatsApp fun awọn olumulo Yorùbá. Ibi tí irinṣẹ ṣi jẹ́ Gẹẹsi ni a samisi kedere. | Batch 1 - Yoruba shell hubs |
| `/yo/naijiria/` | 71 | English route label marked as fallback | JAMB aggregate - ojú ìwé Gẹẹsi Ṣi wà ní Gẹẹsi; lo fun iṣiro UTME, Post-UTME ati ìwọ̀n wọlé. Ṣí ojú Gẹẹsi | Batch 1 - Yoruba shell hubs |
| `/yo/naijiria/` | 72 | English route label marked as fallback | WAEC ati NECO - ojú ìwé Gẹẹsi Ṣi wà ní Gẹẹsi; lo fun credit, grade ati ìmúrasílẹ̀ wọlé. Ṣí ojú Gẹẹsi | Batch 1 - Yoruba shell hubs |
| `/yo/naijiria/` | 73 | English route label marked as fallback | USSD directory - ojú ìwé Gẹẹsi Ṣi wà ní Gẹẹsi; wulo fun ìpèsè intanẹẹti, kirẹditi foonu, banki ati owo alagbeka. Ṣí ojú Gẹẹsi | Batch 1 - Yoruba shell hubs |
| `/yo/ogbin/` | 72 | English route label marked as fallback | Ojú ìwé Gẹẹsi Omi oko Naijiria Àfiyèsí omi ati akoko irigeson ṣi wà ní Gẹẹsi fun bayi. | Batch 1 - Agriculture shell |
| `/yo/owo-ori-owo-ise/` | 68 | English route label marked as fallback | VAT Naijiria - ojú ìwé Gẹẹsi Fun oṣuwọn VAT Naijiria, exempt, zero-rated ati reverse VAT. Ṣí ojú Gẹẹsi | Batch 1 - Salary, PAYE, and VAT shell |
| `/yo/owo-osu-ati-owo-ori/` | 68 | English route label marked as fallback | Payslip generator - ojú ìwé Gẹẹsi Ṣẹda payslip fun oṣiṣẹ́, pẹlu Naira, alaye ìsanwo ati PDF. Ṣí ojú Gẹẹsi | Batch 1 - Salary, PAYE, and VAT shell |
| `/yo/owo-osu-ati-owo-ori/` | 69 | English route label marked as fallback | Pension projection - ojú ìwé Gẹẹsi Ṣayẹwo bi ifipamọ̀ ìfẹ̀yìntì ṣe le dagba lori akoko. Ṣí ojú Gẹẹsi | Batch 1 - Salary, PAYE, and VAT shell |
| `/yo/owo-osu-ati-owo-ori/` | 70 | English route label marked as fallback | Currency converter - ojú ìwé Gẹẹsi Yi Naira ati owo miiran pada fun iṣẹ́, invoice ati irin-ajo. Ṣí ojú Gẹẹsi | Batch 1 - Salary, PAYE, and VAT shell |

## ACCEPTED_TECH_TERM

Accepted terms: `PDF`, `API`, `JSON`, `USSD`, `JAMB`, `WAEC`, `NECO`, `NYSC`, `VAT`, `PAYE`, `BVN`, `NIN`, `FIRS`, `HTML`, `CSV`, `ZIP`.

The JSON ledger contains line-level accepted-term examples. These are tracked so future cleanup prompts do not waste time translating normal acronyms.

## CLEAN

- `/yo/awon-ise/alawus-na-nysc/`
- `/yo/awon-ise/cit-naijiria/`
- `/yo/awon-ise/din-iwon-pdf/`
- `/yo/awon-ise/ere-ogbin/`
- `/yo/awon-ise/eso-irugbin/`
- `/yo/awon-ise/forukosile-owo-ise/`
- `/yo/awon-ise/hada-ati-pin-pdf/`
- `/yo/awon-ise/iwon-ajile/`
- `/yo/awon-ise/kalkuletan-jamb/`
- `/yo/awon-ise/kalkuletan-vat/`
- `/yo/awon-ise/kalkuletan-waec-neco/`
- `/yo/awon-ise/kiriiro-invoice/`
- `/yo/awon-ise/kiriiro-risiti/`
- `/yo/awon-ise/naira-si-oro/`
- `/yo/awon-ise/sise-rogo/`
- `/yo/awon-ise/tin-naijiria/`
- `/yo/awon-ise/tunto-pdf/`
- `/yo/awon-ise/wht-naijiria/`
- `/yo/eko/`
- `/yo/naijiria/owo-ori-owo-osu/`

## Recommended Cleanup Order

1. No blocker cleanup needed from this audit.

## Notes

- `ojú ìwé Gẹẹsi` labels are treated as possible false positives because Yoruba shell links can intentionally disclose English fallback routes.
- Proper nouns, country names, brand names, and accepted technical acronyms are not blockers by themselves.
- This report does not edit Yoruba page copy.
