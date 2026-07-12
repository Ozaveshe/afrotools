# Yoruba Visible Copy Leakage Ledger

Generated: 2026-07-12

This audit scans `yo/**/*.html` for visible English leakage only. It ignores scripts, styles, head metadata, JSON blobs, URLs, code/pre blocks, and accepted technical acronyms.

## Headline Metrics

- Yoruba route tree exists: yes
- Yoruba routes scanned: 45
- Clean routes: 12
- Routes with blockers: 21
- BLOCKER_VISIBLE_ENGLISH findings: 55
- POSSIBLE_FALSE_POSITIVE findings: 62
- ACCEPTED_TECH_TERM findings: 312

## Top 20 Blocker Routes

| Rank | Route | Blockers | Suggested owner batch |
|---:|---|---:|---|
| 1 | `/yo/awon-ise/alawus-na-nysc/` | 6 | Batch 1 - Education and exam shell |
| 2 | `/yo/awon-ise/kalkuletan-jamb/` | 6 | Batch 1 - Education and exam shell |
| 3 | `/yo/awon-ise/kalkuletan-waec-neco/` | 6 | Batch 1 - Education and exam shell |
| 4 | `/yo/awon-ise/kiriiro-invoice/` | 5 | Batch 1 - Document, PDF, invoice, and Naira shell |
| 5 | `/yo/awon-ise/kiriiro-risiti/` | 5 | Batch 1 - Document, PDF, invoice, and Naira shell |
| 6 | `/yo/awon-ise/cit-naijiria/` | 4 | Batch 1 - General Yoruba shell |
| 7 | `/yo/awon-ise/din-iwon-pdf/` | 4 | Batch 1 - Document, PDF, invoice, and Naira shell |
| 8 | `/yo/awon-ise/duba-genotype/` | 3 | Batch 1 - Health and family shell |
| 9 | `/yo/awon-ise/owo-ile-iwosan/` | 3 | Batch 1 - Health and family shell |
| 10 | `/yo/awon-ise/hada-ati-pin-pdf/` | 2 | Batch 1 - Document, PDF, invoice, and Naira shell |
| 11 | `/yo/awon-ise/agbon-oja/` | 1 | Batch 1 - General Yoruba shell |
| 12 | `/yo/awon-ise/ere-oko-eja/` | 1 | Batch 1 - Agriculture shell |
| 13 | `/yo/awon-ise/eso-irugbin/` | 1 | Batch 1 - Agriculture shell |
| 14 | `/yo/awon-ise/isuna-ogbin/` | 1 | Batch 1 - Agriculture shell |
| 15 | `/yo/awon-ise/iwon-ajile/` | 1 | Batch 1 - Agriculture shell |
| 16 | `/yo/awon-ise/ounje-eranko/` | 1 | Batch 1 - General Yoruba shell |
| 17 | `/yo/awon-ise/owo-oja-ogbin/` | 1 | Batch 1 - Agriculture shell |
| 18 | `/yo/awon-ise/sise-rogo/` | 1 | Batch 1 - General Yoruba shell |
| 19 | `/yo/awon-ise/whatsapp-link/` | 1 | Batch 1 - Telecom, USSD, and WhatsApp shell |
| 20 | `/yo/ibaraenisoro/` | 1 | Batch 1 - Telecom, USSD, and WhatsApp shell |

## BLOCKER_VISIBLE_ENGLISH

| Route | Line | Reason | Snippet | Owner batch |
|---|---:|---|---|---|
| `/yo/awon-ise/agbon-oja/` | 140 | English UI word signal: browser, data | Asiri ati opin: awọn iye ti o tẹ wa ninu browser yii. AfroTools ko fi data oko rẹ ranṣẹ si server. Eyi jẹ irinṣẹ eto ati afiyesi nikan; kii ṣe idiyele ọja osise, ijẹrisi ijọba, imọran inawo, tabi ileri ere. | Batch 1 - General Yoruba shell |
| `/yo/awon-ise/alawus-na-nysc/` | 194 | English UI label | Local-first export | Batch 1 - Education and exam shell |
| `/yo/awon-ise/alawus-na-nysc/` | 196 | English UI label | Capture NYSC allowance, state top-up, side income, expenses and monthly savings plan. The brief is generated in this browser so you can copy or download it for study, school, sponsor or budget follow-up. | Batch 1 - Education and exam shell |
| `/yo/awon-ise/alawus-na-nysc/` | 199 | English UI label | Copy brief | Batch 1 - Education and exam shell |
| `/yo/awon-ise/alawus-na-nysc/` | 200 | English UI label | Download .txt | Batch 1 - Education and exam shell |
| `/yo/awon-ise/alawus-na-nysc/` | 209 | English advisory phrase | Official verification: Verify allowance, state top-up, posting rules, PPA rules and payment notices with NYSC, the state or your PPA. | Batch 1 - Education and exam shell |
| `/yo/awon-ise/alawus-na-nysc/` | 211 | English UI word signal: estimate, official, payment | Limitations: This is a budget estimate, not an official NYSC payment notice, employment rule, financial advice or guarantee of state allowance. | Batch 1 - Education and exam shell |
| `/yo/awon-ise/cit-naijiria/` | 102 | English UI label | Methodology: The calculator subtracts capital allowances and exempt dividend inputs from assessable profit, applies the selected or auto-detected company size, then estimates CIT and development levy from the visible ... | Batch 1 - General Yoruba shell |
| `/yo/awon-ise/cit-naijiria/` | 103 | English advisory phrase | Source and freshness: This is a planning model for Nigerian company tax. CIT thresholds, levies, exemptions and filing practice can change, so verify with FIRS guidance, your accountant, or a tax adviser before filing... | Batch 1 - General Yoruba shell |
| `/yo/awon-ise/cit-naijiria/` | 104 | English UI label; English advisory phrase | Disclaimer and privacy: This is not official tax advice and does not file with FIRS. Values stay in this browser unless you copy them. | Batch 1 - General Yoruba shell |
| `/yo/awon-ise/cit-naijiria/` | 105 | English UI label | Open the full English CIT calculator or request a CIT widget or custom calculator . | Batch 1 - General Yoruba shell |
| `/yo/awon-ise/din-iwon-pdf/` | 165 | English UI label | Methodology: The compressor estimates original and compressed sizes from the selected PDF files, compression preset, DPI and quality settings, then offers a browser download or ZIP output where supported. | Batch 1 - Document, PDF, invoice, and Naira shell |
| `/yo/awon-ise/din-iwon-pdf/` | 166 | English result label; English form label | Source and freshness: The workflow follows the AfroTools Document & PDF category contract for browser-local PDF utilities. Compression results vary by PDF content, scan quality, images and whether selectable text can ... | Batch 1 - Document, PDF, invoice, and Naira shell |
| `/yo/awon-ise/din-iwon-pdf/` | 167 | English UI label; English advisory phrase | Disclaimer and privacy: This is a file utility, not an official document validation service. Files stay in the browser during compression unless you choose to download or share an output. | Batch 1 - Document, PDF, invoice, and Naira shell |
| `/yo/awon-ise/din-iwon-pdf/` | 168 | English UI label | Open the full English compressor or continue in the Document & PDF hub . | Batch 1 - Document, PDF, invoice, and Naira shell |
| `/yo/awon-ise/duba-genotype/` | 146 | English UI label | Local-first export | Batch 1 - Health and family shell |
| `/yo/awon-ise/duba-genotype/` | 160 | English advisory phrase | Source: Based on the AfroTools source workflow at . Verify any health, lab, facility, insurance or price decision with a qualified provider. | Batch 1 - Health and family shell |
| `/yo/awon-ise/duba-genotype/` | 163 | English result label | Limitations: Limitations: kii se lab result, kii se diagnosis, ko si ropo medical advice, oyun advice tabi counselling. | Batch 1 - Health and family shell |
| `/yo/awon-ise/ere-oko-eja/` | 136 | English UI word signal: browser, data | Asiri ati opin: awọn iye ti o tẹ wa ninu browser yii. AfroTools ko fi data oko rẹ ranṣẹ si server. Eyi jẹ irinṣẹ eto ati afiyesi nikan; kii ṣe idiyele ọja osise, ijẹrisi ijọba, imọran inawo, tabi ileri ere. | Batch 1 - Agriculture shell |
| `/yo/awon-ise/eso-irugbin/` | 165 | English UI word signal: browser, data | Asiri ati opin: awọn iye ti o tẹ wa ninu browser yii. AfroTools ko fi data oko rẹ ranṣẹ si server. Eyi jẹ irinṣẹ eto ati afiyesi nikan; kii ṣe idiyele ọja osise, ijẹrisi ijọba, imọran inawo, tabi ileri ere. | Batch 1 - Agriculture shell |
| `/yo/awon-ise/hada-ati-pin-pdf/` | 198 | English UI label | Ilana: Ilana n ka àwọn PDF ninu aṣàwákiri, yan oju-iwe, lẹ́yìnna ṣẹda faili tuntun fun download. | Batch 1 - Document, PDF, invoice, and Naira shell |
| `/yo/awon-ise/hada-ati-pin-pdf/` | 199 | English UI label | Orísun lati jẹ́risi: Lo PDF atilẹba rẹ gẹgẹ bi orísun; ṣàyẹ̀wò oju-iwe ati àṣẹ wọn ṣaaju download. | Batch 1 - Document, PDF, invoice, and Naira shell |
| `/yo/awon-ise/isuna-ogbin/` | 144 | English UI word signal: browser, data | Asiri ati opin: awọn iye ti o tẹ wa ninu browser yii. AfroTools ko fi data oko rẹ ranṣẹ si server. Eyi jẹ irinṣẹ eto ati afiyesi nikan; kii ṣe idiyele ọja osise, ijẹrisi ijọba, imọran inawo, tabi ileri ere. | Batch 1 - Agriculture shell |
| `/yo/awon-ise/iwon-ajile/` | 166 | English UI word signal: browser, data | Asiri ati opin: awọn iye ti o tẹ wa ninu browser yii. AfroTools ko fi data oko rẹ ranṣẹ si server. Eyi jẹ irinṣẹ eto ati afiyesi nikan; kii ṣe idiyele ọja osise, ijẹrisi ijọba, imọran inawo, tabi ileri ere. | Batch 1 - Agriculture shell |
| `/yo/awon-ise/kalkuletan-jamb/` | 203 | English UI label | Local-first export | Batch 1 - Education and exam shell |
| `/yo/awon-ise/kalkuletan-jamb/` | 205 | English UI label | Capture UTME score, Post-UTME score, O-Level inputs, formula and cutoff planning. The brief is generated in this browser so you can copy or download it for study, school, sponsor or budget follow-up. | Batch 1 - Education and exam shell |
| `/yo/awon-ise/kalkuletan-jamb/` | 208 | English UI label | Copy brief | Batch 1 - Education and exam shell |
| `/yo/awon-ise/kalkuletan-jamb/` | 209 | English UI label | Download .txt | Batch 1 - Education and exam shell |
| `/yo/awon-ise/kalkuletan-jamb/` | 218 | English advisory phrase | Official verification: Confirm current JAMB rules, school formulas, cut-offs, subject combinations and admission notices with JAMB or the institution. | Batch 1 - Education and exam shell |
| `/yo/awon-ise/kalkuletan-jamb/` | 220 | English UI label | Limitations: This is a planning calculator, not an official JAMB portal, admission offer, cut-off guarantee or school-specific ruling. | Batch 1 - Education and exam shell |
| `/yo/awon-ise/kalkuletan-waec-neco/` | 162 | English UI label | Local-first export | Batch 1 - Education and exam shell |
| `/yo/awon-ise/kalkuletan-waec-neco/` | 164 | English UI label | Capture WAEC grades, best five total, credits and next study action. The brief is generated in this browser so you can copy or download it for study, school, sponsor or budget follow-up. | Batch 1 - Education and exam shell |
| `/yo/awon-ise/kalkuletan-waec-neco/` | 167 | English UI label | Copy brief | Batch 1 - Education and exam shell |
| `/yo/awon-ise/kalkuletan-waec-neco/` | 168 | English UI label | Download .txt | Batch 1 - Education and exam shell |
| `/yo/awon-ise/kalkuletan-waec-neco/` | 177 | English advisory phrase | Official verification: Verify final WAEC, NECO, school and admission requirements from the official exam body, school portal or admissions office. | Batch 1 - Education and exam shell |
| `/yo/awon-ise/kalkuletan-waec-neco/` | 179 | English result label | Limitations: This is an education planning estimate, not an official result checker, certificate validation, or admission decision. | Batch 1 - Education and exam shell |
| `/yo/awon-ise/kiriiro-invoice/` | 115 | English UI label; English result label; English form label | Methodology: this page adds invoice lines, quantity, unit price, VAT rate, paid amount, total due, and balance, then lets you copy the summary or print as PDF from the browser. | Batch 1 - Document, PDF, invoice, and Naira shell |
| `/yo/awon-ise/kiriiro-invoice/` | 116 | English advisory phrase | Source check: confirm VAT treatment, TIN, invoice numbering, e-invoicing, and record rules with FIRS or your accountant before filing. | Batch 1 - Document, PDF, invoice, and Naira shell |
| `/yo/awon-ise/kiriiro-invoice/` | 117 | English advisory phrase | Disclaimer: planning invoice only, not an official tax invoice, legal advice, tax advice, or government filing. | Batch 1 - Document, PDF, invoice, and Naira shell |
| `/yo/awon-ise/kiriiro-invoice/` | 118 | English UI label | Privacy: values stay in your browser unless you choose to copy, print, or share them. | Batch 1 - Document, PDF, invoice, and Naira shell |
| `/yo/awon-ise/kiriiro-invoice/` | 120 | English UI label; English result label | Next workflow Build the invoice, copy the summary, then print or save as PDF. For a branded invoice widget or client workflow, use business enquiry , widgets , or custom calculators . | Batch 1 - Document, PDF, invoice, and Naira shell |
| `/yo/awon-ise/kiriiro-risiti/` | 115 | English UI label; English result label; English form label | Methodology: this receipt adds line items, VAT, payment method, reference, amount received, and receipt status, then lets you copy the summary or print as PDF from the browser. | Batch 1 - Document, PDF, invoice, and Naira shell |
| `/yo/awon-ise/kiriiro-risiti/` | 116 | English advisory phrase | Source check: confirm VAT, payment proof, receipt numbering, and tax-record rules with FIRS, your bank record, or your accountant before using it for filing. | Batch 1 - Document, PDF, invoice, and Naira shell |
| `/yo/awon-ise/kiriiro-risiti/` | 117 | English advisory phrase | Disclaimer: planning receipt only, not an official government receipt, legal advice, tax advice, or proof of bank settlement by itself. | Batch 1 - Document, PDF, invoice, and Naira shell |
| `/yo/awon-ise/kiriiro-risiti/` | 118 | English UI label | Privacy: receipt values stay in your browser unless you choose to copy, print, or share them. | Batch 1 - Document, PDF, invoice, and Naira shell |
| `/yo/awon-ise/kiriiro-risiti/` | 120 | English UI label; English result label | Next workflow Create the receipt after payment, copy the summary, then print or save as PDF. For a branded receipt widget or client workflow, use business enquiry , widgets , or custom calculators . | Batch 1 - Document, PDF, invoice, and Naira shell |
| `/yo/awon-ise/ounje-eranko/` | 134 | English UI word signal: browser, data | Asiri ati opin: awọn iye ti o tẹ wa ninu browser yii. AfroTools ko fi data oko rẹ ranṣẹ si server. Eyi jẹ irinṣẹ eto ati afiyesi nikan; kii ṣe idiyele ọja osise, ijẹrisi ijọba, imọran inawo, tabi ileri ere. | Batch 1 - General Yoruba shell |
| `/yo/awon-ise/owo-ile-iwosan/` | 132 | English UI label | Local-first export | Batch 1 - Health and family shell |
| `/yo/awon-ise/owo-ile-iwosan/` | 146 | English advisory phrase | Source: Based on the AfroTools source workflow at . Verify any health, lab, facility, insurance or price decision with a qualified provider. | Batch 1 - Health and family shell |
| `/yo/awon-ise/owo-ile-iwosan/` | 149 | English UI word signal: medical, emergency, diagnosis | Limitations: Limitations: kii se invoice osise, kii se medical advice, ko si ropo emergency care tabi diagnosis. | Batch 1 - Health and family shell |
| `/yo/awon-ise/owo-oja-ogbin/` | 134 | English UI word signal: browser, data | Asiri ati opin: awọn iye ti o tẹ wa ninu browser yii. AfroTools ko fi data oko rẹ ranṣẹ si server. Eyi jẹ irinṣẹ eto ati afiyesi nikan; kii ṣe idiyele ọja osise, ijẹrisi ijọba, imọran inawo, tabi ileri ere. | Batch 1 - Agriculture shell |
| `/yo/awon-ise/sise-rogo/` | 160 | English UI word signal: browser, data | Asiri ati opin: awọn iye ti o tẹ wa ninu browser yii. AfroTools ko fi data oko rẹ ranṣẹ si server. Eyi jẹ irinṣẹ eto ati afiyesi nikan; kii ṣe idiyele ọja osise, ijẹrisi ijọba, imọran inawo, tabi ileri ere. | Batch 1 - General Yoruba shell |
| `/yo/awon-ise/whatsapp-link/` | 117 | English form label | Ìlànà: Ìṣirò náà ń mú nọ́ńbà fóònù, kó country code pọ̀, ó sì fi ọ̀rọ̀ ránṣẹ́ sínú wa.me URL. | Batch 1 - Telecom, USSD, and WhatsApp shell |
| `/yo/ibaraenisoro/` | 331 | English UI word signal: data | Àfiwé data Ojú ìwé àfiwé pákẹ́ẹ̀jì Ṣàyẹ̀wò àfikún data ni oju ìwé Gẹ̀ẹ́sì ti AfroTools. | Batch 1 - Telecom, USSD, and WhatsApp shell |
| `/yo/ilera/` | 169 | English UI word signal: and, safety | Source AfroTools health hub, linked Yoruba health tools and safety notes. | Batch 1 - Health and family shell |

## POSSIBLE_FALSE_POSITIVE

| Route | Line | Reason | Snippet | Owner batch |
|---|---:|---|---|---|
| `/yo/awon-ise/agbon-oja/` | 120 | English route label marked as fallback | Ṣí ojú ìwé Gẹẹsi fun ìkójọpọ̀ ọja | Batch 1 - General Yoruba shell |
| `/yo/awon-ise/amulo-data/` | 75 | brand or platform name | Ṣe àfiyèsí iye GB ti o yẹ kí o ra fun ìwádìí wẹẹbu, fidio, ìpè fidio, iṣẹ́ ilé-ẹ̀kọ́ ati iṣẹ́ ọfiisi. Abajade jẹ́ ìtọ́nisọ́nà, kii ṣe iye osise MTN, Airtel, Glo tabi 9mobile. | Batch 1 - General Yoruba shell |
| `/yo/awon-ise/amulo-data/` | 103 | brand or platform name | WhatsApp ati àwùjọ wẹẹbu fun ọjọ́ kan, wákàtí | Batch 1 - General Yoruba shell |
| `/yo/awon-ise/amulo-data/` | 112 | English route label marked as fallback | Ṣí ojú ìwé Gẹẹsi | Batch 1 - General Yoruba shell |
| `/yo/awon-ise/duba-genotype/` | 127 | English route label marked as fallback | Ṣí ojú ìwé Gẹẹsi fun ẹya kikun to ṣi wà ní Gẹẹsi. | Batch 1 - Health and family shell |
| `/yo/awon-ise/ere-oko-eja/` | 117 | English route label marked as fallback | Ṣí ojú ìwé Gẹẹsi | Batch 1 - Agriculture shell |
| `/yo/awon-ise/` | 173 | brand or platform name | Wa USSD, data, foonu tàbí WhatsApp | Batch 1 - Yoruba shell hubs |
| `/yo/awon-ise/isuna-ogbin/` | 119 | English route label marked as fallback | Ṣí ojú ìwé Gẹẹsi | Batch 1 - Agriculture shell |
| `/yo/awon-ise/kalkuletan-bmi/` | 89 | English route label marked as fallback | Ṣí ojú ìwé Gẹẹsi fun ẹya kikun to ṣi wà ní Gẹẹsi. | Batch 1 - General Yoruba shell |
| `/yo/awon-ise/lambobin-ussd/` | 61 | brand or platform name | Yan orílẹ̀-èdè, wa iṣẹ́ kan, ki o daakọ lambar fún ìyókù, káríìdì, GB, fífi owó ránṣẹ́, yíyá káríìdì tabi ìrànwọ́ alabara. Naijiria wa ni iwaju pẹlu MTN, Airtel, Glo ati 9mobile. | Batch 1 - Telecom, USSD, and WhatsApp shell |
| `/yo/awon-ise/lambobin-ussd/` | 73 | brand or platform name | àpẹẹrẹ: MTN, ìyókù, káríìdì | Batch 1 - Telecom, USSD, and WhatsApp shell |
| `/yo/awon-ise/lambobin-ussd/` | 79 | brand or platform name | Orisun, ona ise ati ikilo: Atokọ yii n ka data lati katalogi telecom AfroTools ti o wa ninu repo, kii se ipe live si MTN, Airtel, Glo, 9mobile tabi banki. Ilana iṣẹ rẹ ni yan orilẹ-ede, wa iṣẹ, daakọ lambar, lẹhinna ṣ... | Batch 1 - Telecom, USSD, and WhatsApp shell |
| `/yo/awon-ise/lambobin-ussd/` | 82 | brand or platform name | Ṣe gbogbo lambar ṣiṣẹ fun gbogbo SIM? Rara. Lambar kan le jẹ́ ti MTN, Airtel, Glo, 9mobile tabi banki kan pato. Yan orílẹ̀-èdè ati olùpèsè to ba SIM rẹ mu. | Batch 1 - Telecom, USSD, and WhatsApp shell |
| `/yo/awon-ise/olufassara-yoruba/` | 101 | English route label marked as fallback | Ojú ìwé Gẹẹsi Yorùbá phrasebook tó gbooro Ojú Gẹẹsi naa ni akojọ gbolohun diẹ sii. | Batch 1 - General Yoruba shell |
| `/yo/awon-ise/olufassara-yoruba/` | 102 | English route label marked as fallback | Ojú ìwé Gẹẹsi Ìtumọ̀ PDF Lo fun ìmúrasílẹ̀ nikan, kii ṣe ìtumọ̀ tí a fọwọ́sí. | Batch 1 - General Yoruba shell |
| `/yo/awon-ise/olufassara-yoruba/` | 103 | English route label marked as fallback | Ojú ìwé Gẹẹsi Hausa translator Phrasebook Hausa fun ìkíni ati ọrọ ojoojumọ. | Batch 1 - General Yoruba shell |
| `/yo/awon-ise/ounje-eranko/` | 115 | English route label marked as fallback | Ṣí ojú ìwé Gẹẹsi | Batch 1 - General Yoruba shell |
| `/yo/awon-ise/owo-ile-iwosan/` | 113 | English route label marked as fallback | Ṣí ojú ìwé Gẹẹsi fun ẹya kikun to ṣi wà ní Gẹẹsi. | Batch 1 - Health and family shell |
| `/yo/awon-ise/owo-oja-ogbin/` | 114 | English route label marked as fallback | Ṣí ojú ìwé Gẹẹsi | Batch 1 - Agriculture shell |
| `/yo/awon-ise/rajista-sim-nin/` | 70 | brand or platform name | MTN | Batch 1 - General Yoruba shell |
| `/yo/awon-ise/rajista-sim-nin/` | 71 | brand or platform name | Airtel | Batch 1 - General Yoruba shell |
| `/yo/awon-ise/rajista-sim-nin/` | 72 | brand or platform name | Glo | Batch 1 - General Yoruba shell |
| `/yo/awon-ise/rajista-sim-nin/` | 73 | brand or platform name | 9mobile | Batch 1 - General Yoruba shell |
| `/yo/awon-ise/rajista-sim-nin/` | 230 | brand or platform name | MTN Nigeria Àpẹẹrẹ orísun olùpèsè fún ètò data ati iye owó tuntun. Ṣí MTN | Batch 1 - General Yoruba shell |
| `/yo/awon-ise/rajista-sim-nin/` | 231 | brand or platform name | Airtel Nigeria Àpẹẹrẹ orísun olùpèsè fún ìmúdójúìwọ̀n ètò data. Ṣí Airtel | Batch 1 - General Yoruba shell |
| `/yo/awon-ise/sickle-cell/` | 87 | English route label marked as fallback | Ṣí ojú ìwé Gẹẹsi fun ẹya kikun to ṣi wà ní Gẹẹsi. | Batch 1 - Health and family shell |
| `/yo/awon-ise/whatsapp-link/` | 75 | brand or platform name | AfroTools Yorùbá / Ìbáraẹnisọrọ / WhatsApp | Batch 1 - Telecom, USSD, and WhatsApp shell |
| `/yo/awon-ise/whatsapp-link/` | 76 | brand or platform name | Ṣẹda ìjápọ̀ WhatsApp | Batch 1 - Telecom, USSD, and WhatsApp shell |
| `/yo/awon-ise/whatsapp-link/` | 77 | brand or platform name | Fun alabara ọna taara si WhatsApp rẹ. Yan koodu orilẹ-ede, tẹ nọ́ńbà, kọ ọrọ ifiranṣẹ, ki o gba wa.me link ti o mọ. | Batch 1 - Telecom, USSD, and WhatsApp shell |
| `/yo/awon-ise/whatsapp-link/` | 102 | brand or platform name | Ìjápọ̀ WhatsApp wa.me | Batch 1 - Telecom, USSD, and WhatsApp shell |
| `/yo/awon-ise/whatsapp-link/` | 109 | brand or platform name | Ṣí ninu WhatsApp | Batch 1 - Telecom, USSD, and WhatsApp shell |
| `/yo/awon-ise/whatsapp-link/` | 116 | brand or platform name | Ààlà fún ìjápọ̀ WhatsApp | Batch 1 - Telecom, USSD, and WhatsApp shell |
| `/yo/awon-ise/whatsapp-link/` | 124 | English route label marked as fallback | Ṣàyẹ̀wò nọ́ńbà ṣaaju fifiranṣẹ. Ma fi ọrọ aṣiri, BVN, NIN, PIN tabi alaye kaadi sinu ọrọ ti a ti pese tẹlẹ. Fun QR ati iṣẹ́ ọ̀pọ̀ ìjápọ̀, ṣí ojú ìwé Gẹẹsi . | Batch 1 - Telecom, USSD, and WhatsApp shell |
| `/yo/awon-ise/whatsapp-link/` | 126 | brand or platform name | Ṣe ìjápọ̀ yii ṣiṣẹ lori foonu ati kọ̀ǹpútà? Bẹẹni. wa.me link maa ṣí WhatsApp tabi WhatsApp Web, da lori ẹrọ alabara. | Batch 1 - Telecom, USSD, and WhatsApp shell |
| `/yo/ede-ati-itumo/` | 129 | English route label marked as fallback | Ojú ìwé Gẹẹsi Yorùbá phrasebook tó gbooro Ojú Gẹẹsi pẹlu akojọ gbolohun pupọ. Lo o bi orisun, ṣugbọn ṣayẹwo tone ati ìtumọ̀ pẹlu ẹni tó mọ Yorùbá. | Batch 1 - Language and translation shell |
| `/yo/ede-ati-itumo/` | 130 | English route label marked as fallback | Ojú ìwé Gẹẹsi Hausa translator Phrasebook Hausa ni Gẹẹsi fun ìkíni, ọja, ìrìnàjò ati ọrọ ojoojumọ. | Batch 1 - Language and translation shell |
| `/yo/ede-ati-itumo/` | 131 | English route label marked as fallback | Ojú ìwé Gẹẹsi Igbo translator Ìrànwọ́ Igbo ni Gẹẹsi fun gbolohun ipilẹ ati ọrọ lilo ojoojumọ. | Batch 1 - Language and translation shell |
| `/yo/ede-ati-itumo/` | 132 | English route label marked as fallback | Ojú ìwé Gẹẹsi Swahili translator Ìrànwọ́ Swahili fun irin-ajo, iṣẹ́ ati ìbáraẹnisọrọ ni ila-oorun Afirika. | Batch 1 - Language and translation shell |
| `/yo/ede-ati-itumo/` | 133 | English route label marked as fallback | Ojú ìwé Gẹẹsi Pidgin translator Ìrànwọ́ Pidgin Naijiria fun gbolohun lasan, awada ati ìbáraẹnisọrọ. | Batch 1 - Language and translation shell |
| `/yo/ede-ati-itumo/` | 134 | English route label marked as fallback | Ojú ìwé Gẹẹsi Ìtumọ̀ PDF Ojú Gẹẹsi fun PDF. Ma lo fun ìwé òfin, ìlera, ile-ẹ̀kọ́ tabi ijọba lai jẹ́risi pẹlu olùtumọ̀ ọjọ́gbọn. | Batch 1 - Language and translation shell |
| `/yo/ibaraenisoro/` | 156 | brand or platform name | Naijiria ni a fi àpẹẹrẹ MTN, Airtel, Glo ati 9mobile sí. | Batch 1 - Telecom, USSD, and WhatsApp shell |
| `/yo/ibaraenisoro/` | 161 | brand or platform name | MTN | Batch 1 - Telecom, USSD, and WhatsApp shell |
| `/yo/ibaraenisoro/` | 162 | brand or platform name | Airtel | Batch 1 - Telecom, USSD, and WhatsApp shell |
| `/yo/ibaraenisoro/` | 163 | brand or platform name | Glo | Batch 1 - Telecom, USSD, and WhatsApp shell |
| `/yo/ibaraenisoro/` | 164 | brand or platform name | 9mobile | Batch 1 - Telecom, USSD, and WhatsApp shell |
| `/yo/ibaraenisoro/` | 183 | brand or platform name | Iṣẹ́ ọjà, POS, WhatsApp Business ati ọfiisi | Batch 1 - Telecom, USSD, and WhatsApp shell |
| `/yo/ibaraenisoro/` | 316 | brand or platform name | Ma fi PIN, BVN, NIN tabi ọrọ ìkọ̀kọ̀ ranṣẹ́ lori WhatsApp. | Batch 1 - Telecom, USSD, and WhatsApp shell |
| `/yo/ibaraenisoro/` | 325 | brand or platform name | Lo àwọn ojú ìwé wọnyi fun ìmúrasílẹ̀ SIM, USSD, data ati WhatsApp. | Batch 1 - Telecom, USSD, and WhatsApp shell |
| `/yo/ibaraenisoro/` | 330 | brand or platform name | WhatsApp Ìjápọ̀ WhatsApp Ṣẹda ìjápọ̀ fun ìbéèrè oníbàárà tàbí ìrànwọ́ iṣẹ́. | Batch 1 - Telecom, USSD, and WhatsApp shell |
| `/yo/ibaraenisoro/` | 340 | brand or platform name | AfroTools kì í ṣe oju ìwé ìjọba, kì í ṣe olùpèsè nẹ́tíwọ́ọ̀kì, kò sì rọ́pò ìpinnu NCC, NIMC, banki, MTN, Airtel, Glo, 9mobile tabi olùpèsè míràn. Àwọn abajade jẹ́ ìmúrasílẹ̀ nikan. Ṣàyẹ̀wò orísun osise ṣaaju ìsanwo tà... | Batch 1 - Telecom, USSD, and WhatsApp shell |
| `/yo/ibaraenisoro/` | 348 | brand or platform name | MTN Nigeria data plans fun àpẹẹrẹ pákẹ́ẹ̀jì tó yí padà. | Batch 1 - Telecom, USSD, and WhatsApp shell |
| `/yo/ibaraenisoro/` | 349 | brand or platform name | Airtel Nigeria fun àpẹẹrẹ ikanni olùpèsè. | Batch 1 - Telecom, USSD, and WhatsApp shell |
| `/yo/ilera/` | 131 | English route label marked as fallback | Ojú ìwé Gẹẹsi Ìtumọ̀ ìwé yàrá Fun alaye gbogbogbo lori ìwé yàrá, pẹlu ìkìlọ̀ lati jẹ́risi pẹlu ọjọgbọn. | Batch 1 - Health and family shell |
| `/yo/ilera/` | 132 | English route label marked as fallback | Ojú ìwé Gẹẹsi Blood group jinlẹ̀ Oju afikun fun blood group ati Rh, ṣi wà ní Gẹẹsi. | Batch 1 - Health and family shell |
| `/yo/ilera/` | 133 | English route label marked as fallback | Ojú ìwé Gẹẹsi Ìfiwéra owó oogun Ṣe ìfiwéra owó, ṣugbọn ma yi oogun pada lai ba onímọ̀ oogun tabi oníṣègùn sọrọ. | Batch 1 - Health and family shell |
| `/yo/` | 105 | English route label marked as fallback | VAT Naijiria - ojú ìwé Gẹẹsi Owó-orí iṣẹ́ | Batch 1 - Yoruba shell hubs |
| `/yo/` | 106 | English route label marked as fallback | PDF Workspace - ojú ìwé Gẹẹsi Ìwé àti PDF | Batch 1 - Yoruba shell hubs |
| `/yo/` | 107 | English route label marked as fallback | JAMB aggregate - ojú ìwé Gẹẹsi Ẹ̀kọ́ | Batch 1 - Yoruba shell hubs |
| `/yo/iwe-ati-pdf/` | 138 | brand or platform name | Dín ìwọ̀n PDF kù fún WhatsApp, imeeli, portal ilé-ẹ̀kọ́, ìbéèrè iṣẹ́, tàbí fifiranṣẹ́ sí oníbàárà. | Batch 1 - Document, PDF, invoice, and Naira shell |
| `/yo/iwe-ati-pdf/` | 288 | brand or platform name | Darapọ̀ ID, risiti, ìwé banki tàbí scan, dín kù fún WhatsApp, ṣùgbọ́n ma ṣe fi gbogbo ìwé ránṣẹ́ bí ojú-iwe kan ṣoṣo tó to. | Batch 1 - Document, PDF, invoice, and Naira shell |
| `/yo/naijiria/` | 154 | brand or platform name | USSD, data, foonu, WhatsApp | Batch 1 - Yoruba shell hubs |
| `/yo/owo-ori-owo-ise/` | 99 | English route label marked as fallback | VAT Naijiria - ojú ìwé Gẹẹsi Fun oṣuwọn VAT Naijiria, exempt, zero-rated ati reverse VAT. Ṣí ojú Gẹẹsi | Batch 1 - Salary, PAYE, and VAT shell |

## ACCEPTED_TECH_TERM

Accepted terms: `PDF`, `API`, `JSON`, `USSD`, `JAMB`, `WAEC`, `NECO`, `NYSC`, `VAT`, `PAYE`, `BVN`, `NIN`, `FIRS`, `HTML`, `CSV`, `ZIP`.

The JSON ledger contains line-level accepted-term examples. These are tracked so future cleanup prompts do not waste time translating normal acronyms.

## CLEAN

- `/yo/awon-ise/ere-ogbin/`
- `/yo/awon-ise/forukosile-owo-ise/`
- `/yo/awon-ise/kalkuletan-vat/`
- `/yo/awon-ise/naira-si-oro/`
- `/yo/awon-ise/tin-naijiria/`
- `/yo/awon-ise/tunto-pdf/`
- `/yo/awon-ise/wht-naijiria/`
- `/yo/awon-ise/wurin-pdf/`
- `/yo/eko/`
- `/yo/naijiria/owo-ori-owo-osu/`
- `/yo/ogbin/`
- `/yo/owo-osu-ati-owo-ori/`

## Recommended Cleanup Order

1. Batch 1 - Education and exam shell
2. Batch 1 - Document, PDF, invoice, and Naira shell
3. Batch 1 - General Yoruba shell
4. Batch 1 - Health and family shell
5. Batch 1 - Agriculture shell
6. Batch 1 - Telecom, USSD, and WhatsApp shell

## Notes

- `ojú ìwé Gẹẹsi` labels are treated as possible false positives because Yoruba shell links can intentionally disclose English fallback routes.
- Proper nouns, country names, brand names, and accepted technical acronyms are not blockers by themselves.
- This report does not edit Yoruba page copy.
