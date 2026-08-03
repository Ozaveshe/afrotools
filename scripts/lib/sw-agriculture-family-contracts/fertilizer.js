'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {
  renderSwahiliAgriculturePage
} = require('../sw-agriculture-page-shell');

const ROOT = path.resolve(__dirname, '../../..');

const CROP_NAMES = Object.freeze({
  avocado: 'Parachichi',
  groundnut: 'Karanga',
  millet: 'Ulezi',
  rice: 'Mpunga',
  maize: 'Mahindi',
  sorghum: 'Mtama',
  cowpea: 'Kunde',
  cotton: 'Pamba',
  tomato: 'Nyanya',
  onion: 'Vitunguu',
  mango: 'Embe',
  cocoa: 'Kakao',
  coffee_robusta: 'Kahawa robusta',
  cashew: 'Korosho',
  rubber: 'Mpira',
  oil_palm: 'Michikichi',
  cassava: 'Muhogo',
  yam: 'Viazi vikuu',
  plantain: 'Ndizi za kupika',
  banana: 'Ndizi',
  wheat: 'Ngano',
  barley: 'Shayiri',
  citrus: 'Machungwa',
  olive: 'Zeituni',
  potato: 'Viazi',
  sugar_cane: 'Miwa',
  dates: 'Tende',
  grape: 'Zabibu',
  common_bean: 'Maharagwe',
  chickpea: 'Chickpea',
  clove: 'Karafuu',
  coconut: 'Nazi',
  coffee_arabica: 'Kahawa arabica',
  enset: 'Enseti',
  fonio: 'Fonio',
  lentils: 'Dengu',
  pigeon_pea: 'Mbaazi',
  pineapple: 'Nanasi',
  sesame: 'Ufuta',
  soybean: 'Soya',
  sunflower: 'Alizeti',
  sweet_potato: 'Viazi vitamu',
  tea: 'Chai',
  teff: 'Teff',
  tobacco: 'Tumbaku',
  vanilla: 'Vanila'
});

const SOIL_NAMES = Object.freeze({
  loamy: 'Udongo tifutifu',
  clay: 'Udongo wa mfinyanzi',
  sandy: 'Udongo wa mchanga',
  sandy_loam: 'Udongo tifutifu wenye mchanga',
  clay_loam: 'Udongo tifutifu wenye mfinyanzi',
  volcanic: 'Udongo wa volkano',
  laterite: 'Udongo wa lateriti',
  alluvial: 'Udongo wa mashapo',
  black_cotton: 'Udongo mweusi wa pamba',
  red_soil: 'Udongo mwekundu'
});

const PREVIOUS_CROPS = Object.freeze({
  none: 'Hakuna, nafaka au zao jingine',
  cowpea: 'Kunde',
  groundnut: 'Karanga',
  soybean: 'Soya',
  common_bean: 'Maharagwe',
  pigeon_pea: 'Mbaazi',
  chickpea: 'Chickpea',
  lentils: 'Dengu',
  fallow_grass: 'Shamba lililopumzishwa au nyasi'
});

function escapeHtml(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[character]));
}

function loadCountryData(code) {
  const relative = `data/agriculture/${code.toLowerCase()}-agri-data.js`;
  const sandbox = { window: { AfroTools: {} } };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT, relative), 'utf8'), sandbox, {
    filename: relative
  });
  const data = sandbox.window.AfroTools.countryData;
  if (!data || data.countryCode !== code) {
    throw new Error(`Fertilizer country data mismatch for ${code}.`);
  }
  return data;
}

function translateRegion(value, index) {
  let label = String(value || '').trim();
  const replacements = [
    [/\bNorth(?:ern)?\b/gi, 'Kaskazini'],
    [/\bSouth(?:ern)?\b/gi, 'Kusini'],
    [/\bEast(?:ern)?\b/gi, 'Mashariki'],
    [/\bWest(?:ern)?\b/gi, 'Magharibi'],
    [/\bCentral\b/gi, 'Kati'],
    [/\bCoastal\b/gi, 'Pwani'],
    [/\bCoast\b/gi, 'Pwani'],
    [/\bHighlands?\b/gi, 'Nyanda za juu'],
    [/\bLowlands?\b/gi, 'Nyanda za chini'],
    [/\bPlains?\b/gi, 'Tambarare'],
    [/\bMountains?\b/gi, 'Milima'],
    [/\bValleys?\b/gi, 'Bonde'],
    [/\bRiver\b/gi, 'Mto'],
    [/\bForest\b/gi, 'Msitu'],
    [/\bSavann?ah?\b/gi, 'Savanna'],
    [/\bBasin\b/gi, 'Bonde'],
    [/\bPlateau\b/gi, 'Uwanda wa juu'],
    [/\bDesert\b/gi, 'Jangwa'],
    [/\bInland\b/gi, 'Bara'],
    [/\bZone\b/gi, 'Kanda'],
    [/\bRegion\b/gi, 'Mkoa'],
    [/\bBelt\b/gi, 'Ukanda'],
    [/\band\b/gi, 'na']
  ];
  for (const [pattern, replacement] of replacements) label = label.replace(pattern, replacement);
  return `Kanda ya kilimo ${index + 1} — ${label}`;
}

function sourceMetadata(row) {
  const html = fs.readFileSync(path.join(ROOT, row.english.file), 'utf8');
  const source = html.match(/Data Sources:\s*([^<\r\n]+)/i);
  const reviewed = html.match(/Last updated:\s*([0-9]{4})/i);
  if (!source) throw new Error(`Missing English source label in ${row.english.file}.`);
  return {
    source: source[1].trim().replace(/\.$/, '').replace(/\bWorld Bank\b/g, 'Benki ya Dunia'),
    reviewed: reviewed ? reviewed[1] : 'haijaonyeshwa'
  };
}

function countryName(row, context) {
  const country = context.countries.find(candidate => (
    (candidate.isoCode || candidate.id) === row.country.code
  ));
  if (!country || !country.displayNames || !country.displayNames.sw) {
    throw new Error(`Missing maintained Swahili country name for ${row.country.code}.`);
  }
  return country.displayNames.sw;
}

function presentation(row, context) {
  const data = loadCountryData(row.country.code);
  const metadata = sourceMetadata(row);
  return {
    name: countryName(row, context),
    locale: 'sw',
    regions: Object.fromEntries(data.regions.map((region, index) => [
      region.id,
      translateRegion(region.name, index)
    ])),
    source: metadata.source,
    reviewed: metadata.reviewed
  };
}

function renderHub(row, context) {
  const countryRows = context.familyRows
    .filter(candidate => candidate.country)
    .map(candidate => ({
      row: candidate,
      name: countryName(candidate, context)
    }))
    .sort((left, right) => left.name.localeCompare(right.name, 'sw'));
  if (countryRows.length !== 54) {
    throw new Error(`Fertilizer hub requires exactly 54 country apps; found ${countryRows.length}.`);
  }
  const body = `
<style>@media(max-width:360px){.fertilizer-hub-card h2{overflow-wrap:anywhere}}</style>
<section class="card" aria-labelledby="countriesTitle">
  <h2 id="countriesTitle">Chagua nchi ya rejea</h2>
  <p>Kila ukurasa hutumia injini ileile ya NPK ya toleo la Kiingereza pamoja na data ya nchi husika. Mazao, bidhaa, bei elekezi, ruzuku na sarafu hazinakiliwi kutoka nchi nyingine.</p>
  <ul class="country-list">${countryRows.map(item => `<li><a href="${escapeHtml(item.row.swahili.route)}">${escapeHtml(item.name)}</a> <span>(${item.row.country.code})</span></li>`).join('')}</ul>
</section>
<section class="card fertilizer-hub-card" aria-labelledby="hubLimitTitle">
  <h2 id="hubLimitTitle">Makadirio ya kupanga mbolea</h2>
  <p>Zana za nchi hukadiria N, P₂O₅ na K₂O, bidhaa zinazopatikana kwenye data ya nchi, gharama elekezi na ratiba ya matumizi. Thibitisha dozi kwa kipimo cha udongo na mtaalamu wa kilimo wa eneo lako.</p>
  <p><strong>Faragha:</strong> hesabu na exports hufanyika ndani ya kivinjari. Hakuna ingizo linalotumwa kwa seva au AI.</p>
  <p><strong>Msaidizi wa AI:</strong> kiungo cha Msaidizi ni cha hiari na hufungua mtiririko tofauti unaoeleza ridhaa yake kabla ya msaada wa modeli.</p>
</section>`;
  return renderSwahiliAgriculturePage({
    row,
    title: 'Vikokotoo vya mbolea ya NPK kwa nchi | AfroTools',
    description: 'Chagua data ya mojawapo ya nchi 54 za Afrika ili kukadiria mahitaji ya NPK kwa Kiswahili.',
    heading: 'Vikokotoo vya mbolea ya NPK',
    lead: 'Chagua nchi ili kutumia mazao, maeneo, bidhaa, bei elekezi, ruzuku na sarafu ya data yake.',
    artwork: row.artwork.file,
    body,
    scripts: '',
    pageConfig: {
      id: row.english.id,
      locale: 'sw',
      englishRoute: row.english.route,
      swahiliRoute: row.swahili.route,
      countryCount: 54,
      ai: { mode: 'route-only', consentRequiredForThisCalculator: false }
    },
    currentLabel: 'Vikokotoo vya mbolea ya NPK',
    familyLabel: 'Mbolea NPK',
    familyRoute: row.swahili.route
  });
}

function renderCountry(row, context) {
  const current = presentation(row, context);
  const config = {
    id: row.english.id,
    locale: current.locale,
    countryCode: row.country.code,
    countryName: current.name,
    englishRoute: row.english.route,
    swahiliRoute: row.swahili.route,
    cropNames: CROP_NAMES,
    soilNames: SOIL_NAMES,
    regionNames: current.regions,
    previousCrops: PREVIOUS_CROPS,
    sourceLabel: current.source,
    dataReviewed: current.reviewed,
    storageKey: `afrotools:sw-agriculture:fertilizer:${row.country.code}`,
    ai: {
      mode: 'route-only',
      route: '/sw/ai/',
      consentRequiredForThisCalculator: false,
      sendsInputsToModel: false
    }
  };

  const body = `
<style>
.fertilizer-products-mobile{display:none;gap:10px}.fertilizer-product-card{border:1px solid var(--agri-border);border-radius:10px;padding:14px;min-width:0}.fertilizer-product-card strong,.fertilizer-product-card span{display:block;overflow-wrap:anywhere}.fertilizer-product-card span{color:var(--agri-muted);margin-top:5px}.soil-test-panel[hidden]{display:none}.soil-test-panel{margin-top:14px;padding:14px;border:1px solid var(--agri-border);border-radius:10px;background:var(--agri-soft)}@media(max-width:480px){.fertilizer-products-table{display:none}.fertilizer-products-mobile{display:grid}}
</style>
<section class="card" aria-labelledby="calculatorTitle">
  <h2 id="calculatorTitle">Kadiria mahitaji ya mbolea</h2>
  <p>Chagua zao lenye mbinu iliyohifadhiwa ya kukokotoa virutubisho. Kipimo cha udongo huboresha makadirio, lakini matokeo bado yanahitaji uthibitisho wa mtaalamu wa eneo lako.</p>
  <form id="fertilizerForm" novalidate>
    <div class="grid">
      <div class="field"><label for="crop">Zao</label><select id="crop" required></select><small>Mazao yenye mbinu ya NPK iliyohifadhiwa pekee ndiyo yanaonyeshwa.</small></div>
      <div class="field"><label for="region">Mkoa au kanda ya kilimo</label><select id="region" required></select></div>
      <div class="field"><label for="farmSize">Ukubwa wa shamba (hekta)</label><input id="farmSize" type="number" min="0.1" step="0.1" inputmode="decimal" required></div>
      <div class="field"><label for="targetYield">Mavuno lengwa (tani/hekta)</label><input id="targetYield" type="number" min="0.1" step="0.1" inputmode="decimal" placeholder="Hukokotolewa kiotomatiki"></div>
      <div class="field"><label for="soil">Aina ya udongo</label><select id="soil" required></select></div>
      <div class="field"><label for="previousCrop">Zao lililotangulia — mkopo wa nitrojeni</label><select id="previousCrop"></select></div>
    </div>
    <button class="action" id="soilTestToggle" type="button" aria-expanded="false" aria-controls="soilTestPanel">Ongeza majibu ya kipimo cha udongo (si lazima)</button>
    <div class="soil-test-panel" id="soilTestPanel" hidden>
      <div class="grid">
        <div class="field"><label for="soilPh">pH ya udongo</label><input id="soilPh" type="number" min="0" max="14" step="0.1" inputmode="decimal"></div>
        <div class="field"><label for="organicMatter">Mabaki hai kwenye udongo (%)</label><input id="organicMatter" type="number" min="0" step="0.1" inputmode="decimal"></div>
        <div class="field"><label for="availableN">Nitrojeni inayopatikana (ppm)</label><input id="availableN" type="number" min="0" step="1" inputmode="decimal"></div>
        <div class="field"><label for="phosphorus">Fosforasi ya Olsen (ppm)</label><input id="phosphorus" type="number" min="0" step="0.1" inputmode="decimal"></div>
        <div class="field"><label for="potassium">Potasiamu inayopatikana (ppm)</label><input id="potassium" type="number" min="0" step="0.1" inputmode="decimal"></div>
      </div>
    </div>
    <div class="actions"><button class="action primary" type="submit">Kokotoa mahitaji ya NPK</button><button class="action" type="reset">Weka upya</button></div>
    <p class="error" id="formError" role="alert" aria-live="assertive"></p>
  </form>
</section>
<section class="card" aria-labelledby="resultsTitle">
  <h2 id="resultsTitle">Matokeo</h2>
  <div class="empty" id="emptyState">Jaza sehemu kisha endesha hesabu. Bado hakuna matokeo yaliyohifadhiwa.</div>
  <div class="result-panel" id="resultPanel" hidden aria-live="polite">
    <div class="result-grid">
      <div class="metric"><strong id="nitrogen">—</strong><span>Nitrojeni N (kg/hekta)</span></div>
      <div class="metric"><strong id="phosphorusResult">—</strong><span>Fosforasi P₂O₅ (kg/hekta)</span></div>
      <div class="metric"><strong id="potassiumResult">—</strong><span>Potasiamu K₂O (kg/hekta)</span></div>
    </div>
    <h3>Bidhaa na kiasi</h3>
    <div class="table-wrap fertilizer-products-table"><table class="data-table"><thead><tr><th>Bidhaa</th><th>Mifuko</th><th>Uzito</th><th>Gharama elekezi</th></tr></thead><tbody id="productRows"></tbody></table></div>
    <div id="productCards" class="fertilizer-products-mobile" aria-label="Bidhaa na kiasi"></div>
    <p id="productEmpty" class="empty" hidden>Hakuna bidhaa ya mbolea kwenye data ya nchi hii. Wasiliana na muuzaji au mtaalamu wa kilimo wa eneo lako.</p>
    <div class="result-grid">
      <div class="metric"><strong id="marketCost">—</strong><span>Gharama kwa bei elekezi ya data</span></div>
      <div class="metric"><strong id="subsidyCost">—</strong><span>Gharama elekezi baada ya ruzuku</span></div>
      <div class="metric"><strong id="savings">—</strong><span>Akiba elekezi</span></div>
    </div>
    <h3>Ratiba elekezi ya matumizi</h3><ol id="schedule"></ol>
    <h3>Vyanzo hai mbadala</h3><ul id="organic"></ul>
    <p id="subsidyNote"></p>
    <div class="actions" aria-label="Vitendo vya matokeo">
      <button class="action" type="button" data-action="copy">Nakili</button>
      <button class="action" type="button" data-action="share">Shiriki</button>
      <button class="action" type="button" data-action="save">Hifadhi kwenye kivinjari hiki</button>
      <button class="action" type="button" data-action="pdf">Pakua PDF</button>
      <button class="action" type="button" data-action="csv">Pakua CSV</button>
      <button class="action" type="button" data-action="json">Pakua JSON</button>
      <button class="action" type="button" data-action="txt">Pakua TXT</button>
    </div>
    <p class="status" id="actionStatus" role="status" aria-live="polite"></p>
  </div>
</section>
<section class="card" aria-labelledby="trustTitle">
  <h2 id="trustTitle">Vyanzo, uhalisia wa data na mipaka</h2>
  <div class="trust-grid">
    <div class="trust-item"><strong>Vyanzo</strong><span>${escapeHtml(current.source)}</span></div>
    <div class="trust-item"><strong>Data ilivyopitiwa</strong><span>Rejea tuli ya ukurasa wa Kiingereza, iliyoonyeshwa kuwa imesasishwa mwaka ${escapeHtml(current.reviewed)}. Hakuna data ya moja kwa moja.</span></div>
    <div class="trust-item"><strong>Uhakika</strong><span>Makadirio ya kupanga tu; thibitisha kwa kipimo cha udongo na ushauri wa kilimo wa eneo lako.</span></div>
  </div>
  <p><strong>Faragha:</strong> hesabu, nakala, hifadhi na exports hufanyika ndani ya kivinjari. Hakuna ingizo linalotumwa kwa seva.</p>
  <p><strong>AI na ridhaa:</strong> kikokotoo hiki hakitumi AI wala hakitumii ingizo lako kwa modeli. <a href="/sw/ai/">Msaidizi wa AfroTools</a> ni wa hiari na unaeleza ridhaa yake kwenye ukurasa tofauti.</p>
  <p>Bei na taarifa za ruzuku hutoka kwenye data ya nchi na huenda zimebadilika. Haya si maagizo rasmi ya kutumia mbolea wala ahadi ya upatikanaji.</p>
</section>
<section class="card"><h2>Endelea kupanga</h2><p><a href="${escapeHtml(context.familyRows.find(candidate => !candidate.country).swahili.route)}">Chagua nchi nyingine ya mbolea</a> · <a href="/sw/kilimo/">Tazama zana za kilimo kwa Kiswahili</a></p></section>`;

  const scripts = `
<script src="/data/agriculture/crop-database.js"></script>
<script src="/data/agriculture/${row.country.code.toLowerCase()}-agri-data.js"></script>
<script src="/engines/fertilizer-engine.js"></script>
<script src="/assets/vendor/jspdf/jspdf.umd.min.js"></script>
<script src="/assets/js/pages/sw-fertilizer-controller.js"></script>`;

  return renderSwahiliAgriculturePage({
    row: {
      ...row,
      country: {
        ...row.country,
        swahiliName: current.name
      }
    },
    title: `Kikokotoo cha mbolea ya NPK — ${current.name} | AfroTools`,
    description: `Kadiria N, P₂O₅, K₂O, bidhaa na gharama elekezi kwa ${current.name} kwa kutumia data ya nchi ${row.country.code}.`,
    heading: `Kikokotoo cha mbolea ya NPK — ${current.name}`,
    lead: `Panga virutubisho, bidhaa na gharama elekezi kwa mazao, maeneo, bei na ruzuku zilizohifadhiwa kwenye data ya ${row.country.code}.`,
    artwork: row.artwork.file,
    body,
    scripts,
    pageConfig: config,
    familyLabel: 'Mbolea NPK',
    familyRoute: context.familyRows.find(candidate => !candidate.country).swahili.route
  });
}

function render(row, context = {}) {
  return row.country ? renderCountry(row, context) : renderHub(row, context);
}

module.exports = {
  id: 'fertilizer',
  CROP_NAMES,
  SOIL_NAMES,
  PREVIOUS_CROPS,
  loadCountryData,
  sourceMetadata,
  presentation,
  renderHub,
  renderCountry,
  render
};
