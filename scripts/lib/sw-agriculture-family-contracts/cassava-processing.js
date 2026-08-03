'use strict';

const { escapeHtml } = require('../fr-agriculture-page-shell');
const { renderSwahiliAgriculturePage } = require('../sw-agriculture-page-shell');

const PATHWAYS = Object.freeze({
  garri: 'Garri (chembe za mihogo zilizochachushwa na kukaangwa)',
  fufu_flour: 'Unga wa fufu au unga wa mihogo',
  hqcf: 'Unga bora wa mihogo (HQCF)',
  cassava_chips: 'Vipande vya mihogo vilivyokaushwa',
  cassava_starch: 'Wanga wa mihogo',
});
const LEVELS = Object.freeze({
  manual: 'Kazi nyingi kwa mikono',
  semi_mechanized: 'Baadhi ya kazi kwa mashine',
  mechanized: 'Kazi nyingi kwa mashine',
});
const PRICE_KEYS = Object.freeze({
  garri: 'garri_per_kg',
  fufu_flour: 'fufu_flour_per_kg',
  hqcf: 'hqcf_per_kg',
  cassava_chips: 'cassava_chips_per_kg',
  cassava_starch: 'cassava_starch_per_kg',
});

function optionList(values) {
  return Object.entries(values)
    .map(([value, label]) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`)
    .join('');
}

function renderHub(row, context = {}) {
  const countries = (context.familyRows || [])
    .filter((item) => item.country)
    .sort((a, b) => a.country.swahiliName.localeCompare(b.country.swahiliName, 'sw'));
  if (countries.length !== 15) {
    throw new Error(`Cassava Processing hub requires 15 manifest countries; found ${countries.length}.`);
  }
  return renderSwahiliAgriculturePage({
    row,
    title: 'Faida ya usindikaji wa mihogo kwa nchi | AfroTools',
    description: 'Chagua nchi na ukadirie gharama, mazao ya usindikaji na faida ya bidhaa za mihogo kwa data ya nchi iliyohifadhiwa.',
    heading: 'Faida ya usindikaji wa mihogo',
    lead: 'Chagua mojawapo ya nchi 15 ili kulinganisha garri, unga, vipande na wanga kwa sarafu na gharama za nchi hiyo.',
    artwork: row.artwork.file,
    body: `<style>
.card{border-color:#64748b}
.country-list a:focus-visible{outline:3px solid #075eb8;outline-offset:3px}
html[data-theme="dark"] .card{border-color:#9fb0c7}
html[data-theme="dark"] .country-list a:focus-visible{outline-color:#75b8ff}
@media(prefers-color-scheme:dark){html[data-theme="system"] .card{border-color:#9fb0c7}html[data-theme="system"] .country-list a:focus-visible{outline-color:#75b8ff}}
</style><section class="card"><h2>Chagua nchi</h2><ul class="country-list">${countries.map((item) => (
      `<li><a href="${escapeHtml(item.swahili.route)}">${escapeHtml(item.country.swahiliName)}</a></li>`
    )).join('')}</ul></section>
<section class="card"><h2>Chanzo, upya na kiwango cha uhakika</h2><p>Kila ukurasa wa nchi hutumia injini ileile ya Kiingereza isiyotegemea ukurasa, pamoja na bei, sarafu na gharama zilizohifadhiwa kwa nchi hiyo. Badilisha bei kwa taarifa zako za eneo.</p><div class="trust-grid"><div class="trust-item"><strong>Chanzo</strong><span>FAO, ripoti za IITA kuhusu mihogo baada ya mavuno, na tafiti za masoko ya kikanda</span></div><div class="trust-item"><strong>Upya</strong><span>marejeo ya bei ya 2024–2025; si data ya moja kwa moja.</span></div><div class="trust-item"><strong>Kiwango cha uhakika</strong><span>Makadirio ya kupanga; bei, kiwango cha ubadilishaji, vifaa, maji, nishati na soko hubadilisha matokeo.</span></div></div><p><strong>Faragha:</strong> ukurasa huu ni orodha ya nchi; haufanyi hesabu, hauhifadhi ingizo wala kutuma data kwa mtandao.</p><p><strong>AI:</strong> kitambulisho cha njia ni <code>${escapeHtml(row.english.id)}</code>. Msaidizi wa AfroTools ni wa hiari na lazima aombe idhini kabla ya kutuma maudhui kwa modeli.</p></section>`,
    scripts: '',
    pageConfig: { id: row.english.id, aiRouteId: row.english.id },
    familyLabel: 'Usindikaji wa mihogo',
    familyRoute: row.swahili.route,
    currentLabel: 'Chagua nchi',
  });
}

function render(row, context = {}) {
  if (!row.country) return renderHub(row, context);
  const countryName = row.country.swahiliName;
  const config = {
    id: row.english.id,
    countryCode: row.country.code,
    countryName,
    locale: 'sw',
    pathways: PATHWAYS,
    levels: LEVELS,
    priceKeys: PRICE_KEYS,
    sourceLabel: 'FAO, ripoti za IITA kuhusu mihogo baada ya mavuno, na tafiti za masoko ya kikanda',
    dataReviewed: 'marejeo ya bei ya 2024–2025',
    storageKey: 'afrotools:sw-agriculture:cassava-processing',
    aiRouteId: row.english.id,
  };
  const body = `<style>
.cassava-app .field input,.cassava-app .field select,.cassava-app .action{border-color:#64748b}
.cassava-app :is(a,button,input,select):focus-visible{outline:3px solid #075eb8;outline-offset:3px}
html[data-theme="dark"] .cassava-app .field input,html[data-theme="dark"] .cassava-app .field select,html[data-theme="dark"] .cassava-app .action{border-color:#9fb0c7}
html[data-theme="dark"] .cassava-app :is(a,button,input,select):focus-visible{outline-color:#75b8ff}
@media(prefers-color-scheme:dark){html[data-theme="system"] .cassava-app .field input,html[data-theme="system"] .cassava-app .field select,html[data-theme="system"] .cassava-app .action{border-color:#9fb0c7}html[data-theme="system"] .cassava-app :is(a,button,input,select):focus-visible{outline-color:#75b8ff}}
</style>
<div class="cassava-app">
<section class="card"><h2>Panga kundi la usindikaji</h2><form id="cassavaForm" novalidate><div class="grid">
<div class="field"><label for="pathway">Bidhaa ya kutengeneza</label><select id="pathway">${optionList(PATHWAYS)}</select><small id="pathwayHelp"></small></div>
<div class="field"><label for="rawTonnes">Mihogo mibichi kwa kundi (tani)</label><input id="rawTonnes" type="number" min="0.1" max="1000" step="0.1" value="1" inputmode="decimal"></div>
<div class="field"><label for="batches">Makundi kwa mwezi</label><input id="batches" type="number" min="1" max="100" step="1" value="4" inputmode="numeric"></div>
<div class="field"><label for="level">Kiwango cha usindikaji</label><select id="level">${optionList(LEVELS)}</select></div>
<div class="field"><label for="rawPrice">Bei ya mihogo mibichi kwa tani</label><input id="rawPrice" type="number" min="0.01" step="0.01" inputmode="decimal"></div>
<div class="field"><label for="sellingPrice">Bei ya kuuza bidhaa kwa kilo</label><input id="sellingPrice" type="number" min="0.01" step="0.01" inputmode="decimal"></div>
<div class="field"><label for="laborRate">Gharama ya kazi kwa siku</label><input id="laborRate" type="number" min="0.01" step="0.01" inputmode="decimal"></div>
<div class="field"><label for="transport">Jumuisha usafiri</label><select id="transport"><option value="no">Hapana</option><option value="yes">Ndiyo</option></select></div>
<div class="field"><label for="distance">Umbali wa usafiri (km)</label><input id="distance" type="number" min="0" max="5000" step="1" value="0" inputmode="numeric"></div>
</div><div class="actions"><button class="action primary" type="submit">Kokotoa faida</button><button class="action" type="reset">Weka upya</button></div><p class="error" id="formError" role="alert" aria-live="assertive"></p></form></section>
<section class="card"><h2>Matokeo</h2><div class="empty" id="emptyState">Bado hujafanya hesabu.</div><div class="result-panel" id="resultPanel" tabindex="-1" aria-live="polite" hidden><div class="result-hero"><div class="result-value" id="profit">—</div><div id="profitLabel">Faida kwa kundi</div></div><div class="result-grid"><div class="metric"><strong id="output">—</strong><span>Bidhaa iliyopatikana</span></div><div class="metric"><strong id="cost">—</strong><span>Gharama zote</span></div><div class="metric"><strong id="revenue">—</strong><span>Mapato</span></div><div class="metric"><strong id="margin">—</strong><span>Ukingo wa faida</span></div><div class="metric"><strong id="monthly">—</strong><span>Faida kwa mwezi</span></div><div class="metric"><strong id="annual">—</strong><span>Faida kwa mwaka</span></div></div><p id="comparison"></p><div class="actions"><button class="action" type="button" data-result-action="copy" disabled>Nakili</button><button class="action" type="button" data-result-action="share" disabled>Shiriki</button><button class="action" type="button" data-result-action="save" disabled>Hifadhi kwenye kivinjari</button><button class="action" type="button" data-result-action="pdf" disabled>Pakua PDF</button><button class="action" type="button" data-result-action="csv" disabled>Pakua CSV</button><button class="action" type="button" data-result-action="json" disabled>Pakua JSON</button><button class="action" type="button" data-result-action="txt" disabled>Pakua TXT</button></div><p class="status" id="actionStatus" role="status" aria-live="polite"></p></div></section>
<section class="card"><h2>Chanzo, upya na kiwango cha uhakika</h2><div class="trust-grid"><div class="trust-item"><strong>Chanzo</strong><span>${escapeHtml(config.sourceLabel)}</span></div><div class="trust-item"><strong>Upya</strong><span>${escapeHtml(config.dataReviewed)}; si data ya moja kwa moja.</span></div><div class="trust-item"><strong>Kiwango cha uhakika</strong><span>Makadirio ya kupanga; bei, kiwango cha ubadilishaji, vifaa, maji, nishati na soko hubadilisha matokeo.</span></div></div><p>Mihogo mibichi huharibika haraka baada ya kuvunwa. Thibitisha masharti ya usalama wa chakula, hasa hatua za kupunguza misombo ya sianidi, na mtaalamu au mamlaka ya eneo lako.</p><p><strong>Faragha:</strong> hesabu, nakala na faili hutengenezwa kwenye kivinjari hiki. Hakuna ingizo linalotumwa kwa seva. Kitufe cha kushiriki hutumia kidirisha cha mfumo kwa kitendo chako au kunakili kwenye ubao wa kunakili.</p><p><strong>AI:</strong> kitambulisho cha njia ni <code>${escapeHtml(row.english.id)}</code>. Msaidizi wa AfroTools ni wa hiari na lazima aombe idhini kabla ya kutuma maudhui kwa modeli.</p></section>
</div>`;
  const scripts = `<script src="/data/agriculture/cassava-processing-data.js"></script>
<script src="/engines/cassava-processing-engine.js"></script>
<script src="/assets/vendor/jspdf/jspdf.umd.min.js"></script>
<script src="/assets/js/pages/sw-agriculture-cassava-processing.js"></script>`;
  return renderSwahiliAgriculturePage({
    row,
    title: `Faida ya usindikaji wa mihogo — ${countryName} | AfroTools`,
    description: `Kadiria gharama, bidhaa, mapato na faida ya usindikaji wa mihogo nchini ${countryName} kwa sarafu na rejea za nchi hiyo.`,
    heading: `Usindikaji wa mihogo — ${countryName}`,
    lead: `Linganisha mikondo ya usindikaji kwa bei, sarafu na gharama zilizohifadhiwa kwa ${countryName}, kisha badilisha makadirio kwa hali yako.`,
    artwork: row.artwork.file,
    body,
    scripts,
    pageConfig: config,
    familyLabel: 'Usindikaji wa mihogo',
    familyRoute: '/sw/zana/faida-ya-usindikaji-mihogo/',
  });
}

module.exports = { id: 'cassava-processing', LEVELS, PATHWAYS, PRICE_KEYS, render, renderHub };
