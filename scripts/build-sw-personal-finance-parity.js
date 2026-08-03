#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CHECK = process.argv.includes('--check');
const REVIEW_DATE = '18 Julai 2026';

const countries = new Map([
  ['NG','Nigeria · NGN'],['KE','Kenya · KES'],['ZA','Afrika Kusini · ZAR'],['GH','Ghana · GHS'],
  ['EG','Misri · EGP'],['ET','Ethiopia · ETB'],['TZ','Tanzania · TZS'],['UG','Uganda · UGX'],
  ['RW','Rwanda · RWF'],['CI',"Côte d'Ivoire · XOF"],['CM','Kamerun · XAF'],['SN','Senegal · XOF'],
  ['MA','Moroko · MAD'],['TN','Tunisia · TND'],['AO','Angola · AOA'],['ZM','Zambia · ZMW'],
  ['ZW','Zimbabwe · USD']
]);
const COUNTRY_SETS = Object.freeze({
  '50-30-20-budget': ['NG','KE','ZA','GH','EG','ET','TZ','UG','RW','CI','CM','SN','MA','TN','AO'],
  'album-budget': ['NG','KE','ZA','GH','EG','TZ','RW','CI','CM','SN','MA'],
  'film-budget': ['NG','KE','ZA','GH','EG'],
  'security-emergency-fund': ['NG','KE','ZA','GH','ET','TZ','UG','EG','MA','CI','SN','CM','ZM','ZW']
});
function countryOptions(appId) {
  return COUNTRY_SETS[appId].map((value) => `<option value="${value}">${countries.get(value)}</option>`).join('');
}

function input(name, label, options = {}) {
  const attrs = [`id="swpf-${name}"`,`name="${name}"`,`type="${options.type || 'number'}"`];
  ['value','min','max','step','placeholder'].forEach((key) => { if (options[key] !== undefined) attrs.push(`${key}="${options[key]}"`); });
  if (options.required) attrs.push('required');
  if ((options.type || 'number') === 'number') attrs.push('inputmode="decimal"');
  return `<div class="swpf-field${options.wide ? ' wide' : ''}"><label for="swpf-${name}">${label}</label><input ${attrs.join(' ')}>${options.help ? `<small>${options.help}</small>` : ''}</div>`;
}
function select(name, label, options, help = '') {
  return `<div class="swpf-field"><label for="swpf-${name}">${label}</label><select id="swpf-${name}" name="${name}">${options}</select>${help ? `<small>${help}</small>` : ''}</div>`;
}
function optionList(rows) { return rows.map(([value,label]) => `<option value="${value}">${label}</option>`).join(''); }
function skills() {
  const rows = [['writing','Uandishi'],['design','Ubunifu'],['teaching','Kufundisha'],['driving','Udereva'],['cooking','Kupika'],['social','Mitandao ya kijamii'],['sales','Mauzo'],['photography','Picha na video'],['beauty','Urembo'],['tech','Teknolojia'],['tailoring','Ushonaji'],['finance','Fedha na kodi'],['farming','Kilimo'],['repair','Matengenezo']];
  return `<fieldset class="swpf-field wide"><legend>Ujuzi ulio nao sasa</legend><div class="swpf-skills">${rows.map(([value,label]) => `<label class="swpf-check"><input type="checkbox" name="skills" value="${value}">${label}</label>`).join('')}</div><small>Usipochagua ujuzi, kila wazo hupewa pointi 20 za uchunguzi wa awali.</small></fieldset>`;
}

const PAGES = [
  {
    id: '50-30-20-budget', route: '/sw/zana/bajeti-50-30-20/', file: 'sw/zana/bajeti-50-30-20/index.html', englishRoute: '/tools/50-30-20-budget/', frenchRoute: '/fr/tools/budget-50-30-20/',
    title: 'Kikokotoo cha Bajeti 50/30/20 Afrika | AfroTools', h1: 'Gawa mapato kwa bajeti ya 50/30/20',
    description: 'Linganisha mapato, mahitaji, matakwa na akiba kwa kanuni ya 50/30/20 bila kubadilisha sarafu au kutuma taarifa.',
    intro: 'Weka mapato halisi na matumizi yako ya sasa. Kanuni hugawa 50% kwa mahitaji, 30% kwa matakwa na 20% kwa akiba au deni la ziada.',
    formTitle: 'Linganisha mgawanyo wako', image: '50-30-20-budget.webp',
    form: `${select('country','Nchi na sarafu ya kuonyesha',countryOptions('50-30-20-budget'),'Nchi hubadilisha alama na msimbo tu; hakuna ubadilishaji wa sarafu.')}${input('income','Mapato halisi ya mwezi',{min:0,step:'any',value:600000,required:true})}${input('currentNeeds','Mahitaji ya sasa',{min:0,step:'any',value:350000,help:'Nyumba muhimu, chakula, huduma, usafiri muhimu na malipo ya chini ya deni.'})}${input('currentWants','Matakwa ya sasa',{min:0,step:'any',value:120000})}${input('currentSavings','Akiba na deni la ziada',{min:0,step:'any',value:80000})}`,
    method: 'Mapato × 0.50, 0.30 na 0.20. Tofauti ni kiasi cha sasa ukitoa lengo. Kanuni haijui gharama zako halisi au vipaumbele vya kaya.',
    sourceName: 'Mafunzo ya bajeti ya Consumer Financial Protection Bureau (CFPB)', sourceUrl: 'https://www.consumerfinance.gov/consumer-tools/educator-tools/youth-financial-education/teach/activities/analyzing-budgets/',
    confidence: 'Juu kwa hesabu; chini kwa kama mgawanyo huu unafaa kaya yako.'
  },
  {
    id: 'album-budget', route: '/sw/zana/bajeti-ya-albamu/', file: 'sw/zana/bajeti-ya-albamu/index.html', englishRoute: '/tools/album-budget/', frenchRoute: '/fr/tools/budget-album-ep/',
    title: 'Mpangaji wa Bajeti ya Albamu, EP au Wimbo Mmoja | AfroTools', h1: 'Panga bajeti ya albamu, EP au wimbo mmoja',
    description: 'Jumlisha kurekodi, kuchanganya na kukamilisha sauti, maudhui ya kuona, usambazaji na utangazaji; pima akiba ya tahadhari na usikilizaji wa kufidia gharama.',
    intro: 'Tumia bei ulizopewa za studio, utayarishaji, maudhui ya kuona na utangazaji. Zana haikadirii bei ya nchi wala mapato ya usikilizaji.', formTitle: 'Jenga bajeti ya mradi wa muziki', image: 'album-budget.webp',
    form: `${select('country','Nchi na sarafu',countryOptions('album-budget'),'Hakuna ubadilishaji wa sarafu.')}${select('projectType','Aina ya mradi wa muziki',optionList([['single','Wimbo mmoja'],['ep','EP'],['album','Albamu']]))}${input('tracks','Idadi ya nyimbo',{min:1,max:20,step:1,value:5,required:true})}${input('studioRate','Bei ya studio kwa saa',{min:0,step:'any',value:10000})}${input('hoursPerTrack','Saa kwa wimbo',{min:0.1,step:'any',value:4})}${input('beatCost','Midundo na ala kwa jumla',{min:0,step:'any',value:50000})}${input('mixCost','Uchanganyaji wa sauti kwa wimbo',{min:0,step:'any',value:15000})}${input('masterCost','Ukamilishaji wa sauti kwa jumla',{min:0,step:'any',value:30000})}${input('coverArt','Mchoro wa jalada',{min:0,step:'any',value:20000})}${input('photoShoot','Upigaji picha wa utangazaji',{min:0,step:'any',value:30000})}${input('musicVideo','Video ya muziki',{min:0,step:'any',value:150000})}${input('distroCost','Usambazaji',{min:0,step:'any',value:10000})}${input('playlistBudget','Uwasilishaji kwa orodha za nyimbo',{min:0,step:'any',value:20000})}${input('adsBudget','Matangazo ya mitandao ya kijamii',{min:0,step:'any',value:50000})}${input('prBudget','PR na vyombo vya habari',{min:0,step:'any',value:30000})}${input('netPerStream','Mapato halisi kwa usikilizaji mmoja',{min:0,step:'any',value:1,help:'Tumia taarifa yako ya mapato; sifuri huacha hesabu ya kufidia gharama wazi.'})}`,
    method: 'Gharama ya kurekodi = bei ya saa × saa kwa wimbo × idadi ya nyimbo. Uchanganyaji = gharama kwa wimbo × idadi ya nyimbo. Jumla ni utayarishaji + maudhui ya kuona + usambazaji na utangazaji. Akiba ya tahadhari ni 10% na 20%.',
    sourceName: 'Maelezo ya mirahaba ya Spotify for Artists', sourceUrl: 'https://support.spotify.com/my-en/artists/article/understanding-spotify-royalties/',
    confidence: 'Juu kwa jumla; chini kwa gharama zijazo na kufidia gharama bila taarifa za mapato na bei ulizopewa.'
  },
  {
    id: 'film-budget', route: '/sw/zana/bajeti-ya-filamu/', file: 'sw/zana/bajeti-ya-filamu/index.html', englishRoute: '/tools/film-budget/', frenchRoute: '/fr/tools/budget-film/',
    title: 'Mpangaji wa Bajeti ya Filamu Afrika | AfroTools', h1: 'Gawa bajeti ya filamu kwa idara',
    description: 'Gawa bajeti ya filamu kwa idara nne, siku za kurekodi, akiba ya tahadhari na pengo la fedha bila kutengeneza makadirio ya faida yasiyo na ushahidi.',
    intro: 'Weka muhtasari wa bajeti, siku za kurekodi, fedha zilizothibitishwa na asilimia za idara. Matokeo yanazuiwa hadi migao iwe 100%.', formTitle: 'Tengeneza muhtasari wa bajeti ya filamu', image: 'film-budget.webp',
    form: `${select('country','Nchi na sarafu',countryOptions('film-budget'),'Hakuna ubadilishaji wa sarafu.')}${select('prodType','Aina ya utayarishaji',optionList([['short','Filamu fupi'],['feature','Filamu ndefu'],['series','Mfululizo wa televisheni'],['web','Mfululizo wa mtandaoni']]))}${input('totalBudget','Bajeti ya jumla',{min:0,step:'any',value:10000000,required:true})}${input('shootDays','Siku za kurekodi',{min:1,step:1,value:20,required:true})}${input('cashSecured','Fedha zilizothibitishwa',{min:0,step:'any',value:6000000,help:'Usihesabu ruzuku, udhamini au mauzo ambayo hayajathibitishwa.'})}${input('contingencyPct','Akiba ya tahadhari (%)',{min:0,max:100,step:'any',value:10})}${input('aboveLinePct','Ubunifu na uongozi (%)',{min:0,max:100,step:'any',value:20})}${input('productionPct','Uzalishaji wa moja kwa moja (%)',{min:0,max:100,step:'any',value:50})}${input('postPct','Uzalishaji baada ya kurekodi (%)',{min:0,max:100,step:'any',value:20})}${input('marketingPct','Uuzaji na uwasilishaji (%)',{min:0,max:100,step:'any',value:10})}`,
    method: 'Kila idara = bajeti × asilimia. Asilimia nne lazima zijumlishe 100%. Bajeti inayohitajika = bajeti + akiba ya tahadhari; pengo huondoa fedha zilizothibitishwa.',
    sourceName: 'Violezo rasmi vya bajeti na mpango wa fedha vya Screen Australia', sourceUrl: 'https://www.screenaustralia.gov.au/resource_subject/budget-template/',
    sourceNote: 'Upatikanaji wa kiungo hiki haujathibitishwa moja kwa moja. Kiungo kisipofunguka, chukulia uhalali wa chanzo kuwa haujathibitishwa; zana itaendelea kutumia kanuni iliyoonyeshwa bila kudai kuwa chanzo kiko hai.',
    confidence: 'Juu kwa mgawanyo; chini kwa utoshelevu bila bei, mikataba, haki na mpango wa utayarishaji.'
  },
  {
    id: 'security-emergency-fund', route: '/sw/zana/mfuko-wa-dharura-wa-usalama/', file: 'sw/zana/mfuko-wa-dharura-wa-usalama/index.html', englishRoute: '/tools/security-emergency-fund/', frenchRoute: '/fr/tools/fonds-d-urgence-et-de-securite/',
    title: 'Kikokotoo cha Mfuko wa Dharura na Usalama | AfroTools', h1: 'Panga mfuko wa dharura na usalama',
    description: 'Kadiria lengo la mfuko wa dharura kutoka matumizi muhimu, miezi, gharama za mara moja, akiba na mchango wako.',
    intro: 'Kanuni haitumii kizidishi cha hatari kilichofichwa. Weka gharama zako halisi na miezi unayotaka kufunika.', formTitle: 'Kokotoa lengo la mfuko', image: 'security-emergency-fund.webp',
    form: `${select('country','Nchi na sarafu',countryOptions('security-emergency-fund'),'Hakuna ubadilishaji wa sarafu.')}${input('monthlyExpenses','Matumizi muhimu ya mwezi',{min:0,step:'any',value:250000,required:true})}${input('targetMonths','Miezi ya kufunika',{min:1,max:24,step:1,value:3,required:true})}${input('oneOffCosts','Gharama za dharura za mara moja',{min:0,step:'any',value:100000})}${input('currentSavings','Akiba ya dharura iliyopo',{min:0,step:'any',value:200000})}${input('monthlyContribution','Mchango wa mwezi',{min:0,step:'any',value:50000})}`,
    method: 'Lengo = matumizi muhimu × miezi + gharama za mara moja. Pengo ni lengo ukitoa akiba, lakini si chini ya sifuri. Muda ni pengo likigawanywa kwa mchango wa mwezi na kuzungushwa juu.',
    sourceName: 'Mwongozo wa mfuko wa dharura wa Consumer Financial Protection Bureau', sourceUrl: 'https://www.consumerfinance.gov/an-essential-guide-to-building-an-emergency-fund/',
    confidence: 'Juu kwa hesabu; chini kwa kiwango sahihi cha ulinzi, upatikanaji wa fedha na hatari zako.'
  },
  {
    id: 'side-hustle-ranker', route: '/sw/zana/orodha-ya-side-hustle/', file: 'sw/zana/orodha-ya-side-hustle/index.html', englishRoute: '/tools/side-hustle-ranker/', frenchRoute: '/fr/tools/classement-d-activites-complementaires/',
    title: 'Kilinganisha Kazi za Ziada kwa Ujuzi, Muda na Mtaji | AfroTools', h1: 'Linganisha kazi za ziada kwa hali yako',
    description: 'Pata orodha fupi ya kazi za ziada kutokana na ujuzi, saa za wiki na kiwango cha mtaji kwa upangaji wa alama ulio wazi wa AfroTools.',
    intro: 'Alama huonyesha ulinganifu wa taarifa ulizoweka pekee. Hazitumii mahitaji ya sasa, bei, mapato, madai ya mifumo au uwezekano wa mafanikio.', formTitle: 'Weka muda, mtaji na ujuzi', image: 'side-hustle-ranker.webp',
    form: `${select('hours','Saa zinazopatikana kwa wiki',optionList([[5,'Saa 5'],[10,'Saa 10'],[20,'Saa 20'],[40,'Saa 40']]))}${select('capital','Kiwango cha mtaji',optionList([[0,'Hakuna mtaji mpya'],[1,'Mtaji mdogo'],[2,'Mtaji wa kati'],[3,'Mtaji mkubwa']]))}${skills()}`,
    method: 'Ujuzi unaolingana = pointi 60; bila ujuzi uliochaguliwa = pointi 20 za uchunguzi. Mtaji = hadi 20; muda = hadi 20. Alama zikifungana, majina ya shughuli hupangwa kialfabeti.',
    sourceName: 'Ufafanuzi wa kanuni ya ndani ya AfroTools', sourceUrl: 'https://afrotools.com/tools/side-hustle-ranker/',
    sourceNote: 'Hiki ni chanzo cha ndani kinachojirejelea, si uthibitisho huru wa soko. Tumia alama kulinganisha ujuzi, muda na mtaji pekee; usizitumie kama ushahidi wa mahitaji au faida.',
    confidence: 'Juu kwa kurudia alama; chini kwa faida kwa sababu hakuna taarifa za mahitaji, bei au mafanikio.'
  }
];

function schema(page) {
  return `<script type="application/ld+json">${JSON.stringify({ '@context':'https://schema.org','@type':'SoftwareApplication',name:page.h1,applicationCategory:'FinanceApplication',operatingSystem:'Web',inLanguage:'sw',url:`https://afrotools.com${page.route}`,image:`https://afrotools.com/assets/img/tools/${page.image}`,isBasedOn:`https://afrotools.com${page.englishRoute}`,offers:{'@type':'Offer',price:'0',priceCurrency:'USD'},featureList:['Hesabu ya ndani','Rasimu ya ndani','TXT','JSON inayofunguka tena','Print/PDF'] }).replace(/</g,'\\u003c')}</script>`;
}
function render(page) {
  return `<!doctype html>
<html lang="sw"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${page.title}</title><meta name="description" content="${page.description}"><meta name="robots" content="index,follow">
<link rel="canonical" href="https://afrotools.com${page.route}"><link rel="alternate" hreflang="sw" href="https://afrotools.com${page.route}"><link rel="alternate" hreflang="en" href="https://afrotools.com${page.englishRoute}"><link rel="alternate" hreflang="fr" href="https://afrotools.com${page.frenchRoute}"><link rel="alternate" hreflang="x-default" href="https://afrotools.com${page.englishRoute}">
<meta property="og:type" content="website"><meta property="og:locale" content="sw_KE"><meta property="og:title" content="${page.h1}"><meta property="og:description" content="${page.description}"><meta property="og:url" content="https://afrotools.com${page.route}"><meta property="og:image" content="https://afrotools.com/assets/img/tools/${page.image}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${page.h1}"><meta name="twitter:description" content="${page.description}"><meta name="twitter:image" content="https://afrotools.com/assets/img/tools/${page.image}">
<link rel="stylesheet" href="/assets/css/design-system.css"><link rel="stylesheet" href="/assets/css/sw-personal-finance.css">${schema(page)}</head>
<body class="swpf-page"><a class="swpf-skip" href="#swpf-form">Ruka hadi kwenye kikokotoo</a><afro-navbar></afro-navbar>
<header class="swpf-hero"><div class="swpf-wrap swpf-hero-grid"><div><nav class="swpf-crumb"><a href="/sw/">Mwanzo</a> / <a href="/sw/zana-zote/">Zana zote</a> / Fedha binafsi</nav><span class="swpf-eyebrow">Fedha binafsi · hesabu ya ndani</span><h1>${page.h1}</h1><p>${page.intro}</p><div class="swpf-badges"><span>Taarifa zinabaki hapa</span><span>Hakuna ubadilishaji wa sarafu</span><span>Hakuna AI katika hesabu</span><span>TXT + JSON</span></div></div><img src="/assets/img/tools/${page.image}" alt="Mchoro maalumu wa ${page.h1}" width="640" height="420"></div></header>
<main class="swpf-wrap swpf-main" data-sw-personal-finance data-app="${page.id}"><div class="swpf-stack"><section class="swpf-card"><h2>${page.formTitle}</h2><p>Weka taarifa zako mwenyewe. Thamani za mwanzo ni mifano ya kujaribu kanuni ya hesabu, si bei au ushauri.</p><form id="swpf-form" data-form novalidate><div class="swpf-fields">${page.form}</div><div class="swpf-actions"><button class="swpf-button primary" type="submit">Kokotoa</button><button class="swpf-button" type="button" data-action="save">Hifadhi rasimu</button><button class="swpf-button" type="button" data-action="restore">Fungua rasimu</button><button class="swpf-button" type="button" data-action="import">Fungua JSON</button><button class="swpf-button" type="button" data-action="reset">Futa</button></div><input class="swpf-visually-hidden" type="file" accept="application/json,.json" data-import aria-label="Fungua nakala rudufu ya JSON"><p class="swpf-status" data-status role="status" aria-live="polite">Hakuna taarifa iliyotumwa.</p></form></section>
<section class="swpf-card swpf-result" data-result hidden aria-live="polite"></section><section class="swpf-card"><h2>Faili za kupakua ndani ya kifaa</h2><p>Kokotoa kwanza. Ukibadilisha sehemu yoyote, matokeo yatafutwa na vitufe vyote vitafungwa hadi ukokotoe tena.</p><div class="swpf-actions"><button class="swpf-button" type="button" data-action="txt" data-export="txt" disabled>Pakua TXT</button><button class="swpf-button" type="button" data-action="json" data-export="json" disabled>Pakua JSON inayofunguka tena</button><button class="swpf-button" type="button" data-action="print" data-export="print" disabled>Chapisha / hifadhi PDF</button></div></section></div>
<aside class="swpf-stack"><section class="swpf-card swpf-source"><h2>Kanuni, chanzo na uhalali wa taarifa</h2><p>${page.method}</p><p><strong>Chanzo:</strong> <a href="${page.sourceUrl}" rel="noopener noreferrer">${page.sourceName}</a></p>${page.sourceNote ? `<p><strong>Hali ya chanzo:</strong> ${page.sourceNote}</p>` : ''}<p><strong>Ilipitiwa:</strong> ${REVIEW_DATE}. Hakuna kiwango cha sasa au bei ya mtoa huduma inayodaiwa.</p><p><strong>Kiwango cha uhakika:</strong> ${page.confidence}</p></section><section class="swpf-card"><h2>Faragha na AI</h2><p>Kiasi, chaguo, rasimu na faili za kupakua hazitumwi kwa AfroTools, AI, Supabase au mfumo wa takwimu za matumizi. Hakuna huduma ya mtandao inayopokea taarifa za sehemu hizi.</p><p>Ukitaka msaada wa kuchagua hatua zinazokufaa, fungua <a href="/sw/ai/" data-shared-ai-handoff>AfroTools AI ya Kiswahili</a>. Taarifa ulizoandika hapa hazitaambatanishwa na kiungo hicho.</p></section><section class="swpf-card swpf-ai"><h2>Mwonekano</h2><label class="swpf-theme">Mpangilio <select data-theme-select aria-label="Chagua mwonekano"><option value="system">Mfumo</option><option value="light">Mwangaza</option><option value="dark">Giza</option></select></label></section></aside></main>
<afro-footer></afro-footer><script src="/assets/js/components/navbar.min.js" defer></script><script src="/assets/js/components/footer.min.js" defer></script><script src="/assets/js/engines/sw-personal-finance.js"></script><script src="/assets/js/pages/sw-personal-finance.js" defer></script><script src="/assets/js/lib/sw-accessibility.js" defer></script></body></html>\n`.replace(' data-import aria-label=', ' data-import tabindex="-1" aria-label=');
}

function main() {
  let failures = 0;
  PAGES.forEach((page) => {
    const target = path.join(ROOT, page.file); const expected = render(page);
    if (CHECK) { if (!fs.existsSync(target) || fs.readFileSync(target,'utf8') !== expected) { console.error(`STALE ${page.file}`); failures += 1; } }
    else { fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, expected); }
  });
  if (failures) process.exitCode = 1; else console.log(`Swahili Personal Finance pages ${CHECK ? 'verified' : 'written'}: ${PAGES.length}`);
}
if (require.main === module) main();
module.exports = { PAGES, render };
