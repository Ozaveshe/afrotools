(function (root, factory) {
  var api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.SwahiliDocumentPdfLocalizer = api;
    if (root.document) api.install(root.document);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  var phrases = {
    'Upload PDF': 'Pakia PDF',
    'Choose PDF': 'Chagua PDF',
    'Select PDF files': 'Chagua faili za PDF',
    'No file selected': 'Hakuna faili iliyochaguliwa',
    'Remove file': 'Ondoa faili',
    'Remove': 'Ondoa',
    'Clear': 'Futa',
    'Cancel': 'Ghairi',
    'Close': 'Funga',
    'Save': 'Hifadhi',
    'Copy': 'Nakili',
    'Print': 'Chapisha',
    'Download': 'Pakua',
    'Download PDF': 'Pakua PDF',
    'Download DOC': 'Pakua DOC',
    'Download DOCX': 'Pakua DOCX',
    'Download Text': 'Pakua maandishi',
    'Download TXT': 'Pakua TXT',
    'Download CSV': 'Pakua CSV',
    'Download JSON': 'Pakua JSON',
    'Download ZIP': 'Pakua ZIP',
    'Download Report': 'Pakua ripoti',
    'Close workspace and return to the upload screen': 'Funga nafasi ya kazi na urudi kwenye skrini ya kupakia',
    'Example: compress my PDF under 2 MB': 'Mfano: bana PDF yangu iwe chini ya MB 2',
    'Left, center, right': 'Kushoto, katikati, kulia',
    'PDF → Text': 'PDF → Maandishi',
    'PDF → Images': 'PDF → Picha',
    'Word → PDF': 'Word kwenda PDF',
    'Page {page} of {pages}': 'Ukurasa {page} kati ya {pages}',
    'All, 1-3, 5': 'Zote, 1-3, 5',
    'Preview zoom': 'Ukuzaji wa hakiki',
    'Document Type': 'Aina ya hati',
    'Government, ID, visa, certificates': 'Serikali, kitambulisho, visa na vyeti',
    'Legal, business, contracts': 'Sheria, biashara na mikataba',
    'Education, scholarship, school': 'Elimu, ufadhili wa masomo na shule',
    'Trade, agriculture, market, customs': 'Biashara, kilimo, soko na forodha',
    'Tokens: {prefix}, {num}, {suffix}, {file}, {page}, {total}, {date}': 'Ishara: {prefix}, {num}, {suffix}, {file}, {page}, {total}, {date}',
    'Common formats include a matter or case prefix such as "CASE-" and a suffix such as "-CONF". You can also use the template field with tokens like {file}, {page}, {total}, and {date} for document-aware stamps.': 'Miundo ya kawaida hujumuisha kiambishi awali cha suala au kesi kama "CASE-" na kiambishi tamati kama "-CONF". Unaweza pia kutumia uga wa kiolezo pamoja na ishara {file}, {page}, {total} na {date} kwa mihuri inayotambua hati.',
    'Document input mode': 'Hali ya kuingiza hati',
    'Hello World': 'Habari Dunia',
    'Paste your HTML code here...': 'Bandika msimbo wako wa HTML hapa...',
    'Supports inline styles': 'Inakubali mitindo ya ndani',
    'Tables, images, lists': 'Majedwali, picha na orodha',
    'Multi-page content': 'Maudhui ya kurasa nyingi',
    'Free CV Builder for African & International Jobs': 'Mjenzi wa CV wa bure kwa kazi za Afrika na kimataifa',
    'Create an ATS-safe CV, tailor it to a job, export PDF and ATS plain files, and generate your application pack.': 'Unda CV salama kwa ATS, ilenge kwa kazi, pakua PDF na faili rahisi za ATS, na uandae kifurushi chako cha maombi.',
    'Build My CV': 'Jenga CV Yangu',
    'Import Existing CV': 'Leta CV Iliyopo',
    'Try Sample CV': 'Jaribu CV ya Mfano',
    'No watermark': 'Hakuna alama ya maji',
    'Local save': 'Hifadhi ndani ya kifaa',
    'ATS plain export': 'Upakuaji rahisi wa ATS',
    'PROFILE': 'WASIFU',
    'Operations analyst with dashboard reporting, customer insights, and cross-market project coordination experience.': 'Mchambuzi wa uendeshaji mwenye uzoefu wa ripoti za dashibodi, maarifa ya wateja na uratibu wa miradi katika masoko tofauti.',
    'Sample CV preview': 'Hakiki ya CV ya mfano',
    'CV workspace stats': 'Takwimu za nafasi ya CV',
    'CV document library': 'Maktaba ya hati za CV',
    'Draft: Total ₦ 0.00, balance due ₦ 0.00. Add payment instructions before sending.': 'Rasimu: Jumla ₦ 0.00, salio linalodaiwa ₦ 0.00. Ongeza maagizo ya malipo kabla ya kutuma.',
    'Draft: Total': 'Rasimu: Jumla',
    'Draft:': 'Rasimu:',
    'Total': 'Jumla',
    'Total ₦': 'Jumla ₦',
    'Balance Due': 'Salio linalodaiwa',
    'balance due': 'salio linalodaiwa',
    'Add payment instructions before sending.': 'Ongeza maagizo ya malipo kabla ya kutuma.',
    'Document settings': 'Mipangilio ya hati',
    'Document type': 'Aina ya hati',
    'Partially paid': 'Imelipwa kiasi',
    'Payment instructions': 'Maagizo ya malipo',
    'Balance due': 'Salio linalodaiwa',
    'Freelancer name and contact included': 'Jina na mawasiliano ya mfanyakazi huru yamejumuishwa',
    'Client details included': 'Maelezo ya mteja yamejumuishwa',
    'Invoice number and dates are set': 'Namba ya ankara na tarehe zimewekwa',
    'At least one clear billable item': 'Angalau kipengee kimoja wazi cha kutozwa',
    'Tax or no-tax position is explicit': 'Hali ya kodi au kutokuwa na kodi iko wazi',
    'Payment instructions are usable': 'Maagizo ya malipo yanaweza kutumika',
    'Terms or client note included': 'Masharti au dokezo la mteja limejumuishwa',
    'Balance due is calculated': 'Salio linalodaiwa limekokotolewa',
    'Payment link or bank/mobile details present': 'Kiungo cha malipo au maelezo ya benki/simu yapo',
    'BILL TO': 'BILI KWA',
    'REFERENCE': 'REJEO',
    'None': 'Hakuna',
    'Freelance service': 'Huduma ya kazi huru',
    'Bank transfer: [Bank name], [Account number], [Account name]. Use the invoice number as payment reference.': 'Uhamisho wa benki: [Jina la benki], [Namba ya akaunti], [Jina la akaunti]. Tumia namba ya ankara kama rejeo la malipo.',
    'Payment is due by the stated due date. Late payment may pause further work until the balance is settled.': 'Malipo yanadaiwa kufikia tarehe iliyotajwa. Malipo ya kuchelewa yanaweza kusimamisha kazi zaidi hadi salio lilipwe.',
    'Copy Summary': 'Nakili muhtasari',
    'Run Comparison': 'Linganisha sasa',
    'Compare PDFs': 'Linganisha PDF',
    'Extract Text': 'Toa maandishi',
    'Ask a question': 'Uliza swali',
    'Send': 'Tuma',
    'Search document': 'Tafuta kwenye hati',
    'Search': 'Tafuta',
    'Processing...': 'Inachakata...',
    'Ready': 'Tayari',
    'Error': 'Hitilafu',
    'Original PDF': 'PDF ya asili',
    'Modified PDF': 'PDF iliyobadilishwa',
    'Meeting title': 'Jina la mkutano',
    'Organization': 'Shirika',
    'Date': 'Tarehe',
    'Chair': 'Mwenyekiti',
    'Minute taker': 'Mwandishi wa kumbukumbu',
    'Attendees': 'Waliohudhuria',
    'Agenda': 'Ajenda',
    'Decisions': 'Maamuzi',
    'Action items': 'Hatua za utekelezaji',
    'Next meeting': 'Mkutano unaofuata',
    'Generate minutes': 'Tengeneza kumbukumbu',
    'Receipt number': 'Namba ya risiti',
    'Business name': 'Jina la biashara',
    'Customer': 'Mteja',
    'Description': 'Maelezo',
    'Quantity': 'Idadi',
    'Rate': 'Bei',
    'Tax': 'Kodi',
    'Payment method': 'Njia ya malipo',
    'Generate receipt': 'Tengeneza risiti',
    'Business Plan': 'Mpango wa Biashara',
    'Executive summary': 'Muhtasari mkuu',
    'Target customer': 'Mteja lengwa',
    'Products and services': 'Bidhaa na huduma',
    'Marketing plan': 'Mpango wa masoko',
    'Operations': 'Uendeshaji',
    'Risks': 'Hatari',
    'Startup cost': 'Gharama ya kuanza',
    'Monthly revenue': 'Mapato ya mwezi',
    'Monthly costs': 'Gharama za mwezi',
    'Generate plan': 'Tengeneza mpango',
    'I reviewed the result before export': 'Nimekagua matokeo kabla ya kupakua',
    'Review the result before export': 'Kagua matokeo kabla ya kupakua',
    'Your files stay on this device.': 'Faili zako zinabaki kwenye kifaa hiki.',
    'Works in your browser': 'Inafanya kazi kwenye kivinjari chako'
  };

  Object.assign(phrases, {
    'Home': 'Nyumbani',
    'Tools': 'Zana',
    'PDF Tools': 'Zana za PDF',
    'Chat with PDF': 'Uliza PDF',
    'Upload a text PDF, ask locally by default, and jump from every answer back to the cited page. AI Assist stays off until you choose it.': 'Pakia PDF yenye maandishi, uliza ndani ya kifaa, na urudi kwenye ukurasa wa chanzo kutoka kila jibu. Usaidizi wa AI unabaki umezimwa hadi uuchague.',
    'Grounded Answers': 'Majibu yenye vyanzo',
    'Client-side': 'Ndani ya kifaa',
    'Page Citations': 'Marejeo ya kurasa',
    'Chat with your PDF': 'Uliza PDF yako',
    'Upload a text-based PDF and ask questions. The assistant indexes pages, answers from the document, and links back to sources.': 'Pakia PDF yenye maandishi na uulize maswali. Msaidizi hupanga kurasa, hujibu kutoka kwenye hati na huunganisha majibu na vyanzo.',
    'Drop your PDF here or click to browse': 'Dondosha PDF hapa au bofya kuchagua',
    'PDF files up to 20 MB': 'Faili za PDF hadi MB 20',
    'Ask Questions': 'Uliza maswali',
    'Get Summaries': 'Pata muhtasari',
    'Find Key Points': 'Tafuta hoja kuu',
    'Optional AI Assist': 'Usaidizi wa AI wa hiari',
    'Chat with any text-based PDF document. Upload contracts, reports, research papers, textbooks, school notes, or business documents, then ask questions in natural language. The assistant indexes extracted text by page, answers with citations, and lets you search, copy, or download a transcript.': 'Uliza hati yoyote ya PDF yenye maandishi. Pakia mikataba, ripoti, tafiti, vitabu, maelezo ya shule au hati za biashara, kisha uliza kwa lugha ya kawaida. Msaidizi hupanga maandishi kwa ukurasa, hujibu kwa marejeo na hukuruhusu kutafuta, kunakili au kupakua mazungumzo.',
    'How It Works': 'Jinsi inavyofanya kazi',
    'Your PDF is processed in your browser using pdf.js. Selectable text is extracted and indexed locally by page. Local answers are the default. AI Assist is optional and only runs after you choose to send a capped extracted-text excerpt with your question.': 'PDF yako huchakatwa kwenye kivinjari kwa pdf.js. Maandishi yanayochaguliwa hutolewa na kupangwa ndani ya kifaa kwa kila ukurasa. Majibu ya ndani ndiyo chaguo la kawaida. Usaidizi wa AI ni wa hiari na hutumika baada tu ya kuchagua kutuma dondoo fupi ya maandishi pamoja na swali.',
    'What You Can Do': 'Unachoweza kufanya',
    'Ask for summaries, extract key points, find dates and amounts, identify obligations or risks, search a term across pages, copy answers, download the transcript, or click a page citation to inspect the source page.': 'Omba muhtasari, toa hoja kuu, tafuta tarehe na kiasi, tambua wajibu au hatari, tafuta neno kwenye kurasa, nakili majibu, pakua mazungumzo au bofya rejea ya ukurasa kuona chanzo.',
    'Frequently Asked Questions': 'Maswali yanayoulizwa mara kwa mara',
    'Is my PDF data private and secure?': 'Je, taarifa za PDF yangu ni za faragha na salama?',
    'Your PDF file is parsed in your browser. Local answers do not call the AI endpoint. If you turn on AI Assist, a capped extracted-text excerpt and your current question are sent for analysis, not the original file.': 'Faili yako ya PDF huchambuliwa kwenye kivinjari. Majibu ya ndani hayatumii huduma ya AI. Ukiwasha Usaidizi wa AI, dondoo fupi ya maandishi na swali lako hutumwa kwa uchambuzi, si faili asili.',
    'What types of PDFs work best?': 'Ni aina gani za PDF hufanya kazi vizuri?',
    'Text-based PDFs work best, including reports, contracts, research papers, and ebooks. Scanned or image-only PDFs may not extract text properly. For those, try our OCR tool first.': 'PDF zenye maandishi hufanya kazi vizuri, ikiwemo ripoti, mikataba, tafiti na vitabu pepe. PDF zilizochanganuliwa au zenye picha pekee zinaweza kutotoa maandishi vizuri; tumia zana yetu ya OCR kwanza.',
    'How many questions can I ask?': 'Ninaweza kuuliza maswali mangapi?',
    'Local page-cited answers are available without a daily AI limit. AI-backed responses may have daily limits if you turn on AI Assist.': 'Majibu ya ndani yenye marejeo ya kurasa hayana kikomo cha kila siku cha AI. Majibu ya AI yanaweza kuwa na kikomo ukichagua kuwasha Usaidizi wa AI.',
    'Is there a file size limit?': 'Kuna kikomo cha ukubwa wa faili?',
    'PDFs up to 20 MB are supported. Large documents are indexed locally by page. AI Assist receives only a capped context window after consent, while local search can still work across all extracted pages.': 'PDF hadi MB 20 zinakubaliwa. Hati kubwa hupangwa ndani ya kifaa kwa ukurasa. Baada ya ridhaa, Usaidizi wa AI hupokea muktadha mfupi tu, huku utafutaji wa ndani ukifanya kazi kwenye kurasa zote.',
    'Can I ask follow-up questions?': 'Ninaweza kuuliza maswali ya kufuatilia?',
    'Yes. Local mode uses the current question and extracted page text. AI Assist also receives the current question with a capped extracted-text excerpt after consent.': 'Ndiyo. Hali ya ndani hutumia swali la sasa na maandishi yaliyotolewa kwa ukurasa. Baada ya ridhaa, Usaidizi wa AI pia hupokea swali la sasa pamoja na dondoo fupi ya maandishi.',
    'Choose or drop a scanned PDF or document image': 'Chagua au dondosha PDF iliyochanganuliwa au picha ya hati',
    'Supports PDF and common image formats': 'Inakubali PDF na miundo ya kawaida ya picha',
    'Document language': 'Lugha ya hati',
    'Extract Text with OCR': 'Toa maandishi kwa OCR',
    'What is this document about?': 'Hati hii inahusu nini?',
    'Summarize this document': 'Fupisha hati hii',
    'What are the key points?': 'Hoja kuu ni zipi?',
    'List the action items': 'Orodhesha hatua za utekelezaji',
    'Find dates and deadlines': 'Tafuta tarehe na makataa',
    'Compare by': 'Linganisha kwa',
    'Word-level diff': 'Tofauti kwa maneno',
    'Sentence-level diff': 'Tofauti kwa sentensi',
    'Line-level diff': 'Tofauti kwa mistari',
    'Ignore extra whitespace': 'Puuza nafasi za ziada',
    'Ignore case': 'Puuza herufi kubwa na ndogo',
    'Rebuild': 'Jenga upya',
    'Template': 'Kiolezo',
    'Blank meeting': 'Mkutano mtupu',
    'Board meeting': 'Mkutano wa bodi',
    'Team sync': 'Mkutano wa timu',
    'Project review': 'Mapitio ya mradi',
    'Sales review': 'Mapitio ya mauzo',
    'NGO / donor': 'Shirika lisilo la kiserikali / mfadhili',
    'School committee': 'Kamati ya shule',
    'Minutes style': 'Mtindo wa kumbukumbu',
    'Formal minutes': 'Kumbukumbu rasmi',
    'Action-focused': 'Mtindo wa hatua',
    'Standup brief': 'Muhtasari mfupi',
    'Start time': 'Muda wa kuanza',
    'End time': 'Muda wa kumaliza',
    'Location / platform': 'Mahali / jukwaa',
    'Name': 'Jina',
    'Role': 'Wajibu',
    'Status': 'Hali',
    'Present': 'Amehudhuria',
    'Remote': 'Kwa mbali',
    'Apology': 'Ameomba radhi',
    'Absent': 'Hayupo',
    'Email (optional)': 'Barua pepe (si lazima)',
    'Add attendee': 'Ongeza mhudhuriaji',
    'Agenda title': 'Kichwa cha ajenda',
    'Discussion notes': 'Maelezo ya mjadala',
    'Decision / outcome': 'Uamuzi / matokeo',
    'Add agenda': 'Ongeza ajenda',
    'Decision': 'Uamuzi',
    'Owner': 'Mhusika',
    'Approved': 'Imeidhinishwa',
    'Deferred': 'Imeahirishwa',
    'Rejected': 'Imekataliwa',
    'Noted': 'Imenakiliwa',
    'Add decision': 'Ongeza uamuzi',
    'Action': 'Hatua',
    'Due date': 'Tarehe ya mwisho',
    'Priority': 'Kipaumbele',
    'Medium': 'Wastani',
    'High': 'Juu',
    'Low': 'Chini',
    'Open': 'Wazi',
    'In progress': 'Inaendelea',
    'Done': 'Imekamilika',
    'Source': 'Chanzo',
    'Add action': 'Ongeza hatua',
    'Risks / blockers': 'Hatari / vizuizi',
    'Parking lot': 'Masuala ya baadaye',
    'Next date': 'Tarehe inayofuata',
    'Next time': 'Muda unaofuata',
    'Next agenda': 'Ajenda inayofuata',
    'Minutes text': 'Maandishi ya kumbukumbu',
    'Actions CSV': 'CSV ya hatua',
    'Import': 'Leta',
    'Save Receipt': 'Hifadhi risiti',
    'New': 'Mpya',
    'Save Profile': 'Hifadhi wasifu',
    'Document': 'Hati',
    'Receipt': 'Risiti',
    'Tax receipt': 'Risiti ya kodi',
    'Pro forma': 'Ankara ya awali',
    'Paid': 'Imelipwa',
    'Unpaid': 'Haijalipwa',
    'Refunded': 'Imerejeshwa',
    'Layout': 'Mpangilio',
    'Compact': 'Fupi',
    'Standard': 'Kawaida',
    'Detailed': 'Kina',
    'Country preset': 'Mpangilio wa nchi',
    'Currency': 'Sarafu',
    'Tax label': 'Jina la kodi',
    'Business logo': 'Nembo ya biashara',
    'Registration / TIN': 'Usajili / TIN',
    'Address': 'Anwani',
    'Branch / outlet': 'Tawi / kituo',
    'Phone': 'Simu',
    'Email': 'Barua pepe',
    'Renumber': 'Weka namba upya',
    'Time': 'Muda',
    'Cashier': 'Mhudumu',
    'Order reference': 'Rejea ya oda',
    'Customer name': 'Jina la mteja',
    'Customer tax ID': 'Namba ya kodi ya mteja',
    'Customer note': 'Dokezo la mteja',
    'Service line': 'Huduma',
    'Add Item': 'Ongeza bidhaa',
    'Tax rate': 'Kiwango cha kodi',
    'Global discount': 'Punguzo la jumla',
    'Discount mode': 'Aina ya punguzo',
    'Percent': 'Asilimia',
    'Amount': 'Kiasi',
    'Service charge': 'Ada ya huduma',
    'Delivery': 'Usafirishaji',
    'Rounding': 'Ukaribiaji',
    'Provider': 'Mtoa huduma',
    'Amount received': 'Kiasi kilichopokelewa',
    'Transaction reference': 'Rejea ya muamala',
    'Authorization code': 'Msimbo wa idhini',
    'Card last 4': 'Namba 4 za mwisho za kadi',
    'Show QR': 'Onyesha QR',
    'QR link': 'Kiungo cha QR',
    'Terms': 'Masharti',
    'Plan format': 'Muundo wa mpango',
    'One-page brief': 'Muhtasari wa ukurasa mmoja',
    'Full business plan': 'Mpango kamili wa biashara',
    'Forecast': 'Utabiri',
    '3 years': 'Miaka 3',
    '5 years': 'Miaka 5',
    'Blank': 'Tupu',
    'Company': 'Kampuni',
    'Market': 'Soko',
    'Offer': 'Bidhaa au huduma',
    'Marketing': 'Masoko',
    'Milestones': 'Hatua muhimu',
    'Financials': 'Fedha',
    'Funding': 'Ufadhili',
    'Previous': 'Iliyotangulia',
    'Next': 'Inayofuata',
    'Business concept': 'Dhana ya biashara',
    'Mission': 'Dhamira',
    'Legal structure': 'Muundo wa kisheria',
    'Location': 'Mahali',
    'Founder': 'Mwanzilishi'
  });

  Object.assign(phrases, {
    'Upload file': 'Pakia faili',
    'OCR settings': 'Mipangilio ya OCR',
    'How to use': 'Jinsi ya kutumia',
    'Supported formats': 'Miundo inayokubaliwa',
    'Tips for better results': 'Vidokezo vya matokeo bora',
    'Upload a scanned PDF or image': 'Pakia PDF iliyochanganuliwa au picha',
    'Select the document language': 'Chagua lugha ya hati',
    'Each PDF page is rendered as an image': 'Kila ukurasa wa PDF huonyeshwa kama picha',
    'Tesseract.js OCR extracts text': 'OCR ya Tesseract.js hutoa maandishi',
    'Review confidence, then copy or download text': 'Kagua uhakika, kisha nakili au pakua maandishi',
    'scanned or image-based': 'iliyochanganuliwa au yenye picha',
    'photos of documents': 'picha za hati',
    'other image formats': 'miundo mingine ya picha',
    'Note: OCR on large PDFs can take several minutes. The OCR engine and language data load from AfroTools local assets. Processing happens entirely in your browser -- your files and extracted text are never uploaded by this tool.': 'Kumbuka: OCR ya PDF kubwa inaweza kuchukua dakika kadhaa. Injini ya OCR na data ya lugha hupakiwa kutoka rasilimali za AfroTools. Uchakataji wote hufanyika kwenye kivinjari chako; zana hii haipakii faili wala maandishi yaliyotolewa.',
    'Use high-resolution scans (300+ DPI)': 'Tumia nakala zenye ubora wa juu (DPI 300 au zaidi)',
    'Ensure text is not rotated or skewed': 'Hakikisha maandishi hayajazungushwa wala kupinda',
    'Select the correct language': 'Chagua lugha sahihi',
    'Clean, high-contrast documents work best': 'Hati safi zenye utofauti mzuri hutoa matokeo bora',
    'Chat with your PDF': 'Uliza PDF yako',
    'Chat with': 'Uliza',
    'Compare': 'Linganisha',
    'PDF Compare': 'Linganisha PDF',
    'Compare contracts, policies, invoices, and draft PDFs with side-by-side text diff, visual overlay, changed-page navigation, and a downloadable review report. Everything runs locally in your browser.': 'Linganisha mikataba, sera, ankara na rasimu za PDF kwa tofauti za maandishi sambamba, mwonekano, urambazaji wa kurasa zilizobadilika na ripoti inayopakuliwa. Kila kitu hufanyika ndani ya kivinjari.',
    'Side-by-Side': 'Sambamba',
    'Text + Visual Diff': 'Tofauti za maandishi na mwonekano',
    'Review Report': 'Ripoti ya ukaguzi',
    'Upload PDFs': 'Pakia PDF',
    'Drop original PDF here': 'Dondosha PDF ya asili hapa',
    'Drop modified PDF here': 'Dondosha PDF iliyobadilishwa hapa',
    'or press Enter to browse': 'au bonyeza Enter kuchagua',
    'up to 25 MB / 150 pages': 'hadi MB 25 / kurasa 150',
    'Comparison settings': 'Mipangilio ya ulinganisho',
    'Ignore letter case': 'Puuza herufi kubwa na ndogo',
    '1. Upload your original PDF on the left and the modified version on the right.': '1. Pakia PDF ya asili kushoto na iliyobadilishwa kulia.',
    '2. Tune word, sentence, or line comparison and choose whether to ignore whitespace or case changes.': '2. Chagua ulinganisho wa maneno, sentensi au mistari na uamue kama nafasi na aina ya herufi zipuuzwe.',
    '3. Compare to get a changed-page map, similarity score, additions, deletions, and side-by-side review panes.': '3. Linganisha kupata ramani ya kurasa zilizobadilika, alama ya ufanano, nyongeza, ufutaji na mapitio sambamba.',
    '4. Verify layout with visual diff, then copy the summary or download a review report for your team.': '4. Hakiki mpangilio kwa tofauti za mwonekano, kisha nakili muhtasari au pakua ripoti ya timu.',
    'Tips': 'Vidokezo',
    'Works best with text-based PDFs; use visual diff for scanned pages or layout-only changes': 'Hufanya kazi vizuri kwa PDF zenye maandishi; tumia tofauti za mwonekano kwa kurasa zilizochanganuliwa au mabadiliko ya mpangilio',
    'Visual diff reports a page-level pixel-change percentage': 'Tofauti za mwonekano huonyesha asilimia ya pikseli zilizobadilika kwa ukurasa',
    'Changed-page navigation helps review long contracts and policy drafts quickly': 'Urambazaji wa kurasa zilizobadilika huharakisha ukaguzi wa mikataba na rasimu ndefu',
    'Export the report before sending edits to a lawyer, approver, client, or procurement team': 'Pakua ripoti kabla ya kutuma mabadiliko kwa mwanasheria, mwidhinishaji, mteja au timu ya manunuzi',
    '100% client-side — nothing is uploaded': '100% ndani ya kifaa — hakuna kinachopakiwa',
    'Compare PDFs Online for Free': 'Linganisha PDF Mtandaoni Bila Malipo',
    'The AfroTools PDF Compare tool lets you diff two PDF documents side-by-side directly in your browser. Whether you need to review contract changes, compare document drafts, or verify edits, this tool highlights additions, deletions, changed pages, similarity, and visual layout changes.': 'Zana ya AfroTools ya kulinganisha PDF hukuwezesha kukagua hati mbili sambamba kwenye kivinjari. Huonyesha nyongeza, ufutaji, kurasa zilizobadilika, ufanano na mabadiliko ya mpangilio.',
    'Everything runs locally in your browser. Your PDF files are never uploaded to any server, ensuring complete privacy and security for sensitive documents.': 'Kila kitu hufanyika ndani ya kivinjari. Faili zako za PDF hazipakuliwi kwenye seva, hivyo hati nyeti hubaki binafsi.',
    'How does the text diff work?': 'Tofauti za maandishi hufanya kazi vipi?',
    'What does the visual diff show?': 'Tofauti za mwonekano huonyesha nini?',
    'Is my PDF uploaded to a server?': 'Je, PDF yangu inapakiwa kwenye seva?',
    'Can I export the comparison?': 'Ninaweza kupakua matokeo ya ulinganisho?',
    'Change review check': 'Ukaguzi wa mabadiliko',
    'Verify text and visual differences before acting': 'Hakiki tofauti za maandishi na mwonekano kabla ya kuchukua hatua',
    'Reviewed 2026': 'Imekaguliwa 2026',
    'What to check': 'Mambo ya kukagua',
    'Limitations': 'Vikwazo',
    'Review workflow output': 'Matokeo ya ukaguzi',
    'Meeting operating system': 'Mfumo wa uendeshaji wa mkutano',
    'Turn notes into decisions, owners, and follow-through.': 'Geuza maelezo kuwa maamuzi, wahusika na ufuatiliaji.',
    'Build minutes before, during, or after the meeting. Capture agenda discussion, decisions, action owners, due dates, risks, and next steps without sending private notes to a server.': 'Andaa kumbukumbu kabla, wakati au baada ya mkutano. Rekodi ajenda, maamuzi, wahusika, makataa, hatari na hatua zinazofuata bila kutuma maelezo binafsi kwenye seva.',
    'Builder': 'Kijenzi',
    'Meeting details': 'Maelezo ya mkutano',
    'Setup': 'Mipangilio',
    'NGO or donor meeting': 'Mkutano wa shirika au mfadhili',
    'No attendees yet.': 'Bado hakuna waliohudhuria.',
    'No agenda items yet. Choose a template or add one below.': 'Bado hakuna vipengele vya ajenda. Chagua kiolezo au ongeza hapa chini.',
    'Add agenda item': 'Ongeza kipengele cha ajenda',
    'No standalone decisions yet.': 'Bado hakuna maamuzi ya pekee.',
    'No action items yet.': 'Bado hakuna hatua za utekelezaji.',
    'Follow-up context': 'Muktadha wa ufuatiliaji',
    'Draft minutes': 'Rasimu ya kumbukumbu',
    'Editable recap': 'Muhtasari unaoharirika',
    'I reviewed the attendees, agenda, decisions, action owners, deadlines, risks, next meeting, and final minutes preview.': 'Nimekagua waliohudhuria, ajenda, maamuzi, wahusika, makataa, hatari, mkutano unaofuata na hakikisho la mwisho.',
    'Build and review the minutes before downloading, copying, or printing.': 'Andaa na ukague kumbukumbu kabla ya kupakua, kunakili au kuchapisha.',
    'Generated from the structured form. You can edit the text directly before exporting.': 'Imetengenezwa kutoka fomu iliyopangwa. Unaweza kuhariri maandishi kabla ya kupakua.',
    'Meeting minutes': 'Kumbukumbu za mkutano',
    'Summary': 'Muhtasari',
    'Prepared with AfroTools Meeting Minutes Generator.': 'Imeandaliwa kwa Kizalishaji Kumbukumbu za Mkutano cha AfroTools.',
    'Generated privately with AfroTools.com': 'Imetengenezwa kwa faragha kwa AfroTools.com',
    'Meeting quality': 'Ubora wa mkutano',
    'Follow-through readiness': 'Utayari wa ufuatiliaji',
    'Needs more structure before this can drive follow-through.': 'Inahitaji maelezo zaidi ili kuwezesha ufuatiliaji.',
    'Meeting basics': 'Misingi ya mkutano',
    'Add title, date, and chair.': 'Ongeza jina, tarehe na mwenyekiti.',
    'Minute ownership': 'Mhusika wa kumbukumbu',
    'Name the minute taker.': 'Taja mwandishi wa kumbukumbu.',
    'Agenda evidence': 'Ushahidi wa ajenda',
    'Record at least one decision or outcome.': 'Rekodi angalau uamuzi au matokeo moja.',
    'Action owners': 'Wahusika wa hatua',
    'Every action should have an owner.': 'Kila hatua iwe na mhusika.',
    'Action due dates': 'Makataa ya hatua',
    'Every action should have a due date.': 'Kila hatua iwe na tarehe ya mwisho.',
    'Risk handling': 'Usimamizi wa hatari',
    'Capture risks, blockers, or unresolved topics.': 'Rekodi hatari, vizuizi au masuala ambayo hayajakamilika.',
    'Saved minutes': 'Kumbukumbu zilizohifadhiwa',
    'No saved minutes yet.': 'Bado hakuna kumbukumbu zilizohifadhiwa.',
    'Business records': 'Rekodi za biashara',
    'Receipt Generator': 'Kizalishaji Risiti',
    'Create a clean payment receipt, check the totals, then download or print it directly from this browser.': 'Tengeneza risiti safi ya malipo, kagua jumla, kisha ipakue au uichapishe moja kwa moja kutoka kivinjari.',
    'currencies': 'sarafu',
    'exports': 'miundo ya kupakua',
    'layouts': 'mipangilio',
    'signup': 'usajili',
    'Receipt type': 'Aina ya risiti',
    'Saved locally': 'Imehifadhiwa kwenye kifaa',
    'Sales receipt': 'Risiti ya mauzo',
    'Deposit receipt': 'Risiti ya amana',
    'Refund receipt': 'Risiti ya marejesho',
    'Gift receipt': 'Risiti ya zawadi',
    'Declined payment slip': 'Hati ya malipo yaliyokataliwa',
    'Partial': 'Sehemu',
    'Declined': 'Imekataliwa',
    'Draft': 'Rasimu',
    'Modern': 'Kisasa',
    'Tax invoice style': 'Mtindo wa ankara ya kodi',
    'Thermal POS': 'POS ya risiti ndogo',
    'Seller': 'Muuzaji',
    'Business details': 'Maelezo ya biashara',
    'Logo': 'Nembo',
    'PNG, JPG, or WebP. SVG is blocked for safer local previews.': 'PNG, JPG au WebP. SVG imezuiwa kwa hakikisho salama la ndani.',
    'Transaction': 'Muamala',
    'Receipt details': 'Maelezo ya risiti',
    'issued by': 'imetolewa na',
    'Order / invoice reference': 'Rejea ya oda / ankara',
    'Buyer': 'Mnunuzi',
    'Customer details': 'Maelezo ya mteja',
    'Customer tax / account ID': 'Namba ya kodi / akaunti ya mteja',
    'Items': 'Bidhaa',
    'Products and services': 'Bidhaa na huduma',
    'Qty': 'Idadi',
    'Unit': 'Kipimo',
    'Disc %': 'Punguzo %',
    'Totals': 'Jumla',
    'Taxes and charges': 'Kodi na ada',
    'Shipping': 'usafirishaji',
    'adjustment': 'marekebisho',
    'Proof of payment': 'Uthibitisho wa malipo',
    'Method': 'Njia',
    'Cash': 'Taslimu',
    'Bank transfer': 'Uhamisho wa benki',
    'Mobile money': 'Pesa kwa simu',
    'Payment link': 'Kiungo cha malipo',
    'Cheque': 'Hundi',
    'Online payment': 'Malipo mtandaoni',
    'Store credit': 'Mkopo wa duka',
    'Other': 'Nyingine',
    'bank': 'benki',
    'Show payment QR': 'Onyesha QR ya malipo',
    'Notes': 'Maelezo',
    'Terms and messages': 'Masharti na ujumbe',
    'Terms / return policy': 'Masharti / sera ya kurejesha',
    'I reviewed the seller, customer, receipt number, date, items, tax, payment reference, totals, status, and final paper preview.': 'Nimekagua muuzaji, mteja, namba ya risiti, tarehe, bidhaa, kodi, rejea ya malipo, jumla, hali na hakikisho la mwisho.',
    'Complete and review the receipt before download, copy, or print.': 'Kamilisha na ukague risiti kabla ya kupakua, kunakili au kuchapisha.',
    'Business Name': 'Jina la Biashara',
    'Sales receipt': 'Risiti ya mauzo',
    'Walk-in customer': 'Mteja wa moja kwa moja',
    'Product or service': 'Bidhaa au huduma',
    'Subtotal': 'Jumla ndogo',
    'Received': 'Imepokelewa',
    'Thank you for your business.': 'Asante kwa kufanya biashara nasi.',
    'Goods and services received in good condition. Keep this receipt for your records.': 'Bidhaa na huduma zimepokelewa katika hali nzuri. Hifadhi risiti hii kwa kumbukumbu.',
    'Receipt readiness': 'Utayari wa risiti',
    'At least one priced item': 'Angalau bidhaa moja yenye bei',
    'Customer record': 'Rekodi ya mteja',
    'Payment method selected': 'Njia ya malipo imechaguliwa',
    'Payment reference for non-cash': 'Rejea ya malipo yasiyo taslimu',
    'Tax ID when tax is charged': 'Namba ya kodi inapotozwa kodi',
    'Paid amount matches status': 'Kiasi kilicholipwa kinalingana na hali',
    'Notes or return terms': 'Maelezo au masharti ya kurejesha',
    'Balance': 'Salio',
    'Receipt essentials': 'Misingi ya risiti',
    'The fields that keep a receipt useful': 'Sehemu zinazofanya risiti iwe na manufaa',
    'Seller and buyer records': 'Rekodi za muuzaji na mnunuzi',
    'Payment trail': 'Mfuatano wa malipo',
    'Accounting handoff': 'Makabidhiano ya uhasibu',
    'Africa-aware defaults': 'Mipangilio inayozingatia Afrika',
    'Professional receipts for African businesses': 'Risiti za kitaalamu kwa biashara za Afrika',
    'Can I save previous receipts?': 'Ninaweza kuhifadhi risiti za awali?',
    'Can I use this for mobile money receipts?': 'Ninaweza kutumia kwa risiti za pesa kwa simu?',
    'Can I export receipts for bookkeeping?': 'Ninaweza kupakua risiti kwa uhasibu?',
    'Plan workspace': 'Eneo la mpango',
    'Draft ready': 'Rasimu iko tayari',
    'Lender-ready plan': 'Mpango wa mkopeshaji',
    'Investor plan': 'Mpango wa mwekezaji',
    'Lean one-page plan': 'Mpango mfupi wa ukurasa mmoja',
    'Grant or NGO plan': 'Mpango wa ruzuku au shirika',
    'Internal growth plan': 'Mpango wa ukuaji wa ndani',
    'Pan-African': 'Afrika nzima',
    'Restaurant': 'Mgahawa',
    'Tech startup': 'Biashara changa ya teknolojia',
    'Retail': 'Rejareja',
    'Agriculture': 'Kilimo',
    'Manufacturing': 'Utengenezaji',
    'Logistics': 'Usafirishaji',
    'Healthcare': 'Huduma za afya',
    'Education': 'Elimu',
    'Real estate': 'Mali isiyohamishika',
    'Section 1 of 9': 'Sehemu ya 1 kati ya 9',
    'Define the business clearly before writing the rest of the plan.': 'Fafanua biashara kwa uwazi kabla ya kuandika sehemu nyingine za mpango.',
    'What does the business do, for whom, and why now?': 'Biashara inafanya nini, kwa nani na kwa nini sasa?',
    'What change does the business exist to make?': 'Biashara inalenga kuleta mabadiliko gani?',
    'Sole proprietorship, partnership, limited company, cooperative': 'Biashara binafsi, ubia, kampuni yenye dhima ndogo au ushirika',
    'and coverage': 'na eneo la huduma',
    'City, country, and operating region': 'Jiji, nchi na eneo la shughuli',
    'and team strengths': 'na uwezo wa timu',
    'Relevant skills, experience, advisors, and execution capacity': 'Ujuzi, uzoefu, washauri na uwezo wa utekelezaji',
    'I reviewed the company, market evidence, offer, operations, milestones, forecast assumptions, funding, risks, and final plan preview.': 'Nimekagua kampuni, ushahidi wa soko, bidhaa, uendeshaji, hatua muhimu, makadirio, ufadhili, hatari na hakikisho la mwisho.',
    'Complete and review the plan before download or copied handoff.': 'Kamilisha na ukague mpango kabla ya kupakua au kunakili.',
    'Plan readiness': 'Utayari wa mpango',
    'is clear': 'iko wazi',
    'is specific': 'ametajwa kwa uwazi',
    'Competitors and advantage included': 'Washindani na faida vimejumuishwa',
    'Offer and pricing are explained': 'Bidhaa na bei zimeelezwa',
    'channels and retention covered': 'njia na uhifadhi wa wateja vimeelezwa',
    'staffing, and compliance addressed': 'wafanyakazi na uzingatiaji vimeelezwa',
    'and KPIs included': 'na viashiria vimejumuishwa',
    'Financial forecast has revenue and costs': 'Makadirio ya fedha yana mapato na gharama',
    'use and repayment logic included': 'matumizi na urejeshaji vimeelezwa',
    'and mitigations are realistic': 'na mikakati yake ni halisi',
    'Year 1 revenue': 'Mapato ya mwaka wa 1',
    'Year 1 profit': 'Faida ya mwaka wa 1',
    'Gross margin': 'Uwiano wa faida ghafi',
    'gap': 'pengo',
    'Live preview': 'Hakikisho la moja kwa moja',
    'Untitled business plan': 'Mpango wa biashara usio na jina',
    'Plan type': 'Aina ya mpango',
    'Line item': 'Kipengele',
    'Year 1': 'Mwaka 1',
    'Year 2': 'Mwaka 2',
    'Year 3': 'Mwaka 3',
    'Revenue': 'Mapato',
    'Direct costs': 'Gharama za moja kwa moja',
    'Gross profit': 'Faida ghafi',
    'Operating expenses': 'Gharama za uendeshaji',
    'Salaries': 'Mishahara',
    'Capex': 'Gharama za mali',
    'Operating profit': 'Faida ya uendeshaji',
    'Net cash': 'Fedha halisi',
    'Assumptions': 'Makisio',
    'List the logic behind your prices, volumes, costs, hiring, and growth.': 'Orodhesha mantiki ya bei, kiasi, gharama, ajira na ukuaji.'
  });

  Object.assign(phrases, {
    'Upload File': 'Pakia Faili',
    'How to Use': 'Jinsi ya Kutumia',
    'Chat with your': 'Uliza PDF yako',
    'Agenda and discussion': 'Ajenda na mjadala',
    'Payment': 'Malipo',
    'Choose a PDF file': 'Chagua faili ya PDF',
    'Choose original PDF': 'Chagua PDF ya asili',
    'Choose modified PDF': 'Chagua PDF iliyobadilishwa',
    'Choose or drop the original PDF': 'Chagua au dondosha PDF ya asili',
    'Choose or drop the modified PDF': 'Chagua au dondosha PDF iliyobadilishwa',
    'Close document': 'Funga hati',
    'Search document text or pages': 'Tafuta maandishi au kurasa za hati',
    'Search document text or pages...': 'Tafuta maandishi au kurasa za hati...',
    'Question about this PDF': 'Swali kuhusu PDF hii',
    'Ask a question about this PDF...': 'Uliza swali kuhusu PDF hii...',
    'Find changed text or page note': 'Tafuta maandishi yaliyobadilika au dokezo la ukurasa',
    'Changed page map': 'Ramani ya kurasa zilizobadilika',
    'Q2 Expansion Review': 'Mapitio ya Upanuzi wa Robo ya Pili',
    'Budget approved with revised supplier cap.': 'Bajeti imeidhinishwa kwa kikomo kipya cha msambazaji.',
    'Useful topics that were not resolved in this meeting.': 'Masuala muhimu ambayo hayajakamilika katika mkutano huu.',
    'Topics proposed for the next meeting.': 'Masuala yaliyopendekezwa kwa mkutano unaofuata.',
    'Payment link, account details, or reference': 'Kiungo cha malipo, maelezo ya akaunti au rejea',
    'Receipt preview and export': 'Hakikisho na upakuaji wa risiti',
    'Generated receipt preview': 'Hakikisho la risiti iliyotengenezwa',
    'Business plan sections': 'Sehemu za mpango wa biashara',
    'Plan preview and export': 'Hakikisho na upakuaji wa mpango',
    'Business': 'Biashara',
    'File too large. Please use files under 50 MB.': 'Faili ni kubwa sana. Tumia faili chini ya MB 50.',
    'File is too large. Maximum size is 20 MB.': 'Faili ni kubwa sana. Ukubwa wa juu ni MB 20.',
    'Choose a PDF up to 25 MB so comparison stays responsive.': 'Chagua PDF hadi MB 25 ili ulinganisho ubaki mwepesi.',
    'Please upload a PDF file.': 'Tafadhali pakia faili ya PDF.',
    'Please upload a PDF file': 'Tafadhali pakia faili ya PDF',
    'OCR on large PDFs can take several minutes. The OCR engine and language data load from AfroTools local assets. Processing happens entirely in your browser -- your files and extracted text are never uploaded by this tool.': 'OCR ya PDF kubwa inaweza kuchukua dakika kadhaa. Injini ya OCR na data ya lugha hupakiwa kutoka rasilimali za AfroTools. Uchakataji wote hufanyika kwenye kivinjari chako; zana hii haipakii faili wala maandishi yaliyotolewa.',
    '1. Upload': '1. Pakia',
    'your original PDF on the left and the modified version on the right.': 'PDF ya asili kushoto na iliyobadilishwa kulia.',
    '2. Tune': '2. Rekebisha',
    'word, sentence, or line comparison and choose whether to ignore whitespace or case changes.': 'ulinganisho wa maneno, sentensi au mistari na uamue kama nafasi na aina ya herufi zipuuzwe.',
    '3. Compare': '3. Linganisha',
    'to get a changed-page map, similarity score, additions, deletions, and side-by-side review panes.': 'upate ramani ya kurasa zilizobadilika, alama ya ufanano, nyongeza, ufutaji na mapitio sambamba.',
    '4. Verify': '4. Hakiki',
    'layout with visual diff, then copy the summary or download a review report for your team.': 'mpangilio kwa tofauti za mwonekano, kisha nakili muhtasari au pakua ripoti ya timu.',
    'The AfroTools PDF Compare tool lets you diff two PDF documents side-by-side directly in your browser.': 'Zana ya AfroTools ya kulinganisha PDF hukuwezesha kukagua hati mbili sambamba kwenye kivinjari.',
    'Whether you need to review contract changes, compare document drafts, or verify edits,': 'Iwe unakagua mabadiliko ya mkataba, rasimu za hati au uhariri,',
    'this tool highlights additions, deletions, changed pages, similarity, and visual layout changes.': 'zana hii huonyesha nyongeza, ufutaji, kurasa zilizobadilika, ufanano na mabadiliko ya mpangilio.',
    'Everything runs locally in your browser. Your PDF files are never uploaded to any server,': 'Kila kitu hufanyika ndani ya kivinjari. Faili zako za PDF hazipakuliwi kwenye seva,',
    'ensuring complete privacy and security for sensitive documents.': 'hivyo hati nyeti hubaki binafsi na salama.'
  });

  Object.assign(phrases, {
    'UPLOAD FILE': 'PAKIA FAILI',
    'HOW TO USE': 'JINSI YA KUTUMIA',
    'your PDF': 'PDF yako',
    'Note: OCR on large PDFs can take several minutes. The OCR engine and language data load from AfroTools local assets. Processing happens entirely in your browser — your files and extracted text are never uploaded by this tool.': 'Kumbuka: OCR ya PDF kubwa inaweza kuchukua dakika kadhaa. Injini ya OCR na data ya lugha hupakiwa kutoka rasilimali za AfroTools. Uchakataji wote hufanyika kwenye kivinjari chako; zana hii haipakii faili wala maandishi yaliyotolewa.',
    'Upload your original PDF on the left and the modified version on the right.': 'Pakia PDF ya asili kushoto na iliyobadilishwa kulia.',
    'Tune word, sentence, or line comparison and choose whether to ignore whitespace or case changes.': 'Chagua ulinganisho wa maneno, sentensi au mistari na uamue kama nafasi na aina ya herufi zipuuzwe.',
    'Compare to get a changed-page map, similarity score, additions, deletions, and side-by-side review panes.': 'Linganisha kupata ramani ya kurasa zilizobadilika, alama ya ufanano, nyongeza, ufutaji na mapitio sambamba.',
    'Verify layout with visual diff, then copy the summary or download a review report for your team.': 'Hakiki mpangilio kwa tofauti za mwonekano, kisha nakili muhtasari au pakua ripoti ya timu.',
    'The AfroTools Compare PDF tool lets you diff two PDF documents side-by-side directly in your browser. Whether you need to review contract changes, compare document drafts, or verify edits, this tool highlights additions, deletions, changed pages, similarity, and visual layout changes.': 'Zana ya AfroTools ya kulinganisha PDF hukuwezesha kukagua hati mbili sambamba kwenye kivinjari. Huonyesha nyongeza, ufutaji, kurasa zilizobadilika, ufanano na mabadiliko ya mpangilio.',
    'Compare two PDFs locally with text diff, visual overlay, page map, similarity score, copyable summary, and review-report export.': 'Linganisha PDF mbili ndani ya kifaa kwa tofauti za maandishi, mwonekano, ramani ya kurasa, alama ya ufanano, muhtasari unaonakilika na ripoti inayopakuliwa.',
    'Local-first planning and document workflow. No official submission is performed.': 'Mpangilio na hati hubaki ndani ya kifaa. Hakuna uwasilishaji rasmi unaofanywa.',
    'Methodology: extract comparable text, detect additions/deletions, mark changed pages, and support visual review where text extraction is incomplete.': 'Mbinu: toa maandishi yanayolinganishwa, tambua nyongeza na ufutaji, alama kurasa zilizobadilika na tumia ukaguzi wa mwonekano pale maandishi hayajatolewa kikamilifu.',
    'Verify pages with no extractable text, large layout changes, scanned pages, signatures, tables, and attachments manually before approval.': 'Hakiki mwenyewe kurasa zisizo na maandishi yanayotolewa, mabadiliko makubwa ya mpangilio, kurasa zilizochanganuliwa, saini, majedwali na viambatisho kabla ya kuidhinisha.',
    'Copy the summary or download the review report for internal review without storing source document contents.': 'Nakili muhtasari au pakua ripoti kwa ukaguzi wa ndani bila kuhifadhi maudhui ya hati asili.',
    'Disclaimer: comparison aid only, not legal review, version-control guarantee, official audit, or approval workflow.': 'Tahadhari: ni msaada wa kulinganisha tu; si ukaguzi wa kisheria, dhamana ya matoleo, ukaguzi rasmi wala mchakato wa idhini.',
    'Text extraction can miss changes in images, scans, vector graphics, annotations, fonts, or hidden layers.': 'Utoaji wa maandishi unaweza kukosa mabadiliko kwenye picha, nakala zilizochanganuliwa, michoro, maelezo, fonti au tabaka zilizofichwa.',
    'Privacy note: compare sensitive contracts, invoices, HR records, or legal documents locally and share only the minimum review summary needed.': 'Dokezo la faragha: linganisha mikataba, ankara, rekodi za wafanyakazi au hati za kisheria ndani ya kifaa na ushiriki muhtasari mdogo unaohitajika.',
    'Source/freshness note: verify current client, lender, customs, tax, document, or regulator requirements before relying on generated outputs.': 'Dokezo la chanzo na muda: hakiki mahitaji ya sasa ya mteja, mkopeshaji, forodha, kodi, hati au mdhibiti kabla ya kutegemea matokeo.',
    'AGENDA AND DISCUSSION': 'AJENDA NA MJADALA',
    'MEETING MINUTES': 'KUMBUKUMBU ZA MKUTANO',
    'The meeting recorded 0 attendee(s), 0 agenda item(s), 0 decision(s), and 0 action item(s). 0 action item(s) are complete and 0 remain open.': 'Mkutano umerekodi wahudhuriaji 0, vipengele 0 vya ajenda, maamuzi 0 na hatua 0. Hatua 0 zimekamilika na 0 bado ziko wazi.',
    'Add attendees and their status.': 'Ongeza waliohudhuria na hali zao.',
    'Add agenda items with notes or outcomes.': 'Ongeza vipengele vya ajenda vyenye maelezo au matokeo.',
    'Add next meeting date or proposed agenda.': 'Ongeza tarehe ya mkutano unaofuata au ajenda inayopendekezwa.',
    'PAYMENT': 'MALIPO',
    'QR / payment link': 'QR / kiungo cha malipo',
    'TOTAL': 'JUMLA',
    'Total': 'Jumla',
    'Generated with AfroTools.com': 'Imetengenezwa kwa AfroTools.com',
    'Receipt number and date': 'Namba ya risiti na tarehe',
    'Logo, tax ID, address, customer details, receipt number, date, and branch fields.': 'Nembo, namba ya kodi, anwani, maelezo ya mteja, namba ya risiti, tarehe na taarifa za tawi.',
    'Mobile money, bank transfer, POS/card, transaction reference, auth code, card last 4, and QR details.': 'Pesa kwa simu, uhamisho wa benki, POS/kadi, rejea ya muamala, msimbo wa idhini, namba 4 za mwisho za kadi na taarifa za QR.',
    'PDF, print, TXT, CSV item export, JSON backup, and saved drafts.': 'PDF, uchapishaji, TXT, CSV ya bidhaa, nakala ya JSON na rasimu zilizohifadhiwa.',
    'VAT labels, common country rates, African currencies, and regional payment providers.': 'Majina ya VAT, viwango vya kawaida vya nchi, sarafu za Afrika na watoa huduma wa malipo wa eneo.',
    'Use this generator for sales receipts, tax receipts, deposit receipts, refund records, and payment confirmation slips. It keeps the practical proof fields small businesses need: buyer details, receipt number, transaction date, itemized products or services, taxes, discounts, delivery fees, payment method, and transaction reference.': 'Tumia kizalishaji hiki kwa risiti za mauzo, kodi, amana, marejesho na uthibitisho wa malipo. Kinaweka taarifa muhimu kwa biashara ndogo: mnunuzi, namba ya risiti, tarehe, bidhaa au huduma, kodi, punguzo, usafirishaji, njia ya malipo na rejea ya muamala.',
    'The country preset helps you start with common VAT rates and local payment methods, but it does not replace tax advice. Add the correct TIN, VAT, PIN, or registration number required by your country and confirm the rules with your accountant or tax authority.': 'Mpangilio wa nchi hukusaidia kuanza na viwango vya kawaida vya VAT na njia za malipo za eneo, lakini hauchukui nafasi ya ushauri wa kodi. Weka TIN, VAT, PIN au namba sahihi ya usajili na uthibitishe masharti kwa mhasibu au mamlaka ya kodi.'
  });

  Object.assign(phrases, {
    'Create an account to download this report': 'Fungua akaunti ili kupakua ripoti hii',
    'Free account required': 'Akaunti ya bure inahitajika',
    'Download and save this report': 'Pakua na uhifadhi ripoti hii',
    'Your generated file stays in this browser. Create or use an AfroTools account so repeat downloads, saved reports, and dashboard handoff stay connected.': 'Faili uliyotengeneza inabaki kwenye kivinjari hiki. Fungua au tumia akaunti ya AfroTools ili upakuaji wa baadaye, ripoti zilizohifadhiwa na dashibodi viendelee kuunganishwa.',
    'Private browser export': 'Upakuaji binafsi wa kivinjari',
    'Saved report trail': 'Historia ya ripoti iliyohifadhiwa',
    'Dashboard ready': 'Tayari kwa dashibodi',
    'Create account': 'Fungua akaunti',
    'Sign in': 'Ingia',
    'Report name': 'Jina la ripoti',
    'Payroll tax report': 'Ripoti ya kodi ya mishahara',
    'Full name': 'Jina kamili',
    'Your name': 'Jina lako',
    'Work email': 'Barua pepe ya kazi',
    'Company or client': 'Kampuni au mteja',
    'Company, client, or personal': 'Kampuni, mteja au binafsi',
    'Role': 'Wajibu',
    'Founder, HR, accountant': 'Mwanzilishi, rasilimali watu au mhasibu',
    'Use case': 'Matumizi',
    'Personal salary': 'Mshahara binafsi',
    'Employer payroll': 'Mishahara ya mwajiri',
    'Client advisory': 'Ushauri kwa mteja',
    'Business planning': 'Mpango wa biashara',
    'Password': 'Nenosiri',
    'Minimum 6 characters': 'Angalau herufi 6',
    'Create account and download': 'Fungua akaunti na upakue',
    'Sign in and download': 'Ingia na upakue',
    'Already signed in on this browser? Continue download': 'Tayari umeingia kwenye kivinjari hiki? Endelea kupakua',
    'Registered users skip this gate automatically. Guests can calculate first, then create an account only when they need the generated download.': 'Watumiaji waliojisajili hupita hatua hii moja kwa moja. Wageni wanaweza kutumia zana kwanza, kisha kufungua akaunti wanapohitaji kupakua faili iliyotengenezwa.',
    'You are not signed in on this browser yet.': 'Bado hujaingia kwenye kivinjari hiki.',
    'Enter a valid email address.': 'Weka anwani sahihi ya barua pepe.',
    'Enter a password with at least 6 characters.': 'Weka nenosiri lenye angalau herufi 6.',
    'Enter your name to create the account.': 'Weka jina lako ili kufungua akaunti.',
    'Add company/client and role so the report trail is useful later.': 'Weka kampuni au mteja na wajibu ili historia ya ripoti iwe na manufaa baadaye.',
    'Creating account...': 'Inafungua akaunti...',
    'Signing in...': 'Inaingia...',
    'Authentication failed.': 'Uthibitishaji umeshindwa.',
    'Could not sign in. Please try again.': 'Imeshindikana kuingia. Jaribu tena.'
  });

  Object.keys(root && root.AfroTools && root.AfroTools.SwahiliDocumentPdfPhrases || {}).forEach(function (source) {
    if (!Object.prototype.hasOwnProperty.call(phrases, source)) {
      phrases[source] = root.AfroTools.SwahiliDocumentPdfPhrases[source];
    }
  });

  var phraseTrie = null;
  var exactOnly = false;

  function getPhraseTrie() {
    if (phraseTrie) return phraseTrie;
    phraseTrie = Object.create(null);
    Object.keys(phrases).filter(function (phrase) { return phrase.length >= 7; }).forEach(function (phrase) {
      var node = phraseTrie;
      for (var index = 0; index < phrase.length; index += 1) {
        var character = phrase[index];
        node[character] = node[character] || Object.create(null);
        node = node[character];
      }
      node.$ = phrases[phrase];
    });
    return phraseTrie;
  }

  function translatePartial(text) {
    var output = '';
    var index = 0;
    var rootNode = getPhraseTrie();
    while (index < text.length) {
      var node = rootNode;
      var cursor = index;
      var match = null;
      var matchEnd = index;
      while (cursor < text.length && node[text[cursor]]) {
        node = node[text[cursor]];
        cursor += 1;
        if (node.$) {
          match = node.$;
          matchEnd = cursor;
        }
      }
      if (match) {
        output += match;
        index = matchEnd;
      } else {
        output += text[index];
        index += 1;
      }
    }
    return output;
  }

  function translate(value) {
    var text = String(value || '');
    var trimmed = text.trim();
    if (!trimmed) return text;
    if (phrases[trimmed]) return text.replace(trimmed, phrases[trimmed]);
    var normalized = trimmed.replace(/\s+/g, ' ');
    if (phrases[normalized]) return text.replace(trimmed, phrases[normalized]);
    return translatePartial(text);
  }

  function translateElement(root) {
    if (!root) return;
    var doc = root.ownerDocument || root;
    var walker = doc.createTreeWalker(root, 4);
    var nodes = [];
    while (walker.nextNode()) {
      var parent = walker.currentNode.parentElement;
      if (parent && !/^(SCRIPT|STYLE|NOSCRIPT|CODE|PRE)$/i.test(parent.tagName)) nodes.push(walker.currentNode);
    }
    nodes.forEach(function (node) {
      var translated = translate(node.nodeValue);
      if (translated !== node.nodeValue) node.nodeValue = translated;
    });
    if (root.querySelectorAll) {
      var elements = Array.from(root.querySelectorAll('[placeholder],[aria-label],[title],input[type="button"],input[type="submit"]'));
      if (root.matches && root.matches('[placeholder],[aria-label],[title],input[type="button"],input[type="submit"]')) elements.unshift(root);
      elements.forEach(function (element) {
        ['placeholder', 'aria-label', 'title', 'value'].forEach(function (attribute) {
          if (!element.hasAttribute(attribute)) return;
          var value = element.getAttribute(attribute);
          var translated = translate(value);
          if (translated !== value) element.setAttribute(attribute, translated);
        });
      });
    }
  }

  function install(doc) {
    var localePayload = doc.getElementById('sw-document-pdf-locale');
    if (localePayload) {
      try {
        exactOnly = JSON.parse(localePayload.textContent || '{}').id === 'cv-builder';
      } catch (_) {
        exactOnly = false;
      }
    }
    function run() {
      translateElement(doc.body);
      doc.documentElement.dataset.swDocumentPdfLocalized = 'true';
      var observerOptions = {
        childList: true,
        characterData: true,
        attributes: true,
        attributeFilter: ['placeholder', 'aria-label', 'title', 'value'],
        subtree: true
      };
      var pendingRoots = [];
      var flushScheduled = false;
      var scheduleFrame = root.requestAnimationFrame || function (callback) { return root.setTimeout(callback, 16); };
      function enqueue(node) {
        if (!node) return;
        var element = node.nodeType === 3 ? node.parentElement : node;
        if (!element || element.nodeType !== 1) return;
        pendingRoots.push(element);
      }
      function flushPending() {
        flushScheduled = false;
        observer.disconnect();
        try {
          var roots = pendingRoots.filter(function (element, index, values) {
            if (!element.isConnected) return false;
            return !values.some(function (candidate, candidateIndex) {
              return candidateIndex !== index && candidate !== element && candidate.contains(element);
            });
          });
          pendingRoots.length = 0;
          roots.forEach(translateElement);
        } finally {
          observer.observe(doc.documentElement, observerOptions);
        }
      }
      var observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          if (mutation.type === 'characterData' || mutation.type === 'attributes') enqueue(mutation.target);
          mutation.addedNodes.forEach(enqueue);
        });
        if (!flushScheduled && pendingRoots.length) {
          flushScheduled = true;
          scheduleFrame.call(root, flushPending);
        }
      });
      observer.observe(doc.documentElement, observerOptions);
    }
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', run, { once: true });
    else run();
  }

  return Object.freeze({ phrases: phrases, translate: translate, install: install });
});
