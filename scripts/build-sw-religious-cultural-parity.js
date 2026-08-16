#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { writeFileSyncWithRetry } = require('./lib/safe-write');

const ROOT = path.resolve(__dirname, '..');
const WRITE = process.argv.includes('--write');
const SOURCE = require('../data/localization/fr-religious-cultural-parity.json');
const ACCEPTED = new Set([
  'tithe-offering','lobola-calculator','lobola-negotiation-checklist','lobola-gift-list','african-proverbs','prayer-times','ramadan-timetable','islamic-finance','wedding-budget','naming-ceremony','funeral-cost','baby-name-generator','traditional-calendar','age-calculator-african','festival-calendar','aso-ebi-cost','traditional-attire','halal-compliance','islamic-calendar'
]);
const ROUTES = Object.freeze({
  'tithe-offering':'/sw/zana/kikokotoo-fungu-la-kumi-na-sadaka/','lobola-calculator':'/sw/zana/kikokotoo-lobola-na-mahari/','lobola-negotiation-checklist':'/sw/zana/orodha-ya-majadiliano-ya-lobola/','lobola-gift-list':'/sw/zana/orodha-ya-zawadi-za-lobola/','african-proverbs':'/sw/zana/methali-za-afrika/','prayer-times':'/sw/zana/nyakati-za-swala-na-qibla/','ramadan-timetable':'/sw/zana/ratiba-ya-ramadhani/','islamic-finance':'/sw/zana/fedha-za-kiislamu/','wedding-budget':'/sw/zana/bajeti-ya-harusi/','naming-ceremony':'/sw/zana/bajeti-ya-sherehe-ya-jina/','funeral-cost':'/sw/zana/mpango-wa-gharama-za-mazishi/','baby-name-generator':'/sw/zana/majina-ya-watoto-wa-afrika/','traditional-calendar':'/sw/zana/kalenda-ya-kimila/','age-calculator-african':'/sw/zana/umri-na-jina-la-siku-afrika/','festival-calendar':'/sw/zana/kalenda-ya-tamasha-za-utamaduni/','aso-ebi-cost':'/sw/zana/gharama-za-aso-ebi/','traditional-attire':'/sw/zana/gharama-za-mavazi-ya-kimila/','halal-compliance':'/sw/zana/ukaguzi-wa-halal/','islamic-calendar':'/sw/zana/kalenda-ya-kiislamu/'
});
const DATE_AWARE_FIELDS = Object.freeze({
  'prayer-times': [
    {id:'city',type:'select',value:'Nairobi',options:['Nairobi','Lagos','Caire','Accra','Johannesburg','Casablanca']},
    {id:'method',type:'select',value:'MWL',options:['MWL','Egypt','ISNA','UmmQura']},
    {id:'school',type:'select',value:'standard',options:[{value:'standard',label:'Kawaida'},{value:'hanafi',label:'Hanafi'}]},
    {id:'date',type:'date',value:'2026-04-27'}
  ],
  'ramadan-timetable': [
    {id:'city',type:'select',value:'Lagos',options:['Lagos','Nairobi','Caire','Accra','Johannesburg','Casablanca']},
    {id:'method',type:'select',value:'MWL',options:['MWL','Egypt','ISNA','UmmQura']},
    {id:'school',type:'select',value:'standard',options:[{value:'standard',label:'Kawaida'},{value:'hanafi',label:'Hanafi'}]},
    {id:'startDate',type:'date',value:'2026-02-19'},
    {id:'days',type:'number',value:30,min:1,max:30,step:1},
    {id:'suhoorBuffer',type:'number',value:10,min:0,max:120,step:1},
    {id:'iftarBuffer',type:'number',value:0,min:0,max:120,step:1}
  ]
});
const COPY = Object.freeze({
  'tithe-offering':['Mpangaji binafsi wa fungu la kumi na sadaka','Jumlisha asilimia, sadaka na ahadi ulizochagua bila kuamua wajibu wa dini, baraka au matokeo ya kifedha.'],
  'lobola-calculator':['Kikokotoo cha Lobola na mahari','Panga matarajio, zawadi, sherehe na akiba ya bajeti bila kuweka bei kwa mtu au kuamua desturi ya familia.'],
  'lobola-negotiation-checklist':['Orodha ya maandalizi ya mazungumzo ya Lobola','Andaa wasemaji, maswali na hatua zinazofuata kwa mkutano wa familia wenye heshima na ridhaa.'],
  'lobola-gift-list':['Orodha ya zawadi za Lobola na mahari','Andika vipengee na thamani za kupanga; familia na wazee husika ndio huthibitisha desturi na zawadi.'],
  'african-proverbs':['Daftari la methali za Afrika','Chagua marejeo machache ya kuanzia kisha andika chanzo au msemaji wa kuthibitisha kabla ya kuchapisha.'],
  'prayer-times':['Mpangaji wa nyakati za swala na Qibla','Kokotoa makisio ya tarehe na mji kwa mbinu iliyochaguliwa, kisha thibitisha nyakati zote na msikiti wa eneo.'],
  'ramadan-timetable':['Rasimu ya ratiba ya Ramadhani','Tengeneza rasimu ya kila tarehe kwa mji na mbinu iliyochaguliwa; mwandamo na msikiti wa eneo ndio uthibitisho wa mwisho.'],
  'islamic-finance':['Kikokotoo cha muundo wa fedha za Kiislamu','Linganisha bei, amana, ongezeko la gharama, ada na muda kama hesabu ya kupanga—si fatwa wala ofa ya benki.'],
  'wedding-budget':['Mpangaji wa bajeti ya harusi','Tenganisha wageni, chakula, ukumbi, mavazi, huduma na akiba bila kudai bei rasmi au mila ya lazima.'],
  'naming-ceremony':['Mpangaji wa sherehe ya jina','Panga mapokezi, zawadi, mwezeshaji na usafiri huku familia na jamii zikibaki mamlaka ya desturi.'],
  'funeral-cost':['Mpangaji wa gharama za mazishi','Tenganisha mapokezi, maandalizi, maziko, usafiri na kumbukumbu kwa utulivu na heshima.'],
  'baby-name-generator':['Daftari la kuthibitisha jina la mtoto wa Afrika','Andika jina, maana iliyosimuliwa na mtu wa kuthibitisha; zana haitoi uhalali wa lugha au ukoo.'],
  'traditional-calendar':['Kikokotoo cha mzunguko wa kalenda ya kimila','Kadiria Eke, Orie, Afo au Nkwo kutoka tarehe ya marejeo uliyothibitisha na chanzo cha eneo.'],
  'age-calculator-african':['Umri na pendekezo la jina la siku','Kokotoa umri na siku ya kuzaliwa, kisha onyesha pendekezo la Akan linalohitaji uthibitisho wa familia.'],
  'festival-calendar':['Kadi ya uthibitishaji wa tamasha','Andika tukio, tarehe ya muda, mratibu na kanuni ya heshima; zana haitangazi kalenda rasmi.'],
  'aso-ebi-cost':['Kikokotoo cha gharama za Aso-Ebi','Panga kitambaa, ushonaji, vifaa, usafirishaji na punguzo la kikundi bila kudai bei au idhini ya familia.'],
  'traditional-attire':['Kikokotoo cha mavazi ya kimila','Panga kitambaa, ushonaji, vifaa na ada ya haraka kwa idadi ya mavazi, kisha hakiki bei na makubaliano ya eneo lako.'],
  'halal-compliance':['Orodha ya utayari wa Halal','Panga ushahidi wa viambato, wasambazaji, uhifadhi, usafi na lebo; alama si uthibitisho wa Halal.'],
  'islamic-calendar':['Kibadilishaji cha Gregorian kwenda Hijri','Pata makisio ya kalenda ya hesabu na uthibitishe Ramadhani, Eid, Hajj na ibada nyingine kwa mamlaka ya eneo.']
});
const LABELS = Object.freeze({currency:'Sarafu',reference:'Kiasi cha marejeo',rate:'Asilimia uliyochagua',offering:'Sadaka ya ziada',pledge:'Ahadi ya hiari',periods:'Vipindi',essentials:'Matumizi muhimu',familyExpectation:'Matarajio ya familia yaliyoingizwa',giftValue:'Thamani ya zawadi',ceremonyCost:'Gharama ya sherehe',buffer:'Akiba (%)',familyA:'Familia au msemaji wa kwanza',familyB:'Familia au msemaji wa pili',pending:'Jambo la kuthibitisha',nextStep:'Hatua inayofuata',item1:'Kipengee cha kwanza',value1:'Thamani ya kwanza',item2:'Kipengee cha pili',value2:'Thamani ya pili',item3:'Kipengee cha tatu',value3:'Thamani ya tatu',culture:'Lugha au jamii ya kuthibitisha',purpose:'Matumizi yaliyopangwa',verification:'Chanzo au msemaji wa kuuliza',city:'Jiji la mfano',method:'Njia ya kulinganisha',school:'Njia ya kukokotoa Asr',date:'Tarehe ya Gregorian',startDate:'Tarehe ya kuanzia ya muda',days:'Siku',fajr:'Fajr ya eneo',maghrib:'Maghrib ya eneo',suhoorBuffer:'Dakika kabla ya Fajr',iftarBuffer:'Dakika baada ya Maghrib',assetPrice:'Bei ya mali',deposit:'Amana',margin:'Ongezeko la gharama (%)',termMonths:'Muda (miezi)',fees:'Ada zilizoingizwa',guests:'Wageni',foodPerGuest:'Chakula kwa mtu',venue:'Ukumbi',attire:'Mavazi',services:'Huduma nyingine',gifts:'Zawadi na vifaa',officiant:'Msaada kwa mwezeshaji',logistics:'Usafiri na maandalizi',mortuary:'Maandalizi na mortuary',burial:'Maziko na jeneza',transport:'Usafiri',remembrance:'Kumbukumbu',candidate:'Jina linalopitiwa',meaning:'Maana iliyosimuliwa',reviewer:'Msemaji, mzee au chanzo',referenceDate:'Tarehe ya marejeo',referenceIndex:'Siku ya mzunguko wa marejeo',localAuthority:'Chanzo cha eneo',birthDate:'Tarehe ya kuzaliwa',asOfDate:'Tarehe ya kukokotoa',gender:'Jedwali la pendekezo',festival:'Tamasha au tukio',country:'Nchi au jamii',provisionalDate:'Tarehe ya muda',organizer:'Mratibu wa kuthibitisha',respectNote:'Kanuni ya heshima',people:'Watu',fabricYards:'Mita au yards kwa mtu',fabricPrice:'Bei ya kitambaa kwa kipimo',tailoring:'Ushonaji kwa mtu',accessories:'Vifaa kwa vazi',delivery:'Usafirishaji wa kikundi',discount:'Punguzo (%)',quantity:'Idadi ya mavazi',fabricCost:'Kitambaa kwa vazi',tailoringCost:'Ushonaji kwa vazi',rushFee:'Ada ya haraka',ingredients:'Orodha ya viambato',suppliers:'Ushahidi wa wasambazaji',storage:'Utenganishaji na uhifadhi',cleaning:'Utaratibu wa usafi',labels:'Lebo na ufuatiliaji',authority:'Mamlaka ya kuuliza',adjustment:'Marekebisho ya siku'});
const OPTIONS = Object.freeze({'Discussion familiale':'Mazungumzo ya familia','Cours':'Darasa','Discours':'Hotuba','Publication':'Chapisho','Autorité égyptienne':'Mamlaka ya Misri','Réglage local':'Mpangilio wa eneo','Homme / garçon':'Mwanaume / mvulana','Femme / fille':'Mwanamke / msichana','Oui':'Ndiyo','Non':'Hapana','À confirmer':'Kuthibitishwa',female:'Mwanamke / msichana',male:'Mwanaume / mvulana',yes:'Imeandikwa',no:'Haijaandikwa',unknown:'Haijathibitishwa'});
const VALUES = Object.freeze({
  'Famille A':'Familia A','Famille B':'Familia B','Confirmer les cadeaux et le déplacement':'Thibitisha zawadi na usafiri','Valider le compte rendu avec les deux familles':'Thibitisha kumbukumbu na familia zote mbili',
  Couvertures:'Mablanketi',Transport:'Usafiri',Accueil:'Mapokezi','À confirmer avec un locuteur compétent':'Thibitisha na msemaji mwenye ujuzi','À confirmer':'Kuthibitishwa',
  'Révision familiale nécessaire':'Mapitio ya familia yanahitajika','Calendrier de la communauté':'Kalenda ya jamii','Événement à confirmer':'Tukio la kuthibitishwa','Pays à préciser':'Nchi ya kutajwa',
  'Comité organisateur':'Kamati ya waandaaji','Demander l’autorisation avant de filmer':'Omba ruhusa kabla ya kupiga picha au video','À identifier localement':'Tambua mamlaka ya eneo'
});

function esc(value) { return String(value == null ? '' : value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function json(value) { return JSON.stringify(value).replace(/</g,'\\u003c'); }
function fileFor(route) { return path.join(ROOT, route.replace(/^\/+|\/+$/g,''), 'index.html'); }
function renderField(field) {
  const id = `sw-rc-${field.id}`;
  let control;
  if (field.type === 'select') control = `<select id="${id}" name="${esc(field.id)}">${field.options.map((option) => { const value=typeof option==='string'?option:option.value; return `<option value="${esc(value)}"${String(value)===String(field.value)?' selected':''}>${esc(OPTIONS[value]||value)}</option>`; }).join('')}</select>`;
  else if (field.type === 'textarea') control = `<textarea id="${id}" name="${esc(field.id)}">${esc(field.value)}</textarea>`;
  else control = `<input id="${id}" name="${esc(field.id)}" type="${field.type==='date'?'date':field.type==='number'?'number':'text'}" value="${esc(field.value)}"${field.min!=null?` min="${field.min}"`:''}${field.max!=null?` max="${field.max}"`:''}${field.step!=null?` step="${field.step}"`:''}>`;
  return `<label class="fr-rc-field" for="${id}"><span>${esc(LABELS[field.id]||field.id)}</span>${control}</label>`;
}
function translateTool(source) {
  const copy = COPY[source.sourceId];
  const astronomical = ['prayer-times','ramadan-timetable'].includes(source.sourceId);
  const fields = DATE_AWARE_FIELDS[source.sourceId] || source.fields;
  return { ...source, route:ROUTES[source.sourceId], title:copy[0], description:copy[1], fields:fields.map((field)=>({...field,label:LABELS[field.id]||field.id,value:field.type==='select'?field.value:(VALUES[field.value]||field.value)})), source:astronomical?'Hesabu ya ndani ya tarehe kwa milinganyo ya jua ya NOAA na vigezo vya mbinu vilivyoandikwa na PrayTimes; hakuna data ya moja kwa moja.':'Hesabu ya ndani iliyotolewa kutoka mmiliki wa Kiingereza; taarifa hubaki kwenye kivinjari na marejeo yanahitaji uthibitishaji wa eneo.', boundary:copy[1] + ' Thibitisha maamuzi ya dini, familia, sheria au utamaduni kwa viongozi na wataalamu husika.', confidence:astronomical?'Makisio ya kiastronomia yanayorudiwa; nyakati za ibada na tarehe ya kuanza lazima zithibitishwe na msikiti na mamlaka ya eneo.':'Juu kwa hesabu ya maingizo; hakuna mamlaka ya dini, familia, utamaduni au bei inayodaiwa.' };
}
function alternates(tool) { return `<link rel="alternate" hreflang="en" href="https://afrotools.com${esc(tool.englishRoute)}"><link rel="alternate" hreflang="fr" href="https://afrotools.com${esc(SOURCE.tools.find((row)=>row.sourceId===tool.sourceId).route)}"><link rel="alternate" hreflang="sw" href="https://afrotools.com${esc(tool.route)}"><link rel="alternate" hreflang="x-default" href="https://afrotools.com${esc(tool.englishRoute)}">`; }
function page(tool) {
  const { fixture: _fixture, ...runtimeTool } = tool;
  const config={...runtimeTool,locale:'sw',reviewedOn:'2026-08-08'};
  const schema={'@context':'https://schema.org','@type':'WebApplication',name:tool.title,description:tool.description,url:`https://afrotools.com${tool.route}`,inLanguage:'sw',applicationCategory:'UtilityApplication',operatingSystem:'Web',isBasedOn:`https://afrotools.com${tool.englishRoute}`,image:`https://afrotools.com${tool.artwork}`,offers:{'@type':'Offer',price:'0',priceCurrency:'USD'}};
  return `<!doctype html><html lang="sw" data-theme-choice="auto"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="afrotools-source-owner" content="scripts/build-sw-religious-cultural-parity.js"><meta name="afrotools-content-id" content="sw-religious-cultural:${esc(tool.sourceId)}"><title>${esc(tool.title)} | AfroTools</title><meta name="description" content="${esc(tool.description)}"><meta name="robots" content="index,follow"><link rel="canonical" href="https://afrotools.com${esc(tool.route)}">${alternates(tool)}<meta property="og:type" content="website"><meta property="og:locale" content="sw_TZ"><meta property="og:title" content="${esc(tool.title)}"><meta property="og:description" content="${esc(tool.description)}"><meta property="og:url" content="https://afrotools.com${esc(tool.route)}"><meta property="og:image" content="https://afrotools.com${esc(tool.artwork)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="https://afrotools.com${esc(tool.artwork)}"><link rel="stylesheet" href="/assets/css/design-system.css"><link rel="stylesheet" href="/assets/css/fr-religious-cultural-parity.css"><script type="application/ld+json">${json(schema)}</script></head><body class="fr-rc-page" data-tool="${esc(tool.sourceId)}"><a class="fr-rc-skip" href="#sw-rc-main">Nenda kwenye hesabu</a><afro-navbar active="religious-cultural"></afro-navbar><header class="fr-rc-hero"><div class="fr-rc-wrap"><p class="fr-rc-kicker"><a href="/sw/dini-na-utamaduni/">Dini na utamaduni</a></p><h1>${esc(tool.title)}</h1><p class="fr-rc-lede">${esc(tool.description)}</p><ul class="fr-rc-trust"><li>Hesabu ya ndani</li><li>Hakuna akaunti</li><li>Hakuna ombi la AI</li><li>JSON inayofunguka tena</li></ul></div></header><main class="fr-rc-wrap fr-rc-layout" id="sw-rc-main"><section class="fr-rc-card"><h2>Andaa matokeo</h2><p>Badilisha mfano huu. Matokeo ya zamani hufutwa ingizo linapobadilika.</p><form id="sw-rc-form" novalidate><div class="fr-rc-fields">${tool.fields.map(renderField).join('')}</div><div class="fr-rc-actions"><button class="fr-rc-button fr-rc-button-primary" type="submit">Kokotoa kwenye kifaa</button><button class="fr-rc-button" id="sw-rc-reset" type="reset">Weka mfano upya</button></div></form><p class="fr-rc-status" id="sw-rc-status" role="status" aria-live="polite"></p><div class="fr-rc-results" id="sw-rc-output" hidden></div><div class="fr-rc-actions"><button class="fr-rc-button" id="sw-rc-copy" type="button">Nakili muhtasari</button><button class="fr-rc-button" id="sw-rc-download" type="button">Pakua JSON</button><button class="fr-rc-button" id="sw-rc-print" type="button">Chapisha</button></div></section><aside class="fr-rc-meta"><section class="fr-rc-card fr-rc-boundary"><h2>Mpaka wa mamlaka</h2><p>${esc(tool.boundary)}</p></section><section class="fr-rc-card"><h2>Chanzo na upya</h2><p>${esc(tool.source)}</p><p><strong>Imepitiwa:</strong> 2026-08-08</p></section><section class="fr-rc-card"><h2>Kiwango cha kuamini</h2><p>${esc(tool.confidence)}</p></section><section class="fr-rc-card"><h2>Faragha</h2><p>Maingizo, hesabu na faili hubaki kwenye kivinjari hiki. Hakuna maandishi yanayotumwa kwa AI au seva.</p></section></aside></main><afro-footer></afro-footer><script id="sw-rc-config" type="application/json">${json(config)}</script><script src="/assets/js/lib/dark-mode.js" defer></script><script src="/assets/js/components/navbar.js" defer></script><script src="/assets/js/components/footer.js" defer></script><script src="/assets/js/engines/religious-cultural-parity.js"></script><script src="/assets/js/pages/sw-religious-cultural-parity.js" defer></script><script src="/assets/js/lib/sw-accessibility.js" defer></script></body></html>\n`;
}
function reciprocal(html, tool) {
  const tag=`<link rel="alternate" hreflang="sw" href="https://afrotools.com${tool.route}">`;
  if (html.includes(tag)) return html;
  return html.replace(/(<link\b[^>]*rel=["']alternate["'][^>]*hreflang=["']x-default["'][^>]*>)/i,`${tag}\n$1`);
}
function main() {
  const unaccepted=SOURCE.tools.filter((tool)=>!['zakat-calculator','faraid-inheritance','hajj-budget'].includes(tool.sourceId));
  if(unaccepted.length!==19) throw new Error(`Expected 19 assigned rows, found ${unaccepted.length}`);
  const changed=[];
  for(const source of unaccepted){
    if(!ACCEPTED.has(source.sourceId)) continue;
    const tool=translateTool(source); const file=fileFor(tool.route); const rawHtml=page(tool); const html=['prayer-times','ramadan-timetable'].includes(source.sourceId)?rawHtml.replace('<script src="/assets/js/engines/religious-cultural-parity.js"></script>', '<script src="/assets/js/engines/prayer-times.js"></script><script src="/assets/js/engines/religious-cultural-parity.js"></script>'):rawHtml; const current=fs.existsSync(file)?fs.readFileSync(file,'utf8'):'';
    if(current!==html){changed.push(path.relative(ROOT,file).replace(/\\/g,'/'));if(WRITE){fs.mkdirSync(path.dirname(file),{recursive:true});writeFileSyncWithRetry(file,html,'utf8');}}
    const englishFile=path.join(ROOT,source.englishRoute.replace(/^\/+|\/+$/g,''),'index.html'); const next=reciprocal(fs.readFileSync(englishFile,'utf8'),tool);
    if(next!==fs.readFileSync(englishFile,'utf8')){changed.push(path.relative(ROOT,englishFile).replace(/\\/g,'/'));if(WRITE)writeFileSyncWithRetry(englishFile,next,'utf8');}
    const frenchFile=fileFor(source.route); const frenchNext=reciprocal(fs.readFileSync(frenchFile,'utf8'),tool);
    if(frenchNext!==fs.readFileSync(frenchFile,'utf8')){changed.push(path.relative(ROOT,frenchFile).replace(/\\/g,'/'));if(WRITE)writeFileSyncWithRetry(frenchFile,frenchNext,'utf8');}
  }
  console.log(JSON.stringify({mode:WRITE?'write':'check',denominator:19,accepted:ACCEPTED.size,blocked:[],changedFiles:changed.length,files:changed},null,2));
  if(!WRITE&&changed.length)process.exitCode=1;
}
if(require.main===module)main();
module.exports={ACCEPTED,ROUTES,translateTool,page};
