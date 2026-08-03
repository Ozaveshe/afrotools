#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const manifest = require('../data/localization/sw-mining-parity-manifest.json');
const { writeFileSyncWithRetry } = require('./lib/safe-write');
const { localizedGeneratorEquivalent } = require('./lib/localized-generator-equivalence');

const ROOT = path.resolve(__dirname, '..');
const CHECK = process.argv.includes('--check');

function input(name, label, value, attrs = '', help = '') {
  return `<div class="sw-mining-field"><label for="${name}">${label}</label><input id="${name}" name="${name}" value="${value}" ${attrs}>${help ? `<p id="${name}-help" class="sw-mining-help">${help}</p>` : ''}</div>`;
}

function select(name, label, options) {
  return `<div class="sw-mining-field"><label for="${name}">${label}</label><select id="${name}" name="${name}">${options.map(([value, text]) => `<option value="${value}">${text}</option>`).join('')}</select></div>`;
}

const specs = {
  'diamond-valuation': {
    category: 'FinanceApplication',
    formula: 'Thamani iliyorekebishwa = karati × bei rejea kwa karati × kipengele cha kata × rangi × usafi. Thamani za jumla, bima na mauzo binafsi hutumia asilimia zako.',
    fields: [
      input('carat', 'Uzito (karati)', '1', 'type="number" min="0" step="any" inputmode="decimal"'),
      input('base', 'Bei rejea kwa karati (USD)', '12000', 'type="number" min="0" step="any" inputmode="decimal"'),
      select('cut', 'Ubora wa kata', [['1','Bora sana'],['0.95','Mzuri sana'],['0.88','Mzuri'],['0.78','Wastani'],['0.68','Dhaifu']]),
      select('color', 'Rangi', [['1','D (isiyo na rangi)'],['0.97','E'],['0.94','F'],['0.90','G'],['0.85','H'],['0.78','I'],['0.70','J'],['0.62','K au chini']]),
      select('clarity', 'Usafi', [['1','FL / IF'],['0.95','VVS1'],['0.92','VVS2'],['0.88','VS1'],['0.84','VS2'],['0.75','SI1'],['0.66','SI2'],['0.50','I1 au chini']]),
      input('pWhole', 'Jumla (% ya thamani)', '65', 'type="number" min="0" max="200" step="any"'),
      input('pIns', 'Bima (% ya thamani)', '120', 'type="number" min="0" max="300" step="any"'),
      input('pResale', 'Mauzo binafsi (% ya thamani)', '45', 'type="number" min="0" max="200" step="any"')
    ],
    outputs: [['retail','Thamani iliyorekebishwa'],['wholesale','Thamani ya jumla'],['insurance','Thamani ya bima'],['resale','Mauzo binafsi']],
    notes: ['Bei rejea lazima itoke kwa chanzo chako kilicho na tarehe; AfroTools haitoi bei hai ya almasi.', 'Hii si cheti cha gemolojia wala tathmini ya mnunuzi. Kata, fluorescence, cheti na ukwasi vinaweza kubadilisha bei.']
  },
  'oil-well-production': {
    category: 'BusinessApplication',
    formula: 'q = 0.00708 × k × h × (Pe − Pwf) ÷ [μ × B × (ln(re ÷ rw) + skin)]. Uzalishaji wa mwaka hutumia uptime; mapato halisi huondoa mrahaba na gharama kwa pipa.',
    fields: [
      input('k','Upenyezaji k (mD)','50','type="number" min="0" step="any"'), input('h','Unene halisi h (ft)','30','type="number" min="0" step="any"'),
      input('pe','Shinikizo la hifadhi Pe (psi)','3000','type="number" min="0" step="any"'), input('pwf','Shinikizo la mtiririko Pwf (psi)','2000','type="number" min="0" step="any"'),
      input('mu','Mnato wa mafuta μ (cp)','1.2','type="number" min="0" step="any"'), input('bo','Kipengele cha ujazo B (rb/stb)','1.2','type="number" min="0" step="any"'),
      input('re','Radius ya mifereji re (ft)','1000','type="number" min="0" step="any"'), input('rw','Radius ya kisima rw (ft)','0.35','type="number" min="0" step="any"'),
      input('skin','Kipengele cha skin s','0','type="number" step="any"'), input('uptime','Muda wa kufanya kazi (%)','90','type="number" min="0" max="100" step="any"'),
      input('price','Bei ya mafuta (USD/bbl)','75','type="number" min="0" step="any"'), input('opex','Gharama ya uendeshaji (USD/bbl)','15','type="number" min="0" step="any"'),
      input('roy','Mrahaba (%)','10','type="number" min="0" max="100" step="any"')
    ],
    outputs: [['q','Mtiririko wa kila siku'],['annual','Uzalishaji wa mwaka'],['net','Mapato halisi ya kupanga']],
    notes: ['Mfano wa Darcy wa hali thabiti ni uchunguzi wa awali, si uigaji wa hifadhi au utabiri wa uwanja.', 'Bei ni hali uliyoingiza kutoka chanzo chako; si bei hai ya mafuta.']
  },
  'oil-gas-revenue': {
    category: 'BusinessApplication',
    formula: 'Mrahaba huondolewa kwenye mapato ghafi. Cost oil ni kiwango cha chini kati ya gharama zinazorejeshwa na kikomo cha mkataba. Profit oil iliyobaki hugawanywa, kisha kodi hutumika kwa hisa ya faida ya mkandarasi.',
    fields: [
      input('vol','Kiasi cha uzalishaji (bbl au Mcf)','1000000','type="number" min="0" step="any"'), input('price','Bei ya kitengo (USD)','75','type="number" min="0" step="any"'),
      input('gross','Au mapato ghafi ya moja kwa moja (USD)','','type="number" min="0" step="any"','Acha wazi ili kutumia kiasi × bei.'),
      input('roy','Mrahaba (%)','10','type="number" min="0" max="100" step="any"'), input('costs','Gharama zinazorejeshwa (USD)','10000000','type="number" min="0" step="any"'),
      input('ceiling','Kikomo cha urejeshaji (% baada ya mrahaba)','60','type="number" min="0" max="100" step="any"'), input('conshare','Hisa ya mkandarasi ya profit oil (%)','40','type="number" min="0" max="100" step="any"'),
      input('tax','Kodi ya faida ya mkandarasi (%)','30','type="number" min="0" max="100" step="any"')
    ],
    outputs: [['contractorNet','Mapato halisi ya mkandarasi'],['governmentTake','Jumla ya serikali'],['governmentPct','Hisa ya serikali']],
    notes: ['Masharti yote ni ya mtumiaji; PSC hutofautiana kwa nchi, block na mkataba.', 'Mfano huu haujumuishi ring-fencing, uplift, tranches, carry au sheria mahususi.']
  },
  'mining-license-fee': {
    category: 'BusinessApplication', dataScript: '/data/mining/mining-fees.js?v=a459b2f7',
    formula: 'Jumla = ada za mwanzo + ada ya mwaka iliyokokotolewa × miaka. Ada ya eneo huzidishwa kwa km², hekta au kitengo cha cadastral, kisha kiwango cha chini hutumika ikiwa kimeainishwa.',
    fields: [select('country','Nchi',[]), select('licence','Aina ya leseni',[]), `<div class="sw-mining-field" id="area-wrap"><label for="area">Eneo (<span id="area-unit"></span>)</label><input id="area" name="area" type="number" min="0" step="any" value="2"></div>`, input('years','Muda wa kushikilia (miaka)','5','type="number" min="1" step="1"'), input('oneOff','Ada za maombi / mwanzo','','type="number" min="0" step="any"'), input('annual','Ada ya mwaka','','type="number" min="0" step="any"')],
    outputs: [['oneOffTotal','Ada za mwanzo'],['annualComputed','Ada ya mwaka iliyokokotolewa'],['total','Jumla ya kupanga']],
    notes: ['Data ya nchi ina chanzo, tarehe ya ukaguzi na kiwango cha kujiamini; ithibitishe tena kwa cadastre au wizara.', 'Ada inayokosekana hubaki wazi na lazima uingize thamani iliyothibitishwa; haichukuliwi kuwa sifuri.']
  },
  'mining-royalty': {
    category: 'FinanceApplication', dataScript: '/data/mining/mining-royalties.js?v=cc51de93',
    formula: 'Mrahaba = thamani ghafi × kiwango. Mapato halisi = thamani ghafi − mrahaba − tozo nyingine iliyotenganishwa. Mfumo au bandi inayobadilika huhitaji kiwango halisi ulichohakiki.',
    fields: [select('country','Mamlaka',[]), select('mineral','Madini',[]), input('gross','Thamani ghafi ya soko','1000000','type="number" min="0.01" step="any"'), input('rate','Kiwango cha mrahaba (%)','','type="number" min="0" max="100" step="any"','', 'rate-note')],
    outputs: [['royalty','Mrahaba unaodaiwa'],['rate','Kiwango kilichotumika'],['net','Mapato halisi ya kupanga']],
    notes: ['Viwango vilivyojumuishwa vina tarehe ya ukaguzi na kiungo cha mamlaka, lakini bado ni data ya kupanga inayohitaji uthibitisho wa sasa.', 'Kiwango kinachotegemea bei, faida au bandi hakikadiriwi kuwa sifuri; ingiza kiwango halisi kilichotokana na chanzo rasmi.']
  },
  'artisanal-mining-income': {
    category: 'BusinessApplication',
    formula: 'Mapato ya mnunuzi mwenye leseni = kiasi × bei yake. Pengo lisilo rasmi = mapato yenye leseni − mapato kwa asilimia isiyo rasmi. Mapato halisi kwa mchimbaji = (mapato yenye leseni − gharama) ÷ wachimbaji.',
    fields: [select('mineral','Madini na kitengo',[['gram|dhahabu','Dhahabu — gramu'],['carat|almasi','Almasi — karati'],['kg|cassiterite','Cassiterite — kg'],['kg|coltan','Coltan — kg'],['kg|shaba','Shaba — kg']]), input('qty','Uzalishaji wa mwezi (kitengo ulichochagua)','60','type="number" min="0" step="any"'), input('formal','Bei ya mnunuzi mwenye leseni kwa kitengo','55','type="number" min="0" step="any"'), input('informalPct','Bei isiyo rasmi (% ya bei yenye leseni)','70','type="number" min="0" max="100" step="any"'), input('costs','Gharama za mwezi','300','type="number" min="0" step="any"'), input('team','Wachimbaji wanaogawana mapato','3','type="number" min="1" step="1"')],
    outputs: [['netPerMiner','Halisi kwa mchimbaji kwa mwezi'],['annualPerMiner','Halisi kwa mchimbaji kwa mwaka'],['gap','Pengo la njia isiyo rasmi']],
    notes: ['Bei na kiasi ni maingizo yako; tumia nukuu yenye tarehe ya mnunuzi mwenye leseni. AfroTools haitoi bei hai ya madini.', 'Hesabu si ahadi ya mapato na haihalalishi uchimbaji usio rasmi; thibitisha leseni, usalama, mazingira na kodi.']
  }
};

const names = { diamond:'Almasi', gold:'Dhahabu', bauxite:'Bauxite', manganese:'Manganese', gemstone:'Vito', copper:'Shaba', coal:'Makaa ya mawe', platinum:'Platinamu (PGM)', cobalt:'Kobalti', coltan:'Coltan / tantalum', iron:'Madini ya chuma', lithium:'Lithium', uranium:'Uranium', tin:'Bati', limestone:'Chokaa', leadZinc:'Risasi / zinki', titanium:'Madini ya titani' };

function jsonLd(value) { return JSON.stringify(value).replace(/</g, '\\u003c'); }
function esc(value) { return String(value).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function render(app) {
  const spec = specs[app.id];
  const canonical = `https://afrotools.com${app.swRoute}`;
  const en = `https://afrotools.com${app.englishRoute}`;
  const fr = `https://afrotools.com${app.frenchRoute}`;
  const related = manifest.apps.filter((item) => item.id !== app.id).map((item) => `<li><a href="${item.swRoute}">${esc(item.shortTitle)}</a></li>`).join('');
  const faq = [
    ['Je, hiki ni kiwango au bei rasmi?', 'Hapana. Ni makadirio ya kupanga. Bei, masharti na viwango vinavyobadilika lazima vitokane na chanzo chako chenye tarehe au rekodi ya mamlaka iliyoonyeshwa, kisha uthibitishwe tena.'],
    ['Data yangu hutumwa wapi?', 'Haitumwi. Hesabu, import na export hufanyika ndani ya kivinjari. Kiungo cha AI hufunguka tu baada ya wewe kukubali, na hakiambatanishi maingizo yako.'],
    ['Nifanye nini kabla ya uamuzi?', spec.notes.join(' ')]
  ];
  return `<!doctype html>
<html lang="sw">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(app.title)} | AfroTools</title><meta name="description" content="${esc(app.description)}">
<link rel="canonical" href="${canonical}"><link rel="alternate" hreflang="sw" href="${canonical}"><link rel="alternate" hreflang="en" href="${en}"><link rel="alternate" hreflang="fr" href="${fr}"><link rel="alternate" hreflang="x-default" href="${en}">
<meta property="og:title" content="${esc(app.title)} | AfroTools"><meta property="og:description" content="${esc(app.description)}"><meta property="og:image" content="https://afrotools.com/assets/img/tools/${app.imageId}.webp"><meta property="og:url" content="${canonical}"><meta property="og:type" content="website"><meta property="og:locale" content="sw_KE"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="https://afrotools.com/assets/img/tools/${app.imageId}.webp">
<link rel="stylesheet" href="/assets/css/tokens.min.css?v=f987f2a8"><link rel="stylesheet" href="/assets/css/global.min.css?v=0ff6e9dc"><link rel="stylesheet" href="/assets/css/design-system.min.css?v=11fcf8e5"><link rel="stylesheet" href="/assets/css/sw-mining-parity.css">
<script src="/assets/js/components/navbar.min.js?v=65f906d7" defer></script><script src="/assets/js/components/footer.min.js?v=fb81e3cd" defer></script>
<script type="application/ld+json">${jsonLd({'@context':'https://schema.org','@type':'WebApplication',name:app.title,description:app.description,url:canonical,inLanguage:'sw',applicationCategory:spec.category,operatingSystem:'Web',isAccessibleForFree:true,offers:{'@type':'Offer',price:'0',priceCurrency:'USD'},image:`https://afrotools.com/assets/img/tools/${app.imageId}.webp`})}</script>
<script type="application/ld+json">${jsonLd({'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'AfroTools Kiswahili',item:'https://afrotools.com/sw/'},{'@type':'ListItem',position:2,name:'Madini',item:'https://afrotools.com/sw/?category=mining'},{'@type':'ListItem',position:3,name:app.shortTitle,item:canonical}]})}</script>
<script type="application/ld+json">${jsonLd({'@context':'https://schema.org','@type':'FAQPage',inLanguage:'sw',mainEntity:faq.map(([q,a])=>({'@type':'Question',name:q,acceptedAnswer:{'@type':'Answer',text:a}}))})}</script>
</head>
<body class="sw-mining-page" data-mining-tool="${app.id}"><afro-navbar active="mining"></afro-navbar>
<main class="sw-mining-shell"><header class="sw-mining-hero"><div><p class="sw-mining-eyebrow">Madini · Hesabu ya ndani</p><h1>${esc(app.title)}</h1><p>${esc(app.description)}</p></div><img class="sw-mining-art" src="/assets/img/tools/${app.imageId}.webp" alt="" width="640" height="640"></header>
<div class="sw-mining-layout"><div><form id="mining-form" class="sw-mining-card" novalidate><h2>Maingizo ya ${esc(app.shortTitle.toLowerCase())}</h2><p>Ingiza thamani zilizorekodiwa. Sehemu muhimu iliyokosekana haibadilishwi kuwa sifuri.</p><div class="sw-mining-grid">${spec.fields.join('')}</div>
<fieldset class="sw-mining-evidence"><legend>Chanzo, tarehe na uhakika</legend><div class="sw-mining-grid">${input('sourceName','Jina la chanzo au hati','','type="text" autocomplete="off" required')}${input('sourceDate','Tarehe ya kuthibitisha','','type="date" required')}${select('sourceConfidence','Kiwango cha kujiamini',[['','Chagua kiwango'],['juu','Juu — chanzo msingi cha karibuni'],['wastani','Wastani — chanzo cha pili au dhana'],['chini','Chini — lazima kuthibitishwa']])}</div><p class="sw-mining-help">Chanzo cha zaidi ya siku 90 kitaonyeshwa kuwa kimepitwa na wakati; hesabu hubaki ya kupanga tu.</p></fieldset>
<div class="sw-mining-actions"><button class="sw-mining-action primary" type="submit">Kokotoa makadirio</button><button class="sw-mining-action" id="reset" type="button">Weka upya</button></div><div id="error" class="sw-mining-error" role="alert" hidden></div><p id="status" class="sw-mining-status" role="status" aria-live="polite">Tayari. Hakuna data iliyotumwa au kuhifadhiwa.</p></form>
<section id="result" class="sw-mining-card sw-mining-result" tabindex="-1" aria-labelledby="result-title" hidden><h2 id="result-title">Matokeo ya kupanga</h2><div class="sw-mining-result-grid">${spec.outputs.map(([key,label])=>`<div class="sw-mining-stat"><strong data-output="${key}">—</strong><span>${label}</span></div>`).join('')}</div><table class="sw-mining-table"><tbody id="breakdown"></tbody></table><div id="source-summary" class="sw-mining-source"></div>
<div class="sw-mining-actions" aria-label="Hamisha matokeo"><button class="sw-mining-action export" id="export-json" type="button" disabled>Pakua JSON</button><button class="sw-mining-action export" id="export-csv" type="button" disabled>Pakua CSV</button><button class="sw-mining-action export" id="export-pdf" type="button" disabled>Pakua PDF</button><label class="sw-mining-action import" for="import-json">Fungua JSON</label><input id="import-json" type="file" accept="application/json,.json"></div></section></div>
<aside><section class="sw-mining-card"><h2>Fomula, vipimo na mpaka</h2><p>${spec.formula}</p><p><strong>Vipimo:</strong> ${app.units.join('; ')}.</p><p><strong>Sarafu:</strong> ${esc(app.currencyBoundary)}</p><p><strong>Mpaka:</strong> ${esc(manifest.planningBoundary)}</p></section><section class="sw-mining-card"><h2>Faragha na AfroTools AI</h2><p>Maingizo na matokeo hubaki kwenye kifaa hiki. Hakuna mtandao unaohitajika kwa hesabu au export.</p><label class="sw-mining-consent"><input id="ai-consent" type="checkbox"> Nakubali kufungua AI kwa kitambulisho cha zana pekee; maingizo yangu hayatumwi.</label><a id="ai-link" class="sw-mining-action" href="/sw/ai/?tool=${app.id}" aria-disabled="true" tabindex="-1">Fungua AfroTools AI</a></section><section class="sw-mining-card"><h2>Zana nyingine tano za madini</h2><ul class="sw-mining-related">${related}</ul></section></aside></div>
<section class="sw-mining-card"><h2>Maswali ya kawaida</h2>${faq.map(([q,a])=>`<details><summary>${q}</summary><p>${a}</p></details>`).join('')}</section></main><afro-footer></afro-footer>
${spec.dataScript ? `<script src="${spec.dataScript}"></script>` : ''}<script src="/assets/js/engines/fr-mining-parity.js"></script><script src="/assets/vendor/jspdf/jspdf.umd.min.js?v=c4b6303c"></script><script src="/assets/js/pages/sw-mining-parity.js"></script></body></html>\n`;
}

function writeTarget(relativePath, content) {
  const target = path.join(ROOT, relativePath);
  const current = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
  if (CHECK) { if (!localizedGeneratorEquivalent(current, content)) throw new Error(`Swahili Mining output is stale: ${relativePath}`); return; }
  if (localizedGeneratorEquivalent(current, content)) return;
  fs.mkdirSync(path.dirname(target), { recursive: true });
  writeFileSyncWithRetry(target, content, 'utf8');
}

try {
  for (const app of manifest.apps) writeTarget(app.swRoute.replace(/^\//,'') + 'index.html', render(app));
  console.log(`${CHECK ? 'Checked' : 'Generated'} ${manifest.apps.length} Swahili Mining app routes.`);
} catch (error) { console.error(error.message); process.exitCode = 1; }
