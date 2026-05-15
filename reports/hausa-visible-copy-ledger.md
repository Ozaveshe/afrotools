# Hausa Visible Copy Leakage Ledger

Generated: 2026-05-15

This audit scans `ha/**/*.html` for visible English leakage only. It ignores scripts, styles, head metadata, JSON blobs, URLs, code/pre blocks, and accepted technical acronyms.

## Headline Metrics

- Hausa routes scanned: 36
- Clean routes: 17
- Routes with blockers: 7
- BLOCKER_VISIBLE_ENGLISH findings: 41
- POSSIBLE_FALSE_POSITIVE findings: 168
- ACCEPTED_TECH_TERM findings: 327

## Top 20 Blocker Routes

| Rank | Route | Blockers | Suggested owner batch |
|---:|---|---:|---|
| 1 | `/ha/kayan-aiki/` | 15 | Batch 2 - Hausa hub visible-copy cleanup |
| 2 | `/ha/najeriya/` | 8 | Batch 2 - Hausa hub visible-copy cleanup |
| 3 | `/ha/lafiya/` | 6 | Batch 2 - Health and family visible-copy cleanup |
| 4 | `/ha/harshe-da-fassara/` | 4 | Batch 2 - Language and translation hub cleanup |
| 5 | `/ha/kayan-aiki/kalkuletan-vat/` | 4 | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| 6 | `/ha/albashi-da-haraji/` | 2 | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| 7 | `/ha/kasuwanci-da-haraji/` | 2 | Batch 2 - Salary/tax and VAT visible-copy cleanup |

## BLOCKER_VISIBLE_ENGLISH

| Route | Line | Reason | Snippet | Owner batch |
|---|---:|---|---|---|
| `/ha/albashi-da-haraji/` | 563 | English form label | Hausa Mai yin invoice Gina invoice mai tsari da VAT, balance, bayanan biyan kudi da fitar da PDF. Bude kayan aiki | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/albashi-da-haraji/` | 661 | English UI word signal: official, professional | Kayan aikin AfroTools suna taimakawa wajen lissafi, kwatantawa da shiri. Ba su maye gurbin shawarar lauya, accountant, tax adviser, employer, banki ko hukumar haraji ba. Kafin ka biya haraji, ka yanke hukunci na payro... | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/harshe-da-fassara/` | 141 | English workflow/status copy | Fassara rubutun PDF, shirya bilingual review, kuma fitar da takardar da za a iya duba kafin amfani. | Batch 2 - Language and translation hub cleanup |
| `/ha/harshe-da-fassara/` | 176 | English UI word signal: customer, fallback | Ka fara da Hausa idan kana magana da mutane a Arewa, kasuwa, makaranta, customer support ko content. Sannan ka koma fallback tools idan kana bukatar sunaye, karin magana ko takardu. | Batch 2 - Language and translation hub cleanup |
| `/ha/harshe-da-fassara/` | 180 | English UI word signal: official, medical | 3. Tabbatar da muhimmanci Idan text din official ne, medical ne ko legal ne, a duba shi da kwararren mai fassara. | Batch 2 - Language and translation hub cleanup |
| `/ha/harshe-da-fassara/` | 182 | English workflow/status copy | AfroTools yana bada taimakon harshe ne domin fahimta da rubutu. Ba ya maye gurbin certified translation, legal review ko shawarar kwararre. | Batch 2 - Language and translation hub cleanup |
| `/ha/kasuwanci-da-haraji/` | 95 | English UI word signal: data | 1 Kalkuletan VAT a Hausa yana karkashin bita 54 Kasashe a data na VAT 7.5% Nigeria VAT a data na source 0 Matattun Hausa links kididdiga | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/kasuwanci-da-haraji/` | 120 | English UI word signal: treatment, official | Lura: Kayan aikin nan na bayani ne, ba shawarar haraji ko doka ba. Kafin filing, invoice na karshe ko mayar da haraji, tabbatar da rates, treatment da wa'adi daga FIRS, hukumar harajin jihar, official portal ko kwarar... | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/kayan-aiki/` | 388 | English workflow/status copy | Hausa-ready | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 409 | English workflow/status copy | Wadannan su ne hanyoyin da muka tabbatar suna da Hausa a wannan batch. Ba mu saka shafin kayan aiki a matsayin Hausa-ready ba sai route din ya kasance a gaske. | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 414 | English workflow/status copy | Hausa-ready | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 420 | English workflow/status copy | Hausa-ready | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 426 | English workflow/status copy | Hausa-ready | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 432 | English workflow/status copy | Hausa-ready | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 438 | English workflow/status copy | Hausa-ready | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 444 | English workflow/status copy | Hausa-ready | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 450 | English workflow/status copy | Hausa-ready | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 456 | English workflow/status copy | Hausa-ready | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 458 | English UI word signal: browser, clean, balanced, strong, custom | Rage girman PDF a browser, tare da clean, balanced, strong da custom modes. | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 476 | English workflow/status copy | Hausa-ready PAYE na Najeriya Lissafa albashi bayan PAYE, pension da sauran cire-cire na Najeriya. Bude kayan aiki | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 530 | English UI label | Hausa Kirkiro Resit Gina resit mai VAT, QR, PDF, TXT, CSV, JSON da print. Bude kayan aiki | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 536 | English form label | Hausa Lambobin USSD Nemo lambobin banki, airtime, data, balance da mobile money. Bude kayan aiki | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 578 | English UI word signal: estimate, shopping | Hausa Kwandon kasuwa Duba farashin abinci da estimate na shopping cycle. Bude kayan aiki | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/kalkuletan-vat/` | 432 | English UI word signal: rate, treatment | Menene rate na VAT a Najeriya? Rate na VAT a Najeriya 7.5% ne. An kara shi daga 5% zuwa 7.5% ta Finance Act 2019. Wasu kayan abinci na asali sun samu zero-rated treatment daga Janairu 2026. | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/kayan-aiki/kalkuletan-vat/` | 433 | English UI word signal: rate | Menene rate na VAT a Kenya? VAT standard rate na Kenya 16% ne. Wasu kaya da sabis na iya zama zero-rated ko exempt, ciki har da wasu kayan abinci da agricultural inputs. | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/kayan-aiki/kalkuletan-vat/` | 434 | English UI word signal: rate | Menene rate na VAT a Afirka ta Kudu? Rate na VAT a Afirka ta Kudu 15% ne, bayan karuwa daga 14% a Afrilu 2018. Wasu kayan abinci na asali kamar bread, milk da eggs suna zero-rated. | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/kayan-aiki/kalkuletan-vat/` | 443 | English UI word signal: treatment, workflow | Sashin invoice mai layuka da yawa yana taimaka wa kasuwanci ya lissafa VAT a kaya ko sabis masu treatment daban-daban: standard-rated, zero-rated da exempt. Workflow na withholding VAT kuma yana taimaka wajen B2B inda... | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/lafiya/` | 54 | English advisory phrase | Wadannan routes suna da UI na Hausa kuma suna amfani da logic, data ko formulas daga shafukan asali na AfroTools. Ka tabbatar da sakamako da likita, pharmacist, asibiti ko qualified health professional kafin yanke huk... | Batch 2 - Health and family visible-copy cleanup |
| `/ha/lafiya/` | 60 | English UI word signal: treatment, public, teaching, private | Kiyasta consultation, malaria treatment, delivery, scan, dialysis da sauran services a public, teaching da private facilities. | Batch 2 - Health and family visible-copy cleanup |
| `/ha/lafiya/` | 66 | English form label | Kwatanta brand da generic medicine, sannan ka ga inda ake bukatar tabbacin pharmacy ko provider. | Batch 2 - Health and family visible-copy cleanup |
| `/ha/lafiya/` | 90 | English result label | Gina meal plan na kwanaki 7 daga abincin Afirka tare da calories, BMR da shopping list. | Batch 2 - Health and family visible-copy cleanup |
| `/ha/lafiya/` | 96 | English UI word signal: medical, costs | Calorie Counter (Turanci) , Medical Report Interpreter (Turanci) , Blood Group Compatibility (Turanci) , Pharmacy Prices (Turanci) da Health Costs route (Turanci) suna nan a Turanci tukuna. Ba mu kirkiro Hausa links m... | Batch 2 - Health and family visible-copy cleanup |
| `/ha/lafiya/` | 100 | English UI word signal: diagnosis, hospital, emergency | Kayan aikin nan suna bayar da bayanai ne kawai. Ba diagnosis ba ne, ba shawarar magani ba ne, kuma ba su maye gurbin likita, pharmacist, lab, hospital ko emergency care ba. Idan akwai ciwo mai tsanani, jini, zazzabi m... | Batch 2 - Health and family visible-copy cleanup |
| `/ha/najeriya/` | 446 | English workflow/status copy | Hausa-ready | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/najeriya/` | 464 | English workflow/status copy | Wadannan hanyoyi ne da ke cikin repo a matsayin Hausa. Ba mu kira shafin kayan aiki Hausa-ready sai route din Hausa ya kasance a gaske. | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/najeriya/` | 469 | English workflow/status copy | Hausa-ready | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/najeriya/` | 475 | English workflow/status copy | Hausa-ready | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/najeriya/` | 481 | English workflow/status copy | Hausa-ready | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/najeriya/` | 483 | English workflow/status copy | Directory mai nuna Hausa-ready routes da English fallbacks masu aiki. | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/najeriya/` | 501 | English workflow/status copy | Hausa-ready PAYE na Najeriya Kiyasta albashi bayan PAYE da sauran cire-ciren aiki. Bude kayan aiki | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/najeriya/` | 593 | English form label | Hausa Farashin magani Kwatanta farashin magani da bambancin brand da generic. Bude kayan aiki | Batch 2 - Hausa hub visible-copy cleanup |

## POSSIBLE_FALSE_POSITIVE

| Route | Line | Reason | Snippet | Owner batch |
|---|---:|---|---|---|
| `/ha/albashi-da-haraji/` | 461 | English route label marked as fallback | Wadannan su ne hanyoyin Hausa da ke nan a repo. Kayan aikin da babu shafin Hausa tukuna suna kasa a matsayin shafin Turanci mai aiki. | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/albashi-da-haraji/` | 498 | English route label marked as fallback | Kowane kati yana kai ka zuwa shafi mai aiki. Shafin Turanci na nufin kayan aikin yana aiki, amma cikakken shafin Hausa bai fito ba tukuna. | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/albashi-da-haraji/` | 510 | English route label marked as fallback | Shafin Turanci Nigeria CIT Kayan aiki don harajin kudin shiga na kamfani da shirin lissafin haraji. Bude kayan aiki | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/albashi-da-haraji/` | 513 | English route label marked as fallback | Shafin Turanci Nigeria WHT Duba WHT don biyan kudi, kwangiloli da ayyukan kasuwanci. Bude kayan aiki | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/albashi-da-haraji/` | 516 | English route label marked as fallback | Shafin Turanci Nigeria CGT Kiyasta CGT da abubuwan da za a tabbatar daga hukuma. Bude kayan aiki | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/albashi-da-haraji/` | 519 | English route label marked as fallback | Shafin Turanci Pension na Najeriya Kiyasta gudummawar pension a tsarin albashi da ritaya. Bude kayan aiki | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/albashi-da-haraji/` | 522 | English route label marked as fallback | Shafin Turanci NHF da asusun gidaje Duba kayan aikin da ke taimaka wa lissafin NHF da iya biyan kudin gida. Bude kayan aiki | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/albashi-da-haraji/` | 525 | English route label marked as fallback | Shafin Turanci Jagorar TIN ta Najeriya Hanyar samun Tax Identification Number da takardun da ake bukata. Bude jagora | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/albashi-da-haraji/` | 529 | English route label marked as fallback | Shafin Turanci Mai yin payslip Shirya payslip don ma'aikaci, HR ko bayanan albashi. Bude kayan aiki | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/albashi-da-haraji/` | 532 | English route label marked as fallback | Shafin Turanci Kudin daukar ma'aikaci Kiyasta cikakken kudin daukar ma'aikaci: albashi, cire-cire da kudin kamfani. Bude kayan aiki | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/albashi-da-haraji/` | 535 | English route label marked as fallback | Shafin Turanci Mafi karancin albashi Duba bayanan mafi karancin albashi da alamar bin dokar aiki. Bude kayan aiki | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/albashi-da-haraji/` | 538 | English route label marked as fallback | Shafin Turanci Kwatanta albashi Kwatanta tayin aiki, albashin hannu da sauran kudin shiga. Bude kayan aiki | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/albashi-da-haraji/` | 541 | English route label marked as fallback | Shafin Turanci Kalkuleta na karin lokaci Kiyasta kudin aiki na karin lokaci bisa tsarin da ya dace. Bude kayan aiki | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/albashi-da-haraji/` | 544 | English route label marked as fallback | Shafin Turanci Hutu da PTO Taimaka wajen tsara hutu na shekara, hutun rashin lafiya da sauran hutun aiki. Bude kayan aiki | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/albashi-da-haraji/` | 547 | English route label marked as fallback | Shafin Turanci Filin aikin AfroPayroll Fara daftarin payroll, gwajin yanayi da fitar da bayanai idan aikin ya wuce mutum daya. Bude filin aiki | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/albashi-da-haraji/` | 550 | English route label marked as fallback | Shafin Turanci PAYE na Afirka Duba kalkuleta na PAYE a kasashen Afirka, amma ba duka suka samu Hausa ba tukuna. Bude rukunin | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/albashi-da-haraji/` | 560 | English route label marked as fallback | Shafin Turanci Canjin kudi Kwatanta Naira da sauran kudade yayin biyan kudi ko kasuwanci. Bude kayan aiki | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/albashi-da-haraji/` | 566 | English route label marked as fallback | Shafin Turanci Cajin banki Kiyasta cajin banki ko aika kudi kafin ka biya. Bude kayan aiki | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/albashi-da-haraji/` | 569 | English route label marked as fallback | Shafin Turanci Lissafin Paystack fee Kiyasta fee na hanyar karbar kudi don sayarwa ta yanar gizo da invoices. Bude kayan aiki | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/albashi-da-haraji/` | 573 | English route label marked as fallback | Shafin Turanci Margin na riba Kokoto margin, markup da farashin sayarwa bayan kudin kashewa. Bude kayan aiki | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/albashi-da-haraji/` | 576 | English route label marked as fallback | Shafin Turanci Dawo da jari Nemo yawan sayarwa da zai dawo da kudin kasuwanci. Bude kayan aiki | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/albashi-da-haraji/` | 579 | English route label marked as fallback | Shafin Turanci Kalkuleta na markup Kokoto markup da sabon farashin kaya cikin sauri. Bude kayan aiki | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/albashi-da-haraji/` | 582 | English route label marked as fallback | Shafin Turanci Tsarin kasuwanci Tsara kasuwanci, kudin kashewa, kudin shiga da matakan fara aiki. Bude kayan aiki | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/albashi-da-haraji/` | 588 | English route label marked as fallback | Shafin Turanci Rukunin kayan kasuwanci Nemo karin kayan aikin kasuwanci, farashi, invoice da gudanar da aiki. Bude rukunin | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/albashi-da-haraji/` | 592 | English route label marked as fallback | Shafin Turanci Kwatanta hanyoyin biyan kudi Kwatanta kudin biyan B2B da hanyoyin ketare kasa. Bude kayan aiki | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/albashi-da-haraji/` | 595 | English route label marked as fallback | Shafin Turanci Fees na mobile money Kwatanta fees na mobile money da sabis na fintech. Bude kayan aiki | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/albashi-da-haraji/` | 598 | English route label marked as fallback | Shafin Turanci Kwatanta aika kudi Kwatanta kudin aika kudi zuwa Afirka ko daga kasashen waje. Bude kayan aiki | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/albashi-da-haraji/` | 601 | English route label marked as fallback | Shafin Turanci Kwatanta bashi Kwatanta bashi, riba da biyan kudi kafin karbar bashi. Bude kayan aiki | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/albashi-da-haraji/` | 604 | English route label marked as fallback | Shafin Turanci Kalkuleta na mortgage Kiyasta bashin gida, biyan wata-wata da iya daukar nauyi. Bude kayan aiki | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/albashi-da-haraji/` | 607 | English route label marked as fallback | Shafin Turanci Burin ajiya Tsara ajiya zuwa buri tare da matakai da daidaita inflation. Bude kayan aiki | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/albashi-da-haraji/` | 610 | English route label marked as fallback | Shafin Turanci Kalkuleta na inflation Duba yadda inflation ke shafar albashi, ajiya da ikon siye. Bude kayan aiki | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/albashi-da-haraji/` | 613 | English route label marked as fallback | Shafin Turanci Komawar zuba jari Kiyasta sakamakon zuba jari na sauki, na taruwa da CAGR. Bude kayan aiki | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/albashi-da-haraji/` | 618 | English route label marked as fallback | Gaskiyar hanyar: "A Hausa" na nufin route din Hausa yana nan. "Shafin Turanci" na nufin shafin kayan aikin yana aiki amma bai samu cikakken Hausa ba tukuna. | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/albashi-da-haraji/` | 641 | brand or platform name | Yi invoice, duba VAT, sannan ka kiyasta fees na banki ko Paystack idan ana biyan ka ta yanar gizo. | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/albashi-da-haraji/` | 645 | English route label marked as fallback | SHAFIN TURANCI | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/harshe-da-fassara/` | 112 | intentional English fallback marker | English fallback EN | Batch 2 - Language and translation hub cleanup |
| `/ha/harshe-da-fassara/` | 115 | English route label marked as fallback | Bude shafin Turanci | Batch 2 - Language and translation hub cleanup |
| `/ha/harshe-da-fassara/` | 118 | intentional English fallback marker | English fallback EN | Batch 2 - Language and translation hub cleanup |
| `/ha/harshe-da-fassara/` | 124 | intentional English fallback marker | English fallback EN | Batch 2 - Language and translation hub cleanup |
| `/ha/harshe-da-fassara/` | 139 | intentional English fallback marker | English fallback EN | Batch 2 - Language and translation hub cleanup |
| `/ha/harshe-da-fassara/` | 145 | intentional English fallback marker | English fallback EN | Batch 2 - Language and translation hub cleanup |
| `/ha/harshe-da-fassara/` | 151 | intentional English fallback marker | English fallback EN | Batch 2 - Language and translation hub cleanup |
| `/ha/harshe-da-fassara/` | 165 | intentional English fallback marker | English fallback EN Yoruba Translator Taimako ga kalmomin Yoruba, gaisuwa, tones da phrases na yau da kullum. Bude Yoruba | Batch 2 - Language and translation hub cleanup |
| `/ha/harshe-da-fassara/` | 166 | intentional English fallback marker | English fallback EN Igbo Translator Duba kalmomin Igbo, phrases da amfani ga masu koyo ko masu rubuta content. Bude Igbo | Batch 2 - Language and translation hub cleanup |
| `/ha/harshe-da-fassara/` | 167 | intentional English fallback marker | English fallback EN Swahili Translator Fassara da koyon phrases na Kiswahili don East Africa, tafiya, aiki da kasuwanci. Bude Swahili | Batch 2 - Language and translation hub cleanup |
| `/ha/harshe-da-fassara/` | 168 | intentional English fallback marker | English fallback EN Amharic Translator Taimako ga Amharic da Ge'ez script don masu aiki da Ethiopia da Eritrea. Bude Amharic | Batch 2 - Language and translation hub cleanup |
| `/ha/ilimi/` | 401 | English route label marked as fallback | Shafin Turanci | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/ilimi/` | 419 | English route label marked as fallback | Shafin Turanci | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/ilimi/` | 425 | English route label marked as fallback | Shafin Turanci | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/ilimi/` | 450 | English route label marked as fallback | Shafin Turanci | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/ilimi/` | 456 | English route label marked as fallback | Shafin Turanci | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/ilimi/` | 462 | English route label marked as fallback | Shafin Turanci | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/ilimi/` | 468 | English route label marked as fallback | Shafin Turanci | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/ilimi/` | 474 | English route label marked as fallback | Shafin Turanci | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/ilimi/` | 480 | English route label marked as fallback | Shafin Turanci | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/` | 548 | English route label marked as fallback | SHAFIN TURANCI | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/` | 551 | English route label marked as fallback | Bude shafin Turanci | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/jamb/` | 458 | English route label marked as fallback | Shafin Turanci | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/` | 464 | English route label marked as fallback | Shafin Turanci | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/` | 482 | English route label marked as fallback | Shafin Turanci | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/jamb/` | 488 | English route label marked as fallback | Shafin Turanci | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/kasuwanci-da-haraji/` | 93 | English route label marked as fallback | Fara da Najeriya: lissafa VAT, duba PAYE, tsara invoice, sannan ka koma shafin Turanci idan kayan CIT, WHT, TIN ko rajistar kasuwanci bai samu cikakken Hausa ba tukuna. | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/kasuwanci-da-haraji/` | 114 | English route label marked as fallback | Shafin Turanci Nigeria CIT Kayan aiki don harajin kudin shiga na kamfani da shirin harajin kasuwanci. Bude kayan aiki | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/kasuwanci-da-haraji/` | 115 | English route label marked as fallback | Shafin Turanci Nigeria WHT Duba withholding tax don biyan kudi, kwangiloli da ayyukan kasuwanci. Bude kayan aiki | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/kasuwanci-da-haraji/` | 116 | English route label marked as fallback | Shafin Turanci TIN guide Bincika tax ID, TIN, TRN ko PIN a kasashen Afirka da takardun da ake bukata. Bude jagorar Turanci | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/kasuwanci-da-haraji/` | 117 | English route label marked as fallback | Shafin Turanci Rajistar kasuwanci Jerin dubawa don rajistar kasuwanci, takardu, kudade da hukumomi a kasashe daban-daban. Bude jagorar Turanci | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/kasuwanci-da-haraji/` | 118 | English route label marked as fallback | Shafin Turanci Break-even Kiyasta yawan sayarwa da zai mayar da jari bayan kudin dindindin da kudin da ke canzawa. Bude kayan aiki | Batch 2 - Salary/tax and VAT visible-copy cleanup |
| `/ha/kayan-aiki/` | 369 | intentional English fallback marker | Wannan jerin ya fara da hanyoyin Hausa da ke aiki, sannan ya nuna kayan aikin Najeriya da Afirka da suka fi amfani. Duk inda shafin kayan aiki bai samu Hausa ba tukuna, mun sa alamar English fallback a fili. | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 372 | intentional English fallback marker | 43 English fallback masu aiki | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 470 | intentional English fallback marker | Kowane kati a nan yana kai ka zuwa shafi mai aiki. Idan babu shafin Hausa tukuna, alamar English fallback tana nuna gaskiyar route din. | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 479 | intentional English fallback marker | English fallback Kalkuletan VAT Shafin Hausa yana bukatar karin gyaran rubutu; yi amfani da kayan aikin Turanci na yanzu. Bude kayan aiki | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 482 | intentional English fallback marker | English fallback Nigeria pension Kiyasta gudummawar pension don albashi da tsarin aiki. Bude kayan aiki | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 485 | intentional English fallback marker | English fallback Nigeria WHT Duba withholding tax don biyan kudi da ayyukan kasuwanci. Bude kayan aiki | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 488 | intentional English fallback marker | English fallback Kwatanta albashi Kwatanta tayin aiki, albashi da kudin shiga tsakanin wurare. Bude kayan aiki | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 491 | intentional English fallback marker | English fallback Minimum wage Duba mafi karancin albashi da bayanan aiki a kasashen Afirka. Bude kayan aiki | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 494 | intentional English fallback marker | English fallback Payslip generator Shirya payslip mai tsari don HR, ma'aikata ko bayanan albashi. Bude kayan aiki | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 509 | intentional English fallback marker | English fallback GPA calculator Kokoto GPA ko CGPA don jami'a da kwaleji. Bude kayan aiki | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 518 | brand or platform name | Hausa Matsa PDF Rage girman PDF don upload, email, portal ko WhatsApp. Bude kayan aiki | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 521 | intentional English fallback marker | English fallback PDF Workspace Aiki da PDF daga wuri daya: merge, split, compress da sign. Bude kayan aiki | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 533 | intentional English fallback marker | English fallback CV Builder Gina CV mai tsari kuma a sauke shi a PDF. Bude kayan aiki | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 539 | brand or platform name | Hausa WhatsApp Link Gina wa.me link, message, QR code da bulk links don kasuwanci. Bude kayan aiki | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 542 | intentional English fallback marker | English fallback Data plan compare Kwatanta data plans bisa farashi, validity da kudin GB. Bude kayan aiki | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 545 | intentional English fallback marker | English fallback Data usage calculator Kiyasta yawan data da browsing, video, WhatsApp da aiki ke bukata. Bude kayan aiki | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 548 | intentional English fallback marker | English fallback Bulk SMS pricing Kiyasta kudin aika SMS ga customers ko kungiya. Bude kayan aiki | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 551 | intentional English fallback marker | English fallback Currency converter Canja kudi tsakanin Naira, USD da sauran kudaden Afirka. Bude kayan aiki | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 554 | intentional English fallback marker | English fallback Bank charges Kwatanta kudin banki, charges da abin da aka cire. Bude kayan aiki | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 557 | intentional English fallback marker | English fallback Mobile money fees Duba kudin transfer da cash-out na mobile money a Afirka. Bude kayan aiki | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 560 | intentional English fallback marker | English fallback Remittance compare Kwatanta hanyoyin tura kudi da kudin fee tsakanin kasashe. Bude kayan aiki | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 563 | intentional English fallback marker | English fallback Paystack calculator Kiyasta payment fees da kudin da zai shigo bayan cire fee. Bude kayan aiki | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 581 | intentional English fallback marker | English fallback Irrigation calculator Shirya yawan ruwan ban ruwa da kudin aiki. Bude kayan aiki | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 584 | intentional English fallback marker | English fallback Commodity prices Duba farashin kasuwa da alamomin kayayyakin gona. Bude kayan aiki | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 590 | intentional English fallback marker | English fallback Duba genotype Shafin Hausa yana bukatar karin gyaran rubutu; yi amfani da kayan aikin Turanci na yanzu. Bude kayan aiki | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 593 | intentional English fallback marker | English fallback Jagorar sickle cell Shafin Hausa yana bukatar karin gyaran rubutu; yi amfani da kayan aikin Turanci na yanzu. Bude kayan aiki | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 596 | intentional English fallback marker | English fallback Drug dosage Kiyasta dosage bisa nauyi, tare da tunatarwar tabbatarwa daga likita. Bude kayan aiki | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 599 | intentional English fallback marker | English fallback Blood pressure Karanta BP a matsayin bayani, ba matsayin diagnosis ba. Bude kayan aiki | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 602 | intentional English fallback marker | English fallback Hausa Translator Kayan aikin fassara yana aiki, amma cikakken route din Hausa bai fito ba tukuna. Bude kayan aiki | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 605 | intentional English fallback marker | English fallback Yoruba Translator Taimakon fassara don Yoruba da kalmomin yau da kullum. Bude kayan aiki | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 608 | intentional English fallback marker | English fallback Swahili Translator Fassara da fahimtar phrases na Kiswahili. Bude kayan aiki | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 611 | intentional English fallback marker | English fallback Harshe da fassara Hub din Hausa yana bukatar karin gyaran rubutu; yi amfani da shafin Turanci na yanzu. Bude hub | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 614 | intentional English fallback marker | English fallback Profit margin Kokoto riba, markup da farashin sayarwa. Bude kayan aiki | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 617 | intentional English fallback marker | English fallback Break-even Nemo yawan sayarwa da zai dawo da kudin kasuwanci. Bude kayan aiki | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 620 | intentional English fallback marker | English fallback Business plan Shirya tsarin kasuwanci da matakan fara aiki. Bude kayan aiki | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 623 | intentional English fallback marker | English fallback Markup calculator Kokoto markup, margin da sabon farashin kaya. Bude kayan aiki | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 626 | intentional English fallback marker | English fallback VAT da harajin kasuwanci Hub din Hausa yana bukatar karin gyaran rubutu; yi amfani da shafin Turanci na yanzu. Bude hub | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/` | 631 | intentional English fallback marker | Gaskiyar link: Hausa-ready na nufin route din Hausa yana nan a repo. English fallback na nufin shafin kayan aiki yana aiki, amma cikakken shafin Hausa bai fito ba tukuna. Wannan ya hana jerin tura mutane zuwa matattun... | Batch 2 - Hausa hub visible-copy cleanup |
| `/ha/kayan-aiki/kalkuletan-jamb/` | 92 | English route label marked as fallback | Shafin Turanci | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/kayan-aiki/kalkuletan-waec-neco/` | 69 | English route label marked as fallback | Shafin Turanci | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/kayan-aiki/kalkuletan-waec-neco/` | 163 | brand or platform name |  WhatsApp | Batch 2 - Education and JAMB visible-copy cleanup |
| `/ha/kayan-aiki/kirkiro-invoice/` | 616 | brand or platform name | Mobile Money / WhatsApp | Batch 2 - Document, PDF, invoice, and Naira cleanup |
| `/ha/kayan-aiki/kirkiro-invoice/` | 617 | brand or platform name | M-Pesa, MoMo, Airtel Money, WhatsApp | Batch 2 - Document, PDF, invoice, and Naira cleanup |
| `/ha/kayan-aiki/kirkiro-invoice/` | 895 | brand or platform name | Eh. Saka hanyar biyan kudi, link din biya, mobile money ko WhatsApp, da bayanan banki domin PDF ya nuna wa abokin ciniki yadda zai biya. | Batch 2 - Document, PDF, invoice, and Naira cleanup |
| `/ha/kayan-aiki/lambobin-ussd/` | 80 | brand or platform name | Duba lambar ragowar kudi, data, katin waya, tura kudi, bashi da taimakon kwastoma. Najeriya ta bude da MTN, Airtel, Glo da 9mobile, sannan zaka iya zabar wasu kasashe daga bayanan sadarwa. | Batch 2 - Telecom and USSD visible-copy cleanup |
| `/ha/kayan-aiki/lambobin-ussd/` | 90 | brand or platform name | misali ragowar kudi, tura kudi, MTN... | Batch 2 - Telecom and USSD visible-copy cleanup |
| `/ha/kayan-aiki/whatsapp-link/` | 100 | brand or platform name | AfroTools Hausa / Sadarwa / WhatsApp Link | Batch 2 - Telecom and USSD visible-copy cleanup |
| `/ha/kayan-aiki/whatsapp-link/` | 101 | brand or platform name | Mai Gina WhatsApp Link | Batch 2 - Telecom and USSD visible-copy cleanup |
| `/ha/kayan-aiki/whatsapp-link/` | 102 | brand or platform name | Gina wa.me click-to-chat link da sakon farko. Yana da amfani ga masu sayarwa, isarwa, ajiyar lokaci da taimakon kwastoma a WhatsApp. | Batch 2 - Telecom and USSD visible-copy cleanup |
| `/ha/kayan-aiki/whatsapp-link/` | 110 | brand or platform name | Gina WhatsApp link | Batch 2 - Telecom and USSD visible-copy cleanup |
| `/ha/kayan-aiki/whatsapp-link/` | 155 | brand or platform name | Shirin link WhatsApp click-to-chat link yana bukatar cikakkiyar lambar kasa ba tare da alamar plus, baka ko tazara ba. | Batch 2 - Telecom and USSD visible-copy cleanup |
| `/ha/kayan-aiki/whatsapp-link/` | 180 | brand or platform name | WhatsApp link dinka | Batch 2 - Telecom and USSD visible-copy cleanup |
| `/ha/kayan-aiki/whatsapp-link/` | 187 | brand or platform name | Bude a WhatsApp | Batch 2 - Telecom and USSD visible-copy cleanup |

## ACCEPTED_TECH_TERM

Accepted terms: `PDF`, `API`, `JSON`, `USSD`, `JAMB`, `WAEC`, `NECO`, `NYSC`, `VAT`, `PAYE`, `BVN`, `NIN`, `FIRS`, `HTML`, `CSV`, `ZIP`.

The JSON ledger contains line-level accepted-term examples. These are tracked so future cleanup prompts do not waste time translating normal acronyms.

## CLEAN

- `/ha/kayan-aiki/abincin-afirka/`
- `/ha/kayan-aiki/alawus-na-nysc/`
- `/ha/kayan-aiki/duba-genotype/`
- `/ha/kayan-aiki/hada-da-raba-pdf/`
- `/ha/kayan-aiki/kirkiro-resit/`
- `/ha/kayan-aiki/kudin-asibiti/`
- `/ha/kayan-aiki/kudin-haihuwa/`
- `/ha/kayan-aiki/kwandon-kasuwa/`
- `/ha/kayan-aiki/kwatanta-farashin-magani/`
- `/ha/kayan-aiki/kwatanta-kudin-makaranta/`
- `/ha/kayan-aiki/matsa-pdf/`
- `/ha/kayan-aiki/naira-zuwa-kalmomi/`
- `/ha/kayan-aiki/ribar-gona/`
- `/ha/kayan-aiki/sarrafa-rogo/`
- `/ha/kayan-aiki/sickle-cell/`
- `/ha/noma/amfanin-gona-najeriya/`
- `/ha/noma/taki-najeriya/`

## Recommended Cleanup Order

1. Batch 2 - Hausa hub visible-copy cleanup
2. Batch 2 - Health and family visible-copy cleanup
3. Batch 2 - Language and translation hub cleanup
4. Batch 2 - Salary/tax and VAT visible-copy cleanup

## Notes

- `English fallback` labels are treated as possible false positives because some Hausa hubs intentionally disclose English fallback routes.
- Proper nouns, country names, brand names, and accepted technical acronyms are not blockers by themselves.
- This report does not edit Hausa page copy.
