#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const manifest = require('../data/localization/sw-civil-site-works-parity-manifest.json');
const { writeFileSyncWithRetry } = require('./lib/safe-write');

const ROOT = path.resolve(__dirname, '..');
const CHECK = process.argv.includes('--check');

function esc(value) {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function input(id, label, value, attrs, help) {
  return `<div class="sw-civil-field"><label for="${id}">${label}</label><input id="${id}" name="${id}" value="${value}" ${attrs}>${help ? `<p class="sw-civil-help" id="${id}-help">${help}</p>` : ''}</div>`;
}
function select(id, label, options) {
  return `<div class="sw-civil-field"><label for="${id}">${label}</label><select id="${id}" name="${id}" required>${options.map(([value, labelText, selected]) => `<option value="${value}"${selected ? ' selected' : ''}>${labelText}</option>`).join('')}</select></div>`;
}

const countries = [
  ['NG', 'Nigeria (NGN)'], ['KE', 'Kenya (KES)'], ['ZA', 'Afrika Kusini (ZAR)'], ['GH', 'Ghana (GHS)'], ['EG', 'Misri (EGP)'],
  ['ET', 'Ethiopia (ETB)'], ['TZ', 'Tanzania (TZS)', true], ['UG', 'Uganda (UGX)'], ['RW', 'Rwanda (RWF)'], ['MA', 'Moroko (MAD)']
];

const specs = {
  'site-clearance': {
    button: 'Kadiria gharama ya eneo',
    formTitle: 'Taarifa za eneo',
    fields: [
      select('country', 'Nchi na sarafu ya jedwali', countries),
      input('area', 'Eneo la mradi (m²)', '1200', 'type="number" min="50" step="any" inputmode="decimal" required', 'Pima mpaka wa eneo; usikadirie kutoka ukubwa wa kiwanja pekee.'),
      select('vegetation', 'Uzito wa uoto', [['light', 'Mwepesi — nyasi na vichaka'], ['medium', 'Wastani — miti iliyotawanyika na vichaka', true], ['dense', 'Mnene — msitu au vichaka vizito'], ['cleared', 'Eneo tayari limesafishwa']]),
      select('terrain', 'Mwinuko wa ardhi', [['flat', 'Tambarare (0–5%)'], ['gentle', 'Mteremko wa wastani (5–15%)', true], ['steep', 'Mteremko mkali (15–30%)']]),
      select('removeTopsoil', 'Ondoa udongo wa juu?', [['yes', 'Ndiyo — injini hutumia kina cha 0.225 m', true], ['no', 'Hapana']]),
      input('trees', 'Miti mikubwa ya kukata (zaidi ya 300 mm)', '4', 'type="number" min="0" max="500" step="1" inputmode="numeric" required'),
      select('demolition', 'Jengo la kubomoa', [['none', 'Hakuna'], ['small', 'Dogo — kibanda au ukuta', true], ['medium', 'Jengo la wastani (chini ya 200 m²)'], ['large', 'Jengo kubwa (zaidi ya 200 m²)']]),
      select('waste', 'Njia ya kushughulikia taka', [['burn', 'Kuchoma eneo husika — thibitisha sheria za eneo'], ['haul', 'Kusafirisha dampo'], ['chip', 'Kusaga au kutengeneza mboji eneo husika', true]])
    ],
    outputs: [['total', 'Jumla ya utayarishaji'], ['costPerM2', 'Gharama kwa m²'], ['days', 'Muda unaokadiriwa'], ['topsoilVolume', 'Udongo wa juu']],
    formula: 'Gharama ya uoto = eneo × kiwango cha uoto cha nchi × kipengele cha mwinuko. Kisha injini huongeza miti, udongo wa juu, ubomoaji na taka. Kina cha udongo wa juu ni 0.225 m na ujazo wa taka ya uoto ni 0.05 m³ kwa m².',
    insights: [
      'Kagua njia ya kuingiza mashine, mipaka ya kiwanja, nyaya au mabomba yaliyofichwa na ruhusa kabla ya kusafisha.',
      'Kuchoma taka kunaweza kukatazwa. Thibitisha masharti ya manispaa, mazingira na usalama kabla ya kuchagua njia hiyo.',
      'Muda wa injini ni kiashirio cha kupanga: siku za eneo + miti + nyongeza ya ubomoaji, si ratiba ya mkandarasi.'
    ]
  },
  'road-construction-cost': {
    button: 'Kadiria gharama ya barabara',
    formTitle: 'Taarifa za barabara',
    fields: [
      select('country', 'Nchi na sarafu ya jedwali', countries),
      input('length', 'Urefu wa barabara (km)', '2.5', 'type="number" min="0.1" step="0.1" inputmode="decimal" required'),
      select('width', 'Upana wa barabara', [['3.5', '3.5 m — njia moja ya vijijini'], ['6.0', '6.0 m — njia mbili za kawaida'], ['7.3', '7.3 m — njia mbili na mabega', true], ['10.0', '10.0 m — barabara ya mjini'], ['14.0', '14.0 m — barabara kuu']]),
      select('surface', 'Aina ya uso', [['gravel', 'Changarawe / laterite'], ['asphalt', 'Lami / bitumen', true], ['concrete', 'Zege gumu'], ['interlocking', 'Vigae vya kufungamana']]),
      select('terrain', 'Aina ya ardhi', [['flat', 'Tambarare'], ['rolling', 'Inapanda na kushuka', true], ['hilly', 'Milima']]),
      select('location', 'Mazingira ya eneo', [['urban', 'Mjini — huduma na udhibiti wa magari'], ['peri_urban', 'Pembezoni mwa mji', true], ['rural', 'Kijijini / eneo jipya']]),
      select('includeDrainage', 'Jumuisha mifereji na makalavati?', [['yes', 'Ndiyo', true], ['no', 'Hapana']]),
      select('includeLighting', 'Jumuisha taa za barabarani?', [['yes', 'Ndiyo'], ['no', 'Hapana', true]])
    ],
    outputs: [['total', 'Jumla pamoja na nyongeza'], ['baseCostPerKm', 'Gharama ya msingi kwa km'], ['roadCost', 'Kazi kuu ya barabara'], ['extras', 'Mifereji na taa']],
    formula: 'Gharama ya msingi kwa km = kiwango cha uso cha nchi × kipengele cha upana × kipengele cha ardhi × kipengele cha mazingira. Gharama ya barabara huzidishwa kwa urefu; mifereji ni asilimia ya gharama hiyo na taa ni kiwango kwa km.',
    insights: [
      'Utafiti wa udongo, usanifu wa mifereji, makutano, fidia, huduma zilizopo na usimamizi wa magari havijapewa bei na injini.',
      'Lami, saruji, kokoto, mafuta na usafirishaji hubadilika. Pata BOQ na nukuu zenye tarehe kabla ya zabuni au ununuzi.',
      'Jedwali la kulinganisha hutumia upana, ardhi na mazingira yale yale ili kutenganisha athari ya aina ya uso.'
    ]
  }
};

function jsonLd(value) { return JSON.stringify(value).replace(/</g, '\\u003c'); }

function render(app) {
  const spec = specs[app.id];
  const canonical = `https://afrotools.com${app.swRoute}`;
  const english = `https://afrotools.com${app.englishRoute}`;
  const other = manifest.apps.find((candidate) => candidate.id !== app.id);
  const faq = [
    ['Je, viwango hivi ni rasmi au vya sasa?', 'Hapana. Ni dhana tuli za kupanga zilizopo kwenye injini ya Kiingereza. Tarehe ya 2026-07-30 ni tarehe ya mabadiliko ya mwisho ya injini katika hazina, si uthibitisho mpya wa bei za soko.'],
    ['Je, matokeo ni BOQ au nukuu ya mkandarasi?', 'Hapana. Matokeo hayajumuishi uchunguzi kamili wa eneo, usanifu, vibali, hatari zote, kodi au masharti ya zabuni. Tumia kwa kupanga na kulinganisha, kisha pata BOQ na nukuu za sasa.'],
    ['Data yangu hutumwa wapi?', 'Hesabu, kunakili, JSON, TXT na kufungua JSON hufanyika ndani ya kivinjari. Kiungo cha AfroTools AI hufunguliwa tu baada ya idhini na hutuma kitambulisho cha zana pekee, si maingizo au matokeo.']
  ];
  return `<!doctype html>
<html lang="sw">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(app.title)} | AfroTools</title><meta name="description" content="${esc(app.description)}">
<link rel="canonical" href="${canonical}"><link rel="alternate" hreflang="sw" href="${canonical}"><link rel="alternate" hreflang="en" href="${english}"><link rel="alternate" hreflang="fr" href="https://afrotools.com${app.frenchRoute}"><link rel="alternate" hreflang="x-default" href="${english}">
<meta property="og:title" content="${esc(app.title)} | AfroTools"><meta property="og:description" content="${esc(app.description)}"><meta property="og:type" content="website"><meta property="og:url" content="${canonical}"><meta property="og:locale" content="sw_TZ"><meta property="og:image" content="https://afrotools.com/assets/img/tools/${app.imageId}.webp"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="https://afrotools.com/assets/img/tools/${app.imageId}.webp">
<link rel="stylesheet" href="/assets/css/tokens.min.css?v=f987f2a8"><link rel="stylesheet" href="/assets/css/global.min.css?v=0ff6e9dc"><link rel="stylesheet" href="/assets/css/design-system.min.css?v=11fcf8e5"><link rel="stylesheet" href="/assets/css/sw-civil-site-works-parity.css">
<script src="/assets/js/components/navbar.min.js?v=b9df7b05" defer></script><script src="/assets/js/components/footer.min.js?v=506bb75a" defer></script>
<script type="application/ld+json">${jsonLd({'@context':'https://schema.org','@type':'WebApplication',name:app.title,description:app.description,url:canonical,inLanguage:'sw',applicationCategory:'UtilitiesApplication',operatingSystem:'Web',isAccessibleForFree:true,offers:{'@type':'Offer',price:'0',priceCurrency:'USD'},image:`https://afrotools.com/assets/img/tools/${app.imageId}.webp`})}</script>
<script type="application/ld+json">${jsonLd({'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'AfroTools Kiswahili',item:'https://afrotools.com/sw/'},{'@type':'ListItem',position:2,name:'Uhandisi na Ujenzi',item:'https://afrotools.com/sw/?category=engineering'},{'@type':'ListItem',position:3,name:app.shortTitle,item:canonical}]})}</script>
<script type="application/ld+json">${jsonLd({'@context':'https://schema.org','@type':'FAQPage',inLanguage:'sw',mainEntity:faq.map(([question,answer])=>({'@type':'Question',name:question,acceptedAnswer:{'@type':'Answer',text:answer}}))})}</script>
</head>
<body class="sw-civil-page" data-civil-tool="${app.id}"><afro-navbar active="engineering"></afro-navbar>
<main class="sw-civil-shell"><header class="sw-civil-hero"><div><p class="sw-civil-eyebrow">Uhandisi wa kiraia · Hesabu ya ndani</p><h1>${esc(app.title)}</h1><p>${esc(app.description)}</p></div><img class="sw-civil-art" src="/assets/img/tools/${app.imageId}.webp" alt="" width="${app.imageWidth}" height="${app.imageHeight}"></header>
<div class="sw-civil-layout"><div class="sw-civil-stack"><form id="civil-form" class="sw-civil-card" novalidate><h2>${spec.formTitle}</h2><p>Badilisha dhana zako, kisha kokotoa. Kubadilisha ingizo lolote huondoa matokeo ya zamani na kuzima kunakili pamoja na upakuaji wa faili.</p><div class="sw-civil-grid">${spec.fields.join('')}</div><div class="sw-civil-actions"><button class="sw-civil-button primary" type="submit">${spec.button}</button><button class="sw-civil-button" id="civil-reset" type="button">Weka upya</button></div><div id="civil-error" class="sw-civil-error" role="alert" hidden></div><p id="civil-status" class="sw-civil-status" role="status" aria-live="polite"></p></form>
<section id="civil-result" class="sw-civil-card sw-civil-result" tabindex="-1" aria-labelledby="civil-result-title" hidden><h2 id="civil-result-title">Matokeo ya kupanga</h2><div class="sw-civil-stats">${spec.outputs.map(([key,label])=>`<div class="sw-civil-stat"><strong data-output="${key}">—</strong><span>${label}</span></div>`).join('')}</div><table class="sw-civil-table"><caption class="sr-only">Mchanganuo wa makadirio</caption><tbody id="civil-breakdown"></tbody></table><div class="sw-civil-actions" aria-label="Hamisha matokeo ya sasa"><button type="button" class="sw-civil-button" data-civil-export="copy" disabled>Nakili matokeo</button><button type="button" class="sw-civil-button" data-civil-export="json" disabled>Pakua JSON</button><button type="button" class="sw-civil-button" data-civil-export="txt" disabled>Pakua TXT</button><label class="sw-civil-button sw-civil-import" for="import-json">Fungua JSON<input id="import-json" type="file" accept="application/json,.json"></label></div></section></div>
<aside class="sw-civil-stack"><section class="sw-civil-card"><h2>Fomula na vipimo</h2><p>${spec.formula}</p><p><strong>Vipimo:</strong> ${app.units.join('; ')}.</p></section><section class="sw-civil-card"><h2>Chanzo, ubichi na uhakika</h2><div class="sw-civil-evidence"><div><strong>Chanzo</strong>Injini ileile ya Kiingereza: <code>${app.engineSource}</code>.</div><div><strong>Ubichi</strong>Mabadiliko ya mwisho ya injini katika hazina: 2026-07-30. Hii si uthibitisho wa bei za soko.</div><div><strong>Hali</strong>Viwango tuli vya kupanga; hakuna bei hai au dai rasmi.</div><div><strong>Uhakika</strong>Chini kwa ununuzi. Thibitisha kwa uchunguzi, BOQ, mhandisi na nukuu zenye tarehe.</div></div></section><section class="sw-civil-card"><h2>Faragha na AfroTools AI</h2><p>Maingizo, hesabu na faili zinazopakuliwa hubaki kwenye kifaa hiki. Hakuna data ya mradi inayotumwa.</p><label class="sw-civil-check"><input id="ai-consent" type="checkbox">Nakubali kufungua AI kwa kitambulisho cha zana pekee; maingizo na matokeo hayatatumwa.</label><a id="ai-link" class="sw-civil-button" href="/sw/ai/?tool=${app.id}" aria-disabled="true" tabindex="-1">Fungua AfroTools AI</a></section><section class="sw-civil-card"><h2>Zana inayohusiana</h2><ul class="sw-civil-related"><li><a href="${other.swRoute}">${esc(other.title)}</a></li><li><a href="/sw/tools/">Zana zote za Kiswahili</a></li></ul></section></aside></div>
<section class="sw-civil-card"><h2>Hatua za kitaalamu zinazofuata</h2><ul>${spec.insights.map((item)=>`<li>${item}</li>`).join('')}</ul><p><strong>Mpaka:</strong> ${manifest.planningBoundary}</p></section><section class="sw-civil-card"><h2>Maswali ya kawaida</h2>${faq.map(([question,answer])=>`<details><summary>${question}</summary><p>${answer}</p></details>`).join('')}</section></main><afro-footer></afro-footer>
<script src="${app.enginePublic}"></script><script src="/assets/js/pages/sw-civil-site-works-parity.js"></script></body></html>\n`;
}

function writeTarget(relativePath, content) {
  const target = path.join(ROOT, relativePath);
  const current = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
  if (CHECK) {
    if (current !== content) throw new Error(`Swahili civil site-works output is stale: ${relativePath}`);
    return;
  }
  if (current === content) return;
  fs.mkdirSync(path.dirname(target), { recursive: true });
  writeFileSyncWithRetry(target, content, 'utf8');
}

try {
  for (const app of manifest.apps) writeTarget(app.swFile, render(app));
  console.log(`${CHECK ? 'Checked' : 'Generated'} ${manifest.apps.length} Swahili civil site-works routes.`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
