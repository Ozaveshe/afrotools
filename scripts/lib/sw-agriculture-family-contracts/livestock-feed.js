'use strict';

const { escapeHtml } = require('../fr-agriculture-page-shell');
const { renderSwahiliAgriculturePage } = require('../sw-agriculture-page-shell');

const ANIMALS = Object.freeze({ cattle: 'Ng\'ombe', goat: 'Mbuzi', sheep: 'Kondoo' });
const CLASSES = Object.freeze({
  dairy_lactating_high: 'Ng\'ombe wa maziwa - uzalishaji mkubwa (zaidi ya lita 15 kwa siku)',
  dairy_lactating_medium: 'Ng\'ombe wa maziwa - uzalishaji wa kati (lita 8-15 kwa siku)',
  dairy_lactating_low: 'Ng\'ombe wa maziwa - uzalishaji mdogo (chini ya lita 8 kwa siku)',
  dairy_dry: 'Ng\'ombe wa maziwa - kipindi kisicho cha kukamuliwa',
  dairy_dry_late: 'Ng\'ombe wa maziwa - hatua ya mwisho ya mimba',
  beef_growing_young: 'Ng\'ombe wa nyama - anakua (miezi 6-12)',
  beef_growing_older: 'Ng\'ombe wa nyama - anakua (miezi 12-24)',
  beef_fattening: 'Ng\'ombe wa nyama - kunenepeshwa',
  beef_maintenance: 'Ng\'ombe wa nyama - matunzo au kiangazi',
  calf_pre_weaning: 'Ndama - kabla ya kuachishwa kunyonya',
  bull_breeding: 'Fahali wa kuzalisha',
  doe_lactating: 'Mbuzi jike anayenyonyesha',
  doe_dry: 'Mbuzi jike asiyenyonyesha',
  doe_pregnant_late: 'Mbuzi jike - hatua ya mwisho ya mimba',
  buck_breeding: 'Mbuzi dume wa kuzalisha',
  kid_growing: 'Mwana-mbuzi anayekua',
  ewe_lactating: 'Kondoo jike anayenyonyesha',
  ewe_dry: 'Kondoo jike asiyenyonyesha',
  ewe_pregnant_late: 'Kondoo jike - hatua ya mwisho ya mimba',
  ram_breeding: 'Kondoo dume wa kuzalisha',
  lamb_growing: 'Mwana-kondoo anayekua',
  fattening: 'Kunenepeshwa',
  maintenance: 'Matunzo',
});
const INGREDIENTS = Object.freeze({
  maize_grain: 'Mahindi yaliyopondwa', maize_bran: 'Pumba za mahindi', wheat_bran: 'Pumba za ngano',
  rice_bran: 'Pumba za mpunga', sorghum_grain: 'Nafaka ya mtama', millet_grain: 'Nafaka ya uwele',
  cassava_chips: 'Vipande vya mihogo vilivyokaushwa', cassava_peel: 'Maganda ya mihogo yaliyokaushwa',
  molasses: 'Molasi ya miwa', brewers_grain: 'Mabaki mabichi ya kutengeneza bia',
  cottonseed_cake: 'Mashudu ya pamba', groundnut_cake: 'Mashudu ya karanga', soybean_meal: 'Mashudu ya soya',
  sunflower_cake: 'Mashudu ya alizeti', palm_kernel_cake: 'Mashudu ya kokwa za mawese', fish_meal: 'Unga wa samaki',
  blood_meal: 'Unga wa damu', leucaena_leaf: 'Unga wa majani ya lusina', moringa_leaf: 'Unga wa majani ya mlonge',
  noug_cake: 'Mashudu ya noug', napier_grass: 'Majani mabichi ya Napier', rhodes_grass_hay: 'Nyasi kavu ya Rhodes',
  maize_stover: 'Masalia ya mahindi', rice_straw: 'Majani makavu ya mpunga',
  sweet_potato_vines: 'Majani na mashina ya viazi vitamu', cowpea_haulm: 'Masalia ya kunde',
  groundnut_haulm: 'Masalia ya karanga', lucerne_hay: 'Nyasi kavu ya luseni', teff_straw: 'Majani makavu ya teff',
  berseem_hay: 'Nyasi kavu ya berseem', cereal_straw: 'Majani makavu ya nafaka', bone_meal: 'Unga wa mifupa',
  limestone: 'Chokaa ya kulishia', dcp: 'Fosfati ya dikalsiamu (DCP)', salt: 'Chumvi ya kawaida',
  urea: 'Urea ya malisho - kwa wanyama wanaocheua pekee',
});
const CATEGORIES = Object.freeze({
  energy: 'Nishati', protein: 'Protini', roughage: 'Malisho yenye nyuzinyuzi', mineral: 'Madini', additive: 'Kiungio',
});
const COUNTRY_NAMES = Object.freeze({ MA: 'Moroko' });

const SOURCE_LABEL = 'Masafa ya mahitaji yaliyorekebishwa kutoka marejeo ya NRC, mwongozo wa FAO kuhusu uzalishaji na mifumo ya malisho, na bei tuli za kupanga zilizohifadhiwa kwa nchi';
const DATA_REVIEWED = 'bei tuli zilizopitiwa kwa rejea za 2024-2025';

function optionList(values) {
  return Object.entries(values).map(([value, label]) => (
    `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`
  )).join('');
}
function countryName(row) {
  return COUNTRY_NAMES[row.country.code] || row.country.swahiliName;
}

function trustBlock(row, hub) {
  return `<section class="card"><h2>Chanzo, upya na kiwango cha uhakika</h2><div class="trust-grid"><div class="trust-item"><strong>Chanzo</strong><span>Mahitaji ya virutubisho ya NRC na <a href="https://www.fao.org/animal-production/en" target="_blank" rel="noopener">FAO - uzalishaji na malisho ya mifugo</a>; bei za nchi ni marejeo ya kupanga yanayoweza kubadilishwa.</span></div><div class="trust-item"><strong>Upya</strong><span>${DATA_REVIEWED}; si data ya moja kwa moja.</span></div><div class="trust-item"><strong>Kiwango cha uhakika</strong><span>Makadirio ya kupanga. Ubora wa malisho, unyevu, afya, uzalishaji, bei na ushauri wa kitaalamu vinaweza kubadilisha mgao.</span></div></div><p><strong>Faragha:</strong> ${hub ? 'ukurasa huu ni orodha ya nchi na hautumi ingizo lolote.' : 'hesabu na faili hutengenezwa kwenye kivinjari hiki; hakuna ingizo linalotumwa kwa seva.'}</p><p><strong>AI:</strong> kitambulisho cha njia ni <code>${escapeHtml(row.english.id)}</code>. Msaidizi wa AfroTools ni wa hiari na lazima aombe idhini kabla ya kutuma maudhui kwa modeli.</p></section>`;
}

function renderHub(row, context = {}) {
  const countries = (context.familyRows || []).filter(item => item.country)
    .sort((a, b) => countryName(a).localeCompare(countryName(b), 'sw'));
  if (countries.length !== 15) throw new Error(`Livestock Feed hub requires 15 manifest countries; found ${countries.length}.`);
  return renderSwahiliAgriculturePage({
    row,
    title: 'Kikokotoo cha chakula cha mifugo kwa nchi | AfroTools',
    description: 'Chagua nchi na panga mgao wa ng\'ombe, mbuzi au kondoo kwa viambato, bei na sarafu zilizohifadhiwa kwa nchi hiyo.',
    heading: 'Kikokotoo cha chakula cha mifugo',
    lead: 'Chagua mojawapo ya nchi 15 ili kukadiria malisho makavu, protini, TDN na gharama kwa sarafu ya nchi.',
    artwork: row.artwork.file,
    body: `<style>.card,.country-list a{border-color:#64748b}.country-list a:focus,.country-list a:focus-visible{outline:3px solid #075eb8;outline-offset:3px}html[data-theme="dark"] .card{border-color:#9fb0c7}html[data-theme="dark"] .country-list a:focus,html[data-theme="dark"] .country-list a:focus-visible{outline-color:#75b8ff}@media(prefers-color-scheme:dark){html[data-theme="system"] .card{border-color:#9fb0c7}html[data-theme="system"] .country-list a:focus,html[data-theme="system"] .country-list a:focus-visible{outline-color:#75b8ff}}</style><section class="card"><h2>Chagua nchi</h2><ul class="country-list">${countries.map(item => `<li><a href="${escapeHtml(item.swahili.route)}">${escapeHtml(countryName(item))}</a></li>`).join('')}</ul></section>${trustBlock(row, true)}`,
    scripts: '',
    pageConfig: { id: row.english.id, aiRouteId: row.english.id },
    familyLabel: 'Chakula cha mifugo', familyRoute: row.swahili.route, currentLabel: 'Chagua nchi',
  });
}

function render(row, context = {}) {
  if (!row.country) return renderHub(row, context);
  const localizedCountryName = countryName(row);
  const config = {
    id: row.english.id, aiRouteId: row.english.id, countryCode: row.country.code, countryName: localizedCountryName,
    locale: 'sw', animals: ANIMALS, classes: CLASSES, ingredients: INGREDIENTS, categories: CATEGORIES,
    sourceLabel: SOURCE_LABEL, dataReviewed: DATA_REVIEWED,
    storageKey: 'afrotools:sw-agriculture:livestock-feed',
  };
  const body = `<style>.feed-app .field input,.feed-app .field select,.feed-app .action{border-color:#64748b}.feed-app .field select{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.feed-app :is(a,button,input,select):focus,.feed-app :is(a,button,input,select):focus-visible{outline:3px solid #075eb8;outline-offset:3px}html[data-theme="dark"] .feed-app .field input,html[data-theme="dark"] .feed-app .field select,html[data-theme="dark"] .feed-app .action{border-color:#9fb0c7}html[data-theme="dark"] .feed-app :is(a,button,input,select):focus,html[data-theme="dark"] .feed-app :is(a,button,input,select):focus-visible{outline-color:#75b8ff}@media(prefers-color-scheme:dark){html[data-theme="system"] .feed-app .field input,html[data-theme="system"] .feed-app .field select,html[data-theme="system"] .feed-app .action{border-color:#9fb0c7}html[data-theme="system"] .feed-app :is(a,button,input,select):focus,html[data-theme="system"] .feed-app :is(a,button,input,select):focus-visible{outline-color:#75b8ff}}</style><div class="feed-app">
<section class="card"><h2>Weka taarifa za mifugo</h2><form id="feedForm" novalidate><div class="grid"><div class="field"><label for="animal">Aina ya mnyama</label><select id="animal">${optionList(ANIMALS)}</select></div><div class="field"><label for="animalClass">Hatua au lengo la uzalishaji</label><select id="animalClass"></select></div><div class="field"><label for="weight">Uzito hai wa kila mnyama (kg)</label><input id="weight" type="number" min="1" max="2000" step="1" value="300" inputmode="decimal"></div><div class="field"><label for="number">Idadi ya wanyama</label><input id="number" type="number" min="1" max="10000" step="1" value="1" inputmode="numeric"></div><div class="field"><label for="budget">Bajeti ya juu kwa mnyama kwa siku (si lazima)</label><input id="budget" type="number" min="0" step="0.01" value="0" inputmode="decimal"></div></div><fieldset><legend>Viambato vinavyopatikana</legend><p>Viambato vyenye bei iliyohifadhiwa kwa nchi hii huchaguliwa awali. Bei ya sifuri inaonyesha rejea ya rasilimali inayopatikana bila gharama ya ununuzi.</p><div id="ingredients" class="grid"></div></fieldset><div class="actions"><button class="action primary" type="submit">Panga mgao</button><button class="action" type="reset">Weka upya</button></div><p class="error" id="formError" role="alert" aria-live="assertive"></p></form></section>
<section class="card"><h2>Matokeo</h2><div class="empty" id="emptyState">Bado hujapanga mgao.</div><div class="result-panel" id="resultPanel" tabindex="-1" aria-live="polite" hidden><div class="result-hero"><div class="result-value" id="dailyCost">-</div><div>Gharama kwa mnyama kwa siku</div></div><div class="result-grid"><div class="metric"><strong id="dmi">-</strong><span>Malisho makavu</span></div><div class="metric"><strong id="protein">-</strong><span>Protini iliyotolewa / inayohitajika</span></div><div class="metric"><strong id="tdn">-</strong><span>TDN iliyotolewa / inayohitajika</span></div><div class="metric"><strong id="monthly">-</strong><span>Gharama ya kundi kwa mwezi</span></div><div class="metric"><strong id="annual">-</strong><span>Gharama ya kundi kwa mwaka</span></div><div class="metric"><strong id="alternative">-</strong><span>Mbadala kwa mnyama kwa siku</span></div></div><h3>Mgao wa kila siku</h3><ul id="ration"></ul><p id="balance"></p><p id="schedule"></p><div class="actions"><button class="action" type="button" data-result-action="copy" disabled>Nakili</button><button class="action" type="button" data-result-action="share" disabled>Shiriki</button><button class="action" type="button" data-result-action="save" disabled>Hifadhi kwenye kivinjari</button><button class="action" type="button" data-result-action="pdf" disabled>Pakua PDF</button><button class="action" type="button" data-result-action="csv" disabled>Pakua CSV</button><button class="action" type="button" data-result-action="json" disabled>Pakua JSON</button><button class="action" type="button" data-result-action="txt" disabled>Pakua TXT</button></div><p class="status" id="actionStatus" role="status" aria-live="polite"></p></div></section>${trustBlock(row, false)}</div>`;
  const scripts = `<script src="/data/agriculture/livestock-feed-data.js"></script><script src="/engines/livestock-feed-engine.js"></script><script src="/assets/vendor/jspdf/jspdf.umd.min.js"></script><script src="/assets/js/pages/sw-agriculture-livestock-feed.js"></script>`;
  return renderSwahiliAgriculturePage({
    row,
    title: `Chakula cha mifugo - ${localizedCountryName} | AfroTools`,
    description: `Panga mgao wa ng'ombe, mbuzi au kondoo kwa viambato, bei na sarafu zilizohifadhiwa kwa ${localizedCountryName}.`,
    heading: `Chakula cha mifugo - ${localizedCountryName}`,
    lead: `Kadiria malisho makavu, protini, TDN na gharama kwa viambato na sarafu zilizohifadhiwa kwa ${localizedCountryName}.`,
    artwork: row.artwork.file, body, scripts, pageConfig: config, countryName: localizedCountryName,
    familyLabel: 'Chakula cha mifugo', familyRoute: '/sw/zana/kikokotoo-chakula-cha-mifugo/',
  });
}

module.exports = {
  id: 'livestock-feed',
  reciprocalLocales: ['en'],
  ANIMALS,
  CATEGORIES,
  CLASSES,
  COUNTRY_NAMES,
  INGREDIENTS,
  SOURCE_LABEL,
  DATA_REVIEWED,
  countryName,
  render,
  renderHub
};
