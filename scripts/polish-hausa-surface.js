#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const HA_ROOT = path.join(ROOT, 'ha');
const STYLE_TAG = '  <link rel="stylesheet" href="/ha/assets/ha-improvements.css?v=20260710">';
const SCRIPT_TAG = '  <script src="/ha/assets/ha-surface.js?v=20260710" defer></script>';

const textReplacements = [
  ['Study brief export', 'Fitar da takaitaccen shirin karatu'],
  ['Local-first export', 'Fitarwa a cikin burauza'],
  ['Source / freshness / methodology', 'Tushe, sabuntawa da hanyar aiki'],
  ['Sources &amp; verification - last reviewed 2026', 'Tushe da tabbatarwa - an duba a 2026'],
  ['Sources &amp; verification', 'Tushe da tabbatarwa'],
  ['Source &amp; verification', 'Tushe da tabbatarwa'],
  ['Last reviewed 2026', 'An duba a 2026'],
  ['Copy brief', 'Kwafi takaitawa'],
  ['Download .txt', 'Sauke TXT'],
  ['Download TXT', 'Sauke TXT'],
  ['Download checklist TXT', 'Sauke jerin dubawa na TXT'],
  ['Open the full English calculator', 'Bude cikakken kalkuletan Turanci'],
  ['Open the full English WHT tool', 'Bude cikakken kayan WHT na Turanci'],
  ['Open the full English receipt builder', 'Bude cikakken mai gina resit na Turanci'],
  ['Open the Document &amp; PDF hub', 'Bude cibiyar Takardu da PDF'],
  ['Methodology:', 'Hanyar aiki:'],
  ['Source and freshness:', 'Tushe da sabuntawa:'],
  ['Disclaimer and privacy:', 'Iyaka da sirri:'],
  ['Official verification:', 'Tabbacin hukuma:'],
  ['Limitations:', 'Iyaka:'],
  ['Source:', 'Tushe:'],
  ['Takaitawar tana zama a browser', 'Takaitawar tana zama a burauzarka'],
  ['Bayananka yana zama a browser.', 'Bayananka yana zama a burauzarka.'],
  ['Duba PDF kafin gyara da download', 'Duba PDF kafin gyara da saukewa'],
  ['sannan kayi download bayan ka tabbatar da sabon PDF', 'sannan ka sauke shi bayan ka tabbatar da sabon PDF'],
  ['copy, share, history da PDF export', 'kwafi, rabawa, tarihi da fitar da PDF'],
  ['Sources and freshness 2026:', 'Tushe da sabuntawa na 2026:'],
  ['forms, deadlines da matakan compliance da official revenue authority', "fom, ranakun karshe da matakan bin ka'ida daga hukumar haraji ta hukuma"],
  ['Disclaimer: not official, not tax advice and not legal advice. Wannan planning estimate ne kawai; verify with the relevant authority before acting.', 'Iyaka: ba shafin hukuma ba ne, ba shawarar haraji ko doka ba ce. Wannan kiyasin shiri ne kawai; ka tabbatar da hukumar da ta dace kafin daukar mataki.'],
  ['Official source note', 'Bayanin tushe na hukuma'],
  ['Export plan', 'Fitar da shiri'],
  ['No signup', 'Ba sai an yi rajista ba'],
  ['Bude cikakken kayan aiki Kwafi takaitawa Download TXT', 'Bude cikakken kayan aiki Kwafi takaitawa Sauke TXT'],
  ['request a payroll or pension widget', 'nemi widget na albashi ko fansho'],
  ['request a WHT widget or custom calculator', 'nemi widget na WHT ko kalkuleta na musamman'],
  ['request a branded receipt or invoice workflow', 'nemi tsarin resit ko takardar kudi mai tambari'],
  ['request a PDF workflow widget', 'nemi widget na aikin PDF'],
  ['Request a remittance comparison widget or custom calculator', 'Nemi widget na kwatanta tura kudi ko kalkuleta na musamman'],
  ['The page captures the student\'s subject, goal and weak areas, then links to the matching AfroJAMB practice or guide route for study planning.', 'Shafin yana tattara darasin dalibi, burinsa da wuraren rauni, sannan ya kai shi hanyar atisayen AfroJAMB ko jagorar da ta dace.'],
  ['This Hausa guide points to the AfroJAMB workflow at', 'Wannan jagorar Hausa tana kai ka zuwa hanyar AfroJAMB a'],
  ['It is not the official JAMB portal.', 'Ba portal din JAMB na hukuma ba ne.'],
  ['Confirm exam dates, syllabus, subject combinations, registration rules, admission cut-offs and centre instructions with JAMB, the school, or an approved adviser.', 'Ka tabbatar da ranar jarrabawa, manhaja, hadin darussa, kaidar rajista, iyakar admission da umarnin cibiya daga JAMB, makaranta ko mai ba da shawara da aka amince da shi.'],
  ['This is revision support only. It is not an official score, admission promise, malpractice tool, or replacement for a teacher.', 'Wannan taimakon bita ne kawai. Ba makin hukuma ba ne, ba alkawarin admission ba ne, ba kayan magudin jarrabawa ba ne, kuma ba ya maye gurbin malami.'],
  ['Confirm the current syllabus, exam dates, subject requirements and admission rules with JAMB or the school.', 'Ka tabbatar da sabuwar manhaja, ranar jarrabawa, bukatun darasi da kaidar admission daga JAMB ko makaranta.'],
  ['This is revision support, not an official question bank, exam score, admission promise or malpractice tool.', 'Wannan taimakon bita ne, ba ajiyar tambayoyin hukuma ba ne, ba makin jarrabawa ko alkawarin admission ba ne, kuma ba kayan magudi ba ne.'],
  ['The page captures the learner focus and routes to the matching AfroJAMB Chemistry practice workflow.', 'Shafin yana tattara abin da dalibi yake son karantawa sannan ya kai shi atisayen Kimiyya na AfroJAMB da ya dace.'],
  ['The page captures the learner focus and routes to the matching AfroJAMB Physics practice workflow.', 'Shafin yana tattara abin da dalibi yake son karantawa sannan ya kai shi atisayen Fisiks na AfroJAMB da ya dace.'],
  ['Capture chemistry topics, weak areas, past-question practice and timed revision plan. The brief is generated in this browser so you can copy or download it for study, school, sponsor or budget follow-up.', 'Rubuta batutuwan kimiyya, wuraren rauni, atisayen tsoffin tambayoyi da shirin bita mai lokaci. Ana gina takaitawar a burauzarka domin ka kwafa ko sauke ta.'],
  ['Capture physics topics, formulas, weak areas, diagrams and timed revision plan. The brief is generated in this browser so you can copy or download it for study, school, sponsor or budget follow-up.', 'Rubuta batutuwan fisiks, kaidoji, wuraren rauni, zane-zane da shirin bita mai lokaci. Ana gina takaitawar a burauzarka domin ka kwafa ko sauke ta.'],
  ['Capture NYSC allowance, state top-up, side income, expenses and monthly savings plan. The brief is generated in this browser so you can copy or download it for study, school, sponsor or budget follow-up.', 'Rubuta alawus na NYSC, karin kudin jiha, karin samun kudi, kashe kudi da shirin ajiyar wata. Ana gina takaitawar a burauzarka domin ka kwafa ko sauke ta.'],
  ['The page totals federal allowance, selected state top-up and side income, then subtracts monthly expenses to show surplus or gap.', 'Shafin yana tara alawus na tarayya, karin kudin jihar da aka zaba da sauran samun kudi, sannan ya cire kashe kudin wata domin nuna ragi ko gibi.'],
  ['Verify allowance, state top-up, posting rules, PPA rules and payment notices with NYSC, the state or your PPA.', 'Ka tabbatar da alawus, karin kudin jiha, dokar posting, kaidar PPA da sanarwar biyan kudi daga NYSC, jiha ko PPA dinka.'],
  ['This is a budget estimate, not an official NYSC payment notice, employment rule, financial advice or guarantee of state allowance.', 'Wannan kiyasin kasafi ne, ba sanarwar biyan kudi ta NYSC ba ce, ba dokar aiki ko shawarar kudi ba ce, kuma ba tabbacin karin kudin jiha ba ne.'],
  ['The page totals the entered student expenses, subtracts them from available income, and prepares a shareable budget brief.', 'Shafin yana tara kudaden dalibi da aka shigar, ya cire su daga kudin da ake da shi, sannan ya shirya takaitaccen kasafi da za a iya rabawa.'],
  ['The page captures study level, field and destination, then prepares a document and verification checklist for the source workflow.', 'Shafin yana tattara matakin karatu, fanni da kasar da ake nema, sannan ya shirya jerin takardu da matakan tabbatarwa.'],
  ['Based on the AfroTools source workflow at', 'An tsara shi bisa hanyar asalin AfroTools a'],
  ['Verify any health, lab, facility, insurance or price decision with a qualified provider.', 'Ka tabbatar da duk shawarar lafiya, gwaji, asibiti, inshora ko farashi daga kwararren maikacin lafiya.'],
  ['The calculator applies the visible employee and employer contribution rates to the pensionable pay you enter, then projects monthly deposits to retirement using your selected annual return assumption.', 'Kalkuletan yana amfani da adadin gudummawar maikaci da kamfani da ka gani a kan albashin fansho, sannan ya kiyasta ajiyar wata zuwa ritaya bisa ribar shekara da ka zaba.'],
  ['The default contribution examples follow common Nigerian CPS guidance associated with PenCom and employer payroll practice. Pension rules, RSA fees and PFA returns can change, so confirm final decisions with PenCom guidance, your PFA statement, HR/payroll, or a licensed adviser.', 'Misalan gudummawa suna bin jagorar CPS da aka saba amfani da ita a Najeriya. Dokar fansho, cajin RSA da ribar PFA na iya canzawa; ka tabbatar daga PenCom, bayanin PFA, sashen HR/payroll ko mai ba da shawara mai lasisi.'],
  ['This is an estimate only, not official pension advice or a guaranteed retirement payout. The salary and age values stay in this browser unless you copy or export them yourself.', 'Wannan kiyasi ne kawai, ba shawarar fansho ta hukuma ko tabbacin kudin ritaya ba ne. Albashi da shekarun da ka saka suna zama a burauzarka sai dai idan ka kwafa ko fitar da su.'],
  ['The tool chooses a WHT rate from the visible payment-type and recipient-type table, multiplies that rate by the gross payment, then shows the withholding amount and net amount payable.', 'Kayan aikin yana zabar adadin WHT daga teburin nauin biyan kudi da mai karba, ya ninka shi da jimillar biya, sannan ya nuna abin da za a rike da kudin da za a biya.'],
  ['The table is a planning reference for common Nigerian WHT categories. Rates, exemptions, treaty treatment and filing procedures can change, so verify with FIRS guidance, a tax adviser, or the contract before withholding or remitting.', 'Teburin jagorar shiri ne ga nauikan WHT da aka saba amfani da su a Najeriya. Adadi, kebe-kebe, yarjejeniya da hanyar filing na iya canzawa; ka tabbatar daga FIRS, mai ba da shawarar haraji ko kwangila.'],
  ['This is not official tax filing advice and does not submit anything to FIRS. Amounts stay in this browser unless you copy them.', 'Wannan ba shawarar filing ta hukuma ba ce kuma ba ya tura komai zuwa FIRS. Adadin yana zama a burauzarka sai dai idan ka kwafa shi.'],
  ['The receipt builder calculates line totals from quantity, unit price, discount, tax, service charge, shipping and payment status, then lets you export PDF, print, TXT, CSV, JSON or copy a summary.', 'Mai gina resit yana lissafa jimillar layi daga yawa, farashin guda, rangwame, haraji, caji, jigila da matsayin biya, sannan yana ba ka damar fitar da PDF, bugawa, TXT, CSV, JSON ko kwafar takaitawa.'],
  ['Country presets are practical receipt templates, not official tax forms. VAT, TIN, receipt retention and e-invoicing rules can change, so confirm requirements with the relevant tax authority, accountant or finance team before using a receipt for compliance.', 'Tsarin kasa samfurin resit ne na aiki, ba fom din haraji na hukuma ba ne. Dokar VAT, TIN, adana resit da e-invoicing na iya canzawa; ka tabbatar daga hukumar haraji, akawu ko sashen kudi.'],
  ['Receipt details, logos and saved drafts remain local to this browser unless you export, print, import or share them. AfroTools does not submit receipts to a tax authority.', 'Bayanan resit, tambari da daftarin da aka ajiye suna zama a burauzarka sai idan ka fitar, buga, shigo da su ko raba su. AfroTools ba ya tura resit zuwa hukumar haraji.'],
  ['The planner reads file count, total size, selected PDF task and your notes, then recommends the closest AfroTools route for merge/split, compression, page numbers or the full PDF workspace.', 'Mai shirin yana karanta yawan fayil, jimillar girma, aikin PDF da ka zaba da bayaninka, sannan ya nuna hanyar AfroTools mafi kusa don hadawa/rabawa, matsawa, lambar shafi ko cikakken wurin aikin PDF.'],
  ['Route recommendations are based on the current AfroTools PDF workflow map and Document &amp; PDF category contract. Some advanced PDF tools may still open the English source route until the Hausa route is complete.', 'Shawarwarin hanya suna bin taswirar aikin PDF ta AfroTools. Wasu manyan kayan PDF na iya bude shafin Turanci har sai cikakkiyar fuskar Hausa ta shirya.'],
  ['This page does not upload PDF files. It only uses browser file metadata to prepare a workflow summary; source documents remain on your device unless the destination tool clearly says otherwise.', 'Wannan shafin ba ya loda PDF. Yana amfani da sunan fayil da girmansa kawai domin shirya takaitaccen aiki; takardunka suna zama a naurarka sai idan shafin da ka bude ya bayyana wani abu dabam.'],
  ['The estimator subtracts each provider fee from the send amount, multiplies the remaining amount by the rate you enter, then highlights which option gives the recipient more before speed, ID and payout constraints.', 'Kalkuletan yana cire cajin kowace hanya daga kudin da za a aika, ya ninka ragowar da farashin canjin da ka shigar, sannan ya nuna hanyar da za ta bai wa mai karba kudi mafi yawa.'],
  ['AfroTools does not fetch live remittance quotes on this page. Confirm fees, FX rates, limits, ID requirements and payout availability with the provider, bank, central bank guidance or regulator before sending money.', 'AfroTools ba ya karbo farashin tura kudi kai tsaye a wannan shafin. Ka tabbatar da caji, farashin canji, iyaka, bukatar ID da hanyar karba daga kamfani, banki, babban banki ko hukuma.'],
  ['This is an estimate only, not a guaranteed quote or payment instruction. The values stay in this browser unless you copy the summary.', 'Wannan kiyasi ne kawai, ba tabbacin farashi ko umarnin biya ba ne. Adadin yana zama a burauzarka sai dai idan ka kwafa takaitawar.'],
  ['literature texts, themes, devices and revision plan', 'rubutun adabi, jigogi, salon rubutu da shirin bita'],
  ['CRK topics, passages, themes and revision plan', 'batutuwan CRK, sassan littafi, jigogi da shirin bita'],
  ['government topics, civic concepts and past-question practice', 'batutuwan gwamnati, ilimin dan kasa da atisayen tsoffin tambayoyi'],
  ['commerce topics, business terms and timed practice', 'batutuwan kasuwanci, kalmomin kasuwanci da atisayen lokaci'],
  ['history topics, dates, causes and revision plan', 'batutuwan tarihi, ranaku, dalilai da shirin bita'],
  ['economics topics, definitions, diagrams and timed practice', 'batutuwan tattalin arziki, ma\'anoni, zane-zane da atisayen lokaci'],
  ['math topics, weak areas, timed practice and revision plan', 'batutuwan lissafi, wuraren rauni, atisayen lokaci da shirin bita'],
  ['biology topics, past questions and revision plan', 'batutuwan nazarin halittu, tsoffin tambayoyi da shirin bita'],
  ['practice mode, time, keyboard shortcuts and review plan', 'yanayin atisaye, lokaci, gajerun hanyoyin madannai da shirin dubawa'],
  ['study prompt, subject, weak topic and teacher follow-up', 'tambayar karatu, darasi, batu mai rauni da bin diddigin malami']
  ,['Download CV brief TXT', 'Sauke takaitaccen CV na TXT']
  ,['CV brief\\n\\nSuna:', 'Takaitaccen CV\\n\\nSuna:']
  ,['preview/rabawa', 'duban farko da rabawa']
  ,['preview ke amfani', 'duban farko yana amfani']
  ,['Disclaimer: not official, not tax advice and not legal advice.', 'Iyaka: ba shafin hukuma ba ne, ba shawarar haraji ko doka ba ce.']
  ,['not official, not tax advice and not legal advice.', 'ba shafin hukuma ba ne, ba shawarar haraji ko doka ba ce.']
  ,['planning estimate ne kawai; verify with the relevant authority before acting.', 'kiyasin shiri ne kawai; ka tabbatar da hukumar da ta dace kafin daukar mataki.']
  ,['<strong>Disclaimer:</strong>', '<strong>Iyaka:</strong>']
  ,['ba filing na gwamnati ba', "ba shigar da bayanai ga gwamnati ba"]
  ,['<a href="/custom-calculators/">custom calculator</a>', '<a href="/custom-calculators/">kalkuleta na musamman</a>']
  ,['<a href="/api/">API pilot</a>', '<a href="/api/">gwajin API</a>']
  ,['Capture student income, fees, rent, food, transport, books and remaining budget. The brief is generated in this browser so you can copy or download it for study, school, sponsor or budget follow-up.', 'Rubuta kudin shiga na dalibi, kudin makaranta, haya, abinci, sufuri, littattafai da ragowar kasafi. Ana gina takaitawar a burauzarka domin ka kwafa ko sauke ta.']
  ,['Verify tuition, hostel, transport, scholarship, bursary and deadline details with the school, sponsor or student affairs office.', "Ka tabbatar da kudin makaranta, masauki, sufuri, tallafin karatu da ranar karshe daga makaranta, mai daukar nauyi ko ofishin kula da dalibai."]
  ,['This is a student planning estimate, not an official fee invoice, bursary approval, loan advice or payment instruction.', 'Wannan kiyasin shirin dalibi ne, ba takardar kudin hukuma ba ce, ba amincewar tallafi ba ce, ba shawarar bashi ko umarnin biya ba ne.']
  ,['Capture scholarship level, field, country, documents, deadline and verification checklist. The brief is generated in this browser so you can copy or download it for study, school, sponsor or budget follow-up.', 'Rubuta matakin tallafin karatu, fanni, kasa, takardu, ranar karshe da jerin tabbatarwa. Ana gina takaitawar a burauzarka domin ka kwafa ko sauke ta.']
  ,['Verify scholarship status, eligibility, deadlines, fees, documents and submission channels with the official funder or school.', 'Ka tabbatar da matsayin tallafin, cancanta, ranar karshe, caji, takardu da hanyar mikawa daga mai bayar da tallafin ko makaranta ta hukuma.']
  ,['This is application preparation support, not a scholarship award, official listing, eligibility guarantee or payment request.', 'Wannan taimakon shirya neman tallafi ne, ba bayar da tallafi ba ne, ba jerin hukuma ba ne, ba tabbacin cancanta ko neman biyan kudi ba ne.']
  ,['Tambayi AfroTools don custom calculator', 'Tambayi AfroTools don kalkuleta na musamman']
  ,['Shirya PDF kafin saka lambobin shafi da download', 'Shirya PDF kafin saka lambobin shafi da saukewa']
  ,['kafin download', 'kafin saukewa']
  ,['aria-label="Currency"', 'aria-label="Nauin kudi"']
  ,['tsarin payroll na kamfani', 'tsarin biyan albashin kamfani']
  ,['account number, national ID', 'lambar asusu, lambar shaidar kasa']
  ,['<a href="/tools/payslip-generator/">payslip generator</a>', '<a href="/tools/payslip-generator/">mai gina takardar albashi na Turanci</a>']
  ,['widget na payroll', 'widget na biyan albashi']
  ,['country code', 'lambar kasar waya']
  ,['Bude cikakken PDF workspace', 'Bude cikakken wurin aikin PDF na Turanci']
  ,['<small>Cikakken workspace</small>', '<small>Cikakken wurin aiki</small>']
  ,['kariya, watermark da sauran', 'kariya, alamar ruwa da sauran']
  ,['Cikakken workspace', 'Cikakken wurin aiki']
  ,['cikakken workspace', 'cikakken wurin aiki']
];

const fileSpecificReplacements = {
  'ha/ilimi/index.html': [
    ['<div id="navbar-container"></div>', '<afro-navbar active="education"></afro-navbar>'],
    ['<div id="footer-container"></div>', '<afro-footer></afro-footer>']
  ],
  'ha/kayan-aiki/canza-pdf/index.html': [
    ['/tools/pdf-compress/', '/ha/kayan-aiki/matsa-pdf/'],
    ['/tools/pdf-merge-split/', '/ha/kayan-aiki/hada-da-raba-pdf/']
  ],
  'ha/kayan-aiki/wurin-aikin-pdf/index.html': [
    ['/tools/pdf-page-numbers/', '/ha/kayan-aiki/lambar-shafi-pdf/'],
    ['/document-pdf/', '/ha/takardu-da-pdf/']
  ],
  'ha/noma/index.html': [
    ['/tools/planting-calendar/', '/ha/noma/kalandar-shuka/'],
    ['/tools/drought-risk/', '/ha/noma/hadarin-fari/']
  ],
  'ha/kayan-aiki/rajistar-layin-waya-nin/index.html': [
    ['<title>Rajistar Layin Waya da NIN | AfroTools</title>', '<title>Shirin NIN da Kwatanta Kunshin Waya | AfroTools</title>'],
    ['<h1>Rajistar layin waya da NIN</h1>', '<h1>Shirin NIN da kwatanta kunshin waya</h1>']
  ],
  'ha/kayan-aiki/gina-cv/index.html': [
    ['Fayil na CV ko bayanin aiki (na cikin burauza)', 'Fayil na CV (ana nuna suna da girma kawai; ba a loda ba)'],
    ['ND Business Administration, 2024', 'ND a Gudanar da Kasuwanci, 2024']
  ]
};

const mainlessWrapperStarts = {
  'ha/kayan-aiki/hada-da-raba-pdf/index.html': '<div class="tool-hero">',
  'ha/kayan-aiki/lambobin-ussd/index.html': '<div class="tool-hero">',
  'ha/kayan-aiki/matsa-pdf/index.html': '<div class="tool-hero">',
  'ha/kayan-aiki/naira-zuwa-kalmomi/index.html': '<div class="container">',
  'ha/kayan-aiki/whatsapp-link/index.html': '<div class="container">'
};

const duplicatedCardPages = new Set([
  'ha/kayan-aiki/cgt-najeriya/index.html',
  'ha/kayan-aiki/kalkuletan-paystack/index.html',
  'ha/kayan-aiki/tazarar-riba/index.html',
  'ha/kayan-aiki/dawo-da-jari/index.html',
  'ha/kayan-aiki/karin-farashi/index.html',
  'ha/kayan-aiki/takardar-albashi/index.html',
  'ha/kayan-aiki/kudin-maikaci/index.html',
  'ha/kayan-aiki/gwajin-ussd/index.html',
  'ha/kayan-aiki/waya-ko-banki/index.html',
  'ha/kayan-aiki/kwatanta-aika-kudi/index.html',
  'ha/kayan-aiki/gyara-pdf/index.html',
  'ha/kayan-aiki/lambar-shafi-pdf/index.html',
  'ha/noma/kalandar-shuka/index.html',
  'ha/noma/hadarin-fari/index.html'
]);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

function rel(file) {
  return path.relative(ROOT, file).replace(/\\/g, '/');
}

function applyReplacements(html, replacements) {
  for (const [from, to] of replacements) html = html.split(from).join(to);
  return html;
}

function removeDuplicatedCardCopy(html) {
  return html.replace(/<article class="card">[\s\S]*?<\/article>/g, (block) => {
    const heading = block.match(/<h2>([\s\S]*?)<\/h2>/);
    const paragraph = block.match(/<p>([\s\S]*?)<\/p>/);
    if (!heading || !paragraph) return block;
    const h = heading[1].replace(/<[^>]+>/g, '').trim().replace(/\.$/, '');
    const p = paragraph[1].replace(/<[^>]+>/g, '').trim().replace(/\.$/, '');
    return h === p ? block.replace(paragraph[0], '') : block;
  });
}

let updated = 0;
const changedFiles = [];

for (const file of walk(HA_ROOT)) {
  const relative = rel(file);
  let html = fs.readFileSync(file, 'utf8');
  const original = html;

  html = html.replace(/(?:<main id="main">\s*){2,}/g, '<main id="main">\n');
  html = html.replace(/(?:<\/main>\s*){2,}(?=<afro-footer>)/g, '</main>\n');

  if (mainlessWrapperStarts[relative] && !/<main\b/i.test(html)) {
    const start = mainlessWrapperStarts[relative];
    html = html.replace(start, `<main id="main">\n${start}`);
    html = html.replace('\n<afro-footer></afro-footer>', '\n</main>\n<afro-footer></afro-footer>');
  }

  if (!html.includes('/ha/assets/ha-improvements.css')) {
    html = html.replace('</head>', `${STYLE_TAG}\n</head>`);
  }
  if (!html.includes('/ha/assets/ha-surface.js')) {
    const bodyClose = html.lastIndexOf('</body>');
    if (bodyClose !== -1) {
      html = `${html.slice(0, bodyClose)}${SCRIPT_TAG}\n${html.slice(bodyClose)}`;
    }
  }

  if (fileSpecificReplacements[relative]) {
    html = applyReplacements(html, fileSpecificReplacements[relative]);
  }

  if (/<main\b(?![^>]*\bid=)/i.test(html)) {
    html = html.replace(/<main\b/i, '<main id="main"');
  }
  if (!/class="[^"]*skip-link|class="[^"]*jb-skip/i.test(html) && /<main\b[^>]*\bid="main"/i.test(html)) {
    html = html.replace(/<body([^>]*)>/i, '<body$1>\n<a class="skip-link" href="#main">Tsallake zuwa babban abun ciki</a>');
  }

  html = applyReplacements(html, textReplacements);
  if (duplicatedCardPages.has(relative)) html = removeDuplicatedCardCopy(html);

  if (html !== original) {
    fs.writeFileSync(file, html, 'utf8');
    updated += 1;
    changedFiles.push(relative);
  }
}

console.log(JSON.stringify({ updated, changedFiles }, null, 2));
