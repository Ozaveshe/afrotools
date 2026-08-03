'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { escapeHtml } = require('../fr-agriculture-page-shell');
const { renderSwahiliAgriculturePage } = require('../sw-agriculture-page-shell');

const ROOT = path.resolve(__dirname, '../../..');
const WORKER_TYPES = Object.freeze({
  permanent: 'Mfanyakazi wa kudumu',
  casual: 'Mfanyakazi wa kibarua cha siku',
  seasonal: 'Mfanyakazi wa msimu',
  piece_rate: 'Mfanyakazi anayelipwa kwa kazi iliyokamilika',
});
const COUNTRY_NAMES = Object.freeze({ MA: 'Moroko', CV: 'Cabo Verde' });
const SOURCE_LABEL = 'Hifadhidata ya ILO NATLEX, matangazo ya wizara ya kazi ya nchi husika na utafiti wa AfroTools (2024).';
const FRESHNESS_LABEL = 'Hazina hii ni picha tuli ya utafiti wa 2024; ukurasa umepitiwa 2026 lakini viwango havijathibitishwa kuwa vya sasa wala vya moja kwa moja.';
const CONFIDENCE_LABEL = 'Uhakika ni wa juu kwa kufuata fomula na hazina ya Kiingereza, lakini ni wa chini kwa uhalali wa viwango na wajibu wa sasa hadi mamlaka au mtaalamu wa nchi athibitishe.';
const RECIPROCAL_HREFLANGS = Object.freeze(['en', 'sw', 'x-default']);

function countryName(row) {
  return COUNTRY_NAMES[row.country.code] || row.country.swahiliName;
}

function englishContract(row) {
  if (!row.country) return null;
  const html = fs.readFileSync(path.join(ROOT, row.english.file), 'utf8');
  const source = html.match(/<p class="sources-footer">([\s\S]*?)<\/p>/i);
  if (!source) throw new Error(`${row.english.file} has no Farm Payroll source footer.`);
  const text = source[1].replace(/<[^>]+>/g, ' ').replace(/&bull;/g, ' ').replace(/\s+/g, ' ').trim();
  for (const required of ['ILO NATLEX', 'national labour ministry gazettes', 'AfroTools research (2024)']) {
    if (!text.includes(required)) throw new Error(`${row.english.file} is missing named source: ${required}.`);
  }
  for (const script of ['/engines/farm-payroll-engine.js', '/data/agriculture/farm-payroll-data.js']) {
    if (!html.includes(script)) throw new Error(`${row.english.file} is missing ${script}.`);
  }
  return { sourceText: text };
}

function options(values) {
  return Object.entries(values).map(([value, label]) => (
    `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`
  )).join('');
}

function trustBlock(row, hub) {
  const localized = row.country ? countryName(row) : null;
  const source = hub
    ? '<a href="https://www.ilo.org/industries-and-sectors/agriculture-plantations-other-rural-sectors" target="_blank" rel="noopener">Rasilimali za kazi ya kilimo za ILO</a> na <a href="https://natlex.ilo.org/" target="_blank" rel="noopener">hifadhidata ya ILO NATLEX</a>.'
    : `<a href="https://natlex.ilo.org/" target="_blank" rel="noopener">Hifadhidata ya ILO NATLEX</a>, matangazo ya wizara ya kazi ya ${escapeHtml(localized)} na utafiti wa AfroTools (2024).`;
  return `<section class="card"><h2>Chanzo, upya na kiwango cha uhakika</h2><div class="trust-grid farm-payroll-trust"><div class="trust-item"><strong>Chanzo</strong><span>${source}</span></div><div class="trust-item"><strong>Upya</strong><span>${escapeHtml(FRESHNESS_LABEL)}</span></div><div class="trust-item"><strong>Kiwango cha uhakika</strong><span>${escapeHtml(CONFIDENCE_LABEL)}</span></div></div><p>Hili ni kadirio la kupanga tu. Thibitisha mshahara wa chini, muda wa kazi, likizo, kodi, pensheni, afya na makato mengine kwa wizara ya kazi, mamlaka ya kodi au mtaalamu wa mishahara kabla ya kulipa au kuwasilisha taarifa.</p><p><strong>Faragha:</strong> ${hub ? 'ukurasa huu ni orodha ya nchi na hauna ingizo la mtumiaji.' : 'hesabu, hifadhi na faili hutengenezwa ndani ya kivinjari; hakuna ingizo la mishahara linalotumwa kwa seva.'}</p><p><strong>AI:</strong> kitambulisho cha njia ni <code>${escapeHtml(row.english.id)}</code>. Msaidizi wa AfroTools ni wa hiari na lazima aombe idhini kabla ya kutuma maudhui kwa modeli.</p></section>`;
}

function renderHub(row, context = {}) {
  const countries = (context.familyRows || []).filter(item => item.country)
    .sort((first, second) => countryName(first).localeCompare(countryName(second), 'sw'));
  if (countries.length !== 54) throw new Error(`Farm Payroll hub requires 54 countries; found ${countries.length}.`);
  return renderSwahiliAgriculturePage({
    row,
    title: 'Mishahara ya wafanyakazi wa shamba kwa nchi | AfroTools',
    description: 'Chagua nchi ili kukadiria malipo ghafi, makato, malipo halisi na gharama ya mwajiri kwa kutumia injini ya mishahara ya shamba.',
    heading: 'Mishahara ya wafanyakazi wa shamba',
    lead: 'Chagua mojawapo ya nchi 54. Kila ukurasa hutumia injini na hazina ileile ya Kiingereza, lakini matokeo ni makadirio ya kupanga tu.',
    artwork: row.artwork.file,
    body: `<style>.farm-payroll-hub .card,.farm-payroll-hub .country-list a{border-color:#64748b}.farm-payroll-hub .country-list a:focus,.farm-payroll-hub .country-list a:focus-visible{outline:3px solid #075eb8;outline-offset:3px}html[data-theme="dark"] .farm-payroll-hub .card,html[data-theme="dark"] .farm-payroll-hub .country-list a{border-color:#9fb0c7}html[data-theme="dark"] .farm-payroll-hub .country-list a:focus,html[data-theme="dark"] .farm-payroll-hub .country-list a:focus-visible{outline-color:#75b8ff}@media(prefers-color-scheme:dark){html[data-theme="system"] .farm-payroll-hub .card,html[data-theme="system"] .farm-payroll-hub .country-list a{border-color:#9fb0c7}html[data-theme="system"] .farm-payroll-hub .country-list a:focus,html[data-theme="system"] .farm-payroll-hub .country-list a:focus-visible{outline-color:#75b8ff}}@media(max-width:360px){.farm-payroll-trust{grid-template-columns:minmax(0,1fr)}.farm-payroll-trust>*{min-width:0;overflow-wrap:anywhere}}</style><div class="farm-payroll-hub"><section class="card"><h2>Chagua nchi</h2><ul class="country-list">${countries.map(item => `<li><a href="${escapeHtml(item.swahili.route)}">${escapeHtml(countryName(item))}</a></li>`).join('')}</ul></section>${trustBlock(row, true)}</div>`,
    scripts: '',
    pageConfig: { id: row.english.id, aiRouteId: row.english.id },
    familyLabel: 'Mishahara ya shamba',
    familyRoute: row.swahili.route,
    currentLabel: 'Chagua nchi',
  });
}

function render(row, context = {}) {
  if (!row.country) return renderHub(row, context);
  englishContract(row);
  const localizedCountryName = countryName(row);
  const config = {
    id: row.english.id,
    aiRouteId: row.english.id,
    countryCode: row.country.code,
    countryName: localizedCountryName,
    locale: 'sw',
    workerTypes: WORKER_TYPES,
    sourceLabel: SOURCE_LABEL,
    freshnessLabel: FRESHNESS_LABEL,
    confidenceLabel: CONFIDENCE_LABEL,
    storageKey: 'afrotools:sw-agriculture:farm-payroll',
  };
  const body = `<style>.farm-payroll-app .field :is(input,select),.farm-payroll-app .action,.farm-payroll-app .data-table,.farm-payroll-app .payroll-deduction-card{border-color:#64748b}.farm-payroll-app :is(a,button,input,select):focus,.farm-payroll-app :is(a,button,input,select):focus-visible{outline:3px solid #075eb8;outline-offset:3px}.farm-payroll-app .action.primary{background:#075eb8;color:#fff;border-color:#075eb8}.farm-payroll-app .action:disabled{opacity:.58;cursor:not-allowed}.payroll-deductions-mobile{display:none;gap:10px}.payroll-deduction-card{border:1px solid;border-radius:10px;padding:14px;min-width:0}.payroll-deduction-card strong,.payroll-deduction-card span{display:block;overflow-wrap:anywhere}.payroll-deduction-card span{color:var(--agri-muted);margin-top:5px}html[data-theme="dark"] .farm-payroll-app .field :is(input,select),html[data-theme="dark"] .farm-payroll-app .action,html[data-theme="dark"] .farm-payroll-app .data-table,html[data-theme="dark"] .farm-payroll-app .payroll-deduction-card{border-color:#9fb0c7}html[data-theme="dark"] .farm-payroll-app :is(a,button,input,select):focus,html[data-theme="dark"] .farm-payroll-app :is(a,button,input,select):focus-visible{outline-color:#75b8ff}@media(prefers-color-scheme:dark){html[data-theme="system"] .farm-payroll-app .field :is(input,select),html[data-theme="system"] .farm-payroll-app .action,html[data-theme="system"] .farm-payroll-app .data-table,html[data-theme="system"] .farm-payroll-app .payroll-deduction-card{border-color:#9fb0c7}html[data-theme="system"] .farm-payroll-app :is(a,button,input,select):focus,html[data-theme="system"] .farm-payroll-app :is(a,button,input,select):focus-visible{outline-color:#75b8ff}}@media(max-width:480px){.payroll-deductions-table{display:none}.payroll-deductions-mobile{display:grid}}@media(max-width:360px){.farm-payroll-trust{grid-template-columns:minmax(0,1fr)}.farm-payroll-trust>*{min-width:0;overflow-wrap:anywhere}}</style><div class="farm-payroll-app">
<section class="card"><h2>Weka taarifa za malipo</h2><form id="payrollForm" novalidate><div class="grid"><div class="field"><label for="workerType">Aina ya mfanyakazi</label><select id="workerType">${options(WORKER_TYPES)}</select></div><div class="field"><label for="numWorkers">Idadi ya wafanyakazi</label><input id="numWorkers" type="number" min="1" max="100000" step="1" value="1" inputmode="numeric"></div><div class="field" id="grossField"><label for="grossPay" id="grossLabel">Mshahara ghafi wa mwezi kwa mfanyakazi</label><input id="grossPay" type="number" min="0" step="0.01" inputmode="decimal"></div><div class="field" id="daysField" hidden><label for="daysWorked">Siku zilizofanywa kazi katika mwezi</label><input id="daysWorked" type="number" min="1" max="31" step="1" value="26" inputmode="numeric"></div><div class="field" id="rateField" hidden><label for="ratePerUnit">Malipo kwa kazi au kipimo kimoja</label><input id="ratePerUnit" type="number" min="0" step="0.01" inputmode="decimal"></div><div class="field" id="unitsField" hidden><label for="unitsCompleted">Idadi ya kazi au vipimo vilivyokamilika</label><input id="unitsCompleted" type="number" min="1" max="1000000" step="1" value="80" inputmode="numeric"></div><div class="field"><label for="overtimeHours">Saa za ziada katika mwezi</label><input id="overtimeHours" type="number" min="0" max="744" step="0.5" value="0" inputmode="decimal"></div><div class="field"><label for="inKindHousing">Thamani ya nyumba iliyotolewa kwa mwezi</label><input id="inKindHousing" type="number" min="0" step="0.01" value="0" inputmode="decimal"></div><div class="field"><label for="inKindFood">Thamani ya chakula kilichotolewa kwa mwezi</label><input id="inKindFood" type="number" min="0" step="0.01" value="0" inputmode="decimal"></div></div><div class="actions"><button class="action primary" type="submit">Kokotoa mishahara</button><button class="action" type="reset">Weka upya</button></div><p class="error" id="formError" role="alert" aria-live="assertive"></p></form></section>
<section class="card"><h2>Matokeo</h2><div class="empty" id="emptyState">Bado hujakokotoa kadirio la mishahara.</div><div id="resultPanel" class="result-panel" tabindex="-1" aria-live="polite" hidden><div class="result-hero"><div class="result-value" id="netPay">?</div><div>Malipo halisi yaliyokadiriwa kwa mfanyakazi</div></div><div class="result-grid"><div class="metric"><strong id="gross">?</strong><span>Malipo ghafi yanayokatwa</span></div><div class="metric"><strong id="deductions">?</strong><span>Jumla ya makato ya mfanyakazi</span></div><div class="metric"><strong id="employerCost">?</strong><span>Gharama ya mwajiri kwa mfanyakazi</span></div><div class="metric"><strong id="farmMonthly">?</strong><span>Gharama ya shamba kwa mwezi</span></div><div class="metric"><strong id="farmAnnual">?</strong><span>Gharama ya shamba kwa mwaka</span></div><div class="metric"><strong id="minimumStatus">?</strong><span>Ulinganisho wa kima cha chini</span></div></div><h3>Makato na michango</h3><div class="table-wrap payroll-deductions-table"><table class="data-table" id="deductionTable"></table></div><div id="deductionCards" class="payroll-deductions-mobile" aria-label="Makato na michango"></div><h3>Marejeo ya sheria ya kazi</h3><ul id="lawList"></ul><p id="taxStatus"></p><div class="actions"><button class="action" type="button" data-result-action="copy" disabled>Nakili</button><button class="action" type="button" data-result-action="share" disabled>Shiriki</button><button class="action" type="button" data-result-action="save" disabled>Hifadhi kwenye kivinjari</button><button class="action" type="button" data-result-action="pdf" disabled>Pakua PDF</button><button class="action" type="button" data-result-action="csv" disabled>Pakua CSV</button><button class="action" type="button" data-result-action="json" disabled>Pakua JSON</button><button class="action" type="button" data-result-action="txt" disabled>Pakua TXT</button></div><p class="status" id="actionStatus" role="status" aria-live="polite"></p></div></section>${trustBlock(row, false)}</div>`;
  const scripts = '<script src="/data/agriculture/farm-payroll-data.js"></script><script src="/engines/farm-payroll-engine.js"></script><script src="/assets/vendor/jspdf/jspdf.umd.min.js"></script><script src="/assets/js/pages/sw-agriculture-farm-payroll.js"></script>';
  return renderSwahiliAgriculturePage({
    row,
    title: `Mishahara ya wafanyakazi wa shamba - ${localizedCountryName} | AfroTools`,
    description: `Kadiria malipo ghafi, makato, malipo halisi na gharama ya mwajiri wa shamba nchini ${localizedCountryName} kwa kutumia hazina tuli ya nchi.`,
    heading: `Mishahara ya shamba - ${localizedCountryName}`,
    lead: `Kokotoa gharama ya mfanyakazi na timu kwa sarafu na vigezo vilivyohifadhiwa vya ${localizedCountryName}. Thibitisha viwango vya sasa kabla ya kulipa.`,
    artwork: row.artwork.file,
    body,
    scripts,
    pageConfig: config,
    countryName: localizedCountryName,
    familyLabel: 'Mishahara ya shamba',
    familyRoute: '/sw/zana/mishahara-ya-wafanyakazi-wa-shamba/',
  });
}

module.exports = {
  id: 'farm-payroll',
  reciprocalHreflangs: RECIPROCAL_HREFLANGS,
  CONFIDENCE_LABEL,
  COUNTRY_NAMES,
  FRESHNESS_LABEL,
  SOURCE_LABEL,
  WORKER_TYPES,
  countryName,
  englishContract,
  render,
  renderHub,
};
