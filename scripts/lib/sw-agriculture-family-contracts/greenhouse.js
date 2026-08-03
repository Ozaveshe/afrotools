'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { escapeHtml } = require('../fr-agriculture-page-shell');
const { renderSwahiliAgriculturePage } = require('../sw-agriculture-page-shell');

const ROOT = path.resolve(__dirname, '../../..');
const TYPES = Object.freeze({
  wooden_polythene: 'Fremu ya mbao na plastiki ya polythene',
  steel_polythene: 'Chuma cha mabati na plastiki ya polythene',
  shade_house: 'Nyumba ya wavu wa kivuli',
  steel_polycarbonate: 'Chuma na paneli za polycarbonate',
  hydroponic_tunnel: 'Handaki la hydroponiki'
});
const CROPS = Object.freeze({
  tomato: 'Nyanya', capsicum: 'Pilipili hoho', cucumber: 'Tango',
  lettuce: 'Lettuce na mboga za majani', herbs: 'Mimea ya viungo', strawberry: 'Stroberi'
});
const WATER = Object.freeze({
  surface: 'Maji ya juu ya ardhi au mtandao', borehole: 'Kisima kirefu', rain: 'Maji ya mvua yaliyokusanywa'
});
const COUNTRY_NAMES = Object.freeze({ MA: 'Moroko' });
const FAOSTAT_URL = 'https://www.fao.org/faostat/en/#data/QCL';
const CONFIDENCE = 'Makadirio ya kupanga yenye uhakika wa kati; gharama, mavuno, mizunguko na bei halisi zinaweza kutofautiana.';

function decodeHtml(value) {
  return String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&ndash;|&#8211;/g, '–').replace(/&mdash;|&#8212;/g, '—')
    .replace(/&nbsp;|&#160;/g, ' ').replace(/\s+/g, ' ').trim();
}

function sourceMetadata(row) {
  const html = fs.readFileSync(path.join(ROOT, row.english.file), 'utf8');
  const block = html.match(/<p class="sources-footer">([\s\S]*?)<\/p>/i);
  if (!block) throw new Error(`${row.english.file} has no complete greenhouse source footer.`);
  const complete = decodeHtml(block[1]);
  const label = complete
    .replace(/^Data sources:\s*/i, '')
    .replace(/\.\s*All prices[\s\S]*$/i, '')
    .replace(/\.\s*For planning purposes[\s\S]*$/i, '')
    .trim();
  if (!label || !/FAOSTAT/i.test(label)) throw new Error(`${row.english.file} has an incomplete greenhouse source list.`);
  const years = Array.from(new Set((complete.match(/20\d{2}(?:[–-]\d{2,4})?/g) || []).map(value => value.replace('-', '–'))));
  return {
    source: label,
    complete,
    dataReviewed: years.length ? years.join(' na ') : 'rejea tuli ya ukurasa wa Kiingereza'
  };
}

function countryName(row) {
  return COUNTRY_NAMES[row.country.code] || row.country.swahiliName;
}

function options(values) {
  return Object.entries(values).map(([value, label]) => (
    `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`
  )).join('');
}

function trustBlock(row, source, hub) {
  const name = row.country ? countryName(row) : 'nchi 15 zinazopatikana';
  const sourceText = hub
    ? `FAOSTAT, CGIAR, KALRO, bodi za kitaifa za bustani na bei za wasambazaji zilizotajwa kwenye kurasa za ${name}.`
    : `Marejeo yaliyotajwa kwa ${name}: ${source.source}.`;
  const freshness = hub
    ? 'Ukurasa wa msingi wa Kiingereza ulipitiwa 2026; data za nchi zina marejeo ya 2023–2024 au 2024 na si data ya moja kwa moja.'
    : `Marejeo yaliyotajwa yana mwaka ${source.dataReviewed}; data ni tuli na si ya moja kwa moja.`;
  return `<section class="card"><h2>Chanzo, upya na kiwango cha uhakika</h2><div class="trust-grid"><div class="trust-item"><strong>Vyanzo vilivyotajwa</strong><span>${escapeHtml(sourceText)} <a href="${FAOSTAT_URL}" target="_blank" rel="noopener">FAOSTAT — bidhaa za mazao na mifugo</a>.</span></div><div class="trust-item"><strong>Upya</strong><span>${escapeHtml(freshness)}</span></div><div class="trust-item"><strong>Kiwango cha uhakika</strong><span>${CONFIDENCE}</span></div></div><p>Haya si makadirio rasmi wala ahadi ya faida. Thibitisha vipimo, maji, umeme, kazi, usafirishaji, bei na masoko na mtaalamu au msambazaji wa eneo lako.</p><p><strong>Faragha:</strong> ${hub ? 'ukurasa huu ni orodha tu na haukusanyi ingizo.' : 'hesabu na faili hutengenezwa kwenye kivinjari hiki; hakuna ingizo linalotumwa kwa seva.'}</p><p><strong>AI:</strong> kitambulisho cha njia ni <code>${escapeHtml(row.english.id)}</code>. Msaidizi wa AfroTools ni wa hiari na lazima aombe idhini kabla ya kutuma maudhui kwa modeli.</p></section>`;
}

function renderHub(row, context = {}) {
  const countries = (context.familyRows || []).filter(item => item.country)
    .sort((a, b) => countryName(a).localeCompare(countryName(b), 'sw'));
  if (countries.length !== 15) throw new Error(`Greenhouse hub requires 15 manifest countries; found ${countries.length}.`);
  return renderSwahiliAgriculturePage({
    row,
    title: 'Gharama na faida ya greenhouse kwa nchi | AfroTools',
    description: 'Chagua nchi ili kukadiria gharama za kuanzisha na kuendesha greenhouse, mavuno, mapato na faida kwa data ya nchi hiyo.',
    heading: 'Gharama na faida ya greenhouse',
    lead: 'Chagua mojawapo ya nchi 15 ili kutumia aina za greenhouse, mazao, bei, mavuno na sarafu zilizohifadhiwa kwa nchi hiyo.',
    artwork: row.artwork.file,
    body: `<style>.card,.country-list a{border-color:#64748b}.country-list a:focus,.country-list a:focus-visible{outline:3px solid #075eb8;outline-offset:3px}html[data-theme="dark"] .card{border-color:#9fb0c7}html[data-theme="dark"] .country-list a:focus,html[data-theme="dark"] .country-list a:focus-visible{outline-color:#75b8ff}@media(prefers-color-scheme:dark){html[data-theme="system"] .card{border-color:#9fb0c7}html[data-theme="system"] .country-list a:focus,html[data-theme="system"] .country-list a:focus-visible{outline-color:#75b8ff}}</style><section class="card"><h2>Chagua nchi</h2><ul class="country-list">${countries.map(item => `<li><a href="${escapeHtml(item.swahili.route)}">${escapeHtml(countryName(item))}</a></li>`).join('')}</ul></section>${trustBlock(row, null, true)}`,
    scripts: '', pageConfig: { id: row.english.id, aiRouteId: row.english.id },
    familyLabel: 'Greenhouse', familyRoute: row.swahili.route, currentLabel: 'Chagua nchi'
  });
}

function render(row, context = {}) {
  if (!row.country) return renderHub(row, context);
  const source = sourceMetadata(row);
  const localizedCountryName = countryName(row);
  const config = {
    id: row.english.id, aiRouteId: row.english.id, countryCode: row.country.code,
    countryName: localizedCountryName, locale: 'sw', types: TYPES, crops: CROPS, water: WATER,
    sourceLabel: source.source, sourceHref: FAOSTAT_URL, dataReviewed: source.dataReviewed,
    confidence: CONFIDENCE, storageKey: 'afrotools:sw-agriculture:greenhouse'
  };
  const body = `<style>.greenhouse-app .field input,.greenhouse-app .field select,.greenhouse-app .action{border-color:#64748b}.greenhouse-app :is(a,button,input,select):focus,.greenhouse-app :is(a,button,input,select):focus-visible{outline:3px solid #075eb8;outline-offset:3px}.greenhouse-app .action:disabled{opacity:.55;cursor:not-allowed}html[data-theme="dark"] .greenhouse-app .field input,html[data-theme="dark"] .greenhouse-app .field select,html[data-theme="dark"] .greenhouse-app .action{border-color:#9fb0c7}html[data-theme="dark"] .greenhouse-app :is(a,button,input,select):focus,html[data-theme="dark"] .greenhouse-app :is(a,button,input,select):focus-visible{outline-color:#75b8ff}@media(prefers-color-scheme:dark){html[data-theme="system"] .greenhouse-app .field input,html[data-theme="system"] .greenhouse-app .field select,html[data-theme="system"] .greenhouse-app .action{border-color:#9fb0c7}html[data-theme="system"] .greenhouse-app :is(a,button,input,select):focus,html[data-theme="system"] .greenhouse-app :is(a,button,input,select):focus-visible{outline-color:#75b8ff}}</style><div class="greenhouse-app">
<section class="card"><h2>Weka taarifa za greenhouse</h2><form id="greenhouseForm" novalidate><div class="grid"><div class="field"><label for="type">Aina ya greenhouse</label><select id="type">${options(TYPES)}</select></div><div class="field"><label for="area">Eneo (m²)</label><input id="area" type="number" min="10" max="1000000" step="10" value="500" inputmode="decimal"></div><div class="field"><label for="crop">Zao</label><select id="crop"></select></div><div class="field"><label for="cycles">Mizunguko kwa mwaka</label><input id="cycles" type="number" min="1" max="12" step="1" value="2" inputmode="numeric"></div><div class="field"><label for="water">Chanzo cha maji</label><select id="water">${options(WATER)}</select></div><div class="field"><label for="setup">Hali ya ujenzi</label><select id="setup"><option value="new">Ujenzi mpya</option><option value="existing">Muundo uliopo</option></select></div></div><div class="actions"><button class="action primary" type="submit">Kokotoa gharama na faida</button><button class="action" type="reset">Weka upya</button></div><p class="error" id="formError" role="alert" aria-live="assertive"></p></form></section>
<section class="card"><h2>Matokeo</h2><div class="empty" id="emptyState">Bado hujakokotoa matokeo.</div><div class="result-panel" id="resultPanel" tabindex="-1" aria-live="polite" hidden><div class="result-hero"><div class="result-value" id="profit">-</div><div>Faida halisi ya mwaka kwa bei ya kati</div></div><div class="result-grid"><div class="metric"><strong id="setupCost">-</strong><span>Gharama za kuanzisha</span></div><div class="metric"><strong id="running">-</strong><span>Gharama za mwaka</span></div><div class="metric"><strong id="yield">-</strong><span>Mavuno ya mwaka</span></div><div class="metric"><strong id="revenue">-</strong><span>Mapato ya kati</span></div><div class="metric"><strong id="roi">-</strong><span>Faida kwa uwekezaji</span></div><div class="metric"><strong id="payback">-</strong><span>Muda wa kurejesha gharama</span></div></div><p id="scenarios"></p><div class="actions"><button class="action" type="button" data-result-action="copy" disabled>Nakili</button><button class="action" type="button" data-result-action="share" disabled>Shiriki</button><button class="action" type="button" data-result-action="save" disabled>Hifadhi kwenye kivinjari</button><button class="action" type="button" data-result-action="pdf" disabled>Pakua PDF</button><button class="action" type="button" data-result-action="csv" disabled>Pakua CSV</button><button class="action" type="button" data-result-action="json" disabled>Pakua JSON</button><button class="action" type="button" data-result-action="txt" disabled>Pakua TXT</button></div><p class="status" id="actionStatus" role="status" aria-live="polite"></p></div></section>${trustBlock(row, source, false)}</div>`;
  const scripts = `<script src="/data/agriculture/greenhouse-data.js"></script><script src="/engines/greenhouse-engine.js"></script><script src="/assets/vendor/jspdf/jspdf.umd.min.js"></script><script src="/assets/js/pages/sw-agriculture-greenhouse.js"></script>`;
  return renderSwahiliAgriculturePage({
    row, title: `Gharama na faida ya greenhouse - ${localizedCountryName} | AfroTools`,
    description: `Kadiria gharama, mavuno, mapato na faida ya greenhouse kwa data na sarafu zilizohifadhiwa kwa ${localizedCountryName}.`,
    heading: `Gharama ya greenhouse - ${localizedCountryName}`,
    lead: `Tumia aina za greenhouse, mazao, bei, mavuno na sarafu zilizohifadhiwa kwa ${localizedCountryName}.`,
    artwork: row.artwork.file, body, scripts, pageConfig: config, countryName: localizedCountryName,
    familyLabel: 'Greenhouse', familyRoute: '/sw/zana/gharama-za-greenhouse/'
  });
}

module.exports = {
  id: 'greenhouse', TYPES, CROPS, WATER, COUNTRY_NAMES, FAOSTAT_URL, CONFIDENCE,
  countryName, decodeHtml, sourceMetadata, render, renderHub
};
