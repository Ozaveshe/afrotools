'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { renderSwahiliAgriculturePage } = require('../sw-agriculture-page-shell');
const { escapeHtml } = require('../fr-agriculture-page-shell');

const ROOT = path.resolve(__dirname, '../../..');

const CROP_NAMES = Object.freeze({
  avocado: 'Parachichi', banana: 'Ndizi', barley: 'Shayiri', cashew: 'Korosho',
  cassava: 'Muhogo', chickpea: 'Dengu-kuku', citrus: 'Machungwa', clove: 'Karafuu',
  cocoa: 'Kakao', coconut: 'Nazi', coffee_arabica: 'Kahawa arabika',
  coffee_robusta: 'Kahawa robusta', common_bean: 'Maharagwe', cotton: 'Pamba',
  cowpea: 'Kunde', dates: 'Tende', enset: 'Ensete', fonio: 'Fonio', grape: 'Zabibu',
  groundnut: 'Karanga', lentils: 'Dengu', maize: 'Mahindi', mango: 'Embe', millet: 'Ulezi',
  oil_palm: 'Mchikichi', olive: 'Mzeituni', onion: 'Kitunguu', pigeon_pea: 'Mbaazi',
  pineapple: 'Nanasi', plantain: 'Ndizi za kupika', potato: 'Viazi', rice: 'Mpunga',
  rubber: 'Mpira', sesame: 'Ufuta', sorghum: 'Mtama', soybean: 'Soya',
  sugar_cane: 'Miwa', sunflower: 'Alizeti', sweet_potato: 'Viazi vitamu', tea: 'Chai',
  teff: 'Teff', tobacco: 'Tumbaku', tomato: 'Nyanya', vanilla: 'Vanila', wheat: 'Ngano',
  yam: 'Viazi vikuu'
});

const QUALITY = Object.freeze({
  certified: 'Mbegu iliyothibitishwa', improved: 'Mbegu bora',
  local: 'Mbegu ya kienyeji', old: 'Mbegu ya zamani'
});
const CONDITIONS = Object.freeze({
  excellent: 'Bora sana', good: 'Mazuri', average: 'Wastani',
  poor: 'Duni', harsh: 'Magumu'
});
const INTERCROP = Object.freeze({
  sole: 'Zao pekee', primary: 'Zao kuu katika mchanganyiko',
  secondary: 'Zao la pili katika mchanganyiko'
});
const METHODS = Object.freeze({
  drilling: 'Kupanda kwa mstari', dibbling: 'Kupanda kwa mashimo',
  broadcasting: 'Kutawanya mbegu', transplanting: 'Kupandikiza miche',
  direct_seeding_broadcast: 'Kupanda moja kwa moja kwa kutawanya',
  direct_seeding_drill: 'Kupanda moja kwa moja kwa mstari'
});

const SEED_RATE_CONTRAST_CSS = `
/* Seed Rate owns these control tokens. Keep unrelated agriculture families unchanged. */
html[data-seed-rate-family]{--seed-control-border:#63758a;--seed-focus:#075eb8}
html[data-seed-rate-family][data-theme="dark"]{--seed-control-border:#8297b0;--seed-focus:#75b8ff}
@media(prefers-color-scheme:dark){html[data-seed-rate-family][data-theme="system"]{--seed-control-border:#8297b0;--seed-focus:#75b8ff}}
html[data-seed-rate-family] main .field input,
html[data-seed-rate-family] main .field select,
html[data-seed-rate-family] main .action:not(.primary){border-color:var(--seed-control-border)}
html[data-seed-rate-family] .skip-link:focus-visible,
html[data-seed-rate-family] main :is(a,button,input,select):focus-visible,
html[data-seed-rate-family] .site-foot a:focus-visible{outline-color:var(--seed-focus)}
`;

function applySeedRateContrastContract(html) {
  return html
    .replace('<html lang="sw"', '<html lang="sw" data-seed-rate-family')
    .replace('</style>', `${SEED_RATE_CONTRAST_CSS}</style>`);
}

function loadCountryData(code) {
  const relative = `data/agriculture/${code.toLowerCase()}-agri-data.js`;
  const sandbox = { window: { AfroTools: {} } };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT, relative), 'utf8'), sandbox, { filename: relative });
  const data = sandbox.window.AfroTools.countryData;
  if (!data || data.countryCode !== code) throw new Error(`Seed Rate country data mismatch for ${code}.`);
  return data;
}

function sourceMetadata(row, nativeCountryName) {
  const html = fs.readFileSync(path.join(ROOT, row.english.file), 'utf8');
  const footer = html.match(/<div class="sources-footer">([\s\S]*?)<\/div>/i);
  if (!footer) throw new Error(`Missing English source block in ${row.english.file}.`);
  const sourceLine = footer[1].split(/<br\s*\/?>/i)[0];
  const reviewed = footer[1].match(/Last updated:\s*([0-9]{4})/i);
  const requiredOwners = row.country.code === 'NG'
    ? ['FAO crop guidance', 'NASC (National Agricultural Seed Council)', 'IITA', 'Nigeria National Bureau of Statistics', 'CGIAR', 'World Bank']
    : ['FAO crop guidance', 'CGIAR', 'national agricultural authority', 'World Bank'];
  for (const owner of requiredOwners) {
    if (!sourceLine.includes(owner)) throw new Error(`Missing named source ${owner} in ${row.english.file}.`);
  }
  const links = [];
  const anchorPattern = /<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let anchor;
  while ((anchor = anchorPattern.exec(sourceLine))) {
    const englishLabel = anchor[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (englishLabel !== 'FAO crop information') {
      throw new Error(`Untranslated linked source ${englishLabel} in ${row.english.file}.`);
    }
    if (!/^https:\/\/www\.fao\.org\//i.test(anchor[1])) {
      throw new Error(`Unexpected linked source URL ${anchor[1]} in ${row.english.file}.`);
    }
    links.push({ href: anchor[1], label: 'Taarifa za FAO kuhusu zao la nyanya' });
  }
  if (!links.length) throw new Error(`Missing linked named source in ${row.english.file}.`);
  const ownerCopy = row.country.code === 'NG'
    ? 'Mwongozo wa mazao wa FAO, Baraza la Taifa la Mbegu za Kilimo la Nigeria (NASC), IITA, Ofisi ya Taifa ya Takwimu ya Nigeria, CGIAR na Benki ya Dunia.'
    : `Mwongozo wa mazao wa FAO, CGIAR, mamlaka ya kitaifa ya kilimo ya ${nativeCountryName}, na Benki ya Dunia.`;
  const linkCopy = `Vigezo vya kupanga nyanya pia vinarejelea ${links.map(link => link.label).join(', ')}.`;
  const linkedHtml = links.map(link => (
    `<a href="${escapeHtml(link.href)}" rel="noopener noreferrer">${escapeHtml(link.label)}</a>`
  )).join(', ');
  return {
    source: `${ownerCopy} ${linkCopy}`,
    sourceHtml: `${escapeHtml(ownerCopy)} Vigezo vya kupanga nyanya pia vinarejelea ${linkedHtml}.`,
    links,
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
  const name = countryName(row, context);
  const metadata = sourceMetadata(row, name);
  return {
    name,
    locale: 'sw',
    source: metadata.source,
    sourceHtml: metadata.sourceHtml,
    sourceLinks: metadata.links,
    reviewed: metadata.reviewed,
    currency: data.currency
  };
}

function renderHub(row, context) {
  const countries = context.familyRows
    .filter(candidate => candidate.country)
    .map(candidate => ({ row: candidate, name: countryName(candidate, context) }))
    .sort((left, right) => left.name.localeCompare(right.name, 'sw'));
  if (countries.length !== 54) throw new Error(`Seed Rate hub requires 54 countries; found ${countries.length}.`);
  const body = `<section class="card" aria-labelledby="countriesTitle">
  <h2 id="countriesTitle">Chagua nchi ya rejea</h2>
  <p>Kila ukurasa hutumia injini ileile ya Kiingereza pamoja na mazao, vipimo, bei elekezi, sarafu na makadirio ya nchi uliyochagua.</p>
  <ul class="country-list">${countries.map(item => `<li><a href="${escapeHtml(item.row.swahili.route)}">${escapeHtml(item.name)}</a> <span>(${item.row.country.code})</span></li>`).join('')}</ul>
</section>
<section class="card" aria-labelledby="planningTitle">
  <h2 id="planningTitle">Vyanzo, upya na kiwango cha uhakika</h2>
  <div class="trust-grid">
    <div class="trust-item"><strong>Vyanzo</strong><span><a href="https://www.fao.org/land-water/databases-and-software/crop-information/tomato/en/" rel="noopener noreferrer">Taarifa za FAO kuhusu zao la nyanya</a>, <a href="https://www.cgiar.org/" rel="noopener noreferrer">CGIAR</a>, mamlaka za kitaifa za kilimo, na <a href="https://data.worldbank.org/" rel="noopener noreferrer">Benki ya Dunia</a>.</span></div>
    <div class="trust-item"><strong>Data ilivyopitiwa</strong><span>Marejeo ya kurasa za Kiingereza yameonyeshwa kuwa yamesasishwa mwaka 2026; si data ya moja kwa moja.</span></div>
    <div class="trust-item"><strong>Uhakika</strong><span>Makadirio ya kupanga tu; aina ya mbegu, kiwango cha uotaji, nafasi, hali ya shamba na kifurushi hubadilisha mahitaji.</span></div>
  </div>
  <p>Thibitisha aina ya mbegu, kiwango cha uotaji, nafasi, lebo ya kifurushi na ushauri wa kilimo wa eneo lako kabla ya kununua.</p>
  <p><strong>Faragha:</strong> hesabu hufanyika ndani ya kivinjari. Hakuna ingizo linalotumwa kwa seva au AI.</p>
  <p><strong>Msaidizi wa AI:</strong> kiungo cha Msaidizi ni cha hiari na hufungua ukurasa tofauti unaoeleza ridhaa kabla ya matumizi ya modeli.</p>
</section>`;
  return applySeedRateContrastContract(renderSwahiliAgriculturePage({
    row,
    title: 'Vikokotoo vya kiwango cha mbegu kwa nchi | AfroTools',
    description: 'Chagua mojawapo ya nchi 54 za Afrika ili kukadiria mbegu au vipando kwa Kiswahili.',
    heading: 'Vikokotoo vya kiwango cha mbegu',
    lead: 'Chagua nchi ili kutumia mazao, vipimo, bei elekezi, sarafu na makadirio yaliyohifadhiwa kwa nchi hiyo.',
    artwork: row.artwork.file,
    body,
    scripts: '',
    pageConfig: {
      id: row.english.id,
      locale: 'sw',
      englishRoute: row.english.route,
      swahiliRoute: row.swahili.route,
      countryCount: 54,
      ai: { mode: 'route-only', route: '/sw/ai/', sendsInputsToModel: false }
    },
    currentLabel: 'Vikokotoo vya kiwango cha mbegu',
    familyLabel: 'Kiwango cha mbegu',
    familyRoute: row.swahili.route
  }));
}

function options(values) {
  return Object.entries(values).map(([value, label]) => (
    `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`
  )).join('');
}

function renderCountry(row, context) {
  const view = presentation(row, context);
  const hub = context.familyRows.find(candidate => !candidate.country);
  const config = {
    id: row.english.id,
    locale: view.locale,
    countryCode: row.country.code,
    countryName: view.name,
    englishRoute: row.english.route,
    swahiliRoute: row.swahili.route,
    cropNames: CROP_NAMES,
    quality: QUALITY,
    conditions: CONDITIONS,
    intercrop: INTERCROP,
    methods: METHODS,
    sourceLabel: view.source,
    sourceLinks: view.sourceLinks,
    dataReviewed: view.reviewed,
    storageKey: `afrotools:sw-agriculture:seed-rate:${row.country.code}`,
    ai: {
      mode: 'route-only', route: '/sw/ai/', sendsInputsToModel: false,
      consentRequiredForThisCalculator: false
    }
  };
  const body = `<section class="card" aria-labelledby="calculatorTitle">
  <h2 id="calculatorTitle">Kadiria kiasi cha mbegu au vipando</h2>
  <p>Matokeo hutumia zao la nchi, ukubwa wa shamba, ubora wa mbegu, hali ya shamba, mchanganyiko wa mazao na nafasi ya kupanda.</p>
  <form id="seedForm" novalidate>
    <div class="grid">
      <div class="field"><label for="crop">Zao</label><select id="crop" required></select></div>
      <div class="field"><label for="farmSize">Ukubwa wa shamba (hekta)</label><input id="farmSize" type="number" min="0.1" step="0.1" inputmode="decimal" required></div>
      <div class="field"><label for="quality">Ubora au umri wa mbegu</label><select id="quality">${options(QUALITY)}</select></div>
      <div class="field"><label for="conditions">Hali ya shamba</label><select id="conditions">${options(CONDITIONS)}</select></div>
      <div class="field"><label for="intercrop">Mpangilio wa mchanganyiko wa mazao</label><select id="intercrop">${options(INTERCROP)}</select></div>
      <div class="field"><label for="method">Njia ya kupanda</label><select id="method" required></select></div>
      <div class="field"><label for="rowSpacing">Nafasi kati ya mistari (sentimita)</label><input id="rowSpacing" type="number" min="1" step="1" inputmode="numeric" required></div>
      <div class="field"><label for="plantSpacing">Nafasi kati ya mimea (sentimita)</label><input id="plantSpacing" type="number" min="1" step="1" inputmode="numeric" required></div>
      <div class="field"><label for="seedsPerHole">Mbegu kwa shimo</label><input id="seedsPerHole" type="number" min="1" step="1" inputmode="numeric" required></div>
    </div>
    <div class="actions"><button class="action primary" type="submit">Kokotoa kiasi</button><button class="action" type="reset">Weka upya</button></div>
    <p class="error" id="formError" role="alert" aria-live="assertive"></p>
  </form>
</section>
<section class="card" aria-labelledby="resultsTitle">
  <h2 id="resultsTitle">Matokeo</h2>
  <div class="empty" id="emptyState">Jaza sehemu kisha endesha hesabu. Bado hakuna matokeo.</div>
  <div class="result-panel" id="resultPanel" hidden aria-live="polite">
    <div class="result-hero"><div class="result-value" id="totalMaterial">—</div><div id="materialUnit"></div></div>
    <div class="result-grid">
      <div class="metric"><strong id="rate">—</strong><span>Kiasi kwa hekta</span></div>
      <div class="metric"><strong id="bags">—</strong><span>Mifuko au vifurushi vyenye kipimo</span></div>
      <div class="metric"><strong id="population">—</strong><span>Idadi lengwa ya mimea</span></div>
    </div>
    <p id="cost"></p><p id="notes"></p>
    <div class="actions" aria-label="Vitendo vya matokeo">
      <button class="action" type="button" data-result-action="copy" disabled>Nakili</button>
      <button class="action" type="button" data-result-action="share" disabled>Shiriki</button>
      <button class="action" type="button" data-result-action="save" disabled>Hifadhi kwenye kivinjari hiki</button>
      <button class="action" type="button" data-result-action="pdf" disabled>Pakua PDF</button>
      <button class="action" type="button" data-result-action="csv" disabled>Pakua CSV</button>
      <button class="action" type="button" data-result-action="json" disabled>Pakua JSON</button>
      <button class="action" type="button" data-result-action="txt" disabled>Pakua TXT</button>
    </div>
  </div>
  <p class="status" id="actionStatus" role="status" aria-live="polite"></p>
</section>
<section class="card" aria-labelledby="trustTitle">
  <h2 id="trustTitle">Vyanzo, uhalisia wa data na mipaka</h2>
  <div class="trust-grid">
    <div class="trust-item"><strong>Vyanzo</strong><span>${view.sourceHtml}</span></div>
    <div class="trust-item"><strong>Data ilivyopitiwa</strong><span>Rejea tuli ya ukurasa wa Kiingereza, iliyoonyeshwa kuwa imesasishwa mwaka ${escapeHtml(view.reviewed)}. Hakuna data ya moja kwa moja.</span></div>
    <div class="trust-item"><strong>Uhakika</strong><span>Makadirio ya kupanga tu; kiwango cha uotaji, aina ya mbegu, nafasi, hali ya shamba na kifurushi hubadilisha mahitaji.</span></div>
  </div>
  <p><strong>Faragha:</strong> hesabu, nakala, hifadhi na faili zinazopakuliwa hufanyika ndani ya kivinjari. Hakuna ingizo linalotumwa kwa seva.</p>
  <p><strong>AI na ridhaa:</strong> kikokotoo hiki hakitumi AI wala hakitumi ingizo lako kwa modeli. <a href="/sw/ai/">Msaidizi wa AfroTools</a> ni wa hiari na unaeleza ridhaa kwenye ukurasa tofauti.</p>
  <p>Idadi ya mifuko inaonyeshwa tu pale kipimo cha kifurushi kimedumishwa. Zana haitungi ukubwa wa kifurushi cha nyanya.</p>
</section>
<section class="card"><h2>Endelea kupanga</h2><p><a href="${escapeHtml(hub.swahili.route)}">Chagua nchi nyingine ya mbegu</a> · <a href="/sw/kilimo/">Tazama zana za kilimo kwa Kiswahili</a></p></section>`;

  const scripts = `<script src="/data/agriculture/${row.country.code.toLowerCase()}-agri-data.js"></script>
<script src="/data/agriculture/seed-data.js"></script>
<script src="/engines/seed-rate-engine.js"></script>
<script src="/data/agriculture/seed-data-extension.js"></script>
<script src="/assets/vendor/jspdf/jspdf.umd.min.js"></script>
<script src="/assets/js/pages/sw-seed-rate-controller.js"></script>`;

  return applySeedRateContrastContract(renderSwahiliAgriculturePage({
    row: { ...row, country: { ...row.country, swahiliName: view.name } },
    title: `Kikokotoo cha kiwango cha mbegu — ${view.name} | AfroTools`,
    description: `Kadiria mbegu, vipando, nafasi na gharama elekezi kwa ${view.name} kwa kutumia data ya nchi ${row.country.code}.`,
    heading: `Kiwango cha mbegu — ${view.name}`,
    lead: `Panga kiasi cha mbegu au vipando kwa mazao, vipimo, bei elekezi na sarafu zilizohifadhiwa kwa ${row.country.code}.`,
    artwork: row.artwork.file,
    body,
    scripts,
    pageConfig: config,
    familyLabel: 'Kiwango cha mbegu',
    familyRoute: hub.swahili.route
  }));
}

function render(row, context = {}) {
  return row.country ? renderCountry(row, context) : renderHub(row, context);
}

module.exports = {
  id: 'seed-rate', CROP_NAMES, QUALITY, CONDITIONS, INTERCROP, METHODS,
  SEED_RATE_CONTRAST_CSS, applySeedRateContrastContract,
  loadCountryData, sourceMetadata, presentation, renderHub, renderCountry, render
};
