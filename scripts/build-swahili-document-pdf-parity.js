#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const swahiliLocalizer = require('../assets/js/pages/sw-document-pdf-localizer.js');

const ROOT = path.resolve(__dirname, '..');
const DOCUMENT_PDF_LEXICON = JSON.parse(fs.readFileSync(
  path.join(ROOT, 'data', 'localization', 'sw-document-pdf-lexicon.json'),
  'utf8'
));
const DIRECTORY_PATH = path.join(ROOT, 'data', 'tool-directory.json');
const WRITE = process.argv.includes('--write');
const CHECK = process.argv.includes('--check');
const CONTENT_IDS_ONLY = process.argv.includes('--content-ids-only');
const APP_FILTER_ARG = process.argv.find((argument) => argument.startsWith('--apps='));
const APP_FILTER = APP_FILTER_ARG
  ? new Set(APP_FILTER_ARG.slice('--apps='.length).split(',').map((id) => id.trim()).filter(Boolean))
  : null;

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function contentId(id) {
  return `sw-document-pdf:${id}`;
}

function ensureSwAccessibilityRuntime(html) {
  if (html.includes('/assets/js/lib/sw-accessibility.js')) return html;
  const closingBody = html.toLowerCase().lastIndexOf('</body>');
  if (closingBody === -1) throw new Error('No closing body tag for Swahili accessibility runtime');
  return `${html.slice(0, closingBody)}<script src="/assets/js/lib/sw-accessibility.js" defer></script>${html.slice(closingBody)}`;
}

const apps = [
  { id: 'pdf-workspace', englishRoute: '/tools/pdf-workspace/', englishFile: 'tools/pdf-workspace/index.html', swahiliRoute: '/sw/zana/nafasi-pdf/', swahiliFile: 'sw/zana/nafasi-pdf/index.html', name: 'Nafasi ya PDF', exports: ['pdf', 'png', 'zip', 'print'] },
  { id: 'pdf-merge-split', englishRoute: '/tools/pdf-merge-split/', englishFile: 'tools/pdf-merge-split/index.html', swahiliRoute: '/sw/zana/unganisha-na-gawanya-pdf/', swahiliFile: 'sw/zana/unganisha-na-gawanya-pdf/index.html', name: 'Unganisha na Gawanya PDF', exports: ['pdf', 'zip'] },
  { id: 'pdf-form-filler', englishRoute: '/tools/pdf-form-filler/', englishFile: 'tools/pdf-form-filler/index.html', swahiliRoute: '/sw/zana/kujaza-fomu-pdf/', swahiliFile: 'sw/zana/kujaza-fomu-pdf/index.html', name: 'Jaza Fomu ya PDF', exports: ['pdf'] },
  { id: 'pdf-redact', englishRoute: '/tools/pdf-redact/', englishFile: 'tools/pdf-redact/index.html', swahiliRoute: '/sw/zana/kuficha-taarifa-pdf/', swahiliFile: 'sw/zana/kuficha-taarifa-pdf/index.html', name: 'Ficha Taarifa za PDF', exports: ['pdf'] },
  { id: 'pdf-header-footer', englishRoute: '/tools/pdf-header-footer/', englishFile: 'tools/pdf-header-footer/index.html', swahiliRoute: '/sw/zana/kichwa-na-kijachini-pdf/', swahiliFile: 'sw/zana/kichwa-na-kijachini-pdf/index.html', name: 'Kichwa na Kijachini cha PDF', exports: ['pdf'] },
  { id: 'pdf-convert', englishRoute: '/tools/pdf-convert/', englishFile: 'tools/pdf-convert/index.html', swahiliRoute: '/sw/zana/kubadilisha-format-pdf/', swahiliFile: 'sw/zana/kubadilisha-format-pdf/index.html', name: 'Badilisha Muundo wa PDF', exports: ['pdf', 'txt', 'png', 'jpeg', 'zip'] },
  { id: 'pdf-reorder', englishRoute: '/tools/pdf-reorder/', englishFile: 'tools/pdf-reorder/index.html', swahiliRoute: '/sw/zana/kupanga-kurasa-pdf/', swahiliFile: 'sw/zana/kupanga-kurasa-pdf/index.html', name: 'Panga Kurasa za PDF', exports: ['pdf'] },
  { id: 'pdf-translate', englishRoute: '/tools/pdf-translate/', englishFile: 'tools/pdf-translate/index.html', swahiliRoute: '/sw/zana/kutafsiri-pdf/', swahiliFile: 'sw/zana/kutafsiri-pdf/index.html', name: 'Tafsiri PDF', exports: ['pdf', 'txt'], requiresConsent: true },
  { id: 'pdf-to-audio', englishRoute: '/tools/pdf-to-audio/', englishFile: 'tools/pdf-to-audio/index.html', swahiliRoute: '/sw/zana/pdf-kwenda-sauti/', swahiliFile: 'sw/zana/pdf-kwenda-sauti/index.html', name: 'PDF kwenda Sauti', exports: ['txt'] },
  { id: 'pdf-bates', englishRoute: '/tools/pdf-bates/', englishFile: 'tools/pdf-bates/index.html', swahiliRoute: '/sw/zana/namba-bates-pdf/', swahiliFile: 'sw/zana/namba-bates-pdf/index.html', name: 'Namba za Bates za PDF', exports: ['pdf', 'zip', 'csv'] },
  { id: 'html-to-pdf', englishRoute: '/tools/html-to-pdf/', englishFile: 'tools/html-to-pdf/index.html', swahiliRoute: '/sw/zana/html-kwenda-pdf/', swahiliFile: 'sw/zana/html-kwenda-pdf/index.html', name: 'HTML kwenda PDF', exports: ['pdf', 'html', 'json'] },
  { id: 'pdf-find-replace', englishRoute: '/tools/pdf-find-replace/', englishFile: 'tools/pdf-find-replace/index.html', swahiliRoute: '/sw/zana/tafuta-na-badilisha-pdf/', swahiliFile: 'sw/zana/tafuta-na-badilisha-pdf/index.html', name: 'Tafuta na Badilisha kwenye PDF', exports: ['pdf', 'csv'] },
  { id: 'pdf-repair', englishRoute: '/tools/pdf-repair/', englishFile: 'tools/pdf-repair/index.html', swahiliRoute: '/sw/zana/kurekebisha-pdf/', swahiliFile: 'sw/zana/kurekebisha-pdf/index.html', name: 'Rekebisha PDF', exports: ['pdf', 'zip', 'json', 'csv'] },
  { id: 'pdf-workflow', englishRoute: '/tools/pdf-workflow/', englishFile: 'tools/pdf-workflow/index.html', swahiliRoute: '/sw/zana/workflow-ya-pdf/', swahiliFile: 'sw/zana/workflow-ya-pdf/index.html', name: 'Mtiririko wa Kazi wa PDF', exports: ['pdf', 'json'] },
  { id: 'cv-builder', englishRoute: '/tools/cv-builder/', englishFile: 'tools/cv-builder/index.html', swahiliRoute: '/sw/zana/mjenzi-cv/', swahiliFile: 'sw/zana/mjenzi-cv/index.html', name: 'Mjenzi wa CV', exports: ['pdf', 'docx', 'txt', 'csv', 'json', 'zip', 'print'], sensitive: true },
  { id: 'invoice-generator', englishRoute: '/tools/invoice-generator/', englishFile: 'tools/invoice-generator/index.html', swahiliRoute: '/sw/zana/kizalishaji-ankara/', swahiliFile: 'sw/zana/kizalishaji-ankara/index.html', name: 'Kizalishaji Ankara', exports: ['pdf'], sensitive: true },
  { id: 'cover-letter', englishRoute: '/tools/cover-letter-generator/', englishFile: 'tools/cover-letter-generator/index.html', swahiliRoute: '/sw/zana/barua-ombi/', swahiliFile: 'sw/zana/barua-ombi/index.html', name: 'Barua ya Maombi', exports: ['pdf', 'doc', 'txt', 'json', 'print'], alternates: { fr: '/fr/tools/generateur-lettre-motivation/', ha: '/ha/kayan-aiki/rubuta-wasikar-aiki/' }, sensitive: true },
  { id: 'freelance-invoice', englishRoute: '/tools/freelance-invoice/', englishFile: 'tools/freelance-invoice/index.html', swahiliRoute: '/sw/zana/ankara-ya-freelancer/', swahiliFile: 'sw/zana/ankara-ya-freelancer/index.html', name: 'Ankara ya Freelancer', exports: ['pdf', 'doc', 'txt', 'csv', 'json', 'print'], sensitive: true },
  { id: 'pdf-compress', englishRoute: '/tools/pdf-compress/', englishFile: 'tools/pdf-compress/index.html', swahiliRoute: '/sw/zana/kubana-pdf/', swahiliFile: 'sw/zana/kubana-pdf/index.html', name: 'Bana PDF', exports: ['pdf', 'zip'] },
  { id: 'pdf-image-convert', englishRoute: '/tools/pdf-image-convert/', englishFile: 'tools/pdf-image-convert/index.html', swahiliRoute: '/sw/zana/kubadilisha-pdf-na-picha/', swahiliFile: 'sw/zana/kubadilisha-pdf-na-picha/index.html', name: 'Badilisha PDF na Picha', exports: ['pdf', 'png', 'jpeg', 'zip'] },
  { id: 'pdf-watermark', englishRoute: '/tools/pdf-watermark/', englishFile: 'tools/pdf-watermark/index.html', swahiliRoute: '/sw/zana/watermark-pdf/', swahiliFile: 'sw/zana/watermark-pdf/index.html', name: 'Alama ya Maji ya PDF', exports: ['pdf', 'zip'] },
  { id: 'pdf-password', englishRoute: '/tools/pdf-password/', englishFile: 'tools/pdf-password/index.html', swahiliRoute: '/sw/zana/kulinda-pdf-kwa-nenosiri/', swahiliFile: 'sw/zana/kulinda-pdf-kwa-nenosiri/index.html', name: 'Linda PDF kwa Nenosiri', exports: ['pdf', 'zip'] },
  { id: 'pdf-page-numbers', englishRoute: '/tools/pdf-page-numbers/', englishFile: 'tools/pdf-page-numbers/index.html', swahiliRoute: '/sw/zana/namba-za-kurasa-pdf/', swahiliFile: 'sw/zana/namba-za-kurasa-pdf/index.html', name: 'Namba za Kurasa za PDF', exports: ['pdf', 'zip'] },
  { id: 'pdf-sign', englishRoute: '/tools/pdf-sign/', englishFile: 'tools/pdf-sign/index.html', swahiliRoute: '/sw/zana/kusaini-pdf/', swahiliFile: 'sw/zana/kusaini-pdf/index.html', name: 'Saini PDF', exports: ['pdf'] },
  { id: 'pdf-ocr', englishRoute: '/tools/pdf-ocr/', englishFile: 'tools/pdf-ocr/index.html', swahiliRoute: '/sw/zana/ocr-pdf/', swahiliFile: 'sw/zana/ocr-pdf/index.html', name: 'OCR ya PDF', exports: ['txt'] },
  { id: 'pdf-editor', englishRoute: '/tools/pdf-editor/', englishFile: 'tools/pdf-editor/index.html', swahiliRoute: '/sw/zana/hariri-pdf/', swahiliFile: 'sw/zana/hariri-pdf/index.html', name: 'Hariri PDF', exports: ['pdf'] },
  { id: 'pdf-chat', englishRoute: '/tools/pdf-chat/', englishFile: 'tools/pdf-chat/index.html', swahiliRoute: '/sw/zana/chat-na-pdf/', swahiliFile: 'sw/zana/chat-na-pdf/index.html', name: 'Uliza PDF', exports: ['txt'], requiresConsent: true },
  { id: 'pdf-compare', englishRoute: '/tools/pdf-compare/', englishFile: 'tools/pdf-compare/index.html', swahiliRoute: '/sw/zana/kulinganisha-pdf/', swahiliFile: 'sw/zana/kulinganisha-pdf/index.html', name: 'Linganisha PDF', exports: ['txt'] },
  { id: 'meeting-minutes', englishRoute: '/tools/meeting-minutes/', englishFile: 'tools/meeting-minutes/index.html', swahiliRoute: '/sw/zana/kumbukumbu-za-mkutano/', swahiliFile: 'sw/zana/kumbukumbu-za-mkutano/index.html', name: 'Kumbukumbu za Mkutano', exports: ['pdf', 'doc', 'txt', 'csv', 'ics', 'json', 'print'], alternates: { fr: '/fr/tools/compte-rendu-reunion/' }, sensitive: true, generated: true },
  { id: 'receipt-generator', englishRoute: '/tools/receipt-generator/', englishFile: 'tools/receipt-generator/index.html', swahiliRoute: '/sw/zana/kizalishaji-risiti/', swahiliFile: 'sw/zana/kizalishaji-risiti/index.html', name: 'Kizalishaji Risiti', exports: ['pdf', 'txt', 'csv', 'json', 'print'], alternates: { fr: '/fr/tools/generateur-recu/', ha: '/ha/kayan-aiki/kirkiro-resit/' }, sensitive: true, generated: true },
  { id: 'business-plan', englishRoute: '/tools/business-plan/', englishFile: 'tools/business-plan/index.html', swahiliRoute: '/sw/zana/mpango-wa-biashara/', swahiliFile: 'sw/zana/mpango-wa-biashara/index.html', name: 'Mpango wa Biashara', exports: ['pdf', 'doc', 'txt', 'csv', 'json'], alternates: { fr: '/fr/tools/plan-affaires/' }, sensitive: true, generated: true }
];
const documentPdfRoutes = [
  ...apps,
  { id: 'document-pdf', englishRoute: '/document-pdf/', swahiliRoute: '/sw/hati-na-pdf/' }
];
if (APP_FILTER) {
  const knownIds = new Set(apps.map((app) => app.id));
  const unknownIds = Array.from(APP_FILTER).filter((id) => !knownIds.has(id));
  if (unknownIds.length) throw new Error(`Unknown --apps ids: ${unknownIds.join(', ')}`);
}
const selectedApps = APP_FILTER ? apps.filter((app) => APP_FILTER.has(app.id)) : apps;
const fullParitySources = {
  ...Object.fromEntries(apps.map((app) => [app.id, app.englishFile])),
  'cover-letter': 'tools/cover-letter-generator/app.html',
  'meeting-minutes': 'tools/meeting-minutes/app.html',
  'business-plan': 'tools/business-plan/app.html'
};

const fullParityMetadata = {
  'pdf-workspace': {
    description: 'Panga, zungusha, unganisha, gawanya na uhifadhi kurasa za PDF ndani ya kivinjari bila kupakia faili zako mtandaoni.'
  },
  'pdf-merge-split': {
    description: 'Unganisha PDF, gawa kwa safu za kurasa au pakua kila ukurasa kwenye ZIP, yote ndani ya kivinjari chako.'
  },
  'pdf-form-filler': {
    description: 'Jaza sehemu za fomu ya PDF, kagua thamani zilizoingizwa na pakua PDF iliyojazwa bila kuituma mtandaoni.'
  },
  'pdf-redact': {
    description: 'Ficha taarifa nyeti kwenye PDF, kagua maeneo yaliyofunikwa na pakua nakala mpya ndani ya kivinjari.'
  },
  'pdf-header-footer': {
    description: 'Ongeza kichwa, kijachini na maandishi ya kurasa kwenye PDF, kagua mpangilio na pakua nakala iliyobadilishwa.'
  },
  'pdf-convert': {
    description: 'Badilisha PDF kuwa TXT, PNG au JPG, na badilisha hati au picha kuwa PDF kwa usindikaji wa ndani ya kivinjari.'
  },
  'pdf-reorder': {
    description: 'Panga upya, zungusha, nakili, futa, ongeza au toa kurasa za PDF na upakue mpangilio uliokagua.'
  },
  'pdf-ocr': {
    description: 'Toa maandishi kutoka PDF zilizochanganuliwa na picha za hati ndani ya kivinjari, kwa ukaguzi wa kila ukurasa na upakuaji wa TXT.'
  },
  'pdf-chat': {
    description: 'Pakia PDF, uliza maswali ndani ya kifaa, pata muhtasari na marejeo ya kurasa; Usaidizi wa AI hutumika tu baada ya ridhaa.'
  },
  'pdf-translate': {
    description: 'Toa na tafsiri maandishi ya PDF ndani ya kifaa, kagua matokeo na pakua TXT au PDF; utumaji wa hiari huhitaji ridhaa.'
  },
  'pdf-compare': {
    description: 'Linganisha PDF mbili ndani ya kivinjari kwa tofauti za maandishi na mwonekano, ramani ya kurasa na ripoti inayopakuliwa.'
  },
  'pdf-to-audio': {
    description: 'Toa maandishi ya PDF, yasikilize kwa sauti ya kifaa na pakua nakala ya TXT bila kupakia hati mtandaoni.'
  },
  'pdf-bates': {
    description: 'Weka namba za Bates kwenye PDF, tengeneza kundi la ZIP na pakua orodha ya ukaguzi ya CSV ndani ya kivinjari.'
  },
  'html-to-pdf': {
    description: 'Geuza HTML kuwa PDF, kagua mwonekano na pakua pia chanzo cha HTML na mipangilio ya JSON ndani ya kivinjari.'
  },
  'pdf-find-replace': {
    description: 'Tafuta maandishi kwenye PDF, tumia marekebisho yanayokaguliwa na pakua PDF mpya pamoja na ripoti ya CSV.'
  },
  'pdf-repair': {
    description: 'Kagua na jenga upya PDF yenye hitilafu, kisha pakua PDF, ZIP na ripoti za JSON au CSV za ukarabati.'
  },
  'pdf-workflow': {
    description: 'Unda mtiririko wa hatua za PDF, kagua mabadiliko na pakua PDF pamoja na ripoti ya JSON ya hatua zilizotumika.'
  },
  'cv-builder': {
    description: 'Tengeneza CV ya kitaalamu ndani ya kifaa na pakua PDF, DOCX, TXT, CSV, JSON au ZIP bila lango la akaunti.'
  },
  'invoice-generator': {
    description: 'Tengeneza ankara yenye bidhaa, kodi na maelezo ya malipo, kisha pakua PDF halisi moja kwa moja kwenye kifaa.'
  },
  'cover-letter': {
    description: 'Andaa barua ya ombi la kazi ndani ya kivinjari na pakua PDF, DOC, TXT au JSON bila kutuma taarifa zako.'
  },
  'freelance-invoice': {
    description: 'Andaa ankara ya kazi huru yenye bidhaa, kodi na malipo, kisha pakua PDF, DOC, TXT, CSV au JSON ndani ya kifaa.'
  },
  'meeting-minutes': {
    description: 'Andaa ajenda, waliohudhuria, maamuzi, hatua, wahusika na tarehe za mwisho, kisha pakua kumbukumbu katika miundo mingi.'
  },
  'receipt-generator': {
    description: 'Tengeneza risiti za biashara zenye kodi, rejea za malipo, QR, rasimu za ndani na upakuaji wa PDF, CSV, JSON na TXT.'
  },
  'business-plan': {
    description: 'Andaa mpango wa biashara wenye mkakati, hatua muhimu, ufadhili, makadirio ya fedha, ukaguzi na upakuaji wa hati.'
  }
};

const newApps = {
  'meeting-minutes': {
    description: 'Andika maamuzi, hatua, wahusika na tarehe za mwisho, kisha pakua kumbukumbu bila kutuma maelezo ya mkutano mtandaoni.',
    fields: `
      <div class="sw-doc-field wide"><label for="title">Jina la mkutano</label><input id="title" name="title" required value="Mkutano wa timu"></div>
      <div class="sw-doc-field"><label for="organization">Shirika</label><input id="organization" name="organization" value="AfroTools"></div>
      <div class="sw-doc-field"><label for="date">Tarehe</label><input id="date" name="date" type="date" required value="2026-07-31"></div>
      <div class="sw-doc-field"><label for="chair">Mwenyekiti</label><input id="chair" name="chair" value="Asha"></div>
      <div class="sw-doc-field"><label for="minuteTaker">Mwandishi wa kumbukumbu</label><input id="minuteTaker" name="minuteTaker" value="Juma"></div>
      <div class="sw-doc-field wide"><label for="discussion">Hoja na mjadala</label><textarea id="discussion" name="discussion" required>Tulipitia ratiba ya kazi na mahitaji ya wateja.</textarea></div>
      <div class="sw-doc-field wide"><label for="decision">Uamuzi</label><textarea id="decision" name="decision">Timu imekubali ratiba mpya.</textarea></div>
      <div class="sw-doc-field wide"><label for="action">Hatua inayofuata</label><textarea id="action" name="action">Kamilisha mapitio ya bidhaa.</textarea></div>
      <div class="sw-doc-field"><label for="owner">Mhusika</label><input id="owner" name="owner" value="Asha"></div>
      <div class="sw-doc-field"><label for="dueDate">Tarehe ya mwisho</label><input id="dueDate" name="dueDate" type="date" value="2026-08-07"></div>
      <div class="sw-doc-field wide"><label for="nextMeeting">Mkutano unaofuata</label><input id="nextMeeting" name="nextMeeting" type="datetime-local" value="2026-08-07T10:00"></div>`,
    exports: [['pdf','PDF'],['doc','DOC'],['txt','TXT'],['csv','CSV'],['ics','ICS'],['json','JSON'],['print','Chapisha']]
  },
  'receipt-generator': {
    description: 'Tengeneza risiti yenye namba, bidhaa, kodi na malipo, kisha pakua nakala kwenye kifaa hiki pekee.',
    fields: `
      <div class="sw-doc-field"><label for="businessName">Jina la biashara</label><input id="businessName" name="businessName" required value="Duka la Amani"></div>
      <div class="sw-doc-field"><label for="customer">Mteja</label><input id="customer" name="customer" value="Mteja wa mfano"></div>
      <div class="sw-doc-field"><label for="receiptNumber">Namba ya risiti</label><input id="receiptNumber" name="receiptNumber" required value="R-2026-001"></div>
      <div class="sw-doc-field"><label for="date">Tarehe</label><input id="date" name="date" type="date" value="2026-07-31"></div>
      <div class="sw-doc-field wide"><label for="description">Bidhaa au huduma</label><input id="description" name="description" required value="Huduma ya ushauri"></div>
      <div class="sw-doc-field"><label for="quantity">Idadi</label><input id="quantity" name="quantity" type="number" min="0.01" step="0.01" value="2"></div>
      <div class="sw-doc-field"><label for="rate">Bei kwa kipimo</label><input id="rate" name="rate" type="number" min="0" step="0.01" value="25000"></div>
      <div class="sw-doc-field"><label for="taxRate">Kodi (%)</label><input id="taxRate" name="taxRate" type="number" min="0" step="0.01" value="0"></div>
      <div class="sw-doc-field"><label for="currency">Sarafu</label><select id="currency" name="currency"><option>TZS</option><option>KES</option><option>UGX</option><option>RWF</option><option>USD</option></select></div>
      <div class="sw-doc-field"><label for="paymentMethod">Njia ya malipo</label><input id="paymentMethod" name="paymentMethod" value="Simu"></div>
      <div class="sw-doc-field"><label for="reference">Rejea ya malipo</label><input id="reference" name="reference" value="TXN-001"></div>`,
    exports: [['pdf','PDF'],['txt','TXT'],['csv','CSV'],['json','JSON'],['print','Chapisha']]
  },
  'business-plan': {
    description: 'Panga wazo la biashara, wateja, uendeshaji, hatari na makadirio ya fedha katika hati inayobaki kwenye kivinjari chako.',
    fields: `
      <div class="sw-doc-field"><label for="businessName">Jina la biashara</label><input id="businessName" name="businessName" required value="Biashara ya Mwangaza"></div>
      <div class="sw-doc-field"><label for="owner">Mmiliki</label><input id="owner" name="owner" value="Amina"></div>
      <div class="sw-doc-field wide"><label for="country">Nchi na eneo</label><input id="country" name="country" value="Tanzania"></div>
      <div class="sw-doc-field wide"><label for="summary">Muhtasari wa biashara</label><textarea id="summary" name="summary" required>Tunatoa suluhisho rahisi kwa biashara ndogo.</textarea></div>
      <div class="sw-doc-field wide"><label for="customer">Mteja lengwa</label><textarea id="customer" name="customer" required>Biashara ndogo za mijini.</textarea></div>
      <div class="sw-doc-field wide"><label for="offer">Bidhaa au huduma</label><textarea id="offer" name="offer" required>Huduma ya kupanga na kufuatilia kazi.</textarea></div>
      <div class="sw-doc-field wide"><label for="marketing">Mpango wa masoko</label><textarea id="marketing" name="marketing">Marejeo, mitandao ya kijamii na washirika wa eneo.</textarea></div>
      <div class="sw-doc-field wide"><label for="operations">Uendeshaji</label><textarea id="operations" name="operations">Timu ndogo itahudumia wateja kwa ratiba.</textarea></div>
      <div class="sw-doc-field wide"><label for="risks">Hatari na mikakati</label><textarea id="risks" name="risks">Mahitaji yanaweza kubadilika; tutapitia mpango kila mwezi.</textarea></div>
      <div class="sw-doc-field"><label for="startupCost">Gharama ya kuanza</label><input id="startupCost" name="startupCost" type="number" min="0" step="0.01" value="1000000"></div>
      <div class="sw-doc-field"><label for="monthlyRevenue">Mapato ya mwezi</label><input id="monthlyRevenue" name="monthlyRevenue" type="number" min="0" step="0.01" value="600000"></div>
      <div class="sw-doc-field"><label for="monthlyCost">Gharama ya mwezi</label><input id="monthlyCost" name="monthlyCost" type="number" min="0" step="0.01" value="350000"></div>`,
    exports: [['pdf','PDF'],['doc','DOC'],['txt','TXT'],['csv','CSV'],['json','JSON']]
  }
};

// Older Swahili pages were produced by a visible-copy pass that also translated
// executable DOM ids. Their inline runtimes still query the original ids, so
// uploads and exports remain disabled. Keep these repairs in the generator
// owner; never patch the generated route files independently.
const legacyIdRepairs = {
  'pdf-convert': {
    modePdfMaandishi: 'modePdfText',
    modePdfPichas: 'modePdfImages',
    wordFailiName: 'wordFileName',
    wordFailiUkubwa: 'wordFileSize',
    wordFailiInfo: 'wordFileInfo',
    wordBadilishaBtn: 'wordConvertBtn',
    wordMatokeoCard: 'wordResultCard',
    wordProgressMaandishi: 'wordProgressText',
    wordUkurasaUkubwa: 'wordPageSize',
    wordMatokeoName: 'wordResultName',
    wordMatokeoInfo: 'wordResultInfo',
    wordPakuaBtn: 'wordDownloadBtn',
    excelFailiName: 'excelFileName',
    excelFailiUkubwa: 'excelFileSize',
    excelFailiInfo: 'excelFileInfo',
    excelBadilishaBtn: 'excelConvertBtn',
    excelMatokeoCard: 'excelResultCard',
    excelProgressMaandishi: 'excelProgressText',
    excelUkurasaUkubwa: 'excelPageSize',
    excelFontUkubwa: 'excelFontSize',
    excelFitUkurasa: 'excelFitPage',
    excelMatokeoName: 'excelResultName',
    excelMatokeoInfo: 'excelResultInfo',
    excelPakuaBtn: 'excelDownloadBtn',
    textFailiName: 'textFileName',
    textFailiUkubwa: 'textFileSize',
    textFailiInfo: 'textFileInfo',
    textToaBtn: 'textExtractBtn',
    textMatokeoCard: 'textResultCard',
    textUkurasaCount: 'textPageCount',
    textProgressMaandishi: 'textProgressText',
    textUkurasaTabs: 'textPageTabs',
    imageFailiName: 'imageFileName',
    imageFailiUkubwa: 'imageFileSize',
    imageFailiInfo: 'imageFileInfo',
    imageBadilishaBtn: 'imageConvertBtn',
    imageMatokeoCard: 'imageResultCard',
    imageUkurasaCount: 'imagePageCount',
    imageUkurasaRange: 'imagePageRange',
    imageProgressMaandishi: 'imageProgressText',
    imageMatokeoName: 'imageResultName',
    imageMatokeoInfo: 'imageResultInfo',
    imagePakuaBtn: 'imageDownloadBtn'
  },
  'pdf-ocr': {
    fileOndoa: 'fileRemove',
    progressMaandishi: 'progressText',
    extractedMaandishi: 'extractedText'
  },
  'pdf-chat': {
    uploadPakiaing: 'uploadLoading'
  },
  'pdf-to-audio': {
    fileKurasa: 'filePages'
  },
  'pdf-bates': {
    resultMaandishi: 'resultText',
    stampRangi: 'stampColor',
    stampRangiHex: 'stampColorHex',
    previewMaandishi: 'previewText'
  },
  'pdf-find-replace': {
    prevUkurasa: 'prevPage',
    nextUkurasa: 'nextPage'
  },
  'pdf-repair': {
    pdfFailiInput: 'pdfFileInput',
    progressMaandishi: 'progressText'
  }
};

const legacyInlineRepairs = {
  'pdf-convert': {
    'resetPdfMaandishi()': 'resetPdfText()',
    'extractMaandishi()': 'extractText()',
    'copyMaandishi()': 'copyText()',
    'downloadMaandishi()': 'downloadText()',
    'resetPdfPichas()': 'resetPdfImages()',
    'convertPichas()': 'convertImages()'
  },
  // This tool creates its PDF entirely in the browser. Its legacy page invoked
  // the email modal unconditionally, contradicting the local-first primary
  // export contract and preventing a real download even for a signed-in user.
  'html-to-pdf': {
    "var gate = document.querySelector('email-gate-modal');\n    if (gate) { gate.show(doActualDownload); } else { doActualDownload(); }":
      'doActualDownload();'
  },
  'cover-letter': {
    "pdf.hifadhi('barua-ya-ombi.pdf')": "pdf.save('barua-ya-ombi.pdf')"
  },
  'pdf-workspace': {
    'id="exPrint">Print</button>': 'id="exPrint">Chapisha</button>'
  }
};

function page(app) {
  const definition = newApps[app.id];
  const canonical = `https://afrotools.com${app.swahiliRoute}`;
  const english = `https://afrotools.com${app.englishRoute}`;
  const artwork = `https://afrotools.com/assets/img/tools/${app.id}.webp`;
  const localeAlternates = Object.entries(app.alternates || {}).map(([locale, route]) =>
    `  <link rel="alternate" hreflang="${escapeHtml(locale)}" href="https://afrotools.com${escapeHtml(route)}">`
  ).join('\n');
  const actions = definition.exports.map(([format, label], index) =>
    `<button type="button" data-export="${format}"${index === 0 ? ' class="primary"' : ''}>Pakua ${label}</button>`
  ).join('');
  const schema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: app.name,
    description: definition.description,
    url: canonical,
    inLanguage: 'sw',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Any',
    offers: {'@type':'Offer','price':'0','priceCurrency':'USD'},
    isAccessibleForFree: true,
    browserRequirements: 'JavaScript'
  });
  return `<!doctype html>
<html lang="sw">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="Content-Language" content="sw">
  <title>${escapeHtml(app.name)} bila malipo | AfroTools</title>
  <meta name="description" content="${escapeHtml(definition.description)}">
  <link rel="canonical" href="${canonical}">
  <link rel="alternate" hreflang="en" href="${english}">
  <link rel="alternate" hreflang="sw" href="${canonical}">
${localeAlternates}
  <link rel="alternate" hreflang="x-default" href="${english}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="sw_KE">
  <meta property="og:title" content="${escapeHtml(app.name)} | AfroTools">
  <meta property="og:description" content="${escapeHtml(definition.description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${artwork}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="${artwork}">
  <meta name="afrotools-content-id" content="${contentId(app.id)}">
  <meta name="afrotools-source-owner" content="scripts/build-swahili-document-pdf-parity.js">
  <link rel="stylesheet" href="/assets/css/design-system.css">
  <link rel="stylesheet" href="/assets/css/sw-document-pdf-parity.css">
  <script type="application/ld+json">${schema}</script>
</head>
<body>
  <a class="skip-link" href="#main-content">Ruka hadi maudhui makuu</a>
  <afro-navbar active="tools"></afro-navbar>
  <main id="main-content" class="sw-doc-shell" data-sw-document-app="${app.id}">
    <section class="sw-doc-hero">
      <div class="eyebrow">Hati ya faragha · Kiswahili</div>
      <h1>${escapeHtml(app.name)}</h1>
      <p>${escapeHtml(definition.description)}</p>
    </section>
    <div class="sw-doc-layout">
      <section class="sw-doc-card" aria-labelledby="form-title">
        <h2 id="form-title">Jaza taarifa za hati</h2>
        <form class="sw-doc-grid" novalidate>${definition.fields}
          <div class="sw-doc-actions wide">
            <button class="primary" type="submit">Sasisha onyesho</button>
            <button type="button" data-save>Hifadhi rasimu hapa</button>
            <button type="button" data-load>Fungua rasimu</button>
          </div>
        </form>
        <p class="sw-doc-status" data-status role="status" aria-live="polite"></p>
      </section>
      <aside class="sw-doc-card">
        <h2>Onyesho la kukagua</h2>
        <div class="sw-doc-preview" data-preview tabindex="0"></div>
        <div class="sw-doc-actions">${actions}</div>
      </aside>
    </div>
    <section class="sw-doc-note" aria-labelledby="privacy-title">
      <h2 id="privacy-title">Taarifa zako zinabaki kwenye kifaa</h2>
      <p>Hesabu, rasimu na upakuaji hufanyika katika kivinjari hiki. Hakuna taarifa inayotumwa kwa AI, barua pepe, uchanganuzi au seva.</p>
    </section>
  </main>
  <section class="sw-doc-proof"><div><h2>Kagua kabla ya matumizi rasmi</h2><p>Hii ni hati ya kazi, si uthibitisho rasmi, ushauri wa kisheria au rekodi ya mamlaka. Fungua faili iliyopakuliwa na uhakikishe majina, tarehe, kiasi na mpangilio.</p></div></section>
  <afro-footer></afro-footer>
  <script src="/assets/vendor/jspdf/jspdf.umd.min.js"></script>
  <script src="/assets/js/components/navbar.js"></script>
  <script src="/assets/js/components/footer.js"></script>
  <script src="/assets/js/lib/dark-mode.js"></script>
  <script src="/assets/js/pages/sw-document-pdf-native.js"></script>
</body>
</html>
`;
}

function upsertMeta(html, attribute, key, content) {
  const pattern = new RegExp(`<meta\\s+${attribute}=["']${key}["'][^>]*>`, 'i');
  const replacement = `<meta ${attribute}="${key}" content="${escapeHtml(content)}">`;
  return pattern.test(html)
    ? html.replace(pattern, replacement)
    : html.replace('</head>', `  ${replacement}\n</head>`);
}

function upsertLink(html, rel, hreflang, href) {
  const qualifier = hreflang ? `\\s+hreflang=["']${hreflang}["']` : '';
  const pattern = new RegExp(`<link\\s+rel=["']${rel}["']${qualifier}[^>]*>`, 'i');
  const replacement = `<link rel="${rel}"${hreflang ? ` hreflang="${hreflang}"` : ''} href="${href}">`;
  return pattern.test(html)
    ? html.replace(pattern, replacement)
    : html.replace('</head>', `  ${replacement}\n</head>`);
}

function applyDownloadGateContract(html, app) {
  const sensitive = app.sensitive === true;
  html = html
    .replace(/\s*<email-gate-modal\b[^>]*><\/email-gate-modal>/gi, '')
    .replace(/\s*<script\b[^>]+src=["'][^"']*(?:auto-email-gate|pdf-download-gate)[^"']*["'][^>]*><\/script>/gi, '');
  if (sensitive) return html;
  const gate = `
  <email-gate-modal data-sw-download-contract="free-account"></email-gate-modal>
  <script src="/assets/js/lib/pdf-download-gate.js?v=20260502" defer></script>
`;
  const closingBody = html.toLowerCase().lastIndexOf('</body>');
  if (closingBody === -1) throw new Error(`${app.id}: no closing body for download gate`);
  return `${html.slice(0, closingBody)}${gate}${html.slice(closingBody)}`;
}

function injectParityRuntime(html, app) {
  const payload = JSON.stringify({
    id: app.id,
    name: app.name,
    downloadContract: app.sensitive === true ? 'sensitive-guest' : 'free-account'
  });
  const injection = `
  <script type="application/json" id="sw-document-pdf-locale">${payload}</script>
  <script src="/assets/js/pages/sw-document-pdf-lexicon.js" defer></script>
  <script src="/assets/js/pages/sw-document-pdf-localizer.js" defer></script>
  <script src="/assets/js/pages/sw-document-pdf-integrity.js" defer></script>
`;
  html = html
    .replace(/\s*<style id="sw-document-pdf-focus-proof">[\s\S]*?<\/style>/g, '')
    .replace(/\s*<link rel="stylesheet" href="\/assets\/css\/sw-document-pdf-a11y\.css">/g, '')
    .replace(/\s*<script type="application\/json" id="sw-document-pdf-locale">[\s\S]*?<\/script>/g, '')
    .replace(/\s*<script src="\/assets\/js\/pages\/sw-document-pdf-(?:lexicon|localizer|integrity)\.js" defer><\/script>/g, '')
    .replace(/\s*<script src="\/assets\/js\/pages\/sw-document-pdf-dom-stability\.js"><\/script>/g, '')
    .replace(/w\.document\.write\('\s*<\/body><\/html>'\);/g, "w.document.write('</body></html>');");
  const stabilityRuntime = app.id === 'cv-builder'
    ? '  <script src="/assets/js/pages/sw-document-pdf-dom-stability.js"></script>\n'
    : '';
  html = html.replace('</head>', `${stabilityRuntime}  <link rel="stylesheet" href="/assets/css/sw-document-pdf-a11y.css">\n</head>`);
  html = html.replace(/<body\b(?![^>]*\bid=["']sw-document-pdf-a11y-scope["'])/i, '<body id="sw-document-pdf-a11y-scope"');
  const closingBody = html.toLowerCase().lastIndexOf('</body>');
  if (closingBody === -1) throw new Error(`${app.id}: no closing body for parity runtime`);
  return `${html.slice(0, closingBody)}${injection}${html.slice(closingBody)}`;
}

function rewriteDocumentPdfRoutes(html) {
  for (const row of documentPdfRoutes) {
    html = html.split(`https://afrotools.com${row.englishRoute}`).join(`https://afrotools.com${row.swahiliRoute}`);
    html = html.split(`href="${row.englishRoute}`).join(`href="${row.swahiliRoute}`);
    html = html.split(`href='${row.englishRoute}`).join(`href='${row.swahiliRoute}`);
  }
  return html;
}

function rewriteLocalDocumentAssets(html) {
  const replacements = {
    'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js': '/assets/vendor/pdf-lib/pdf-lib.min.js',
    'https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js': '/assets/vendor/pdf-lib/pdf-lib.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js': '/assets/vendor/pdf-lib/pdf-lib.min.js',
    'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js': '/assets/vendor/pdfjs/pdf.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js': '/assets/vendor/pdfjs/pdf.min.js',
    'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js': '/assets/vendor/pdfjs/pdf.worker.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js': '/assets/vendor/pdfjs/pdf.worker.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js': '/assets/vendor/html2canvas/html2canvas.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js': '/assets/vendor/jspdf/jspdf.umd.min.js'
  };
  Object.entries(replacements).forEach(([remote, local]) => {
    html = html.split(remote).join(local);
  });
  html = html.replace(
    /const mod = await import\('https:\/\/cdn\.jsdelivr\.net\/npm\/pdfjs-dist@4\.0\.379\/build\/pdf\.min\.mjs'\);\s*pdfjsLib = mod;\s*pdfjsLib\.GlobalWorkerOptions\.workerSrc = 'https:\/\/cdn\.jsdelivr\.net\/npm\/pdfjs-dist@4\.0\.379\/build\/pdf\.worker\.min\.mjs';/,
    `if (!window.pdfjsLib) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = '/assets/vendor/pdfjs/pdf.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
    pdfjsLib = window.pdfjsLib;
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/assets/vendor/pdfjs/pdf.worker.min.js';`
  );
  return html;
}

function rewriteRelativeOwnerAssets(html, ownerFile) {
  const ownerDirectory = path.posix.dirname(ownerFile.replace(/\\/g, '/'));
  return html.replace(
    /\b(src|href)=(["'])((?:\.{1,2}\/)[^"'#]+)(\2)/gi,
    (match, attribute, quote, relativeUrl) => {
      const queryIndex = relativeUrl.search(/[?#]/);
      const pathname = queryIndex === -1 ? relativeUrl : relativeUrl.slice(0, queryIndex);
      const suffix = queryIndex === -1 ? '' : relativeUrl.slice(queryIndex);
      const resolved = path.posix.normalize(`/${ownerDirectory}/${pathname}`);
      return `${attribute}=${quote}${resolved}${suffix}${quote}`;
    }
  );
}

function hardenConsentBoundRequests(html, app) {
  if (!['pdf-chat', 'pdf-translate'].includes(app.id)) return html;
  html = html.replace(
    /cache:\s*'no-store',\s*(?!referrerPolicy:)/g,
    "cache: 'no-store',\n        referrerPolicy: 'no-referrer',\n        "
  );
  html = html.replace(
    /headers:\s*headers,\s*(?!credentials:|'credentials')body:/g,
    "headers: headers,\n        credentials: 'same-origin',\n        cache: 'no-store',\n        referrerPolicy: 'no-referrer',\n        body:"
  );
  return html;
}

function translateOwnedText(value, appId) {
  const text = String(value || '');
  const trimmed = text.trim();
  const lookup = trimmed
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#(?:39|x27);/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/\s+/g, ' ')
    .trim();
  const exact = DOCUMENT_PDF_LEXICON.routes?.[appId]?.[lookup];
  return exact ? text.replace(trimmed, exact) : swahiliLocalizer.translate(text);
}

function localizeStaticOwnerMarkup(html, appId) {
  const protectedBlocks = [];
  let localized = html.replace(
    /<(script|style|noscript|code|pre)\b[\s\S]*?<\/\1>/gi,
    (block) => `%%SW_PROTECTED_BLOCK_${protectedBlocks.push(block) - 1}%%`
  );
  localized = localized.replace(/>([^<]+)</g, (match, text) =>
    `>${translateOwnedText(text, appId)}<`
  );
  localized = localized.replace(/<[^>]+>/g, (tag) =>
    tag.replace(
      /\b(placeholder|aria-label|title)=(["'])(.*?)\2/gi,
      (match, attribute, quote, value) =>
        `${attribute}=${quote}${translateOwnedText(value, appId)}${quote}`
    )
  );
  return localized.replace(/%%SW_PROTECTED_BLOCK_(\d+)%%/g, (match, index) =>
    protectedBlocks[Number(index)]
  );
}

function ensureSwahiliApplicationSchema(html, app, metadata, canonical) {
  const hasSwahiliApplicationSchema = Array.from(
    html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)
  ).some((match) => {
    try {
      const data = JSON.parse(match[1]);
      const rows = Array.isArray(data) ? data : [data];
      return rows.some((row) => row
        && ['WebApplication', 'WebPage'].includes(row['@type'])
        && row.inLanguage === 'sw');
    } catch {
      return false;
    }
  });
  if (hasSwahiliApplicationSchema) return html;

  const schema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: app.name,
    description: metadata.description,
    url: canonical,
    inLanguage: 'sw',
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web',
    browserRequirements: 'Requires JavaScript',
    offers: {'@type': 'Offer', price: '0', priceCurrency: 'USD'},
    author: {'@type': 'Organization', name: 'AfroTools', url: 'https://afrotools.com/'},
    image: `https://afrotools.com/assets/img/tools/${app.id}.webp`
  });
  return html.replace('</head>', `  <script type="application/ld+json">${schema}</script>\n</head>`);
}

function buildFullParityPage(app) {
  const ownerFile = fullParitySources[app.id];
  let html = fs.readFileSync(path.join(ROOT, ownerFile), 'utf8');
  html = html.replace(/\s*<script\b[^>]*\ssrc=["']\/assets\/js\/analytics-bootstrap\.js(?:\?[^"']*)?["'][^>]*>\s*<\/script>/gi, '');
  const canonical = `https://afrotools.com${app.swahiliRoute}`;
  const english = `https://afrotools.com${app.englishRoute}`;
  const metadata = fullParityMetadata[app.id] || {
    description: `Tumia ${app.name} ndani ya kivinjari, kagua matokeo na upakue faili bila kutuma hati zako mtandaoni.`
  };
  // The three sensitive workspaces are sourced from private English app routes,
  // but their Swahili owners are public canonical product pages. Do not inherit
  // the private app route's noindex directive onto the localized canonical.
  html = html.replace(/\s*<meta\s+name=["']robots["'][^>]*\bnoindex\b[^>]*>/gi, '');
  html = html.replace(/<html([^>]*?)\blang=["'][^"']+["']([^>]*)>/i, '<html$1lang="sw"$2>');
  html = html.replace(/<meta\s+http-equiv=["']Content-Language["'][^>]*>/i, '<meta http-equiv="Content-Language" content="sw">');
  html = rewriteDocumentPdfRoutes(html);
  if (app.id === 'html-to-pdf') {
    html = html.replace('id="htmlPreview" class="preview-frame html-preview-frame" title="HTML Preview" sandbox=""', 'id="htmlPreview" class="preview-frame html-preview-frame" title="HTML Preview" sandbox="allow-same-origin"');
    html = html.replace(/id="renderContainer"(?!\s+aria-hidden=)/, 'id="renderContainer" aria-hidden="true"');
  }
  if (app.id === 'cv-builder') html = rewriteRelativeOwnerAssets(html, ownerFile);
  html = rewriteLocalDocumentAssets(html);
  html = hardenConsentBoundRequests(html, app);
  html = localizeStaticOwnerMarkup(html, app.id);
  Object.entries(legacyInlineRepairs[app.id] || {}).forEach(([source, localized]) => {
    html = html.split(source).join(localized);
  });
  html = upsertLink(html, 'canonical', null, canonical);
  html = upsertLink(html, 'alternate', 'en', english);
  html = upsertLink(html, 'alternate', 'sw', canonical);
  html = upsertLink(html, 'alternate', 'x-default', english);
  Object.entries(app.alternates || {}).forEach(([locale, route]) => {
    html = upsertLink(html, 'alternate', locale, `https://afrotools.com${route}`);
  });
  html = upsertMeta(html, 'property', 'og:locale', 'sw_TZ');
  html = upsertMeta(html, 'property', 'og:url', canonical);
  html = upsertMeta(html, 'property', 'og:image', `https://afrotools.com/assets/img/tools/${app.id}.webp`);
  html = upsertMeta(html, 'property', 'og:title', `${app.name} | AfroTools`);
  html = upsertMeta(html, 'property', 'og:description', metadata.description);
  html = upsertMeta(html, 'name', 'description', metadata.description);
  html = upsertMeta(html, 'name', 'twitter:title', `${app.name} | AfroTools`);
  html = upsertMeta(html, 'name', 'twitter:description', metadata.description);
  html = upsertMeta(html, 'name', 'twitter:image', `https://afrotools.com/assets/img/tools/${app.id}.webp`);
  html = upsertMeta(html, 'name', 'afrotools-content-id', contentId(app.id));
  html = upsertMeta(html, 'name', 'afrotools-source-owner', 'scripts/build-swahili-document-pdf-parity.js');
  html = html.replace(/"inLanguage"\s*:\s*"en(?:-[A-Z]{2})?"/g, '"inLanguage":"sw"');
  html = html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (match, source) => {
    try {
      const data = JSON.parse(source);
      const rows = Array.isArray(data) ? data : [data];
      if (rows.some((row) => row && row['@type'] === 'FAQPage')) return '';
      rows.forEach((row) => {
        if (!row) return;
        if (['WebApplication', 'WebPage'].includes(row['@type'])) {
          row.name = app.name;
          row.description = metadata.description;
          row.url = canonical;
          row.inLanguage = 'sw';
        }
        if (row['@type'] === 'BreadcrumbList' && Array.isArray(row.itemListElement)) {
          row.itemListElement.forEach((item, index) => {
            if (!item) return;
            if (index === 0) item.name = 'Nyumbani';
            else if (index === row.itemListElement.length - 1) item.name = app.name;
            else item.name = 'Zana';
          });
        }
      });
      return `<script type="application/ld+json">${JSON.stringify(Array.isArray(data) ? rows : rows[0])}</script>`;
    } catch {
      return match;
    }
  });
  html = ensureSwahiliApplicationSchema(html, app, metadata, canonical);
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(app.name)} | AfroTools</title>`);
  html = applyDownloadGateContract(html, app);
  return injectParityRuntime(html, app);
}

function addMissingHubLinks(html) {
  const links = [
    ['/sw/zana/nafasi-pdf/', 'Nafasi ya PDF', 'Fungua nafasi kamili ya kuhariri na kupanga PDF.'],
    ['/sw/zana/kumbukumbu-za-mkutano/', 'Kumbukumbu za Mkutano', 'Andaa maamuzi, hatua na tarehe za mkutano.'],
    ['/sw/zana/kizalishaji-risiti/', 'Kizalishaji Risiti', 'Tengeneza na pakua risiti ya biashara.'],
    ['/sw/zana/mpango-wa-biashara/', 'Mpango wa Biashara', 'Panga wateja, uendeshaji, hatari na fedha.'],
    ['/sw/zana/ankara-ya-freelancer/', 'Ankara ya Freelancer', 'Andaa ankara ya kazi huru katika miundo mingi.']
  ];
  const missing = links.filter(([href]) => !html.includes(`href="${href}"`));
  if (!missing.length) return html;
  const cards = missing.map(([href, name, description]) =>
    `<a class="doc-card" href="${href}"><span class="doc-card-kicker">hati na PDF</span><strong>${name}</strong><span>${description}</span></a>`
  ).join('');
  const section = `<section class="sec alt" data-sw-document-pdf-missing-links><div class="wrap"><div class="sec-head"><div class="kicker">Zana muhimu zaidi</div><h2>Unda, hariri na pakua hati</h2><p>Njia za moja kwa moja kwa zana zote zinazomilikiwa na kitovu hiki.</p></div><div class="grid">${cards}</div></div></section>`;
  return html.replace('</main>', `${section}\n</main>`);
}

const hubVisibleTextReplacements = new Map([
  ['Kurasa, format na data kutoka PDF', 'Kurasa, miundo na taarifa kutoka PDF'],
  ['Tengeneza faili inayosomeka vizuri kabla ya kuiwasilisha: namba za kurasa, vichwa, picha, OCR na mabadiliko ya format. Ubora hutegemea faili chanzo na kivinjari.', 'Tengeneza faili inayosomeka vizuri kabla ya kuiwasilisha: namba za kurasa, vichwa, picha, OCR na mabadiliko ya miundo. Ubora hutegemea faili chanzo na kivinjari.'],
  ['format / badilisha / hamisha', 'muundo / badilisha / hamisha'],
  ['Kubadilisha Format ya PDF', 'Kubadilisha Muundo wa PDF'],
  ['Tengeneza title, description, Open Graph, Twitter Cards na canonical URL ukiwa na mwonekano wa awali ya Google na social media.', 'Tengeneza kichwa, maelezo, taarifa za Open Graph na Twitter, pamoja na anwani msingi ukiwa na mwonekano wa awali wa Google na mitandao ya kijamii.'],
  ['Tengeneza kichwa, maelezo, taarifa za Open Graph na Twitter, pamoja na anwani msingi ukiwa na mwonekano wa awali wa Google na mitandao ya kijamii.', 'Tengeneza kichwa, maelezo na taarifa za kushiriki, pamoja na anwani msingi ukiwa na mwonekano wa awali wa Google na mitandao ya kijamii.'],
  ['Saraka ya API za Afrika kwa payments, mobile money, SMS, USSD, KYC, open banking na maps, pamoja na filters na tarehe za docs.', 'Saraka ya API za Afrika kwa malipo, pesa kwa simu, SMS, USSD, KYC, benki huria na ramani, pamoja na vichujio na tarehe za nyaraka.']
]);

function localizeHubOwnedText(html) {
  for (const [english, swahili] of hubVisibleTextReplacements) {
    html = html.split(english).join(swahili);
  }
  return html;
}

function normalizeHubPage() {
  const target = path.join(ROOT, 'sw/hati-na-pdf/index.html');
  let html = fs.readFileSync(target, 'utf8');
  html = localizeHubOwnedText(html);
  html = addMissingHubLinks(html);
  html = upsertMeta(html, 'property', 'og:locale', 'sw_TZ');
  html = upsertMeta(html, 'property', 'og:image', 'https://afrotools.com/assets/img/tools/document-pdf.webp');
  html = upsertMeta(html, 'name', 'twitter:image', 'https://afrotools.com/assets/img/tools/document-pdf.webp');
  html = upsertMeta(html, 'name', 'afrotools-content-id', contentId('hub'));
  html = upsertMeta(html, 'name', 'afrotools-source-owner', 'scripts/build-swahili-document-pdf-parity.js');
  html = html.replace(/\s*<link rel="stylesheet" href="\/assets\/css\/sw-document-pdf-a11y\.css">/g, '');
  html = html.replace('</head>', '  <link rel="stylesheet" href="/assets/css/sw-document-pdf-a11y.css">\n</head>');
  html = html.replace(/<body\b(?![^>]*\bid=["']sw-document-pdf-a11y-scope["'])/i, '<body id="sw-document-pdf-a11y-scope"');
  fs.writeFileSync(target, ensureSwAccessibilityRuntime(html), 'utf8');
}

function normalizeExistingPage(app) {
  const target = path.join(ROOT, app.swahiliFile);
  let html = fs.readFileSync(target, 'utf8');
  html = rewriteLocalDocumentAssets(html);
  const artwork = `https://afrotools.com/assets/img/tools/${app.id}.webp`;
  html = upsertMeta(html, 'name', 'viewport', 'width=device-width, initial-scale=1');
  html = upsertMeta(html, 'property', 'og:image', artwork);
  html = upsertMeta(html, 'property', 'og:locale', 'sw_TZ');
  html = upsertMeta(html, 'name', 'twitter:image', artwork);
  html = upsertMeta(html, 'name', 'afrotools-content-id', contentId(app.id));
  html = upsertMeta(html, 'name', 'afrotools-source-owner', 'scripts/build-swahili-document-pdf-parity.js');
  Object.entries(legacyIdRepairs[app.id] || {}).forEach(([translated, runtimeId]) => {
    for (const attribute of ['id', 'for', 'aria-controls']) {
      const pattern = new RegExp(`(${attribute}=["'])${translated}(["'])`, 'g');
      html = html.replace(pattern, `$1${runtimeId}$2`);
    }
    html = html.replace(new RegExp(`(href=["']#)${translated}(["'])`, 'g'), `$1${runtimeId}$2`);
  });
  Object.entries(legacyInlineRepairs[app.id] || {}).forEach(([translated, runtimeCode]) => {
    html = html.split(translated).join(runtimeCode);
  });
  html = applyDownloadGateContract(html, app);
  if (app.id === 'document-pdf') html = addMissingHubLinks(html);
  return injectParityRuntime(html, app);
}

function reciprocalFileForRoute(route) {
  return path.join(ROOT, route.replace(/^\/|\/$/g, ''), 'index.html');
}

function upsertSwahiliReciprocal(html, app) {
  const href = `https://afrotools.com${app.swahiliRoute}`;
  const replacement = `<link rel="alternate" hreflang="sw" href="${href}">`;
  const pattern = /<link\s+rel=["']alternate["']\s+hreflang=["']sw["'][^>]*>/i;
  if (pattern.test(html)) return html.replace(pattern, replacement);
  const xDefault = /(<link\s+rel=["']alternate["']\s+hreflang=["']x-default["'][^>]*>)/i;
  if (xDefault.test(html)) return html.replace(xDefault, `${replacement}\n  $1`);
  return html.replace('</head>', `  ${replacement}\n</head>`);
}

function writeReciprocalAlternates() {
  apps.filter((app) => app.generated).forEach((app) => {
    const targets = [
      path.join(ROOT, app.englishFile),
      ...Object.values(app.alternates || {}).map(reciprocalFileForRoute)
    ];
    targets.forEach((target) => {
      const html = fs.readFileSync(target, 'utf8');
      fs.writeFileSync(target, upsertSwahiliReciprocal(html, app), 'utf8');
    });
  });
}

function validateDirectory() {
  const directory = readJson(DIRECTORY_PATH);
  const rows = Array.isArray(directory) ? directory : (directory.tools || directory.rows || []);
  const expected = new Set(apps.map((app) => app.id));
  const categoryRows = rows.filter((row) =>
    row.language === 'en' &&
    row.category_key === 'document-pdf'
  ).map((row) => row.id);
  const missing = Array.from(expected).filter((id) => !categoryRows.includes(id));
  if (categoryRows.length !== 32 || missing.length) {
    throw new Error(`Document/PDF denominator drift: expected 32 with all 31 export ids; found ${categoryRows.length}, missing ${missing.join(', ') || 'none'}`);
  }
}

function validateOutputs() {
  const failures = [];
  selectedApps.forEach((app) => {
    const target = path.join(ROOT, app.swahiliFile);
    if (!fs.existsSync(target)) {
      failures.push(`${app.id}: missing ${app.swahiliFile}`);
      return;
    }
    const html = fs.readFileSync(target, 'utf8');
    if (!/<html[^>]+lang=["']sw["']/i.test(html)) failures.push(`${app.id}: lang is not sw`);
    if (/<iframe[^>]+src=["'](?:https:\/\/afrotools\.com)?\/tools\//i.test(html)) {
      failures.push(`${app.id}: English iframe transplant`);
    }
    if (!html.includes(`https://afrotools.com${app.swahiliRoute}`)) failures.push(`${app.id}: canonical route absent`);
    const contentIdMatches = Array.from(html.matchAll(/<meta\b[^>]*name=["']afrotools-content-id["'][^>]*content=["']([^"']+)["'][^>]*>/gi));
    const expectedContentId = contentId(app.id);
    if (contentIdMatches.length !== 1 || contentIdMatches[0][1] !== expectedContentId) {
      failures.push(`${app.id}: expected exactly one content id ${expectedContentId}; found ${contentIdMatches.map((match) => match[1]).join(', ') || 'none'}`);
    }
    const gateScripts = (html.match(/\/assets\/js\/lib\/pdf-download-gate\.js/g) || []).length;
    const gateElements = (html.match(/<email-gate-modal\b/g) || []).length;
    if (app.sensitive === true) {
      if (gateScripts || gateElements) failures.push(`${app.id}: sensitive route must remain guest-ungated`);
    } else if (gateScripts !== 1 || gateElements !== 1) {
      failures.push(`${app.id}: free-account gate contract expected exactly once; found scripts=${gateScripts}, elements=${gateElements}`);
    }
  });
  if (!APP_FILTER) {
    const hubHtml = fs.readFileSync(path.join(ROOT, 'sw/hati-na-pdf/index.html'), 'utf8');
    const hubContentIdMatches = Array.from(hubHtml.matchAll(/<meta\b[^>]*name=["']afrotools-content-id["'][^>]*content=["']([^"']+)["'][^>]*>/gi));
    const expectedHubContentId = contentId('hub');
    if (hubContentIdMatches.length !== 1 || hubContentIdMatches[0][1] !== expectedHubContentId) {
      failures.push(`document-pdf hub: expected exactly one content id ${expectedHubContentId}; found ${hubContentIdMatches.map((match) => match[1]).join(', ') || 'none'}`);
    }
  }
  if (!APP_FILTER) apps.filter((app) => app.generated).forEach((app) => {
    const targets = [
      path.join(ROOT, app.englishFile),
      ...Object.values(app.alternates || {}).map(reciprocalFileForRoute)
    ];
    targets.forEach((target) => {
      const html = fs.readFileSync(target, 'utf8');
      const expected = `hreflang="sw" href="https://afrotools.com${app.swahiliRoute}"`;
      if (!html.includes(expected)) failures.push(`${app.id}: reciprocal sw alternate absent in ${path.relative(ROOT, target)}`);
    });
  });
  if (failures.length) throw new Error(failures.join('\n'));
}

function main() {
  validateDirectory();
  if (WRITE) {
    if (CONTENT_IDS_ONLY) {
      selectedApps.forEach((app) => {
        const target = path.join(ROOT, app.swahiliFile);
        const html = fs.readFileSync(target, 'utf8');
        fs.writeFileSync(target, upsertMeta(html, 'name', 'afrotools-content-id', contentId(app.id)), 'utf8');
      });
      if (!APP_FILTER) {
        const hub = path.join(ROOT, 'sw/hati-na-pdf/index.html');
        const html = fs.readFileSync(hub, 'utf8');
        fs.writeFileSync(hub, upsertMeta(html, 'name', 'afrotools-content-id', contentId('hub')), 'utf8');
      }
    } else {
      selectedApps.forEach((app) => {
        const target = path.join(ROOT, app.swahiliFile);
        if (fullParitySources[app.id]) {
          fs.mkdirSync(path.dirname(target), { recursive: true });
          fs.writeFileSync(target, ensureSwAccessibilityRuntime(buildFullParityPage(app)), 'utf8');
        } else if (app.generated) {
          fs.mkdirSync(path.dirname(target), { recursive: true });
          fs.writeFileSync(target, ensureSwAccessibilityRuntime(page(app)), 'utf8');
        } else {
          fs.writeFileSync(target, ensureSwAccessibilityRuntime(normalizeExistingPage(app)), 'utf8');
        }
      });
      if (!APP_FILTER) {
        normalizeHubPage();
        writeReciprocalAlternates();
      }
    }
  }
  if (WRITE || CHECK) validateOutputs();
  console.log(`Swahili Document/PDF parity contract: ${selectedApps.length}/${selectedApps.length} selected rows reconciled.`);
}

if (require.main === module) main();
module.exports = Object.freeze({ apps, documentPdfRoutes });
