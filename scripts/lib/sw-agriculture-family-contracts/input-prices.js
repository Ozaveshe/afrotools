'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { escapeHtml } = require('../fr-agriculture-page-shell');
const { renderSwahiliAgriculturePage } = require('../sw-agriculture-page-shell');

const ROOT = path.resolve(__dirname, '../../..');
const BEHAVIOR = Object.freeze({
  NG: { fertilizerPerKgDecimals: 0, seedSortStrategy: 'legacy-post-division-fallback' },
  CI: { fertilizerPerKgDecimals: 0, seedSortStrategy: 'legacy-post-division-fallback' },
  CM: { fertilizerPerKgDecimals: 0, seedSortStrategy: 'legacy-post-division-fallback' },
  SN: { fertilizerPerKgDecimals: 0, seedSortStrategy: 'legacy-post-division-fallback' },
  MA: { fertilizerPerKgDecimals: 0, seedSortStrategy: 'legacy-post-division-fallback' }
});
const COUNTRY_NAMES = Object.freeze({ CI: 'Côte d’Ivoire', MA: 'Moroko' });
const CROPS = Object.freeze({
  Almond: 'Lozi', Argan: 'Argan', Banana: 'Ndizi', Barley: 'Shayiri', Beans: 'Maharagwe',
  Cashew: 'Korosho', Cassava: 'Muhogo', Chickpea: 'Njegere', Citrus: 'Machungwa', Cocoa: 'Kakao',
  Coffee: 'Kahawa', 'Common bean': 'Maharagwe ya kawaida', Cotton: 'Pamba', Cowpea: 'Kunde',
  'Date palm': 'Mtende', Enset: 'Enset', Groundnut: 'Karanga', 'Irish potato': 'Viazi mviringo',
  Maize: 'Mahindi', Millet: 'Ulezi', Olive: 'Mzeituni', 'Palm oil': 'Mchikichi', Pepper: 'Pilipili',
  Plantain: 'Ndizi za kupika', Potato: 'Viazi', Rice: 'Mpunga', Rubber: 'Mpira', Sesame: 'Ufuta',
  Sorghum: 'Mtama', Soybean: 'Soya', Sugarbeet: 'Kiazi sukari', Sugarcane: 'Miwa',
  Sunflower: 'Alizeti', Tea: 'Chai', Teff: 'Teff', Tobacco: 'Tumbaku', Tomato: 'Nyanya', Wheat: 'Ngano',
  'Wheat (Planalto)': 'Ngano (Planalto)', 'Wine grape': 'Zabibu za divai', Yam: 'Viazi vikuu'
});
const SEED_TYPES = Object.freeze({
  Certified: 'Mbegu zilizoidhinishwa', 'Certified tuber': 'Kiazi kilichoidhinishwa',
  'Certified tuber seed': 'Mbegu ya kiazi iliyoidhinishwa', GMO: 'GMO', Hybrid: 'Chotara',
  'Hybrid clone': 'Klonu chotara', 'Hybrid, GMO': 'Chotara, GMO', 'Hybrid, IMI': 'Chotara, IMI',
  Improved: 'Iliyoboreshwa', 'Local improved': 'Ya ndani iliyoboreshwa', OPV: 'Aina inayochavushwa wazi'
});
const SEED_NOTES = Object.freeze({
  'Bt + RR trait': 'Sifa za Bt na RR', 'Climate-smart bean variety': 'Aina ya maharagwe inayostahimili mabadiliko ya tabianchi',
  'Dry zone variety': 'Aina ya maeneo makavu', 'Farmer-saved seed possible': 'Inaweza kuhifadhiwa na mkulima kwa msimu ujao',
  'High yield, drought-tolerant': 'Mavuno mengi na hustahimili ukame', 'High-yielding teff variety': 'Aina ya teff yenye mavuno mengi',
  "Kenya's most popular maize hybrid": 'Chotara ya mahindi inayopandwa sana Kenya', 'Locally bred': 'Imezalishwa nchini',
  'Main durum wheat variety': 'Aina kuu ya ngano durum', 'Most popular Ethiopian maize hybrid': 'Chotara ya mahindi inayopandwa sana Ethiopia',
  'Most popular groundnut variety': 'Aina ya karanga inayopandwa sana', 'Most widely planted variety': 'Aina inayopandwa kwa wingi zaidi',
  'Quality protein maize': 'Mahindi yenye protini bora'
});
const CHEMICAL_TYPES = Object.freeze({
  Fungicide: 'Dawa ya kuua kuvu', Herbicide: 'Dawa ya kuua magugu', Insecticide: 'Dawa ya kuua wadudu',
  'Seed treatment': 'Dawa ya kutibu mbegu'
});
const SUBSIDY_COPY = Object.freeze({
  NG: ['Wakulima waliosajiliwa katika mfumo wa pochi-elektroniki wa ADP ya jimbo lao.', 'Usambazaji hufanywa kupitia programu za maendeleo ya kilimo za majimbo; thibitisha masharti kwa wizara ya kilimo ya jimbo.'],
  KE: ['Wakulima wadogo wanaonunua katika maghala ya National Cereals and Produce Board.', 'CAN na DAP zenye ruzuku hutegemea akiba ya msimu katika maghala ya NCPB.'],
  ZA: ['Hakuna ruzuku ya moja kwa moja ya pembejeo; CASP hulenga zaidi miundombinu na mafunzo.', 'Ufadhili wa Land Bank na misaada ya CASP ya mikoa inaweza kupatikana kulingana na wasifu wa shamba.'],
  GH: ['Wakulima wadogo waliosajiliwa kwa Ghana Card.', 'PFJ hutoa ruzuku kwa baadhi ya mbolea na mbegu; jisajili katika kitengo cha kilimo cha wilaya.'],
  EG: ['Wakulima waliosajiliwa wenye hati za ardhi, ndani ya kikomo cha programu.', 'Urea na superphosphate zenye ruzuku husambazwa kupitia vyama vya ushirika vya kilimo; kitambulisho na nyaraka za ardhi huhitajika.'],
  ET: ['Wakulima wadogo wanaopitia vyama vya ushirika na maafisa wa maendeleo.', 'DAP na urea husambazwa na miungano ya vyama vya ushirika chini ya programu ya ATA.'],
  TZ: ['Wakulima wadogo waliosajiliwa katika ofisi ya kilimo ya kata.', 'Vocha za msimu zinaweza kujumuisha DAP, urea na mbegu za mahindi; thibitisha kwa afisa kilimo wa kata.'],
  UG: ['Vikundi vya wakulima vilivyosajiliwa chini ya Parish Development Model.', 'Usambazaji kupitia Operation Wealth Creation na msaada wa PDM hutegemea masharti ya eneo husika.'],
  RW: ['Wanachama wa vyama vya ushirika vya kilimo vilivyoidhinishwa wanaotumia SACCO.', 'DAP na urea zenye ruzuku husambazwa kupitia SACCO za kilimo; jisajili katika ofisi ya kilimo ya sekta.'],
  CI: ['Wazalishaji wa kakao na kahawa waliosajiliwa.', 'Msaada wa mbolea hulenga kakao na kahawa; kwa mazao mengine, thibitisha fursa za mkopo kwa ANADER.'],
  CM: ['Wakulima wadogo waliosajiliwa kupitia kikundi cha mpango wa pamoja.', 'MINADER husambaza kupitia vyama vya ushirika; SODECOTON ina mipango maalumu kwa wakulima wa mikataba.'],
  SN: ['Wakulima waliosajiliwa katika maeneo ya kilimo yanayolengwa.', 'NPK na urea zenye ruzuku husambazwa kupitia mashirika ya wakulima na ofisi za kikanda za maendeleo ya vijijini.'],
  MA: ['Mashamba madogo yaliyosajiliwa katika ofisi za kikanda za maendeleo ya kilimo.', 'Mipango ya ununuzi wa pamoja na bei zilizopunguzwa hutegemea ORMVA na programu za kitaifa; thibitisha eneo lako.'],
  TN: ['Wakulima waliosajiliwa katika kanzidata ya ofisi ya kikanda ya maendeleo ya kilimo.', 'FOSDAP husaidia baadhi ya mbegu zilizoidhinishwa na mbolea kupitia ofisi za kikanda.'],
  AO: ['Wakulima wadogo waliosajiliwa katika huduma za MINAGRIP za mkoa.', 'Programu ya vijijini hulenga baadhi ya mikoa; upatikanaji hutofautiana sana kulingana na mnyororo wa ugavi wa eneo.']
});
const SUBSIDY_NAMES = Object.freeze({
  NG: 'Mpango wa Mbolea wa Rais (PFI) / pochi-elektroniki', KE: 'Mbolea yenye ruzuku kupitia NCPB',
  ZA: 'CASP / Mpango Mpana wa Msaada wa Kilimo', GH: 'Planting for Food and Jobs (PFJ)',
  EG: 'Programu ya Ruzuku ya Mbolea ya Misri', ET: 'Programu ya Pembejeo ya Agricultural Transformation Agency (ATA)',
  TZ: 'Mpango wa Kitaifa wa Vocha za Pembejeo za Kilimo (NAIVS)', UG: 'Operation Wealth Creation (OWC) / PDM',
  RW: 'Ruzuku ya Pembejeo ya Rwanda Agricultural Board (RAB)', CI: 'Conseil Café-Cacao — ruzuku ya mbolea',
  CM: 'Programu ya Ruzuku ya Pembejeo ya MINADER', SN: 'PRACAS / Programu ya Kuharakisha Kilimo cha Senegali',
  MA: 'Plan Maroc Vert — ruzuku ya pembejeo', TN: 'Programu ya msaada wa pembejeo za kilimo (FOSDAP)',
  AO: 'MINAGRIP — Programu ya Kitaifa ya Maendeleo ya Vijijini'
});
const SOURCE_COPY = Object.freeze({
  AO: 'MINAGRIP Angola — ripoti za usambazaji wa pembejeo; IIA (Instituto de Investigação Agronómica); na FAOSTAT Angola.',
  CM: 'MINADER Kameruni — ripoti za usambazaji wa pembejeo; kituo cha utafiti wa mazao cha IRAD; na ripoti za mwaka za SODECOTON.',
  CI: 'Conseil Café-Cacao Côte d’Ivoire; tafiti za bei za pembejeo za CNRA; data ya huduma za ugani ya ANADER; na ripoti za nchi za FAO.',
  EG: 'Wizara ya Kilimo na Ustawishaji Ardhi ya Misri (MALR); taarifa za utoaji wa aina za ARC; na tafiti za bei za CAPMAS.',
  ET: 'Wizara ya Kilimo ya Ethiopia; ripoti za bei za pembejeo za ATA (Agricultural Transformation Agency); na taarifa za aina za EIAR.',
  GH: 'Taarifa za bei za pembejeo za MOFA Ghana; ripoti za ubora wa mbegu za GAEC; data ya usambazaji wa mbolea ya COCOBOD; na ripoti za nchi za FAO.',
  KE: 'Wizara ya Kilimo na Maendeleo ya Mifugo ya Kenya; taarifa za bei za KALRO; tafiti za soko za NCPB; na ripoti za AFA.',
  MA: 'Tafiti za bei za pembejeo za kilimo za ONCA Moroko; bei zilizochapishwa na OCP Group; data ya aina za INRA Moroko; na ripoti za ORMVA.',
  NG: 'Wizara ya Shirikisho ya Kilimo na Usalama wa Chakula (FMAFS); tafiti za bei za NASC; AgroMonitor Nigeria; na ripoti za nchi za FAO.',
  RW: 'Data ya uimarishaji wa mazao ya RAB Rwanda; ripoti za sekta za MINAGRI Rwanda; na tafiti za pembejeo za kahawa na chai za NAEB.',
  SN: 'Direction de l’Agriculture Sénégal; tafiti za bei za mbegu za ISRA; kumbukumbu za usambazaji za DRDR; na ripoti za nchi za FAO.',
  ZA: 'Makadirio ya mazao ya DAFF Afrika Kusini; tafiti za bei za pembejeo za Grain SA; SACGA; na orodha za bei zilizochapishwa na Omnia/Sasol.',
  TZ: 'Wizara ya Kilimo ya Tanzania; kumbukumbu za uzalishaji wa mbegu za TARI; na tafiti za pembejeo za AGRA Tanzania.',
  TN: 'Taarifa za aina za INRAT Tunisia; bei za mbolea za GCT; kumbukumbu za usambazaji za CRDA; na takwimu za kilimo za ONAGRI.',
  UG: 'Tafiti za bei za pembejeo za MAAIF Uganda; ripoti za mifumo ya mbegu za NARO; na data ya programu za AGRA Uganda.'
});
const SOURCE_TOKENS = Object.freeze({
  AO: ['MINAGRIP', 'IIA', 'FAOSTAT'], CM: ['MINADER', 'IRAD', 'SODECOTON'], CI: ['Conseil Café-Cacao', 'CNRA', 'ANADER', 'FAO'],
  EG: ['MALR', 'ARC', 'CAPMAS'], ET: ['Ministry of Agriculture', 'ATA', 'EIAR'], GH: ['MOFA', 'GAEC', 'COCOBOD', 'FAO'],
  KE: ['Ministry of Agriculture', 'KALRO', 'NCPB', 'AFA'], MA: ['ONCA', 'OCP', 'INRA', 'ORMVA'],
  NG: ['FMAFS', 'NASC', 'AgroMonitor', 'FAO'], RW: ['RAB', 'MINAGRI', 'NAEB'], SN: ['Direction de l\'Agriculture', 'ISRA', 'DRDR', 'FAO'],
  ZA: ['DAFF', 'Grain SA', 'SACGA', 'Omnia/Sasol'], TZ: ['Ministry of Agriculture', 'TARI', 'AGRA'],
  TN: ['INRAT', 'GCT', 'CRDA', 'ONAGRI'], UG: ['MAAIF', 'NARO', 'AGRA']
});
const DATA_REVIEWED = 'robo ya kwanza ya 2026';
const CONFIDENCE = 'Rejea ya kupanga yenye uhakika wa kati; bei, akiba, ubora na masharti ya ruzuku hubadilika kwa eneo na msimu.';
const FAO_FERTILIZER_URL = 'https://www.fao.org/in-focus/fertilizer/en';

function behaviorFor(code) { return BEHAVIOR[code] || { fertilizerPerKgDecimals: 1, seedSortStrategy: 'pack-fallback-25' }; }
function countryName(row) { return COUNTRY_NAMES[row.country.code] || row.country.swahiliName; }
function decodeHtml(value) {
  return String(value || '').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}
function sourceMetadata(row) {
  const html = fs.readFileSync(path.join(ROOT, row.english.file), 'utf8');
  const match = html.match(/<p class="sources">([\s\S]*?)<\/p>/i);
  if (!match) throw new Error(`${row.english.file} has no complete input-price source block.`);
  const complete = decodeHtml(match[1]);
  for (const token of SOURCE_TOKENS[row.country.code] || []) {
    if (!complete.includes(token)) throw new Error(`${row.english.file} source block is missing ${token}.`);
  }
  if (!/Q1 2026/.test(complete)) throw new Error(`${row.english.file} source block has no Q1 2026 freshness.`);
  return { complete, source: SOURCE_COPY[row.country.code], dataReviewed: DATA_REVIEWED };
}
function options(values) { return Object.entries(values).map(([value, label]) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`).join(''); }
function trustBlock(row, hub) {
  const source = hub
    ? `<a href="${FAO_FERTILIZER_URL}" target="_blank" rel="noopener">Rasilimali za mbolea za FAO</a> na vyanzo vya nchi vilivyoorodheshwa kwenye kila programu.`
    : escapeHtml(sourceMetadata(row).source);
  return `<section class="card"><h2>Vyanzo, upya na kiwango cha uhakika</h2><div class="trust-grid"><div class="trust-item"><strong>Vyanzo vilivyotajwa</strong><span>${source}</span></div><div class="trust-item"><strong>Upya</strong><span>Bei zilizohifadhiwa zimepitiwa kwa ${DATA_REVIEWED}; si data ya moja kwa moja.</span></div><div class="trust-item"><strong>Kiwango cha uhakika</strong><span>${CONFIDENCE}</span></div></div><p>Thibitisha bei, ubora, kiasi, akiba na ustahiki wa ruzuku kwa muuzaji au huduma ya kilimo husika. Matokeo si nukuu ya bei wala ushauri wa kilimo.</p><p><strong>Faragha:</strong> ${hub ? 'ukurasa huu ni orodha tu na haukusanyi ingizo.' : 'hesabu na faili hutengenezwa kwenye kivinjari hiki; hakuna ingizo linalotumwa kwa seva.'}</p><p><strong>AI:</strong> Njia hii ya bei za pembejeo inaweza kufunguliwa na msaidizi wa AfroTools, ambaye lazima aombe idhini kabla ya kutuma maudhui kwa modeli.</p></section>`;
}

function renderHub(row, context = {}) {
  const countries = (context.familyRows || []).filter(item => item.country).sort((a, b) => countryName(a).localeCompare(countryName(b), 'sw'));
  if (countries.length !== 15) throw new Error(`Input Prices hub requires 15 manifest countries; found ${countries.length}.`);
  return renderSwahiliAgriculturePage({
    row, title: 'Bei za pembejeo za kilimo kwa nchi | AfroTools',
    description: 'Chagua nchi ili kulinganisha bei zilizohifadhiwa za mbolea, mbegu na viuatilifu kwa sarafu ya nchi hiyo.',
    heading: 'Kilinganisha bei za pembejeo za kilimo',
    lead: 'Chagua mojawapo ya nchi 15 kutumia bidhaa, bei, sarafu na masharti ya ruzuku yaliyohifadhiwa kwa nchi hiyo.',
    artwork: row.artwork.file,
    body: `<style>.card,.country-list a{border-color:#64748b}.country-list a:focus,.country-list a:focus-visible{outline:3px solid #075eb8;outline-offset:3px}html[data-theme="dark"] .card{border-color:#9fb0c7}html[data-theme="dark"] .country-list a:focus,html[data-theme="dark"] .country-list a:focus-visible{outline-color:#75b8ff}@media(prefers-color-scheme:dark){html[data-theme="system"] .card{border-color:#9fb0c7}html[data-theme="system"] .country-list a:focus,html[data-theme="system"] .country-list a:focus-visible{outline-color:#75b8ff}}</style><section class="card"><h2>Chagua nchi</h2><ul class="country-list">${countries.map(item => `<li><a href="${escapeHtml(item.swahili.route)}">${escapeHtml(countryName(item))}</a></li>`).join('')}</ul></section>${trustBlock(row, true)}`,
    scripts: '', pageConfig: { id: row.english.id, aiRouteId: row.english.id },
    familyLabel: 'Bei za pembejeo', familyRoute: row.swahili.route, currentLabel: 'Chagua nchi'
  });
}

function render(row, context = {}) {
  if (!row.country) return renderHub(row, context);
  const localizedCountryName = countryName(row);
  const source = sourceMetadata(row);
  const config = {
    id: row.english.id, aiRouteId: row.english.id, countryCode: row.country.code, countryName: localizedCountryName,
    locale: 'sw', behavior: behaviorFor(row.country.code), crops: CROPS, seedTypes: SEED_TYPES,
    seedNotes: SEED_NOTES, chemicalTypes: CHEMICAL_TYPES, subsidyCopy: SUBSIDY_COPY[row.country.code],
    subsidyName: SUBSIDY_NAMES[row.country.code],
    sourceLabel: source.source, dataReviewed: source.dataReviewed, confidence: CONFIDENCE,
    storageKey: 'afrotools:sw-agriculture:input-prices'
  };
  const body = `<style>.input-prices-mobile{display:none;gap:10px}.input-price-card{border:1px solid #64748b;border-radius:10px;padding:14px;min-width:0}.input-price-card strong,.input-price-card span{display:block;overflow-wrap:anywhere}.input-price-card span{color:var(--agri-muted);margin-top:5px}.input-price-card.cheapest{border-color:var(--agri-good)}.input-prices-app .field input,.input-prices-app .field select,.input-prices-app .action{border-color:#64748b}.input-prices-app :is(a,button,input,select):focus,.input-prices-app :is(a,button,input,select):focus-visible{outline:3px solid #075eb8;outline-offset:3px}.input-prices-app .action:disabled{opacity:.55;cursor:not-allowed}#subsidyBox{overflow-wrap:anywhere}html[data-theme="dark"] .input-price-card,html[data-theme="dark"] .input-prices-app .field input,html[data-theme="dark"] .input-prices-app .field select,html[data-theme="dark"] .input-prices-app .action{border-color:#9fb0c7}html[data-theme="dark"] .input-prices-app :is(a,button,input,select):focus,html[data-theme="dark"] .input-prices-app :is(a,button,input,select):focus-visible{outline-color:#75b8ff}@media(prefers-color-scheme:dark){html[data-theme="system"] .input-price-card,html[data-theme="system"] .input-prices-app .field input,html[data-theme="system"] .input-prices-app .field select,html[data-theme="system"] .input-prices-app .action{border-color:#9fb0c7}html[data-theme="system"] .input-prices-app :is(a,button,input,select):focus,html[data-theme="system"] .input-prices-app :is(a,button,input,select):focus-visible{outline-color:#75b8ff}}@media(max-width:480px){.input-prices-table{display:none}.input-prices-mobile{display:grid}}</style><div class="input-prices-app">
<section class="card"><h2>Linganisha pembejeo</h2><form id="inputPricesForm" novalidate><div class="grid"><div class="field"><label for="inputType">Kundi la pembejeo</label><select id="inputType"><option value="all">Pembejeo zote</option><option value="fertilizers">Mbolea</option><option value="seeds">Mbegu</option><option value="agrochemicals">Viuatilifu</option></select></div><div class="field" id="cropField"><label for="cropSel">Zao <small>(huchuja mbegu)</small></label><select id="cropSel"><option value="">Mazao yote</option></select></div><div class="field"><label for="farmSize">Ukubwa wa shamba (ha)</label><input id="farmSize" type="number" min="0.1" max="100000" step="0.1" value="2" inputmode="decimal"></div><div class="field"><label for="priceType">Aina ya bei</label><select id="priceType"><option value="market">Bei ya soko</option><option value="subsidized">Bei yenye ruzuku, ikipatikana</option></select></div></div><div class="actions"><button class="action primary" type="submit">Linganisha bei</button><button class="action" type="reset">Weka upya</button></div><p class="error" id="formError" role="alert" aria-live="assertive"></p></form></section>
<section class="card"><h2>Matokeo</h2><div class="empty" id="emptyState">Bado hujalinganisha bei.</div><div id="resultPanel" class="result-panel" tabindex="-1" aria-live="polite" hidden><section id="fertCard"><h3>Mbolea</h3><div class="table-wrap input-prices-table"><table class="data-table" id="fertTable"></table></div><div id="fertMobile" class="input-prices-mobile" aria-label="Bei za mbolea"></div></section><section id="seedCard"><h3>Mbegu</h3><p class="status" id="seedStatus" role="status"></p><div class="table-wrap input-prices-table"><table class="data-table" id="seedTable"></table></div><div id="seedMobile" class="input-prices-mobile" aria-label="Bei za mbegu"></div></section><section id="chemCard"><h3>Viuatilifu</h3><div class="table-wrap input-prices-table"><table class="data-table" id="chemTable"></table></div><div id="chemMobile" class="input-prices-mobile" aria-label="Bei za viuatilifu"></div></section><div class="result-grid" id="budgetGrid"></div><p id="premiumSummary"></p><div id="subsidyBox"></div><div class="actions"><button class="action" type="button" data-result-action="copy" disabled>Nakili</button><button class="action" type="button" data-result-action="share" disabled>Shiriki</button><button class="action" type="button" data-result-action="save" disabled>Hifadhi kwenye kivinjari</button><button class="action" type="button" data-result-action="pdf" disabled>Pakua PDF</button><button class="action" type="button" data-result-action="csv" disabled>Pakua CSV</button><button class="action" type="button" data-result-action="json" disabled>Pakua JSON</button><button class="action" type="button" data-result-action="txt" disabled>Pakua TXT</button></div><p class="status" id="actionStatus" role="status" aria-live="polite"></p></div></section>${trustBlock(row, false)}</div>`;
  const scripts = `<script src="/data/agriculture/input-prices-data.js"></script><script src="/engines/input-prices-engine.js"></script><script src="/assets/vendor/jspdf/jspdf.umd.min.js"></script><script src="/assets/js/pages/sw-agriculture-input-prices.js"></script>`;
  return renderSwahiliAgriculturePage({
    row, title: `Bei za pembejeo za kilimo - ${localizedCountryName} | AfroTools`,
    description: `Linganisha bei zilizohifadhiwa za mbolea, mbegu na viuatilifu kwa ${localizedCountryName}.`,
    heading: `Bei za pembejeo - ${localizedCountryName}`,
    lead: `Tumia bidhaa, bei, sarafu na masharti ya ruzuku yaliyohifadhiwa kwa ${localizedCountryName}.`,
    artwork: row.artwork.file, body, scripts, pageConfig: config, countryName: localizedCountryName,
    familyLabel: 'Bei za pembejeo', familyRoute: '/sw/zana/kilinganisha-bei-za-pembejeo/'
  });
}

module.exports = {
  id: 'input-prices', BEHAVIOR, COUNTRY_NAMES, CROPS, SEED_TYPES, SEED_NOTES, CHEMICAL_TYPES,
  SUBSIDY_COPY, SUBSIDY_NAMES, SOURCE_COPY, SOURCE_TOKENS, DATA_REVIEWED, CONFIDENCE, FAO_FERTILIZER_URL,
  behaviorFor, countryName, decodeHtml, sourceMetadata, renderHub, render
};
