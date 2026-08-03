'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { escapeHtml, renderSwahiliAgriculturePage } = require('../sw-agriculture-page-shell');
const { alternateEntries: fullAlternateEntries } = require('../fr-agriculture-hreflang');

const ROOT = path.resolve(__dirname, '../../..');
const SPECIES = Object.freeze({ catfish: 'Kambare wa Afrika', tilapia: 'Sato wa Nile', trout: 'Trout wa upinde wa mvua' });
const SYSTEMS = Object.freeze({ earthen_pond: 'Bwawa la udongo', concrete_tank: 'Tanki la zege', tarpaulin_tank: 'Tanki la turubai', cage: 'Kizimba kwenye ziwa au bwawa' });
const DENSITIES = Object.freeze({ low: 'Ndogo', medium: 'Wastani', high: 'Kubwa' });
const MANAGEMENT = Object.freeze({ good: 'Nzuri', average: 'Wastani', poor: 'Duni' });
const TARGETS = Object.freeze({ min: 'Ukubwa wa chini', typical: 'Ukubwa wa kawaida', premium: 'Ukubwa wa daraja la juu' });
const FEEDS = Object.freeze({ imported: 'Chakula cha kuagizwa', local_float: 'Chakula cha ndani (elea)', local_sink: 'Chakula cha ndani (zama)', farm_made: 'Chakula cha shambani' });
const PROCESSING = Object.freeze({ none: 'Uuzaji wa samaki wabichi au hai', smoked: 'Samaki wa moshi', dried: 'Samaki waliokaushwa', fillet: 'Minofu ya samaki' });
const COUNTRY_NAMES = Object.freeze({ MA: 'Moroko' });
const SOURCE_LABEL = 'FAO SOFIA (Hali ya Uvuvi na Ufugaji wa Samaki Duniani 2024), WorldFish Center, tafiti za kitaifa za bei za vifaranga vya samaki, wizara za kilimo za nchi, na takwimu za kazi za ILO';
const DATA_REVIEWED = 'gharama za soko za 2024–2025 kwenye rejea iliyokubaliwa';
const CONFIDENCE = 'Makadirio ya kupanga yenye uhakika wa kati; uhai wa samaki, FCR, bei, maji, joto na usimamizi vinaweza kubadilisha matokeo.';
const FAO_URL = 'https://www.fao.org/publications/fao-flagship-publications/the-state-of-world-fisheries-and-aquaculture/en';
const WORLDFISH_URL = 'https://worldfishcenter.org/';

function decodeHtml(value) {
  return String(value || '').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&ndash;|&#8211;/g, '–').replace(/&mdash;|&#8212;/g, '—')
    .replace(/&nbsp;|&#160;/g, ' ').replace(/\s+/g, ' ').trim();
}
function sourceMetadata(row) {
  const html = fs.readFileSync(path.join(ROOT, row.english.file), 'utf8');
  const block = html.match(/<p class="sources-footer">([\s\S]*?)<\/p>/i);
  if (!block) throw new Error(`${row.english.file} has no complete fish-farming source footer.`);
  const complete = decodeHtml(block[1]);
  for (const required of ['FAO SOFIA', 'WorldFish Center', 'national hatchery price surveys', 'country agricultural ministries', 'ILO labor statistics', '2024–2025']) {
    if (!complete.includes(required)) throw new Error(`${row.english.file} has an incomplete fish-farming source contract: ${required}.`);
  }
  return { complete, source: SOURCE_LABEL, dataReviewed: DATA_REVIEWED };
}
function countryName(row) { return COUNTRY_NAMES[row.country.code] || row.country.swahiliName; }
function alternateEntries(row, fullMesh = false) {
  if (fullMesh) return fullAlternateEntries(row);
  return [
    { hreflang: 'en', route: row.english.route },
    { hreflang: 'sw', route: row.swahili.route },
    { hreflang: 'x-default', route: row.english.route }
  ];
}
function options(values) {
  return Object.entries(values).map(([value, label]) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`).join('');
}
function trustBlock(row, hub) {
  return `<section class="card"><h2>Chanzo, upya na kiwango cha uhakika</h2><div class="trust-grid"><div class="trust-item"><strong>Vyanzo vilivyotajwa</strong><span><a href="${FAO_URL}" target="_blank" rel="noopener">FAO SOFIA 2024 — Hali ya Uvuvi na Ufugaji wa Samaki Duniani</a>; <a href="${WORLDFISH_URL}" target="_blank" rel="noopener">WorldFish Center</a>; tafiti za kitaifa za bei za vifaranga, wizara za kilimo za nchi na takwimu za kazi za ILO.</span></div><div class="trust-item"><strong>Upya</strong><span>${DATA_REVIEWED}; si data ya moja kwa moja.</span></div><div class="trust-item"><strong>Kiwango cha uhakika</strong><span>${CONFIDENCE}</span></div></div><p>Haya si bei za moja kwa moja, nukuu ya msambazaji wala ahadi ya faida. Thibitisha bei, ubora wa maji, joto, upatikanaji wa vifaranga na masharti ya eneo lako.</p><p><strong>Faragha:</strong> ${hub ? 'ukurasa huu ni orodha tu na haukusanyi ingizo.' : 'hesabu na faili hutengenezwa kwenye kivinjari hiki; hakuna ingizo linalotumwa kwa seva.'}</p><p><strong>AI:</strong> kitambulisho cha njia ni <code>${escapeHtml(row.english.id)}</code>. Msaidizi wa AfroTools ni wa hiari na lazima aombe idhini kabla ya kutuma maudhui kwa modeli.</p></section>`;
}

function renderHub(row, context = {}) {
  const countries = (context.familyRows || []).filter(item => item.country)
    .sort((a, b) => countryName(a).localeCompare(countryName(b), 'sw'));
  if (countries.length !== 15) throw new Error(`Fish Farming hub requires 15 manifest countries; found ${countries.length}.`);
  return renderSwahiliAgriculturePage({
    row, title: 'Faida ya ufugaji wa samaki kwa nchi | AfroTools',
    description: 'Chagua nchi ili kukadiria samaki, mavuno, gharama, mapato na faida ya mzunguko wa ufugaji wa samaki.',
    heading: 'Faida ya ufugaji wa samaki',
    lead: 'Chagua mojawapo ya nchi 15 ili kutumia aina za samaki, bei, sarafu na gharama zilizohifadhiwa kwa nchi hiyo.',
    artwork: row.artwork.file,
    body: `<style>.card,.country-list a{border-color:#64748b}.country-list a:focus,.country-list a:focus-visible{outline:3px solid #075eb8;outline-offset:3px}html[data-theme="dark"] .card{border-color:#9fb0c7}html[data-theme="dark"] .country-list a:focus,html[data-theme="dark"] .country-list a:focus-visible{outline-color:#75b8ff}@media(prefers-color-scheme:dark){html[data-theme="system"] .card{border-color:#9fb0c7}html[data-theme="system"] .country-list a:focus,html[data-theme="system"] .country-list a:focus-visible{outline-color:#75b8ff}}</style><section class="card"><h2>Chagua nchi</h2><ul class="country-list">${countries.map(item => `<li><a href="${escapeHtml(item.swahili.route)}">${escapeHtml(countryName(item))}</a></li>`).join('')}</ul></section>${trustBlock(row, true)}`,
    scripts: '', pageConfig: { id: row.english.id, aiRouteId: row.english.id },
    hreflangEntries: alternateEntries(row, context.fullMesh),
    familyLabel: 'Ufugaji wa samaki', familyRoute: row.swahili.route, currentLabel: 'Chagua nchi'
  });
}

function render(row, context = {}) {
  if (!row.country) return renderHub(row, context);
  sourceMetadata(row);
  const localizedCountryName = countryName(row);
  const config = {
    id: row.english.id, aiRouteId: row.english.id, countryCode: row.country.code,
    countryName: localizedCountryName, locale: 'sw', species: SPECIES, systems: SYSTEMS,
    densities: DENSITIES, management: MANAGEMENT, targets: TARGETS, feeds: FEEDS, processing: PROCESSING,
    sourceLabel: SOURCE_LABEL, dataReviewed: DATA_REVIEWED, confidence: CONFIDENCE,
    sourceLinks: { fao: FAO_URL, worldFish: WORLDFISH_URL }, storageKey: 'afrotools:sw-agriculture:fish-farming'
  };
  const body = `<style>.fish-app .field input,.fish-app .field select,.fish-app .action{border-color:#64748b}.fish-app :is(a,button,input,select):focus,.fish-app :is(a,button,input,select):focus-visible{outline:3px solid #075eb8;outline-offset:3px}.fish-app .action:disabled{opacity:.55;cursor:not-allowed}html[data-theme="dark"] .fish-app .field input,html[data-theme="dark"] .fish-app .field select,html[data-theme="dark"] .fish-app .action{border-color:#9fb0c7}html[data-theme="dark"] .fish-app :is(a,button,input,select):focus,html[data-theme="dark"] .fish-app :is(a,button,input,select):focus-visible{outline-color:#75b8ff}@media(prefers-color-scheme:dark){html[data-theme="system"] .fish-app .field input,html[data-theme="system"] .fish-app .field select,html[data-theme="system"] .fish-app .action{border-color:#9fb0c7}html[data-theme="system"] .fish-app :is(a,button,input,select):focus,html[data-theme="system"] .fish-app :is(a,button,input,select):focus-visible{outline-color:#75b8ff}}</style><div class="fish-app">
<section class="card"><h2>Weka taarifa za mzunguko wa ufugaji</h2><form id="fishForm" novalidate><div class="grid"><div class="field"><label for="species">Aina ya samaki</label><select id="species"></select></div><div class="field"><label for="system">Mfumo wa ufugaji</label><select id="system">${options(SYSTEMS)}</select></div><div class="field"><label for="area">Eneo au ujazo</label><input id="area" type="number" min="1" max="1000000" step="1" inputmode="decimal" aria-describedby="areaUnit"><small id="areaUnit">m²</small></div><div class="field"><label for="density">Msongamano wa kuweka samaki</label><select id="density">${options(DENSITIES)}</select></div><div class="field"><label for="management">Kiwango cha usimamizi</label><select id="management">${options(MANAGEMENT)}</select></div><div class="field"><label for="target">Ukubwa unaolengwa</label><select id="target">${options(TARGETS)}</select></div><div class="field"><label for="months">Muda wa mzunguko (miezi)</label><input id="months" type="number" min="1" max="24" step="1" inputmode="numeric"></div><div class="field"><label for="cycles">Mizunguko kwa mwaka</label><input id="cycles" type="number" min="1" max="12" step="1" value="1" inputmode="numeric"></div><div class="field"><label for="feed">Aina ya chakula</label><select id="feed">${options(FEEDS)}</select></div><div class="field"><label for="processing">Uuzaji au usindikaji</label><select id="processing">${options(PROCESSING)}</select></div><div class="field"><label for="laborDays">Siku za kazi kwa mzunguko</label><input id="laborDays" type="number" min="0" max="3660" step="1" inputmode="numeric"></div><div class="field"><label for="familyLabor">Sehemu ya kazi ya familia (%)</label><input id="familyLabor" type="number" min="0" max="100" step="1" value="0" inputmode="decimal"></div><div class="field"><label for="infrastructure">Miundombinu iliyopo</label><select id="infrastructure"><option value="no">Haipo</option><option value="yes">Ipo</option></select></div><div class="field"><label for="water">Chanzo cha maji</label><select id="water"><option value="surface">Maji ya juu ya ardhi au mtandao</option><option value="borehole">Kisima kirefu kinahitajika</option></select></div></div><div class="actions"><button class="action primary" type="submit">Kokotoa faida</button><button class="action" type="reset">Weka upya</button></div><p class="error" id="formError" role="alert" aria-live="assertive"></p></form></section>
<section class="card"><h2>Matokeo</h2><div class="empty" id="emptyState">Bado hujakokotoa matokeo.</div><div class="result-panel" id="resultPanel" tabindex="-1" aria-live="polite" hidden><div class="result-hero"><div class="result-value" id="profit">-</div><div id="profitLabel">Matokeo kwa mzunguko</div></div><div class="result-grid"><div class="metric"><strong id="harvest">-</strong><span>Mavuno</span></div><div class="metric"><strong id="cost">-</strong><span>Gharama kwa mzunguko</span></div><div class="metric"><strong id="revenue">-</strong><span>Mapato ghafi</span></div><div class="metric"><strong id="roi">-</strong><span>ROI ya miundombinu</span></div><div class="metric"><strong id="stocked">-</strong><span>Samaki waliowekwa</span></div><div class="metric"><strong id="survival">-</strong><span>Uhai wa samaki</span></div></div><p id="feedSummary"></p><div class="actions"><button class="action" type="button" data-result-action="copy" disabled>Nakili</button><button class="action" type="button" data-result-action="share" disabled>Shiriki</button><button class="action" type="button" data-result-action="save" disabled>Hifadhi kwenye kivinjari</button><button class="action" type="button" data-result-action="pdf" disabled>Pakua PDF</button><button class="action" type="button" data-result-action="csv" disabled>Pakua CSV</button><button class="action" type="button" data-result-action="json" disabled>Pakua JSON</button><button class="action" type="button" data-result-action="txt" disabled>Pakua TXT</button></div><p class="status" id="actionStatus" role="status" aria-live="polite"></p></div></section>${trustBlock(row, false)}</div>`;
  const scripts = `<script src="/data/agriculture/aquaculture-data.js"></script><script src="/engines/aquaculture-roi-engine.js"></script><script src="/assets/vendor/jspdf/jspdf.umd.min.js"></script><script src="/assets/js/pages/sw-agriculture-fish-farming.js"></script>`;
  return renderSwahiliAgriculturePage({
    row, title: `Faida ya ufugaji wa samaki - ${localizedCountryName} | AfroTools`,
    description: `Kadiria samaki, mavuno, gharama, mapato na faida ya mzunguko wa ufugaji wa samaki kwa ${localizedCountryName}.`,
    heading: `Faida ya ufugaji wa samaki - ${localizedCountryName}`,
    lead: `Tumia aina za samaki, bei, sarafu na gharama zilizohifadhiwa kwa ${localizedCountryName}.`,
    artwork: row.artwork.file, body, scripts, pageConfig: config, countryName: localizedCountryName,
    hreflangEntries: alternateEntries(row, context.fullMesh),
    familyLabel: 'Ufugaji wa samaki', familyRoute: '/sw/zana/faida-ya-ufugaji-samaki/'
  });
}

module.exports = {
  id: 'fish-farming', SPECIES, SYSTEMS, DENSITIES, MANAGEMENT, TARGETS, FEEDS, PROCESSING,
  COUNTRY_NAMES, SOURCE_LABEL, DATA_REVIEWED, CONFIDENCE, FAO_URL, WORLDFISH_URL,
  alternateEntries, countryName, decodeHtml, sourceMetadata, renderHub, render
};
